import type {
  Assessment,
  Match,
  MatchEvent,
  Player,
  SkillRatings,
  Team,
  WorkspaceData,
} from "@/types/models";

function isoDaysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const team: Team = {
  id: "team-u12-green",
  name: "Riverside U12",
  ageGroup: "Under 12",
  season: "2026",
  playerIds: [
    "player-maya",
    "player-leo",
    "player-ava",
    "player-noah",
    "player-sofia",
    "player-ethan",
    "player-zoe",
    "player-eli",
  ],
};

const players: Player[] = [
  { id: "player-maya", teamId: team.id, name: "Maya Chen", number: 8, position: "Midfielder", accent: "#8ECDB6", joinedAt: isoDaysAgo(180) },
  { id: "player-leo", teamId: team.id, name: "Leo Martins", number: 10, position: "Forward", accent: "#E7B96A", joinedAt: isoDaysAgo(180) },
  { id: "player-ava", teamId: team.id, name: "Ava Brooks", number: 4, position: "Defender", accent: "#AFC6E9", joinedAt: isoDaysAgo(160) },
  { id: "player-noah", teamId: team.id, name: "Noah Wilson", number: 1, position: "Goalkeeper", accent: "#C4B5E8", joinedAt: isoDaysAgo(170) },
  { id: "player-sofia", teamId: team.id, name: "Sofia Garcia", number: 7, position: "Winger", accent: "#F0AFA6", joinedAt: isoDaysAgo(150) },
  { id: "player-ethan", teamId: team.id, name: "Ethan Patel", number: 6, position: "Midfielder", accent: "#9EC3C8", joinedAt: isoDaysAgo(140) },
  { id: "player-zoe", teamId: team.id, name: "Zoe Johnson", number: 3, position: "Defender", accent: "#E3C99E", joinedAt: isoDaysAgo(130) },
  { id: "player-eli", teamId: team.id, name: "Eli Thompson", number: 11, position: "Forward", accent: "#B6D49D", joinedAt: isoDaysAgo(120) },
];

function ratings(values: SkillRatings): SkillRatings {
  return values;
}

const assessments: Assessment[] = [
  {
    id: "assessment-maya-1",
    playerId: "player-maya",
    createdAt: isoDaysAgo(42),
    ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 2, defending: 1, decisionMaking: 2 }),
    note: "Scanning earlier and finding safer passes under pressure.",
  },
  {
    id: "assessment-maya-2",
    playerId: "player-maya",
    createdAt: isoDaysAgo(9),
    ratings: ratings({ ballControl: 3, passing: 3, receiving: 2, dribbling: 2, defending: 2, decisionMaking: 3 }),
    note: "Excellent awareness in central areas. Keep improving first touch when tightly marked.",
  },
  {
    id: "assessment-leo-1",
    playerId: "player-leo",
    createdAt: isoDaysAgo(14),
    ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 3, defending: 1, decisionMaking: 2 }),
    note: "Confident 1v1. Work on releasing the ball one touch earlier.",
  },
  {
    id: "assessment-ava-1",
    playerId: "player-ava",
    createdAt: isoDaysAgo(12),
    ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 1, defending: 3, decisionMaking: 2 }),
    note: "Strong body position and recovery runs.",
  },
  {
    id: "assessment-sofia-1",
    playerId: "player-sofia",
    createdAt: isoDaysAgo(28),
    ratings: ratings({ ballControl: 2, passing: 1, receiving: 2, dribbling: 3, defending: 1, decisionMaking: 2 }),
    note: "Direct and positive. Focus on final-ball accuracy.",
  },
  {
    id: "assessment-ethan-1",
    playerId: "player-ethan",
    createdAt: isoDaysAgo(6),
    ratings: ratings({ ballControl: 2, passing: 3, receiving: 2, dribbling: 2, defending: 2, decisionMaking: 2 }),
    note: "Good passing range. Can check shoulders more often before receiving.",
  },
];

const matches: Match[] = [
  {
    id: "match-next",
    teamId: team.id,
    opponent: "Northside Juniors",
    matchDate: isoDaysAgo(-2, 11),
    status: "pending",
  },
  {
    id: "match-lakeside",
    teamId: team.id,
    opponent: "Lakeside Athletic",
    matchDate: isoDaysAgo(5, 11),
    status: "completed",
    startedAt: isoDaysAgo(5, 11),
    endedAt: isoDaysAgo(5, 13),
    scoreFor: 3,
    scoreAgainst: 2,
  },
  {
    id: "match-oakfield",
    teamId: team.id,
    opponent: "Oakfield FC",
    matchDate: isoDaysAgo(19, 11),
    status: "completed",
    startedAt: isoDaysAgo(19, 11),
    endedAt: isoDaysAgo(19, 13),
    scoreFor: 1,
    scoreAgainst: 1,
  },
];

const eventSeeds: Array<Omit<MatchEvent, "id" | "matchId" | "recordedAt">> = [
  { matchMinute: 5, third: "defensive", channel: "central", outcome: "progression", pressure: "medium" },
  { matchMinute: 9, third: "middle", channel: "right", outcome: "retention", pressure: "low" },
  { matchMinute: 14, third: "attacking", channel: "right", outcome: "chance", pressure: "medium" },
  { matchMinute: 18, third: "middle", channel: "central", outcome: "turnover", pressure: "high" },
  { matchMinute: 24, third: "defensive", channel: "left", outcome: "progression", pressure: "high" },
  { matchMinute: 29, third: "middle", channel: "left", outcome: "progression", pressure: "medium" },
  { matchMinute: 33, third: "attacking", channel: "central", outcome: "chance", pressure: "medium" },
  { matchMinute: 39, third: "attacking", channel: "left", outcome: "retention", pressure: "low" },
  { matchMinute: 45, third: "middle", channel: "central", outcome: "progression", pressure: "high" },
  { matchMinute: 51, third: "attacking", channel: "central", outcome: "chance", pressure: "high" },
  { matchMinute: 57, third: "defensive", channel: "right", outcome: "turnover", pressure: "high" },
  { matchMinute: 63, third: "middle", channel: "right", outcome: "progression", pressure: "medium" },
  { matchMinute: 68, third: "attacking", channel: "right", outcome: "chance", pressure: "low" },
];

const matchEvents: MatchEvent[] = eventSeeds.map((event, index) => ({
  ...event,
  id: `event-lakeside-${index + 1}`,
  matchId: "match-lakeside",
  recordedAt: isoDaysAgo(5, 11 + Math.floor(event.matchMinute / 60)),
}));

export function createDemoWorkspace(): WorkspaceData {
  return {
    teams: [team],
    players,
    assessments,
    matches,
    matchEvents,
    settings: {
      hapticsEnabled: true,
      preferredTeamId: team.id,
    },
  };
}
