import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { createDemoWorkspace } from "@/data/demo-data";
import { cloudBootstrap, cloudPull, cloudPush, createWorkspaceSnapshotMutations, eraseCloudWorkspace, type CloudRecord } from "@/lib/cloud-sync";
import {
  SYNC_CONFLICT_STORAGE_KEY,
  SYNC_QUEUE_STORAGE_KEY,
} from "@/lib/sync-queue";
import {
  LEGACY_STORAGE_KEY,
  parseAndMigrateWorkspace,
  toWorkspaceEnvelope,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/workspace-migration";
import {
  ACTION_BY_KEY,
  LEGACY_OUTCOME_TO_ACTION,
  type ActionType,
  type AppSettings,
  type Assessment,
  type AssessmentContext,
  type FocusGoal,
  type FocusGoalStatus,
  type Match,
  type MatchEvent,
  type MatchOutcome,
  type MatchPeriod,
  type MatchStatus,
  type PitchChannel,
  type PitchThird,
  type PracticeSession,
  type Pressure,
  type SkillKey,
  type SkillRatings,
  type SyncConflict,
  type SyncMutation,
  type WorkspaceData,
  type WorkspaceEntity,
} from "@/types/models";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

function updateById<T extends { id: string }>(items: T[], record: T): T[] {
  const exists = items.some((item) => item.id === record.id);
  return exists ? items.map((item) => (item.id === record.id ? record : item)) : [record, ...items];
}

export type WorkspaceAction =
  | { type: "hydrate"; data: WorkspaceData }
  | { type: "replace"; data: WorkspaceData }
  | { type: "addAssessment"; assessment: Assessment }
  | { type: "upsertPracticeSession"; session: PracticeSession }
  | { type: "upsertFocusGoal"; goal: FocusGoal }
  | { type: "createMatch"; match: Match }
  | { type: "setMatchStatus"; matchId: string; status: MatchStatus; at: string }
  | { type: "setMatchPeriod"; matchId: string; period: MatchPeriod; at: string }
  | { type: "setMatchScore"; matchId: string; scoreFor: number; scoreAgainst: number; at: string }
  | { type: "addMatchEvent"; event: MatchEvent }
  | { type: "updateMatchEvent"; event: MatchEvent }
  | { type: "deleteMatchEvent"; eventId: string }
  | { type: "undoMatchEvent"; matchId: string }
  | { type: "updateSettings"; settings: Partial<AppSettings> }
  | { type: "reset"; data: WorkspaceData };

export function workspaceReducer(state: WorkspaceData, action: WorkspaceAction): WorkspaceData {
  switch (action.type) {
    case "hydrate":
    case "replace":
    case "reset":
      return action.data;
    case "addAssessment":
      return { ...state, assessments: updateById(state.assessments, action.assessment) };
    case "upsertPracticeSession":
      return { ...state, practiceSessions: updateById(state.practiceSessions, action.session) };
    case "upsertFocusGoal":
      return { ...state, focusGoals: updateById(state.focusGoals, action.goal) };
    case "createMatch":
      return { ...state, matches: updateById(state.matches, action.match) };
    case "setMatchStatus":
      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== action.matchId) return match;
          const isResuming = action.status === "live" && match.status === "paused";
          const pausedIntervals = isResuming
            ? match.pausedIntervals.map((interval, index) =>
                index === match.pausedIntervals.length - 1 && !interval.to
                  ? { ...interval, to: action.at }
                  : interval,
              )
            : action.status === "paused" && match.status === "live"
              ? [...match.pausedIntervals, { from: action.at }]
              : match.pausedIntervals;
          return {
            ...match,
            status: action.status,
            startedAt: action.status === "live" && !match.startedAt ? action.at : match.startedAt,
            endedAt: action.status === "completed" ? action.at : match.endedAt,
            pausedIntervals,
            updatedAt: action.at,
          };
        }),
      };
    case "setMatchPeriod":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.matchId ? { ...match, currentPeriod: action.period, updatedAt: action.at } : match,
        ),
      };
    case "setMatchScore":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.matchId
            ? { ...match, scoreFor: action.scoreFor, scoreAgainst: action.scoreAgainst, updatedAt: action.at }
            : match,
        ),
      };
    case "addMatchEvent":
      return { ...state, matchEvents: updateById(state.matchEvents, action.event) };
    case "updateMatchEvent":
      return { ...state, matchEvents: updateById(state.matchEvents, action.event) };
    case "deleteMatchEvent":
      return { ...state, matchEvents: state.matchEvents.filter((event) => event.id !== action.eventId) };
    case "undoMatchEvent": {
      const matchEvents = [...state.matchEvents];
      const index = matchEvents.map((event) => event.matchId).lastIndexOf(action.matchId);
      if (index >= 0) matchEvents.splice(index, 1);
      return { ...state, matchEvents };
    }
    case "updateSettings":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

type EventInput = {
  matchId: string;
  matchMinute: number;
  third?: PitchThird;
  channel?: PitchChannel;
  actionType?: ActionType;
  /** Kept temporarily so v1 screens compile while M2 UI is upgraded. */
  outcome?: MatchOutcome;
  pressure?: Pressure;
  playerId?: string;
  detail?: MatchEvent["detail"];
};

interface WorkspaceContextValue {
  data: WorkspaceData;
  isReady: boolean;
  pendingSyncCount: number;
  syncConflicts: SyncConflict[];
  syncCursor?: string;
  isCloudSyncing: boolean;
  lastCloudSyncAt?: string;
  cloudSyncError?: string;
  addAssessment: (
    playerId: string,
    ratings: SkillRatings,
    note: string,
    options?: { context?: AssessmentContext; sessionId?: string },
  ) => string;
  createPracticeSession: (input: Omit<PracticeSession, "id" | "createdAt" | "updatedAt">) => string;
  saveFocusGoal: (input: Omit<FocusGoal, "id" | "createdAt" | "updatedAt"> & { id?: string }) => string;
  updateFocusGoalStatus: (goalId: string, status: FocusGoalStatus) => void;
  createMatch: (teamId: string, opponent: string, matchDate: string, periodLengthMinutes?: number) => string;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  setMatchPeriod: (matchId: string, period: MatchPeriod) => void;
  setMatchScore: (matchId: string, scoreFor: number, scoreAgainst: number) => void;
  addMatchEvent: (input: EventInput) => string;
  updateMatchEvent: (eventId: string, changes: Partial<Omit<MatchEvent, "id" | "matchId" | "recordedAt">>) => void;
  assignEventPlayer: (eventId: string, playerId?: string) => void;
  deleteMatchEvent: (eventId: string) => void;
  undoMatchEvent: (matchId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceWorkspace: (data: WorkspaceData, syncCursor?: string) => void;
  setSyncState: (queue: SyncMutation[], conflicts: SyncConflict[], cursor?: string) => void;
  syncNow: () => Promise<boolean>;
  migrateLocalWorkspaceToCloud: () => Promise<boolean>;
  eraseCloudBackup: () => Promise<boolean>;
  resetWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function toPayload(record: object): Record<string, unknown> {
  return record as Record<string, unknown>;
}

function applyCloudRecords(local: WorkspaceData, records: CloudRecord[]): WorkspaceData {
  let next = local;
  for (const record of records) {
    if (record.entity === "settings") {
      next = record.deletedAt ? next : { ...next, settings: record.payload as unknown as AppSettings };
      continue;
    }
    const collectionKey = record.entity === "team" ? "teams"
      : record.entity === "player" ? "players"
      : record.entity === "assessment" ? "assessments"
      : record.entity === "practiceSession" ? "practiceSessions"
      : record.entity === "focusGoal" ? "focusGoals"
      : record.entity === "match" ? "matches"
      : "matchEvents";
    const collection = next[collectionKey] as Array<{ id: string }>;
    const updated = record.deletedAt
      ? collection.filter((item) => item.id !== record.recordId)
      : updateById(collection, record.payload as unknown as { id: string });
    next = { ...next, [collectionKey]: updated } as WorkspaceData;
  }
  return next;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(workspaceReducer, undefined, createDemoWorkspace);
  const [isReady, setIsReady] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | undefined>();
  const [cloudSyncError, setCloudSyncError] = useState<string | undefined>();
  const queueRef = useRef<SyncMutation[]>([]);
  const cursorRef = useRef<string | undefined>(undefined);

  const persistQueue = useCallback(async () => {
    await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queueRef.current));
    setPendingSyncCount(queueRef.current.length);
  }, []);

  const enqueueMutation = useCallback(
    (entity: WorkspaceEntity, recordId: string, payload?: Record<string, unknown>, operation: SyncMutation["operation"] = "upsert") => {
      const mutation: SyncMutation = {
        id: createId("mutation"),
        entity,
        operation,
        recordId,
        payload,
        createdAt: now(),
        retryCount: 0,
      };
      queueRef.current = [...queueRef.current, mutation];
      void persistQueue().catch(() => {
        // Local coaching flows remain usable if queue persistence fails.
      });
    },
    [persistQueue],
  );

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      AsyncStorage.getItem(WORKSPACE_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_STORAGE_KEY),
      AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY),
      AsyncStorage.getItem(SYNC_CONFLICT_STORAGE_KEY),
    ])
      .then(([storedV2, storedV1, storedQueue, storedConflicts]) => {
        if (!mounted) return;
        const parsedV2 = storedV2 ? parseAndMigrateWorkspace(JSON.parse(storedV2) as unknown) : null;
        const parsedV1 = !parsedV2 && storedV1 ? parseAndMigrateWorkspace(JSON.parse(storedV1) as unknown) : null;
        const envelope = parsedV2 ?? parsedV1;
        if (envelope) {
          dispatch({ type: "hydrate", data: envelope.data });
          cursorRef.current = envelope.syncCursor;
          if (parsedV1) {
            void AsyncStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(envelope));
          }
        }
        if (storedQueue) {
          const queue = JSON.parse(storedQueue) as SyncMutation[];
          queueRef.current = queue;
          setPendingSyncCount(queue.length);
        }
        if (storedConflicts) setSyncConflicts(JSON.parse(storedConflicts) as SyncConflict[]);
      })
      .catch(() => {
        // A corrupt cache never blocks a coach from opening the locally seeded workspace.
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const envelope = toWorkspaceEnvelope(data, cursorRef.current);
    void AsyncStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(envelope)).catch(() => {
      // Current in-memory session remains usable even if persistence fails.
    });
  }, [data, isReady]);

  const addAssessment = useCallback(
    (playerId: string, ratings: SkillRatings, note: string, options?: { context?: AssessmentContext; sessionId?: string }) => {
      const createdAt = now();
      const assessment: Assessment = {
        id: createId("assessment"),
        playerId,
        createdAt,
        updatedAt: createdAt,
        ratings,
        note: note.trim(),
        context: options?.context ?? "practice",
        sessionId: options?.sessionId,
      };
      dispatch({ type: "addAssessment", assessment });
      enqueueMutation("assessment", assessment.id, toPayload(assessment));
      return assessment.id;
    },
    [enqueueMutation],
  );

  const createPracticeSession = useCallback(
    (input: Omit<PracticeSession, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = now();
      const session: PracticeSession = { ...input, id: createId("session"), createdAt, updatedAt: createdAt };
      dispatch({ type: "upsertPracticeSession", session });
      enqueueMutation("practiceSession", session.id, toPayload(session));
      return session.id;
    },
    [enqueueMutation],
  );

  const saveFocusGoal = useCallback(
    (input: Omit<FocusGoal, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const timestamp = now();
      const goal: FocusGoal = {
        ...input,
        id: input.id ?? createId("goal"),
        createdAt: input.id ? data.focusGoals.find((item) => item.id === input.id)?.createdAt ?? timestamp : timestamp,
        updatedAt: timestamp,
      };
      dispatch({ type: "upsertFocusGoal", goal });
      enqueueMutation("focusGoal", goal.id, toPayload(goal));
      return goal.id;
    },
    [data.focusGoals, enqueueMutation],
  );

  const updateFocusGoalStatus = useCallback(
    (goalId: string, status: FocusGoalStatus) => {
      const current = data.focusGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const goal = { ...current, status, updatedAt: now() };
      dispatch({ type: "upsertFocusGoal", goal });
      enqueueMutation("focusGoal", goal.id, toPayload(goal));
    },
    [data.focusGoals, enqueueMutation],
  );

  const createMatch = useCallback(
    (teamId: string, opponent: string, matchDate: string, periodLengthMinutes?: number) => {
      const timestamp = now();
      const match: Match = {
        id: createId("match"),
        teamId,
        opponent: opponent.trim(),
        matchDate,
        status: "pending",
        periodLengthMinutes: periodLengthMinutes ?? data.settings.periodLengthMinutes,
        currentPeriod: 1,
        pausedIntervals: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      dispatch({ type: "createMatch", match });
      enqueueMutation("match", match.id, toPayload(match));
      return match.id;
    },
    [data.settings.periodLengthMinutes, enqueueMutation],
  );

  const setMatchStatus = useCallback(
    (matchId: string, status: MatchStatus) => {
      const timestamp = now();
      dispatch({ type: "setMatchStatus", matchId, status, at: timestamp });
      const match = data.matches.find((item) => item.id === matchId);
      if (match) enqueueMutation("match", matchId, toPayload({ ...match, status, updatedAt: timestamp }));
    },
    [data.matches, enqueueMutation],
  );

  const setMatchPeriod = useCallback(
    (matchId: string, period: MatchPeriod) => {
      const timestamp = now();
      dispatch({ type: "setMatchPeriod", matchId, period, at: timestamp });
      const match = data.matches.find((item) => item.id === matchId);
      if (match) enqueueMutation("match", matchId, toPayload({ ...match, currentPeriod: period, updatedAt: timestamp }));
    },
    [data.matches, enqueueMutation],
  );

  const setMatchScore = useCallback(
    (matchId: string, scoreFor: number, scoreAgainst: number) => {
      const timestamp = now();
      dispatch({ type: "setMatchScore", matchId, scoreFor, scoreAgainst, at: timestamp });
      const match = data.matches.find((item) => item.id === matchId);
      if (match) enqueueMutation("match", matchId, toPayload({ ...match, scoreFor, scoreAgainst, updatedAt: timestamp }));
    },
    [data.matches, enqueueMutation],
  );

  const addMatchEvent = useCallback(
    (input: EventInput) => {
      const timestamp = now();
      const actionType = input.actionType ?? LEGACY_OUTCOME_TO_ACTION[input.outcome ?? "retention"];
      const definition = ACTION_BY_KEY[actionType];
      const match = data.matches.find((item) => item.id === input.matchId);
      const event: MatchEvent = {
        id: createId("event"),
        matchId: input.matchId,
        matchMinute: input.matchMinute,
        period: match?.currentPeriod ?? 1,
        third: input.third,
        channel: input.channel,
        actionType,
        category: definition.category,
        valence: definition.valence,
        outcome: definition.legacyOutcome,
        pressure: input.pressure ?? data.settings.defaultPressure,
        playerId: input.playerId,
        detail: input.detail,
        recordedAt: timestamp,
        updatedAt: timestamp,
      };
      dispatch({ type: "addMatchEvent", event });
      enqueueMutation("matchEvent", event.id, toPayload(event));
      return event.id;
    },
    [data.matches, data.settings.defaultPressure, enqueueMutation],
  );

  const updateMatchEvent = useCallback(
    (eventId: string, changes: Partial<Omit<MatchEvent, "id" | "matchId" | "recordedAt">>) => {
      const current = data.matchEvents.find((event) => event.id === eventId);
      if (!current) return;
      const actionType = changes.actionType ?? current.actionType;
      const definition = ACTION_BY_KEY[actionType];
      const event: MatchEvent = {
        ...current,
        ...changes,
        actionType,
        category: changes.category ?? definition.category,
        valence: changes.valence ?? definition.valence,
        outcome: changes.outcome ?? definition.legacyOutcome,
        updatedAt: now(),
      };
      dispatch({ type: "updateMatchEvent", event });
      enqueueMutation("matchEvent", event.id, toPayload(event));
    },
    [data.matchEvents, enqueueMutation],
  );

  const assignEventPlayer = useCallback(
    (eventId: string, playerId?: string) => updateMatchEvent(eventId, { playerId }),
    [updateMatchEvent],
  );

  const deleteMatchEvent = useCallback(
    (eventId: string) => {
      dispatch({ type: "deleteMatchEvent", eventId });
      enqueueMutation("matchEvent", eventId, undefined, "delete");
    },
    [enqueueMutation],
  );

  const undoMatchEvent = useCallback(
    (matchId: string) => {
      const event = [...data.matchEvents].reverse().find((item) => item.matchId === matchId);
      if (!event) return;
      dispatch({ type: "undoMatchEvent", matchId });
      enqueueMutation("matchEvent", event.id, undefined, "delete");
    },
    [data.matchEvents, enqueueMutation],
  );

  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) => {
      const nextSettings = { ...data.settings, ...settings };
      dispatch({ type: "updateSettings", settings });
      enqueueMutation("settings", "settings", toPayload(nextSettings));
    },
    [data.settings, enqueueMutation],
  );

  const replaceWorkspace = useCallback((nextData: WorkspaceData, syncCursor?: string) => {
    cursorRef.current = syncCursor;
    dispatch({ type: "replace", data: nextData });
  }, []);

  const setSyncState = useCallback((queue: SyncMutation[], conflicts: SyncConflict[], cursor?: string) => {
    queueRef.current = queue;
    cursorRef.current = cursor;
    setPendingSyncCount(queue.length);
    setSyncConflicts(conflicts);
    void Promise.all([
      AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue)),
      AsyncStorage.setItem(SYNC_CONFLICT_STORAGE_KEY, JSON.stringify(conflicts)),
    ]);
  }, []);

  const syncNow = useCallback(async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(undefined);
    try {
      const pulled = await cloudPull(cursorRef.current);
      const merged = applyCloudRecords(data, pulled.records);
      if (pulled.records.length) dispatch({ type: "replace", data: merged });
      let queue = queueRef.current;
      let conflicts = syncConflicts;
      let cursor = pulled.cursor;
      if (queue.length) {
        const pushed = await cloudPush(queue);
        const acknowledged = new Set(pushed.acknowledgedMutationIds);
        queue = queue.filter((mutation) => !acknowledged.has(mutation.id));
        conflicts = [...syncConflicts, ...pushed.conflicts];
        cursor = pushed.cursor;
      }
      setSyncState(queue, conflicts, cursor);
      setLastCloudSyncAt(now());
      return true;
    } catch (error) {
      setCloudSyncError(error instanceof Error ? error.message : "Could not sync. Your local work remains safely on this device.");
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, [data, setSyncState, syncConflicts]);

  const migrateLocalWorkspaceToCloud = useCallback(async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(undefined);
    try {
      const remote = await cloudBootstrap();
      if (remote.records.length) {
        dispatch({ type: "replace", data: applyCloudRecords(data, remote.records) });
        setSyncState(queueRef.current, syncConflicts, remote.cursor);
      } else {
        const pushed = await cloudPush(createWorkspaceSnapshotMutations(data));
        setSyncState(queueRef.current, [...syncConflicts, ...pushed.conflicts], pushed.cursor);
      }
      setLastCloudSyncAt(now());
      return true;
    } catch (error) {
      setCloudSyncError(error instanceof Error ? error.message : "Could not back up this device.");
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, [data, setSyncState, syncConflicts]);

  const eraseCloudBackup = useCallback(async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(undefined);
    try {
      await eraseCloudWorkspace();
      setSyncState(queueRef.current, syncConflicts, "0");
      setLastCloudSyncAt(now());
      return true;
    } catch (error) {
      setCloudSyncError(error instanceof Error ? error.message : "Could not erase the cloud backup.");
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, [setSyncState, syncConflicts]);

  const resetWorkspace = useCallback(() => {
    const freshWorkspace = createDemoWorkspace();
    queueRef.current = [];
    cursorRef.current = undefined;
    setPendingSyncCount(0);
    setSyncConflicts([]);
    dispatch({ type: "reset", data: freshWorkspace });
    void Promise.all([
      AsyncStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(toWorkspaceEnvelope(freshWorkspace))),
      AsyncStorage.removeItem(SYNC_QUEUE_STORAGE_KEY),
      AsyncStorage.removeItem(SYNC_CONFLICT_STORAGE_KEY),
    ]);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      data,
      isReady,
      pendingSyncCount,
      syncConflicts,
      syncCursor: cursorRef.current,
      isCloudSyncing,
      lastCloudSyncAt,
      cloudSyncError,
      addAssessment,
      createPracticeSession,
      saveFocusGoal,
      updateFocusGoalStatus,
      createMatch,
      setMatchStatus,
      setMatchPeriod,
      setMatchScore,
      addMatchEvent,
      updateMatchEvent,
      assignEventPlayer,
      deleteMatchEvent,
      undoMatchEvent,
      updateSettings,
      replaceWorkspace,
      setSyncState,
      syncNow,
      migrateLocalWorkspaceToCloud,
      eraseCloudBackup,
      resetWorkspace,
    }),
    [
      data, isReady, pendingSyncCount, syncConflicts, isCloudSyncing, lastCloudSyncAt, cloudSyncError, addAssessment, createPracticeSession, saveFocusGoal,
      updateFocusGoalStatus, createMatch, setMatchStatus, setMatchPeriod, setMatchScore, addMatchEvent,
      updateMatchEvent, assignEventPlayer, deleteMatchEvent, undoMatchEvent, updateSettings, replaceWorkspace,
      setSyncState, syncNow, migrateLocalWorkspaceToCloud, eraseCloudBackup, resetWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
