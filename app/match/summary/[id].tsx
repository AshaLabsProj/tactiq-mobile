import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PitchHeatmap } from "@/components/charts/PitchMap";
import { useWorkspace } from "@/contexts/workspace-context";
import { derivedScore, elapsedMatchSeconds, matchInsights, matchMetrics } from "@/lib/insights";
import { matchContextNarrative, matchPeriodContext, matchPressureContext } from "@/lib/match-context";
import { editorialForSkill } from "@/lib/coaching-editorial";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { ACTION_BY_KEY, THIRD_LABELS, type PitchThird } from "@/types/models";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
}

function formatDuration(seconds: number): string {
  return seconds ? `${Math.floor(seconds / 60)} min tracked` : "No clock data";
}

export default function MatchSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data } = useWorkspace();
  const match = data.matches.find((item) => item.id === id);
  const events = data.matchEvents.filter((event) => event.matchId === id);

  if (!match) {
    return <View style={[styles.root, { paddingTop: insets.top }]}><View style={styles.notFound}><MaterialIcons name="sports-soccer" size={40} color="rgba(255,255,255,0.58)" /><Text style={styles.notFoundTitle}>Match not found</Text><TouchableOpacity activeOpacity={0.8} onPress={() => router.replace("/(tabs)" as never)} style={styles.backHomeButton}><Text style={styles.backHomeText}>Back to Home</Text></TouchableOpacity></View></View>;
  }

  const metrics = matchMetrics(events);
  const score = derivedScore(events, match);
  const duration = elapsedMatchSeconds(match);
  const result = score.scoreFor > score.scoreAgainst ? "WIN" : score.scoreFor < score.scoreAgainst ? "LOSS" : "DRAW";
  const resultColor = result === "WIN" ? "#63D6AE" : result === "LOSS" ? "#F87171" : "#FBBF24";
  const heatmapHeight = Math.min(390, Math.max(300, Math.round((width - spacing.base * 2) * 1.25)));
  const heatmapWidth = Math.min(310, width - spacing.base * 4);
  const byThird = (["defensive", "middle", "attacking"] as PitchThird[]).map((third) => ({ third, count: events.filter((event) => event.third === third).length }));
  const maxThird = Math.max(1, ...byThird.map((entry) => entry.count));
  const coreMetrics: Array<{ label: string; value: number; icon: keyof typeof MaterialIcons.glyphMap; tone: "emerald" | "amber" | "coral" }> = [
    { label: "Shots", value: metrics.shots, icon: "gps-fixed" as const, tone: "emerald" },
    { label: "On target", value: metrics.shotOnTarget, icon: "center-focus-strong" as const, tone: "amber" },
    { label: "Chances", value: metrics.chancesCreated, icon: "bolt" as const, tone: "emerald" },
    { label: "Regains", value: metrics.regains, icon: "restart-alt" as const, tone: "emerald" },
    { label: "Turnovers", value: metrics.actionCounts.turnover, icon: "close" as const, tone: "coral" },
    { label: "Set pieces", value: metrics.setPiecesWon, icon: "outlined-flag" as const, tone: "amber" },
  ];
  const eventSummary = [
    "goalFor", "goalAgainst", "shotOnTarget", "shotOffTarget", "chanceCreated", "progression", "retention", "turnover", "regain", "clearance", "save", "setPieceWon",
  ].map((actionType) => ({ actionType: actionType as keyof typeof ACTION_BY_KEY, count: metrics.actionCounts[actionType as keyof typeof metrics.actionCounts] })).filter((entry) => entry.count > 0);
  const periodContext = matchPeriodContext(events);
  const pressureContext = matchPressureContext(events);
  const contextualNarrative = matchContextNarrative(events);
  const editorial = editorialForSkill(metrics.actionCounts.turnover > metrics.regains ? "receiving" : "passing");

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}><TouchableOpacity activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-back" size={22} color="#FFFFFF" /></TouchableOpacity><Text style={styles.headerTitle}>Match summary</Text><View style={styles.headerSpacer} /></View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}><Text style={styles.scoreDate}>{formatDate(match.matchDate)} · vs {match.opponent}</Text><View style={styles.scoreRow}><View style={styles.scoreBlock}><Text style={styles.scoreValue}>{score.scoreFor}</Text><Text style={styles.scoreCaption}>Your team</Text></View><View style={styles.resultBlock}><Text style={[styles.resultLabel, { color: resultColor }]}>{result}</Text><Text style={styles.duration}>{formatDuration(duration)}</Text></View><View style={styles.scoreBlock}><Text style={styles.scoreValue}>{score.scoreAgainst}</Text><Text numberOfLines={1} style={styles.scoreCaption}>{match.opponent}</Text></View></View><Text style={styles.scoreRule}>Score is calculated from recorded goals{match.scoreFor !== undefined ? " (manual correction applied)" : ""}.</Text></View>

        <Section title="At a glance"><View style={styles.metricsGrid}>{coreMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</View></Section>

        <Section title="Coach cues"><View style={styles.insightCard}>{matchInsights(events).map((insight, index) => <View key={insight} style={[styles.insightRow, index > 0 && styles.insightDivider]}><View style={styles.insightDot} /><Text style={styles.insightText}>{insight}</Text></View>)}</View></Section>

        {events.length ? <Section title="Match context"><View style={styles.contextCard}><Text style={styles.contextNarrative}>{contextualNarrative}</Text><Text style={styles.contextLabel}>BY PERIOD</Text><ContextRows rows={periodContext} /><Text style={styles.contextLabel}>BY PRESSURE</Text><ContextRows rows={pressureContext} /></View></Section> : null}

        <Section title="Carry into practice"><TouchableOpacity activeOpacity={0.82} onPress={() => router.push("/practice/new" as never)} style={styles.editorialCard}><View style={styles.editorialIcon}><MaterialIcons name={editorial.icon} size={22} color="#63D6AE" /></View><View style={styles.editorialCopy}><Text style={styles.editorialLabel}>{editorial.label}</Text><Text style={styles.editorialTitle}>{editorial.title}</Text><Text style={styles.editorialBody}>{editorial.body}</Text></View><MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" /></TouchableOpacity></Section>

        {events.length ? <Section title="Where play happened"><View style={styles.heatmapCard}><PitchHeatmap events={events} width={heatmapWidth} height={heatmapHeight} /><Text style={styles.heatmapCaption}>Darker zones show more tagged activity.</Text></View></Section> : null}

        {events.length ? <Section title="Activity by third"><View style={styles.thirdsCard}>{byThird.map(({ third, count }) => <View key={third} style={styles.thirdRow}><Text style={styles.thirdLabel}>{THIRD_LABELS[third]}</Text><View style={styles.thirdTrack}><View style={[styles.thirdFill, { width: `${Math.round((count / maxThird) * 100)}%` }]} /></View><Text style={styles.thirdValue}>{count}</Text></View>)}</View></Section> : null}

        <Section title="Event breakdown"><View style={styles.eventCard}>{eventSummary.length ? eventSummary.map(({ actionType, count }, index) => <View key={actionType} style={[styles.eventRow, index > 0 && styles.eventDivider]}><Text style={styles.eventName}>{ACTION_BY_KEY[actionType].label}</Text><Text style={styles.eventCount}>{count}</Text></View>) : <Text style={styles.emptyCopy}>No events recorded. Use the event log next match to add context.</Text>}</View></Section>

        <TouchableOpacity activeOpacity={0.8} accessibilityRole="button" onPress={() => router.replace("/match" as never)} style={styles.matchesButton}><MaterialIcons name="format-list-bulleted" size={20} color="#FFFFFF" /><Text style={styles.matchesButtonText}>All matches</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function MetricCard({ label, value, icon, tone }: { label: string; value: number; icon: keyof typeof MaterialIcons.glyphMap; tone: "emerald" | "amber" | "coral" }) { const colors = tone === "emerald" ? { bg: "rgba(99,214,174,0.12)", fg: "#63D6AE" } : tone === "amber" ? { bg: "rgba(251,191,36,0.13)", fg: "#FBBF24" } : { bg: "rgba(248,113,113,0.13)", fg: "#F87171" }; return <View style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: colors.bg }]}><MaterialIcons name={icon} size={18} color={colors.fg} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function ContextRows({ rows }: { rows: ReturnType<typeof matchPeriodContext> }) { return <View style={styles.contextRows}>{rows.filter((row) => row.events).map((row) => <View style={styles.contextRow} key={row.label}><Text style={styles.contextRowLabel}>{row.label}</Text><View style={styles.contextTrack}><View style={[styles.contextFill, { width: `${Math.max(7, row.positiveRate ?? 0)}%` }]} /></View><Text style={styles.contextValue}>{row.positiveRate === null ? "—" : `${row.positiveRate}%`}</Text></View>)}</View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy }, notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }, notFoundTitle: { ...typography.cardTitle, color: "#FFFFFF" }, backHomeButton: { minHeight: 48, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: "#168A68" }, backHomeText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  header: { minHeight: 56, paddingHorizontal: spacing.base, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.12)" }, backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, headerTitle: { flex: 1, textAlign: "center", color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, headerSpacer: { width: 44 }, scroll: { flex: 1 }, content: { padding: spacing.base, gap: spacing.base },
  scoreCard: { padding: spacing.base, borderRadius: radius.xl, alignItems: "center", gap: 8, backgroundColor: palette.navyMid }, scoreDate: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700" }, scoreRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-around" }, scoreBlock: { width: "33%", alignItems: "center" }, scoreValue: { color: "#FFFFFF", fontSize: 44, lineHeight: 52, fontWeight: "900", fontVariant: ["tabular-nums"] as const }, scoreCaption: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "700", textAlign: "center" }, resultBlock: { width: "34%", alignItems: "center", gap: 2 }, resultLabel: { fontSize: 14, letterSpacing: 1.2, fontWeight: "900" }, duration: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700" }, scoreRule: { color: "rgba(255,255,255,0.46)", fontSize: 11, textAlign: "center" },
  section: { gap: 8 }, sectionTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, metricCard: { width: "31.8%", minHeight: 104, padding: 10, borderRadius: radius.lg, backgroundColor: palette.navyMid, justifyContent: "space-between" }, metricIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" }, metricValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", fontVariant: ["tabular-nums"] as const }, metricLabel: { color: "rgba(255,255,255,0.64)", fontSize: 10, lineHeight: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
  insightCard: { borderRadius: radius.xl, padding: spacing.base, backgroundColor: "#12364A" }, insightRow: { flexDirection: "row", gap: 10, paddingVertical: 7 }, insightDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)" }, insightDot: { width: 8, height: 8, marginTop: 6, borderRadius: 4, backgroundColor: "#63D6AE" }, insightText: { flex: 1, color: "#FFFFFF", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  contextCard: { gap: 12, borderRadius: radius.xl, padding: spacing.base, backgroundColor: palette.navyMid }, contextNarrative: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, fontWeight: "600" }, contextLabel: { color: "#AEEED6", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginTop: 2 }, contextRows: { gap: 9 }, contextRow: { flexDirection: "row", alignItems: "center", gap: 8 }, contextRowLabel: { width: 94, color: "rgba(255,255,255,0.76)", fontSize: 12, fontWeight: "700" }, contextTrack: { flex: 1, height: 8, overflow: "hidden", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)" }, contextFill: { height: "100%", borderRadius: 4, backgroundColor: "#63D6AE" }, contextValue: { width: 34, color: "#FFFFFF", textAlign: "right", fontSize: 12, fontWeight: "800" },
  editorialCard: { minHeight: 118, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: radius.xl, padding: spacing.base, backgroundColor: "#12364A" }, editorialIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,214,174,0.15)" }, editorialCopy: { flex: 1, gap: 3 }, editorialLabel: { color: "#AEEED6", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, editorialTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, editorialBody: { color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 17 },
  heatmapCard: { alignItems: "center", padding: spacing.md, borderRadius: radius.xl, backgroundColor: palette.navyMid, gap: 8 }, heatmapCaption: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }, thirdsCard: { padding: spacing.base, borderRadius: radius.xl, backgroundColor: palette.navyMid, gap: 12 }, thirdRow: { flexDirection: "row", alignItems: "center", gap: 10 }, thirdLabel: { width: 64, color: "#FFFFFF", fontSize: 13, fontWeight: "700" }, thirdTrack: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.12)" }, thirdFill: { height: "100%", borderRadius: 5, backgroundColor: "#63D6AE" }, thirdValue: { width: 28, color: "rgba(255,255,255,0.75)", textAlign: "right", fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] as const },
  eventCard: { padding: spacing.base, borderRadius: radius.xl, backgroundColor: palette.navyMid }, eventRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.12)" }, eventName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" }, eventCount: { color: "#63D6AE", fontSize: 17, fontWeight: "900", fontVariant: ["tabular-nums"] as const }, emptyCopy: { color: "rgba(255,255,255,0.62)", fontSize: 14, lineHeight: 20, textAlign: "center" }, matchesButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, backgroundColor: "#168A68" }, matchesButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
