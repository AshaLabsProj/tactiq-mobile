import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppCard,
  IconButton,
  Metric,
  PageHeader,
  SectionHeader,
  mobileStyles,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { latestAssessmentForPlayer } from "@/lib/insights";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export default function HomeScreen() {
  const { data } = useWorkspace();
  const hapticsEnabled = data.settings.hapticsEnabled;
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const teamPlayers = data.players.filter((player) => player.teamId === team?.id);
  const nextMatch = [...data.matches]
    .filter((match) => match.teamId === team?.id && match.status !== "completed")
    .sort((a, b) => Date.parse(a.matchDate) - Date.parse(b.matchDate))[0];
  const latestCompletedMatch = [...data.matches]
    .filter((match) => match.teamId === team?.id && match.status === "completed")
    .sort((a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate))[0];
  const recentAssessment = [...data.assessments].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )[0];
  const assessedPlayers = new Set(
    teamPlayers.filter((player) => latestAssessmentForPlayer(data.assessments, player.id)).map((player) => player.id),
  ).size;

  const openMatch = () => {
    haptic.light(hapticsEnabled);
    if (nextMatch) {
      router.push({ pathname: "/match/live/[id]", params: { id: nextMatch.id } });
    } else {
      router.push("/match/setup");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <PageHeader
          eyebrow={team?.name ?? "Tactiq"}
          title={greeting()}
          subtitle="One clear view of today’s coaching work."
          action={
            <IconButton
              name="settings"
              accessibilityLabel="Open settings"
              onPress={() => {
                haptic.light(hapticsEnabled);
                router.push("/settings");
              }}
            />
          }
        />

        <AppCard tone="green" style={styles.focusCard}>
          <View style={styles.focusTopRow}>
            <View style={styles.focusIcon}>
              <MaterialIcons name={nextMatch ? "sports-soccer" : "add-task"} size={24} color={palette.primaryDark} />
            </View>
            <Text style={styles.focusLabel}>NEXT UP</Text>
          </View>
          <Text style={styles.focusTitle}>
            {nextMatch ? `Prepare for ${nextMatch.opponent}` : "Create your next coaching task"}
          </Text>
          <Text style={styles.focusBody}>
            {nextMatch
              ? `${formatShortDate(nextMatch.matchDate)} · Match capture is ready when you are.`
              : "Set up a match or add a fresh player assessment."}
          </Text>
          <AppButton
            label={nextMatch ? "Open match" : "Set up match"}
            icon="arrow-forward"
            variant="secondary"
            onPress={openMatch}
          />
        </AppCard>

        <View style={styles.metricsRow}>
          <AppCard style={styles.metricCard}>
            <Metric value={String(teamPlayers.length)} label="Players" />
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Metric value={`${assessedPlayers}/${teamPlayers.length}`} label="Assessed" />
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Metric
              value={String(data.matches.filter((match) => match.status === "completed").length)}
              label="Matches"
            />
          </AppCard>
        </View>

        {/* ── Match Tracking ─────────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>MATCH TRACKING</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic.light(hapticsEnabled);
              router.push("/match/setup");
            }}
            style={({ pressed }) => [styles.featureCard, styles.featureCardMatch, pressed && styles.pressed]}
          >
            <View style={styles.featureCardInner}>
              <View style={[styles.featureIcon, styles.featureIconMatch]}>
                <MaterialIcons name="sports-soccer" size={26} color={palette.matchText} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={[styles.featureTitle, { color: palette.matchText }]}>Track a match</Text>
                <Text style={[styles.featureBody, { color: palette.matchMuted }]}>Log zones, outcomes &amp; events live on the pitch.</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={palette.matchMuted} />
            </View>
          </Pressable>
        </View>

        {/* ── Player Development ─────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionLabelRow}>
            <View style={[styles.sectionDot, styles.sectionDotAmber]} />
            <Text style={[styles.sectionLabel, styles.sectionLabelAmber]}>PLAYER DEVELOPMENT</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic.light(hapticsEnabled);
              router.push("/assessment-qa");
            }}
            style={({ pressed }) => [styles.featureCard, styles.featureCardAssess, pressed && styles.pressed]}
          >
            <View style={styles.featureCardInner}>
              <View style={[styles.featureIcon, styles.featureIconAssess]}>
                <MaterialIcons name="fact-check" size={26} color="#8E5A0E" />
              </View>
              <View style={styles.featureCopy}>
                <Text style={[styles.featureTitle, { color: palette.ink }]}>Assess a player</Text>
                <Text style={styles.featureBody}>Rate 6 skills in about one minute. One player at a time.</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={16} color={palette.muted} />
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader
            title="Recent activity"
            actionLabel="View insights"
            onAction={() => router.push("/(tabs)/insights")}
          />
          <AppCard style={styles.activityCard}>
            {recentAssessment ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/player/[id]", params: { id: recentAssessment.playerId } })
                }
                style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
              >
                <View style={styles.activityIcon}>
                  <MaterialIcons name="trending-up" size={20} color={palette.primary} />
                </View>
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>
                    {data.players.find((player) => player.id === recentAssessment.playerId)?.name ?? "Player"} assessed
                  </Text>
                  <Text style={styles.activityMeta}>{formatShortDate(recentAssessment.createdAt)}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
              </Pressable>
            ) : null}
            {recentAssessment && latestCompletedMatch ? <View style={styles.divider} /> : null}
            {latestCompletedMatch ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/match/summary/[id]", params: { id: latestCompletedMatch.id } })
                }
                style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
              >
                <View style={styles.activityIcon}>
                  <MaterialIcons name="sports-score" size={20} color={palette.primary} />
                </View>
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>vs {latestCompletedMatch.opponent}</Text>
                  <Text style={styles.activityMeta}>
                    {latestCompletedMatch.scoreFor ?? 0}–{latestCompletedMatch.scoreAgainst ?? 0} · {formatShortDate(latestCompletedMatch.matchDate)}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
              </Pressable>
            ) : null}
          </AppCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  focusCard: { gap: 14, padding: 20 },
  focusTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  focusIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  focusLabel: { color: palette.primaryDark, fontSize: 12, lineHeight: 16, fontWeight: "800", letterSpacing: 1 },
  focusTitle: { color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: "800", letterSpacing: -0.3 },
  focusBody: { color: palette.muted, fontSize: 15, lineHeight: 22 },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: { flex: 1, padding: 13, minHeight: 92, justifyContent: "center" },
  sectionBlock: { gap: 10 },
  // Section label row (MATCH TRACKING / PLAYER DEVELOPMENT)
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  sectionDotAmber: { backgroundColor: palette.amber },
  sectionLabel: {
    color: palette.primaryDark,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionLabelAmber: { color: "#8E5A0E" },
  // Feature cards
  featureCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    overflow: "hidden",
  },
  featureCardMatch: {
    backgroundColor: palette.matchSurface,
    borderColor: palette.matchBorder,
  },
  featureCardAssess: {
    backgroundColor: palette.amberSoft,
    borderColor: "#E8C97A",
  },
  featureCardInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  featureIconMatch: { backgroundColor: "rgba(255,255,255,0.35)" },
  featureIconAssess: { backgroundColor: "rgba(255,255,255,0.55)" },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 17, lineHeight: 22, fontWeight: "800" },
  featureBody: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  activityCard: { padding: 0, overflow: "hidden" },
  activityRow: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 4, gap: 12 },
  activityIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1 },
  activityTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  activityMeta: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginLeft: 66 },
  pressed: { opacity: 0.65 },
});
