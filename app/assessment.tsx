import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  AppButton,
  IconButton,
  PlayerAvatar,
  StatusChip,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import {
  RATING_LABELS,
  SKILL_LABELS,
  type Rating,
  type SkillKey,
  type SkillRatings,
} from "@/types/models";

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[];
const DEFAULT_RATINGS = SKILL_KEYS.reduce(
  (result, key) => ({ ...result, [key]: 2 }),
  {} as SkillRatings,
);

export default function AssessmentScreen() {
  const params = useLocalSearchParams<{ playerId?: string }>();
  const { data, addAssessment } = useWorkspace();
  const [selectedPlayerId, setSelectedPlayerId] = useState(params.playerId ?? "");
  const [ratings, setRatings] = useState<SkillRatings>(DEFAULT_RATINGS);
  const [note, setNote] = useState("");
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = useMemo(
    () => data.players.filter((player) => player.teamId === team?.id).sort((a, b) => a.name.localeCompare(b.name)),
    [data.players, team?.id],
  );
  const selectedPlayer = data.players.find((player) => player.id === selectedPlayerId);

  const save = () => {
    if (!selectedPlayerId) {
      haptic.error(data.settings.hapticsEnabled);
      return;
    }
    addAssessment(selectedPlayerId, ratings, note);
    haptic.success(data.settings.hapticsEnabled);
    router.replace({ pathname: "/player/[id]", params: { id: selectedPlayerId } });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>PLAYER DEVELOPMENT</Text>
          <Text style={styles.title}>New assessment</Text>
        </View>
        <IconButton name="close" accessibilityLabel="Close assessment" onPress={() => router.back()} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Choose player</Text>
            {selectedPlayer ? <StatusChip label={`#${selectedPlayer.number}`} tone="green" /> : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerPicker}>
            {players.map((player) => {
              const selected = player.id === selectedPlayerId;
              return (
                <Pressable
                  key={player.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSelectedPlayerId(player.id);
                    haptic.selection(data.settings.hapticsEnabled);
                  }}
                  style={({ pressed }) => [
                    styles.playerChoice,
                    selected && styles.playerChoiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <PlayerAvatar name={player.name} accent={player.accent} size={42} />
                  <Text numberOfLines={1} style={[styles.playerChoiceName, selected && styles.playerChoiceNameSelected]}>
                    {player.name.split(" ")[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View>
            <Text style={styles.sectionTitle}>Skill ratings</Text>
            <Text style={styles.sectionBody}>Start at Secure, then adjust only what you observed.</Text>
          </View>

          <View style={styles.ratingList}>
            {SKILL_KEYS.map((skill, index) => (
              <View key={skill} style={[styles.ratingRow, index > 0 && styles.divider]}>
                <View style={styles.skillHeadingRow}>
                  <Text style={styles.skillName}>{SKILL_LABELS[skill]}</Text>
                  <Text style={styles.ratingLabel}>{RATING_LABELS[ratings[skill]]}</Text>
                </View>
                <View style={styles.ratingControl}>
                  {([1, 2, 3] as Rating[]).map((rating) => {
                    const selected = ratings[skill] === rating;
                    return (
                      <Pressable
                        key={rating}
                        accessibilityRole="radio"
                        accessibilityLabel={`${SKILL_LABELS[skill]}: ${RATING_LABELS[rating]}`}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setRatings((current) => ({ ...current, [skill]: rating }));
                          haptic.selection(data.settings.hapticsEnabled);
                        }}
                        style={({ pressed }) => [
                          styles.ratingOption,
                          selected && styles.ratingOptionSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.ratingNumber, selected && styles.ratingNumberSelected]}>{rating}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaching note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What should the player repeat or improve next?"
            placeholderTextColor={palette.muted}
            multiline
            maxLength={280}
            textAlignVertical="top"
            style={styles.noteInput}
            accessibilityLabel="Coaching note"
          />
          <Text style={styles.characterCount}>{note.length}/280</Text>
        </View>

        <AppButton
          label={selectedPlayer ? `Save for ${selectedPlayer.name.split(" ")[0]}` : "Choose a player to save"}
          icon="check"
          disabled={!selectedPlayer}
          onPress={save}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topCopy: { flex: 1 },
  eyebrow: { color: palette.primary, fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 0.9 },
  title: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.4 },
  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 24 },
  section: { gap: 12 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: "700" },
  sectionBody: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  playerPicker: { gap: 10, paddingRight: 20 },
  playerChoice: { width: 76, minHeight: 80, borderRadius: 17, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, alignItems: "center", justifyContent: "center", gap: 6 },
  playerChoiceSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  playerChoiceName: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: "600", maxWidth: 64 },
  playerChoiceNameSelected: { color: palette.primaryDark, fontWeight: "700" },
  ratingList: { backgroundColor: palette.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, paddingHorizontal: 16 },
  ratingRow: { minHeight: 86, justifyContent: "center", gap: 7, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  skillHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  skillName: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  ratingControl: { flexDirection: "row", gap: 8 },
  ratingOption: { flex: 1, minHeight: 38, borderRadius: 12, backgroundColor: palette.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  ratingOptionSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  ratingNumber: { color: palette.muted, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  ratingNumberSelected: { color: palette.primaryDark },
  ratingLabel: { color: palette.primaryDark, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  noteInput: { minHeight: 118, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingHorizontal: 15, paddingVertical: 13, color: palette.ink, fontSize: 15, lineHeight: 21 },
  characterCount: { color: palette.muted, fontSize: 11, lineHeight: 15, textAlign: "right", marginTop: -6 },
  pressed: { opacity: 0.62 },
});
