/**
 * Home — "Two Doors" entry point
 * App name: Skilltracker
 *
 * Two cards fill the available screen height between the header and tab bar.
 * Uses useWindowDimensions + useSafeAreaInsets to compute explicit height
 * instead of relying on flex inheritance through the Expo Router tab shell.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/mobile/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";

const HEADER_HEIGHT = 56;   // wordmark row
const TAB_BAR_HEIGHT = 80;  // approximate tab bar + home indicator

// ── Door card ────────────────────────────────────────────────────────────────
interface DoorProps {
  mode: "match" | "develop";
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  badgePulse?: boolean;
  hint: string;
  cardHeight: number;
  onPress: () => void;
}

function Door({ mode, title, subtitle, icon, badge, badgePulse, hint, cardHeight, onPress }: DoorProps) {
  const isMatch = mode === "match";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.door,
        { height: cardHeight },
        pressed && styles.doorPressed,
      ]}
    >
      <View style={[styles.doorInner, isMatch ? styles.doorMatch : styles.doorDevelop]}>
        {/* Top row: icon + badge */}
        <View style={styles.doorTopRow}>
          <View style={[styles.iconCircle, isMatch ? styles.iconCircleMatch : styles.iconCircleDevelop]}>
            <MaterialIcons
              name={icon as any}
              size={32}
              color={isMatch ? "#FFFFFF" : palette.primaryDark}
            />
          </View>
          {badge ? (
            <View style={[styles.badge, isMatch ? styles.badgeMatch : styles.badgeDevelop]}>
              {badgePulse && (
                <View style={[styles.pulseDot, isMatch ? styles.pulseDotMatch : styles.pulseDotDevelop]} />
              )}
              <Text style={[styles.badgeText, isMatch ? styles.badgeTextMatch : styles.badgeTextDevelop]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Main text */}
        <View style={styles.doorTextBlock}>
          <Text style={[styles.doorTitle, isMatch ? styles.doorTitleMatch : styles.doorTitleDevelop]}>
            {title}
          </Text>
          <Text style={[styles.doorSubtitle, isMatch ? styles.doorSubtitleMatch : styles.doorSubtitleDevelop]}>
            {subtitle}
          </Text>
        </View>

        {/* Hint row at bottom */}
        <View style={[styles.hintRow, isMatch ? styles.hintRowMatch : styles.hintRowDevelop]}>
          <Text style={[styles.hintText, isMatch ? styles.hintTextMatch : styles.hintTextDevelop]}>
            {hint}
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={16}
            color={isMatch ? "rgba(255,255,255,0.55)" : palette.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { data } = useWorkspace();
  const hapticsEnabled = data.settings.hapticsEnabled;
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Available height = screen - status bar - safe area top - header - tab bar - safe area bottom
  const availableHeight =
    screenHeight - insets.top - insets.bottom - HEADER_HEIGHT - TAB_BAR_HEIGHT;
  const cardHeight = Math.floor((availableHeight - 12) / 2); // 12 = gap between cards

  const activeMatch = data.matches.find(
    (m) => m.status === "live" || m.status === "paused",
  );

  const totalPlayers = data.players?.length ?? 0;
  const assessedThisWeek = (() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recentIds = new Set(
      data.assessments
        .filter((a) => new Date(a.createdAt) >= cutoff)
        .map((a) => a.playerId),
    );
    return recentIds.size;
  })();
  const needsAssessment = Math.max(0, totalPlayers - assessedThisWeek);

  const goMatch = () => {
    haptic.medium(hapticsEnabled);
    if (activeMatch) {
      router.push({ pathname: "/match/live/[id]", params: { id: activeMatch.id } });
    } else {
      router.push("/match/setup");
    }
  };

  const goDevelop = () => {
    haptic.medium(hapticsEnabled);
    router.push("/(tabs)/squad");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Skilltracker</Text>
        <IconButton
          name="settings"
          accessibilityLabel="Open settings"
          onPress={() => {
            haptic.light(hapticsEnabled);
            router.push("/settings");
          }}
        />
      </View>

      {/* Two doors */}
      <View style={styles.doorsContainer}>
        <Door
          mode="match"
          title="Match Day"
          subtitle="Tactics, events & formations"
          icon="sports-soccer"
          badge={
            activeMatch
              ? activeMatch.status === "live"
                ? "Live now"
                : "Paused"
              : undefined
          }
          badgePulse={activeMatch?.status === "live"}
          hint={activeMatch ? "Continue your match" : "Set up or start a match"}
          cardHeight={cardHeight}
          onPress={goMatch}
        />
        <Door
          mode="develop"
          title="Player Development"
          subtitle="Assess skills & track growth"
          icon="person-search"
          badge={
            needsAssessment > 0
              ? `${needsAssessment} player${needsAssessment === 1 ? "" : "s"} due`
              : totalPlayers === 0
              ? "Add players"
              : undefined
          }
          hint={
            totalPlayers === 0
              ? "Add your first player"
              : needsAssessment > 0
              ? "Assess a player now"
              : "All players assessed this week"
          }
          cardHeight={cardHeight}
          onPress={goDevelop}
        />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  wordmark: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  doorsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  door: {
    borderRadius: 24,
    overflow: "hidden",
  },
  doorInner: {
    flex: 1,
    borderRadius: 24,
    padding: 28,
    justifyContent: "space-between",
  },
  doorMatch: {
    backgroundColor: "#0D2137",
  },
  doorDevelop: {
    backgroundColor: palette.primarySoft,
    borderWidth: 1.5,
    borderColor: palette.sage,
  },
  doorPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.982 }],
  },
  doorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleMatch: {
    backgroundColor: "#1A3A5C",
  },
  iconCircleDevelop: {
    backgroundColor: palette.sage,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeMatch: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  badgeDevelop: {
    backgroundColor: palette.sage,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pulseDotMatch: {
    backgroundColor: "#4ADE80",
  },
  pulseDotDevelop: {
    backgroundColor: palette.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgeTextMatch: {
    color: "#FFFFFF",
  },
  badgeTextDevelop: {
    color: palette.primaryDark,
  },
  doorTextBlock: {
    gap: 8,
  },
  doorTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  doorTitleMatch: {
    color: "#FFFFFF",
  },
  doorTitleDevelop: {
    color: palette.primaryDark,
  },
  doorSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  doorSubtitleMatch: {
    color: "rgba(255,255,255,0.6)",
  },
  doorSubtitleDevelop: {
    color: palette.primary,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  hintRowMatch: {
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  hintRowDevelop: {
    borderTopColor: palette.border,
  },
  hintText: {
    fontSize: 14,
    fontWeight: "600",
  },
  hintTextMatch: {
    color: "rgba(255,255,255,0.55)",
  },
  hintTextDevelop: {
    color: palette.primary,
  },
});
