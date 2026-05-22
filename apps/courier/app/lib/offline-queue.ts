export interface OfflineAction {
  id: string;
  type: "pickup" | "delivery" | "problem";
  payload: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = "scms_offline_actions";

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(action: OfflineAction): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue();
  queue.push(action);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
