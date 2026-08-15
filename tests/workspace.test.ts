import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn(),
}));

import { createDemoWorkspace } from "@/data/demo-data";
import { workspaceReducer } from "@/contexts/workspace-context";
import { averageRatings, matchMetrics } from "@/lib/insights";
import { ACTION_BY_KEY, type Assessment, type MatchEvent } from "@/types/models";

function event(input: Pick<MatchEvent, "id" | "matchId" | "matchMinute" | "actionType" | "third" | "channel" | "pressure">): MatchEvent {
  const definition = ACTION_BY_KEY[input.actionType];
  return {
    ...input,
    period: 1,
    category: definition.category,
    valence: definition.valence,
    outcome: definition.legacyOutcome,
    recordedAt: "2026-07-16T10:01:00.000Z",
    updatedAt: "2026-07-16T10:01:00.000Z",
  };
}

describe("workspaceReducer", () => {
  it("adds an assessment without mutating the previous workspace", () => {
    const workspace = createDemoWorkspace();
    const assessment: Assessment = {
      id: "assessment-test",
      playerId: workspace.players[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: "practice",
      ratings: { ballControl: 3, passing: 2, receiving: 2, dribbling: 2, defending: 1, decisionMaking: 3 },
      note: "Test note",
    };
    const next = workspaceReducer(workspace, { type: "addAssessment", assessment });
    expect(next).not.toBe(workspace);
    expect(next.assessments[0]).toEqual(assessment);
    expect(workspace.assessments).not.toContainEqual(assessment);
  });

  it("records pause intervals and timestamps across live, paused, and completed match states", () => {
    const workspace = createDemoWorkspace();
    const match = workspace.matches[0];
    const started = workspaceReducer(workspace, { type: "setMatchStatus", matchId: match.id, status: "live", at: "2026-07-16T10:00:00.000Z" });
    const paused = workspaceReducer(started, { type: "setMatchStatus", matchId: match.id, status: "paused", at: "2026-07-16T10:10:00.000Z" });
    const resumed = workspaceReducer(paused, { type: "setMatchStatus", matchId: match.id, status: "live", at: "2026-07-16T10:15:00.000Z" });
    const completed = workspaceReducer(resumed, { type: "setMatchStatus", matchId: match.id, status: "completed", at: "2026-07-16T11:15:00.000Z" });
    const next = completed.matches.find((item) => item.id === match.id);
    expect(next?.startedAt).toBe("2026-07-16T10:00:00.000Z");
    expect(next?.endedAt).toBe("2026-07-16T11:15:00.000Z");
    expect(next?.pausedIntervals).toEqual([{ from: "2026-07-16T10:10:00.000Z", to: "2026-07-16T10:15:00.000Z" }]);
  });

  it("undoes only the latest event for the selected match", () => {
    const workspace = createDemoWorkspace();
    const matchId = "match-lakeside";
    const otherEvent = event({ id: "other-event", matchId: "match-oakfield", matchMinute: 10, third: "middle", channel: "central", actionType: "retention", pressure: "low" });
    const withOther = { ...workspace, matchEvents: [...workspace.matchEvents, otherEvent] };
    const previousCount = withOther.matchEvents.filter((item) => item.matchId === matchId).length;
    const next = workspaceReducer(withOther, { type: "undoMatchEvent", matchId });
    expect(next.matchEvents.filter((item) => item.matchId === matchId)).toHaveLength(previousCount - 1);
    expect(next.matchEvents).toContainEqual(otherEvent);
  });
});

describe("insight helpers", () => {
  it("calculates the six-skill average", () => {
    expect(averageRatings({ ballControl: 3, passing: 3, receiving: 2, dribbling: 2, defending: 1, decisionMaking: 1 })).toBe(2);
  });

  it("calculates legacy-compatible match rates and spatial leaders from expanded events", () => {
    const events: MatchEvent[] = [
      event({ id: "1", matchId: "m", matchMinute: 1, third: "middle", channel: "central", actionType: "progression", pressure: "low" }),
      event({ id: "2", matchId: "m", matchMinute: 2, third: "middle", channel: "central", actionType: "chanceCreated", pressure: "medium" }),
      event({ id: "3", matchId: "m", matchMinute: 3, third: "attacking", channel: "right", actionType: "turnover", pressure: "high" }),
      event({ id: "4", matchId: "m", matchMinute: 4, third: "middle", channel: "left", actionType: "progression", pressure: "medium" }),
    ];
    const metrics = matchMetrics(events);
    expect(metrics.progressionRate).toBe(0.5);
    expect(metrics.chanceRate).toBe(0.25);
    expect(metrics.turnoverRate).toBe(0.25);
    expect(metrics.busiestThird).toBe("middle");
    expect(metrics.busiestChannel).toBe("central");
  });
});
