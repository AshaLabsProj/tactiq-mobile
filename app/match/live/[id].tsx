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
import {
  AppButton,
  AppCard,
  IconButton,
  mobileStyles,
  StatusChip,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import type { MatchOutcome, PitchChannel, PitchThird } from "@/types/models";

const THIRDS: { key: PitchThird; label: string }[] = [
  { key: "defensive", label: "Defensive" },
  { key: "middle", label: "Middle" },
  { key: "attacking", label: "Attacking" },
];

const CHANNELS: { key: PitchChannel; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "central", label: "Central" },
  { key: "right", label: "Right" },
];

const OUTCOMES: { key: MatchOutcome; label: string; color: string }[] = [
  { key: "progression", label: "Progression", color: palette.primary },
  { key: "chance", label: "Chance", color: palette.amber },
  { key: "retention", label: "Retention", color: palette.primaryDark },
  { key: "turnover", label: "Turnover", color: palette.coral },
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MatchLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, addMatchEvent, undoMatchEvent, setMatchStatus, setMatchScore } = useWorkspace();
  const match = data.matches.find((m) => m.id === id);
  const events = data.matchEvents.filter((e) => e.matchId === id);
  const hapticsEnabled = data.settings.hapticsEnabled;

  const [selectedThird, setSelectedThird] = useState<PitchThird | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<PitchChannel | null>(null);
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

  const recordEvent = (outcome: MatchOutcome) => {
    if (!selectedThird || !selectedChannel) return;
    const minute = Math.floor(elapsed / 60) + 1;
    addMatchEvent({
      matchId: id,
      matchMinute: minute,
      third: selectedThird,
      channel: selectedChannel,
      outcome,
      pressure: "medium",
    });
    haptic.light(hapticsEnabled);
    setSelectedThird(null);
    setSelectedChannel(null);
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

  const canRecord = selectedThird !== null && selectedChannel !== null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <StatusChip label={match.status === "paused" ? "Paused" : "Live"} tone="amber" />
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        </View>
        <Text style={styles.opponent}>vs {match.opponent}</Text>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <AppCard style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {events.filter((e) => e.outcome === "progression").length}
            </Text>
            <Text style={styles.statLabel}>Progressions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {events.filter((e) => e.outcome === "chance").length}
            </Text>
            <Text style={styles.statLabel}>Chances</Text>
          </View>
        </AppCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pitch third</Text>
          <View style={styles.choiceRow}>
            {THIRDS.map(({ key, label }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedThird(key);
                  haptic.light(hapticsEnabled);
                }}
                style={[
                  styles.choiceBtn,
                  selectedThird === key && styles.choiceBtnSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceBtnText,
                    selectedThird === key && styles.choiceBtnTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel</Text>
          <View style={styles.choiceRow}>
            {CHANNELS.map(({ key, label }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedChannel(key);
                  haptic.light(hapticsEnabled);
                }}
                style={[
                  styles.choiceBtn,
                  selectedChannel === key && styles.choiceBtnSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceBtnText,
                    selectedChannel === key && styles.choiceBtnTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, !canRecord && styles.sectionTitleMuted]}>
            Outcome {!canRecord ? "— select zone first" : ""}
          </Text>
          <View style={styles.outcomeGrid}>
            {OUTCOMES.map(({ key, label, color }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                disabled={!canRecord}
                onPress={() => recordEvent(key)}
                style={({ pressed }) => [
                  styles.outcomeBtn,
                  { borderColor: color },
                  !canRecord && styles.outcomeBtnDisabled,
                  pressed && canRecord && styles.pressed,
                ]}
              >
                <Text style={[styles.outcomeBtnText, { color }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {events.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent events</Text>
            <AppCard style={styles.eventList}>
              {events
                .slice(-5)
                .reverse()
                .map((event, index) => (
                  <View
                    key={event.id}
                    style={[styles.eventRow, index > 0 && styles.eventDivider]}
                  >
                    <Text style={styles.eventMinute}>{event.matchMinute}&apos;</Text>
                    <Text style={styles.eventDesc}>
                      {event.third} · {event.channel}
                    </Text>
                    <Text
                      style={[
                        styles.eventOutcome,
                        {
                          color:
                            OUTCOMES.find((o) => o.key === event.outcome)?.color ??
                            palette.ink,
                        },
                      ]}
                    >
                      {event.outcome}
                    </Text>
                  </View>
                ))}
            </AppCard>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  timer: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  opponent: {
    flex: 1,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 18,
  },
  stat: { alignItems: "center", gap: 4 },
  statValue: {
    color: palette.ink,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statLabel: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  statDivider: { width: 1, height: 36, backgroundColor: palette.border },
  section: { gap: 10 },
  sectionTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  sectionTitleMuted: { color: palette.muted },
  choiceRow: { flexDirection: "row", gap: 10 },
  choiceBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceBtnSelected: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  choiceBtnText: { color: palette.muted, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  choiceBtnTextSelected: { color: palette.primaryDark },
  outcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  outcomeBtn: {
    width: "47%",
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  outcomeBtnDisabled: { opacity: 0.35 },
  outcomeBtnText: { fontSize: 15, lineHeight: 20, fontWeight: "700" },
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
