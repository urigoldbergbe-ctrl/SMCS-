import { describe, expect, it } from "vitest";
import type { CourierSnapshot, DispatchConfig } from "@scms/shared";
import { computeCourierScore, isCourierEligible } from "../src/index";

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

const courier: CourierSnapshot = {
  courierId: "11111111-1111-1111-1111-111111111111",
  city: "beer_sheva",
  assignedRestaurantIds: ["22222222-2222-2222-2222-222222222222"],
  activeOrders: 0,
  estimatedBusyMinutes: 0,
  etaToRestaurantMinutes: 5,
  lastAssignedAt: null,
  seniorityDays: 20,
  online: true
};

describe("computeCourierScore", () => {
  it("returns deterministic score between 0 and 1", () => {
    const score = computeCourierScore({
      courier,
      restaurantPriority: 3,
      historyScore: 0.8,
      config
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("isCourierEligible", () => {
  it("rejects courier above active order cap", () => {
    expect(isCourierEligible({ ...courier, activeOrders: 2 }, config)).toBe(false);
  });

  it("accepts healthy online courier", () => {
    expect(isCourierEligible(courier, config)).toBe(true);
  });
});
