import {
  ACTION_BY_KEY,
  type ActionType,
  type Assessment,
  type FocusGoal,
  type Match,
  type MatchEvent,
  type Player,
  type PracticeSession,
  type SkillRatings,
  type Team,
  type WorkspaceData,
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
    "player-maya", "player-leo", "player-ava", "player-noah",
    "player-sofia", "player-ethan", "player-zoe", "player-eli",
  ],
  createdAt: isoDaysAgo(180),
  updatedAt: isoDaysAgo(1),
};

const players: Player[] = [
  { id: "player-maya", teamId: team.id, name: "Maya Chen", number: 8, position: "Midfielder", accent: "#8ECDB6", joinedAt: isoDaysAgo(180), createdAt: isoDaysAgo(180), updatedAt: isoDaysAgo(1) },
  { id: "player-leo", teamId: team.id, name: "Leo Martins", number: 10, position: "Forward", accent: "#E7B96A", joinedAt: isoDaysAgo(180), createdAt: isoDaysAgo(180), updatedAt: isoDaysAgo(1) },
  { id: "player-ava", teamId: team.id, name: "Ava Brooks", number: 4, position: "Defender", accent: "#A8D5C2", joinedAt: isoDaysAgo(160), createdAt: isoDaysAgo(160), updatedAt: isoDaysAgo(1) },
  { id: "player-noah", teamId: team.id, name: "Noah Wilson", number: 1, position: "Goalkeeper", accent: "#C4B5E8", joinedAt: isoDaysAgo(170), createdAt: isoDaysAgo(170), updatedAt: isoDaysAgo(1) },
  { id: "player-sofia", teamId: team.id, name: "Sofia Garcia", number: 7, position: "Winger", accent: "#F0AFA6", joinedAt: isoDaysAgo(150), createdAt: isoDaysAgo(150), updatedAt: isoDaysAgo(1) },
  { id: "player-ethan", teamId: team.id, name: "Ethan Patel", number: 6, position: "Midfielder", accent: "#9EC3C8", joinedAt: isoDaysAgo(140), createdAt: isoDaysAgo(140), updatedAt: isoDaysAgo(1) },
  { id: "player-zoe", teamId: team.id, name: "Zoe Johnson", number: 3, position: "Defender", accent: "#E3C99E", joinedAt: isoDaysAgo(130), createdAt: isoDaysAgo(130), updatedAt: isoDaysAgo(1) },
  { id: "player-eli", teamId: team.id, name: "Eli Thompson", number: 11, position: "Forward", accent: "#B6D49D", joinedAt: isoDaysAgo(120), createdAt: isoDaysAgo(120), updatedAt: isoDaysAgo(1) },
];

const practiceSessions: PracticeSession[] = [
  {
    id: "session-possession",
    teamId: team.id,
    date: isoDaysAgo(9),
    focusSkills: ["ballControl", "passing"],
    attendeeIds: players.map((player) => player.id),
    note: "Receiving under pressure and first forward pass decisions.",
    createdAt: isoDaysAgo(9),
    updatedAt: isoDaysAgo(9),
  },
  {
    id: "session-final-third",
    teamId: team.id,
    date: isoDaysAgo(2),
    focusSkills: ["decisionMaking", "dribbling"],
    attendeeIds: players.filter((player) => player.id !== "player-noah").map((player) => player.id),
    note: "Create a 1v1 advantage then find the final action.",
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(2),
  },
];

function ratings(values: SkillRatings): SkillRatings {
  return values;
}

const assessments: Assessment[] = [
  { id: "assessment-maya-1", playerId: "player-maya", createdAt: isoDaysAgo(42), updatedAt: isoDaysAgo(42), context: "practice", ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 2, defending: 1, decisionMaking: 2 }), note: "Scanning earlier and finding safer passes under pressure." },
  { id: "assessment-maya-2", playerId: "player-maya", createdAt: isoDaysAgo(9), updatedAt: isoDaysAgo(9), context: "practice", sessionId: "session-possession", ratings: ratings({ ballControl: 3, passing: 3, receiving: 2, dribbling: 2, defending: 2, decisionMaking: 3 }), note: "Excellent awareness in central areas. Keep improving first touch when tightly marked." },
  { id: "assessment-maya-3", playerId: "player-maya", createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2), context: "practice", sessionId: "session-final-third", ratings: ratings({ ballControl: 3, passing: 3, receiving: 3, dribbling: 2, defending: 2, decisionMaking: 3 }), note: "Sharper first touch and better decisions in the final third." },
  { id: "assessment-leo-1", playerId: "player-leo", createdAt: isoDaysAgo(14), updatedAt: isoDaysAgo(14), context: "practice", sessionId: "session-possession", ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 3, defending: 1, decisionMaking: 2 }), note: "Confident 1v1. Work on releasing the ball one touch earlier." },
  { id: "assessment-ava-1", playerId: "player-ava", createdAt: isoDaysAgo(12), updatedAt: isoDaysAgo(12), context: "practice", sessionId: "session-possession", ratings: ratings({ ballControl: 2, passing: 2, receiving: 2, dribbling: 1, defending: 3, decisionMaking: 2 }), note: "Strong body position and recovery runs." },
  { id: "assessment-sofia-1", playerId: "player-sofia", createdAt: isoDaysAgo(28), updatedAt: isoDaysAgo(28), context: "practice", ratings: ratings({ ballControl: 2, passing: 1, receiving: 2, dribbling: 3, defending: 1, decisionMaking: 2 }), note: "Direct and positive. Focus on final-ball accuracy." },
  { id: "assessment-ethan-1", playerId: "player-ethan", createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(6), context: "practice", sessionId: "session-final-third", ratings: ratings({ ballControl: 2, passing: 3, receiving: 2, dribbling: 2, defending: 2, decisionMaking: 2 }), note: "Good passing range. Can check shoulders more often before receiving." },
];

const focusGoals: FocusGoal[] = [
  {
    id: "goal-team-ball-control",
    teamId: team.id,
    skill: "ballControl",
    note: "Reduce turnovers under pressure in Build and Connect zones.",
    setAt: isoDaysAgo(9),
    reviewBy: isoDaysAgo(-5),
    status: "active",
    createdAt: isoDaysAgo(9),
    updatedAt: isoDaysAgo(9),
  },
  {
    id: "goal-leo-passing",
    playerId: "player-leo",
    skill: "passing",
    note: "Find the earlier release after a 1v1 win.",
    setAt: isoDaysAgo(8),
    reviewBy: isoDaysAgo(6),
    status: "active",
    createdAt: isoDaysAgo(8),
    updatedAt: isoDaysAgo(8),
  },
];

const matches: Match[] = [
  {
    id: "match-next", teamId: team.id, opponent: "Northside Juniors", matchDate: isoDaysAgo(-2, 11), status: "pending",
    periodLengthMinutes: 25, currentPeriod: 1, pausedIntervals: [], createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1),
  },
  {
    id: "match-lakeside", teamId: team.id, opponent: "Lakeside Athletic", matchDate: isoDaysAgo(5, 11), status: "completed",
    startedAt: isoDaysAgo(5, 11), endedAt: isoDaysAgo(5, 13), periodLengthMinutes: 30, currentPeriod: 2,
    pausedIntervals: [{ from: isoDaysAgo(5, 11, ), to: isoDaysAgo(5, 12) }], createdAt: isoDaysAgo(5, 10), updatedAt: isoDaysAgo(5, 13),
  },
  {
    id: "match-oakfield", teamId: team.id, opponent: "Oakfield FC", matchDate: isoDaysAgo(19, 11), status: "completed",
    startedAt: isoDaysAgo(19, 11), endedAt: isoDaysAgo(19, 13), periodLengthMinutes: 30, currentPeriod: 2,
    pausedIntervals: [], scoreFor: 1, scoreAgainst: 1, createdAt: isoDaysAgo(19, 10), updatedAt: isoDaysAgo(19, 13),
  },
];

type EventSeed = {
  actionType: ActionType;
  minute: number;
  playerId?: string;
  third?: MatchEvent["third"];
  channel?: MatchEvent["channel"];
  pressure?: MatchEvent["pressure"];
  detail?: MatchEvent["detail"];
};

const actionSeeds: EventSeed[] = [
  { actionType: "goalFor", minute: 8, playerId: "player-leo", third: "attacking", channel: "central", pressure: "medium" },
  { actionType: "goalAgainst", minute: 12, third: "defensive", channel: "central", pressure: "high" },
  { actionType: "shotOnTarget", minute: 16, playerId: "player-sofia", third: "attacking", channel: "left" },
  { actionType: "shotOffTarget", minute: 18, playerId: "player-maya", third: "attacking", channel: "right" },
  { actionType: "chanceCreated", minute: 21, playerId: "player-maya", third: "attacking", channel: "central", pressure: "medium" },
  { actionType: "progression", minute: 24, playerId: "player-ethan", third: "middle", channel: "right", pressure: "high" },
  { actionType: "retention", minute: 26, playerId: "player-maya", third: "middle", channel: "central", pressure: "high" },
  { actionType: "turnover", minute: 29, playerId: "player-leo", third: "attacking", channel: "left", pressure: "high" },
  { actionType: "regain", minute: 31, playerId: "player-ava", third: "attacking", channel: "right", pressure: "medium" },
  { actionType: "clearance", minute: 33, playerId: "player-zoe", third: "defensive", channel: "central" },
  { actionType: "save", minute: 35, playerId: "player-noah", third: "defensive", channel: "central", pressure: "high" },
  { actionType: "setPieceWon", minute: 37, playerId: "player-sofia", third: "attacking", channel: "left" },
  { actionType: "assist", minute: 39, playerId: "player-maya", third: "attacking", channel: "central" },
  { actionType: "keyPass", minute: 41, playerId: "player-ethan", third: "attacking", channel: "right" },
  { actionType: "cross", minute: 43, playerId: "player-sofia", third: "attacking", channel: "left" },
  { actionType: "dribbleWon", minute: 45, playerId: "player-leo", third: "attacking", channel: "right", pressure: "medium" },
  { actionType: "tackleWon", minute: 47, playerId: "player-ava", third: "middle", channel: "central", pressure: "high" },
  { actionType: "interception", minute: 49, playerId: "player-zoe", third: "middle", channel: "left", pressure: "medium" },
  { actionType: "aerialWon", minute: 51, playerId: "player-ava", third: "defensive", channel: "central" },
  { actionType: "foulWon", minute: 53, playerId: "player-sofia", third: "attacking", channel: "right" },
  { actionType: "foulCommitted", minute: 54, playerId: "player-eli", third: "middle", channel: "central" },
  { actionType: "offside", minute: 55, playerId: "player-eli", third: "attacking", channel: "central" },
  { actionType: "card", minute: 57, playerId: "player-zoe", detail: "yellow" },
  { actionType: "substitution", minute: 60, detail: { playerOffId: "player-eli", playerOnId: "player-sofia" } },
];

const matchEvents: MatchEvent[] = actionSeeds.map((seed, index) => {
  const definition = ACTION_BY_KEY[seed.actionType];
  const period = seed.minute <= 30 ? 1 : 2;
  return {
    id: `event-lakeside-${index + 1}`,
    matchId: "match-lakeside",
    matchMinute: seed.minute,
    period,
    third: seed.third,
    channel: seed.channel,
    actionType: seed.actionType,
    category: definition.category,
    valence: definition.valence,
    outcome: definition.legacyOutcome,
    pressure: seed.pressure ?? "medium",
    playerId: seed.playerId,
    detail: seed.detail,
    recordedAt: isoDaysAgo(5, 11 + Math.floor(seed.minute / 60)),
    updatedAt: isoDaysAgo(5, 11 + Math.floor(seed.minute / 60)),
  };
});

export function createDemoWorkspace(): WorkspaceData {
  return {
    teams: [team],
    players,
    practiceSessions,
    assessments,
    focusGoals,
    matches,
    matchEvents,
    settings: {
      hapticsEnabled: true,
      preferredTeamId: team.id,
      detailedTaggingEnabled: false,
      defaultPressure: "medium",
      playerTaggingEnabled: true,
      periodLengthMinutes: 25,
    },
  };
}
