import {
  ACTION_DEFINITIONS,
  ACTION_BY_KEY,
  SKILL_KEYS,
  SKILL_LABELS,
  type ActionType,
  type Assessment,
  type Match,
  type MatchEvent,
  type MatchOutcome,
  type PitchChannel,
  type PitchThird,
  type SkillKey,
  type SkillRatings,
} from "@/types/models";

export function averageRatings(ratings: SkillRatings): number {
  return SKILL_KEYS.reduce((sum, key) => sum + ratings[key], 0) / SKILL_KEYS.length;
}

export function latestAssessmentForPlayer(
  assessments: Assessment[],
  playerId: string,
): Assessment | undefined {
  return assessments
    .filter((assessment) => assessment.playerId === playerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function assessmentsForPlayer(assessments: Assessment[], playerId: string): Assessment[] {
  return assessments
    .filter((assessment) => assessment.playerId === playerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function strongestAndFocus(ratings: SkillRatings): { strongest: SkillKey; focus: SkillKey } {
  const ordered = [...SKILL_KEYS].sort((a, b) => ratings[b] - ratings[a]);
  return { strongest: ordered[0], focus: ordered[ordered.length - 1] };
}

export function improvementBetween(assessments: Assessment[]): number {
  if (assessments.length < 2) return 0;
  const sorted = [...assessments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return averageRatings(sorted[0].ratings) - averageRatings(sorted[1].ratings);
}

export function teamSkillAverages(assessments: Assessment[]): Record<SkillKey, number> {
  const latestByPlayer = new Map<string, Assessment>();
  [...assessments]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .forEach((assessment) => {
      if (!latestByPlayer.has(assessment.playerId)) latestByPlayer.set(assessment.playerId, assessment);
    });
  const latest = [...latestByPlayer.values()];
  return SKILL_KEYS.reduce(
    (result, key) => {
      result[key] = latest.length
        ? latest.reduce((sum, assessment) => sum + assessment.ratings[key], 0) / latest.length
        : 0;
      return result;
    },
    {} as Record<SkillKey, number>,
  );
}

export function actionCounts(events: MatchEvent[]): Record<ActionType, number> {
  const counts = {} as Record<ActionType, number>;
  ACTION_DEFINITIONS.forEach((action) => { counts[action.key] = 0; });
  events.forEach((event) => { counts[event.actionType] += 1; });
  return counts;
}

export function derivedScore(events: MatchEvent[], match?: Pick<Match, "scoreFor" | "scoreAgainst">): { scoreFor: number; scoreAgainst: number } {
  if (match?.scoreFor !== undefined && match.scoreAgainst !== undefined) {
    return { scoreFor: match.scoreFor, scoreAgainst: match.scoreAgainst };
  }
  const counts = actionCounts(events);
  return { scoreFor: counts.goalFor, scoreAgainst: counts.goalAgainst };
}

export function elapsedMatchSeconds(match: Pick<Match, "startedAt" | "endedAt" | "pausedIntervals" | "status">, nowMs = Date.now()): number {
  if (!match.startedAt) return 0;
  const startedMs = Date.parse(match.startedAt);
  const pausedMs = match.pausedIntervals.reduce((total, interval) => {
    const from = Date.parse(interval.from);
    const to = interval.to ? Date.parse(interval.to) : nowMs;
    return total + Math.max(0, to - from);
  }, 0);
  const currentlyPaused = match.status === "paused" && !match.pausedIntervals.at(-1)?.to;
  const endMs = currentlyPaused
    ? Date.parse(match.pausedIntervals.at(-1)?.from ?? match.startedAt)
    : match.endedAt
      ? Date.parse(match.endedAt)
      : nowMs;
  return Math.max(0, Math.floor((endMs - startedMs - pausedMs) / 1000));
}

export interface MatchMetrics {
  totalEvents: number;
  progressionRate: number;
  chanceRate: number;
  turnoverRate: number;
  busiestThird: PitchThird | null;
  busiestChannel: PitchChannel | null;
  outcomeCounts: Record<MatchOutcome, number>;
  actionCounts: Record<ActionType, number>;
  shots: number;
  shotOnTarget: number;
  shotAccuracy: number;
  goals: number;
  goalsAgainst: number;
  chancesCreated: number;
  regains: number;
  highRegains: number;
  clearances: number;
  saves: number;
  setPiecesWon: number;
  turnoverUnderPressure: number;
}

export function matchMetrics(events: MatchEvent[]): MatchMetrics {
  const allActionCounts = actionCounts(events);
  const outcomeCounts: Record<MatchOutcome, number> = {
    progression: allActionCounts.progression,
    chance: allActionCounts.chanceCreated,
    retention: allActionCounts.retention,
    turnover: allActionCounts.turnover,
  };
  const thirdCounts: Record<PitchThird, number> = { defensive: 0, middle: 0, attacking: 0 };
  const channelCounts: Record<PitchChannel, number> = { left: 0, central: 0, right: 0 };
  events.forEach((event) => {
    if (event.third) thirdCounts[event.third] += 1;
    if (event.channel) channelCounts[event.channel] += 1;
  });
  const totalEvents = events.length;
  const mostUsed = <T extends string>(counts: Record<T, number>): T | null => {
    const entries = Object.entries(counts) as Array<[T, number]>;
    if (!entries.some(([, count]) => count > 0)) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };
  const shots = allActionCounts.shotOnTarget + allActionCounts.shotOffTarget;
  const highRegains = events.filter((event) => event.actionType === "regain" && event.third === "attacking").length;
  const turnoverUnderPressure = events.filter(
    (event) => event.actionType === "turnover" && (event.pressure === "medium" || event.pressure === "high"),
  ).length;
  return {
    totalEvents,
    progressionRate: totalEvents ? outcomeCounts.progression / totalEvents : 0,
    chanceRate: totalEvents ? outcomeCounts.chance / totalEvents : 0,
    turnoverRate: totalEvents ? outcomeCounts.turnover / totalEvents : 0,
    busiestThird: mostUsed(thirdCounts),
    busiestChannel: mostUsed(channelCounts),
    outcomeCounts,
    actionCounts: allActionCounts,
    shots,
    shotOnTarget: allActionCounts.shotOnTarget,
    shotAccuracy: shots ? allActionCounts.shotOnTarget / shots : 0,
    goals: allActionCounts.goalFor,
    goalsAgainst: allActionCounts.goalAgainst,
    chancesCreated: allActionCounts.chanceCreated,
    regains: allActionCounts.regain + allActionCounts.tackleWon + allActionCounts.interception,
    highRegains,
    clearances: allActionCounts.clearance,
    saves: allActionCounts.save,
    setPiecesWon: allActionCounts.setPieceWon,
    turnoverUnderPressure,
  };
}

export function matchInsights(events: MatchEvent[]): string[] {
  const metrics = matchMetrics(events);
  if (!metrics.totalEvents) return ["Record match events to reveal tactical patterns."];
  const insights: string[] = [];
  if (metrics.highRegains >= 3) insights.push("Your high press is winning the ball in the Create zone.");
  if (metrics.turnoverRate >= 0.3) insights.push("Ball security dropped; give the player in possession a closer support option.");
  if (metrics.shots > 0 && metrics.shotAccuracy < 0.4) insights.push("You reached shooting positions, but more attempts need to test the goalkeeper.");
  if (metrics.chancesCreated >= 3) insights.push("Your attacks produced repeatable chances — keep creating the next forward option.");
  if (!insights.length) insights.push("The event balance was steady. Keep tagging to make the next coaching cue more specific.");
  return insights.slice(0, 3);
}

export const SKILL_ACTION_MAPPING: Record<SkillKey, { positive: ActionType[]; negative: (event: MatchEvent) => boolean }> = {
  ballControl: {
    positive: ["retention"],
    negative: (event) => event.actionType === "turnover" && (event.pressure === "medium" || event.pressure === "high"),
  },
  passing: {
    positive: ["progression", "keyPass", "assist", "cross"],
    negative: (event) => event.actionType === "turnover" && (event.third === "defensive" || event.third === "middle"),
  },
  receiving: {
    positive: ["retention"],
    negative: (event) => event.actionType === "turnover" && event.pressure === "high",
  },
  dribbling: {
    positive: ["dribbleWon"],
    negative: (event) => event.actionType === "turnover" && (event.channel === "left" || event.channel === "right"),
  },
  defending: {
    positive: ["tackleWon", "regain", "clearance", "aerialWon"],
    negative: (event) => event.actionType === "goalAgainst" || event.actionType === "foulCommitted",
  },
  decisionMaking: {
    positive: ["interception", "chanceCreated", "setPieceWon"],
    negative: (event) => event.actionType === "offside" || (event.actionType === "turnover" && event.third === "attacking"),
  },
};

export function actionDefinition(actionType: ActionType) {
  return ACTION_BY_KEY[actionType];
}
