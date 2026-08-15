import {
  ACTION_BY_KEY,
  LEGACY_OUTCOME_TO_ACTION,
  type AppSettings,
  type Match,
  type MatchEvent,
  type MatchOutcome,
  type WorkspaceData,
  type WorkspaceEnvelopeV2,
} from "@/types/models";

export const LEGACY_STORAGE_KEY = "tactiq-mobile-workspace-v1";
export const WORKSPACE_STORAGE_KEY = "skilltracker-workspace-v2";
export const WORKSPACE_VERSION = 2 as const;

const DEFAULT_SETTINGS: Omit<AppSettings, "preferredTeamId"> = {
  hapticsEnabled: true,
  detailedTaggingEnabled: false,
  defaultPressure: "medium",
  playerTaggingEnabled: true,
  periodLengthMinutes: 25,
};

type LegacyAssessment = Omit<WorkspaceData["assessments"][number], "context"> & {
  context?: WorkspaceData["assessments"][number]["context"];
  sessionId?: string;
};

type LegacyMatch = Omit<Match, "periodLengthMinutes" | "currentPeriod" | "pausedIntervals"> & {
  periodLengthMinutes?: number;
  currentPeriod?: 1 | 2;
  pausedIntervals?: Match["pausedIntervals"];
};

type LegacyMatchEvent = Omit<MatchEvent, "actionType" | "category" | "valence" | "period"> & {
  actionType?: MatchEvent["actionType"];
  category?: MatchEvent["category"];
  valence?: MatchEvent["valence"];
  period?: MatchEvent["period"];
  outcome?: MatchOutcome;
};

export interface LegacyWorkspaceV1 {
  teams: WorkspaceData["teams"];
  players: WorkspaceData["players"];
  assessments: LegacyAssessment[];
  matches: LegacyMatch[];
  matchEvents: LegacyMatchEvent[];
  settings: Partial<AppSettings> & { preferredTeamId?: string };
}

export function defaultSettings(preferredTeamId = ""): AppSettings {
  return { ...DEFAULT_SETTINGS, preferredTeamId };
}

export function migrateMatchEventV1(event: LegacyMatchEvent): MatchEvent {
  const actionType = event.actionType ?? LEGACY_OUTCOME_TO_ACTION[event.outcome ?? "retention"];
  const definition = ACTION_BY_KEY[actionType];
  return {
    id: event.id,
    matchId: event.matchId,
    matchMinute: event.matchMinute,
    period: event.period ?? 1,
    third: event.third,
    channel: event.channel,
    actionType,
    category: event.category ?? definition.category,
    valence: event.valence ?? definition.valence,
    outcome: event.outcome ?? definition.legacyOutcome,
    pressure: event.pressure ?? "medium",
    playerId: event.playerId,
    detail: event.detail,
    recordedAt: event.recordedAt,
    updatedAt: event.updatedAt ?? event.recordedAt,
  };
}

export function migrateWorkspaceV1(legacy: LegacyWorkspaceV1): WorkspaceData {
  const preferredTeamId = legacy.settings.preferredTeamId ?? legacy.teams[0]?.id ?? "";
  return {
    teams: legacy.teams.map((team) => ({
      ...team,
      createdAt: team.createdAt ?? team.season,
      updatedAt: team.updatedAt ?? team.season,
    })),
    players: legacy.players.map((player) => ({
      ...player,
      createdAt: player.createdAt ?? player.joinedAt,
      updatedAt: player.updatedAt ?? player.joinedAt,
    })),
    practiceSessions: [],
    assessments: legacy.assessments.map((assessment) => ({
      ...assessment,
      context: assessment.context ?? "practice",
      updatedAt: assessment.updatedAt ?? assessment.createdAt,
    })),
    focusGoals: [],
    matches: legacy.matches.map((match) => ({
      ...match,
      periodLengthMinutes: match.periodLengthMinutes ?? legacy.settings.periodLengthMinutes ?? 25,
      currentPeriod: match.currentPeriod ?? 1,
      pausedIntervals: match.pausedIntervals ?? [],
      createdAt: match.createdAt ?? match.matchDate,
      updatedAt: match.updatedAt ?? match.endedAt ?? match.startedAt ?? match.matchDate,
    })),
    matchEvents: legacy.matchEvents.map(migrateMatchEventV1),
    settings: {
      ...defaultSettings(preferredTeamId),
      ...legacy.settings,
      preferredTeamId,
      detailedTaggingEnabled: legacy.settings.detailedTaggingEnabled ?? false,
      defaultPressure: legacy.settings.defaultPressure ?? "medium",
      playerTaggingEnabled: legacy.settings.playerTaggingEnabled ?? true,
      periodLengthMinutes: legacy.settings.periodLengthMinutes ?? 25,
    },
  };
}

export function toWorkspaceEnvelope(data: WorkspaceData, syncCursor?: string): WorkspaceEnvelopeV2 {
  return { version: WORKSPACE_VERSION, data, syncCursor };
}

export function isWorkspaceEnvelopeV2(value: unknown): value is WorkspaceEnvelopeV2 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WorkspaceEnvelopeV2>;
  return candidate.version === WORKSPACE_VERSION && Boolean(candidate.data);
}

export function parseAndMigrateWorkspace(value: unknown): WorkspaceEnvelopeV2 | null {
  if (!value || typeof value !== "object") return null;
  if (isWorkspaceEnvelopeV2(value)) return value;
  const legacy = value as LegacyWorkspaceV1;
  if (!Array.isArray(legacy.teams) || !Array.isArray(legacy.players) || !Array.isArray(legacy.matchEvents)) {
    return null;
  }
  return toWorkspaceEnvelope(migrateWorkspaceV1(legacy));
}
