/**
 * Match Live Screen
 *
 * Navy/blue color identity — visually distinct from the green assessment flow.
 * Zone selection via interactive SVG soccer pitch (replaces text button rows).
 * Outcome buttons appear below the pitch once a zone is selected.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppButton,
  AppCard,
  IconButton,
  StatusChip,
} from "@/components/mobile/ui";
import {
  PitchZoneSelector,
  type PitchZone,
} from "@/components/pitch-zone-selector";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import type { MatchOutcome } from "@/types/models";

// ─── Outcome definitions ──────────────────────────────────────────────────────
const OUTCOMES: { key: MatchOutcome; label: string; color: string; bg: string }[] = [
  { key: "progression", label: "Progression ↑", color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  { key: "chance",      label: "Chance ⚡",      color: "#FCD34D", bg: "rgba(252,211,77,0.15)" },
  { key: "retention",   label: "Retention ●",   color: "#93C5FD", bg: "rgba(147,197,253,0.15)" },
  { key: "turnover",    label: "Turnover ✕",    color: "#F87171", bg: "rgba(248,113,113,0.15)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function zoneLabel(zone: PitchZone): string {
  const t = zone.third === "defensive" ? "Def" : zone.third === "middle" ? "Mid" : "Atk";
  const c = zone.channel.charAt(0).toUpperCase() + zone.channel.slice(1);
  return `${t} · ${c}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MatchLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, addMatchEvent, undoMatchEvent, setMatchStatus } = useWorkspace();
  const insets = useSafeAreaInsets();

  const match = data.matches.find((m) => m.id === id);
  const events = data.matchEvents.filter((e) => e.matchId === id);
  const hapticsEnabled = data.settings.hapticsEnabled;

  const [selectedZone, setSelectedZone] = useState<PitchZone | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (match?.status === "live") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match?.status]);

  useEffect(() => {
    if (match && match.status === "pending") {
      setMatchStatus(id, "live");
    }
  }, [id, match, setMatchStatus]);

  if (!match) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <MaterialIcons name="sports-soccer" size={40} color={palette.muted} />
          <Text style={styles.notFoundTitle}>Match not found</Text>
          <AppButton
            label="Back to home"
            variant="secondary"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </ScreenContainer>
    );
  }

  const handleZoneSelect = (zone: PitchZone) => {
    if (selectedZone?.third === zone.third && selectedZone?.channel === zone.channel) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zone);
      haptic.light(hapticsEnabled);
    }
  };

  const recordEvent = (outcome: MatchOutcome) => {
    if (!selectedZone) return;
    const minute = Math.floor(elapsed / 60) + 1;
    addMatchEvent({
      matchId: id,
      matchMinute: minute,
      third: selectedZone.third,
      channel: selectedZone.channel,
      outcome,
      pressure: "medium",
    });
    haptic.light(hapticsEnabled);
    setSelectedZone(null);
  };

  const endMatch = () => {
    Alert.alert(
      "End match?",
      "This will mark the match as completed. You can review the summary afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End match",
          style: "destructive",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setMatchStatus(id, "completed");
            haptic.success(hapticsEnabled);
            router.replace({ pathname: "/match/summary/[id]", params: { id } });
          },
        },
      ],
    );
  };

  const progressions = events.filter((e) => e.outcome === "progression").length;
  const chances = events.filter((e) => e.outcome === "chance").length;
  const turnovers = events.filter((e) => e.outcome === "turnover").length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <StatusChip label={match.status === "paused" ? "Paused" : "Live"} tone="amber" />
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        </View>
        <Text style={styles.opponent} numberOfLines={1}>vs {match.opponent}</Text>
        <View style={styles.topRight}>
          <IconButton
            name="undo"
            accessibilityLabel="Undo last event"
            onPress={() => {
              undoMatchEvent(id);
              haptic.light(hapticsEnabled);
            }}
          />
          <IconButton
            name="stop-circle"
            accessibilityLabel="End match"
            tone="primary"
            onPress={endMatch}
          />
        </View>
      </View>

      {/* ── Stats strip ── */}
      <View style={styles.statsStrip}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{events.length}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: "#4ADE80" }]}>{progressions}</Text>
          <Text style={styles.statLabel}>Prog.</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: "#FCD34D" }]}>{chances}</Text>
          <Text style={styles.statLabel}>Chances</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: "#F87171" }]}>{turnovers}</Text>
          <Text style={styles.statLabel}>Turnovers</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* ── Pitch zone selector ── */}
        <View style={styles.pitchWrapper}>
          <Text style={styles.pitchHint}>
            {selectedZone
              ? `Zone: ${zoneLabel(selectedZone)} — tap an outcome below`
              : "Tap a zone on the pitch to record an event"}
          </Text>
          <PitchZoneSelector selected={selectedZone} onSelect={handleZoneSelect} />
        </View>

        {/* ── Outcome buttons ── */}
        <View style={[styles.outcomeSection, !selectedZone && styles.outcomeSectionDisabled]}>
          <Text style={styles.outcomeSectionTitle}>
            {selectedZone ? "Record outcome" : "Select a zone first"}
          </Text>
          <View style={styles.outcomeGrid}>
            {OUTCOMES.map(({ key, label, color, bg }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                disabled={!selectedZone}
                onPress={() => recordEvent(key)}
                style={({ pressed }) => [
                  styles.outcomeBtn,
                  { borderColor: color, backgroundColor: bg },
                  !selectedZone && styles.outcomeBtnDisabled,
                  pressed && selectedZone && styles.pressed,
                ]}
              >
                <Text style={[styles.outcomeBtnText, { color }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Recent events ── */}
        {events.length > 0 ? (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>Recent events</Text>
            <AppCard style={styles.eventList}>
              {events
                .slice(-5)
                .reverse()
                .map((event, index) => {
                  const outcomeColor =
                    OUTCOMES.find((o) => o.key === event.outcome)?.color ?? palette.ink;
                  return (
                    <View
                      key={event.id}
                      style={[styles.eventRow, index > 0 && styles.eventDivider]}
                    >
                      <Text style={styles.eventMinute}>{event.matchMinute}&apos;</Text>
                      <Text style={styles.eventDesc}>
                        {event.third.charAt(0).toUpperCase() + event.third.slice(1)} ·{" "}
                        {event.channel.charAt(0).toUpperCase() + event.channel.slice(1)}
                      </Text>
                      <Text style={[styles.eventOutcome, { color: outcomeColor }]}>
                        {event.outcome}
                      </Text>
                    </View>
                  );
                })}
            </AppCard>
          </View>
        ) : (
          <View style={styles.emptyEvents}>
            <Text style={styles.emptyEventsText}>
              No events yet — tap a zone on the pitch to start
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.navy,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  timer: {
    color: palette.white,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  opponent: {
    flex: 1,
    color: palette.white,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: palette.navyMid,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stat: { alignItems: "center", gap: 2 },
  statValue: {
    color: palette.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  statDivider: { width: 1, height: 30, backgroundColor: palette.navyBorder },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  pitchWrapper: {
    gap: 8,
    alignItems: "center",
  },
  pitchHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  outcomeSection: {
    gap: 10,
  },
  outcomeSectionDisabled: {
    opacity: 0.45,
  },
  outcomeSectionTitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  outcomeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  outcomeBtn: {
    width: "47%",
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  outcomeBtnDisabled: { opacity: 0.5 },
  outcomeBtnText: { fontSize: 14, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  eventsSection: {
    gap: 8,
  },
  eventsSectionTitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventList: { paddingVertical: 4, paddingHorizontal: 0 },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  eventMinute: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    width: 28,
  },
  eventDesc: { flex: 1, color: palette.ink, fontSize: 13, lineHeight: 18 },
  eventOutcome: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  emptyEvents: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyEventsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  notFound: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  notFoundTitle: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
