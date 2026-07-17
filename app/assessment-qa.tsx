/**
 * assessment-qa.tsx
 *
 * Guided Q&A assessment flow — Airbnb/Uber-style one-question-at-a-time UX.
 *
 * Flow:
 *   Step 0  — Player selection (full-screen card)
 *   Steps 1–6 — One skill per screen with a plain-English question + 3 large answer cards
 *   Step 7  — Optional coaching note (keyboard-aware)
 *   Step 8  — Confirmation summary before saving
 *
 * Animations: horizontal slide via Animated.Value (no external dep beyond reanimated).
 * Progress: dot indicators at top.
 */

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
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

import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import type { Rating, SkillKey } from "@/types/models";
import { RATING_LABELS, SKILL_LABELS } from "@/types/models";

// ─── Skill questions ────────────────────────────────────────────────────────

const SKILL_QUESTIONS: Record<SkillKey, { question: string; context: string }> = {
  ballControl: {
    question: "How well did they control the ball?",
    context: "Think about first touch, trapping, and keeping the ball close under pressure.",
  },
  passing: {
    question: "How accurate and purposeful was their passing?",
    context: "Consider weight, direction, and decision-making when distributing the ball.",
  },
  receiving: {
    question: "How did they receive the ball into feet?",
    context: "Look at body shape, scanning before the ball arrives, and first touch quality.",
  },
  dribbling: {
    question: "How effective were they when running with the ball?",
    context: "Consider change of pace, change of direction, and ability to beat a defender.",
  },
  defending: {
    question: "How well did they defend?",
    context: "Think about positioning, pressure, recovery runs, and winning the ball back.",
  },
  decisionMaking: {
    question: "How good were their decisions on the ball?",
    context: "Consider when to pass, dribble, or shoot — and whether the choice was right.",
  },
};

const SKILL_ORDER: SkillKey[] = [
  "ballControl",
  "passing",
  "receiving",
  "dribbling",
  "defending",
  "decisionMaking",
];

const ANSWER_OPTIONS: { rating: Rating; label: string; description: string; icon: string; color: string; bg: string }[] = [
  {
    rating: 1,
    label: "Developing",
    description: "Struggled or inconsistent — needs focused work here.",
    icon: "trending-flat",
    color: palette.coral,
    bg: "rgba(255,100,80,0.09)",
  },
  {
    rating: 2,
    label: "Secure",
    description: "Solid and reliable — performing at the expected level.",
    icon: "trending-up",
    color: palette.amber,
    bg: "rgba(255,175,50,0.09)",
  },
  {
    rating: 3,
    label: "Strong",
    description: "Stood out — consistently above expectations today.",
    icon: "star",
    color: palette.primary,
    bg: palette.primarySoft,
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type PartialRatings = Partial<Record<SkillKey, Rating>>;

const TOTAL_STEPS = SKILL_ORDER.length + 2; // player + 6 skills + note
const SKILL_STEP_START = 1;
const NOTE_STEP = SKILL_ORDER.length + 1;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AssessmentQAScreen() {
  const { data, addAssessment } = useWorkspace();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = data.settings.hapticsEnabled;

  const [step, setStep] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<PartialRatings>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const noteRef = useRef<TextInput>(null);

  const team = data.teams[0];
  const players = team
    ? data.players.filter((p) => team.playerIds.includes(p.id))
    : data.players;

  // ── Navigation ──────────────────────────────────────────────────────────

  const animateToNext = (direction: "forward" | "back") => {
    const toValue = direction === "forward" ? -1 : 1;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goNext = () => {
    haptic.light(hapticsEnabled);
    animateToNext("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    haptic.light(hapticsEnabled);
    animateToNext("back");
    setStep((s) => s - 1);
  };

  const handlePlayerSelect = (id: string) => {
    haptic.light(hapticsEnabled);
    setSelectedPlayerId(id);
    setTimeout(goNext, 220);
  };

  const handleRatingSelect = (skill: SkillKey, rating: Rating) => {
    haptic.medium(hapticsEnabled);
    setRatings((r) => ({ ...r, [skill]: rating }));
    setTimeout(goNext, 280);
  };

  const handleSave = async () => {
    if (!selectedPlayerId) return;
    const fullRatings = {
      ballControl: ratings.ballControl ?? 2,
      passing: ratings.passing ?? 2,
      receiving: ratings.receiving ?? 2,
      dribbling: ratings.dribbling ?? 2,
      defending: ratings.defending ?? 2,
      decisionMaking: ratings.decisionMaking ?? 2,
    };
    setSaving(true);
    haptic.success(hapticsEnabled);
    addAssessment(selectedPlayerId, fullRatings, note.trim());
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 400);
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  const currentSkillIndex = step - SKILL_STEP_START; // 0–5 when in skill steps
  const currentSkill = SKILL_ORDER[currentSkillIndex] ?? null;
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const completedSkills = SKILL_ORDER.filter((k) => ratings[k] !== undefined).length;

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-24, 0, 24],
  });

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderProgressDots = () => (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );

  const renderPlayerStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEyebrow}>STEP 1 OF {TOTAL_STEPS}</Text>
      <Text style={styles.stepQuestion}>Who are you assessing today?</Text>
      <Text style={styles.stepContext}>Select a player from your squad to get started.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playerRow}
      >
        {players.map((p) => {
          const selected = selectedPlayerId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => handlePlayerSelect(p.id)}
              style={({ pressed }) => [
                styles.playerCard,
                selected && styles.playerCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.playerAvatar, selected && styles.playerAvatarSelected]}>
                <Text style={[styles.playerInitial, selected && styles.playerInitialSelected]}>
                  {p.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.playerName, selected && styles.playerNameSelected]} numberOfLines={2}>
                {p.name.split(" ")[0]}
              </Text>
              <Text style={styles.playerNumber}>#{p.number}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSkillStep = (skill: SkillKey) => {
    const { question, context } = SKILL_QUESTIONS[skill];
    const currentRating = ratings[skill];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepEyebrow}>
          {selectedPlayer?.name.split(" ")[0].toUpperCase()} · {SKILL_LABELS[skill].toUpperCase()}
        </Text>
        <Text style={styles.stepQuestion}>{question}</Text>
        <Text style={styles.stepContext}>{context}</Text>

        <View style={styles.answerStack}>
          {ANSWER_OPTIONS.map((opt) => {
            const chosen = currentRating === opt.rating;
            return (
              <Pressable
                key={opt.rating}
                onPress={() => handleRatingSelect(skill, opt.rating)}
                style={({ pressed }) => [
                  styles.answerCard,
                  { backgroundColor: chosen ? opt.bg : palette.surface },
                  chosen && { borderColor: opt.color, borderWidth: 2 },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.answerIconWrap, { backgroundColor: opt.bg }]}>
                  <MaterialIcons
                    name={opt.icon as any}
                    size={22}
                    color={opt.color}
                  />
                </View>
                <View style={styles.answerCopy}>
                  <Text style={[styles.answerLabel, { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.answerDesc}>{opt.description}</Text>
                </View>
                {chosen && (
                  <MaterialIcons name="check-circle" size={22} color={opt.color} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNoteStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.stepContent}
      keyboardVerticalOffset={insets.top + 60}
    >
      <Text style={styles.stepEyebrow}>FINAL STEP</Text>
      <Text style={styles.stepQuestion}>Any coaching notes for {selectedPlayer?.name.split(" ")[0]}?</Text>
      <Text style={styles.stepContext}>
        One specific, actionable observation. This is what the player and parent will see.
      </Text>
      <TextInput
        ref={noteRef}
        style={styles.noteInput}
        placeholder="e.g. Great pressing today — keep your shape when the ball goes wide."
        placeholderTextColor={palette.muted}
        multiline
        maxLength={280}
        value={note}
        onChangeText={setNote}
        autoFocus
      />
      <Text style={styles.charCount}>{note.length}/280</Text>

      <Pressable
        onPress={goNext}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.primaryBtnText}>
          {note.trim() ? "Save note & review" : "Skip & review"}
        </Text>
        <MaterialIcons name="arrow-forward" size={20} color={palette.white} />
      </Pressable>
    </KeyboardAvoidingView>
  );

  const renderSummaryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEyebrow}>REVIEW</Text>
      <Text style={styles.stepQuestion}>
        Assessment for {selectedPlayer?.name.split(" ")[0]}
      </Text>
      <Text style={styles.stepContext}>
        Tap Save to record this assessment. You can always edit it from the player profile.
      </Text>

      <View style={styles.summaryCard}>
        {SKILL_ORDER.map((skill, i) => {
          const r = ratings[skill] ?? 2;
          const opt = ANSWER_OPTIONS.find((o) => o.rating === r)!;
          return (
            <View key={skill} style={[styles.summaryRow, i > 0 && styles.summaryDivider]}>
              <Text style={styles.summarySkill}>{SKILL_LABELS[skill]}</Text>
              <View style={[styles.summaryBadge, { backgroundColor: opt.bg }]}>
                <Text style={[styles.summaryBadgeText, { color: opt.color }]}>
                  {RATING_LABELS[r]}
                </Text>
              </View>
            </View>
          );
        })}
        {note.trim() ? (
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryNote}>"{note.trim()}"</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, (pressed || saving) && styles.pressed]}
      >
        <MaterialIcons name="check" size={22} color={palette.white} />
        <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save assessment"}</Text>
      </Pressable>
    </View>
  );

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={palette.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          {renderProgressDots()}
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <MaterialIcons name="close" size={22} color={palette.muted} />
        </Pressable>
      </View>

      {/* Skill progress bar (steps 1–6) */}
      {step >= SKILL_STEP_START && step <= NOTE_STEP - 1 && (
        <View style={styles.skillBar}>
          <View
            style={[
              styles.skillBarFill,
              { width: `${(completedSkills / SKILL_ORDER.length) * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Animated content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: 1, transform: [{ translateX }] }}>
          {step === 0 && renderPlayerStep()}
          {step >= SKILL_STEP_START && currentSkill && renderSkillStep(currentSkill)}
          {step === NOTE_STEP && renderNoteStep()}
          {step === NOTE_STEP + 1 && renderSummaryStep()}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  dots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
  },
  dotDone: { backgroundColor: palette.sage },
  skillBar: {
    height: 3,
    backgroundColor: palette.border,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  skillBarFill: {
    height: 3,
    backgroundColor: palette.primary,
    borderRadius: 2,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  stepContent: { paddingTop: 16, gap: 16 },
  stepEyebrow: {
    color: palette.primary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  stepQuestion: {
    color: palette.ink,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  stepContext: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -6,
  },
  // Player selection
  playerRow: { gap: 10, paddingVertical: 4 },
  playerCard: {
    width: 88,
    minHeight: 100,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
  },
  playerCardSelected: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarSelected: { backgroundColor: palette.primary },
  playerInitial: {
    color: palette.muted,
    fontSize: 18,
    fontWeight: "800",
  },
  playerInitialSelected: { color: palette.white },
  playerName: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  playerNameSelected: { color: palette.primaryDark },
  playerNumber: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  // Answer cards
  answerStack: { gap: 12, marginTop: 4 },
  answerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: palette.surface,
  },
  answerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  answerCopy: { flex: 1, gap: 2 },
  answerLabel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  answerDesc: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  // Note step
  noteInput: {
    minHeight: 130,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  charCount: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "right",
    marginTop: -8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
  },
  // Summary
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  summarySkill: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  summaryBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  summaryNote: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
    flex: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
  },
  saveBtnText: {
    color: palette.white,
    fontSize: 17,
    fontWeight: "800",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
