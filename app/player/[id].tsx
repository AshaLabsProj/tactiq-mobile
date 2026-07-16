import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppCard,
  IconButton,
  PlayerAvatar,
  ProgressBar,
  SectionHeader,
  StatusChip,
  mobileStyles,
} from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  assessmentsForPlayer,
  averageRatings,
  strongestAndFocus,
} from "@/lib/insights";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import { SKILL_LABELS, type SkillKey } from "@/types/models";

const SKILL_KEYS = Object.keys(SKILL_LABELS) as SkillKey[];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const player = data.players.find((item) => item.id === id);
  const history = player ? assessmentsForPlayer(data.assessments, player.id) : [];
  const latest = history[0];
  const overall = latest ? averageRatings(latest.ratings) : 0;
  const signals = latest ? strongestAndFocus(latest.ratings) : null;

  if (!player) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <MaterialIcons name="person-off" size={40} color={palette.muted} />
          <Text style={styles.notFoundTitle}>Player not found</Text>
          <AppButton label="Back to squad" variant="secondary" onPress={() => router.replace("/(tabs)/squad")} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mobileStyles.screenContent}
      >
        <View style={styles.topBar}>
          <IconButton name="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
          <Text style={styles.topBarTitle}>Player</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.identity}>
          <PlayerAvatar name={player.name} accent={player.accent} size={78} />
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              <StatusChip label={`#${player.number}`} tone="green" />
            </View>
            <Text style={styles.playerMeta}>{player.position}</Text>
          </View>
        </View>

        {latest ? (
          <>
            <View style={styles.snapshotRow}>
              <AppCard style={styles.snapshotCard} tone="green">
                <Text style={styles.snapshotValue}>{overall.toFixed(1)}</Text>
                <Text style={styles.snapshotLabel}>Current level</Text>
              </AppCard>
              <AppCard style={styles.snapshotCard} tone="amber">
                <Text style={styles.snapshotFocus}>{signals ? SKILL_LABELS[signals.focus] : "—"}</Text>
                <Text style={styles.snapshotLabel}>Next focus</Text>
              </AppCard>
            </View>

            <View style={styles.sectionBlock}>
              <SectionHeader title="Latest assessment" />
              <AppCard style={styles.skillCard}>
                <View style={styles.assessmentMetaRow}>
                  <Text style={styles.assessmentDate}>{formatDate(latest.createdAt)}</Text>
                  <StatusChip
                    label={signals ? `Strength: ${SKILL_LABELS[signals.strongest]}` : "Saved"}
                    tone="green"
                  />
                </View>
                {SKILL_KEYS.map((skill) => (
                  <View key={skill} style={styles.skillRow}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillName}>{SKILL_LABELS[skill]}</Text>
                      <Text style={styles.skillValue}>{latest.ratings[skill]}/3</Text>
                    </View>
                    <ProgressBar
                      value={latest.ratings[skill]}
                      color={skill === signals?.focus ? palette.amber : palette.primary}
                    />
                  </View>
                ))}
                {latest.note ? (
                  <View style={styles.noteBox}>
                    <MaterialIcons name="format-quote" size={20} color={palette.primary} />
                    <Text style={styles.noteText}>{latest.note}</Text>
                  </View>
                ) : null}
              </AppCard>
            </View>
          </>
        ) : (
          <AppCard tone="amber" style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="fact-check" size={26} color="#8E5A0E" />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>No assessment yet</Text>
              <Text style={styles.emptyBody}>Create a baseline in about one minute.</Text>
            </View>
          </AppCard>
        )}

        {history.length > 1 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Previous reviews" />
            <AppCard style={styles.historyCard}>
              {history.slice(1).map((assessment, index) => (
                <View key={assessment.id} style={[styles.historyRow, index > 0 && styles.historyDivider]}>
                  <View>
                    <Text style={styles.historyDate}>{formatDate(assessment.createdAt)}</Text>
                    <Text numberOfLines={1} style={styles.historyNote}>
                      {assessment.note || "Assessment saved"}
                    </Text>
                  </View>
                  <Text style={styles.historyScore}>{averageRatings(assessment.ratings).toFixed(1)}</Text>
                </View>
              ))}
            </AppCard>
          </View>
        ) : null}

        <AppButton
          label={latest ? "Add assessment" : "Create first assessment"}
          icon="add"
          onPress={() => {
            haptic.light(data.settings.hapticsEnabled);
            router.push({ pathname: "/assessment", params: { playerId: player.id } });
          }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topBarTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  topBarSpacer: { width: 44, height: 44 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  identityCopy: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  playerName: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.4 },
  playerMeta: { color: palette.muted, fontSize: 15, lineHeight: 21 },
  snapshotRow: { flexDirection: "row", gap: 12 },
  snapshotCard: { flex: 1, minHeight: 112, justifyContent: "space-between", gap: 10 },
  snapshotValue: { color: palette.ink, fontSize: 30, lineHeight: 36, fontWeight: "800", fontVariant: ["tabular-nums"] },
  snapshotFocus: { color: palette.ink, fontSize: 17, lineHeight: 23, fontWeight: "800" },
  snapshotLabel: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  sectionBlock: { gap: 10 },
  skillCard: { gap: 16 },
  assessmentMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  assessmentDate: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  skillRow: { gap: 7 },
  skillLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skillName: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  skillValue: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  noteBox: { borderRadius: 15, backgroundColor: palette.surfaceAlt, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  noteText: { flex: 1, color: palette.ink, fontSize: 14, lineHeight: 20 },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  emptyBody: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  historyCard: { paddingVertical: 4 },
  historyRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, gap: 12 },
  historyDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  historyDate: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  historyNote: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2, maxWidth: 260 },
  historyScore: { color: palette.primaryDark, fontSize: 18, lineHeight: 23, fontWeight: "800", fontVariant: ["tabular-nums"] },
  notFound: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center", gap: 14 },
  notFoundTitle: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
});
