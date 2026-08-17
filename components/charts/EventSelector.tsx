/**
 * EventSelector — the second tap in live match capture.
 *
 * The 12 core actions remain visible by default. Detailed tagging is optional
 * and reveals the 12 extended actions without interrupting the zone → action
 * primary capture flow.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useEntitlement } from "@/contexts/entitlement-context";
import { ACTION_DEFINITIONS, type ActionType, type EventValence, type MatchCategory } from "@/types/models";
import { palette, radius, spacing, typography } from "@/lib/palette";

type IconName = keyof typeof MaterialIcons.glyphMap;

interface ActionPresentation {
  icon: IconName;
  background: string;
  border: string;
  text: string;
}

const CATEGORY_STYLE: Record<MatchCategory, Omit<ActionPresentation, "icon">> = {
  attacking: { background: "#E8F7F3", border: "#A7E7D3", text: "#0F6B50" },
  possession: { background: "#EEF8F2", border: "#B8E4CD", text: "#166A4D" },
  defending: { background: "#F2F7ED", border: "#CFE1C2", text: "#3F6C35" },
  goalkeeping: { background: "#F5F8F1", border: "#D7E5CF", text: "#3B6636" },
  "set-piece": { background: "#FFF7E6", border: "#F7D68E", text: "#9A5D00" },
  discipline: { background: "#FFF0EF", border: "#F8B8B1", text: "#A13E37" },
  "team-admin": { background: "#F3F4F2", border: "#D6D9D4", text: "#4B5563" },
};

const ICONS: Record<ActionType, IconName> = {
  goalFor: "sports-soccer",
  goalAgainst: "remove-circle-outline",
  shotOnTarget: "gps-fixed",
  shotOffTarget: "gps-not-fixed",
  chanceCreated: "bolt",
  progression: "north-east",
  retention: "check-circle-outline",
  turnover: "close",
  regain: "restart-alt",
  clearance: "block",
  save: "front-hand",
  setPieceWon: "outlined-flag",
  assist: "handshake",
  keyPass: "shortcut",
  cross: "call-split",
  dribbleWon: "directions-run",
  tackleWon: "shield",
  interception: "remove-red-eye",
  aerialWon: "arrow-upward",
  foulWon: "emoji-events",
  foulCommitted: "warning-amber",
  offside: "flag",
  card: "style",
  substitution: "swap-horiz",
};

function presentation(actionType: ActionType, category: MatchCategory, valence: EventValence): ActionPresentation {
  if (actionType === "goalFor") {
    return { icon: ICONS[actionType], background: "#168A68", border: "#168A68", text: "#FFFFFF" };
  }
  if (valence === "negative") {
    return { icon: ICONS[actionType], background: "#FFF0EF", border: "#F8B8B1", text: "#A13E37" };
  }
  return { icon: ICONS[actionType], ...CATEGORY_STYLE[category] };
}

interface EventSelectorProps {
  onSelect: (actionType: ActionType) => void;
  onCancel?: () => void;
  zoneName?: string;
  detailedEnabled?: boolean;
  onDetailedEnabledChange?: (enabled: boolean) => void;
}

export function EventSelector({
  onSelect,
  onCancel,
  zoneName,
  detailedEnabled = false,
  onDetailedEnabledChange,
}: EventSelectorProps) {
  const { isPro, gate } = useEntitlement();
  const visibleActions = ACTION_DEFINITIONS.filter(
    (action) => action.tier === "core" || detailedEnabled,
  );

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View>
          {zoneName ? <Text style={styles.zoneLabel}>{zoneName}</Text> : null}
          <Text style={styles.prompt}>What happened?</Text>
        </View>
        {onDetailedEnabledChange ? (
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityLabel="Detailed tagging"
            accessibilityState={{ checked: detailedEnabled }}
            activeOpacity={0.8}
            onPress={() => {
              if (!detailedEnabled && !isPro) {
                const access = gate("extended-actions", "live_match_detailed_tagging");
                if (!access.allowed) router.push("/paywall?origin=live-match-detailed-tags" as never);
                return;
              }
              onDetailedEnabledChange(!detailedEnabled);
            }}
            style={[styles.detailToggle, detailedEnabled && styles.detailToggleActive]}
          >
            <MaterialIcons name="tune" size={16} color={detailedEnabled ? "#FFFFFF" : palette.primaryDark} />
            <Text style={[styles.detailToggleText, detailedEnabled && styles.detailToggleTextActive]}>{detailedEnabled ? "Detailed" : isPro ? "Detailed" : "Pro detail"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.grid}>
        {visibleActions.map((action) => {
          const visual = presentation(action.key, action.category, action.valence);
          return (
            <TouchableOpacity
              key={action.key}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              activeOpacity={0.78}
              onPress={() => onSelect(action.key)}
              style={[styles.actionButton, { backgroundColor: visual.background, borderColor: visual.border }]}
            >
              <MaterialIcons name={visual.icon} size={20} color={visual.text} />
              <Text numberOfLines={2} style={[styles.actionLabel, { color: visual.text }]}>{action.shortLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {onCancel ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cancel action selection"
          activeOpacity={0.75}
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  headingRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm },
  zoneLabel: { ...typography.eyebrow, color: palette.primaryDark, marginBottom: 2 },
  prompt: { ...typography.sectionHead, color: palette.white },
  detailToggle: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#63D6AE",
    backgroundColor: "#E8F7F3",
  },
  detailToggleActive: { backgroundColor: "#168A68", borderColor: "#168A68" },
  detailToggleText: { fontSize: 12, fontWeight: "800", color: palette.primaryDark },
  detailToggleTextActive: { color: "#FFFFFF" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: {
    width: "31.8%",
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: { fontSize: 11, lineHeight: 13, fontWeight: "800", textAlign: "center" },
  cancelButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  cancelLabel: { ...typography.bodyMed, color: "rgba(255,255,255,0.72)" },
});
