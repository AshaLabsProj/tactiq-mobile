/**
 * Live Match Capture — redesigned 2026-08-08
 * 2-tap model: zone → outcome. Haptic + toast with UNDO.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventSelector } from "@/components/charts/EventSelector";
import { PitchMap } from "@/components/charts/PitchMap";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { matchMetrics } from "@/lib/insights";
import type { MatchOutcome, PitchChannel, PitchThird } from "@/types/models";
import { CHANNEL_LABELS, THIRD_LABELS } from "@/types/models";

const TOAST_DURATION = 4000;

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, addMatchEvent, undoMatchEvent, setMatchStatus } = useWorkspace();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const haptic = (style = Haptics.ImpactFeedbackStyle.Medium) =>
    Haptics.impactAsync(style);

  const match = data.matches.find((m) => m.id === id);
  const matchEvents = data.matchEvents.filter((e) => e.matchId === id);
  const metrics = matchMetrics(matchEvents);

  const [selectedZone, setSelectedZone] = useState<{ third: PitchThird; channel: PitchChannel } | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (match?.status !== "live") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [match?.status]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(TOAST_DURATION - 300),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setToastMsg(null), TOAST_DURATION);
  };

  const handleZonePress = (third: PitchThird, channel: PitchChannel) => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedZone({ third, channel });
    setShowEventSelector(true);
  };

  const handleOutcome = (outcome: MatchOutcome) => {
    if (!selectedZone || !id) return;
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    addMatchEvent({
      matchId: id,
      matchMinute: Math.floor(elapsed / 60),
      third: selectedZone.third,
      channel: selectedZone.channel,
      outcome,
      pressure: "medium",
    });
    const zoneName = `${CHANNEL_LABELS[selectedZone.channel]} ${THIRD_LABELS[selectedZone.third].toLowerCase()}`;
    const outcomeLabel = outcome === "progression" ? "Progression" : outcome === "chance" ? "Chance" : outcome === "retention" ? "Retention" : "Turnover";
    showToast(`${outcomeLabel} · ${zoneName}`);
    setSelectedZone(null);
    setShowEventSelector(false);
  };

  const handleUndo = () => {
    if (!id) return;
    haptic();
    undoMatchEvent(id);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(null);
    toastOpacity.setValue(0);
  };

  const handleEndMatch = () => {
    Alert.alert("End Match", "Are you sure you want to end this match?", [
      { text: "Cancel", style: "cancel" },
      { text: "End Match", style: "destructive", onPress: () => {
        haptic(Haptics.ImpactFeedbackStyle.Heavy);
        setMatchStatus(id!, "completed");
        router.replace({ pathname: "/match/summary/[id]", params: { id: id! } });
      }},
    ]);
  };

  if (!match) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Match not found</Text>
      </View>
    );
  }

  const availableH = screenHeight - insets.top - insets.bottom - 56 - 72 - 20;
  const pitchH = showEventSelector ? Math.min(availableH * 0.42, 220) : Math.min(availableH * 0.78, 440);
  const pitchW = Math.min(screenWidth - spacing.base * 2, pitchH * 0.72);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>LIVE</Text>
        </View>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <Text style={styles.opponent} numberOfLines={1}>vs {match.opponent}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="End match" onPress={handleEndMatch} style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatPill label="Events" value={metrics.totalEvents} />
        <StatPill label="Prog" value={metrics.outcomeCounts.progression} color="#4ADE80" />
        <StatPill label="Chance" value={metrics.outcomeCounts.chance} color={palette.amber} />
        <StatPill label="Turnover" value={metrics.outcomeCounts.turnover} color={palette.coral} />
      </View>

      <View style={styles.pitchContainer}>
        <PitchMap width={pitchW} height={pitchH} onZonePress={handleZonePress} selectedZone={selectedZone} showLabels />
      </View>

      {showEventSelector ? (
        <View style={styles.eventSelectorContainer}>
          <EventSelector
            onSelect={handleOutcome}
            onCancel={() => { setSelectedZone(null); setShowEventSelector(false); }}
            zoneName={selectedZone ? `${CHANNEL_LABELS[selectedZone.channel]} ${THIRD_LABELS[selectedZone.third]}` : undefined}
          />
        </View>
      ) : (
        <View style={styles.pitchHint}>
          <Text style={styles.pitchHintText}>Tap a zone to record an event</Text>
        </View>
      )}

      {toastMsg ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, bottom: insets.bottom + 140 }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Undo last event" onPress={handleUndo} style={({ pressed }) => [styles.undoBtn, pressed && styles.pressed]}>
            <Text style={styles.undoBtnText}>UNDO</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause match" onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Light); setMatchStatus(id!, match.status === "live" ? "paused" : "live"); }} style={styles.pauseBtn}>
          <MaterialIcons name={match.status === "live" ? "pause" : "play-arrow"} size={22} color={palette.white} />
          <Text style={styles.pauseBtnText}>{match.status === "live" ? "Pause" : "Resume"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="End match" onPress={handleEndMatch} style={styles.endMatchBtn}>
          <MaterialIcons name="stop" size={22} color={palette.coral} />
          <Text style={styles.endMatchBtnText}>End Match</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  errorText: { ...typography.body, color: palette.white, textAlign: "center", marginTop: 40 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.base, height: 56, gap: spacing.md },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(74,222,128,0.15)", paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: "#4ADE80" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  liveLabel: { ...typography.eyebrow, color: "#4ADE80" },
  timer: { ...typography.sectionHead, color: palette.white, fontVariant: ["tabular-nums"] as any, flex: 1 },
  opponent: { ...typography.bodyMed, color: palette.matchMuted },
  endBtn: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.md, backgroundColor: "rgba(248,113,113,0.15)", borderWidth: 1, borderColor: palette.coral },
  endBtnText: { ...typography.caption, color: palette.coral, fontWeight: "700" as const },
  statsRow: { flexDirection: "row", paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  statPill: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center", gap: 2 },
  statValue: { ...typography.sectionHead, color: palette.white, fontVariant: ["tabular-nums"] as any },
  statLabel: { ...typography.eyebrow, color: palette.matchMuted, fontSize: 10 },
  pitchContainer: { alignItems: "center", paddingHorizontal: spacing.base },
  eventSelectorContainer: { flex: 1, paddingTop: spacing.md },
  pitchHint: { alignItems: "center", paddingTop: spacing.md },
  pitchHintText: { ...typography.caption, color: palette.matchMuted },
  toast: { position: "absolute", left: spacing.base, right: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.navy, borderRadius: radius.xl, borderWidth: 1, borderColor: palette.navyBorder, paddingHorizontal: spacing.base, paddingVertical: spacing.md, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  toastText: { ...typography.bodyMed, color: palette.white, flex: 1 },
  undoBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.12)" },
  undoBtnText: { ...typography.eyebrow, color: palette.white },
  bottomBar: { flexDirection: "row", paddingHorizontal: spacing.base, paddingTop: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" },
  pauseBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: "#1C3A52", borderRadius: radius.lg, paddingVertical: spacing.md, minHeight: 52 },
  pauseBtnText: { ...typography.bodyMed, color: palette.white },
  endMatchBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: "#2D1B1B", borderRadius: radius.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: "#F87171", minHeight: 52 },
  endMatchBtnText: { ...typography.bodyMed, color: palette.coral },
  pressed: { opacity: 0.72 },
});
