/**
 * Player Development Profile — redesigned 2026-08-08
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkillRadar } from "@/components/charts/SkillRadar";
import { SkillTrendLine } from "@/components/charts/SkillTrendLine";
import {
  AppButton,
  AssessmentFreshness,
  DevelopmentDelta,
  EmptyState,
  FocusCard,
  IconButton,
  PlayerAvatar,
  SectionHeader,
  SkillBar,
  StrengthCard,
} from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  assessmentsForPlayer,
  averageRatings,
  improvementBetween,
  latestAssessmentForPlayer,
  strongestAndFocus,
} from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import type { SkillKey } from "@/types/models";
import { SKILL_LABELS } from "@/types/models";

const SKILL_SHORT: Record<SkillKey, string> = {
  ballControl: "bc", passing: "pa", receiving: "re",
  dribbling: "dr", defending: "de", decisionMaking: "dm",
};

const SKILL_CUES: Record<SkillKey, { strong: string; focus: string }> = {
  ballControl: {
    strong: "Comfortable receiving and controlling in tight spaces.",
    focus: "Work on first touch — receive and set the ball in one movement.",
  },
  passing: {
    strong: "Accurate distribution, good weight and timing.",
    focus: "Vary the pace and angle of passes to create better options.",
  },
  receiving: {
    strong: "Opens body well, scans before receiving.",
    focus: "Scan before the ball arrives so you know your next action.",
  },
  dribbling: {
    strong: "Confident carrying the ball at pace.",
    focus: "Work on changing direction while keeping close control.",
  },
  defending: {
    strong: "Strong body position and recovery runs.",
    focus: "Stay goal-side and delay before committing to a challenge.",
  },
  decisionMaking: {
    strong: "Reads the game well, makes quick and accurate choices.",
    focus: "Slow down to recognise when to pass, carry, or release.",
  },
};

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const insets = useSafeAreaInsets();
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const player = data.players.find((p) => p.id === id);
  const allAssessments = useMemo(
    () => assessmentsForPlayer(data.assessments, id ?? ""),
    [data.assessments, id],
  );
  const latest = allAssessments[0];
  const previous = allAssessments[1];
  const avg = latest ? averageRatings(latest.ratings) : null;
  const delta = improvementBetween(allAssessments);
  const { strongest, focus } = latest
    ? strongestAndFocus(latest.ratings)
    : { strongest: null as SkillKey | null, focus: null as SkillKey | null };

  const team = player ? data.teams.find((t) => t.id === player.teamId) : undefined;

  const handleShare = async () => {
    haptic();
    if (!player || !latest) return;
    const r: Record<string, number> = {};
    for (const key of Object.keys(SKILL_LABELS) as SkillKey[]) {
      r[SKILL_SHORT[key]] = latest.ratings[key];
    }
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      n: player.name, p: player.position, t: team?.name,
      d: latest.createdAt, r, no: latest.note, cn: "Coach",
    })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    try {
      await Share.share({
        message: `${player.name}'s latest Skilltracker assessment:\nhttps://soccerskilltracker.com/share/${payload}`,
        url: `https://soccerskilltracker.com/share/${payload}`,
      });
    } catch { /* dismissed */ }
  };

  if (!player) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState icon="person-off" title="Player not found" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton name="arrow-back" accessibilityLabel="Go back" onPress={() => { haptic(); router.back(); }} variant="ghost" />
        <Text style={styles.headerTitle}>Player</Text>
        <View style={styles.headerRight}>
          {latest ? (
            <IconButton name="share" accessibilityLabel="Share player profile" onPress={handleShare} variant="ghost" />
          ) : <View style={{ width: 44 }} />}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identitySection}>
          <PlayerAvatar name={player.name} accent={player.accent} size="xl" />
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>#{player.number}</Text>
              </View>
            </View>
            <Text style={styles.playerPosition}>{player.position}</Text>
            <View style={styles.identityMeta}>
              {avg !== null ? (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelValue}>{avg.toFixed(1)}</Text>
                  <DevelopmentDelta delta={delta} />
                </View>
              ) : null}
              <AssessmentFreshness createdAt={latest?.createdAt} />
            </View>
          </View>
        </View>

        {/* Assess CTA */}
        <AppButton
          label={latest ? "Reassess Player" : "Create First Assessment"}
          onPress={() => { haptic(); router.push({ pathname: "/assess/[playerId]" as any, params: { playerId: player.id } }); }}
          variant="primary"
          size="default"
          icon="assignment"
        />

        {latest ? (
          <>
            {/* Radar */}
            <View style={styles.radarSection}>
              <SectionHeader title="Development Shape" />
              {previous ? <Text style={styles.radarHint}>Solid = current · Dashed = previous</Text> : <Text style={styles.radarHint}>Tap a skill to see detail</Text>}
              <View style={styles.radarContainer}>
                <SkillRadar
                  ratings={latest.ratings}
                  previousRatings={previous?.ratings}
                  size={280}
                  onSkillPress={(key) => { haptic(); router.push({ pathname: "/player/[id]/skill/[key]" as any, params: { id: player.id, key } }); }}
                />
              </View>
            </View>

            {/* Strength + Focus */}
            {strongest && focus ? (
              <View style={styles.sfRow}>
                <View style={styles.sfCard}>
                  <StrengthCard skill={SKILL_LABELS[strongest]} observation={SKILL_CUES[strongest].strong} onPress={() => { haptic(); router.push({ pathname: "/player/[id]/skill/[key]" as any, params: { id: player.id, key: strongest } }); }} />
                </View>
                <View style={styles.sfCard}>
                  <FocusCard skill={SKILL_LABELS[focus]} cue={SKILL_CUES[focus].focus} onPress={() => { haptic(); router.push({ pathname: "/player/[id]/skill/[key]" as any, params: { id: player.id, key: focus } }); }} />
                </View>
              </View>
            ) : null}

            {/* Trend */}
            <View style={styles.trendSection}>
              <SectionHeader title="Development Trend" />
              <SkillTrendLine assessments={allAssessments} width={340} height={160} />
            </View>

            {/* Skill bars */}
            <View style={styles.skillsSection}>
              <SectionHeader title="Skill Breakdown" />
              {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => {
                const prevRating = previous?.ratings[key];
                const currRating = latest.ratings[key];
                const skillDelta = prevRating !== undefined ? currRating - prevRating : 0;
                return (
                  <SkillBar
                    key={key}
                    label={SKILL_LABELS[key]}
                    rating={currRating as 1 | 2 | 3}
                    delta={skillDelta}
                    onPress={() => { haptic(); router.push({ pathname: "/player/[id]/skill/[key]" as any, params: { id: player.id, key } }); }}
                  />
                );
              })}
            </View>

            {/* Observation */}
            {latest.note ? (
              <View style={styles.observationSection}>
                <SectionHeader title="Latest Observation" />
                <View style={styles.observationCard}>
                  <MaterialIcons name="format-quote" size={20} color={palette.primary} />
                  <Text style={styles.observationText}>{latest.note}</Text>
                  <Text style={styles.observationDate}>
                    {new Date(latest.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* History */}
            <View style={styles.historySection}>
              <SectionHeader title="Assessment History" />
              {allAssessments.slice(0, 4).map((assessment, idx) => {
                const assessAvg = averageRatings(assessment.ratings);
                const prevA = allAssessments[idx + 1];
                const d = prevA ? assessAvg - averageRatings(prevA.ratings) : 0;
                return (
                  <Pressable key={assessment.id} accessibilityRole="button" onPress={() => haptic()} style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyDate}>
                        {new Date(assessment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                      {assessment.note ? <Text style={styles.historyNote} numberOfLines={1}>{assessment.note}</Text> : null}
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyScore}>{assessAvg.toFixed(1)}</Text>
                      <DevelopmentDelta delta={d} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.noAssessmentCard}>
            <MaterialIcons name="assignment" size={32} color={palette.amber} />
            <Text style={styles.noAssessmentTitle}>No assessment yet</Text>
            <Text style={styles.noAssessmentBody}>
              Create a baseline assessment to start tracking {player.name.split(" ")[0]}'s development.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm, height: 52 },
  headerTitle: { ...typography.bodyMed, color: palette.ink },
  headerRight: { width: 44, alignItems: "flex-end" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.lg },
  identitySection: { flexDirection: "row", alignItems: "flex-start", gap: spacing.base },
  identityCopy: { flex: 1, gap: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  playerName: { ...typography.displayMd, color: palette.ink, flex: 1 },
  numberBadge: { backgroundColor: palette.primarySoft, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  numberBadgeText: { ...typography.caption, color: palette.primary, fontWeight: "700" as const },
  playerPosition: { ...typography.body, color: palette.muted },
  identityMeta: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  levelValue: { ...typography.sectionHead, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  radarSection: { gap: spacing.sm },
  radarHint: { ...typography.caption, color: palette.muted },
  radarContainer: { alignItems: "center" },
  sfRow: { flexDirection: "row", gap: spacing.sm },
  sfCard: { flex: 1 },
  trendSection: { gap: spacing.sm },
  skillsSection: { gap: spacing.md },
  observationSection: { gap: spacing.sm },
  observationCard: { backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base, gap: spacing.sm },
  observationText: { ...typography.body, color: palette.ink, lineHeight: 24, fontStyle: "italic" },
  observationDate: { ...typography.caption, color: palette.muted },
  historySection: { gap: spacing.sm },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.md },
  historyLeft: { flex: 1, gap: 3 },
  historyDate: { ...typography.bodyMed, color: palette.ink },
  historyNote: { ...typography.caption, color: palette.muted },
  historyRight: { alignItems: "flex-end", gap: 3 },
  historyScore: { ...typography.cardTitle, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  noAssessmentCard: { backgroundColor: palette.amberSoft, borderRadius: radius.xl, borderWidth: 1, borderColor: "#EDD5AC", padding: spacing.xl, alignItems: "center", gap: spacing.md },
  noAssessmentTitle: { ...typography.sectionHead, color: palette.amberDark },
  noAssessmentBody: { ...typography.body, color: palette.amberDark, textAlign: "center", lineHeight: 22, opacity: 0.85 },
  pressed: { opacity: 0.72 },
});
