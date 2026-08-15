/**
 * Live Match Capture
 *
 * Core sideline flow remains two taps: zone → action → recorded. Player tagging,
 * pressure adjustment, and editing are optional follow-ons that never interrupt
 * the core path and work against the local workspace before any sync occurs.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventSelector } from "@/components/charts/EventSelector";
import { PitchMap } from "@/components/charts/PitchMap";
import { useWorkspace } from "@/contexts/workspace-context";
import { derivedScore, elapsedMatchSeconds, matchMetrics } from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import {
  ACTION_DEFINITIONS,
  ACTION_BY_KEY,
  CHANNEL_LABELS,
  THIRD_LABELS,
  type ActionType,
  type MatchEvent,
  type PitchChannel,
  type PitchThird,
  type Pressure,
} from "@/types/models";

const TOAST_DURATION = 5200;
const KEEP_AWAKE_TAG = "skilltracker-live-match";
const THIRDS: PitchThird[] = ["defensive", "middle", "attacking"];
const CHANNELS: PitchChannel[] = ["left", "central", "right"];
const PRESSURES: Pressure[] = ["low", "medium", "high"];

type Zone = { third: PitchThird; channel: PitchChannel };

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function haptic(enabled: boolean, style: Haptics.ImpactFeedbackStyle) {
  if (enabled) void Haptics.impactAsync(style);
}

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    data,
    addMatchEvent,
    assignEventPlayer,
    deleteMatchEvent,
    setMatchPeriod,
    setMatchStatus,
    undoMatchEvent,
    updateMatchEvent,
    updateSettings,
  } = useWorkspace();
  const match = data.matches.find((item) => item.id === id);
  const events = useMemo(
    () => data.matchEvents.filter((event) => event.matchId === id).sort((a, b) => b.matchMinute - a.matchMinute),
    [data.matchEvents, id],
  );
  const teamPlayers = useMemo(
    () => data.players.filter((player) => player.teamId === match?.teamId),
    [data.players, match?.teamId],
  );
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [pressure, setPressure] = useState<Pressure>(data.settings.defaultPressure);
  const [detailed, setDetailed] = useState(data.settings.detailedTaggingEnabled);
  const [ticker, setTicker] = useState(0);
  const [toastEventId, setToastEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [taggingEventId, setTaggingEventId] = useState<string | null>(null);
  const [eventLogOpen, setEventLogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const metrics = matchMetrics(events);
  const score = derivedScore(events, match);
  const elapsed = match ? elapsedMatchSeconds(match) : 0;

  useEffect(() => {
    if (match?.status !== "live") return;
    const interval = setInterval(() => setTicker((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [match?.status]);

  useEffect(() => {
    if (match?.status === "live") {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }
    void deactivateKeepAwake(KEEP_AWAKE_TAG);
    return undefined;
  }, [match?.status]);

  useEffect(() => {
    setPressure(data.settings.defaultPressure);
  }, [data.settings.defaultPressure]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (eventId: string, message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastEventId(eventId);
    setToastMessage(message);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.delay(TOAST_DURATION - 340),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => {
      setToastEventId(null);
      setToastMessage(null);
    }, TOAST_DURATION);
  };

  const selectZone = (third: PitchThird, channel: PitchChannel) => {
    haptic(data.settings.hapticsEnabled, Haptics.ImpactFeedbackStyle.Light);
    setSelectedZone({ third, channel });
    setShowSelector(true);
  };

  const recordAction = (actionType: ActionType, zone = selectedZone) => {
    if (!match || !id) return;
    const definition = ACTION_BY_KEY[actionType];
    if (definition.zoneRequired && !zone) {
      if (data.settings.hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const eventId = addMatchEvent({
      matchId: id,
      matchMinute: Math.max(1, Math.ceil(elapsed / 60)),
      third: zone?.third,
      channel: zone?.channel,
      actionType,
      pressure,
    });
    if (actionType === "goalFor" || actionType === "goalAgainst") {
      if (data.settings.hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      haptic(data.settings.hapticsEnabled, Haptics.ImpactFeedbackStyle.Heavy);
    }
    const zoneText = zone ? ` · ${CHANNEL_LABELS[zone.channel]} ${THIRD_LABELS[zone.third]}` : "";
    showToast(eventId, `${definition.label}${zoneText}`);
    // The chosen zone intentionally persists, so repeat events only take one tap.
    setShowSelector(true);
  };

  const updatePressure = (nextPressure: Pressure) => {
    haptic(data.settings.hapticsEnabled, Haptics.ImpactFeedbackStyle.Light);
    setPressure(nextPressure);
    updateSettings({ defaultPressure: nextPressure });
  };

  const undoLatest = () => {
    if (!id) return;
    haptic(data.settings.hapticsEnabled, Haptics.ImpactFeedbackStyle.Light);
    undoMatchEvent(id);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastEventId(null);
    setToastMessage(null);
    toastOpacity.setValue(0);
  };

  const endMatch = () => {
    if (!match || !id) return;
    Alert.alert(
      "Finish match?",
      `${score.scoreFor} – ${score.scoreAgainst} vs ${match.opponent}\n${events.length} events recorded`,
      [
        { text: "Keep recording", style: "cancel" },
        {
          text: "Finish match",
          style: "destructive",
          onPress: () => {
            haptic(data.settings.hapticsEnabled, Haptics.ImpactFeedbackStyle.Heavy);
            setMatchStatus(id, "completed");
            router.replace({ pathname: "/match/summary/[id]" as never, params: { id } });
          },
        },
      ],
    );
  };

  const matchControl = () => {
    if (!match || !id) return;
    if (match.status === "pending") {
      setMatchStatus(id, "live");
      return;
    }
    if (match.status === "live" && match.currentPeriod === 1) {
      setMatchStatus(id, "paused");
      return;
    }
    if (match.status === "paused" && match.currentPeriod === 1) {
      setMatchPeriod(id, 2);
      setMatchStatus(id, "live");
      return;
    }
    if (match.status === "live" && match.currentPeriod === 2) {
      endMatch();
      return;
    }
    setMatchStatus(id, match.status === "paused" ? "live" : "paused");
  };

  const matchControlLabel = match?.status === "pending"
    ? "Kick-off"
    : match?.status === "live" && match.currentPeriod === 1
      ? "Half-time"
      : match?.status === "paused" && match.currentPeriod === 1
        ? "Second half"
        : match?.status === "live"
          ? "Full-time"
          : "Resume";

  if (!match) {
    return <View style={[styles.root, { paddingTop: insets.top }]}><Text style={styles.errorText}>Match not found</Text></View>;
  }

  const pitchHeight = showSelector ? 245 : 390;
  const pitchWidth = Math.min(330, Math.round(pitchHeight * 0.72));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.livePill}>
          <View style={[styles.liveDot, match.status !== "live" && styles.liveDotPaused]} />
          <Text style={styles.liveLabel}>{match.status === "live" ? `LIVE · H${match.currentPeriod}` : match.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.timer}>{formatTime(elapsed + ticker * 0)}</Text>
        <Text numberOfLines={1} style={styles.scoreLine}>{score.scoreFor} – {score.scoreAgainst} vs {match.opponent}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open event log" activeOpacity={0.7} onPress={() => setEventLogOpen(true)} style={styles.logButton}>
          <MaterialIcons name="format-list-bulleted" size={21} color="#FFFFFF" />
          <Text style={styles.logCount}>{events.length}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatPill label="Score" value={`${score.scoreFor}-${score.scoreAgainst}`} />
        <StatPill label="Shots" value={metrics.shots} />
        <StatPill label="Chances" value={metrics.chancesCreated} accent="#FBBF24" />
        <StatPill label="Regains" value={metrics.regains} accent="#63D6AE" />
        <StatPill label="Lost" value={metrics.actionCounts.turnover} accent="#F87171" />
      </View>

      <View style={styles.pressureRow}>
        <Text style={styles.pressureLabel}>Pressure</Text>
        <View style={styles.pressureControl}>
          {PRESSURES.map((value) => (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${value} pressure`}
              activeOpacity={0.8}
              onPress={() => updatePressure(value)}
              style={[styles.pressureButton, pressure === value && styles.pressureButtonSelected]}
            >
              <Text style={[styles.pressureButtonText, pressure === value && styles.pressureButtonTextSelected]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Record card or substitution without a pitch zone"
          onPress={() => { setSelectedZone(null); setDetailed(true); setShowSelector(true); }}
          style={styles.adminShortcut}
        >
          <MaterialIcons name="more-horiz" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.pitchContainer}>
        <PitchMap width={pitchWidth} height={pitchHeight} onZonePress={selectZone} selectedZone={selectedZone} showLabels />
      </View>

      {showSelector ? (
        <ScrollView style={styles.selectorScroll} contentContainerStyle={styles.selectorContent} showsVerticalScrollIndicator={false}>
          <EventSelector
            onSelect={(actionType) => recordAction(actionType)}
            onCancel={() => { setShowSelector(false); setSelectedZone(null); }}
            zoneName={selectedZone ? `${CHANNEL_LABELS[selectedZone.channel]} ${THIRD_LABELS[selectedZone.third]}` : "Card & substitution"}
            detailedEnabled={detailed}
            onDetailedEnabledChange={(enabled) => { setDetailed(enabled); updateSettings({ detailedTaggingEnabled: enabled }); }}
          />
        </ScrollView>
      ) : (
        <View style={styles.hint}><Text style={styles.hintText}>Tap a pitch zone, then choose the action.</Text></View>
      )}

      {toastMessage && toastEventId ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, bottom: insets.bottom + 86 }]}>
          <Text numberOfLines={2} style={styles.toastText}>{toastMessage}</Text>
          {data.settings.playerTaggingEnabled ? (
            <TouchableOpacity activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Tag a player on the last event" onPress={() => setTaggingEventId(toastEventId)} style={styles.toastChip}>
              <Text style={styles.toastChipText}>+ Player</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Undo last event" onPress={undoLatest} style={styles.undoChip}>
            <Text style={styles.undoChipText}>Undo</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={matchControlLabel} activeOpacity={0.8} onPress={matchControl} style={styles.controlButton}>
          <MaterialIcons name={match.status === "pending" ? "play-arrow" : match.status === "live" ? "pause" : "play-arrow"} size={22} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>{matchControlLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Finish match" activeOpacity={0.8} onPress={endMatch} style={styles.endButton}>
          <MaterialIcons name="stop" size={21} color="#F87171" />
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      <PlayerTagSheet
        visible={Boolean(taggingEventId)}
        players={teamPlayers}
        recentPlayerIds={events.map((event) => event.playerId).filter((value): value is string => Boolean(value))}
        onSelect={(playerId) => { if (taggingEventId) assignEventPlayer(taggingEventId, playerId); setTaggingEventId(null); }}
        onClose={() => setTaggingEventId(null)}
      />
      <EventLogSheet
        visible={eventLogOpen}
        events={events}
        players={teamPlayers}
        onClose={() => setEventLogOpen(false)}
        onDelete={deleteMatchEvent}
        onEdit={(eventId) => setEditingEventId(eventId)}
      />
      <EventEditorSheet
        event={events.find((event) => event.id === editingEventId) ?? null}
        players={teamPlayers}
        onClose={() => setEditingEventId(null)}
        onSave={(eventId, changes) => { updateMatchEvent(eventId, changes); setEditingEventId(null); }}
      />
    </View>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return <View style={styles.statPill}><Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function PlayerTagSheet({ visible, players, recentPlayerIds, onSelect, onClose }: { visible: boolean; players: ReturnType<typeof useWorkspace>["data"]["players"]; recentPlayerIds: string[]; onSelect: (playerId: string) => void; onClose: () => void }) {
  const orderedPlayers = [...players].sort((a, b) => recentPlayerIds.indexOf(b.id) - recentPlayerIds.indexOf(a.id));
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeading}><Text style={styles.sheetTitle}>Tag player</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close player picker" onPress={onClose}><MaterialIcons name="close" size={22} color={palette.ink} /></TouchableOpacity></View>
        <Text style={styles.sheetSubhead}>Optional — add attribution to the event.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerPickerRow}>
          {orderedPlayers.map((player) => (
            <TouchableOpacity key={player.id} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Tag ${player.name}`} onPress={() => onSelect(player.id)} style={styles.playerChoice}>
              <View style={[styles.playerAvatar, { backgroundColor: player.accent }]}><Text style={styles.playerNumber}>{player.number}</Text></View>
              <Text numberOfLines={1} style={styles.playerChoiceName}>{player.name.split(" ")[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View></View>
    </Modal>
  );
}

function EventLogSheet({ visible, events, players, onClose, onDelete, onEdit }: { visible: boolean; events: MatchEvent[]; players: ReturnType<typeof useWorkspace>["data"]["players"]; onClose: () => void; onDelete: (eventId: string) => void; onEdit: (eventId: string) => void }) {
  const playerName = (id?: string) => players.find((player) => player.id === id)?.name;
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={[styles.sheet, styles.logSheet]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeading}><Text style={styles.sheetTitle}>Event log</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close event log" onPress={onClose}><MaterialIcons name="close" size={22} color={palette.ink} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.logList}>
          {events.length ? events.map((event) => (
            <View key={event.id} style={styles.logRow}>
              <View style={styles.minuteBadge}><Text style={styles.minuteText}>{event.matchMinute}'</Text></View>
              <View style={styles.logContent}><Text style={styles.logAction}>{ACTION_BY_KEY[event.actionType].label}</Text><Text style={styles.logMeta}>H{event.period} · {event.third ? `${THIRD_LABELS[event.third]} ${event.channel ? CHANNEL_LABELS[event.channel] : ""}` : "No zone"} · {event.pressure}{playerName(event.playerId) ? ` · ${playerName(event.playerId)}` : ""}</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${ACTION_BY_KEY[event.actionType].label}`} onPress={() => { onClose(); onEdit(event.id); }} style={styles.rowButton}><MaterialIcons name="edit" size={18} color={palette.primaryDark} /></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${ACTION_BY_KEY[event.actionType].label}`} onPress={() => onDelete(event.id)} style={styles.rowButton}><MaterialIcons name="delete-outline" size={18} color="#B53C35" /></TouchableOpacity>
            </View>
          )) : <Text style={styles.emptyLog}>No events recorded yet.</Text>}
        </ScrollView>
      </View></View>
    </Modal>
  );
}

function EventEditorSheet({ event, players, onClose, onSave }: { event: MatchEvent | null; players: ReturnType<typeof useWorkspace>["data"]["players"]; onClose: () => void; onSave: (eventId: string, changes: Partial<Omit<MatchEvent, "id" | "matchId" | "recordedAt">>) => void }) {
  const [actionType, setActionType] = useState<ActionType | null>(event?.actionType ?? null);
  const [zone, setZone] = useState<Zone | null>(event?.third && event.channel ? { third: event.third, channel: event.channel } : null);
  const [pressure, setPressure] = useState<Pressure>(event?.pressure ?? "medium");
  const [playerId, setPlayerId] = useState<string | undefined>(event?.playerId);
  useEffect(() => { setActionType(event?.actionType ?? null); setZone(event?.third && event.channel ? { third: event.third, channel: event.channel } : null); setPressure(event?.pressure ?? "medium"); setPlayerId(event?.playerId); }, [event]);
  if (!event || !actionType) return null;
  return (
    <Modal transparent animationType="slide" visible={Boolean(event)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={[styles.sheet, styles.editorSheet]}>
        <View style={styles.sheetHandle} /><View style={styles.sheetHeading}><Text style={styles.sheetTitle}>Edit event</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close event editor" onPress={onClose}><MaterialIcons name="close" size={22} color={palette.ink} /></TouchableOpacity></View>
        <Text style={styles.editorLabel}>Action</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionChipRow}>{ACTION_DEFINITIONS.map((action) => <TouchableOpacity key={action.key} activeOpacity={0.8} onPress={() => setActionType(action.key)} style={[styles.actionChip, actionType === action.key && styles.actionChipSelected]}><Text style={[styles.actionChipText, actionType === action.key && styles.actionChipTextSelected]}>{action.shortLabel}</Text></TouchableOpacity>)}</ScrollView>
        <Text style={styles.editorLabel}>Zone</Text><View style={styles.zoneGrid}>{THIRDS.map((third) => CHANNELS.map((channel) => <TouchableOpacity key={`${third}-${channel}`} activeOpacity={0.8} onPress={() => setZone({ third, channel })} style={[styles.zoneButton, zone?.third === third && zone.channel === channel && styles.zoneButtonSelected]}><Text style={[styles.zoneButtonText, zone?.third === third && zone.channel === channel && styles.zoneButtonTextSelected]}>{CHANNEL_LABELS[channel]} {THIRD_LABELS[third]}</Text></TouchableOpacity>))}</View>
        <Text style={styles.editorLabel}>Pressure</Text><View style={styles.editorPressureRow}>{PRESSURES.map((value) => <TouchableOpacity key={value} activeOpacity={0.8} onPress={() => setPressure(value)} style={[styles.editorPressureButton, pressure === value && styles.editorPressureButtonSelected]}><Text style={[styles.editorPressureText, pressure === value && styles.editorPressureTextSelected]}>{value}</Text></TouchableOpacity>)}</View>
        <Text style={styles.editorLabel}>Player</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerChipRow}><TouchableOpacity activeOpacity={0.8} onPress={() => setPlayerId(undefined)} style={[styles.playerChip, !playerId && styles.playerChipSelected]}><Text style={[styles.playerChipText, !playerId && styles.playerChipTextSelected]}>None</Text></TouchableOpacity>{players.map((player) => <TouchableOpacity key={player.id} activeOpacity={0.8} onPress={() => setPlayerId(player.id)} style={[styles.playerChip, playerId === player.id && styles.playerChipSelected]}><Text style={[styles.playerChipText, playerId === player.id && styles.playerChipTextSelected]}>#{player.number} {player.name.split(" ")[0]}</Text></TouchableOpacity>)}</ScrollView>
        <TouchableOpacity activeOpacity={0.85} accessibilityRole="button" onPress={() => onSave(event.id, { actionType, third: zone?.third, channel: zone?.channel, pressure, playerId })} style={styles.saveEventButton}><Text style={styles.saveEventButtonText}>Save changes</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  errorText: { ...typography.body, color: "#FFFFFF", textAlign: "center", marginTop: 40 },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.base, gap: 8 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: "#63D6AE", backgroundColor: "rgba(99,214,174,0.12)" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#63D6AE" }, liveDotPaused: { backgroundColor: "#FBBF24" },
  liveLabel: { fontSize: 10, letterSpacing: 1, fontWeight: "900", color: "#63D6AE" },
  timer: { minWidth: 47, fontSize: 24, fontWeight: "900", color: "#FFFFFF", fontVariant: ["tabular-nums"] as const },
  scoreLine: { flex: 1, fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.78)", textAlign: "right" },
  logButton: { minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }, logCount: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  statsRow: { flexDirection: "row", paddingHorizontal: spacing.base, gap: 6, marginBottom: 8 }, statPill: { flex: 1, minHeight: 57, borderRadius: radius.md, paddingVertical: 8, alignItems: "center", justifyContent: "center", backgroundColor: palette.navyMid }, statValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", fontVariant: ["tabular-nums"] as const }, statLabel: { color: "rgba(255,255,255,0.64)", fontSize: 9, lineHeight: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  pressureRow: { minHeight: 42, paddingHorizontal: spacing.base, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }, pressureLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700" }, pressureControl: { flex: 1, flexDirection: "row", padding: 2, borderRadius: radius.full, backgroundColor: palette.navyMid }, pressureButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.full }, pressureButtonSelected: { backgroundColor: "#168A68" }, pressureButtonText: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, pressureButtonTextSelected: { color: "#FFFFFF" }, adminShortcut: { minHeight: 40, minWidth: 40, alignItems: "center", justifyContent: "center" },
  pitchContainer: { alignItems: "center", paddingHorizontal: spacing.base }, selectorScroll: { flex: 1, marginTop: 8 }, selectorContent: { paddingBottom: 12 }, hint: { paddingVertical: 18, alignItems: "center" }, hintText: { color: "rgba(255,255,255,0.68)", fontSize: 14, fontWeight: "600" },
  toast: { position: "absolute", left: spacing.base, right: spacing.base, minHeight: 56, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#102C40", borderRadius: radius.xl, borderWidth: 1, borderColor: "#49718B", padding: 10, elevation: 12 }, toastText: { flex: 1, color: "#FFFFFF", fontSize: 13, lineHeight: 17, fontWeight: "700" }, toastChip: { minHeight: 36, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "rgba(99,214,174,0.16)" }, toastChipText: { color: "#63D6AE", fontSize: 11, fontWeight: "900" }, undoChip: { minHeight: 36, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.12)" }, undoChipText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  bottomBar: { flexDirection: "row", paddingHorizontal: spacing.base, paddingTop: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)" }, controlButton: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, backgroundColor: "#168A68" }, controlButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, endButton: { minWidth: 94, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: "#F87171", backgroundColor: "#3B2023" }, endButtonText: { color: "#F87171", fontSize: 15, fontWeight: "800" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.48)" }, sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.base, maxHeight: "72%" }, logSheet: { maxHeight: "78%" }, editorSheet: { maxHeight: "88%" }, sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.borderMid, alignSelf: "center", marginBottom: 10 }, sheetHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sheetTitle: { fontSize: 20, fontWeight: "900", color: palette.ink }, sheetSubhead: { ...typography.caption, color: palette.muted, marginTop: 3 }, playerPickerRow: { paddingTop: spacing.base, gap: spacing.md }, playerChoice: { width: 64, alignItems: "center", gap: 6 }, playerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" }, playerNumber: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, playerChoiceName: { color: palette.ink, fontSize: 11, fontWeight: "700", textAlign: "center" },
  logList: { paddingTop: spacing.md, gap: 4 }, logRow: { minHeight: 60, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border }, minuteBadge: { minWidth: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingVertical: 5, backgroundColor: palette.primarySoft }, minuteText: { color: palette.primaryDark, fontSize: 11, fontWeight: "900" }, logContent: { flex: 1, gap: 2 }, logAction: { color: palette.ink, fontSize: 14, fontWeight: "800" }, logMeta: { color: palette.muted, fontSize: 11, lineHeight: 14 }, rowButton: { minWidth: 38, minHeight: 44, alignItems: "center", justifyContent: "center" }, emptyLog: { color: palette.muted, textAlign: "center", paddingVertical: 30 },
  editorLabel: { color: palette.ink, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.7, marginTop: 14, marginBottom: 7 }, actionChipRow: { gap: 7 }, actionChip: { minHeight: 38, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border }, actionChipSelected: { backgroundColor: palette.primary, borderColor: palette.primary }, actionChipText: { color: palette.inkMid, fontSize: 12, fontWeight: "700" }, actionChipTextSelected: { color: "#FFFFFF" }, zoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, zoneButton: { width: "31.8%", minHeight: 42, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }, zoneButtonSelected: { backgroundColor: palette.primary, borderColor: palette.primary }, zoneButtonText: { color: palette.inkMid, fontSize: 10, fontWeight: "700", textAlign: "center" }, zoneButtonTextSelected: { color: "#FFFFFF" }, editorPressureRow: { flexDirection: "row", gap: 7 }, editorPressureButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: palette.surfaceAlt }, editorPressureButtonSelected: { backgroundColor: palette.primary }, editorPressureText: { color: palette.inkMid, fontSize: 12, fontWeight: "800", textTransform: "capitalize" }, editorPressureTextSelected: { color: "#FFFFFF" }, playerChipRow: { gap: 7 }, playerChip: { minHeight: 38, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: radius.full, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }, playerChipSelected: { backgroundColor: palette.primary, borderColor: palette.primary }, playerChipText: { color: palette.inkMid, fontSize: 12, fontWeight: "700" }, playerChipTextSelected: { color: "#FFFFFF" }, saveEventButton: { minHeight: 52, marginTop: spacing.base, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: "#168A68" }, saveEventButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
