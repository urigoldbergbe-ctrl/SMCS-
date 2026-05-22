import { z } from "zod";

export const operationModeSchema = z.enum(["integrated", "standalone", "simulation"]);
export type OperationMode = z.infer<typeof operationModeSchema>;

export const courierStatusSchema = z.enum(["online", "offline", "on_run"]);
export type CourierStatus = z.infer<typeof courierStatusSchema>;

export const strategicOrderSchema = z.object({
  orderId: z.string().min(1),
  restaurantId: z.string().uuid(),
  city: z.string().min(1),
  track: z.string().min(1),
  aajl: z.number().nonnegative().nullable(),
  orderSource: z.enum(["integrated", "manual"]),
  createdAt: z.string().datetime()
});
export type StrategicOrder = z.infer<typeof strategicOrderSchema>;

export const courierSnapshotSchema = z.object({
  courierId: z.string().uuid(),
  city: z.string().min(1),
  assignedRestaurantIds: z.array(z.string().uuid()),
  activeOrders: z.number().int().nonnegative(),
  estimatedBusyMinutes: z.number().nonnegative(),
  etaToRestaurantMinutes: z.number().nonnegative(),
  lastAssignedAt: z.string().datetime().nullable(),
  seniorityDays: z.number().int().nonnegative(),
  online: z.boolean()
});
export type CourierSnapshot = z.infer<typeof courierSnapshotSchema>;

const dispatchConfigBaseSchema = z.object({
  city: z.string().min(1),
  strategicTracks: z.array(z.string().min(1)),
  checks: z.object({
    checkTrackEligibility: z.boolean(),
    checkPartnerActive: z.boolean(),
    checkAajlThreshold: z.boolean()
  }),
  weights: z.object({
    proximity: z.number().min(0).max(1),
    workload: z.number().min(0).max(1),
    priority: z.number().min(0).max(1),
    history: z.number().min(0).max(1)
  }),
  thresholds: z.object({
    aajlThreshold: z.number().nonnegative(),
    workloadMaxActiveOrders: z.number().int().positive(),
    workloadMaxEtaMinutes: z.number().positive(),
    proximityMaxEtaMinutes: z.number().positive(),
    safeguardTimeoutSeconds: z.number().int().positive()
  })
});

export const dispatchConfigSchema = dispatchConfigBaseSchema.superRefine((cfg, ctx) => {
  const sum =
    cfg.weights.proximity +
    cfg.weights.workload +
    cfg.weights.priority +
    cfg.weights.history;

  if (Math.abs(sum - 1) > 0.0001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weights"],
      message: "Dispatch scoring weights must sum to 1.0"
    });
  }
});
export type DispatchConfig = z.infer<typeof dispatchConfigSchema>;

export const dispatchConfigSnapshotSchema = z.object({
  id: z.string().uuid(),
  city: z.string().min(1),
  config: dispatchConfigSchema,
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
  changeNote: z.string().max(500).nullable()
});
export type DispatchConfigSnapshot = z.infer<typeof dispatchConfigSnapshotSchema>;

export const restaurantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  city: z.string().min(1),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ovCapPercent: z.number().min(10).max(40),
  eligibleTracks: z.array(z.string().min(1)),
  corporateClient: z.boolean(),
  isActive: z.boolean()
});
export type Restaurant = z.infer<typeof restaurantSchema>;

export const supportTicketSchema = z.object({
  id: z.string().uuid(),
  courierId: z.string().uuid(),
  issueCategory: z.string().min(1),
  status: z.enum(["open", "ai_handling", "escalated", "resolved"]),
  transcript: z.array(
    z.object({
      by: z.enum(["courier", "ai", "operator", "system"]),
      message: z.string().min(1),
      createdAt: z.string().datetime()
    })
  ),
  resolutionTag: z.string().nullable(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable()
});
export type SupportTicket = z.infer<typeof supportTicketSchema>;

export const simulationRequestSchema = z.object({
  city: z.string().min(1),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  datasetType: z.enum(["historical_replay", "what_if", "tlv_onboarding", "offline_disconnected"]),
  fleetSize: z.number().int().positive(),
  configOverride: dispatchConfigBaseSchema.partial().optional()
});
export type SimulationRequest = z.infer<typeof simulationRequestSchema>;

export const simulationResultSchema = z.object({
  ordersHandledByStrategic: z.number().int().nonnegative(),
  ordersHandledByDelco: z.number().int().nonnegative(),
  strategicCoveragePercent: z.number().min(0).max(100),
  avgPtodMinutes: z.number().nonnegative(),
  courierUtilizationPercent: z.number().min(0).max(100),
  findings: z.array(z.string()),
  recommendation: z.string()
});
export type SimulationResult = z.infer<typeof simulationResultSchema>;

export const aiAdvisorRequestSchema = z.object({
  city: z.string().min(1),
  intent: z.enum([
    "config_review",
    "simulation_interpretation",
    "threshold_tuning",
    "fleet_sizing",
    "anomaly_explanation"
  ]),
  prompt: z.string().min(5),
  context: z.record(z.unknown()).optional()
});
export type AiAdvisorRequest = z.infer<typeof aiAdvisorRequestSchema>;

export const manualOrderEntrySchema = z.object({
  id: z.string().uuid(),
  restaurantName: z.string().min(2),
  restaurantAddressFull: z.string().min(5),
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  customerAddressFull: z.string().min(5),
  notes: z.string().max(1000).optional().default(""),
  status: z.enum(["pending_dispatch", "assigned", "picked_up", "delivered"]).default("pending_dispatch"),
  createdAt: z.string().datetime()
});
export type ManualOrderEntry = z.infer<typeof manualOrderEntrySchema>;

export interface DispatchDecision {
  action: "assign_strategic" | "route_delco";
  reason: string;
  selectedCourierId: string | null;
  scores: Array<{ courierId: string; score: number }>;
  explainability: {
    qualifiedForStrategicRouting: boolean;
    excludedCouriers: Array<{ courierId: string; reason: string }>;
    mode: OperationMode;
  };
}

export interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  actor: "dispatch_engine" | "admin" | "system" | "ai_advisor";
  payload: Record<string, unknown>;
  createdAt: string;
}

export function assertDispatchConfig(input: unknown): DispatchConfig {
  return dispatchConfigSchema.parse(input);
}

export function assertSimulationRequest(input: unknown): SimulationRequest {
  return simulationRequestSchema.parse(input);
}

export const JUST_EAT_COLORS = {
  orange: "#FF8000",
  dark: "#111827",
  slate: "#1F2937",
  text: "#F9FAFB",
  muted: "#9CA3AF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444"
} as const;
