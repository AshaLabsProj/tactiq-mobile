import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, IconButton } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { latestAssessmentForPlayer } from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { RATING_LABELS, SKILL_LABELS, type Rating, type SkillKey, type SkillRatings } from "@/types/models";

const RATINGS: Rating[] = [1, 2, 3];

function baseline(): SkillRatings { return { ballControl: 2, passing: 2, receiving: 2, dribbling: 2, defending: 2, decisionMaking: 2 }; }

export default function PracticeBatchAssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, addAssessment } = useWorkspace();
  const session = data.practiceSessions.find((item) => item.id === id);
  const players = useMemo(() => data.players.filter((player) => session?.attendeeIds.includes(player.id)), [data.players, session?.attendeeIds]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Partial<Record<SkillKey, Rating>>>>({});
  if (!session || !players.length) return <View style={[styles.root, { paddingTop: insets.top }]}><Text style={styles.error}>Practice session not found.</Text></View>;
  const player = players[activeIndex];
  const initial = latestAssessmentForPlayer(data.assessments, player.id)?.ratings ?? baseline();
  const current = { ...initial, ...ratings[player.id] };
  const completeForPlayer = session.focusSkills.every((skill) => current[skill] !== undefined);
  const completedCount = players.filter((item) => session.focusSkills.every((skill) => ratings[item.id]?.[skill] !== undefined)).length;

  const rate = (skill: SkillKey, rating: Rating) => setRatings((currentRatings) => ({ ...currentRatings, [player.id]: { ...currentRatings[player.id], [skill]: rating } }));
  const saveAndContinue = () => {
    if (!completeForPlayer) return;
    addAssessment(player.id, current, `Practice focus: ${session.focusSkills.map((skill) => SKILL_LABELS[skill]).join(" and ")}.`, { context: "practice", sessionId: session.id });
    if (activeIndex < players.length - 1) setActiveIndex((index) => index + 1); else router.replace({ pathname: "/(tabs)/insights" as never });
  };

  return <View style={[styles.root, { paddingTop: insets.top }]}><View style={styles.header}><IconButton name="close" accessibilityLabel="Close batch assessment" onPress={() => router.back()} variant="ghost" /><View><Text style={styles.headerEyebrow}>PRACTICE ASSESSMENT</Text><Text style={styles.headerTitle}>{completedCount}/{players.length} complete</Text></View><View style={styles.headerSpacer} /></View><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round((activeIndex / players.length) * 100)}%` }]} /></View><View style={styles.playerCard}><View style={[styles.avatar, { backgroundColor: player.accent }]}><Text style={styles.avatarText}>{player.number}</Text></View><View><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerMeta}>{player.position} · {activeIndex + 1} of {players.length}</Text></View></View><View style={styles.focusBanner}><MaterialIcons name="center-focus-strong" size={19} color={palette.primaryDark} /><Text style={styles.focusCopy}>Rate today’s practice focus only. Existing ratings stay in place for the other skills.</Text></View>{session.focusSkills.map((skill) => <View key={skill} style={styles.skillCard}><Text style={styles.skillName}>{SKILL_LABELS[skill]}</Text><View style={styles.ratingRow}>{RATINGS.map((rating) => { const selected = current[skill] === rating; const color = rating === 1 ? "#C75B52" : rating === 2 ? "#A56A00" : "#0F6B50"; return <TouchableOpacity key={rating} accessibilityRole="button" accessibilityState={{ selected }} activeOpacity={0.8} onPress={() => rate(skill, rating)} style={[styles.ratingButton, selected && { backgroundColor: color, borderColor: color }]}><Text style={[styles.ratingValue, selected && styles.ratingValueSelected]}>{rating}</Text><Text style={[styles.ratingLabel, selected && styles.ratingValueSelected]}>{RATING_LABELS[rating]}</Text></TouchableOpacity>; })}</View></View>)}<View style={styles.playerJumpRow}>{players.map((item, index) => <TouchableOpacity key={item.id} accessibilityRole="button" activeOpacity={0.8} onPress={() => setActiveIndex(index)} style={[styles.playerJump, activeIndex === index && styles.playerJumpActive]}><Text style={[styles.playerJumpText, activeIndex === index && styles.playerJumpTextActive]}>{item.number}</Text></TouchableOpacity>)}</View><AppButton label={activeIndex < players.length - 1 ? "Save & next player" : "Finish practice"} onPress={saveAndContinue} variant="primary" size="large" icon={activeIndex < players.length - 1 ? "arrow-forward" : "check"} disabled={!completeForPlayer} /></ScrollView></View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.background }, error: { color: palette.ink, textAlign: "center", marginTop: 50, fontSize: 16, fontWeight: "700" }, header: { minHeight: 58, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerEyebrow: { color: palette.primaryDark, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, headerTitle: { color: palette.ink, fontSize: 15, fontWeight: "800", marginTop: 1 }, headerSpacer: { width: 44 }, content: { padding: spacing.base, gap: spacing.lg }, progressTrack: { height: 5, overflow: "hidden", borderRadius: 3, backgroundColor: palette.border }, progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#168A68" }, playerCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radius.xl, backgroundColor: palette.surface }, avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, playerName: { ...typography.cardTitle, color: palette.ink }, playerMeta: { ...typography.caption, color: palette.muted, marginTop: 3 }, focusBanner: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: spacing.md, borderRadius: radius.lg, backgroundColor: palette.primarySoft }, focusCopy: { flex: 1, color: palette.primaryDark, fontSize: 13, lineHeight: 18, fontWeight: "700" }, skillCard: { gap: spacing.sm }, skillName: { color: palette.ink, fontSize: 18, fontWeight: "900" }, ratingRow: { flexDirection: "row", gap: 8 }, ratingButton: { flex: 1, minHeight: 76, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface }, ratingValue: { color: palette.ink, fontSize: 22, fontWeight: "900" }, ratingLabel: { color: palette.muted, fontSize: 11, fontWeight: "700" }, ratingValueSelected: { color: "#FFFFFF" }, playerJumpRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }, playerJump: { minWidth: 38, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: palette.surfaceAlt }, playerJumpActive: { backgroundColor: "#168A68" }, playerJumpText: { color: palette.inkMid, fontSize: 13, fontWeight: "900" }, playerJumpTextActive: { color: "#FFFFFF" } });
