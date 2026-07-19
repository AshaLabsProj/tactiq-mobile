/**
 * Match Day Hub
 *
 * Reached by tapping the "Match Day" door on the home screen.
 * Shows: active match banner (if any), quick-start CTA, and recent match history.
 * Full navy identity — distinct from the green Player Development world.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, AppCard, IconButton, SectionHeader, mobileStyles } from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

function ScoreBadge({ scoreFor, scoreAgainst }: { scoreFor?: number; scoreAgainst?: number }) {
  if (scoreFor === undefined || scoreAgainst === undefined) return null;
  const won = scoreFor > scoreAgainst;
  const drew = scoreFor === scoreAgainst;
  return (
    <View style={[scoreBadgeStyles.wrap, won ? scoreBadgeStyles.win : drew ? scoreBadgeStyles.draw : scoreBadgeStyles.loss]}>
      <Text style={scoreBadgeStyles.text}>
        {scoreFor}–{scoreAgainst}
      </Text>
    </View>
  );
}

const scoreBadgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  win: { backgroundColor: "#1A4D2E" },
  draw: { backgroundColor: palette.navyMid },
  loss: { backgroundColor: "#4D1A1A" },
  text: { color: palette.white, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
});

export default function MatchDayHub() {
  const { data } = useWorkspace();
  const hapticsEnabled = data.settings.hapticsEnabled;

  const activeMatch = data.matches.find((m) => m.status === "live" || m.status === "paused");
  const completedMatches = [...data.matches]
    .filter((m) => m.status === "completed")
    .sort((a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate))
    .slice(0, 8);

  const startMatch = () => {
    haptic.medium(hapticsEnabled);
    router.push("/match/setup");
  };

  const openActive = () => {
    if (!activeMatch) return;
    haptic.medium(hapticsEnabled);
    router.push({ pathname: "/match/live/[id]", params: { id: activeMatch.id } });
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic.light(hapticsEnabled);
              router.back();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons name="arrow-back" size={22} color={palette.white} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>MATCH DAY</Text>
            <Text style={styles.headerTitle}>Tactics & Events</Text>
          </View>
          <IconButton
            name="settings"
            accessibilityLabel="Settings"
            onPress={() => {
              haptic.light(hapticsEnabled);
              router.push("/settings");
            }}
          />
        </View>

        {/* Active match banner */}
        {activeMatch ? (
          <Pressable
            accessibilityRole="button"
            onPress={openActive}
            style={({ pressed }) => [styles.activeBanner, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.liveDot} />
              <View>
                <Text style={styles.activeBannerLabel}>
                  {activeMatch.status === "live" ? "Live match" : "Match paused"}
                </Text>
                <Text style={styles.activeBannerOpponent}>vs {activeMatch.opponent}</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={22} color={palette.white} />
          </Pressable>
        ) : (
          /* Start new match CTA */
          <View style={styles.ctaCard}>
            <View style={styles.ctaIcon}>
              <MaterialIcons name="sports-soccer" size={28} color={palette.white} />
            </View>
            <View style={styles.ctaCopy}>
              <Text style={styles.ctaTitle}>Ready to kick off?</Text>
              <Text style={styles.ctaBody}>Set up a new match and start logging events live on the pitch.</Text>
            </View>
            <AppButton
              label="Start match"
              icon="arrow-forward"
              variant="primary"
              onPress={startMatch}
              fullWidth={false}
            />
          </View>
        )}

        {/* Match history */}
        <SectionHeader
          title="Match history"
          actionLabel={completedMatches.length > 0 ? "See all" : undefined}
          onAction={completedMatches.length > 0 ? () => {} : undefined}
        />

        {completedMatches.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <MaterialIcons name="sports-score" size={32} color={palette.muted} />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyBody}>Completed matches will appear here with stats and event replays.</Text>
          </AppCard>
        ) : (
          <AppCard style={styles.historyCard}>
            {completedMatches.map((match, index) => (
              <Pressable
                key={match.id}
                accessibilityRole="button"
                onPress={() => {
                  haptic.light(hapticsEnabled);
                  router.push({ pathname: "/match/summary/[id]", params: { id: match.id } });
                }}
                style={({ pressed }) => [
                  styles.matchRow,
                  index > 0 && styles.matchDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.matchLeft}>
                  <Text style={styles.matchOpponent}>vs {match.opponent}</Text>
                  <Text style={styles.matchDate}>{formatDate(match.matchDate)}</Text>
                </View>
                <View style={styles.matchRight}>
                  <ScoreBadge scoreFor={match.scoreFor} scoreAgainst={match.scoreAgainst} />
                  <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
                </View>
              </Pressable>
            ))}
          </AppCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.navy, flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerEyebrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  activeBanner: {
    backgroundColor: palette.navyMid,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.navyBorder,
    marginBottom: 4,
  },
  activeBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
  },
  activeBannerLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },
  activeBannerOpponent: { color: palette.white, fontSize: 18, fontWeight: "700", marginTop: 2 },
  ctaCard: {
    backgroundColor: palette.navyMid,
    borderRadius: 16,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.navyBorder,
    marginBottom: 4,
  },
  ctaIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaCopy: { gap: 4 },
  ctaTitle: { color: palette.white, fontSize: 18, fontWeight: "700" },
  ctaBody: { color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 20 },
  ctaBtn: { alignSelf: "flex-start" },
  historyCard: { paddingVertical: 2 },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 64,
  },
  matchDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  matchLeft: { gap: 3 },
  matchOpponent: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  matchDate: { color: palette.muted, fontSize: 12 },
  matchRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: "700" },
  emptyBody: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  pressed: { opacity: 0.62 },
});
