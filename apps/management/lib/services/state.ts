import {
  type AiAdvisorRequest,
  type AuditEvent,
  type DispatchConfig,
  type DispatchConfigSnapshot,
  type ManualOrderEntry,
  type OperationMode,
  type SimulationRequest,
  type SimulationResult,
  type SupportTicket
} from "@scms/shared";
import { runSimulation } from "@scms/dispatch";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const nowIso = () => new Date().toISOString();

const defaultConfig: DispatchConfig = {
  city: "global",
  strategicTracks: ["A1", "A2", "B"],
  checks: {
    checkTrackEligibility: true,
    checkPartnerActive: true,
    checkAajlThreshold: true
  },
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

function flattenConfig(config: DispatchConfig): Array<{ config_key: string; config_value: unknown }> {
  return [
    { config_key: "strategicTracks", config_value: config.strategicTracks },
    { config_key: "checks", config_value: config.checks },
    { config_key: "weights", config_value: config.weights },
    { config_key: "thresholds", config_value: config.thresholds }
  ];
}

function mergeConfigRows(city: string, rows: Array<{ config_key: string; config_value: unknown }>): DispatchConfig {
  const merged: DispatchConfig = { ...defaultConfig, city };
  for (const row of rows) {
    if (row.config_key === "strategicTracks" && Array.isArray(row.config_value)) {
      merged.strategicTracks = row.config_value as string[];
      continue;
    }
    if (row.config_key === "checks" && typeof row.config_value === "object" && row.config_value) {
      merged.checks = { ...merged.checks, ...(row.config_value as DispatchConfig["checks"]) };
      continue;
    }
    if (row.config_key === "weights" && typeof row.config_value === "object" && row.config_value) {
      merged.weights = { ...merged.weights, ...(row.config_value as DispatchConfig["weights"]) };
      continue;
    }
    if (row.config_key === "thresholds" && typeof row.config_value === "object" && row.config_value) {
      merged.thresholds = { ...merged.thresholds, ...(row.config_value as DispatchConfig["thresholds"]) };
    }
  }
  return merged;
}

async function ensureAuditLog(event: AuditEvent): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("audit_log").insert({
    event_type: event.eventType,
    entity_type: event.entityType,
    entity_id: event.entityId,
    actor: event.actor,
    payload: event.payload,
    created_at: event.createdAt
  });
}

export async function listConfigs(): Promise<DispatchConfig[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dispatch_config")
      .select("city, config_key, config_value")
      .order("created_at", { ascending: false });

    if (error) return [{ ...defaultConfig }];
    if (!data || data.length === 0) return [{ ...defaultConfig }];

    const grouped = new Map<string, Array<{ config_key: string; config_value: unknown }>>();
    for (const row of data) {
      if (!grouped.has(row.city)) grouped.set(row.city, []);
      grouped.get(row.city)?.push({ config_key: row.config_key, config_value: row.config_value });
    }

    return [...grouped.entries()].map(([city, rows]) => mergeConfigRows(city, rows));
  } catch {
    return [{ ...defaultConfig }];
  }
}

export async function getConfig(city: string): Promise<DispatchConfig> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dispatch_config")
      .select("config_key, config_value")
      .eq("city", city)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return { ...defaultConfig, city };
    return mergeConfigRows(city, data);
  } catch {
    return { ...defaultConfig, city };
  }
}

export async function saveConfig(
  city: string,
  config: DispatchConfig,
  changedBy: string,
  changeNote: string
): Promise<DispatchConfig> {
  const supabase = getSupabaseAdminClient();
  const now = nowIso();

  const snapshot = {
    city,
    config,
    createdBy: changedBy,
    createdAt: now,
    changeNote
  };

  const { error: historyError } = await supabase.from("dispatch_config_history").insert({
    config_snapshot: snapshot,
    changed_by: changedBy,
    changed_at: now,
    change_note: changeNote
  });
  if (historyError) throw new Error(`Failed to write config history: ${historyError.message}`);

  const { error: deleteError } = await supabase.from("dispatch_config").delete().eq("city", city);
  if (deleteError) throw new Error(`Failed to clear config rows: ${deleteError.message}`);

  const rows = flattenConfig({ ...config, city }).map((row) => ({
    city,
    config_key: row.config_key,
    config_value: row.config_value,
    created_by: changedBy,
    effective_from: now,
    created_at: now
  }));
  const { error: insertError } = await supabase.from("dispatch_config").insert(rows);
  if (insertError) throw new Error(`Failed to save config rows: ${insertError.message}`);

  await ensureAuditLog({
    eventType: "dispatch_config_saved",
    entityType: "dispatch_config",
    entityId: city,
    actor: "admin",
    payload: { changeNote },
    createdAt: now
  });

  return { ...config, city };
}

export async function listConfigHistory(city?: string): Promise<DispatchConfigSnapshot[]> {
  const supabase = getSupabaseAdminClient();
  const query = supabase
    .from("dispatch_config_history")
    .select("id, config_snapshot, changed_by, changed_at, change_note")
    .order("changed_at", { ascending: false });

  const { data, error } = city
    ? await query.contains("config_snapshot", { city })
    : await query;

  if (error) throw new Error(`Failed to list config history: ${error.message}`);
  if (!data) return [];

  return data.map((row) => {
    const snapshot = row.config_snapshot as {
      city: string;
      config: DispatchConfig;
      createdBy: string;
      createdAt: string;
      changeNote: string | null;
    };
    return {
      id: row.id,
      city: snapshot.city,
      config: snapshot.config,
      createdBy: row.changed_by,
      createdAt: row.changed_at,
      changeNote: row.change_note
    };
  });
}

export async function rollbackConfig(snapshotId: string, changedBy: string): Promise<DispatchConfigSnapshot | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dispatch_config_history")
    .select("id, config_snapshot")
    .eq("id", snapshotId)
    .single();
  if (error || !data) return null;

  const snapshot = data.config_snapshot as {
    city: string;
    config: DispatchConfig;
  };
  const saved = await saveConfig(snapshot.city, snapshot.config, changedBy, `Rollback to snapshot ${snapshotId}`);

  return {
    id: crypto.randomUUID(),
    city: snapshot.city,
    config: saved,
    createdBy: changedBy,
    createdAt: nowIso(),
    changeNote: `Rollback to snapshot ${snapshotId}`
  };
}

export async function getMode(): Promise<OperationMode> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "operation_mode")
      .maybeSingle();
    if (error || !data) return "integrated";
    return (data.value as OperationMode) ?? "integrated";
  } catch {
    return "integrated";
  }
}

export async function setMode(nextMode: OperationMode): Promise<OperationMode> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "operation_mode",
      value: nextMode,
      updated_at: nowIso()
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(`Failed to set mode: ${error.message}`);
  return nextMode;
}

export async function runSimulationScenario(request: SimulationRequest): Promise<SimulationResult> {
  const base = await getConfig(request.city);
  const result = runSimulation(request, base, 1500);

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("simulation_runs").insert({
    id: crypto.randomUUID(),
    city: request.city,
    request_payload: request,
    result_payload: result,
    created_at: nowIso()
  });
  if (error) throw new Error(`Failed to persist simulation run: ${error.message}`);

  return result;
}

export async function listSimulationRuns(): Promise<Array<{
  request: SimulationRequest;
  result: SimulationResult;
  createdAt: string;
}>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("simulation_runs")
    .select("request_payload, result_payload, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list simulation runs: ${error.message}`);
  if (!data) return [];
  return data.map((row) => ({
    request: row.request_payload as SimulationRequest,
    result: row.result_payload as SimulationResult,
    createdAt: row.created_at
  }));
}

export async function addSupportTicket(ticket: SupportTicket): Promise<SupportTicket> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("support_tickets").insert({
    id: ticket.id,
    courier_id: ticket.courierId,
    status: ticket.status,
    escalation_reason: ticket.issueCategory,
    chat_transcript: ticket.transcript,
    resolution_tag: ticket.resolutionTag,
    created_at: ticket.createdAt,
    resolved_at: ticket.resolvedAt
  });
  if (error) throw new Error(`Failed to add support ticket: ${error.message}`);
  return ticket;
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicket["status"],
  message?: string
): Promise<SupportTicket | null> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("support_tickets")
    .select("id, courier_id, status, escalation_reason, chat_transcript, resolution_tag, created_at, resolved_at")
    .eq("id", ticketId)
    .maybeSingle();
  if (existingError) throw new Error(`Failed to read ticket: ${existingError.message}`);
  if (!existing) return null;

  const transcript = (existing.chat_transcript as SupportTicket["transcript"]) ?? [];
  if (message) transcript.push({
      by: "operator",
      message,
      createdAt: nowIso()
    });
  const resolvedAt = status === "resolved" ? nowIso() : existing.resolved_at;

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({
      status,
      chat_transcript: transcript,
      resolved_at: resolvedAt
    })
    .eq("id", ticketId);
  if (updateError) throw new Error(`Failed to update ticket: ${updateError.message}`);

  return {
    id: existing.id,
    courierId: existing.courier_id,
    issueCategory: existing.escalation_reason ?? "other",
    status,
    transcript,
    resolutionTag: existing.resolution_tag,
    createdAt: existing.created_at,
    resolvedAt: resolvedAt ?? null
  };
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, courier_id, status, escalation_reason, chat_transcript, resolution_tag, created_at, resolved_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list tickets: ${error.message}`);
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    courierId: row.courier_id,
    issueCategory: row.escalation_reason ?? "other",
    status: row.status as SupportTicket["status"],
    transcript: (row.chat_transcript as SupportTicket["transcript"]) ?? [],
    resolutionTag: row.resolution_tag,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  }));
}

export async function addManualOrder(order: ManualOrderEntry): Promise<ManualOrderEntry> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("manual_orders").insert({
    id: order.id,
    restaurant_name: order.restaurantName,
    restaurant_address_full: order.restaurantAddressFull,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_address_full: order.customerAddressFull,
    notes: order.notes ?? "",
    status: order.status,
    created_at: order.createdAt
  });
  if (error) throw new Error(`Failed to insert manual order: ${error.message}`);
  return order;
}

export async function listManualOrders(): Promise<ManualOrderEntry[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("manual_orders")
    .select("id, restaurant_name, restaurant_address_full, customer_name, customer_phone, customer_address_full, notes, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list manual orders: ${error.message}`);
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    restaurantName: row.restaurant_name,
    restaurantAddressFull: row.restaurant_address_full,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddressFull: row.customer_address_full,
    notes: row.notes ?? "",
    status: row.status as ManualOrderEntry["status"],
    createdAt: row.created_at
  }));
}

export async function getAiAdvisorRecommendation(input: AiAdvisorRequest): Promise<{
  recommendation: string;
  rationale: string[];
}> {
  const cityCfg = await getConfig(input.city);
  const mode = await getMode();
  const weightSkew = cityCfg.weights.proximity - cityCfg.weights.workload;
  const recommendation =
    weightSkew > 0.25
      ? "Reduce proximity weight slightly and increase workload weight to prevent courier overload during peaks."
      : "Current weighting is balanced. Run what-if simulation for peak windows before changing thresholds.";

  const response = {
    recommendation,
    rationale: [
      `Mode: ${mode}`,
      `AAJL threshold: ${cityCfg.thresholds.aajlThreshold}`,
      `Tracks configured: ${cityCfg.strategicTracks.join(", ")}`
    ]
  };

  const supabase = getSupabaseAdminClient();
  await supabase.from("ai_advisor_logs").insert({
    id: crypto.randomUUID(),
    city: input.city,
    intent: input.intent,
    prompt: input.prompt,
    recommendation: response.recommendation,
    rationale: response.rationale,
    context: input.context ?? {},
    created_at: nowIso()
  });

  return response;
}
