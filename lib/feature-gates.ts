import {
  ACTION_BY_KEY,
  type ActionType,
  type FocusGoal,
  type Match,
  type Player,
  type Team,
  type WorkspaceData,
} from "@/types/models";
import type { EntitlementSnapshot } from "@/lib/entitlements";
import { hasProAccess } from "@/lib/entitlements";

export type ProFeature =
  | "extra-team"
  | "extra-player"
  | "extended-actions"
  | "season-history"
  | "extra-focus-goal"
  | "transfer-analytics"
  | "cloud-sync"
  | "csv-export"
  | "drill-library";

export type GateResult =
  | { allowed: true }
  | { allowed: false; feature: ProFeature; title: string; body: string };

export const FREE_TIER = {
  teams: 1,
  playersPerTeam: 8,
  visibleMatchHistory: 3,
  activeFocusGoals: 1,
  drillCards: 4,
} as const;

const COPY: Record<ProFeature, Omit<Extract<GateResult, { allowed: false }>, "allowed" | "feature">> = {
  "extra-team": { title: "Bring every team together", body: "Free includes one team. Pro keeps every squad in the same calm workspace." },
  "extra-player": { title: "Keep the full squad in view", body: "Free supports eight players per team. Pro grows with your complete squad." },
  "extended-actions": { title: "See the detail behind the game", body: "Pro unlocks detailed tags such as key passes, duels and interceptions." },
  "season-history": { title: "Keep the whole season", body: "Your fourth match is ready to save. Pro keeps your full season history." },
  "extra-focus-goal": { title: "Build more than one focus", body: "Free includes one active focus goal. Pro lets each player and team develop in parallel." },
  "transfer-analytics": { title: "See practice turn into match impact", body: "Pro reveals the full practice-to-pitch trend, baseline and match-by-match evidence." },
  "cloud-sync": { title: "Keep coaching work safe across devices", body: "Pro includes private cloud backup and multi-device sync. Your local work always remains on this device." },
  "csv-export": { title: "Take the data with you", body: "Pro includes CSV export and a richer share summary for your full season." },
  "drill-library": { title: "Unlock the complete drill library", body: "Pro includes every concise, match-linked coaching card." },
};

function proOr(feature: ProFeature, entitlement: EntitlementSnapshot): GateResult {
  if (hasProAccess(entitlement)) return { allowed: true };
  return { allowed: false, feature, ...COPY[feature] };
}

export function gateForFeature(feature: ProFeature, entitlement: EntitlementSnapshot): GateResult {
  return proOr(feature, entitlement);
}

export function gateNewTeam(teams: Team[], entitlement: EntitlementSnapshot): GateResult {
  return teams.length < FREE_TIER.teams ? { allowed: true } : proOr("extra-team", entitlement);
}

export function gateNewPlayer(players: Player[], teamId: string, entitlement: EntitlementSnapshot): GateResult {
  return players.filter((player) => player.teamId === teamId).length < FREE_TIER.playersPerTeam
    ? { allowed: true }
    : proOr("extra-player", entitlement);
}

export function gateAction(actionType: ActionType, entitlement: EntitlementSnapshot): GateResult {
  return ACTION_BY_KEY[actionType].tier === "core" ? { allowed: true } : proOr("extended-actions", entitlement);
}

export function gateNewFocusGoal(goals: FocusGoal[], entitlement: EntitlementSnapshot): GateResult {
  return goals.filter((goal) => goal.status === "active").length < FREE_TIER.activeFocusGoals
    ? { allowed: true }
    : proOr("extra-focus-goal", entitlement);
}

export function visibleMatchHistory(matches: Match[], entitlement: EntitlementSnapshot): Match[] {
  if (hasProAccess(entitlement)) return matches;
  return [...matches]
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, FREE_TIER.visibleMatchHistory);
}

/** Existing over-limit records are visible/read-only after a downgrade; nothing is deleted. */
export function isReadOnlyAfterDowngrade(
  feature: ProFeature,
  entitlement: EntitlementSnapshot,
  data: WorkspaceData,
  record?: { teamId?: string; id?: string },
): boolean {
  if (hasProAccess(entitlement)) return false;
  if (feature === "extra-team" && record?.id) return !data.teams.slice(0, FREE_TIER.teams).some((team) => team.id === record.id);
  if (feature === "extra-player" && record?.teamId && record?.id) {
    return !data.players.filter((player) => player.teamId === record.teamId).slice(0, FREE_TIER.playersPerTeam).some((player) => player.id === record.id);
  }
  return false;
}

