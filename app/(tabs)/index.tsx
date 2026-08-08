/**
 * Coach Home — Command Center
 *
 * The coach should understand the state of the team in ~5 seconds.
 *
 * Layout:
 *   1. Header: Skilltracker wordmark + settings
 *   2. Team greeting + team selector
 *   3. NEXT ACTION card (most important thing to do)
 *   4. UPCOMING MATCH card (or active match)
 *   5. TEAM SNAPSHOT (assessed/total, primary strength, current focus)
 *   6. QUICK ACTIONS row
 *   7. RECENT DEVELOPMENT (2–3 meaningful observations)
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppButton,
  AppCard,
  AssessmentFreshness,
  DevelopmentDelta,
  EmptyState,
  FocusCard,
  IconButton,
  PlayerAvatar,
  SectionHeader,
  SkillBadge,
  StrengthCard,
} from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  assessmentsForPlayer,
  improvementBetween,
  latestAssessmentForPlayer,
  strongestAndFocus,
  teamSkillAverages,
} from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { SKILL_LABELS } from "@/types/models";

const HEADER_HEIGHT = 56;

export default function HomeScreen() {
  const { data } = useWorkspace();
  const insets = useSafeAreaInsets();

  const team = data.teams.find((t) => t.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = data.players.filter((p) => p.teamId === team?.id);

  const activeMatch = data.matches.find(
    (m) => m.status === "live" || m.status === "paused",
  );
  const upcomingMatch = data.matches
    .filter((m) => m.status === "pending")
    .sort((a, b) => Date.parse(a.matchDate) - Date.parse(b.matchDate))[0];

  // Players who haven't been assessed in the last 14 days
  const stalePlayerIds = useMemo(() => {
    const cutoff = Date.now() - 14 * 86_400_000;
    return players
      .filter((p) => {
        const latest = latestAssessmentForPlayer(data.assessments, p.id);
        return !latest || Date.parse(latest.createdAt) < cutoff;
      })
      .map((p) => p.id);
  }, [players, data.assessments]);

  const assessedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    const ids = new Set(
      data.assessments
        .filter((a) => Date.parse(a.createdAt) >= cutoff)
        .map((a) => a.playerId),
    );
    return players.filter((p) => ids.has(p.id)).length;
  }, [players, data.assessments]);

  const teamAverages = useMemo(
    () => teamSkillAverages(data.assessments),
    [data.assessments],
  );

  const { strongest: teamStrength, focus: teamFocus } = useMemo(
    () => {
      const vals = Object.values(teamAverages);
      if (vals.every((v) => v === 0)) return { strongest: "defending" as const, focus: "decisionMaking" as const };
      return strongestAndFocus(teamAverages as any);
    },
    [teamAverages],
  );

  // Recent development observations (last 3 assessments across all players)
  const recentAssessments = useMemo(
    () =>
      [...data.assessments]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 3),
    [data.assessments],
  );

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Skilltracker</Text>
        <IconButton
          name="settings"
          accessibilityLabel="Open settings"
          onPress={() => { haptic(); router.push("/settings"); }}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Team greeting */}
        {team ? (
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingLabel}>YOUR TEAM</Text>
              <Text style={styles.greetingTeam}>{team.name}</Text>
              <Text style={styles.greetingMeta}>{team.ageGroup} · {team.season}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change team"
              style={({ pressed }) => [styles.teamChip, pressed && styles.pressed]}
            >
              <Text style={styles.teamChipText}>{players.length} players</Text>
              <MaterialIcons name="keyboard-arrow-down" size={14} color={palette.primary} />
            </Pressable>
          </View>
        ) : null}

        {/* NEXT ACTION */}
        {stalePlayerIds.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => { haptic(); router.push("/(tabs)/team" as any); }}
            style={({ pressed }) => [styles.nextActionCard, pressed && styles.pressed]}
          >
            <View style={styles.nextActionLeft}>
              <View style={styles.nextActionDot} />
              <View style={styles.nextActionCopy}>
                <Text style={styles.nextActionLabel}>NEXT ACTION</Text>
                <Text style={styles.nextActionTitle}>
                  Assess {stalePlayerIds.length} player{stalePlayerIds.length === 1 ? "" : "s"}
                </Text>
                <Text style={styles.nextActionSub}>
                  {stalePlayerIds.length === 1
                    ? "1 player hasn't been reviewed recently"
                    : `${stalePlayerIds.length} players haven't been reviewed recently`}
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={palette.primary} />
          </Pressable>
        ) : players.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => { haptic(); router.push("/(tabs)/team" as any); }}
            style={({ pressed }) => [styles.nextActionCard, pressed && styles.pressed]}
          >
            <View style={styles.nextActionLeft}>
              <View style={[styles.nextActionDot, { backgroundColor: palette.amber }]} />
              <View style={styles.nextActionCopy}>
                <Text style={styles.nextActionLabel}>GET STARTED</Text>
                <Text style={styles.nextActionTitle}>Add your first player</Text>
                <Text style={styles.nextActionSub}>Add players to start tracking development</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={palette.primary} />
          </Pressable>
        ) : (
          <View style={[styles.nextActionCard, { borderColor: palette.primarySoft }]}>
            <View style={styles.nextActionLeft}>
              <View style={[styles.nextActionDot, { backgroundColor: palette.strong }]} />
              <View style={styles.nextActionCopy}>
                <Text style={[styles.nextActionLabel, { color: palette.primaryDark }]}>ALL CAUGHT UP</Text>
                <Text style={styles.nextActionTitle}>Squad fully assessed</Text>
                <Text style={styles.nextActionSub}>All players reviewed in the last 2 weeks</Text>
              </View>
            </View>
            <MaterialIcons name="check-circle" size={22} color={palette.strong} />
          </View>
        )}

        {/* ACTIVE / UPCOMING MATCH */}
        {activeMatch ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic();
              router.push({ pathname: "/match/live/[id]", params: { id: activeMatch.id } });
            }}
            style={[styles.matchCard, styles.matchCardLive]}
          >
            <View style={styles.matchCardHeader}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
              <Text style={styles.matchCardOpponent}>vs {activeMatch.opponent}</Text>
            </View>
            <Text style={styles.matchCardCta}>Tap to continue tracking →</Text>
          </Pressable>
        ) : upcomingMatch ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic();
              router.push("/(tabs)/match" as any);
            }}
            style={styles.matchCard}
          >
            <View style={styles.matchCardHeader}>
              <Text style={styles.matchCardLabel}>UPCOMING MATCH</Text>
              <AppButton
                label="Start Match"
                onPress={() => { haptic(); router.push("/match/setup"); }}
                variant="primary"
                size="compact"
              />
            </View>
            <Text style={styles.matchCardOpponent}>vs {upcomingMatch.opponent}</Text>
            <Text style={styles.matchCardDate}>
              {new Date(upcomingMatch.matchDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </Pressable>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            onPress={() => { haptic(); router.push("/match/setup"); }}
            style={styles.matchCard}
          >
            <View style={styles.matchCardHeader}>
              <Text style={styles.matchCardLabel}>MATCH TRACKING</Text>
              <MaterialIcons name="sports-soccer" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.matchCardOpponent}>No match scheduled</Text>
            <Text style={styles.matchCardCta}>Tap to set up a match →</Text>
          </TouchableOpacity>
        )}

        {/* TEAM SNAPSHOT */}
        {data.assessments.length > 0 ? (
          <View style={styles.snapshotSection}>
            <SectionHeader title="Team Snapshot" />
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotStat}>
                <Text style={styles.snapshotValue}>{assessedThisWeek}/{players.length}</Text>
                <Text style={styles.snapshotLabel}>Assessed this week</Text>
              </View>
              <View style={styles.snapshotDivider} />
              <View style={styles.snapshotStat}>
                <Text style={styles.snapshotValue}>{players.length}</Text>
                <Text style={styles.snapshotLabel}>Players in squad</Text>
              </View>
            </View>
            <View style={styles.snapshotCards}>
              <StrengthCard
                skill={SKILL_LABELS[teamStrength]}
                observation="Team's highest-rated skill"
              />
              <FocusCard
                skill={SKILL_LABELS[teamFocus]}
                cue="Team's current development priority"
                onPress={() => { haptic(); router.push("/(tabs)/insights"); }}
              />
            </View>
          </View>
        ) : null}

        {/* QUICK ACTIONS */}
        <View style={styles.quickActionsSection}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon="person-search"
              label="Assess Player"
              color={palette.primary}
              bg={palette.primarySoft}
              onPress={() => { haptic(); router.push("/(tabs)/team" as any); }}
            />
            <QuickAction
              icon="sports-soccer"
              label="Start Match"
              color={palette.navyMid}
              bg={palette.navySoft}
              onPress={() => { haptic(); router.push("/match/setup"); }}
            />
            <QuickAction
              icon="person-add"
              label="Add Player"
              color={palette.amber}
              bg={palette.amberSoft}
              onPress={() => { haptic(); router.push("/(tabs)/team" as any); }}
            />
          </View>
        </View>

        {/* RECENT DEVELOPMENT */}
        {recentAssessments.length > 0 ? (
          <View style={styles.recentSection}>
            <SectionHeader
              title="Recent Development"
              actionLabel="See all"
              onAction={() => router.push("/(tabs)/team" as any)}
            />
            {recentAssessments.map((assessment) => {
              const player = data.players.find((p) => p.id === assessment.playerId);
              if (!player) return null;
              const allForPlayer = assessmentsForPlayer(data.assessments, player.id);
              const delta = improvementBetween(allForPlayer);
              const { strongest } = strongestAndFocus(assessment.ratings);
              return (
                <Pressable
                  key={assessment.id}
                  accessibilityRole="button"
                  onPress={() => {
                    haptic();
                    router.push({ pathname: "/player/[id]", params: { id: player.id } });
                  }}
                  style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
                >
                  <PlayerAvatar name={player.name} accent={player.accent} size="sm" />
                  <View style={styles.recentCopy}>
                    <Text style={styles.recentName}>{player.name}</Text>
                    <Text style={styles.recentDetail}>
                      Strength: {SKILL_LABELS[strongest]}
                    </Text>
                  </View>
                  <View style={styles.recentRight}>
                    <DevelopmentDelta delta={delta} />
                    <AssessmentFreshness createdAt={assessment.createdAt} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="assessment"
            title="No assessments yet"
            body="Assess a player to start tracking development."
            cta="Assess a player"
            onCta={() => { haptic(); router.push("/(tabs)/team" as any); }}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuickAction button
// ─────────────────────────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
  },
  wordmark: { ...typography.pageTitle, color: palette.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.lg },

  // Greeting
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greetingLabel: { ...typography.eyebrow, color: palette.primary, marginBottom: 2 },
  greetingTeam: { ...typography.displayMd, color: palette.ink },
  greetingMeta: { ...typography.caption, color: palette.muted, marginTop: 2 },
  teamChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 4,
  },
  teamChipText: { ...typography.caption, color: palette.primary, fontWeight: "700" as const },

  // Next Action
  nextActionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: palette.primary,
    padding: spacing.base,
    gap: spacing.md,
  },
  nextActionLeft: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, flex: 1 },
  nextActionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primary,
    marginTop: 5,
  },
  nextActionCopy: { flex: 1, gap: 3 },
  nextActionLabel: { ...typography.eyebrow, color: palette.primary },
  nextActionTitle: { ...typography.cardTitle, color: palette.ink },
  nextActionSub: { ...typography.caption, color: palette.muted },

  // Match Card
  matchCard: {
    backgroundColor: palette.navy,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
  },
  matchCardLive: { borderWidth: 1.5, borderColor: "#4ADE80" },
  matchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchCardLabel: { ...typography.eyebrow, color: "#FFFFFF" },
  matchCardOpponent: { ...typography.sectionHead, color: palette.white },
  matchCardDate: { ...typography.caption, color: "rgba(255,255,255,0.85)" },
  matchCardCta: { ...typography.caption, color: "#FFFFFF" },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74,222,128,0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#4ADE80",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  liveLabel: { ...typography.eyebrow, color: "#4ADE80" },

  // Team Snapshot
  snapshotSection: { gap: spacing.md },
  snapshotRow: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.base,
  },
  snapshotStat: { flex: 1, alignItems: "center", gap: 4 },
  snapshotValue: { ...typography.displayMd, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  snapshotLabel: { ...typography.caption, color: palette.muted, textAlign: "center" },
  snapshotDivider: { width: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: 4 },
  snapshotCards: { gap: spacing.sm },

  // Quick Actions
  quickActionsSection: { gap: spacing.md },
  quickActionsRow: { flexDirection: "row", gap: spacing.sm },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    paddingVertical: spacing.base,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: { ...typography.caption, color: palette.ink, fontWeight: "700" as const, textAlign: "center" },

  // Recent Development
  recentSection: { gap: spacing.md },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.md,
  },
  recentCopy: { flex: 1, gap: 3 },
  recentName: { ...typography.bodyMed, color: palette.ink },
  recentDetail: { ...typography.caption, color: palette.muted },
  recentRight: { alignItems: "flex-end", gap: 4 },

  // Shared
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
