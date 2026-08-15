import type { SyncConflict, SyncMutation } from "@/types/models";

export const SYNC_QUEUE_STORAGE_KEY = "skilltracker-sync-queue-v1";
export const SYNC_CONFLICT_STORAGE_KEY = "skilltracker-sync-conflicts-v1";

export interface SyncBatchResponse {
  acknowledgedMutationIds: string[];
  conflicts?: SyncConflict[];
  cursor?: string;
}

export interface SyncFlushResult {
  remaining: SyncMutation[];
  conflicts: SyncConflict[];
  cursor?: string;
  attemptedCount: number;
}

export function retryMutations(queue: SyncMutation[], message: string): SyncMutation[] {
  return queue.map((mutation) => ({
    ...mutation,
    retryCount: mutation.retryCount + 1,
    lastError: message,
  }));
}

export function acknowledgeMutations(queue: SyncMutation[], acknowledgedMutationIds: string[]): SyncMutation[] {
  const acknowledged = new Set(acknowledgedMutationIds);
  return queue.filter((mutation) => !acknowledged.has(mutation.id));
}

export async function flushSyncQueue(
  queue: SyncMutation[],
  sendBatch: (batch: SyncMutation[]) => Promise<SyncBatchResponse>,
  batchSize = 50,
): Promise<SyncFlushResult> {
  let remaining = queue;
  const conflicts: SyncConflict[] = [];
  let cursor: string | undefined;
  let attemptedCount = 0;

  while (remaining.length > 0) {
    const batch = remaining.slice(0, batchSize);
    attemptedCount += batch.length;
    try {
      const response = await sendBatch(batch);
      const acknowledged = response.acknowledgedMutationIds;
      remaining = acknowledgeMutations(remaining, acknowledged);
      conflicts.push(...(response.conflicts ?? []));
      cursor = response.cursor ?? cursor;

      // A successful transport response must either acknowledge a mutation or
      // leave a conflict record; otherwise stop to avoid a busy-loop.
      if (acknowledged.length === 0) break;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      remaining = retryMutations(remaining, message);
      break;
    }
  }

  return { remaining, conflicts, cursor, attemptedCount };
}
