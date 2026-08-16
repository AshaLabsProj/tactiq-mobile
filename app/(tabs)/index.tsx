import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssessmentFreshness, DevelopmentDelta, EmptyState, PlayerAvatar, StrengthCard, FocusCard } from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import { assessmentsForPlayer, improvementBetween, latestAssessmentForPlayer, strongestAndFocus, teamSkillAverages } from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { SKILL_LABELS } from "@/types/models";

export default function HomeScreen() {
  const { data } = useWorkspace();
  const insets = useSafeAreaInsets();
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = data.players.filter((player) => player.teamId === team?.id);
  const activeMatch = data.matches.find((match) => match.status === "live" || match.status === "paused");
  const upcomingMatch = data.matches.filter((match) => match.status === "pending").sort((a, b) => Date.parse(a.matchDate) - Date.parse(b.matchDate))[0];
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const stalePlayers = useMemo(() => {
    const cutoff = Date.now() - 14 * 86_400_000;
    return players.filter((player) => {
      const latest = latestAssessmentForPlayer(data.assessments, player.id);
      return !latest || Date.parse(latest.createdAt) < cutoff;
    });
  }, [players, data.assessments]);

  const assessedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    const reviewed = new Set(data.assessments.filter((item) => Date.parse(item.createdAt) >= cutoff).map((item) => item.playerId));
    return players.filter((player) => reviewed.has(player.id)).length;
  }, [players, data.assessments]);

  const teamAverages = useMemo(() => teamSkillAverages(data.assessments), [data.assessments]);
  const { strongest, focus } = useMemo(() => {
    if (Object.values(teamAverages).every((value) => value === 0)) return { strongest: "receiving" as const, focus: "decisionMaking" as const };
    return strongestAndFocus(teamAverages as any);
  }, [teamAverages]);
  const recentAssessments = useMemo(() => [...data.assessments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 2), [data.assessments]);

  const priority = players.length === 0
    ? { label: "GET STARTED", title: "Build your squad", body: "Add your first player, then begin tracking growth.", icon: "person-add" as const, action: "Add player" }
    : stalePlayers.length > 0
      ? { label: "UP NEXT", title: `Review ${stalePlayers.length} player${stalePlayers.length === 1 ? "" : "s"}`, body: "Keep each player’s development picture current.", icon: "fact-check" as const, action: "Open squad" }
      : { label: "UP TO DATE", title: "Your squad is reviewed", body: "Use today’s insight to plan your next practice.", icon: "check-circle" as const, action: "Plan practice" };

  const openPriority = () => {
    haptic();
    router.push(players.length === 0 || stalePlayers.length > 0 ? "/(tabs)/team" as any : "/practice/new" as any);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <View style={styles.header}>
        <Text style={styles.wordmark}>Skilltracker</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open settings" activeOpacity={0.72} onPress={() => { haptic(); router.push("/settings"); }} style={styles.settingsButton}>
          <MaterialIcons name="settings" size={21} color={palette.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.teamIntro}>
          <Text style={styles.kicker}>TODAY · {team?.ageGroup ?? "YOUR TEAM"}</Text>
          <Text style={styles.teamTitle}>{team?.name ?? "Start your team"}</Text>
          <View style={styles.teamMetaRow}>
            <View style={styles.teamMetaDot} />
            <Text style={styles.teamMeta}>{players.length} players in your coaching group</Text>
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${priority.action}: ${priority.title}`} activeOpacity={0.86} onPress={openPriority} style={styles.priorityCard}>
          <View style={styles.priorityTopline}>
            <View style={styles.priorityLabelWrap}><View style={styles.priorityDot} /><Text style={styles.priorityLabel}>{priority.label}</Text></View>
            <View style={styles.priorityIcon}><MaterialIcons name={priority.icon} size={21} color="#63D6AE" /></View>
          </View>
          <Text style={styles.priorityTitle}>{priority.title}</Text>
          <Text style={styles.priorityBody}>{priority.body}</Text>
          <View style={styles.priorityAction}><Text style={styles.priorityActionText}>{priority.action}</Text><MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" /></View>
        </TouchableOpacity>

        <SectionLead eyebrow="MATCHDAY" title="Coach the game" detail={activeMatch ? "A match is live" : upcomingMatch ? `Next: ${upcomingMatch.opponent}` : "No match scheduled"} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={activeMatch ? "Resume live match" : "Set up match"} activeOpacity={0.84} onPress={() => { haptic(); router.push(activeMatch ? { pathname: "/match/live/[id]", params: { id: activeMatch.id } } : "/match/setup" as any); }} style={styles.matchPanel}>
          <View style={styles.matchIcon}><MaterialIcons name={activeMatch ? "play-arrow" : "sports-soccer"} size={25} color="#63D6AE" /></View>
          <View style={styles.matchCopy}>
            <Text style={styles.matchEyebrow}>{activeMatch ? "LIVE CAPTURE" : "TACTICAL TRACKING"}</Text>
            <Text style={styles.matchTitle}>{activeMatch ? `Continue vs ${activeMatch.opponent}` : upcomingMatch ? `vs ${upcomingMatch.opponent}` : "Set up your next match"}</Text>
            <Text style={styles.matchBody}>{activeMatch ? "Return to the pitch and record the next moment." : "Two taps per event: zone, then action."}</Text>
          </View>
          <View style={styles.matchArrow}><MaterialIcons name="arrow-forward" size={19} color="#FFFFFF" /></View>
        </TouchableOpacity>

        <SectionLead eyebrow="PLAYER DEVELOPMENT" title="Build the week" detail={`${assessedThisWeek}/${players.length} reviewed this week`} />
        <View style={styles.developmentPanel}>
          <View style={styles.developmentStats}>
            <Metric value={`${assessedThisWeek}/${players.length || 0}`} label="Reviewed this week" />
            <View style={styles.developmentDivider} />
            <Metric value={String(stalePlayers.length)} label="Need attention" tone={stalePlayers.length ? "amber" : "green"} />
          </View>
          <View style={styles.developmentActions}>
            <CompactAction icon="groups" title="Review squad" detail="Assess players and see goals" onPress={() => { haptic(); router.push("/(tabs)/team" as any); }} />
            <CompactAction icon="event-note" title="Log practice" detail="Set focus, attendance, and notes" onPress={() => { haptic(); router.push("/practice/new" as any); }} />
          </View>
        </View>

        {data.assessments.length > 0 ? <>
          <View style={styles.signalRow}>
            <Text style={styles.signalLabel}>TEAM SIGNALS</Text>
            <Text style={styles.signalHint}>Current learning picture</Text>
          </View>
          <View style={styles.signalStack}>
            <StrengthCard skill={SKILL_LABELS[strongest]} observation="Your group’s most secure skill right now." />
            <FocusCard skill={SKILL_LABELS[focus]} cue="Use this as the focus of the next practice." onPress={() => { haptic(); router.push("/(tabs)/insights" as any); }} />
          </View>
        </> : null}

        <View style={styles.recentHeader}>
          <View><Text style={styles.kicker}>RECENT MOVEMENT</Text><Text style={styles.sectionTitle}>Player progress</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="View squad" activeOpacity={0.72} onPress={() => { haptic(); router.push("/(tabs)/team" as any); }} style={styles.viewAllButton}><Text style={styles.viewAllText}>View squad</Text><MaterialIcons name="arrow-forward" size={15} color={palette.primaryDark} /></TouchableOpacity>
        </View>
        {recentAssessments.length ? <View style={styles.recentPanel}>{recentAssessments.map((assessment) => {
          const player = data.players.find((item) => item.id === assessment.playerId);
          if (!player) return null;
          const { strongest: playerStrength } = strongestAndFocus(assessment.ratings);
          const delta = improvementBetween(assessmentsForPlayer(data.assessments, player.id));
          return <TouchableOpacity key={assessment.id} accessibilityRole="button" accessibilityLabel={`Open ${player.name}`} activeOpacity={0.75} onPress={() => { haptic(); router.push({ pathname: "/player/[id]", params: { id: player.id } }); }} style={styles.recentRow}>
            <PlayerAvatar name={player.name} accent={player.accent} size="sm" />
            <View style={styles.recentCopy}><Text style={styles.recentName}>{player.name}</Text><Text style={styles.recentDetail}>Strength: {SKILL_LABELS[playerStrength]}</Text></View>
            <View style={styles.recentRight}><DevelopmentDelta delta={delta} /><AssessmentFreshness createdAt={assessment.createdAt} /></View>
          </TouchableOpacity>;
        })}</View> : <EmptyState icon="assessment" title="Development starts with one review" body="Assess a player to turn your next practice into a clear plan." cta="Review squad" onCta={openPriority} />}
      </ScrollView>
    </View>
  );
}

function SectionLead({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <View style={styles.sectionLead}><View><Text style={styles.kicker}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View><Text style={styles.sectionDetail}>{detail}</Text></View>;
}

function Metric({ value, label, tone = "ink" }: { value: string; label: string; tone?: "ink" | "green" | "amber" }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, tone === "green" && { color: palette.primaryDark }, tone === "amber" && { color: palette.amberDark }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function CompactAction({ icon, title, detail, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} activeOpacity={0.76} onPress={onPress} style={styles.compactAction}><View style={styles.compactActionIcon}><MaterialIcons name={icon} size={19} color={palette.primaryDark} /></View><View style={styles.compactActionCopy}><Text style={styles.compactActionTitle}>{title}</Text><Text style={styles.compactActionDetail}>{detail}</Text></View><MaterialIcons name="chevron-right" size={21} color={palette.primaryDark} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { height: 58, paddingHorizontal: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { ...typography.pageTitle, color: palette.ink, letterSpacing: -0.8 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: 18 },
  teamIntro: { gap: 3, paddingTop: 2 },
  kicker: { ...typography.eyebrow, color: palette.primaryDark, letterSpacing: 1.3 },
  teamTitle: { ...typography.displayMd, color: palette.ink, letterSpacing: -0.8 },
  teamMetaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 },
  teamMetaDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.primary },
  teamMeta: { ...typography.caption, color: palette.muted },
  priorityCard: { backgroundColor: palette.navy, borderRadius: radius.xl, padding: spacing.base, gap: 7, borderWidth: 1, borderColor: palette.navyBorder, shadowColor: "#0D2137", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  priorityTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priorityLabelWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#63D6AE" },
  priorityLabel: { ...typography.eyebrow, color: "#AEEED6" },
  priorityIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,214,174,0.12)" },
  priorityTitle: { ...typography.sectionHead, color: "#FFFFFF", marginTop: 3 },
  priorityBody: { ...typography.body, color: "rgba(255,255,255,0.74)", lineHeight: 21 },
  priorityAction: { height: 40, paddingHorizontal: 13, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.12)" },
  priorityActionText: { ...typography.bodyMed, color: "#FFFFFF" },
  sectionLead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 5 },
  sectionTitle: { ...typography.sectionHead, color: palette.ink, marginTop: 2 },
  sectionDetail: { ...typography.caption, color: palette.muted, maxWidth: 135, textAlign: "right", lineHeight: 17 },
  matchPanel: { minHeight: 122, borderRadius: radius.xl, padding: spacing.base, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: palette.navyMid, borderWidth: 1, borderColor: palette.navyBorder },
  matchIcon: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,214,174,0.14)" },
  matchCopy: { flex: 1, gap: 3 },
  matchEyebrow: { ...typography.eyebrow, color: "#AEEED6" },
  matchTitle: { ...typography.cardTitle, color: "#FFFFFF" },
  matchBody: { ...typography.caption, color: "rgba(255,255,255,0.7)", lineHeight: 17 },
  matchArrow: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  developmentPanel: { backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: palette.border, overflow: "hidden" },
  developmentStats: { flexDirection: "row", padding: spacing.base, backgroundColor: palette.surfaceAlt },
  developmentDivider: { width: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: 3 },
  metric: { flex: 1, gap: 4 },
  metricValue: { ...typography.displayMd, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  metricLabel: { ...typography.caption, color: palette.muted, lineHeight: 16 },
  developmentActions: { paddingHorizontal: spacing.md, gap: 1 },
  compactAction: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  compactActionIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: palette.primarySoft },
  compactActionCopy: { flex: 1, gap: 2 },
  compactActionTitle: { ...typography.bodyMed, color: palette.ink },
  compactActionDetail: { ...typography.caption, color: palette.muted },
  signalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  signalLabel: { ...typography.eyebrow, color: palette.primaryDark },
  signalHint: { ...typography.caption, color: palette.muted },
  signalStack: { gap: spacing.sm },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  viewAllButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderRadius: radius.full, backgroundColor: palette.primarySoft },
  viewAllText: { ...typography.caption, color: palette.primaryDark, fontWeight: "800" as const },
  recentPanel: { backgroundColor: palette.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: palette.border, overflow: "hidden" },
  recentRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  recentCopy: { flex: 1, gap: 2 },
  recentName: { ...typography.bodyMed, color: palette.ink },
  recentDetail: { ...typography.caption, color: palette.muted },
  recentRight: { alignItems: "flex-end", gap: 3 },
});
