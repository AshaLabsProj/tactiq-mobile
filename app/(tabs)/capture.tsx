import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing, typography } from "@/lib/palette";

type CaptureAction = "match" | "practice" | "assess" | "player";

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useWorkspace();
  const activeMatch = data.matches.find((match) => match.status === "live" || match.status === "paused");
  const go = (action: CaptureAction) => {
    if (action === "match") { router.push(activeMatch ? { pathname: "/match/live/[id]" as never, params: { id: activeMatch.id } } : "/match/setup" as never); return; }
    if (action === "practice") { router.push("/practice/new" as never); return; }
    if (action === "assess") { router.push("/(tabs)/team" as never); return; }
    router.push("/(tabs)/team" as never);
  };
  const cards: Array<{ action: CaptureAction; title: string; body: string; icon: keyof typeof MaterialIcons.glyphMap; tone: "emerald" | "amber" | "navy" }> = [
    { action: "match", title: activeMatch ? `Resume vs ${activeMatch.opponent}` : "Start live match", body: activeMatch ? "Return to the pitch and continue recording." : "Zone → action → recorded. Built for the sideline.", icon: "sports-soccer", tone: "navy" },
    { action: "practice", title: "Log practice", body: "Set one or two focus skills, attendance, then assess the group.", icon: "event-note", tone: "emerald" },
    { action: "assess", title: "Assess a player", body: "Open a player profile for an individual assessment and goals.", icon: "fact-check", tone: "amber" },
    { action: "player", title: "Add a player", body: "Keep the squad current before your next session.", icon: "person-add-alt-1", tone: "emerald" },
  ];
  return <View style={[styles.root, { paddingTop: insets.top }]}><View style={styles.header}><Text style={styles.eyebrow}>CAPTURE</Text><Text style={styles.title}>What are you doing?</Text><Text style={styles.subtitle}>Choose one clear next action. Everything saves on this device first.</Text></View><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>{cards.map((card) => <CaptureCard key={card.action} {...card} onPress={() => go(card.action)} />)}</ScrollView></View>;
}
function CaptureCard({ title, body, icon, tone, onPress }: { title: string; body: string; icon: keyof typeof MaterialIcons.glyphMap; tone: "emerald" | "amber" | "navy"; onPress: () => void }) { const colors = tone === "navy" ? { background: palette.navy, border: palette.navy, icon: "#63D6AE", title: "#FFFFFF", body: "rgba(255,255,255,0.7)" } : tone === "amber" ? { background: "#FFF7E6", border: "#F7D68E", icon: "#9A5D00", title: "#5D3B00", body: "#805B25" } : { background: palette.primarySoft, border: "#A7E7D3", icon: palette.primaryDark, title: palette.primaryDark, body: "#346D5B" }; return <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} onPress={onPress} style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={styles.cardTop}><View style={[styles.iconCircle, { backgroundColor: tone === "navy" ? "rgba(99,214,174,0.14)" : "rgba(255,255,255,0.7)" }]}><MaterialIcons name={icon} size={24} color={colors.icon} /></View><MaterialIcons name="arrow-forward" size={22} color={colors.icon} /></View><Text style={[styles.cardTitle, { color: colors.title }]}>{title}</Text><Text style={[styles.cardBody, { color: colors.body }]}>{body}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.background }, header: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, gap: 5 }, eyebrow: { color: palette.primaryDark, fontSize: 11, letterSpacing: 1.4, fontWeight: "900" }, title: { color: palette.ink, fontSize: 31, lineHeight: 37, fontWeight: "900", letterSpacing: -0.6 }, subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, maxWidth: 330 }, content: { padding: spacing.base, gap: spacing.md }, card: { minHeight: 155, justifyContent: "space-between", padding: spacing.base, borderRadius: radius.xl, borderWidth: 1 }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconCircle: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 }, cardTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 16 }, cardBody: { fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: 4, maxWidth: 300 } });
