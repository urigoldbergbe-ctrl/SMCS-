import pino from "pino";
import { decideDispatch, runSafeguardReroute } from "@scms/dispatch";
import { createClient } from "@supabase/supabase-js";
import type { CourierSnapshot, DispatchConfig, StrategicOrder } from "@scms/shared";

const logger = pino({ name: "dispatch-worker" });

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const supabase = createClient(readEnv("SUPABASE_URL"), readEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false }
});

const defaultConfig: DispatchConfig = {
  city: "beer_sheva",
  strategicTracks: ["A1", "A2", "B"],
  checks: { checkTrackEligibility: true, checkPartnerActive: true, checkAajlThreshold: true },
  weights: { proximity: 0.5, workload: 0.35, priority: 0.15, history: 0 },
  thresholds: {
    aajlThreshold: 3,
    workloadMaxActiveOrders: 2,
    workloadMaxEtaMinutes: 25,
    proximityMaxEtaMinutes: 15,
    safeguardTimeoutSeconds: 60,
    maxPulledOrders: 2,
    maxPtodMinutes: 60,
    noProgressAlertMinutes: 20
  }
};

function mergeConfigRows(city: string, rows: Array<{ config_key: string; config_value: unknown }>): DispatchConfig {
  const config: DispatchConfig = { ...defaultConfig, city };
  for (const row of rows) {
    if (row.config_key === "strategicTracks" && Array.isArray(row.config_value)) {
      config.strategicTracks = row.config_value as string[];
      continue;
    }
    if (row.config_key === "checks" && typeof row.config_value === "object" && row.config_value) {
      config.checks = { ...config.checks, ...(row.config_value as DispatchConfig["checks"]) };
      continue;
    }
    if (row.config_key === "weights" && typeof row.config_value === "object" && row.config_value) {
      config.weights = { ...config.weights, ...(row.config_value as DispatchConfig["weights"]) };
      continue;
    }
    if (row.config_key === "thresholds" && typeof row.config_value === "object" && row.config_value) {
      config.thresholds = { ...config.thresholds, ...(row.config_value as DispatchConfig["thresholds"]) };
    }
  }
  return config;
}

async function getMode(): Promise<"integrated" | "standalone" | "simulation"> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "operation_mode").maybeSingle();
  return ((data?.value as string) ?? "integrated") as "integrated" | "standalone" | "simulation";
}

async function getDispatchConfig(city: string): Promise<DispatchConfig> {
  const { data, error } = await supabase
    .from("dispatch_config")
    .select("config_key, config_value")
    .eq("city", city);
  if (error || !data || data.length === 0) return { ...defaultConfig, city };
  return mergeConfigRows(city, data);
}

async function getCouriers(city: string): Promise<CourierSnapshot[]> {
  const { data: couriers, error } = await supabase
    .from("couriers")
    .select("id, city, assigned_restaurant_ids, status, created_at")
    .eq("city", city)
    .eq("is_active", true);
  if (error || !couriers) return [];

  const snapshots: CourierSnapshot[] = [];
  for (const courier of couriers) {
    const { count: activeOrders } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("courier_id", courier.id)
      .is("delivery_time", null)
      .eq("cancellation_flag", false);

    snapshots.push({
      courierId: courier.id,
      city: courier.city,
      assignedRestaurantIds: courier.assigned_restaurant_ids ?? [],
      activeOrders: activeOrders ?? 0,
      estimatedBusyMinutes: (activeOrders ?? 0) * 10,
      etaToRestaurantMinutes: 8,
      lastAssignedAt: null,
      seniorityDays: Math.max(1, Math.floor((Date.now() - new Date(courier.created_at).getTime()) / 86_400_000)),
      online: courier.status !== "offline"
    });
  }
  return snapshots;
}

async function getPendingManualOrder(city: string): Promise<StrategicOrder | null> {
  const { data, error } = await supabase
    .from("manual_orders")
    .select("id, created_at")
    .eq("status", "pending_dispatch")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    orderId: data.id,
    restaurantId: "00000000-0000-0000-0000-000000000000",
    city,
    track: "A1",
    aajl: null,
    orderSource: "manual",
    createdAt: data.created_at
  };
}

async function enqueueOutbox(endpoint: string, payload: Record<string, unknown>): Promise<void> {
  await supabase.from("integration_outbox").insert({
    endpoint,
    payload,
    status: "pending",
    attempts: 0,
    created_at: new Date().toISOString()
  });
}

async function flushOutbox(): Promise<void> {
  const { data, error } = await supabase
    .from("integration_outbox")
    .select("id, endpoint, payload, attempts")
    .eq("status", "pending")
    .limit(20);
  if (error || !data) return;

  for (const row of data) {
    try {
      // TODO: call TENBIS endpoint with row.endpoint and row.payload
      await supabase
        .from("integration_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (err) {
      const attempts = (row.attempts ?? 0) + 1;
      await supabase
        .from("integration_outbox")
        .update({
          status: attempts >= 3 ? "failed" : "pending",
          attempts,
          last_error: err instanceof Error ? err.message : "unknown error",
          next_retry_at: new Date(Date.now() + 2 ** attempts * 15_000).toISOString()
        })
        .eq("id", row.id);
    }
  }
}

async function runDispatchCycle(): Promise<void> {
  const city = "beer_sheva";
  const mode = await getMode();
  const order = await getPendingManualOrder(city);
  if (!order) {
    await flushOutbox();
    logger.info({ mode }, "No pending orders");
    return;
  }

  const config = await getDispatchConfig(city);
  const couriers = await getCouriers(city);
  const decision = decideDispatch(order, {
    mode,
    config,
    partnerActive: true,
    restaurantPriority: 3,
    couriers
  });

  if (decision.action === "assign_strategic" && decision.selectedCourierId) {
    await supabase.from("manual_orders").update({ status: "assigned" }).eq("id", order.orderId);
    await enqueueOutbox("/orders/assigned", {
      orderId: order.orderId,
      courierId: decision.selectedCourierId
    });
  } else {
    await supabase.from("manual_orders").update({ status: "assigned" }).eq("id", order.orderId);
    await enqueueOutbox("/orders/routed-delco", {
      orderId: order.orderId,
      reason: decision.reason
    });
  }

  const safeguard = runSafeguardReroute({
    config,
    nowIso: new Date().toISOString(),
    order,
    candidateCouriers: couriers,
    lastLocationAtIso: new Date(Date.now() - 70_000).toISOString()
  });

  for (const event of safeguard.auditEvents) {
    await supabase.from("audit_log").insert({
      event_type: event.eventType,
      entity_type: event.entityType,
      entity_id: event.entityId,
      actor: event.actor,
      payload: event.payload,
      created_at: event.createdAt
    });
  }

  await flushOutbox();

  logger.info({ orderId: order.orderId, decision, safeguard }, "Dispatch cycle completed");
}

void (async () => {
  logger.info("Dispatch worker connected to Supabase");
  await runDispatchCycle();
  setInterval(() => {
    void runDispatchCycle().catch((error) => {
      logger.error({ err: error }, "Dispatch cycle failed");
    });
  }, 10_000);
})();
