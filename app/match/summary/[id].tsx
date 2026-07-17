import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AppButton,
  AppCard,
  IconButton,
  Metric,
  mobileStyles,
  PageHeader,
  SectionHeader,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette } from "@/lib/palette";
import type { MatchOutcome, PitchThird } from "@/types/models";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const OUTCOME_COLORS: Record<MatchOutcome, string> = {
  progression: palette.primary,
  chance: palette.amber,
  retention: palette.primaryDark,
  turnover: palette.coral,
};

const THIRD_LABELS: Record<PitchThird, string> = {
  defensive: "Defensive",
  middle: "Middle",
  attacking: "Attacking",
};

export default function MatchSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const match = data.matches.find((m) => m.id === id);
  const events = data.matchEvents.filter((e) => e.matchId === id);

  if (!match) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <MaterialIcons name="sports-soccer" size={40} color={palette.muted} />
          <Text style={styles.notFoundTitle}>Match not found</Text>
          <AppButton
            label="Back to home"
            variant="secondary"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </ScreenContainer>
    );
  }

  const progressions = events.filter((e) => e.outcome === "progression").length;
  const chances = events.filter((e) => e.outcome === "chance").length;
  const turnovers = events.filter((e) => e.outcome === "turnover").length;
  const retentions = events.filter((e) => e.outcome === "retention").length;

  const byThird = (["defensive", "middle", "attacking"] as PitchThird[]).map(
    (third) => ({
      third,
      count: events.filter((e) => e.third === third).length,
    }),
  );

  const maxThirdCount = Math.max(...byThird.map((t) => t.count), 1);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <IconButton
          name="arrow-back"
          accessibilityLabel="Back"
          onPress={() => router.back()}
        />
        <Text style={styles.topBarTitle}>Match summary</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <PageHeader
          eyebrow={formatDate(match.matchDate)}
          title={`vs ${match.opponent}`}
        />

        <AppCard tone="green" style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{match.scoreFor ?? 0}</Text>
              <Text style={styles.scoreLabel}>Your team</Text>
            </View>
            <Text style={styles.scoreDash}>–</Text>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{match.scoreAgainst ?? 0}</Text>
              <Text style={styles.scoreLabel}>{match.opponent}</Text>
            </View>
          </View>
        </AppCard>

        <View style={styles.metricsRow}>
          <AppCard style={styles.metricCard}>
            <Metric value={String(events.length)} label="Events" />
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Metric value={String(progressions)} label="Progressions" />
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Metric value={String(chances)} label="Chances" />
          </AppCard>
        </View>

        {events.length > 0 ? (
          <>
            <View style={styles.sectionBlock}>
              <SectionHeader title="Outcomes" />
              <AppCard style={styles.outcomesCard}>
                {(
                  [
                    { key: "progression", label: "Progressions", value: progressions },
                    { key: "chance", label: "Chances", value: chances },
                    { key: "retention", label: "Retentions", value: retentions },
                    { key: "turnover", label: "Turnovers", value: turnovers },
                  ] as { key: MatchOutcome; label: string; value: number }[]
                ).map(({ key, label, value }, index) => (
                  <View
                    key={key}
                    style={[styles.outcomeRow, index > 0 && styles.outcomeDivider]}
                  >
                    <View
                      style={[
                        styles.outcomeDot,
                        { backgroundColor: OUTCOME_COLORS[key] },
                      ]}
                    />
                    <Text style={styles.outcomeLabel}>{label}</Text>
                    <Text style={[styles.outcomeValue, { color: OUTCOME_COLORS[key] }]}>
                      {value}
                    </Text>
                  </View>
                ))}
              </AppCard>
            </View>

            <View style={styles.sectionBlock}>
              <SectionHeader title="Activity by third" />
              <AppCard style={styles.thirdCard}>
                {byThird.map(({ third, count }, index) => (
                  <View
                    key={third}
                    style={[styles.thirdRow, index > 0 && styles.thirdDivider]}
                  >
                    <Text style={styles.thirdLabel}>{THIRD_LABELS[third]}</Text>
                    <View style={styles.thirdBarTrack}>
                      <View
                        style={[
                          styles.thirdBarFill,
                          {
                            width: `${(count / maxThirdCount) * 100}%` as `${number}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.thirdCount}>{count}</Text>
                  </View>
                ))}
              </AppCard>
            </View>
          </>
        ) : (
          <AppCard style={styles.emptyCard}>
            <MaterialIcons name="sports-soccer" size={28} color={palette.muted} />
            <Text style={styles.emptyText}>No events recorded for this match.</Text>
          </AppCard>
        )}

        <AppButton
          label="Back to home"
          variant="secondary"
          icon="home"
          onPress={() => router.replace("/(tabs)")}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topBarTitle: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  topBarSpacer: { width: 44, height: 44 },
  scoreCard: { alignItems: "center", paddingVertical: 24 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  scoreBlock: { alignItems: "center", gap: 4 },
  scoreValue: {
    color: palette.ink,
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  scoreLabel: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  scoreDash: {
    color: palette.muted,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "300",
  },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: { flex: 1, padding: 13, minHeight: 88, justifyContent: "center" },
  sectionBlock: { gap: 10 },
  outcomesCard: { paddingVertical: 4, paddingHorizontal: 0 },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  outcomeDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  outcomeDot: { width: 10, height: 10, borderRadius: 5 },
  outcomeLabel: { flex: 1, color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  outcomeValue: { fontSize: 18, lineHeight: 23, fontWeight: "800", fontVariant: ["tabular-nums"] },
  thirdCard: { gap: 12 },
  thirdRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thirdDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingTop: 12,
  },
  thirdLabel: { width: 80, color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  thirdBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.surfaceAlt,
    overflow: "hidden",
  },
  thirdBarFill: { height: "100%", borderRadius: 5, backgroundColor: palette.primary },
  thirdCount: {
    width: 28,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyText: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  notFound: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  notFoundTitle: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
});
