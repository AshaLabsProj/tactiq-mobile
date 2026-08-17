import { describe, expect, it } from "vitest";
import { matchContextNarrative, matchPeriodContext, matchPressureContext } from "@/lib/match-context";
import type { MatchEvent } from "@/types/models";

const event = (id: string, period: 1 | 2, pressure: "low" | "medium" | "high", actionType: MatchEvent["actionType"]): MatchEvent => ({ id, matchId: "m1", matchMinute: 1, period, pressure, actionType, category: "possession", valence: actionType === "turnover" ? "negative" : "positive", recordedAt: "2026-08-16T10:00:00.000Z" });

describe("match context analytics", () => {
  const events = [event("1", 1, "high", "turnover"), event("2", 1, "high", "turnover"), event("3", 1, "high", "regain"), event("4", 2, "low", "progression")];
  it("groups match evidence by period and pressure", () => {
    expect(matchPeriodContext(events).map((slice) => slice.events)).toEqual([3, 1]);
    expect(matchPressureContext(events).find((slice) => slice.label === "High pressure")?.negative).toBe(2);
  });
  it("makes a conservative high-pressure cue", () => {
    expect(matchContextNarrative(events)).toContain("High pressure");
  });
});
