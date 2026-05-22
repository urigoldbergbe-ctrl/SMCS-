import type { CourierSnapshot, DispatchConfig } from "@scms/shared";

export interface ScoreInput {
  courier: CourierSnapshot;
  restaurantPriority: 1 | 2 | 3;
  historyScore: number;
  config: DispatchConfig;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizePriority(priority: 1 | 2 | 3): number {
  return priority / 3;
}

function computeProximityScore(etaToRestaurantMinutes: number, proximityMaxEtaMinutes: number): number {
  if (etaToRestaurantMinutes >= proximityMaxEtaMinutes) return 0;
  return clamp01(1 - etaToRestaurantMinutes / proximityMaxEtaMinutes);
}

function computeWorkloadScore(activeOrders: number, estimatedBusyMinutes: number, cfg: DispatchConfig): number {
  const orderLoad = activeOrders / cfg.thresholds.workloadMaxActiveOrders;
  const timeLoad = estimatedBusyMinutes / cfg.thresholds.workloadMaxEtaMinutes;
  return clamp01(1 - (orderLoad + timeLoad) / 2);
}

export function computeCourierScore(input: ScoreInput): number {
  const { courier, restaurantPriority, historyScore, config } = input;

  const proximityScore = computeProximityScore(
    courier.etaToRestaurantMinutes,
    config.thresholds.proximityMaxEtaMinutes
  );
  const workloadScore = computeWorkloadScore(courier.activeOrders, courier.estimatedBusyMinutes, config);
  const priorityScore = normalizePriority(restaurantPriority);

  const score =
    config.weights.proximity * proximityScore +
    config.weights.workload * workloadScore +
    config.weights.priority * priorityScore +
    config.weights.history * clamp01(historyScore);

  return Number(score.toFixed(6));
}

export function isCourierEligible(courier: CourierSnapshot, config: DispatchConfig): boolean {
  if (!courier.online) return false;
  if (courier.activeOrders >= config.thresholds.workloadMaxActiveOrders) return false;
  if (courier.estimatedBusyMinutes >= config.thresholds.workloadMaxEtaMinutes) return false;
  if (courier.etaToRestaurantMinutes >= config.thresholds.proximityMaxEtaMinutes) return false;
  return true;
}
