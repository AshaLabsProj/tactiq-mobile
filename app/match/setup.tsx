import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton, AppCard, IconButton, StatusChip } from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";

function dateAtOffset(days: number): string {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default function MatchSetupScreen() {
  const { data, createMatch, setMatchStatus } = useWorkspace();
  const [opponent, setOpponent] = useState("");
  const [dayOffset, setDayOffset] = useState(0);
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const dateChoices = useMemo(
    () => [
      { label: "Today", offset: 0 },
      { label: "Tomorrow", offset: 1 },
      { label: "Weekend", offset: Math.max(0, (6 - new Date().getDay() + 7) % 7) },
    ],
    [],
  );

  const start = () => {
    if (!team || !opponent.trim()) {
      haptic.error(data.settings.hapticsEnabled);
      return;
    }
    const id = createMatch(team.id, opponent.trim(), dateAtOffset(dayOffset));
    setMatchStatus(id, "live");
    haptic.success(data.settings.hapticsEnabled);
    router.replace({ pathname: "/match/live/[id]", params: { id } });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>MATCH CAPTURE</Text>
          <Text style={styles.title}>Set up match</Text>
        </View>
        <IconButton name="close" accessibilityLabel="Close match setup" onPress={() => router.back()} />
      </View>

      <View style={styles.content}>
        <AppCard tone="green" style={styles.teamCard}>
          <View>
            <Text style={styles.cardLabel}>YOUR TEAM</Text>
            <Text style={styles.teamName}>{team?.name}</Text>
          </View>
          <StatusChip label={team?.ageGroup ?? "Team"} tone="green" />
        </AppCard>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Opponent</Text>
          <TextInput
            autoFocus
            value={opponent}
            onChangeText={setOpponent}
            placeholder="Enter team name"
            placeholderTextColor={palette.muted}
            returnKeyType="done"
            onSubmitEditing={start}
            style={styles.input}
            accessibilityLabel="Opponent team"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>When</Text>
          <View style={styles.dateChoices}>
            {dateChoices.map((choice) => {
              const selected = dayOffset === choice.offset;
              return (
                <Pressable
                  key={choice.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setDayOffset(choice.offset);
                    haptic.selection(data.settings.hapticsEnabled);
                  }}
                  style={({ pressed }) => [
                    styles.dateChoice,
                    selected && styles.dateChoiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.dateLabel, selected && styles.dateLabelSelected]}>{choice.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.datePreview}>
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date(dateAtOffset(dayOffset)))}
          </Text>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Designed for the touchline</Text>
          <Text style={styles.tipBody}>
            Each event takes three taps: pitch zone, outcome, and record. You can undo at any time.
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton label="Start live capture" icon="play-arrow" disabled={!opponent.trim()} onPress={start} />
          <AppButton label="Cancel" variant="quiet" onPress={() => router.back()} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: palette.primary, fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 0.9 },
  title: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.4 },
  content: { flex: 1, paddingHorizontal: 20, gap: 24 },
  teamCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: palette.primaryDark, fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 0.7 },
  teamName: { color: palette.ink, fontSize: 19, lineHeight: 25, fontWeight: "700", marginTop: 3 },
  fieldGroup: { gap: 9 },
  fieldLabel: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  input: { minHeight: 56, borderRadius: 17, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 16, color: palette.ink, fontSize: 17, lineHeight: 22 },
  dateChoices: { flexDirection: "row", gap: 8 },
  dateChoice: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center" },
  dateChoiceSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  dateLabel: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  dateLabelSelected: { color: palette.primaryDark },
  datePreview: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  tipBox: { borderRadius: 18, backgroundColor: palette.surfaceAlt, padding: 16, gap: 5 },
  tipTitle: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  tipBody: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  actions: { marginTop: "auto", paddingBottom: 14, gap: 4 },
  pressed: { opacity: 0.62 },
});
