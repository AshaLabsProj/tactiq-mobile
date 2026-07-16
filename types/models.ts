export type SkillKey =
  | "ballControl"
  | "passing"
  | "receiving"
  | "dribbling"
  | "defending"
  | "decisionMaking";

export type Rating = 1 | 2 | 3;

export type SkillRatings = Record<SkillKey, Rating>;

export interface Team {
  id: string;
  name: string;
  ageGroup: string;
  season: string;
  playerIds: string[];
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position: string;
  accent: string;
  joinedAt: string;
}

export interface Assessment {
  id: string;
  playerId: string;
  createdAt: string;
  ratings: SkillRatings;
  note: string;
}

export type MatchStatus = "pending" | "live" | "paused" | "completed";
export type PitchThird = "defensive" | "middle" | "attacking";
export type PitchChannel = "left" | "central" | "right";
export type MatchOutcome = "progression" | "chance" | "retention" | "turnover";
export type Pressure = "low" | "medium" | "high";

export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  matchDate: string;
  status: MatchStatus;
  startedAt?: string;
  endedAt?: string;
  scoreFor?: number;
  scoreAgainst?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  matchMinute: number;
  third: PitchThird;
  channel: PitchChannel;
  outcome: MatchOutcome;
  pressure: Pressure;
  recordedAt: string;
}

export interface AppSettings {
  hapticsEnabled: boolean;
  preferredTeamId: string;
}

export interface WorkspaceData {
  teams: Team[];
  players: Player[];
  assessments: Assessment[];
  matches: Match[];
  matchEvents: MatchEvent[];
  settings: AppSettings;
}

export const SKILL_LABELS: Record<SkillKey, string> = {
  ballControl: "Ball control",
  passing: "Passing",
  receiving: "Receiving",
  dribbling: "Dribbling",
  defending: "Defending",
  decisionMaking: "Decision making",
};

export const RATING_LABELS: Record<Rating, string> = {
  1: "Developing",
  2: "Secure",
  3: "Strong",
};

export const THIRD_LABELS: Record<PitchThird, string> = {
  defensive: "Build",
  middle: "Connect",
  attacking: "Create",
};

export const CHANNEL_LABELS: Record<PitchChannel, string> = {
  left: "Left",
  central: "Centre",
  right: "Right",
};

export const OUTCOME_LABELS: Record<MatchOutcome, string> = {
  progression: "Progressed",
  chance: "Chance",
  retention: "Kept ball",
  turnover: "Lost ball",
};
