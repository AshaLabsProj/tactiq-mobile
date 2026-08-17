import { ACTION_BY_KEY, type Match, type MatchEvent, type Pressure } from "@/types/models";

export interface ContextSlice {
  label: string;
  events: number;
  positive: number;
  negative: number;
  neutral: number;
  positiveRate: number | null;
}

function slice(label: string, events: MatchEvent[]): ContextSlice {
  const positive = events.filter((event) => ACTION_BY_KEY[event.actionType].valence === "positive").length;
  const negative = events.filter((event) => ACTION_BY_KEY[event.actionType].valence === "negative").length;
  return { label, events: events.length, positive, negative, neutral: events.length - positive - negative, positiveRate: events.length ? Math.round((positive / events.length) * 100) : null };
}

export function matchPeriodContext(events: MatchEvent[]): ContextSlice[] {
  return ([1, 2] as const).map((period) => slice(`Period ${period}`, events.filter((event) => event.period === period)));
}

export function matchPressureContext(events: MatchEvent[]): ContextSlice[] {
  return (["low", "medium", "high"] as Pressure[]).map((pressure) => slice(`${pressure.slice(0, 1).toUpperCase()}${pressure.slice(1)} pressure`, events.filter((event) => event.pressure === pressure)));
}

export function matchContextNarrative(events: MatchEvent[]): string {
  if (events.length < 4) return "Record a few more moments to surface a useful match pattern.";
  const periods = matchPeriodContext(events).filter((entry) => entry.events);
  const pressure = matchPressureContext(events).find((entry) => entry.label === "High pressure");
  const strongestPeriod = [...periods].sort((a, b) => (b.positiveRate ?? -1) - (a.positiveRate ?? -1))[0];
  if (pressure && pressure.events >= 3 && pressure.positiveRate !== null && pressure.positiveRate < 45) {
    return `High pressure was the clearest test today. Keep the next practice focused on receiving and releasing under pressure.`;
  }
  if (strongestPeriod?.positiveRate !== null) {
    return `${strongestPeriod.label} carried the most positive actions (${strongestPeriod.positiveRate}%). Use that phase as the reference point for your next session.`;
  }
  return "The match log is building. Review the highest-activity area with the team before the next practice.";
}

export function matchForEvent(event: MatchEvent, matches: Match[]): Match | undefined {
  return matches.find((match) => match.id === event.matchId);
}
