import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useWorkspace } from "@/contexts/workspace-context";
import { palette, radius, spacing } from "@/lib/palette";

/** A lightweight return path that stays visible while a match is live across the main coaching tabs. */
export function LiveMatchMiniBar() {
  const { data } = useWorkspace();
  const match = data.matches.find((item) => item.status === "live" || item.status === "paused");
  if (!match) return null;
  const scoreFor = data.matchEvents.filter((event) => event.matchId === match.id && event.actionType === "goalFor").length;
  const scoreAgainst = data.matchEvents.filter((event) => event.matchId === match.id && event.actionType === "goalAgainst").length;
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.bar}
      accessibilityRole="button"
      accessibilityLabel={`Return to live match against ${match.opponent}`}
      onPress={() => router.push({ pathname: "/match/live/[id]", params: { id: match.id } })}
    >
      <View style={styles.liveDot} />
      <View style={styles.copy}><Text style={styles.label}>{match.status === "paused" ? "MATCH PAUSED" : "LIVE MATCH"}</Text><Text style={styles.title} numberOfLines={1}>vs {match.opponent} · {scoreFor}–{scoreAgainst}</Text></View>
      <View style={styles.returnIcon}><MaterialIcons name="arrow-forward" color={palette.white} size={18} /></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: spacing.base, right: spacing.base, bottom: 94, minHeight: 58, borderRadius: radius.lg, backgroundColor: palette.primaryDark, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, shadowColor: palette.black, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#F59E0B" }, copy: { flex: 1, gap: 2 }, label: { color: "#C2E0D8", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 }, title: { color: palette.white, fontSize: 14, fontWeight: "800" }, returnIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
});
