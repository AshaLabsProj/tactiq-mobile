import * as Auth from "@/lib/_core/auth";
import type { SyncConflict, SyncMutation, WorkspaceData, WorkspaceEntity } from "@/types/models";

const DEFAULT_SYNC_API_URL = "https://soccerskilltracker.com";
const SYNC_API_URL = (process.env.EXPO_PUBLIC_SKILLTRACKER_API_URL ?? DEFAULT_SYNC_API_URL).replace(/\/$/, "");

export type CloudRecord = {
  entity: WorkspaceEntity;
  recordId: string;
  payload: Record<string, unknown>;
  version: number;
  clientUpdatedAt: string;
  deletedAt: string | null;
  updatedAt: string;
};

type TrpcResponse<T> = { result?: { data?: { json?: T } }; error?: { json?: { message?: string } } };

export type MobileOperationalEventInput = {
  id: string;
  name: "app_opened" | "cloud_account_connected" | "paywall_viewed" | "paywall_dismissed" | "purchase_started" | "purchase_completed" | "purchase_cancelled" | "restore_started" | "restore_completed" | "gate_encountered";
  occurredAt: string;
  metadata?: Record<string, string | number | boolean>;
};

async function call<T>(procedure: string, input?: unknown, method: "GET" | "POST" = "POST"): Promise<T> {
  const token = await Auth.getSessionToken();
  if (!token) throw new Error("Sign in to sync your workspace.");
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let url = `${SYNC_API_URL}/api/trpc/${procedure}`;
  const request: RequestInit = { method, headers };
  if (method === "GET") {
    url += `?input=${encodeURIComponent(JSON.stringify({ json: input ?? {} }))}`;
  } else {
    headers["Content-Type"] = "application/json";
    request.body = JSON.stringify({ json: input ?? {} });
  }
  const response = await fetch(url, request);
  const body = await response.json() as TrpcResponse<T>;
  if (!response.ok || body.error) throw new Error(body.error?.json?.message ?? `Sync failed (${response.status})`);
  const data = body.result?.data?.json;
  if (data === undefined) throw new Error("The sync service returned an invalid response.");
  return data;
}

export async function cloudBootstrap() {
  return call<{ records: CloudRecord[]; cursor: string; hasMore: boolean; account: { id: number; name: string | null; email: string | null; role: string } }>("mobileSync.bootstrap", undefined, "GET");
}

export async function cloudPull(cursor?: string) {
  return call<{ records: CloudRecord[]; cursor: string; hasMore: boolean }>("mobileSync.pull", { cursor: cursor ?? "0" }, "GET");
}

export async function cloudPush(mutations: SyncMutation[]) {
  return call<{ acknowledgedMutationIds: string[]; conflicts: SyncConflict[]; cursor: string }>("mobileSync.push", { mutations });
}

export async function eraseCloudWorkspace() {
  return call<{ success: true }>("mobileSync.eraseWorkspace", { confirmation: "DELETE MOBILE DATA" });
}

export async function deleteCloudAccount() {
  return call<{ success: true }>("mobileSync.deleteAccount", { confirmation: "DELETE MY SKILLTRACKER ACCOUNT" });
}

/** Sends small, de-identified operational events to Skilltracker. The server deduplicates by event ID. */
export async function cloudRecordMobileOperationalEvents(events: MobileOperationalEventInput[]) {
  if (!events.length) return { recorded: 0 };
  return call<{ recorded: number }>("mobileOperations.ingest", { events });
}

function snapshotEntity(entity: WorkspaceEntity, records: Array<{ id: string }>): SyncMutation[] {
  return records.map((record) => ({ id: `migration-${entity}-${record.id}`, entity, operation: "upsert" as const, recordId: record.id, payload: record as unknown as Record<string, unknown>, createdAt: new Date().toISOString(), retryCount: 0 }));
}

/** Build an explicit first-login migration; it is never invoked automatically. */
export function createWorkspaceSnapshotMutations(data: WorkspaceData): SyncMutation[] {
  return [
    ...snapshotEntity("team", data.teams),
    ...snapshotEntity("player", data.players),
    ...snapshotEntity("assessment", data.assessments),
    ...snapshotEntity("practiceSession", data.practiceSessions),
    ...snapshotEntity("focusGoal", data.focusGoals),
    ...snapshotEntity("match", data.matches),
    ...snapshotEntity("matchEvent", data.matchEvents),
    { id: "migration-settings-settings", entity: "settings", operation: "upsert", recordId: "settings", payload: data.settings as unknown as Record<string, unknown>, createdAt: new Date().toISOString(), retryCount: 0 },
  ];
}
