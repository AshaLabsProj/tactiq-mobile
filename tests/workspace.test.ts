import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-data";
import { workspaceReducer } from "@/contexts/workspace-context";
import { averageRatings, matchMetrics } from "@/lib/insights";
import type { Assessment, MatchEvent } from "@/types/models";

describe("workspaceReducer", () => {
  it("adds an assessment without mutating the previous workspace", () => {
    const workspace = createDemoWorkspace();
    const assessment: Assessment = {
      id: "assessment-test",
      playerId: workspace.players[0].id,
      createdAt: new Date().toISOString(),
      ratings: {
        ballControl: 3,
        passing: 2,
        receiving: 2,
        dribbling: 2,
        defending: 1,
        decisionMaking: 3,
      },
      note: "Test note",
    };

    const next = workspaceReducer(workspace, { type: "addAssessment", assessment });

    expect(next).not.toBe(workspace);
    expect(next.assessments[0]).toEqual(assessment);
    expect(workspace.assessments).not.toContainEqual(assessment);
  });

  it("starts and completes a match with timestamps", () => {
    const workspace = createDemoWorkspace();
    const match = workspace.matches[0];
    const started = workspaceReducer(workspace, {
      type: "setMatchStatus",
      matchId: match.id,
      status: "live",
      at: "2026-07-16T10:00:00.000Z",
    });
    const completed = workspaceReducer(started, {
      type: "setMatchStatus",
      matchId: match.id,
      status: "completed",
      at: "2026-07-16T11:15:00.000Z",
    });

    expect(started.matches.find((item) => item.id === match.id)?.startedAt).toBe(
      "2026-07-16T10:00:00.000Z",
    );
    expect(completed.matches.find((item) => item.id === match.id)?.endedAt).toBe(
      "2026-07-16T11:15:00.000Z",
    );
  });

  it("undoes only the latest event for the selected match", () => {
    const workspace = createDemoWorkspace();
    const matchId = "match-lakeside";
    const otherEvent: MatchEvent = {
      id: "other-event",
      matchId: "match-oakfield",
      matchMinute: 10,
      third: "middle",
      channel: "central",
      outcome: "retention",
      pressure: "low",
      recordedAt: "2026-07-16T10:10:00.000Z",
    };
    const withOther = { ...workspace, matchEvents: [...workspace.matchEvents, otherEvent] };
    const previousCount = withOther.matchEvents.filter((event) => event.matchId === matchId).length;

    const next = workspaceReducer(withOther, { type: "undoMatchEvent", matchId });

    expect(next.matchEvents.filter((event) => event.matchId === matchId)).toHaveLength(previousCount - 1);
    expect(next.matchEvents).toContainEqual(otherEvent);
  });
});

describe("insight helpers", () => {
  it("calculates the six-skill average", () => {
    expect(
      averageRatings({
        ballControl: 3,
        passing: 3,
        receiving: 2,
        dribbling: 2,
        defending: 1,
        decisionMaking: 1,
      }),
    ).toBe(2);
  });

  it("calculates match rates and spatial leaders", () => {
    const events: MatchEvent[] = [
      {
        id: "1",
        matchId: "m",
        matchMinute: 1,
        third: "middle",
        channel: "central",
        outcome: "progression",
        pressure: "low",
        recordedAt: "2026-07-16T10:01:00.000Z",
      },
      {
        id: "2",
        matchId: "m",
        matchMinute: 2,
        third: "middle",
        channel: "central",
        outcome: "chance",
        pressure: "medium",
        recordedAt: "2026-07-16T10:02:00.000Z",
      },
      {
        id: "3",
        matchId: "m",
        matchMinute: 3,
        third: "attacking",
        channel: "right",
        outcome: "turnover",
        pressure: "high",
        recordedAt: "2026-07-16T10:03:00.000Z",
      },
      {
        id: "4",
        matchId: "m",
        matchMinute: 4,
        third: "middle",
        channel: "left",
        outcome: "progression",
        pressure: "medium",
        recordedAt: "2026-07-16T10:04:00.000Z",
      },
    ];

    const metrics = matchMetrics(events);

    expect(metrics.progressionRate).toBe(0.5);
    expect(metrics.chanceRate).toBe(0.25);
    expect(metrics.turnoverRate).toBe(0.25);
    expect(metrics.busiestThird).toBe("middle");
    expect(metrics.busiestChannel).toBe("central");
  });
});
