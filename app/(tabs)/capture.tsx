import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useWorkspace();
  const activeMatch = data.matches.find((match) => match.status === "live" || match.status === "paused");
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const open = (path: any) => { haptic(); router.push(path); };

  return <View style={[styles.root, { paddingTop: insets.top }]}>
    <View style={styles.header}><Text style={styles.kicker}>COACHING TOOLS</Text><Text style={styles.title}>Capture a moment</Text><Text style={styles.subtitle}>Choose the job you are doing. Every action is stored on this device first.</Text></View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>MATCHDAY</Text><Text style={styles.sectionTitle}>Track the game</Text></View><Text style={styles.sectionDetail}>Fast, sideline ready</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={activeMatch ? "Resume live match" : "Start live match"} activeOpacity={0.84} onPress={() => open(activeMatch ? { pathname: "/match/live/[id]", params: { id: activeMatch.id } } : "/match/setup")} style={styles.matchHero}>
        <View style={styles.matchHeroTop}><View style={styles.heroIcon}><MaterialIcons name={activeMatch ? "play-arrow" : "sports-soccer"} size={28} color="#63D6AE" /></View><View style={styles.heroBadge}><View style={styles.heroBadgeDot} /><Text style={styles.heroBadgeText}>{activeMatch ? "IN PROGRESS" : "TWO-TAP CAPTURE"}</Text></View></View>
        <Text style={styles.matchHeroTitle}>{activeMatch ? `Resume vs ${activeMatch.opponent}` : "Start live match"}</Text>
        <Text style={styles.matchHeroBody}>{activeMatch ? "Your pitch, clock, and event log are ready to continue." : "Tap a pitch zone, tap an action, and keep coaching."}</Text>
        <View style={styles.heroCta}><Text style={styles.heroCtaText}>{activeMatch ? "Continue capture" : "Set up match"}</Text><MaterialIcons name="arrow-forward" size={19} color="#FFFFFF" /></View>
      </TouchableOpacity>

      <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>DEVELOPMENT</Text><Text style={styles.sectionTitle}>Build better players</Text></View><Text style={styles.sectionDetail}>Practice and review</Text></View>
      <View style={styles.toolPanel}>
        <ToolRow icon="event-note" tint="green" title="Log a practice" body="Set focus skills, record attendance, then batch review the squad." action="Open practice" onPress={() => open("/practice/new")} />
        <ToolRow icon="fact-check" tint="amber" title="Assess a player" body="Review one player’s six skills and save a coaching note." action="Open squad" onPress={() => open("/(tabs)/team")} />
        <ToolRow icon="person-add-alt-1" tint="green" title="Add a player" body="Keep your coaching group ready for your next session." action="Manage squad" onPress={() => open("/(tabs)/team")} last />
      </View>

      <View style={styles.helpPanel}><View style={styles.helpIcon}><MaterialIcons name="offline-bolt" size={20} color={palette.primaryDark} /></View><View style={styles.helpCopy}><Text style={styles.helpTitle}>Built for the touchline</Text><Text style={styles.helpBody}>Your coaching work is saved locally, even when the signal drops.</Text></View></View>
    </ScrollView>
  </View>;
}

function ToolRow({ icon, tint, title, body, action, onPress, last }: { icon: keyof typeof MaterialIcons.glyphMap; tint: "green" | "amber"; title: string; body: string; action: string; onPress: () => void; last?: boolean }) {
  const bg = tint === "green" ? palette.primarySoft : palette.amberSoft;
  const color = tint === "green" ? palette.primaryDark : palette.amberDark;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} activeOpacity={0.75} onPress={onPress} style={[styles.toolRow, last && styles.toolRowLast]}><View style={[styles.toolIcon, { backgroundColor: bg }]}><MaterialIcons name={icon} size={21} color={color} /></View><View style={styles.toolCopy}><Text style={styles.toolTitle}>{title}</Text><Text style={styles.toolBody}>{body}</Text><View style={styles.toolAction}><Text style={[styles.toolActionText, { color }]}>{action}</Text><MaterialIcons name="arrow-forward" size={14} color={color} /></View></View><MaterialIcons name="chevron-right" size={22} color={palette.muted} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: 4 },
  kicker: { ...typography.eyebrow, color: palette.primaryDark, letterSpacing: 1.3 },
  title: { ...typography.pageTitle, color: palette.ink, letterSpacing: -0.7 },
  subtitle: { ...typography.body, color: palette.muted, lineHeight: 21, maxWidth: 340 },
  content: { padding: spacing.base, gap: 18 },
  sectionHead: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 2 },
  sectionKicker: { ...typography.eyebrow, color: palette.primaryDark },
  sectionTitle: { ...typography.sectionHead, color: palette.ink, marginTop: 2 },
  sectionDetail: { ...typography.caption, color: palette.muted, marginBottom: 2 },
  matchHero: { backgroundColor: palette.navy, borderRadius: radius.xl, padding: spacing.base, gap: 8, borderWidth: 1, borderColor: palette.navyBorder },
  matchHeroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroIcon: { width: 50, height: 50, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,214,174,0.13)" },
  heroBadge: { height: 31, paddingHorizontal: 10, borderRadius: radius.full, gap: 6, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#63D6AE" },
  heroBadgeText: { ...typography.eyebrow, color: "#AEEED6", fontSize: 9 },
  matchHeroTitle: { ...typography.sectionHead, color: "#FFFFFF", marginTop: 7 },
  matchHeroBody: { ...typography.body, color: "rgba(255,255,255,0.74)", lineHeight: 21 },
  heroCta: { height: 42, paddingHorizontal: 13, alignSelf: "flex-start", marginTop: 5, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.12)", flexDirection: "row", alignItems: "center", gap: 8 },
  heroCtaText: { ...typography.bodyMed, color: "#FFFFFF" },
  toolPanel: { borderRadius: radius.xl, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: "hidden" },
  toolRow: { minHeight: 102, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  toolRowLast: { borderBottomWidth: 0 },
  toolIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  toolCopy: { flex: 1, gap: 3 },
  toolTitle: { ...typography.bodyMed, color: palette.ink },
  toolBody: { ...typography.caption, color: palette.muted, lineHeight: 17 },
  toolAction: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  toolActionText: { ...typography.caption, fontWeight: "800" as const },
  helpPanel: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, backgroundColor: palette.primarySoft, borderWidth: 1, borderColor: "#A7E7D3" },
  helpIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  helpCopy: { flex: 1, gap: 2 },
  helpTitle: { ...typography.bodyMed, color: palette.primaryDark },
  helpBody: { ...typography.caption, color: palette.primaryDark, lineHeight: 17 },
});
