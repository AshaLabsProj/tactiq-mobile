/**
 * EventSelector — 4 large outcome buttons for 2-tap match capture
 *
 * Appears after the coach taps a pitch zone.
 * Each button is 88px tall minimum (Touchline Mode standard).
 * Haptic feedback on selection.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radius, spacing, typography } from "@/lib/palette";
import type { MatchOutcome } from "@/types/models";

interface OutcomeConfig {
  outcome: MatchOutcome;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

const OUTCOMES: OutcomeConfig[] = [
  {
    outcome: "progression",
    label: "Progression",
    icon: "arrow-upward",
    color: "#166534",
    bg: "#DCFCE7",
    border: "#86EFAC",
  },
  {
    outcome: "chance",
    label: "Chance",
    icon: "bolt",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FCD34D",
  },
  {
    outcome: "retention",
    label: "Retention",
    icon: "radio-button-checked",
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#93C5FD",
  },
  {
    outcome: "turnover",
    label: "Turnover",
    icon: "close",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FCA5A5",
  },
];

interface EventSelectorProps {
  onSelect: (outcome: MatchOutcome) => void;
  onCancel?: () => void;
  zoneName?: string;
}

export function EventSelector({ onSelect, onCancel, zoneName }: EventSelectorProps) {
  return (
    <View style={styles.container}>
      {zoneName ? (
        <Text style={styles.zoneLabel}>{zoneName}</Text>
      ) : null}
      <Text style={styles.prompt}>What happened?</Text>
      <View style={styles.grid}>
        {OUTCOMES.map((cfg) => (
          <Pressable
            key={cfg.outcome}
            accessibilityRole="button"
            accessibilityLabel={cfg.label}
            onPress={() => onSelect(cfg.outcome)}
            style={({ pressed }) => [
              styles.outcomeBtn,
              { backgroundColor: cfg.bg, borderColor: cfg.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: cfg.border }]}>
              <MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} />
            </View>
            <Text style={[styles.outcomeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </Pressable>
        ))}
      </View>
      {onCancel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  zoneLabel: {
    ...typography.eyebrow,
    color: palette.primary,
    textAlign: "center",
  },
  prompt: {
    ...typography.sectionHead,
    color: palette.ink,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  outcomeBtn: {
    flex: 1,
    minWidth: "45%",
    minHeight: 88,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  outcomeLabel: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  cancelLabel: {
    ...typography.bodyMed,
    color: palette.muted,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
