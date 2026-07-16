import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AppCard,
  PageHeader,
  PlayerAvatar,
  ProgressBar,
  SectionHeader,
  mobileStyles,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  assessmentsForPlayer,
  averageRatings,
  improvementBetween,
  latestAssessmentForPlayer,
  matchMetrics,
  teamSkillAverages,
} from "@/lib/insights";
import { palette } from "@/lib/palette";
import { SKILL_LABELS, type SkillKey } from "@/types/models";

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[];

export default function InsightsScreen() {
  const { data } = useWorkspace();
  const [mode, setMode] = useState<"team" | "players">("team");
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const teamPlayers = data.players.filter((player) => player.teamId === team?.id);
  const teamAssessments = data.assessments.filter((assessment) =>
    teamPlayers.some((player) => player.id === assessment.playerId),
  );
  const skillAverages = teamSkillAverages(teamAssessments);
  const assessedCount = teamPlayers.filter((player) =>
    latestAssessmentForPlayer(teamAssessments, player.id),
  ).length;
  const focusSkill = [...SKILL_KEYS].sort((a, b) => skillAverages[a] - skillAverages[b])[0];
  const latestMatch = [...data.matches]
    .filter((match) => match.teamId === team?.id && match.status === "completed")
    .sort((a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate))[0];
  const latestEvents = latestMatch
    ? data.matchEvents.filter((event) => event.matchId === latestMatch.id)
    : [];
  const metrics = matchMetrics(latestEvents);

  const playerProgress = useMemo(
    () =>
      teamPlayers
        .map((player) => {
          const history = assessmentsForPlayer(teamAssessments, player.id);
          const latest = history[0];
          return {
            player,
            latest,
            improvement: improvementBetween(history),
            overall: latest ? averageRatings(latest.ratings) : 0,
          };
        })
        .sort((a, b) => b.improvement - a.improvement || b.overall - a.overall),
    [teamAssessments, teamPlayers],
  );

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <PageHeader
          eyebrow={team?.name ?? "Team"}
          title="Insights"
          subtitle="Use the next clear coaching signal—not another dashboard."
        />

        <View style={styles.segmented}>
          {(["team", "players"] as const).map((item) => {
            const selected = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setMode(item)}
                style={({ pressed }) => [
                  styles.segment,
                  selected && styles.segmentSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                  {item === "team" ? "Team" : "Players"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === "team" ? (
          <>
            <View style={styles.snapshotRow}>
              <AppCard style={styles.snapshotCard} tone="green">
                <Text style={styles.snapshotValue}>{assessedCount}/{teamPlayers.length}</Text>
                <Text style={styles.snapshotLabel}>Players assessed</Text>
              </AppCard>
              <AppCard style={styles.snapshotCard} tone="amber">
                <Text style={styles.snapshotValue}>{focusSkill ? SKILL_LABELS[focusSkill] : "—"}</Text>
                <Text style={styles.snapshotLabel}>Team focus</Text>
              </AppCard>
            </View>

            <View style={styles.sectionBlock}>
              <SectionHeader title="Skill picture" />
              <AppCard style={styles.skillCard}>
                {SKILL_KEYS.map((key, index) => (
                  <View key={key} style={[styles.skillRow, index > 0 && styles.skillDivider]}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillName}>{SKILL_LABELS[key]}</Text>
                      <Text style={styles.skillValue}>{skillAverages[key].toFixed(1)}</Text>
                    </View>
                    <ProgressBar value={skillAverages[key]} color={key === focusSkill ? palette.amber : palette.primary} />
                  </View>
                ))}
              </AppCard>
            </View>

            <View style={styles.sectionBlock}>
              <SectionHeader title="Latest match pattern" />
              <Pressable
                disabled={!latestMatch}
                accessibilityRole="button"
                onPress={() =>
                  latestMatch &&
                  router.push({ pathname: "/match/summary/[id]", params: { id: latestMatch.id } })
                }
                style={({ pressed }) => pressed && styles.pressed}
              >
                <AppCard>
                  {latestMatch ? (
                    <>
                      <View style={styles.matchTop}>
                        <View>
                          <Text style={styles.matchOpponent}>vs {latestMatch.opponent}</Text>
                          <Text style={styles.matchMeta}>
                            {new Date(latestMatch.matchDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>
                        <Text style={styles.score}>{latestMatch.scoreFor ?? 0}–{latestMatch.scoreAgainst ?? 0}</Text>
                      </View>
                      <View style={styles.matchMetrics}>
                        <View style={styles.matchMetric}>
                          <Text style={styles.matchMetricValue}>{Math.round(metrics.progressionRate * 100)}%</Text>
                          <Text style={styles.matchMetricLabel}>Progressed</Text>
                        </View>
                        <View style={styles.matchMetric}>
                          <Text style={styles.matchMetricValue}>{Math.round(metrics.chanceRate * 100)}%</Text>
                          <Text style={styles.matchMetricLabel}>Chances</Text>
                        </View>
                        <View style={styles.matchMetric}>
                          <Text style={styles.matchMetricValue}>{metrics.totalEvents}</Text>
                          <Text style={styles.matchMetricLabel}>Events</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyInline}>
                      <MaterialIcons name="sports-score" size={25} color={palette.muted} />
                      <Text style={styles.matchMeta}>Complete a match to see tactical patterns.</Text>
                    </View>
                  )}
                </AppCard>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Development signals" />
            <AppCard style={styles.playerCard}>
              {playerProgress.map((item, index) => (
                <Pressable
                  key={item.player.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: "/player/[id]", params: { id: item.player.id } })
                  }
                  style={({ pressed }) => [
                    styles.playerRow,
                    index > 0 && styles.playerDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <PlayerAvatar name={item.player.name} accent={item.player.accent} size={42} />
                  <View style={styles.playerCopy}>
                    <Text style={styles.playerName}>{item.player.name}</Text>
                    <Text style={styles.playerMeta}>
                      {item.latest
                        ? item.improvement > 0
                          ? `Up ${item.improvement.toFixed(1)} since last review`
                          : "Latest assessment saved"
                        : "Needs first assessment"}
                    </Text>
                  </View>
                  <Text style={[styles.playerScore, !item.latest && styles.playerScoreMuted]}>
                    {item.latest ? item.overall.toFixed(1) : "—"}
                  </Text>
                </Pressable>
              ))}
            </AppCard>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: "row", backgroundColor: palette.surfaceAlt, borderRadius: 13, padding: 3 },
  segment: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentSelected: { backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
  segmentLabel: { color: palette.muted, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  segmentLabelSelected: { color: palette.ink, fontWeight: "700" },
  snapshotRow: { flexDirection: "row", gap: 12 },
  snapshotCard: { flex: 1, minHeight: 112, justifyContent: "space-between", gap: 10 },
  snapshotValue: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
  snapshotLabel: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  sectionBlock: { gap: 10 },
  skillCard: { paddingVertical: 4 },
  skillRow: { gap: 8, paddingVertical: 13 },
  skillDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  skillLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skillName: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  skillValue: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  matchTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  matchOpponent: { color: palette.ink, fontSize: 18, lineHeight: 23, fontWeight: "700" },
  matchMeta: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  score: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: "800", fontVariant: ["tabular-nums"] },
  matchMetrics: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  matchMetric: { flex: 1 },
  matchMetricValue: { color: palette.ink, fontSize: 19, lineHeight: 24, fontWeight: "800", fontVariant: ["tabular-nums"] },
  matchMetricLabel: { color: palette.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  emptyInline: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10 },
  playerCard: { paddingVertical: 2 },
  playerRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  playerDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  playerCopy: { flex: 1 },
  playerName: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  playerMeta: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  playerScore: { color: palette.primaryDark, fontSize: 18, lineHeight: 23, fontWeight: "800", fontVariant: ["tabular-nums"] },
  playerScoreMuted: { color: palette.muted },
  pressed: { opacity: 0.62 },
});
