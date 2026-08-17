import AsyncStorage from "@react-native-async-storage/async-storage";
import { cloudRecordMobileOperationalEvents } from "@/lib/cloud-sync";

export const SUBSCRIPTION_EVENTS_STORAGE_KEY = "skilltracker-subscription-events-v1";

export type SubscriptionEventName =
  | "app_opened"
  | "paywall_viewed"
  | "paywall_dismissed"
  | "purchase_started"
  | "purchase_completed"
  | "purchase_cancelled"
  | "restore_started"
  | "restore_completed"
  | "gate_encountered";

export interface SubscriptionEvent {
  id: string;
  name: SubscriptionEventName;
  origin?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

function createEventId(): string {
  return `subscription-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Privacy-friendly operational telemetry. It persists locally first and only syncs to the Skilltracker service when an authenticated connection is available. */
export async function logSubscriptionEvent(
  name: SubscriptionEventName,
  origin?: string,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SUBSCRIPTION_EVENTS_STORAGE_KEY);
    const events = stored ? (JSON.parse(stored) as SubscriptionEvent[]) : [];
    const next = [...events, { id: createEventId(), name, origin, metadata, createdAt: new Date().toISOString() }].slice(-200);
    await AsyncStorage.setItem(SUBSCRIPTION_EVENTS_STORAGE_KEY, JSON.stringify(next));
    void flushSubscriptionEvents(next);
  } catch {
    // Paywall telemetry must never block coaching, a purchase, or restoration.
  }
}

export async function readSubscriptionEvents(): Promise<SubscriptionEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(SUBSCRIPTION_EVENTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SubscriptionEvent[]) : [];
  } catch {
    return [];
  }
}

/** Retry the local event window without blocking match capture, subscription flows, or startup. */
export async function flushSubscriptionEvents(events?: SubscriptionEvent[]): Promise<void> {
  try {
    const pending = events ?? await readSubscriptionEvents();
    if (!pending.length) return;
    await cloudRecordMobileOperationalEvents(pending.map((event) => ({
      id: event.id,
      name: event.name,
      occurredAt: event.createdAt,
      metadata: { ...(event.origin ? { origin: event.origin.slice(0, 96) } : {}), ...(event.metadata ?? {}) },
    })));
  } catch {
    // Preserve local events for the next authenticated retry.
  }
}
