import { describe, expect, it } from "vitest";
import type { CourierSnapshot, DispatchConfig, StrategicOrder } from "@scms/shared";
import { decideDispatch, runSafeguardReroute, runSimulation } from "../src/index";

const config: DispatchConfig = {
  city: "ashdod",
  strategicTracks: ["A1", "A2", "B"],
  checks: {
    checkTrackEligibility: true,
    checkPartnerActive: true,
    checkAajlThreshold: true
  },
  weights: {
    proximity: 0.5,
    workload: 0.35,
    priority: 0.1,
    history: 0.05
  },
  thresholds: {
    aajlThreshold: 3,
    workloadMaxActiveOrders: 2,
    workloadMaxEtaMinutes: 25,
    proximityMaxEtaMinutes: 15,
    safeguardTimeoutSeconds: 60
  }
};

const order: StrategicOrder = {
  orderId: "order-1",
  restaurantId: "22222222-2222-2222-2222-222222222222",
  city: "ashdod",
  track: "A1",
  aajl: 4,
  orderSource: "integrated",
  createdAt: "2026-05-22T08:00:00.000Z"
};

const couriers: CourierSnapshot[] = [
  {
    courierId: "11111111-1111-1111-1111-111111111111",
    city: "ashdod",
    assignedRestaurantIds: ["22222222-2222-2222-2222-222222222222"],
    activeOrders: 0,
    estimatedBusyMinutes: 4,
    etaToRestaurantMinutes: 5,
    lastAssignedAt: null,
    seniorityDays: 30,
    online: true
  }
];

describe("decideDispatch", () => {
  it("assigns strategic courier when eligible", () => {
    const decision = decideDispatch(order, {
      mode: "integrated",
      config,
      partnerActive: true,
      restaurantPriority: 2,
      couriers
    });

    expect(decision.action).toBe("assign_strategic");
    expect(decision.selectedCourierId).toBe(couriers[0].courierId);
    expect(decision.explainability.qualifiedForStrategicRouting).toBe(true);
  });
});

describe("runSafeguardReroute", () => {
  it("routes to delco if no eligible replacement exists", () => {
    const result = runSafeguardReroute({
      config,
      nowIso: "2026-05-22T08:03:00.000Z",
      order,
      candidateCouriers: [{ ...couriers[0], activeOrders: 3 }],
      lastLocationAtIso: "2026-05-22T08:00:00.000Z"
    });

    expect(result.unresponsive).toBe(true);
    expect(result.routedToDelco).toBe(true);
    expect(result.auditEvents.length).toBeGreaterThan(0);
  });
});

describe("runSimulation", () => {
  it("generates non-mutating simulation output", () => {
    const simulation = runSimulation(
      {
        city: "ashdod",
        datasetType: "what_if",
        fleetSize: 9,
        dateRange: {
          from: "2026-04-01T00:00:00.000Z",
          to: "2026-04-30T23:59:59.000Z"
        },
        configOverride: { strategicTracks: ["A1", "A2", "B", "C"] }
      },
      config,
      1200
    );

    expect(simulation.ordersHandledByStrategic).toBeGreaterThan(0);
    expect(simulation.strategicCoveragePercent).toBeGreaterThan(0);
    expect(simulation.recommendation.length).toBeGreaterThan(10);
  });
});
