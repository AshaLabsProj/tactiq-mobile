/**
 * Shared domain model for the offline client and cloud sync API.
 *
 * Stable string IDs are generated on-device, allowing records to be created
 * offline and uploaded without server-side re-keying.
 */
export type SkillKey =
  | "ballControl"
  | "passing"
  | "receiving"
  | "dribbling"
  | "defending"
  | "decisionMaking";

export const SKILL_KEYS: SkillKey[] = [
  "ballControl",
  "passing",
  "receiving",
  "dribbling",
  "defending",
  "decisionMaking",
];

export type Rating = 1 | 2 | 3;
export type SkillRatings = Record<SkillKey, Rating>;

export interface Team {
  id: string;
  name: string;
  ageGroup: string;
  season: string;
  playerIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position: string;
  accent: string;
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssessmentContext = "practice" | "match-review";

export interface Assessment {
  id: string;
  playerId: string;
  createdAt: string;
  updatedAt?: string;
  ratings: SkillRatings;
  note: string;
  context: AssessmentContext;
  sessionId?: string;
}

export interface PracticeSession {
  id: string;
  teamId: string;
  date: string;
  focusSkills: SkillKey[];
  attendeeIds: string[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type FocusGoalStatus = "active" | "achieved" | "archived";

/** A goal is a team goal when teamId is present and playerId is absent. */
export interface FocusGoal {
  id: string;
  teamId?: string;
  playerId?: string;
  skill: SkillKey;
  note: string;
  setAt: string;
  reviewBy?: string;
  status: FocusGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export type MatchStatus = "pending" | "live" | "paused" | "completed";
export type MatchPeriod = 1 | 2;
export type PitchThird = "defensive" | "middle" | "attacking";
export type PitchChannel = "left" | "central" | "right";
export type Pressure = "low" | "medium" | "high";
export type MatchCategory =
  | "attacking"
  | "possession"
  | "defending"
  | "goalkeeping"
  | "set-piece"
  | "discipline"
  | "team-admin";
export type EventValence = "positive" | "neutral" | "negative";

/** Legacy v1 outcome values. Kept to make local migrations lossless. */
export type MatchOutcome = "progression" | "chance" | "retention" | "turnover";

export type ActionType =
  | "goalFor"
  | "goalAgainst"
  | "shotOnTarget"
  | "shotOffTarget"
  | "chanceCreated"
  | "progression"
  | "retention"
  | "turnover"
  | "regain"
  | "clearance"
  | "save"
  | "setPieceWon"
  | "assist"
  | "keyPass"
  | "cross"
  | "dribbleWon"
  | "tackleWon"
  | "interception"
  | "aerialWon"
  | "foulWon"
  | "foulCommitted"
  | "offside"
  | "card"
  | "substitution";

export type CardDetail = "yellow" | "red";
export interface SubstitutionDetail {
  playerOffId?: string;
  playerOnId?: string;
}
export type MatchEventDetail = CardDetail | SubstitutionDetail;

export interface ActionDefinition {
  key: ActionType;
  label: string;
  shortLabel: string;
  category: MatchCategory;
  valence: EventValence;
  tier: "core" | "extended";
  zoneRequired: boolean;
  legacyOutcome?: MatchOutcome;
}

export const ACTION_DEFINITIONS: readonly ActionDefinition[] = [
  { key: "goalFor", label: "Goal", shortLabel: "Goal", category: "attacking", valence: "positive", tier: "core", zoneRequired: true },
  { key: "goalAgainst", label: "Goal against", shortLabel: "Goal against", category: "attacking", valence: "negative", tier: "core", zoneRequired: true },
  { key: "shotOnTarget", label: "Shot on target", shortLabel: "On target", category: "attacking", valence: "positive", tier: "core", zoneRequired: true },
  { key: "shotOffTarget", label: "Shot off target", shortLabel: "Off target", category: "attacking", valence: "neutral", tier: "core", zoneRequired: true },
  { key: "chanceCreated", label: "Chance created", shortLabel: "Chance", category: "attacking", valence: "positive", tier: "core", zoneRequired: true, legacyOutcome: "chance" },
  { key: "progression", label: "Progression", shortLabel: "Progress", category: "possession", valence: "positive", tier: "core", zoneRequired: true, legacyOutcome: "progression" },
  { key: "retention", label: "Kept ball", shortLabel: "Kept ball", category: "possession", valence: "positive", tier: "core", zoneRequired: true, legacyOutcome: "retention" },
  { key: "turnover", label: "Lost ball", shortLabel: "Lost ball", category: "possession", valence: "negative", tier: "core", zoneRequired: true, legacyOutcome: "turnover" },
  { key: "regain", label: "Ball regain", shortLabel: "Regain", category: "defending", valence: "positive", tier: "core", zoneRequired: true },
  { key: "clearance", label: "Clearance / block", shortLabel: "Clearance", category: "defending", valence: "neutral", tier: "core", zoneRequired: true },
  { key: "save", label: "GK save", shortLabel: "Save", category: "goalkeeping", valence: "positive", tier: "core", zoneRequired: true },
  { key: "setPieceWon", label: "Set piece won", shortLabel: "Set piece", category: "set-piece", valence: "positive", tier: "core", zoneRequired: true },
  { key: "assist", label: "Assist", shortLabel: "Assist", category: "attacking", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "keyPass", label: "Key pass", shortLabel: "Key pass", category: "attacking", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "cross", label: "Cross", shortLabel: "Cross", category: "attacking", valence: "neutral", tier: "extended", zoneRequired: true },
  { key: "dribbleWon", label: "1v1 dribble won", shortLabel: "1v1 won", category: "attacking", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "tackleWon", label: "Tackle won", shortLabel: "Tackle", category: "defending", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "interception", label: "Interception", shortLabel: "Intercept", category: "defending", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "aerialWon", label: "Aerial duel won", shortLabel: "Aerial", category: "defending", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "foulWon", label: "Foul won", shortLabel: "Foul won", category: "discipline", valence: "positive", tier: "extended", zoneRequired: true },
  { key: "foulCommitted", label: "Foul committed", shortLabel: "Foul", category: "discipline", valence: "negative", tier: "extended", zoneRequired: true },
  { key: "offside", label: "Offside", shortLabel: "Offside", category: "discipline", valence: "negative", tier: "extended", zoneRequired: true },
  { key: "card", label: "Card", shortLabel: "Card", category: "discipline", valence: "negative", tier: "extended", zoneRequired: false },
  { key: "substitution", label: "Substitution", shortLabel: "Sub", category: "team-admin", valence: "neutral", tier: "extended", zoneRequired: false },
] as const;

export const ACTION_BY_KEY: Record<ActionType, ActionDefinition> = ACTION_DEFINITIONS.reduce(
  (catalogue, action) => {
    catalogue[action.key] = action;
    return catalogue;
  },
  {} as Record<ActionType, ActionDefinition>,
);

export const CORE_ACTIONS = ACTION_DEFINITIONS.filter((action) => action.tier === "core");
export const EXTENDED_ACTIONS = ACTION_DEFINITIONS.filter((action) => action.tier === "extended");

export const LEGACY_OUTCOME_TO_ACTION: Record<MatchOutcome, ActionType> = {
  progression: "progression",
  chance: "chanceCreated",
  retention: "retention",
  turnover: "turnover",
};

export function legacyOutcomeForAction(actionType: ActionType): MatchOutcome | undefined {
  return ACTION_BY_KEY[actionType].legacyOutcome;
}

export interface PauseInterval {
  from: string;
  to?: string;
}

export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  matchDate: string;
  status: MatchStatus;
  startedAt?: string;
  endedAt?: string;
  periodLengthMinutes: number;
  currentPeriod: MatchPeriod;
  pausedIntervals: PauseInterval[];
  /** Manual correction preserved for incomplete legacy records. */
  scoreFor?: number;
  /** Manual correction preserved for incomplete legacy records. */
  scoreAgainst?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  matchMinute: number;
  period: MatchPeriod;
  third?: PitchThird;
  channel?: PitchChannel;
  actionType: ActionType;
  category: MatchCategory;
  valence: EventValence;
  /** Deprecated compatibility alias for records created before v2. */
  outcome?: MatchOutcome;
  pressure: Pressure;
  playerId?: string;
  detail?: MatchEventDetail;
  recordedAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  hapticsEnabled: boolean;
  preferredTeamId: string;
  detailedTaggingEnabled: boolean;
  defaultPressure: Pressure;
  playerTaggingEnabled: boolean;
  periodLengthMinutes: number;
  accountBackupPromptDismissed?: boolean;
}

export interface WorkspaceData {
  teams: Team[];
  players: Player[];
  practiceSessions: PracticeSession[];
  assessments: Assessment[];
  focusGoals: FocusGoal[];
  matches: Match[];
  matchEvents: MatchEvent[];
  settings: AppSettings;
}

export type WorkspaceEntity =
  | "team"
  | "player"
  | "practiceSession"
  | "assessment"
  | "focusGoal"
  | "match"
  | "matchEvent"
  | "settings";
export type MutationOperation = "upsert" | "delete";

export interface SyncMutation {
  id: string;
  entity: WorkspaceEntity;
  operation: MutationOperation;
  recordId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncConflict {
  mutationId: string;
  entity: WorkspaceEntity;
  recordId: string;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  loggedAt: string;
}

export interface WorkspaceEnvelopeV2 {
  version: 2;
  data: WorkspaceData;
  syncCursor?: string;
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
