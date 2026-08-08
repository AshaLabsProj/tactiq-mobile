/**
 * Match Setup — redesigned 2026-08-08
 * Keyboard-aware with sticky START MATCH CTA above keyboard.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, IconButton } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function nextWeekend(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysToSat = day === 6 ? 7 : (6 - day);
  return addDays(d, daysToSat);
}

export default function MatchSetupScreen() {
  const { data, createMatch, setMatchStatus } = useWorkspace();
  const insets = useSafeAreaInsets();
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const team = data.teams.find((t) => t.id === data.settings.preferredTeamId) ?? data.teams[0];
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const weekend = nextWeekend();

  const [opponent, setOpponent] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [loading, setLoading] = useState(false);

  const quickDates = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: tomorrow },
    { label: "Weekend", date: weekend },
  ];

  const canStart = opponent.trim().length > 0 && !!team;

  const handleStart = () => {
    if (!canStart || !team) return;
    haptic();
    setLoading(true);
    const matchId = createMatch(team.id, opponent.trim(), selectedDate.toISOString());
    setMatchStatus(matchId, "live");
    setTimeout(() => {
      router.replace({ pathname: "/match/live/[id]", params: { id: matchId } });
    }, 200);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <IconButton name="close" accessibilityLabel="Cancel" onPress={() => { haptic(); router.back(); }} variant="ghost" />
        <Text style={styles.headerTitle}>Set up match</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {team ? (
          <View style={styles.teamCard}>
            <Text style={styles.teamCardLabel}>YOUR TEAM</Text>
            <View style={styles.teamCardRow}>
              <View style={styles.teamIconCircle}>
                <MaterialIcons name="shield" size={20} color={palette.white} />
              </View>
              <View>
                <Text style={styles.teamCardName}>{team.name}</Text>
                <Text style={styles.teamCardMeta}>{team.ageGroup}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Opponent</Text>
          <TextInput
            style={[styles.textInput, opponent.length > 0 && styles.textInputFilled]}
            placeholder="Enter team name"
            placeholderTextColor={palette.faint}
            value={opponent}
            onChangeText={setOpponent}
            returnKeyType="done"
            autoCapitalize="words"
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>When</Text>
          <View style={styles.quickDateRow}>
            {quickDates.map(({ label, date }) => {
              const active = selectedDate.toDateString() === date.toDateString();
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  onPress={() => { haptic(); setSelectedDate(date); }}
                  style={[styles.quickDateBtn, active && styles.quickDateBtnActive]}
                >
                  <Text style={[styles.quickDateText, active && styles.quickDateTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.selectedDateLabel}>
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>

        <View style={styles.tipCard}>
          <MaterialIcons name="sports-soccer" size={18} color={palette.primary} />
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Designed for the touchline</Text>
            <Text style={styles.tipBody}>Each event takes two taps: tap a pitch zone, then tap the outcome. Undo at any time.</Text>
          </View>
        </View>

        {/* Start Match CTA */}
        <View style={styles.ctaSection}>
          <AppButton
            label={loading ? "Starting…" : "Start Match"}
            onPress={handleStart}
            variant="primary"
            size="large"
            icon="sports-soccer"
            disabled={!canStart || loading}
          />
          {!canStart ? <Text style={styles.ctaHint}>Enter the opponent name to continue</Text> : null}
        </View>
      </ScrollView>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm, height: 52 },
  headerTitle: { ...typography.bodyMed, color: palette.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: 20, gap: spacing.lg },
  teamCard: { backgroundColor: palette.navy, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  teamCardLabel: { ...typography.eyebrow, color: palette.matchMuted },
  teamCardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  teamIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.navyMid, alignItems: "center", justifyContent: "center" },
  teamCardName: { ...typography.cardTitle, color: palette.white },
  teamCardMeta: { ...typography.caption, color: palette.matchMuted },
  field: { gap: spacing.sm },
  fieldLabel: { ...typography.bodyMed, color: palette.ink },
  textInput: { backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: spacing.base, paddingVertical: spacing.md, ...typography.body, color: palette.ink, minHeight: 52 },
  textInputFilled: { borderColor: palette.primary },
  quickDateRow: { flexDirection: "row", gap: spacing.sm },
  quickDateBtn: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  quickDateBtnActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  quickDateText: { ...typography.bodyMed, color: palette.muted },
  quickDateTextActive: { color: palette.white },
  selectedDateLabel: { ...typography.caption, color: palette.muted },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, backgroundColor: palette.primarySoft, borderRadius: radius.xl, padding: spacing.base },
  tipCopy: { flex: 1, gap: 4 },
  tipTitle: { ...typography.bodyMed, color: palette.primaryDark },
  tipBody: { ...typography.caption, color: palette.primary, lineHeight: 18 },
  
  ctaSection: { gap: spacing.sm, paddingTop: spacing.md },
  ctaHint: { ...typography.caption, color: palette.muted, textAlign: "center" },
});
