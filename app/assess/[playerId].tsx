/**
 * Assessment Flow — redesigned 2026-08-08
 *
 * Single-screen step model:
 * Steps 0–5: one skill per step with 3 large tap targets (Developing/Secure/Strong)
 * Step 6: Coach notes
 * Step 7: Review + Save
 *
 * Target: 30–45 seconds total for one player assessment.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppButton,
  EmptyState,
  IconButton,
  PlayerAvatar,
  SkillBadge,
} from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, ratingBg, ratingColor, ratingLabel, spacing, typography } from "@/lib/palette";
import type { Rating, SkillKey, SkillRatings } from "@/types/models";
import { SKILL_LABELS } from "@/types/models";

const SKILLS = Object.keys(SKILL_LABELS) as SkillKey[];
const TOTAL_STEPS = SKILLS.length + 2; // 6 skills + notes + review

const SKILL_QUESTIONS: Record<SkillKey, string> = {
  ballControl:    "How effectively did [name] control the ball?",
  passing:        "How accurate and well-timed were [name]'s passes?",
  receiving:      "How well did [name] receive the ball under pressure?",
  dribbling:      "How confident was [name] carrying the ball past opponents?",
  defending:      "How effective was [name]'s defending and positioning?",
  decisionMaking: "How well did [name] read the game and make decisions?",
};

const SKILL_CUES: Record<SkillKey, Record<Rating, string>> = {
  ballControl:    { 1: "Loses control frequently", 2: "Comfortable in space, struggles under pressure", 3: "Controls well in tight situations" },
  passing:        { 1: "Inaccurate or poor weight", 2: "Accurate in simple situations", 3: "Varied, well-weighted distribution" },
  receiving:      { 1: "Doesn't scan, poor first touch", 2: "Scans occasionally, decent first touch", 3: "Scans before receiving, sets ball cleanly" },
  dribbling:      { 1: "Loses ball when challenged", 2: "Carries well in space, loses it under pressure", 3: "Changes direction with close control" },
  defending:      { 1: "Poor positioning, commits too early", 2: "Delays well, occasionally out of position", 3: "Strong body position, good recovery runs" },
  decisionMaking: { 1: "Rushes decisions, poor awareness", 2: "Makes correct decision in simple situations", 3: "Reads the game, quick and accurate choices" },
};

const NOTE_PROMPTS = [
  "Received well under pressure...",
  "Needs to scan before receiving...",
  "Strong recovery runs...",
  "Good acceleration into space...",
  "Decision making improved...",
];

const randomPrompt = NOTE_PROMPTS[Math.floor(Math.random() * NOTE_PROMPTS.length)];

export default function AssessScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { data, addAssessment } = useWorkspace();
  const insets = useSafeAreaInsets();

  const player = data.players.find((p) => p.id === playerId);
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<Partial<SkillRatings>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const haptic = (style = Haptics.ImpactFeedbackStyle.Medium) =>
    Haptics.impactAsync(style);

  if (!player) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState icon="person-off" title="Player not found" />
      </View>
    );
  }

  const firstName = player.name.split(" ")[0];
  const isSkillStep = step < SKILLS.length;
  const isNotesStep = step === SKILLS.length;
  const isReviewStep = step === SKILLS.length + 1;
  const currentSkill = isSkillStep ? SKILLS[step] : null;
  const currentRating = currentSkill ? ratings[currentSkill] : undefined;

  const handleRating = (rating: Rating) => {
    haptic();
    if (!currentSkill) return;
    setRatings((prev) => ({ ...prev, [currentSkill]: rating }));
    setTimeout(() => setStep((s) => s + 1), 200);
  };

  const handleSave = () => {
    const complete = SKILLS.every((k) => ratings[k] !== undefined);
    if (!complete) {
      Alert.alert("Incomplete", "Please rate all 6 skills before saving.");
      return;
    }
    setSaving(true);
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    addAssessment(player.id, ratings as SkillRatings, note);
    setTimeout(() => {
      router.replace({ pathname: "/player/[id]", params: { id: player.id } });
    }, 300);
  };

  const progressPct = (step / (TOTAL_STEPS - 1)) * 100;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          name="close"
          accessibilityLabel="Cancel assessment"
          onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          variant="ghost"
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerPlayer}>{firstName}</Text>
          <Text style={styles.headerStep}>
            {isSkillStep ? `${step + 1} of ${SKILLS.length}` : isNotesStep ? "Notes" : "Review"}
          </Text>
        </View>
        {step > 0 ? (
          <IconButton
            name="arrow-back"
            accessibilityLabel="Previous step"
            onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Light); setStep((s) => s - 1); }}
            variant="ghost"
          />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {SKILLS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < step ? styles.dotDone : i === step ? styles.dotActive : styles.dotPending,
            ]}
          />
        ))}
      </View>

      {/* SKILL STEP */}
      {isSkillStep && currentSkill ? (
        <View style={styles.skillCard}>
          <View style={styles.skillCardTop}>
            <Text style={styles.skillCardEyebrow}>{SKILL_LABELS[currentSkill].toUpperCase()}</Text>
            <Text style={styles.skillCardQuestion}>
              {SKILL_QUESTIONS[currentSkill].replace("[name]", firstName)}
            </Text>
          </View>
          <View style={styles.ratingButtons}>
            {([1, 2, 3] as Rating[]).map((r) => {
              const selected = currentRating === r;
              const color = ratingColor(r);
              const bg = ratingBg(r);
              return (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  accessibilityLabel={ratingLabel(r)}
                  onPress={() => handleRating(r)}
                  style={({ pressed }) => [
                    styles.ratingBtn,
                    selected && { backgroundColor: bg, borderColor: color, borderWidth: 2 },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.ratingBtnLeft}>
                    <View style={[styles.ratingIcon, { backgroundColor: bg }]}>
                      <MaterialIcons
                        name={r === 1 ? "trending-up" : r === 2 ? "check-circle" : "star"}
                        size={20}
                        color={color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ratingLabel, { color }]}>{ratingLabel(r)}</Text>
                      <Text style={styles.ratingCue}>{SKILL_CUES[currentSkill][r]}</Text>
                    </View>
                  </View>
                  {selected ? <MaterialIcons name="check-circle" size={22} color={color} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* NOTES STEP */}
      {isNotesStep ? (
        <KeyboardAvoidingView
          style={styles.notesCard}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top + 52}
        >
          <View style={styles.notesTop}>
            <Text style={styles.notesEyebrow}>COACH OBSERVATION</Text>
            <Text style={styles.notesTitle}>Add one specific observation</Text>
            <Text style={styles.notesHint}>Optional — but the most valuable part</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder={randomPrompt}
            placeholderTextColor={palette.faint}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.notesStickyFooter}>
            <AppButton
              label="Continue to Review"
              onPress={() => { haptic(); setStep((s) => s + 1); }}
              variant="primary"
              size="default"
            />
            <AppButton
              label="Skip"
              onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Light); setStep((s) => s + 1); }}
              variant="ghost"
              size="compact"
            />
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {/* REVIEW STEP */}
      {isReviewStep ? (
        <ScrollView
          style={styles.reviewScroll}
          contentContainerStyle={[styles.reviewContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.reviewHeader}>
            <PlayerAvatar name={player.name} accent={player.accent} size="md" />
            <View>
              <Text style={styles.reviewPlayerName}>{player.name}</Text>
              <Text style={styles.reviewDate}>
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
          <View style={styles.reviewSkills}>
            {SKILLS.map((key) => {
              const r = ratings[key];
              if (!r) return null;
              return (
                <View key={key} style={styles.reviewSkillRow}>
                  <Text style={styles.reviewSkillName}>{SKILL_LABELS[key]}</Text>
                  <SkillBadge rating={r as 1 | 2 | 3} />
                </View>
              );
            })}
          </View>
          {note ? (
            <View style={styles.reviewNote}>
              <MaterialIcons name="format-quote" size={16} color={palette.primary} />
              <Text style={styles.reviewNoteText}>{note}</Text>
            </View>
          ) : null}
          <View style={styles.reviewActions}>
            <AppButton
              label={saving ? "Saving…" : "Save Assessment"}
              onPress={handleSave}
              variant="primary"
              size="large"
              disabled={saving}
            />
            <AppButton
              label="Edit"
              onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Light); setStep(0); }}
              variant="secondary"
              size="compact"
            />
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm, height: 52 },
  headerCenter: { alignItems: "center" },
  headerPlayer: { ...typography.bodyMed, color: palette.ink },
  headerStep: { ...typography.caption, color: palette.muted },
  progressTrack: { height: 3, backgroundColor: palette.surfaceAlt, marginHorizontal: spacing.base },
  progressFill: { height: 3, backgroundColor: palette.primary, borderRadius: 2 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: palette.primary },
  dotActive: { backgroundColor: palette.primary, width: 20 },
  dotPending: { backgroundColor: palette.surfaceAlt },
  skillCard: { flex: 1, paddingHorizontal: spacing.base, gap: spacing.lg },
  skillCardTop: { gap: spacing.sm },
  skillCardEyebrow: { ...typography.eyebrow, color: palette.primary },
  skillCardQuestion: { ...typography.displayMd, color: palette.ink, lineHeight: 38 },
  ratingButtons: { gap: spacing.sm },
  ratingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base, minHeight: 88 },
  ratingBtnLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  ratingIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  ratingLabel: { ...typography.cardTitle },
  ratingCue: { ...typography.caption, color: palette.muted, marginTop: 2 },
  notesCard: { flex: 1, paddingHorizontal: spacing.base, gap: spacing.lg },
  notesTop: { gap: spacing.sm },
  notesEyebrow: { ...typography.eyebrow, color: palette.primary },
  notesTitle: { ...typography.displayMd, color: palette.ink },
  notesHint: { ...typography.caption, color: palette.muted },
  notesInput: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base, ...typography.body, color: palette.ink, minHeight: 120 },
  notesStickyFooter: { gap: spacing.sm, paddingBottom: spacing.base },
  reviewScroll: { flex: 1 },
  reviewContent: { paddingHorizontal: spacing.base, gap: spacing.lg },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  reviewPlayerName: { ...typography.sectionHead, color: palette.ink },
  reviewDate: { ...typography.caption, color: palette.muted },
  reviewSkills: { backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, padding: spacing.base, gap: spacing.md },
  reviewSkillRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewSkillName: { ...typography.bodyMed, color: palette.ink },
  reviewNote: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: palette.primarySoft, borderRadius: radius.xl, padding: spacing.base },
  reviewNoteText: { ...typography.body, color: palette.primaryDark, flex: 1, lineHeight: 22, fontStyle: "italic" },
  reviewActions: { gap: spacing.sm },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
});
