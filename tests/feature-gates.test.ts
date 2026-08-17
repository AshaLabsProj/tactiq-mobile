import { describe, expect, it } from "vitest";

import { MockEntitlementClient } from "@/lib/entitlements";
import {
  FREE_TIER,
  gateAction,
  gateNewFocusGoal,
  gateNewPlayer,
  gateNewTeam,
  isReadOnlyAfterDowngrade,
  visibleMatchHistory,
} from "@/lib/feature-gates";
import { createDemoWorkspace } from "@/data/demo-data";

describe("Skilltracker Pro free-tier gates", () => {
  it("keeps core capture available while gating extended action detail", async () => {
    const free = await new MockEntitlementClient().getSnapshot();
    expect(gateAction("turnover", free)).toEqual({ allowed: true });
    expect(gateAction("keyPass", free)).toMatchObject({ allowed: false, feature: "extended-actions" });
  });

  it("enforces one team and eight players without deleting existing coaching records", async () => {
    const data = createDemoWorkspace();
    const free = await new MockEntitlementClient().getSnapshot();
    expect(gateNewTeam(data.teams, free)).toMatchObject({ allowed: false, feature: "extra-team" });
    const additional = Array.from({ length: FREE_TIER.playersPerTeam }, (_, index) => ({
      id: `player-${index}`,
      teamId: data.teams[0].id,
      name: `Player ${index}`,
      number: index,
      position: "MID",
      accent: "#168A68",
      joinedAt: "2026-01-01",
    }));
    expect(gateNewPlayer(additional, data.teams[0].id, free)).toMatchObject({ allowed: false, feature: "extra-player" });
    expect(isReadOnlyAfterDowngrade("extra-player", free, { ...data, players: additional }, { teamId: data.teams[0].id, id: "player-7" })).toBe(false);
  });

  it("retains only the latest three free-history records without mutating data", async () => {
    const data = createDemoWorkspace();
    const free = await new MockEntitlementClient().getSnapshot();
    const matches = Array.from({ length: 4 }, (_, index) => ({
      id: `match-${index}`,
      teamId: data.teams[0].id,
      opponent: "Test",
      matchDate: `2026-08-0${index + 1}`,
      status: "completed" as const,
      periodLengthMinutes: 25,
      currentPeriod: 2 as const,
      pausedIntervals: [],
    }));
    expect(visibleMatchHistory(matches, free).map((match) => match.id)).toEqual(["match-3", "match-2", "match-1"]);
    expect(matches).toHaveLength(4);
  });

  it("allows one active free focus goal then offers a specific Pro upgrade", async () => {
    const data = createDemoWorkspace();
    const free = await new MockEntitlementClient().getSnapshot();
    expect(gateNewFocusGoal(data.focusGoals, free)).toMatchObject({ allowed: false, feature: "extra-focus-goal" });
  });
});
