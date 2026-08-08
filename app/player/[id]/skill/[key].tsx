/**
 * Skill Detail Drill-Down
 *
 * Shows the full history and trend for a single skill for a player.
 * Reached by tapping a skill bar or radar axis on the Player Profile.
 *
 * Layout:
 *   Header (skill name + current rating badge)
 *   Trend line chart (filtered to this skill)
 *   Rating history timeline (each assessment date + rating)
 *   Coaching cue card
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkillTrendLine } from "@/components/charts/SkillTrendLine";
import { DevelopmentDelta, SkillBadge } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, ratingBg, ratingColor, ratingLabel, spacing, typography } from "@/lib/palette";
import { RATING_LABELS, SKILL_LABELS, type Rating, type SkillKey } from "@/types/models";

const SKILL_TIPS: Record<SkillKey, { developing: string; secure: string; strong: string }> = {
  ballControl: {
    developing: "Focus on first-touch drills with both feet. Use wall passes and cone dribbles at walking pace.",
    secure: "Introduce pressure — have a partner close down while receiving. Vary surface (thigh, chest, foot).",
    strong: "Challenge with game-speed scenarios: turn and accelerate, receive under pressure in tight spaces.",
  },
  passing: {
    developing: "Start with short, firm passes over 5–10 yards. Emphasise planting foot and follow-through.",
    secure: "Add weight and direction variety — play into space, switch play, use both feet consistently.",
    strong: "Work on disguised passes, first-time switches, and long-range accuracy under defensive pressure.",
  },
  receiving: {
    developing: "Practice cushion control: let the ball come to you, soft first touch into space ahead.",
    secure: "Receive on the half-turn — check shoulder before the ball arrives, open body shape.",
    strong: "Master receiving under pressure: shield, spin, and accelerate in one movement.",
  },
  dribbling: {
    developing: "Close control at slow speed — keep ball within one stride. Use inside/outside of both feet.",
    secure: "Add changes of pace and direction. Practice 1v1 moves: step-over, drag-back, body feint.",
    strong: "Dribble in game context: beat a defender and make a decision (pass/shoot) immediately after.",
  },
  defending: {
    developing: "Body position: side-on, low centre of gravity, jockey without diving in.",
    secure: "Read the attacker's hips. Practice delay-and-channel: force them onto their weak foot.",
    strong: "Anticipate and intercept. Organise teammates — communicate cover and press triggers.",
  },
  decisionMaking: {
    developing: "Encourage scanning: look up before receiving. Ask 'what did you see?' after each action.",
    secure: "Introduce options: can you play forward? If not, can you switch? Reward quick decisions.",
    strong: "Increase complexity: 3-option scenarios under time pressure. Reward risk-taking when appropriate.",
  },
};

function haptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function SkillDetailScreen() {
  const { id, key } = useLocalSearchParams<{ id: string; key: string }>();
  const insets = useSafeAreaInsets();
  const { data } = useWorkspace();

  const player = data.players.find((p) => p.id === id);
  const skillKey = key as SkillKey;
  const skillName = SKILL_LABELS[skillKey] ?? key;

  // All assessments for this player, sorted chronologically
  const assessments = data.assessments
    .filter((a) => a.playerId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const latestAssessment = assessments[assessments.length - 1];
  const currentRating = latestAssessment?.ratings[skillKey] as Rating | undefined;
  const previousRating = assessments.length >= 2
    ? (assessments[assessments.length - 2].ratings[skillKey] as Rating)
    : undefined;
  const delta = currentRating && previousRating ? currentRating - previousRating : 0;

  // Determine coaching tip based on current rating
  const tipLevel = currentRating === 3 ? "strong" : currentRating === 2 ? "secure" : "developing";
  const tip = SKILL_TIPS[skillKey]?.[tipLevel] ?? "";

  if (!player) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Player not found</Text>
      </View>
    );
  }

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
          <MaterialIcons name="arrow-back" size={22} color={palette.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.skillTitle}>{skillName}</Text>
        </View>
        <View style={styles.headerRight}>
          {currentRating ? (
            <SkillBadge rating={currentRating} />
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Rating Card */}
        {currentRating ? (
          <View style={[styles.ratingCard, { backgroundColor: ratingBg(currentRating) }]}>
            <View style={styles.ratingCardRow}>
              <View>
                <Text style={[styles.ratingCardLabel, { color: ratingColor(currentRating) }]}>
                  CURRENT LEVEL
                </Text>
                <Text style={[styles.ratingCardValue, { color: ratingColor(currentRating) }]}>
                  {ratingLabel(currentRating)}
                </Text>
              </View>
              {delta !== 0 ? <DevelopmentDelta delta={delta} /> : null}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="assessment" size={32} color={palette.muted} />
            <Text style={styles.emptyText}>No assessments yet for {skillName}</Text>
          </View>
        )}

        {/* Trend Line */}
        {assessments.length >= 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Trend</Text>
            <View style={styles.chartCard}>
              <SkillTrendLine
                assessments={assessments}
                skillKey={skillKey}
                width={340}
                height={180}
                showRangeSelector={assessments.length > 4}
              />
            </View>
          </View>
        ) : null}

        {/* Rating History Timeline */}
        {assessments.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment History</Text>
            <View style={styles.timelineCard}>
              {assessments.slice().reverse().map((assessment, idx) => {
                const rating = assessment.ratings[skillKey] as Rating;
                const date = new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(assessment.createdAt));
                const isLatest = idx === 0;
                return (
                  <View
                    key={assessment.id}
                    style={[styles.timelineRow, idx > 0 && styles.timelineDivider]}
                  >
                    <View style={[styles.timelineDot, { backgroundColor: ratingColor(rating) }]} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineDate, isLatest && styles.timelineDateLatest]}>
                        {date}{isLatest ? "  (latest)" : ""}
                      </Text>
                      <Text style={[styles.timelineRating, { color: ratingColor(rating) }]}>
                        {RATING_LABELS[rating]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Coaching Tip */}
        {tip ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coaching Tip</Text>
            <View style={styles.tipCard}>
              <MaterialIcons name="lightbulb" size={20} color={palette.amber} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          </View>
        ) : null}

        {/* Assess Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          onPress={() => { haptic(); router.push({ pathname: "/assess/[playerId]" as any, params: { playerId: player.id } }); }}
          style={styles.assessBtn}
        >
          <MaterialIcons name="rate-review" size={20} color="#FFFFFF" />
          <Text style={styles.assessBtnText}>New Assessment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  errorText: { ...typography.body, color: palette.muted, textAlign: "center", marginTop: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, marginLeft: spacing.sm },
  playerName: { ...typography.caption, color: palette.muted },
  skillTitle: { ...typography.cardTitle, color: palette.ink },
  headerRight: { marginLeft: spacing.sm },
  scroll: { flex: 1 },
  content: { padding: spacing.base, gap: spacing.base },
  ratingCard: {
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  ratingCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingCardLabel: { ...typography.eyebrow, marginBottom: 4 },
  ratingCardValue: { fontSize: 24, fontWeight: "800", lineHeight: 30 },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: { ...typography.body, color: palette.muted, textAlign: "center" },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionHead, color: palette.ink },
  chartCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: "center",
  },
  timelineCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  timelineDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingTop: spacing.sm,
  },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineContent: { flex: 1 },
  timelineDate: { ...typography.caption, color: palette.muted },
  timelineDateLatest: { fontWeight: "700", color: palette.ink },
  timelineRating: { ...typography.body, fontWeight: "700" },
  tipCard: {
    backgroundColor: palette.amberSoft,
    borderRadius: radius.xl,
    padding: spacing.base,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  tipText: { ...typography.body, color: palette.amberDark, flex: 1, lineHeight: 22 },
  assessBtn: {
    backgroundColor: "#00A878",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  assessBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
