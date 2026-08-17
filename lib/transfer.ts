import { assessmentsForPlayer, averageRatings, SKILL_ACTION_MAPPING, teamSkillAverages } from "@/lib/insights";
import type { Assessment, Match, MatchEvent, PracticeSession, SkillKey } from "@/types/models";

export type TransferState = "insufficient" | "emerging" | "positive" | "watch";

export interface TransferSignal {
  skill: SkillKey;
  practiceDelta: number;
  positiveEvents: number;
  negativeEvents: number;
  taggedMatchEvents: number;
  state: TransferState;
  summary: string;
}

function signalCounts(events: MatchEvent[], skill: SkillKey): { positive: number; negative: number } {
  const mapping = SKILL_ACTION_MAPPING[skill];
  return events.reduce(
    (result, event) => ({
      positive: result.positive + (mapping.positive.includes(event.actionType) ? 1 : 0),
      negative: result.negative + (mapping.negative(event) ? 1 : 0),
    }),
    { positive: 0, negative: 0 },
  );
}

export function playerTransferSignal(
  playerId: string,
  skill: SkillKey,
  assessments: Assessment[],
  matchEvents: MatchEvent[],
): TransferSignal {
  const playerAssessments = assessmentsForPlayer(assessments, playerId);
  const latest = playerAssessments[0];
  const previous = playerAssessments[1];
  const practiceDelta = latest && previous ? latest.ratings[skill] - previous.ratings[skill] : 0;
  const postAssessmentEvents = latest
    ? matchEvents.filter((event) => event.playerId === playerId && Date.parse(event.recordedAt) >= Date.parse(latest.createdAt))
    : [];
  const { positive, negative } = signalCounts(postAssessmentEvents, skill);
  const taggedMatchEvents = postAssessmentEvents.length;
  if (!latest || !previous || taggedMatchEvents < 3) {
    return { skill, practiceDelta, positiveEvents: positive, negativeEvents: negative, taggedMatchEvents, state: "insufficient", summary: "Keep tagging this player in matches to test whether practice is carrying over." };
  }
  if (practiceDelta > 0 && positive > negative) {
    return { skill, practiceDelta, positiveEvents: positive, negativeEvents: negative, taggedMatchEvents, state: "positive", summary: "Practice progress is showing up in match actions." };
  }
  if (practiceDelta > 0 && positive <= negative) {
    return { skill, practiceDelta, positiveEvents: positive, negativeEvents: negative, taggedMatchEvents, state: "watch", summary: "Practice rating improved, but match evidence has not caught up yet." };
  }
  return { skill, practiceDelta, positiveEvents: positive, negativeEvents: negative, taggedMatchEvents, state: "emerging", summary: "Match evidence is building; keep the focus consistent for another session." };
}

export interface TeamTransferSignal {
  skill: SkillKey;
  sessions: number;
  assessmentAverage: number;
  positiveEvents: number;
  negativeEvents: number;
  state: TransferState;
  summary: string;
}

export function teamTransferSignal(
  teamId: string,
  skill: SkillKey,
  sessions: PracticeSession[],
  assessments: Assessment[],
  matchEvents: MatchEvent[],
): TeamTransferSignal {
  const focusedSessions = sessions.filter((session) => session.teamId === teamId && session.focusSkills.includes(skill));
  const average = teamSkillAverages(assessments)[skill];
  const { positive, negative } = signalCounts(matchEvents, skill);
  if (!focusedSessions.length || !assessments.length || matchEvents.length < 8) {
    return { skill, sessions: focusedSessions.length, assessmentAverage: average, positiveEvents: positive, negativeEvents: negative, state: "insufficient", summary: "Log a focused practice and more match events to see transfer." };
  }
  const state: TransferState = positive > negative ? "positive" : positive === negative ? "emerging" : "watch";
  const summary = state === "positive"
    ? "The match pattern supports the current practice focus."
    : state === "watch"
      ? "Match evidence suggests this focus needs another training block."
      : "The focus is emerging; keep collecting match evidence.";
  return { skill, sessions: focusedSessions.length, assessmentAverage: average, positiveEvents: positive, negativeEvents: negative, state, summary };
}

export interface PlayerMatchTransferPoint {
  matchId: string;
  matchDate: string;
  taggedEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  netScore: number;
  comparedToBaseline: "above" | "at" | "below" | "insufficient";
}

/**
 * Produces an interpretable per-match view rather than claiming causation.
 * A point is only graded when at least three player-tagged events exist.
 */
export function playerMatchTransferTrend(
  playerId: string,
  skill: SkillKey,
  matches: Match[],
  matchEvents: MatchEvent[],
): PlayerMatchTransferPoint[] {
  const completed = matches.filter((match) => match.status === "completed").sort((a, b) => Date.parse(a.matchDate) - Date.parse(b.matchDate));
  const raw = completed.map((match) => {
    const playerEvents = matchEvents.filter((event) => event.matchId === match.id && event.playerId === playerId);
    const { positive, negative } = signalCounts(playerEvents, skill);
    return { matchId: match.id, matchDate: match.matchDate, taggedEvents: playerEvents.length, positiveEvents: positive, negativeEvents: negative, netScore: positive - negative };
  });
  const baselineCandidates = raw.filter((point) => point.taggedEvents >= 3).slice(0, Math.max(0, raw.length - 3));
  const baseline = baselineCandidates.length ? baselineCandidates.reduce((sum, point) => sum + point.netScore, 0) / baselineCandidates.length : undefined;
  return raw.map((point) => ({
    ...point,
    comparedToBaseline: point.taggedEvents < 3 || baseline === undefined ? "insufficient" : point.netScore > baseline ? "above" : point.netScore < baseline ? "below" : "at",
  }));
}

export function teamDevelopmentAverage(assessments: Assessment[]): number {
  const averages = Object.values(teamSkillAverages(assessments));
  return averages.length ? averages.reduce((sum, value) => sum + value, 0) / averages.length : 0;
}

export function latestPracticeSessionForTeam(sessions: PracticeSession[], teamId: string): PracticeSession | undefined {
  return [...sessions].filter((session) => session.teamId === teamId).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
}
