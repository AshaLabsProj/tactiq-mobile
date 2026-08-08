/**
 * Team Insights — redesigned 2026-08-08
 * Insight-first hierarchy.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkillRadar } from "@/components/charts/SkillRadar";
import { AssessmentFreshness, EmptyState, FocusCard, InsightCard, PlayerAvatar, SectionHeader, SkillBar, StrengthCard } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { latestAssessmentForPlayer, matchInsights, matchMetrics, strongestAndFocus, teamSkillAverages } from "@/lib/insights";
import { palette, radius, ratingLabel, spacing, typography } from "@/lib/palette";
import type { SkillKey } from "@/types/models";
import { SKILL_LABELS } from "@/types/models";

const SKILL_FOCUS_CUES: Record<SkillKey, string> = {
  ballControl: "Focus training on first touch and control under pressure.",
  passing: "Drill short combinations and weight of pass.",
  receiving: "Practise scanning and body orientation before receiving.",
  dribbling: "Work on 1v1 situations and close control at pace.",
  defending: "Emphasise positioning, delay, and recovery runs.",
  decisionMaking: "Use small-sided games to increase decision frequency.",
};

export default function InsightsScreen() {
  const { data } = useWorkspace();
  const insets = useSafeAreaInsets();
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const team = data.teams.find((t) => t.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = data.players.filter((p) => p.teamId === team?.id);
  const teamAverages = useMemo(() => teamSkillAverages(data.assessments), [data.assessments]);
  const hasData = Object.values(teamAverages).some((v) => v > 0);
  const { strongest: teamStrength, focus: teamFocus } = useMemo(() => {
    if (!hasData) return { strongest: "defending" as SkillKey, focus: "decisionMaking" as SkillKey };
    return strongestAndFocus(teamAverages as any);
  }, [teamAverages, hasData]);
  const assessedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    const ids = new Set(data.assessments.filter((a) => Date.parse(a.createdAt) >= cutoff).map((a) => a.playerId));
    return players.filter((p) => ids.has(p.id)).length;
  }, [players, data.assessments]);
  const latestMatch = useMemo(() => data.matches.filter((m) => m.status === "completed").sort((a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate))[0], [data.matches]);
  const latestMatchEvents = latestMatch ? data.matchEvents.filter((e) => e.matchId === latestMatch.id) : [];
  const latestMatchInsights = matchInsights(latestMatchEvents);
  const latestMetrics = matchMetrics(latestMatchEvents);
  const radarRatings = useMemo(() => {
    const r: Record<string, number> = {};
    for (const key of Object.keys(SKILL_LABELS) as SkillKey[]) r[key] = Math.max(1, Math.min(3, Math.round(teamAverages[key] || 1)));
    return r as any;
  }, [teamAverages]);

  if (!hasData) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.eyebrow}>TEAM ANALYTICS</Text><Text style={styles.title}>Insights</Text></View>
        <EmptyState icon="bar-chart" title="No insights yet" body="Assess your players to start generating team development insights." cta="Assess a player" onCta={() => { haptic(); router.push("/(tabs)/team" as any); }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.eyebrow}>TEAM ANALYTICS</Text><Text style={styles.title}>Insights</Text></View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.activityRow}>
          <View style={styles.activityStat}><Text style={styles.activityValue}>{assessedThisWeek}</Text><Text style={styles.activityLabel}>This week</Text></View>
          <View style={styles.activityDivider} />
          <View style={styles.activityStat}><Text style={styles.activityValue}>{players.length}</Text><Text style={styles.activityLabel}>Players</Text></View>
          <View style={styles.activityDivider} />
          <View style={styles.activityStat}><Text style={styles.activityValue}>{data.assessments.length}</Text><Text style={styles.activityLabel}>Assessments</Text></View>
        </View>

        <InsightCard label="TEAM FOCUS" title={SKILL_LABELS[teamFocus]} explanation={`Lowest team development area. ${SKILL_FOCUS_CUES[teamFocus]}`}>
          <View style={styles.insightMeta}>
            <Text style={styles.insightScore}>{teamAverages[teamFocus]?.toFixed(1) ?? "—"}</Text>
            <Text style={styles.insightScoreLabel}>{ratingLabel(Math.round(teamAverages[teamFocus] || 1) as 1 | 2 | 3)} · Team average</Text>
          </View>
        </InsightCard>

        <StrengthCard skill={SKILL_LABELS[teamStrength]} observation={`Team average: ${teamAverages[teamStrength]?.toFixed(1) ?? "—"} — highest-rated skill.`} />

        <View style={styles.radarSection}>
          <SectionHeader title="Team Development Shape" />
          <Text style={styles.radarCaption}>Average across all assessed players</Text>
          <View style={styles.radarContainer}><SkillRadar ratings={radarRatings} size={280} /></View>
        </View>

        <View style={styles.skillsSection}>
          <SectionHeader title="Skill Breakdown" />
          {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => {
            const avg = teamAverages[key] ?? 0;
            const rounded = Math.max(1, Math.min(3, Math.round(avg))) as 1 | 2 | 3;
            return <SkillBar key={key} label={SKILL_LABELS[key]} rating={rounded} />;
          })}
        </View>

        {latestMatch ? (
          <View style={styles.matchSection}>
            <SectionHeader title="Latest Match" actionLabel="View summary" onAction={() => router.push({ pathname: "/match/summary/[id]", params: { id: latestMatch.id } })} />
            <View style={styles.matchCard}>
              <View style={styles.matchCardHeader}><Text style={styles.matchCardOpponent}>vs {latestMatch.opponent}</Text><Text style={styles.matchCardDate}>{new Date(latestMatch.matchDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text></View>
              {latestMatchEvents.length > 0 ? (
                <>
                  <View style={styles.matchStatsRow}>
                    {[["Events", latestMetrics.totalEvents, undefined], ["Prog", latestMetrics.outcomeCounts.progression, "#4ADE80"], ["Chance", latestMetrics.outcomeCounts.chance, palette.amber], ["Turnover", latestMetrics.outcomeCounts.turnover, palette.coral]].map(([label, value, color]) => (
                      <View key={label as string} style={styles.matchStat}>
                        <Text style={[styles.matchStatValue, color ? { color: color as string } : {}]}>{value}</Text>
                        <Text style={styles.matchStatLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                  {latestMatchInsights.map((insight, i) => (
                    <View key={i} style={styles.matchInsightRow}><View style={styles.matchInsightDot} /><Text style={styles.matchInsightText}>{insight}</Text></View>
                  ))}
                </>
              ) : <Text style={styles.matchNoEvents}>No events were recorded in this match.</Text>}
            </View>
          </View>
        ) : null}

        <View style={styles.playersSection}>
          <SectionHeader title="Assessment Status" actionLabel="View squad" onAction={() => { haptic(); router.push("/(tabs)/team" as any); }} />
          {players.slice(0, 5).map((player) => {
            const latest = latestAssessmentForPlayer(data.assessments, player.id);
            const overdue = !latest || Date.now() - Date.parse(latest.createdAt) > 14 * 86_400_000;
            return (
              <Pressable key={player.id} accessibilityRole="button" onPress={() => { haptic(); router.push({ pathname: "/player/[id]", params: { id: player.id } }); }} style={({ pressed }) => [styles.playerRow, pressed && styles.pressed]}>
                <PlayerAvatar name={player.name} accent={player.accent} size="sm" />
                <View style={styles.playerInfo}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerPosition}>{player.position}</Text></View>
                <AssessmentFreshness createdAt={latest?.createdAt} />
                {overdue ? <View style={styles.overdueChip}><Text style={styles.overdueChipText}>Due</Text></View> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm },
  eyebrow: { ...typography.eyebrow, color: palette.primary, marginBottom: 2 },
  title: { ...typography.pageTitle, color: palette.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.lg },
  activityRow: { flexDirection: "row", backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base },
  activityStat: { flex: 1, alignItems: "center", gap: 4 },
  activityValue: { ...typography.displayMd, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  activityLabel: { ...typography.caption, color: palette.muted, textAlign: "center" },
  activityDivider: { width: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: 4 },
  insightMeta: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.sm },
  insightScore: { ...typography.displayMd, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  insightScoreLabel: { ...typography.caption, color: palette.muted },
  radarSection: { gap: spacing.sm },
  radarCaption: { ...typography.caption, color: palette.muted },
  radarContainer: { alignItems: "center" },
  skillsSection: { gap: spacing.md },
  matchSection: { gap: spacing.sm },
  matchCard: { backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base, gap: spacing.md },
  matchCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  matchCardOpponent: { ...typography.cardTitle, color: palette.ink },
  matchCardDate: { ...typography.caption, color: palette.muted },
  matchStatsRow: { flexDirection: "row", gap: spacing.sm },
  matchStat: { flex: 1, alignItems: "center", gap: 3 },
  matchStatValue: { ...typography.sectionHead, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  matchStatLabel: { ...typography.caption, color: palette.muted, textAlign: "center" },
  matchInsightRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  matchInsightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.primary, marginTop: 7 },
  matchInsightText: { ...typography.body, color: palette.ink, flex: 1, lineHeight: 22 },
  matchNoEvents: { ...typography.body, color: palette.muted },
  playersSection: { gap: spacing.sm },
  playerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.md },
  playerInfo: { flex: 1 },
  playerName: { ...typography.bodyMed, color: palette.ink },
  playerPosition: { ...typography.caption, color: palette.muted },
  overdueChip: { backgroundColor: palette.coralSoft, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  overdueChipText: { ...typography.eyebrow, color: palette.coral, fontSize: 10 },
  pressed: { opacity: 0.72 },
});
