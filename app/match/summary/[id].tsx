/**
 * Match Summary — Post-match analysis
 *
 * Shows: score, event counts, outcome breakdown, pitch heatmap,
 * activity by third. Navy theme consistent with match tracking identity.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PitchHeatmap } from "@/components/charts/PitchMap";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";
import type { MatchOutcome, PitchThird } from "@/types/models";

function haptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(value));
}

function formatDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt || !endedAt) return "—";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60000);
  return `${mins} min`;
}

const OUTCOME_COLORS: Record<MatchOutcome, string> = {
  progression: "#4ADE80",
  chance: "#FBBF24",
  retention: "#60A5FA",
  turnover: "#F87171",
};

const THIRD_LABELS: Record<PitchThird, string> = {
  defensive: "Build",
  middle: "Connect",
  attacking: "Create",
};

export default function MatchSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data } = useWorkspace();

  const match = data.matches.find((m) => m.id === id);
  const events = data.matchEvents.filter((e) => e.matchId === id);

  if (!match) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.notFound}>
          <MaterialIcons name="sports-soccer" size={40} color={palette.muted} />
          <Text style={styles.notFoundTitle}>Match not found</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { haptic(); router.replace("/(tabs)" as any); }}
            style={styles.backHomeBtn}
          >
            <Text style={styles.backHomeBtnText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressions = events.filter((e) => e.outcome === "progression").length;
  const chances = events.filter((e) => e.outcome === "chance").length;
  const turnovers = events.filter((e) => e.outcome === "turnover").length;
  const retentions = events.filter((e) => e.outcome === "retention").length;
  const total = events.length;

  const byThird = (["defensive", "middle", "attacking"] as PitchThird[]).map((third) => ({
    third,
    count: events.filter((e) => e.third === third).length,
  }));
  const maxThirdCount = Math.max(...byThird.map((t) => t.count), 1);

  const scoreFor = match.scoreFor ?? 0;
  const scoreAgainst = match.scoreAgainst ?? 0;
  const result = scoreFor > scoreAgainst ? "WIN" : scoreFor < scoreAgainst ? "LOSS" : "DRAW";
  const resultColor = result === "WIN" ? "#4ADE80" : result === "LOSS" ? "#F87171" : "#FBBF24";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { haptic(); router.back(); }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreDate}>{formatDate(match.matchDate)}</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{scoreFor}</Text>
              <Text style={styles.scoreTeam}>Your team</Text>
            </View>
            <View style={styles.scoreDivider}>
              <Text style={[styles.resultBadge, { color: resultColor }]}>{result}</Text>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{scoreAgainst}</Text>
              <Text style={styles.scoreTeam}>{match.opponent}</Text>
            </View>
          </View>
          <Text style={styles.scoreDuration}>
            Duration: {formatDuration(match.startedAt, match.endedAt)}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statValue, { color: OUTCOME_COLORS.progression }]}>{progressions}</Text>
            <Text style={styles.statLabel}>Prog</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statValue, { color: OUTCOME_COLORS.chance }]}>{chances}</Text>
            <Text style={styles.statLabel}>Chance</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statValue, { color: OUTCOME_COLORS.turnover }]}>{turnovers}</Text>
            <Text style={styles.statLabel}>Turnover</Text>
          </View>
        </View>

        {/* Pitch Heatmap */}
        {events.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pitch Activity</Text>
            <View style={styles.heatmapCard}>
              <PitchHeatmap events={events} width={300} height={420} />
            </View>
          </View>
        ) : null}

        {/* Outcomes Breakdown */}
        {events.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outcomes</Text>
            <View style={styles.outcomesCard}>
              {([
                { key: "progression" as MatchOutcome, label: "Progressions", value: progressions },
                { key: "chance" as MatchOutcome, label: "Chances", value: chances },
                { key: "retention" as MatchOutcome, label: "Retentions", value: retentions },
                { key: "turnover" as MatchOutcome, label: "Turnovers", value: turnovers },
              ]).map(({ key, label, value }, idx) => (
                <View key={key} style={[styles.outcomeRow, idx > 0 && styles.outcomeDivider]}>
                  <View style={[styles.outcomeDot, { backgroundColor: OUTCOME_COLORS[key] }]} />
                  <Text style={styles.outcomeLabel}>{label}</Text>
                  <Text style={[styles.outcomeValue, { color: OUTCOME_COLORS[key] }]}>{value}</Text>
                  <Text style={styles.outcomePercent}>
                    {total > 0 ? `${Math.round((value / total) * 100)}%` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Activity by Third */}
        {events.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity by Third</Text>
            <View style={styles.thirdsCard}>
              {byThird.map(({ third, count }) => (
                <View key={third} style={styles.thirdRow}>
                  <Text style={styles.thirdLabel}>{THIRD_LABELS[third]}</Text>
                  <View style={styles.thirdBarTrack}>
                    <View
                      style={[
                        styles.thirdBarFill,
                        { width: `${(count / maxThirdCount) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.thirdCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Empty state */}
        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="sports-soccer" size={32} color={palette.muted} />
            <Text style={styles.emptyText}>No events were recorded during this match.</Text>
          </View>
        ) : null}

        {/* Back to matches */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          onPress={() => { haptic(); router.push("/match" as any); }}
          style={styles.matchesBtn}
        >
          <MaterialIcons name="list" size={20} color="#FFFFFF" />
          <Text style={styles.matchesBtnText}>All Matches</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  notFoundTitle: { ...typography.cardTitle, color: "#FFFFFF" },
  backHomeBtn: { backgroundColor: palette.navyMid, borderRadius: radius.lg, paddingHorizontal: 20, paddingVertical: 12 },
  backHomeBtnText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", ...typography.cardTitle, color: "#FFFFFF" },
  scroll: { flex: 1 },
  content: { padding: spacing.base, gap: spacing.base },
  scoreCard: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.xl,
    padding: spacing.base,
    alignItems: "center",
    gap: spacing.sm,
  },
  scoreDate: { ...typography.caption, color: "rgba(255,255,255,0.7)" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  scoreBlock: { alignItems: "center" },
  scoreValue: { fontSize: 40, fontWeight: "900" as const, color: "#FFFFFF", lineHeight: 48 },
  scoreTeam: { ...typography.caption, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  scoreDivider: { alignItems: "center" },
  resultBadge: { fontSize: 14, fontWeight: "800" as const, letterSpacing: 1 },
  scoreDuration: { ...typography.caption, color: "rgba(255,255,255,0.5)" },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statPill: {
    flex: 1,
    backgroundColor: palette.navyMid,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: "900" as const, color: "#FFFFFF", fontVariant: ["tabular-nums"] as any },
  statLabel: { fontSize: 11, fontWeight: "600" as const, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionHead, color: "#FFFFFF" },
  heatmapCard: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: "center",
  },
  outcomesCard: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  outcomeDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" },
  outcomeDot: { width: 10, height: 10, borderRadius: 5 },
  outcomeLabel: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const },
  outcomeValue: { fontSize: 18, fontWeight: "800" as const, fontVariant: ["tabular-nums"] as any },
  outcomePercent: { width: 40, textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" as const },
  thirdsCard: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  thirdRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thirdLabel: { width: 72, color: "#FFFFFF", fontSize: 13, fontWeight: "600" as const },
  thirdBarTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" as const },
  thirdBarFill: { height: "100%" as const, borderRadius: 5, backgroundColor: "#4ADE80" },
  thirdCount: { width: 28, textAlign: "right" as const, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700" as const, fontVariant: ["tabular-nums"] as any },
  emptyCard: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: { ...typography.body, color: "rgba(255,255,255,0.6)", textAlign: "center" as const },
  matchesBtn: {
    backgroundColor: palette.navyMid,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  matchesBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
});
