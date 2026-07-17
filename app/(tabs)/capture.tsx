import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppCard, PageHeader, StatusChip, mobileStyles } from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";

export default function CaptureScreen() {
  const { data } = useWorkspace();
  const hapticsEnabled = data.settings.hapticsEnabled;
  const activeMatch = data.matches.find((match) => match.status === "live" || match.status === "paused");

  const choose = (target: "match" | "assessment") => {
    haptic.light(hapticsEnabled);
    if (target === "assessment") {
      router.push("/assessment-qa");
      return;
    }
    if (activeMatch) {
      router.push({ pathname: "/match/live/[id]", params: { id: activeMatch.id } });
      return;
    }
    router.push("/match/setup");
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <PageHeader
          eyebrow="Keep it simple"
          title="Capture"
          subtitle="Choose what you are observing. Everything else stays out of the way."
        />

        {activeMatch ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => choose("match")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppCard tone="amber" style={styles.resumeCard}>
              <View style={styles.resumeTop}>
                <StatusChip label={activeMatch.status === "paused" ? "Paused" : "Live"} tone="amber" />
                <MaterialIcons name="arrow-forward" size={22} color={palette.ink} />
              </View>
              <Text style={styles.resumeTitle}>Resume vs {activeMatch.opponent}</Text>
              <Text style={styles.resumeBody}>Your recorded events are saved on this device.</Text>
            </AppCard>
          </Pressable>
        ) : null}

        <View style={styles.choiceStack}>
          <Pressable
            accessibilityRole="button"
            onPress={() => choose("match")}
            style={({ pressed }) => [styles.choiceCard, styles.matchCard, pressed && styles.choicePressed]}
          >
            <View style={styles.choiceTop}>
              <View style={[styles.choiceIcon, styles.matchIcon]}>
                <MaterialIcons name="sports-soccer" size={28} color={palette.primaryDark} />
              </View>
              <MaterialIcons name="arrow-forward" size={24} color={palette.primaryDark} />
            </View>
            <View style={styles.choiceCopy}>
              <Text style={styles.choiceTitle}>Track a match</Text>
              <Text style={styles.choiceBody}>
                Tap a pitch zone, choose the outcome, and keep watching the game.
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.step}>Zone</Text>
              <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
              <Text style={styles.step}>Outcome</Text>
              <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
              <Text style={styles.step}>Record</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => choose("assessment")}
            style={({ pressed }) => [styles.choiceCard, styles.assessmentCard, pressed && styles.choicePressed]}
          >
            <View style={styles.choiceTop}>
              <View style={[styles.choiceIcon, styles.assessmentIcon]}>
                <MaterialIcons name="fact-check" size={28} color="#8E5A0E" />
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#8E5A0E" />
            </View>
            <View style={styles.choiceCopy}>
              <Text style={styles.choiceTitle}>Assess a player</Text>
              <Text style={styles.choiceBody}>
                Answer six quick questions about today's performance — no numbers, just words.
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.step}>Player</Text>
              <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
              <Text style={styles.step}>Skills</Text>
              <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
              <Text style={styles.step}>Save</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resumeCard: { gap: 8 },
  resumeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resumeTitle: { color: palette.ink, fontSize: 19, lineHeight: 25, fontWeight: "700" },
  resumeBody: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  choiceStack: { gap: 14 },
  choiceCard: {
    minHeight: 245,
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
  },
  matchCard: { backgroundColor: palette.primarySoft, borderColor: palette.sage },
  assessmentCard: { backgroundColor: palette.amberSoft, borderColor: "#EDD5AC" },
  choiceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  choiceIcon: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  matchIcon: { backgroundColor: "rgba(255,255,255,0.68)" },
  assessmentIcon: { backgroundColor: "rgba(255,255,255,0.72)" },
  choiceCopy: { gap: 7 },
  choiceTitle: { color: palette.ink, fontSize: 25, lineHeight: 31, fontWeight: "800", letterSpacing: -0.3 },
  choiceBody: { color: palette.muted, fontSize: 15, lineHeight: 22, maxWidth: 310 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  step: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  choicePressed: { transform: [{ scale: 0.985 }], opacity: 0.86 },
  pressed: { opacity: 0.65 },
});
