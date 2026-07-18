import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  AppCard,
  PageHeader,
  PlayerAvatar,
  ProgressBar,
  SectionHeader,
  StatusChip,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { averageRatings, latestAssessmentForPlayer } from "@/lib/insights";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import type { Player } from "@/types/models";

export default function SquadScreen() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState("");
  const team = data.teams.find((item) => item.id === data.settings.preferredTeamId) ?? data.teams[0];
  const players = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.players
      .filter((player) => player.teamId === team?.id)
      .filter(
        (player) =>
          !normalized ||
          player.name.toLowerCase().includes(normalized) ||
          player.position.toLowerCase().includes(normalized) ||
          String(player.number).includes(normalized),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.players, query, team?.id]);

  const renderPlayer = ({ item }: { item: Player }) => {
    const latest = latestAssessmentForPlayer(data.assessments, item.id);
    const overall = latest ? averageRatings(latest.ratings) : 0;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          haptic.light(data.settings.hapticsEnabled);
          router.push({ pathname: "/player/[id]", params: { id: item.id } });
        }}
        style={({ pressed }) => [styles.playerRow, pressed && styles.pressed]}
      >
        <PlayerAvatar name={item.name} accent={item.accent} />
        <View style={styles.playerCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.number}>#{item.number}</Text>
          </View>
          <Text style={styles.position}>{item.position}</Text>
          {latest ? <ProgressBar value={overall} /> : null}
        </View>
        <View style={styles.rowEnd}>
          <StatusChip label={latest ? overall.toFixed(1) : "New"} tone={latest ? "green" : "amber"} />
          <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <PageHeader
              eyebrow="Your team"
              title="Squad"
              subtitle="Find a player and see what to work on next."
            />

            <AppCard tone="green" style={styles.teamCard}>
              <View style={styles.teamBadge}>
                <MaterialIcons name="shield" size={25} color={palette.primaryDark} />
              </View>
              <View style={styles.teamCopy}>
                <Text style={styles.teamName}>{team?.name}</Text>
                <Text style={styles.teamMeta}>{team?.ageGroup} · {team?.season} season</Text>
              </View>
              <Text style={styles.teamCount}>{team?.playerIds.length ?? 0}</Text>
            </AppCard>

            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={21} color={palette.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name, number, or position"
                placeholderTextColor={palette.muted}
                returnKeyType="done"
                style={styles.searchInput}
                accessibilityLabel="Search players"
              />
              {query ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery("")}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialIcons name="cancel" size={20} color={palette.muted} />
                </Pressable>
              ) : null}
            </View>

            <SectionHeader
              title={`${players.length} ${players.length === 1 ? "player" : "players"}`}
              actionLabel="Assess"
              onAction={() => router.push("/assessment-qa")}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="person-search" size={34} color={palette.muted} />
            <Text style={styles.emptyTitle}>No matching players</Text>
            <Text style={styles.emptyBody}>Try a different name, number, or position.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 112 },
  headerContent: { gap: 18, marginBottom: 8 },
  teamCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  teamBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.68)", alignItems: "center", justifyContent: "center" },
  teamCopy: { flex: 1 },
  teamName: { color: palette.ink, fontSize: 18, lineHeight: 23, fontWeight: "700" },
  teamMeta: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  teamCount: { color: palette.primaryDark, fontSize: 24, lineHeight: 30, fontWeight: "800", fontVariant: ["tabular-nums"] },
  searchBox: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, color: palette.ink, fontSize: 15, lineHeight: 20, paddingVertical: 0 },
  playerRow: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  playerCopy: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  playerName: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  number: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  position: { color: palette.muted, fontSize: 13, lineHeight: 18, marginBottom: 3 },
  rowEnd: { alignItems: "flex-end", gap: 8, flexDirection: "row" },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginLeft: 58 },
  emptyState: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { color: palette.ink, fontSize: 18, lineHeight: 23, fontWeight: "700" },
  emptyBody: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.62 },
});
