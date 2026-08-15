import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, IconButton } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";

const PERIOD_LENGTHS = [15, 20, 25, 30] as const;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function nextWeekend(): Date {
  const date = new Date();
  const daysToSaturday = date.getDay() === 6 ? 7 : 6 - date.getDay();
  return addDays(date, daysToSaturday);
}

export default function MatchSetupScreen() {
  const { data, createMatch, setMatchStatus, updateSettings } = useWorkspace();
  const insets = useSafeAreaInsets();
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const today = new Date();
  const [opponent, setOpponent] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [periodLength, setPeriodLength] = useState(data.settings.periodLengthMinutes);
  const [starting, setStarting] = useState(false);
  const quickDates = [{ label: "Today", date: today }, { label: "Tomorrow", date: addDays(today, 1) }, { label: "Weekend", date: nextWeekend() }];
  const canStart = Boolean(team) && opponent.trim().length > 0 && !starting;

  const startMatch = () => {
    if (!team || !canStart) return;
    if (data.settings.hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStarting(true);
    updateSettings({ periodLengthMinutes: periodLength });
    const matchId = createMatch(team.id, opponent.trim(), selectedDate.toISOString(), periodLength);
    setMatchStatus(matchId, "live");
    router.replace({ pathname: "/match/live/[id]" as never, params: { id: matchId } });
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <IconButton name="close" accessibilityLabel="Cancel match setup" onPress={() => router.back()} variant="ghost" />
        <Text style={styles.headerTitle}>Set up match</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {team ? <View style={styles.teamCard}><Text style={styles.teamCardLabel}>YOUR TEAM</Text><View style={styles.teamCardRow}><View style={styles.teamIcon}><MaterialIcons name="shield" size={20} color="#FFFFFF" /></View><View><Text style={styles.teamName}>{team.name}</Text><Text style={styles.teamMeta}>{team.ageGroup} · {team.playerIds.length} players</Text></View></View></View> : null}

        <View style={styles.field}><Text style={styles.fieldLabel}>Opponent</Text><TextInput style={[styles.input, opponent && styles.inputFilled]} placeholder="Enter team name" placeholderTextColor={palette.faint} value={opponent} onChangeText={setOpponent} autoFocus autoCapitalize="words" returnKeyType="done" /></View>

        <View style={styles.field}><Text style={styles.fieldLabel}>When</Text><View style={styles.quickDateRow}>{quickDates.map(({ label, date }) => { const selected = selectedDate.toDateString() === date.toDateString(); return <TouchableOpacity key={label} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Match ${label}`} onPress={() => setSelectedDate(date)} style={[styles.quickDate, selected && styles.quickDateSelected]}><Text style={[styles.quickDateText, selected && styles.quickDateTextSelected]}>{label}</Text></TouchableOpacity>; })}</View><Text style={styles.helperText}>{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text></View>

        <View style={styles.field}><Text style={styles.fieldLabel}>Half length</Text><View style={styles.periodRow}>{PERIOD_LENGTHS.map((minutes) => <TouchableOpacity key={minutes} accessibilityRole="button" accessibilityLabel={`${minutes} minute halves`} activeOpacity={0.8} onPress={() => setPeriodLength(minutes)} style={[styles.periodButton, periodLength === minutes && styles.periodButtonSelected]}><Text style={[styles.periodText, periodLength === minutes && styles.periodTextSelected]}>{minutes} min</Text></TouchableOpacity>)}</View><Text style={styles.helperText}>The live timer follows two {periodLength}-minute halves. You can pause at any time.</Text></View>

        <View style={styles.tipCard}><MaterialIcons name="touch-app" size={20} color={palette.primaryDark} /><View style={styles.tipText}><Text style={styles.tipTitle}>Designed for the touchline</Text><Text style={styles.tipBody}>Zone → action → recorded. Pressure, player tags, and corrections are optional.</Text></View></View>

        <View style={styles.cta}><AppButton label={starting ? "Starting…" : "Start match"} onPress={startMatch} variant="primary" size="large" icon="sports-soccer" disabled={!canStart} />{!canStart ? <Text style={styles.ctaHint}>Enter an opponent to start live tracking.</Text> : null}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background }, header: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm }, headerTitle: { ...typography.bodyMed, color: palette.ink }, headerSpacer: { width: 44 }, scroll: { flex: 1 }, content: { padding: spacing.base, gap: spacing.lg },
  teamCard: { backgroundColor: palette.navy, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm }, teamCardLabel: { ...typography.eyebrow, color: "rgba(255,255,255,0.68)" }, teamCardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }, teamIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: palette.navyMid }, teamName: { ...typography.cardTitle, color: "#FFFFFF" }, teamMeta: { ...typography.caption, color: "rgba(255,255,255,0.68)", marginTop: 2 },
  field: { gap: spacing.sm }, fieldLabel: { ...typography.bodyMed, color: palette.ink }, input: { minHeight: 54, borderWidth: 1.5, borderColor: palette.border, borderRadius: radius.lg, backgroundColor: palette.surface, paddingHorizontal: spacing.base, ...typography.body, color: palette.ink }, inputFilled: { borderColor: palette.primary }, quickDateRow: { flexDirection: "row", gap: spacing.sm }, quickDate: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surfaceAlt }, quickDateSelected: { backgroundColor: "#168A68", borderColor: "#168A68" }, quickDateText: { ...typography.bodyMed, color: palette.muted }, quickDateTextSelected: { color: "#FFFFFF" }, helperText: { ...typography.caption, color: palette.muted, lineHeight: 18 },
  periodRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, periodButton: { minHeight: 44, minWidth: 70, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }, periodButtonSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary }, periodText: { ...typography.caption, color: palette.inkMid, fontWeight: "800" }, periodTextSelected: { color: palette.primaryDark },
  tipCard: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", padding: spacing.base, borderRadius: radius.xl, backgroundColor: palette.primarySoft }, tipText: { flex: 1, gap: 4 }, tipTitle: { ...typography.bodyMed, color: palette.primaryDark }, tipBody: { ...typography.caption, color: palette.primaryDark, lineHeight: 18 }, cta: { paddingTop: spacing.sm, gap: spacing.sm }, ctaHint: { ...typography.caption, color: palette.muted, textAlign: "center" },
});
