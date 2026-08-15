import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, IconButton } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { SKILL_KEYS, SKILL_LABELS, type SkillKey } from "@/types/models";

const MAX_FOCUS_SKILLS = 2;

export default function NewPracticeScreen() {
  const insets = useSafeAreaInsets();
  const { data, createPracticeSession, saveFocusGoal } = useWorkspace();
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = useMemo(() => data.players.filter((player) => player.teamId === team?.id), [data.players, team?.id]);
  const [focusSkills, setFocusSkills] = useState<SkillKey[]>(["ballControl"]);
  const [attendeeIds, setAttendeeIds] = useState<string[]>(players.map((player) => player.id));
  const [note, setNote] = useState("");

  const toggleSkill = (skill: SkillKey) => {
    setFocusSkills((current) => {
      if (current.includes(skill)) return current.filter((item) => item !== skill);
      if (current.length >= MAX_FOCUS_SKILLS) return current;
      return [...current, skill];
    });
  };

  const togglePlayer = (playerId: string) => setAttendeeIds((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]);
  const canContinue = Boolean(team) && focusSkills.length > 0 && attendeeIds.length > 0;

  const continueToAssess = () => {
    if (!team || !canContinue) return;
    const sessionId = createPracticeSession({ teamId: team.id, date: new Date().toISOString(), focusSkills, attendeeIds, note: note.trim() });
    focusSkills.forEach((skill) => saveFocusGoal({ teamId: team.id, skill, note: note.trim() || `Practice focus: ${SKILL_LABELS[skill]}.`, setAt: new Date().toISOString(), status: "active" }));
    router.replace({ pathname: "/practice/[id]/assess" as never, params: { id: sessionId } });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}><IconButton name="close" accessibilityLabel="Cancel practice session" onPress={() => router.back()} variant="ghost" /><Text style={styles.headerTitle}>Log practice</Text><View style={styles.headerSpacer} /></View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        {team ? <View style={styles.teamCard}><View style={styles.teamIcon}><MaterialIcons name="groups" size={21} color="#FFFFFF" /></View><View><Text style={styles.teamLabel}>PRACTICE · TODAY</Text><Text style={styles.teamName}>{team.name}</Text></View></View> : null}
        <View style={styles.section}><Text style={styles.sectionTitle}>What did you work on?</Text><Text style={styles.sectionCopy}>Choose one or two skills. These guide the batch assessment and practice-to-pitch comparison.</Text><View style={styles.skillGrid}>{SKILL_KEYS.map((skill) => { const selected = focusSkills.includes(skill); return <TouchableOpacity key={skill} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} activeOpacity={0.8} onPress={() => toggleSkill(skill)} style={[styles.skillChip, selected && styles.skillChipSelected]}><MaterialIcons name={selected ? "check-circle" : "radio-button-unchecked"} size={18} color={selected ? "#FFFFFF" : palette.primaryDark} /><Text style={[styles.skillChipText, selected && styles.skillChipTextSelected]}>{SKILL_LABELS[skill]}</Text></TouchableOpacity>; })}</View><Text style={styles.selectionHint}>{focusSkills.length}/{MAX_FOCUS_SKILLS} selected</Text></View>
        <View style={styles.section}><View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Who attended?</Text><Text style={styles.sectionCopy}>Select the players available today.</Text></View><TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={() => setAttendeeIds(attendeeIds.length === players.length ? [] : players.map((player) => player.id))} style={styles.selectAll}><Text style={styles.selectAllText}>{attendeeIds.length === players.length ? "Clear" : "All"}</Text></TouchableOpacity></View><View style={styles.playerGrid}>{players.map((player) => { const selected = attendeeIds.includes(player.id); return <TouchableOpacity key={player.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} activeOpacity={0.8} onPress={() => togglePlayer(player.id)} style={[styles.playerChip, selected && styles.playerChipSelected]}><View style={[styles.avatar, { backgroundColor: selected ? "rgba(255,255,255,0.24)" : player.accent }]}><Text style={styles.avatarText}>{player.number}</Text></View><Text numberOfLines={1} style={[styles.playerChipText, selected && styles.playerChipTextSelected]}>{player.name.split(" ")[0]}</Text></TouchableOpacity>; })}</View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Coach note <Text style={styles.optional}>optional</Text></Text><TextInput value={note} onChangeText={setNote} multiline placeholder="e.g. First touch away from pressure; find the next pass." placeholderTextColor={palette.faint} style={styles.noteInput} /><Text style={styles.voiceHint}><MaterialIcons name="keyboard-voice" size={14} color={palette.primaryDark} /> Use your keyboard’s dictation for a quick voice note.</Text></View>
        <AppButton label="Assess the group" onPress={continueToAssess} variant="primary" size="large" icon="fact-check" disabled={!canContinue} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background }, header: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm }, headerTitle: { ...typography.bodyMed, color: palette.ink }, headerSpacer: { width: 44 }, content: { padding: spacing.base, gap: spacing.xl }, teamCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radius.xl, backgroundColor: palette.primaryDark }, teamIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" }, teamLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: 1, fontWeight: "900" }, teamName: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 2 }, section: { gap: spacing.sm }, sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }, sectionTitle: { ...typography.cardTitle, color: palette.ink }, optional: { color: palette.muted, fontSize: 13, fontWeight: "600" }, sectionCopy: { ...typography.caption, color: palette.muted, lineHeight: 18 }, skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, skillChip: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, borderRadius: radius.full, borderWidth: 1, borderColor: "#A7E7D3", backgroundColor: palette.primarySoft }, skillChipSelected: { backgroundColor: "#168A68", borderColor: "#168A68" }, skillChipText: { color: palette.primaryDark, fontSize: 13, fontWeight: "800" }, skillChipTextSelected: { color: "#FFFFFF" }, selectionHint: { color: palette.muted, fontSize: 12, fontWeight: "700" }, selectAll: { minHeight: 40, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: palette.primarySoft }, selectAllText: { color: palette.primaryDark, fontSize: 12, fontWeight: "900" }, playerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, playerChip: { width: "30.9%", minHeight: 62, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 8, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }, playerChipSelected: { borderColor: "#168A68", backgroundColor: "#168A68" }, avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, playerChipText: { flex: 1, color: palette.ink, fontSize: 12, fontWeight: "800" }, playerChipTextSelected: { color: "#FFFFFF" }, noteInput: { minHeight: 94, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, color: palette.ink, ...typography.body, textAlignVertical: "top" }, voiceHint: { flexDirection: "row", alignItems: "center", gap: 4, color: palette.primaryDark, fontSize: 12, lineHeight: 18, fontWeight: "700" },
});
