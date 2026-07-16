import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import { createDemoWorkspace } from "@/data/demo-data";
import type {
  AppSettings,
  Assessment,
  Match,
  MatchEvent,
  MatchOutcome,
  MatchStatus,
  PitchChannel,
  PitchThird,
  Pressure,
  SkillRatings,
  WorkspaceData,
} from "@/types/models";

const STORAGE_KEY = "tactiq-mobile-workspace-v1";

export type WorkspaceAction =
  | { type: "hydrate"; data: WorkspaceData }
  | { type: "addAssessment"; assessment: Assessment }
  | { type: "createMatch"; match: Match }
  | { type: "setMatchStatus"; matchId: string; status: MatchStatus; at: string }
  | { type: "setMatchScore"; matchId: string; scoreFor: number; scoreAgainst: number }
  | { type: "addMatchEvent"; event: MatchEvent }
  | { type: "undoMatchEvent"; matchId: string }
  | { type: "updateSettings"; settings: Partial<AppSettings> }
  | { type: "reset"; data: WorkspaceData };

export function workspaceReducer(state: WorkspaceData, action: WorkspaceAction): WorkspaceData {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.data;
    case "addAssessment":
      return { ...state, assessments: [action.assessment, ...state.assessments] };
    case "createMatch":
      return { ...state, matches: [action.match, ...state.matches] };
    case "setMatchStatus":
      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== action.matchId) return match;
          return {
            ...match,
            status: action.status,
            startedAt: action.status === "live" && !match.startedAt ? action.at : match.startedAt,
            endedAt: action.status === "completed" ? action.at : match.endedAt,
          };
        }),
      };
    case "setMatchScore":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.matchId
            ? { ...match, scoreFor: action.scoreFor, scoreAgainst: action.scoreAgainst }
            : match,
        ),
      };
    case "addMatchEvent":
      return { ...state, matchEvents: [...state.matchEvents, action.event] };
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface WorkspaceContextValue {
  data: WorkspaceData;
  isReady: boolean;
  addAssessment: (playerId: string, ratings: SkillRatings, note: string) => string;
  createMatch: (teamId: string, opponent: string, matchDate: string) => string;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  setMatchScore: (matchId: string, scoreFor: number, scoreAgainst: number) => void;
  addMatchEvent: (input: {
    matchId: string;
    matchMinute: number;
    third: PitchThird;
    channel: PitchChannel;
    outcome: MatchOutcome;
    pressure: Pressure;
  }) => string;
  undoMatchEvent: (matchId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(workspaceReducer, undefined, createDemoWorkspace);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted || !stored) return;
        dispatch({ type: "hydrate", data: JSON.parse(stored) as WorkspaceData });
      })
      .catch(() => {
        // The demo workspace remains available if local storage cannot be read.
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      // Keep the current in-memory session usable if persistence fails.
    });
  }, [data, isReady]);

  const addAssessment = useCallback((playerId: string, ratings: SkillRatings, note: string) => {
    const id = createId("assessment");
    dispatch({
      type: "addAssessment",
      assessment: {
        id,
        playerId,
        createdAt: new Date().toISOString(),
        ratings,
        note: note.trim(),
      },
    });
    return id;
  }, []);

  const createMatch = useCallback((teamId: string, opponent: string, matchDate: string) => {
    const id = createId("match");
    dispatch({
      type: "createMatch",
      match: {
        id,
        teamId,
        opponent: opponent.trim(),
        matchDate,
        status: "pending",
      },
    });
    return id;
  }, []);

  const setMatchStatus = useCallback((matchId: string, status: MatchStatus) => {
    dispatch({ type: "setMatchStatus", matchId, status, at: new Date().toISOString() });
  }, []);

  const setMatchScore = useCallback((matchId: string, scoreFor: number, scoreAgainst: number) => {
    dispatch({ type: "setMatchScore", matchId, scoreFor, scoreAgainst });
  }, []);

  const addMatchEvent = useCallback((input: {
    matchId: string;
    matchMinute: number;
    third: PitchThird;
    channel: PitchChannel;
    outcome: MatchOutcome;
    pressure: Pressure;
  }) => {
    const id = createId("event");
    dispatch({
      type: "addMatchEvent",
      event: {
        ...input,
        id,
        recordedAt: new Date().toISOString(),
      },
    });
    return id;
  }, []);

  const undoMatchEvent = useCallback((matchId: string) => {
    dispatch({ type: "undoMatchEvent", matchId });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: "updateSettings", settings });
  }, []);

  const resetWorkspace = useCallback(() => {
    dispatch({ type: "reset", data: createDemoWorkspace() });
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      data,
      isReady,
      addAssessment,
      createMatch,
      setMatchStatus,
      setMatchScore,
      addMatchEvent,
      undoMatchEvent,
      updateSettings,
      resetWorkspace,
    }),
    [
      data,
      isReady,
      addAssessment,
      createMatch,
      setMatchStatus,
      setMatchScore,
      addMatchEvent,
      undoMatchEvent,
      updateSettings,
      resetWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
