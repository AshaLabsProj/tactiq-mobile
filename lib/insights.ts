import type {
  Assessment,
  MatchEvent,
  MatchOutcome,
  PitchChannel,
  PitchThird,
  SkillKey,
  SkillRatings,
} from "@/types/models";
import { SKILL_LABELS } from "@/types/models";

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[];

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

export function strongestAndFocus(ratings: SkillRatings): {
  strongest: SkillKey;
  focus: SkillKey;
} {
  const ordered = [...SKILL_KEYS].sort((a, b) => ratings[b] - ratings[a]);
  return { strongest: ordered[0], focus: ordered[ordered.length - 1] };
}

export function improvementBetween(assessments: Assessment[]): number {
  if (assessments.length < 2) return 0;
  const sorted = [...assessments].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
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

export interface MatchMetrics {
  totalEvents: number;
  progressionRate: number;
  chanceRate: number;
  turnoverRate: number;
  busiestThird: PitchThird | null;
  busiestChannel: PitchChannel | null;
  outcomeCounts: Record<MatchOutcome, number>;
}

export function matchMetrics(events: MatchEvent[]): MatchMetrics {
  const outcomeCounts: Record<MatchOutcome, number> = {
    progression: 0,
    chance: 0,
    retention: 0,
    turnover: 0,
  };
  const thirdCounts: Record<PitchThird, number> = { defensive: 0, middle: 0, attacking: 0 };
  const channelCounts: Record<PitchChannel, number> = { left: 0, central: 0, right: 0 };

  events.forEach((event) => {
    outcomeCounts[event.outcome] += 1;
    thirdCounts[event.third] += 1;
    channelCounts[event.channel] += 1;
  });

  const totalEvents = events.length;
  const mostUsed = <T extends string>(counts: Record<T, number>): T | null => {
    if (!totalEvents) return null;
    return (Object.entries(counts) as Array<[T, number]>).sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    totalEvents,
    progressionRate: totalEvents ? outcomeCounts.progression / totalEvents : 0,
    chanceRate: totalEvents ? outcomeCounts.chance / totalEvents : 0,
    turnoverRate: totalEvents ? outcomeCounts.turnover / totalEvents : 0,
    busiestThird: mostUsed(thirdCounts),
    busiestChannel: mostUsed(channelCounts),
    outcomeCounts,
  };
}

export function matchInsights(events: MatchEvent[]): string[] {
  const metrics = matchMetrics(events);
  if (!metrics.totalEvents) return ["Record match events to reveal tactical patterns."];

  const insights: string[] = [];
  if (metrics.progressionRate >= 0.35) {
    insights.push("Progression was a clear strength; keep supporting the next forward option.");
  } else {
    insights.push("Build-up stalled often; create a closer support angle before playing forward.");
  }

  if (metrics.turnoverRate >= 0.3) {
    insights.push("Turnovers were frequent; slow the next action when pressure is high.");
  } else {
    insights.push("Ball security was steady across the recorded phases.");
  }

  if (metrics.chanceRate >= 0.2) {
    insights.push("Attacking entries produced chances at a useful rate.");
  } else {
    insights.push("More attacking entries need to end with a shot or decisive final pass.");
  }

  return insights.slice(0, 3);
}
