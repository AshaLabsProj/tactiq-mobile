/**
 * Squad — Player list with search, filters, and rich player rows
 *
 * Filters: All | Defenders | Midfielders | Forwards | Goalkeepers
 * Sort: Recent assessment | Development need | Name
 * Each row: Avatar, name, number, position, assessment freshness, score, delta, focus
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
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
  AssessmentFreshness,
  Chip,
  DevelopmentDelta,
  EmptyState,
  PlayerAvatar,
  SectionHeader,
} from "@/components/ui";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  assessmentsForPlayer,
  averageRatings,
  improvementBetween,
  latestAssessmentForPlayer,
  strongestAndFocus,
} from "@/lib/insights";
import { palette, radius, spacing, typography } from "@/lib/palette";
import type { Player } from "@/types/models";
import { SKILL_LABELS } from "@/types/models";

type PositionFilter = "All" | "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
type SortMode = "freshness" | "need" | "name";

const POSITION_FILTERS: PositionFilter[] = ["All", "Goalkeeper", "Defender", "Midfielder", "Forward"];

export default function TeamScreen() {
  const { data } = useWorkspace();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<PositionFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("freshness");

  const team = data.teams.find((t) => t.id === data.settings.preferredTeamId) ?? data.teams[0];
  const allPlayers = data.players.filter((p) => p.teamId === team?.id);

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          p.position.toLowerCase().includes(q),
      );
    }
    if (posFilter !== "All") {
      list = list.filter((p) => p.position.toLowerCase().includes(posFilter.toLowerCase()));
    }
    return list;
  }, [allPlayers, search, posFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortMode === "freshness") {
      copy.sort((a, b) => {
        const la = latestAssessmentForPlayer(data.assessments, a.id);
        const lb = latestAssessmentForPlayer(data.assessments, b.id);
        if (!la && !lb) return 0;
        if (!la) return -1; // unassessed first
        if (!lb) return 1;
        return Date.parse(la.createdAt) - Date.parse(lb.createdAt); // oldest first
      });
    } else if (sortMode === "need") {
      copy.sort((a, b) => {
        const la = latestAssessmentForPlayer(data.assessments, a.id);
        const lb = latestAssessmentForPlayer(data.assessments, b.id);
        const avgA = la ? averageRatings(la.ratings) : 0;
        const avgB = lb ? averageRatings(lb.ratings) : 0;
        return avgA - avgB; // lowest score first
      });
    } else {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }, [filtered, sortMode, data.assessments]);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PLAYER DEVELOPMENT</Text>
          <Text style={styles.title}>Your Squad</Text>
        </View>
        <AppButton
          label="Add Player"
          onPress={() => haptic()}
          variant="primary"
          size="compact"
          icon="person-add"
        />
      </View>

      {/* Team chip */}
      {team ? (
        <View style={styles.teamChipRow}>
          <View style={styles.teamChip}>
            <MaterialIcons name="shield" size={14} color={palette.primary} />
            <Text style={styles.teamChipText}>{team.name}</Text>
            <Text style={styles.teamChipMeta}>{team.ageGroup} · {allPlayers.length} players</Text>
          </View>
        </View>
      ) : null}

      {/* Search */}
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={palette.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, number, or position"
          placeholderTextColor={palette.faint}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Position filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {POSITION_FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            tone="green"
            selected={posFilter === f}
            onPress={() => { haptic(); setPosFilter(f); }}
          />
        ))}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.countText}>{sorted.length} player{sorted.length !== 1 ? "s" : ""}</Text>
        <View style={styles.sortButtons}>
          {([["freshness", "Recent"], ["need", "Priority"], ["name", "Name"]] as [SortMode, string][]).map(([mode, label]) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => { haptic(); setSortMode(mode); }}
              style={[styles.sortBtn, sortMode === mode && styles.sortBtnActive]}
            >
              <Text style={[styles.sortBtnText, sortMode === mode && styles.sortBtnTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Player list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <EmptyState
            icon="people"
            title={search ? "No players found" : "No players yet"}
            body={search ? "Try a different search term." : "Add players to start tracking their development."}
            cta={search ? undefined : "Add first player"}
            onCta={search ? undefined : () => haptic()}
          />
        ) : (
          sorted.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              assessments={data.assessments}
              onPress={() => {
                haptic();
                router.push({ pathname: "/player/[id]", params: { id: player.id } });
              }}
              onAssess={() => {
                haptic();
                router.push({ pathname: "/assess/[playerId]" as any, params: { playerId: player.id } });
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlayerRow
// ─────────────────────────────────────────────────────────────────────────────
function PlayerRow({
  player,
  assessments,
  onPress,
  onAssess,
}: {
  player: Player;
  assessments: any[];
  onPress: () => void;
  onAssess: () => void;
}) {
  const latest = latestAssessmentForPlayer(assessments as any, player.id);
  const allForPlayer = assessmentsForPlayer(assessments as any, player.id);
  const delta = improvementBetween(allForPlayer);
  const avg = latest ? averageRatings(latest.ratings) : null;
  const { focus } = latest ? strongestAndFocus(latest.ratings) : { focus: null };

  const isOverdue = !latest || Date.now() - Date.parse(latest.createdAt) > 14 * 86_400_000;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, ${player.position}`}
      onPress={onPress}
      style={({ pressed }) => [styles.playerRow, pressed && styles.pressed]}
    >
      <PlayerAvatar name={player.name} accent={player.accent} size="md" />

      <View style={styles.playerInfo}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
          <Text style={styles.playerNumber}>#{player.number}</Text>
          {isOverdue ? (
            <View style={styles.overdueChip}>
              <Text style={styles.overdueChipText}>Due</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.playerPosition}>{player.position}</Text>
        <View style={styles.playerMeta}>
          <AssessmentFreshness createdAt={latest?.createdAt} />
          {focus ? (
            <Text style={styles.playerFocus}>· Focus: {SKILL_LABELS[focus]}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.playerRight}>
        {avg !== null ? (
          <View style={styles.playerScore}>
            <Text style={styles.playerScoreValue}>{avg.toFixed(1)}</Text>
            <DevelopmentDelta delta={delta} />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Assess ${player.name}`}
          onPress={(e) => { e.stopPropagation?.(); onAssess(); }}
          style={({ pressed }) => [styles.assessBtn, pressed && styles.pressed]}
        >
          <Text style={styles.assessBtnText}>Assess</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: { ...typography.eyebrow, color: palette.primary, marginBottom: 2 },
  title: { ...typography.pageTitle, color: palette.ink },

  teamChipRow: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  teamChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  teamChipText: { ...typography.bodyMed, color: palette.primaryDark },
  teamChipMeta: { ...typography.caption, color: palette.primary },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: palette.ink },

  filterRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  countText: { ...typography.caption, color: palette.muted },
  sortButtons: { flexDirection: "row", gap: spacing.xs },
  sortBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: palette.surfaceAlt,
  },
  sortBtnActive: { backgroundColor: palette.navy },
  sortBtnText: { ...typography.caption, color: palette.muted, fontWeight: "600" as const },
  sortBtnTextActive: { color: palette.white },

  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.base, gap: spacing.sm },

  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.md,
  },
  playerInfo: { flex: 1, gap: 3 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  playerName: { ...typography.bodyMed, color: palette.ink, flex: 1 },
  playerNumber: { ...typography.caption, color: palette.muted },
  overdueChip: {
    backgroundColor: palette.coralSoft,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  overdueChipText: { ...typography.eyebrow, color: palette.coral, fontSize: 10 },
  playerPosition: { ...typography.caption, color: palette.muted },
  playerMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  playerFocus: { ...typography.caption, color: palette.muted },

  playerRight: { alignItems: "flex-end", gap: spacing.sm },
  playerScore: { alignItems: "flex-end", gap: 2 },
  playerScoreValue: { ...typography.cardTitle, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  assessBtn: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    minHeight: 34,
    justifyContent: "center",
  },
  assessBtnText: { ...typography.caption, color: palette.white, fontWeight: "700" as const },

  pressed: { opacity: 0.72 },
});
