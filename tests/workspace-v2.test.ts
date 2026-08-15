import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-data";
import { derivedScore, elapsedMatchSeconds, matchMetrics, SKILL_ACTION_MAPPING } from "@/lib/insights";
import { flushSyncQueue } from "@/lib/sync-queue";
import { playerTransferSignal, teamTransferSignal } from "@/lib/transfer";
import { migrateWorkspaceV1, parseAndMigrateWorkspace } from "@/lib/workspace-migration";
import { ACTION_DEFINITIONS, type SyncMutation } from "@/types/models";

describe("v1 to v2 workspace migration", () => {
  it("maps every legacy outcome, preserves IDs, and supplies v2 defaults", () => {
    const legacy = createDemoWorkspace();
    const legacyLike = {
      ...legacy,
      assessments: legacy.assessments.map(({ context: _context, sessionId: _sessionId, updatedAt: _updatedAt, ...assessment }) => assessment),
      practiceSessions: undefined,
      focusGoals: undefined,
      matches: legacy.matches.map(({ periodLengthMinutes: _length, currentPeriod: _period, pausedIntervals: _pauses, ...match }) => match),
      matchEvents: legacy.matchEvents.map(({ actionType: _action, category: _category, valence: _valence, period: _period, updatedAt: _updatedAt, ...event }) => event),
      settings: { hapticsEnabled: true, preferredTeamId: legacy.settings.preferredTeamId },
    };
    const migrated = migrateWorkspaceV1(legacyLike);
    expect(migrated.matchEvents).toHaveLength(legacy.matchEvents.length);
    expect(migrated.matchEvents.every((event) => event.actionType && event.category && event.valence && event.period === 1)).toBe(true);
    expect(migrated.assessments.every((assessment) => assessment.context === "practice")).toBe(true);
    expect(migrated.settings.defaultPressure).toBe("medium");
    expect(migrated.settings.periodLengthMinutes).toBe(25);
  });

  it("recognizes a persisted v2 envelope without re-migrating it", () => {
    const workspace = createDemoWorkspace();
    const parsed = parseAndMigrateWorkspace({ version: 2, data: workspace, syncCursor: "cursor-1" });
    expect(parsed?.version).toBe(2);
    expect(parsed?.syncCursor).toBe("cursor-1");
    expect(parsed?.data).toEqual(workspace);
  });
});

describe("match foundations", () => {
  it("defines all 24 actions with unique keys and a core/extended split", () => {
    expect(ACTION_DEFINITIONS).toHaveLength(24);
    expect(new Set(ACTION_DEFINITIONS.map((action) => action.key)).size).toBe(24);
    expect(ACTION_DEFINITIONS.filter((action) => action.tier === "core")).toHaveLength(12);
    expect(ACTION_DEFINITIONS.filter((action) => action.tier === "extended")).toHaveLength(12);
  });

  it("derives score from goal events unless a manual correction exists", () => {
    const events = createDemoWorkspace().matchEvents;
    expect(derivedScore(events)).toEqual({ scoreFor: 1, scoreAgainst: 1 });
    expect(derivedScore(events, { scoreFor: 3, scoreAgainst: 2 })).toEqual({ scoreFor: 3, scoreAgainst: 2 });
  });

  it("derives elapsed time from the start and completed pause intervals", () => {
    const elapsed = elapsedMatchSeconds({
      startedAt: "2026-08-01T10:00:00.000Z",
      status: "live",
      pausedIntervals: [{ from: "2026-08-01T10:05:00.000Z", to: "2026-08-01T10:07:00.000Z" }],
    }, Date.parse("2026-08-01T10:12:00.000Z"));
    expect(elapsed).toBe(600);
  });

  it("calculates expanded team metrics and exposes the shared skill mapping", () => {
    const metrics = matchMetrics(createDemoWorkspace().matchEvents);
    expect(metrics.shots).toBe(2);
    expect(metrics.goals).toBe(1);
    expect(metrics.highRegains).toBe(1);
    expect(SKILL_ACTION_MAPPING.dribbling.positive).toContain("dribbleWon");
  });

  it("labels transfer as insufficient until a player has assessments and tagged match evidence", () => {
    const workspace = createDemoWorkspace();
    const playerSignal = playerTransferSignal("player-leo", "dribbling", workspace.assessments, workspace.matchEvents);
    expect(playerSignal.state).toBe("insufficient");
    const teamSignal = teamTransferSignal("team-u12-green", "ballControl", workspace.practiceSessions, workspace.assessments, workspace.matchEvents);
    expect(teamSignal.sessions).toBeGreaterThan(0);
    expect(["positive", "emerging", "watch"]).toContain(teamSignal.state);
  });
});

describe("durable sync queue", () => {
  const queue: SyncMutation[] = [
    { id: "m1", entity: "player", operation: "upsert", recordId: "p1", payload: { id: "p1" }, createdAt: "2026-08-01T00:00:00.000Z", retryCount: 0 },
    { id: "m2", entity: "matchEvent", operation: "upsert", recordId: "e1", payload: { id: "e1" }, createdAt: "2026-08-01T00:00:01.000Z", retryCount: 0 },
  ];

  it("flushes acknowledged mutations and retains conflict logging", async () => {
    const result = await flushSyncQueue(queue, async () => ({
      acknowledgedMutationIds: ["m1", "m2"],
      conflicts: [{ mutationId: "m2", entity: "matchEvent", recordId: "e1", loggedAt: "2026-08-01T01:00:00.000Z" }],
      cursor: "c2",
    }));
    expect(result.remaining).toHaveLength(0);
    expect(result.conflicts).toHaveLength(1);
    expect(result.cursor).toBe("c2");
  });

  it("increments retries and preserves the queue after a transport failure", async () => {
    const result = await flushSyncQueue(queue, async () => { throw new Error("offline"); });
    expect(result.remaining).toHaveLength(2);
    expect(result.remaining.every((mutation) => mutation.retryCount === 1)).toBe(true);
    expect(result.remaining.every((mutation) => mutation.lastError === "offline")).toBe(true);
  });
});
