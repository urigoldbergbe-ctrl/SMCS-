import pino from "pino";
import type {
  AuditEvent,
  CourierSnapshot,
  DispatchConfig,
  DispatchDecision,
  OperationMode,
  SimulationRequest,
  SimulationResult,
  StrategicOrder
} from "@scms/shared";
import { computeCourierScore, isCourierEligible } from "@scms/scoring";

const logger = pino({ name: "dispatch-engine" });

export interface DispatchContext {
  mode: OperationMode;
  config: DispatchConfig;
  restaurantPriority: 1 | 2 | 3;
  partnerActive: boolean;
  couriers: CourierSnapshot[];
}

export interface SafeguardContext {
  config: DispatchConfig;
  nowIso: string;
  candidateCouriers: CourierSnapshot[];
  order: StrategicOrder;
  lastLocationAtIso: string | null;
}

export interface SafeguardResult {
  unresponsive: boolean;
  reassignedCourierId: string | null;
  routedToDelco: boolean;
  auditEvents: AuditEvent[];
}

function shouldUseStrategicFleet(order: StrategicOrder, ctx: DispatchContext): boolean {
  if (ctx.config.checks.checkPartnerActive && !ctx.partnerActive) return false;
  if (ctx.config.checks.checkTrackEligibility && !ctx.config.strategicTracks.includes(order.track)) {
    return false;
  }

  if (
    ctx.mode !== "standalone" &&
    ctx.config.checks.checkAajlThreshold &&
    order.aajl !== null &&
    order.aajl < ctx.config.thresholds.aajlThreshold
  ) {
    return false;
  }

  return true;
}

export function decideDispatch(order: StrategicOrder, ctx: DispatchContext): DispatchDecision {
  const explainabilityBase = {
    qualifiedForStrategicRouting: false,
    excludedCouriers: [] as Array<{ courierId: string; reason: string }>,
    mode: ctx.mode
  };

  if (!shouldUseStrategicFleet(order, ctx)) {
    return {
      action: "route_delco",
      reason: "Order does not qualify for strategic routing",
      selectedCourierId: null,
      scores: [],
      explainability: explainabilityBase
    };
  }

  const eligible: CourierSnapshot[] = [];
  for (const courier of ctx.couriers) {
    if (!isCourierEligible(courier, ctx.config)) {
      explainabilityBase.excludedCouriers.push({
        courierId: courier.courierId,
        reason: "Failed eligibility thresholds"
      });
      continue;
    }
    eligible.push(courier);
  }

  if (eligible.length === 0) {
    return {
      action: "route_delco",
      reason: "No eligible strategic couriers available",
      selectedCourierId: null,
      scores: [],
      explainability: {
        ...explainabilityBase,
        qualifiedForStrategicRouting: true
      }
    };
  }

  const scores = eligible.map((courier) => ({
    courierId: courier.courierId,
    score: computeCourierScore({
      courier,
      config: ctx.config,
      historyScore: 0.5,
      restaurantPriority: ctx.restaurantPriority
    }),
    seniorityDays: courier.seniorityDays,
    lastAssignedAt: courier.lastAssignedAt ?? "1970-01-01T00:00:00.000Z"
  }));

  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.seniorityDays !== a.seniorityDays) return b.seniorityDays - a.seniorityDays;
    return a.lastAssignedAt.localeCompare(b.lastAssignedAt);
  });

  const winner = scores[0];
  if (!winner) {
    return {
      action: "route_delco",
      reason: "No score winner after ranking",
      selectedCourierId: null,
      scores: [],
      explainability: {
        ...explainabilityBase,
        qualifiedForStrategicRouting: true
      }
    };
  }
  logger.info(
    {
      orderId: order.orderId,
      mode: ctx.mode,
      selectedCourierId: winner.courierId,
      score: winner.score
    },
    "Dispatch decision made"
  );

  return {
    action: "assign_strategic",
    reason: "Highest eligible courier score",
    selectedCourierId: winner.courierId,
    scores: scores.map(({ courierId, score }) => ({ courierId, score })),
    explainability: {
      ...explainabilityBase,
      qualifiedForStrategicRouting: true
    }
  };
}

export function runSafeguardReroute(context: SafeguardContext): SafeguardResult {
  const auditEvents: AuditEvent[] = [];
  const timeoutMs = context.config.thresholds.safeguardTimeoutSeconds * 1000;
  const now = new Date(context.nowIso).getTime();
  const lastSeen = context.lastLocationAtIso ? new Date(context.lastLocationAtIso).getTime() : 0;
  const unresponsive = now - lastSeen > timeoutMs;

  if (!unresponsive) {
    return {
      unresponsive: false,
      reassignedCourierId: null,
      routedToDelco: false,
      auditEvents
    };
  }

  auditEvents.push({
    eventType: "courier_unresponsive_mid_run",
    entityType: "order",
    entityId: context.order.orderId,
    actor: "dispatch_engine",
    payload: { timeoutSeconds: context.config.thresholds.safeguardTimeoutSeconds },
    createdAt: context.nowIso
  });

  const decision = decideDispatch(context.order, {
    mode: "integrated",
    config: context.config,
    restaurantPriority: 2,
    partnerActive: true,
    couriers: context.candidateCouriers
  });

  if (decision.action === "assign_strategic" && decision.selectedCourierId) {
    auditEvents.push({
      eventType: "order_reassigned",
      entityType: "order",
      entityId: context.order.orderId,
      actor: "dispatch_engine",
      payload: { newCourierId: decision.selectedCourierId },
      createdAt: context.nowIso
    });
    return {
      unresponsive: true,
      reassignedCourierId: decision.selectedCourierId,
      routedToDelco: false,
      auditEvents
    };
  }

  auditEvents.push({
    eventType: "order_routed_delco_after_unresponsive",
    entityType: "order",
    entityId: context.order.orderId,
    actor: "dispatch_engine",
    payload: { reason: decision.reason },
    createdAt: context.nowIso
  });
  return {
    unresponsive: true,
    reassignedCourierId: null,
    routedToDelco: true,
    auditEvents
  };
}

export function runSimulation(
  request: SimulationRequest,
  baseConfig: DispatchConfig,
  historicalOrdersCount: number
): SimulationResult {
  const strategicTracksCount = request.configOverride?.strategicTracks?.length ?? baseConfig.strategicTracks.length;
  const strategicCoveragePercent = Math.min(
    95,
    Math.max(20, (strategicTracksCount / Math.max(1, baseConfig.strategicTracks.length)) * 60)
  );

  const ordersHandledByStrategic = Math.round((historicalOrdersCount * strategicCoveragePercent) / 100);
  const ordersHandledByDelco = Math.max(0, historicalOrdersCount - ordersHandledByStrategic);
  const avgPtodMinutes = Number((48 - strategicCoveragePercent * 0.12).toFixed(2));
  const courierUtilizationPercent = Math.min(98, Math.max(35, request.fleetSize * 4.7));

  return {
    ordersHandledByStrategic,
    ordersHandledByDelco,
    strategicCoveragePercent: Number(strategicCoveragePercent.toFixed(2)),
    avgPtodMinutes,
    courierUtilizationPercent: Number(courierUtilizationPercent.toFixed(2)),
    findings: [
      `Projected strategic coverage: ${strategicCoveragePercent.toFixed(1)}%`,
      `Estimated average PToD: ${avgPtodMinutes.toFixed(1)} minutes`,
      "No production configuration changed during simulation run"
    ],
    recommendation:
      strategicCoveragePercent < 55
        ? "Increase eligible tracks during peak windows or add one courier."
        : "Current strategy appears healthy; tune workload cap incrementally."
  };
}
