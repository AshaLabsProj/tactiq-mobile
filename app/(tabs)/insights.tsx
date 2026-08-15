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
import { latestPracticeSessionForTeam, teamTransferSignal } from "@/lib/transfer";
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
  const latestPractice = team ? latestPracticeSessionForTeam(data.practiceSessions, team.id) : undefined;
  const teamTransfer = team ? teamTransferSignal(team.id, teamFocus, data.practiceSessions, data.assessments, data.matchEvents) : undefined;
  const activeTeamGoal = team ? data.focusGoals.find((goal) => goal.teamId === team.id && goal.status === "active") : undefined;
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

        {teamTransfer ? (
          <View style={styles.transferSection}>
            <SectionHeader title="Practice to Pitch" />
            <View style={styles.transferCard}>
              <View style={styles.transferHeading}>
                <View style={styles.transferIcon}><MaterialIcons name="compare-arrows" size={20} color={palette.primaryDark} /></View>
                <View style={styles.transferCopy}><Text style={styles.transferSkill}>{SKILL_LABELS[teamTransfer.skill]}</Text><Text style={styles.transferStatus}>{teamTransfer.state === "insufficient" ? "More evidence needed" : teamTransfer.state === "positive" ? "Transfer is showing" : teamTransfer.state === "watch" ? "Reinforce in training" : "Evidence emerging"}</Text></View>
                <View style={styles.transferCount}><Text style={styles.transferCountValue}>{teamTransfer.positiveEvents}</Text><Text style={styles.transferCountLabel}>signals</Text></View>
              </View>
              <Text style={styles.transferBody}>{teamTransfer.summary}</Text>
              {latestPractice ? <Text style={styles.transferFootnote}>Last practice: {new Date(latestPractice.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {latestPractice.focusSkills.map((skill) => SKILL_LABELS[skill]).join(" + ")}</Text> : null}
            </View>
          </View>
        ) : null}

        {activeTeamGoal ? (
          <View style={styles.goalBanner}><MaterialIcons name="outlined-flag" size={18} color="#9A5D00" /><View style={styles.goalBannerCopy}><Text style={styles.goalBannerTitle}>Active team focus · {SKILL_LABELS[activeTeamGoal.skill]}</Text><Text style={styles.goalBannerText}>{activeTeamGoal.note}</Text></View></View>
        ) : null}

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
  transferSection: { gap: spacing.sm },
  transferCard: { backgroundColor: palette.primarySoft, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm, borderWidth: 1, borderColor: "#A7E7D3" },
  transferHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  transferIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  transferCopy: { flex: 1 },
  transferSkill: { ...typography.bodyMed, color: palette.primaryDark },
  transferStatus: { ...typography.caption, color: palette.primaryDark, marginTop: 2 },
  transferCount: { alignItems: "center" },
  transferCountValue: { color: palette.primaryDark, fontSize: 19, fontWeight: "900", fontVariant: ["tabular-nums"] as any },
  transferCountLabel: { color: palette.primaryDark, fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  transferBody: { ...typography.caption, color: palette.primaryDark, lineHeight: 18 },
  transferFootnote: { color: palette.primaryDark, fontSize: 11, lineHeight: 16, fontWeight: "700", opacity: 0.8 },
  goalBanner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.amberSoft, borderWidth: 1, borderColor: "#F7D68E" },
  goalBannerCopy: { flex: 1 },
  goalBannerTitle: { ...typography.bodyMed, color: palette.amberDark },
  goalBannerText: { ...typography.caption, color: palette.amberDark, marginTop: 2, lineHeight: 17 },
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
  overdueChip: { backgroundColor: palette.coralSoft, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  overdueChipText: { ...typography.eyebrow, color: palette.coral, fontSize: 10 },
  pressed: { opacity: 0.72 },
});
