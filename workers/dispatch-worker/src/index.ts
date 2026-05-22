import pino from "pino";
import { decideDispatch, runSafeguardReroute } from "@scms/dispatch";
import { IntegrationQueue } from "@scms/integration";
import type { CourierSnapshot, DispatchConfig, StrategicOrder } from "@scms/shared";

const logger = pino({ name: "dispatch-worker" });
const integrationQueue = new IntegrationQueue({ maxAttempts: 3, baseBackoffMs: 100 });

const config: DispatchConfig = {
  city: "beer_sheva",
  strategicTracks: ["A1", "A2", "B"],
  checks: {
    checkTrackEligibility: true,
    checkPartnerActive: true,
    checkAajlThreshold: true
  },
  weights: {
    proximity: 0.5,
    workload: 0.35,
    priority: 0.15,
    history: 0
  },
  thresholds: {
    aajlThreshold: 3,
    workloadMaxActiveOrders: 2,
    workloadMaxEtaMinutes: 25,
    proximityMaxEtaMinutes: 15,
    safeguardTimeoutSeconds: 60
  }
};

const couriers: CourierSnapshot[] = [
  {
    courierId: "11111111-1111-1111-1111-111111111111",
    city: "beer_sheva",
    assignedRestaurantIds: ["22222222-2222-2222-2222-222222222222"],
    activeOrders: 0,
    estimatedBusyMinutes: 0,
    etaToRestaurantMinutes: 6,
    lastAssignedAt: null,
    seniorityDays: 120,
    online: true
  },
  {
    courierId: "33333333-3333-3333-3333-333333333333",
    city: "beer_sheva",
    assignedRestaurantIds: ["22222222-2222-2222-2222-222222222222"],
    activeOrders: 1,
    estimatedBusyMinutes: 10,
    etaToRestaurantMinutes: 7,
    lastAssignedAt: "2026-05-22T07:00:00.000Z",
    seniorityDays: 70,
    online: true
  }
];

const sampleOrder: StrategicOrder = {
  orderId: "order-10001",
  restaurantId: "22222222-2222-2222-2222-222222222222",
  city: "beer_sheva",
  track: "A1",
  aajl: 3.4,
  orderSource: "integrated",
  createdAt: new Date().toISOString()
};

async function runDispatchCycle(): Promise<void> {
  const decision = decideDispatch(sampleOrder, {
    mode: "integrated",
    config,
    partnerActive: true,
    restaurantPriority: 3,
    couriers
  });

  if (decision.action === "assign_strategic" && decision.selectedCourierId) {
    integrationQueue.enqueue({
      id: crypto.randomUUID(),
      endpoint: "/orders/assigned",
      payload: {
        orderId: sampleOrder.orderId,
        courierId: decision.selectedCourierId
      },
      createdAt: new Date().toISOString()
    });
  } else {
    integrationQueue.enqueue({
      id: crypto.randomUUID(),
      endpoint: "/orders/routed-delco",
      payload: { orderId: sampleOrder.orderId, reason: decision.reason },
      createdAt: new Date().toISOString()
    });
  }

  const safeguard = runSafeguardReroute({
    config,
    nowIso: new Date().toISOString(),
    order: sampleOrder,
    candidateCouriers: couriers,
    lastLocationAtIso: new Date(Date.now() - 70_000).toISOString()
  });

  const queueResult = await integrationQueue.process(async () => {
    // Production implementation posts to the 10bis endpoint.
  });

  logger.info({ decision, safeguard, queueResult }, "Dispatch cycle completed");
}

setInterval(() => {
  void runDispatchCycle();
}, 5000);

void runDispatchCycle();
