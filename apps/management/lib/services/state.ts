import {
  type AiAdvisorRequest,
  type DispatchConfig,
  type DispatchConfigSnapshot,
  type ManualOrderEntry,
  type OperationMode,
  type SimulationRequest,
  type SimulationResult,
  type SupportTicket
} from "@scms/shared";
import { runSimulation } from "@scms/dispatch";

const nowIso = () => new Date().toISOString();

const globalConfig: DispatchConfig = {
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
    safeguardTimeoutSeconds: 60
  }
};

const cityConfig = new Map<string, DispatchConfig>([
  ["global", globalConfig],
  ["beer_sheva", { ...globalConfig, city: "beer_sheva" }],
  ["ashdod", { ...globalConfig, city: "ashdod" }],
  ["tlv", { ...globalConfig, city: "tlv" }]
]);

const configHistory: DispatchConfigSnapshot[] = [
  {
    id: crypto.randomUUID(),
    city: "global",
    config: globalConfig,
    createdBy: "system-seed",
    createdAt: nowIso(),
    changeNote: "Initial baseline"
  }
];

const supportTickets: SupportTicket[] = [];
const manualOrders: ManualOrderEntry[] = [];
const simulationRuns: Array<{ request: SimulationRequest; result: SimulationResult; createdAt: string }> = [];
let mode: OperationMode = "integrated";

export function listConfigs(): DispatchConfig[] {
  return [...cityConfig.values()];
}

export function getConfig(city: string): DispatchConfig {
  return cityConfig.get(city) ?? cityConfig.get("global")!;
}

export function saveConfig(city: string, config: DispatchConfig, changedBy: string, changeNote: string): DispatchConfig {
  cityConfig.set(city, config);
  configHistory.unshift({
    id: crypto.randomUUID(),
    city,
    config,
    createdBy: changedBy,
    createdAt: nowIso(),
    changeNote
  });
  return config;
}

export function listConfigHistory(city?: string): DispatchConfigSnapshot[] {
  if (!city) return [...configHistory];
  return configHistory.filter((snapshot) => snapshot.city === city);
}

export function rollbackConfig(snapshotId: string, changedBy: string): DispatchConfigSnapshot | null {
  const snapshot = configHistory.find((item) => item.id === snapshotId);
  if (!snapshot) return null;

  cityConfig.set(snapshot.city, snapshot.config);
  const rollbackSnapshot: DispatchConfigSnapshot = {
    id: crypto.randomUUID(),
    city: snapshot.city,
    config: snapshot.config,
    createdBy: changedBy,
    createdAt: nowIso(),
    changeNote: `Rollback to snapshot ${snapshot.id}`
  };
  configHistory.unshift(rollbackSnapshot);
  return rollbackSnapshot;
}

export function getMode(): OperationMode {
  return mode;
}

export function setMode(nextMode: OperationMode): OperationMode {
  mode = nextMode;
  return mode;
}

export function runSimulationScenario(request: SimulationRequest): SimulationResult {
  const base = getConfig(request.city);
  const result = runSimulation(request, base, 1500);
  simulationRuns.unshift({ request, result, createdAt: nowIso() });
  return result;
}

export function listSimulationRuns(): Array<{
  request: SimulationRequest;
  result: SimulationResult;
  createdAt: string;
}> {
  return [...simulationRuns];
}

export function addSupportTicket(ticket: SupportTicket): SupportTicket {
  supportTickets.unshift(ticket);
  return ticket;
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicket["status"],
  message?: string
): SupportTicket | null {
  const ticket = supportTickets.find((item) => item.id === ticketId);
  if (!ticket) return null;
  ticket.status = status;
  if (message) {
    ticket.transcript.push({
      by: "operator",
      message,
      createdAt: nowIso()
    });
  }
  if (status === "resolved") ticket.resolvedAt = nowIso();
  return ticket;
}

export function listSupportTickets(): SupportTicket[] {
  return [...supportTickets];
}

export function addManualOrder(order: ManualOrderEntry): ManualOrderEntry {
  manualOrders.unshift(order);
  return order;
}

export function listManualOrders(): ManualOrderEntry[] {
  return [...manualOrders];
}

export function getAiAdvisorRecommendation(input: AiAdvisorRequest): {
  recommendation: string;
  rationale: string[];
} {
  const cityCfg = getConfig(input.city);
  const weightSkew = cityCfg.weights.proximity - cityCfg.weights.workload;
  const recommendation =
    weightSkew > 0.25
      ? "Reduce proximity weight slightly and increase workload weight to prevent courier overload during peaks."
      : "Current weighting is balanced. Run what-if simulation for peak windows before changing thresholds.";

  return {
    recommendation,
    rationale: [
      `Mode: ${mode}`,
      `AAJL threshold: ${cityCfg.thresholds.aajlThreshold}`,
      `Tracks configured: ${cityCfg.strategicTracks.join(", ")}`
    ]
  };
}
