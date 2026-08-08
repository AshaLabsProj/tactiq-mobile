/**
 * Skilltracker Design System — Base UI Components
 * Redesigned 2026-08-08
 *
 * Exports:
 *   PlayerAvatar, SkillBadge, DevelopmentDelta, AssessmentFreshness,
 *   EmptyState, LoadingState, ErrorState, OfflineState,
 *   InsightCard, FocusCard, StrengthCard,
 *   PageHeader, SectionHeader, AppCard, AppButton, IconButton,
 *   ProgressBar, SkillBar, Chip, Metric, Divider
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { palette, radius, ratingBg, ratingColor, ratingLabel, spacing, typography } from "@/lib/palette";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// PlayerAvatar
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_SIZES = { sm: 32, md: 44, lg: 56, xl: 72 } as const;
const AVATAR_FONT = { sm: 12, md: 16, lg: 20, xl: 26 } as const;

export function PlayerAvatar({
  name,
  accent = palette.primary,
  size = "md",
  style,
}: {
  name: string;
  accent?: string;
  size?: keyof typeof AVATAR_SIZES;
  style?: StyleProp<ViewStyle>;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const dim = AVATAR_SIZES[size];
  const fontSize = AVATAR_FONT[size];
  // Derive a contrasting text color from the accent
  const textColor = palette.white;
  return (
    <View
      style={[
        styles.avatar,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: accent },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize, color: textColor }]}>{initials}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillBadge — Developing / Secure / Strong
// ─────────────────────────────────────────────────────────────────────────────
const RATING_ICONS: Record<1 | 2 | 3, MaterialIconName> = {
  1: "trending-up",
  2: "check-circle",
  3: "star",
};

export function SkillBadge({
  rating,
  size = "md",
}: {
  rating: 1 | 2 | 3;
  size?: "sm" | "md";
}) {
  const color = ratingColor(rating);
  const bg = ratingBg(rating);
  const label = ratingLabel(rating);
  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? 11 : 13;
  return (
    <View style={[styles.skillBadge, { backgroundColor: bg }]}>
      <MaterialIcons name={RATING_ICONS[rating]} size={iconSize} color={color} />
      <Text style={[styles.skillBadgeText, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DevelopmentDelta — ↑0.3 / ↓0.1 / —
// ─────────────────────────────────────────────────────────────────────────────
export function DevelopmentDelta({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.05) {
    return <Text style={[styles.deltaText, { color: palette.muted }]}>—</Text>;
  }
  const up = delta > 0;
  const color = up ? palette.strong : palette.developing;
  const icon: MaterialIconName = up ? "arrow-upward" : "arrow-downward";
  return (
    <View style={styles.deltaRow}>
      <MaterialIcons name={icon} size={12} color={color} />
      <Text style={[styles.deltaText, { color }]}>{Math.abs(delta).toFixed(1)}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentFreshness
// ─────────────────────────────────────────────────────────────────────────────
export function AssessmentFreshness({ createdAt }: { createdAt: string | undefined }) {
  if (!createdAt) {
    return <Text style={[styles.freshnessText, { color: palette.muted }]}>Not yet assessed</Text>;
  }
  const days = Math.floor((Date.now() - Date.parse(createdAt)) / 86_400_000);
  const overdue = days > 14;
  const color = overdue ? palette.coral : days <= 7 ? palette.strong : palette.amber;
  const label =
    days === 0 ? "Today" : days === 1 ? "Yesterday" : days <= 13 ? `${days} days ago` : `${Math.floor(days / 7)} weeks ago`;
  return (
    <Text style={[styles.freshnessText, { color }]}>
      {overdue ? "⚠ " : ""}
      {label}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  body,
  cta,
  onCta,
}: {
  icon: MaterialIconName;
  title: string;
  body?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name={icon} size={32} color={palette.muted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {cta && onCta ? (
        <AppButton label={cta} onPress={onCta} variant="primary" size="compact" style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingState
// ─────────────────────────────────────────────────────────────────────────────
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.centeredState}>
      <ActivityIndicator size="large" color={palette.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState
// ─────────────────────────────────────────────────────────────────────────────
export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconCircle, { backgroundColor: palette.coralSoft }]}>
        <MaterialIcons name="error-outline" size={32} color={palette.coral} />
      </View>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptyBody}>{message}</Text>
      {onRetry ? (
        <AppButton label="Try again" onPress={onRetry} variant="primary" size="compact" style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OfflineState
// ─────────────────────────────────────────────────────────────────────────────
export function OfflineState() {
  return (
    <View style={styles.offlineBanner}>
      <MaterialIcons name="wifi-off" size={16} color={palette.white} />
      <Text style={styles.offlineText}>You're offline — changes will sync when reconnected</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InsightCard
// ─────────────────────────────────────────────────────────────────────────────
export function InsightCard({
  label,
  title,
  explanation,
  children,
  onPress,
}: {
  label?: string;
  title: string;
  explanation?: string;
  children?: ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.insightCard}>
      {label ? <Text style={styles.insightLabel}>{label}</Text> : null}
      <Text style={styles.insightTitle}>{title}</Text>
      {explanation ? <Text style={styles.insightExplanation}>{explanation}</Text> : null}
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FocusCard — amber, shows current development focus
// ─────────────────────────────────────────────────────────────────────────────
export function FocusCard({
  skill,
  cue,
  onPress,
}: {
  skill: string;
  cue?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.focusCard, pressed && styles.pressed]}
    >
      <View style={styles.focusCardHeader}>
        <View style={styles.focusIconCircle}>
          <MaterialIcons name="flag" size={16} color={palette.amberDark} />
        </View>
        <Text style={styles.focusLabel}>CURRENT FOCUS</Text>
      </View>
      <Text style={styles.focusSkill}>{skill}</Text>
      {cue ? <Text style={styles.focusCue}>{cue}</Text> : null}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StrengthCard — green, shows current strength
// ─────────────────────────────────────────────────────────────────────────────
export function StrengthCard({
  skill,
  observation,
  onPress,
}: {
  skill: string;
  observation?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.strengthCard, pressed && styles.pressed]}
    >
      <View style={styles.focusCardHeader}>
        <View style={styles.strengthIconCircle}>
          <MaterialIcons name="star" size={16} color={palette.primaryDark} />
        </View>
        <Text style={styles.strengthLabel}>CURRENT STRENGTH</Text>
      </View>
      <Text style={styles.strengthSkill}>{skill}</Text>
      {observation ? <Text style={styles.strengthObs}>{observation}</Text> : null}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.pageHeaderRow}>
      <View style={styles.pageHeaderCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}
        >
          <Text style={styles.textBtnLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppCard
// ─────────────────────────────────────────────────────────────────────────────
export function AppCard({
  children,
  tone = "default",
  style,
  onPress,
}: {
  children: ReactNode;
  tone?: "default" | "green" | "amber" | "coral" | "navy";
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const toneStyle =
    tone === "green" ? styles.cardGreen :
    tone === "amber" ? styles.cardAmber :
    tone === "coral" ? styles.cardCoral :
    tone === "navy"  ? styles.cardNavy  :
    styles.cardDefault;

  if (!onPress) {
    return <View style={[styles.card, toneStyle, style]}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, toneStyle, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppButton
// ─────────────────────────────────────────────────────────────────────────────
export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "default",
  icon,
  iconRight,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "default" | "compact" | "large";
  icon?: MaterialIconName;
  iconRight?: MaterialIconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const variantStyle =
    variant === "primary"     ? styles.btnPrimary :
    variant === "secondary"   ? styles.btnSecondary :
    variant === "destructive" ? styles.btnDestructive :
    styles.btnGhost;

  const labelColor =
    variant === "primary"     ? palette.white :
    variant === "secondary"   ? palette.ink :
    variant === "destructive" ? palette.white :
    palette.primary;

  const sizeStyle =
    size === "compact" ? styles.btnCompact :
    size === "large"   ? styles.btnLarge :
    styles.btnDefault;

  const iconSize = size === "compact" ? 16 : size === "large" ? 22 : 18;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        sizeStyle,
        style,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={iconSize} color={labelColor} /> : null}
      <Text style={[styles.btnLabel, { color: labelColor }, size === "large" && styles.btnLabelLg]}>
        {label}
      </Text>
      {iconRight ? <MaterialIcons name={iconRight} size={iconSize} color={labelColor} /> : null}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IconButton
// ─────────────────────────────────────────────────────────────────────────────
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = palette.ink,
  variant = "default",
}: {
  name: MaterialIconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  variant?: "default" | "primary" | "ghost";
}) {
  const variantStyle =
    variant === "primary" ? styles.iconBtnPrimary :
    variant === "ghost"   ? styles.iconBtnGhost :
    styles.iconBtnDefault;
  const iconColor = variant === "primary" ? palette.white : color;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, variantStyle, pressed && styles.pressed]}
    >
      <MaterialIcons name={name} size={22} color={iconColor} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillBar — horizontal bar with label, value, delta
// ─────────────────────────────────────────────────────────────────────────────
export function SkillBar({
  label,
  rating,
  delta,
  onPress,
}: {
  label: string;
  rating: 1 | 2 | 3;
  delta?: number;
  onPress?: () => void;
}) {
  const color = ratingColor(rating);
  const pct = (rating / 3) * 100;
  const content = (
    <View style={styles.skillBarRow}>
      <View style={styles.skillBarLeft}>
        <Text style={styles.skillBarLabel}>{label}</Text>
        <SkillBadge rating={rating} size="sm" />
      </View>
      <View style={styles.skillBarRight}>
        {delta !== undefined ? <DevelopmentDelta delta={delta} /> : null}
        <View style={styles.skillBarTrack}>
          <View style={[styles.skillBarFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip
// ─────────────────────────────────────────────────────────────────────────────
export function Chip({
  label,
  tone = "neutral",
  selected,
  onPress,
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "coral" | "navy";
  selected?: boolean;
  onPress?: () => void;
}) {
  const bgStyle =
    tone === "green"  ? styles.chipGreen :
    tone === "amber"  ? styles.chipAmber :
    tone === "coral"  ? styles.chipCoral :
    tone === "navy"   ? styles.chipNavy :
    styles.chipNeutral;
  const textStyle =
    tone === "green"  ? styles.chipTextGreen :
    tone === "amber"  ? styles.chipTextAmber :
    tone === "coral"  ? styles.chipTextCoral :
    tone === "navy"   ? styles.chipTextNavy :
    styles.chipTextNeutral;
  const selectedStyle = selected ? styles.chipSelected : null;

  if (!onPress) {
    return (
      <View style={[styles.chip, bgStyle, selectedStyle]}>
        <Text style={[styles.chipText, textStyle]}>{label}</Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.chip, bgStyle, selectedStyle, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric
// ─────────────────────────────────────────────────────────────────────────────
export function Metric({
  value,
  label,
  valueStyle,
}: {
  value: string;
  label: string;
  valueStyle?: TextStyle;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, valueStyle]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  max = 3,
  color = palette.primary,
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout helpers
// ─────────────────────────────────────────────────────────────────────────────
export const ui = StyleSheet.create({
  screenContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grow: { flex: 1 },
  body: { ...typography.body, color: palette.ink },
  muted: { ...typography.caption, color: palette.muted },
  stickyFooter: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    gap: spacing.sm,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheet
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Avatar
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", letterSpacing: -0.2 },

  // SkillBadge
  skillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  skillBadgeText: { fontWeight: "700", lineHeight: 16 },

  // Delta
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  deltaText: { fontSize: 12, fontWeight: "700", lineHeight: 16 },

  // Freshness
  freshnessText: { fontSize: 12, fontWeight: "600", lineHeight: 16 },

  // Empty / Loading / Error / Offline
  emptyState: { alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.sectionHead, color: palette.ink, textAlign: "center" },
  emptyBody: { ...typography.body, color: palette.muted, textAlign: "center", lineHeight: 22 },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingLabel: { ...typography.body, color: palette.muted },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.navy,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  offlineText: { ...typography.caption, color: palette.white, flex: 1 },

  // InsightCard
  insightCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.base,
    gap: spacing.sm,
  },
  insightLabel: { ...typography.eyebrow, color: palette.primary },
  insightTitle: { ...typography.sectionHead, color: palette.ink },
  insightExplanation: { ...typography.body, color: palette.muted, lineHeight: 22 },

  // FocusCard
  focusCard: {
    backgroundColor: palette.amberSoft,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EDD5AC",
    padding: spacing.base,
    gap: spacing.sm,
  },
  focusCardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  focusIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  focusLabel: { ...typography.eyebrow, color: palette.amberDark },
  focusSkill: { ...typography.cardTitle, color: palette.amberDark },
  focusCue: { ...typography.body, color: palette.amberDark, opacity: 0.8, lineHeight: 22 },

  // StrengthCard
  strengthCard: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.sage,
    padding: spacing.base,
    gap: spacing.sm,
  },
  strengthIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  strengthLabel: { ...typography.eyebrow, color: palette.primaryDark },
  strengthSkill: { ...typography.cardTitle, color: palette.primaryDark },
  strengthObs: { ...typography.body, color: palette.primaryDark, opacity: 0.8, lineHeight: 22 },

  // PageHeader
  pageHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  pageHeaderCopy: { flex: 1 },
  eyebrow: { ...typography.eyebrow, color: palette.primary, marginBottom: 3 },
  pageTitle: { ...typography.pageTitle, color: palette.ink },
  pageSubtitle: { ...typography.body, color: palette.muted, marginTop: 4 },

  // SectionHeader
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  sectionTitle: { ...typography.sectionHead, color: palette.ink },
  textBtn: { minHeight: 40, justifyContent: "center", paddingHorizontal: 4 },
  textBtnLabel: { ...typography.bodyMed, color: palette.primary },

  // AppCard
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
  },
  cardDefault: { backgroundColor: palette.surface, borderColor: palette.border },
  cardGreen: { backgroundColor: palette.primarySoft, borderColor: palette.sage },
  cardAmber: { backgroundColor: palette.amberSoft, borderColor: "#EDD5AC" },
  cardCoral: { backgroundColor: palette.coralSoft, borderColor: "#EBC7C2" },
  cardNavy: { backgroundColor: palette.navyMid, borderColor: palette.navyBorder },

  // AppButton
  btn: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
  },
  btnDefault: { minHeight: 54 },
  btnCompact: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: spacing.md },
  btnLarge: { minHeight: 64, borderRadius: radius.xl, paddingHorizontal: spacing.xl },
  btnPrimary: { backgroundColor: palette.primary, borderColor: palette.primary },
  btnSecondary: { backgroundColor: palette.surface, borderColor: palette.border },
  btnDestructive: { backgroundColor: palette.coral, borderColor: palette.coral },
  btnGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  btnLabel: { fontSize: 16, lineHeight: 21, fontWeight: "700" as const },
  btnLabelLg: { fontSize: 18, lineHeight: 24 },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
  btnDisabled: { opacity: 0.42 },

  // IconButton
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  iconBtnDefault: {
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  iconBtnPrimary: { backgroundColor: palette.primary },
  iconBtnGhost: { backgroundColor: "transparent" },

  // SkillBar
  skillBarRow: { gap: spacing.sm },
  skillBarLeft: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skillBarRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillBarLabel: { ...typography.bodyMed, color: palette.ink, flex: 1 },
  skillBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: "hidden" },
  skillBarFill: { height: "100%", borderRadius: 4 },

  // Chip
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, alignSelf: "flex-start" },
  chipNeutral: { backgroundColor: palette.surfaceAlt },
  chipGreen: { backgroundColor: palette.primarySoft },
  chipAmber: { backgroundColor: palette.amberSoft },
  chipCoral: { backgroundColor: palette.coralSoft },
  chipNavy: { backgroundColor: palette.navySoft },
  chipSelected: { borderWidth: 1.5, borderColor: palette.primary },
  chipText: { ...typography.caption, fontWeight: "700" as const },
  chipTextNeutral: { color: palette.muted },
  chipTextGreen: { color: palette.primaryDark },
  chipTextAmber: { color: palette.amberDark },
  chipTextCoral: { color: palette.coralDark },
  chipTextNavy: { color: palette.navyMid },

  // Metric
  metric: { flex: 1, gap: 4 },
  metricValue: { ...typography.displayMd, color: palette.ink, fontVariant: ["tabular-nums"] as any },
  metricLabel: { ...typography.caption, color: palette.muted },

  // Divider
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },

  // ProgressBar
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  // Shared
  pressed: { opacity: 0.62 },
});
