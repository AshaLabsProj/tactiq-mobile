import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { palette } from "@/lib/palette";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

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
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

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
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
        >
          <Text style={styles.textButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AppCard({
  children,
  style,
  tone = "default",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "green" | "amber" | "coral";
}) {
  const toneStyle =
    tone === "green"
      ? styles.cardGreen
      : tone === "amber"
        ? styles.cardAmber
        : tone === "coral"
          ? styles.cardCoral
          : undefined;
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  tone = "neutral",
}: {
  name: MaterialIconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "neutral" | "primary";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === "primary" && styles.iconButtonPrimary,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons
        name={name}
        size={22}
        color={tone === "primary" ? palette.white : palette.ink}
      />
    </Pressable>
  );
}

interface AppButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  icon?: MaterialIconName;
  variant?: "primary" | "secondary" | "destructive" | "quiet";
  compact?: boolean;
  fullWidth?: boolean;
}

export function AppButton({
  label,
  icon,
  variant = "primary",
  compact = false,
  fullWidth = true,
  disabled,
  ...props
}: AppButtonProps) {
  const variantStyle =
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "destructive"
        ? styles.buttonDestructive
        : variant === "quiet"
          ? styles.buttonQuiet
          : styles.buttonSecondary;
  const labelStyle =
    variant === "primary" || variant === "destructive"
      ? styles.buttonLabelLight
      : variant === "quiet"
        ? styles.buttonLabelPrimary
        : styles.buttonLabelDark;
  const iconColor =
    variant === "primary" || variant === "destructive" ? palette.white : palette.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        compact && styles.buttonCompact,
        !fullWidth && styles.buttonAuto,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.disabled,
      ]}
      {...props}
    >
      {icon ? <MaterialIcons name={icon} size={20} color={iconColor} /> : null}
      <Text style={[styles.buttonLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

export function PlayerAvatar({
  name,
  accent,
  size = 46,
}: {
  name: string;
  accent: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: accent },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: Math.max(13, size * 0.32) }]}>{initials}</Text>
    </View>
  );
}

export function StatusChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "coral";
}) {
  const chipStyle =
    tone === "green"
      ? styles.chipGreen
      : tone === "amber"
        ? styles.chipAmber
        : tone === "coral"
          ? styles.chipCoral
          : styles.chipNeutral;
  const textStyle =
    tone === "green"
      ? styles.chipTextGreen
      : tone === "amber"
        ? styles.chipTextAmber
        : tone === "coral"
          ? styles.chipTextCoral
          : styles.chipTextNeutral;
  return (
    <View style={[styles.chip, chipStyle]}>
      <Text style={[styles.chipText, textStyle]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  max = 3,
  color = palette.primary,
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${percentage}%` as `${number}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

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

export const mobileStyles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 112,
    gap: 20,
  },
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
  body: { fontSize: 16, lineHeight: 23, color: palette.ink },
  muted: { fontSize: 14, lineHeight: 20, color: palette.muted },
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: palette.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  sectionTitle: { color: palette.ink, fontSize: 19, lineHeight: 25, fontWeight: "700" },
  textButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 4 },
  textButtonLabel: { color: palette.primary, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: 18,
  },
  cardGreen: { backgroundColor: palette.primarySoft, borderColor: palette.sage },
  cardAmber: { backgroundColor: palette.amberSoft, borderColor: "#EDD5AC" },
  cardCoral: { backgroundColor: palette.coralSoft, borderColor: "#EBC7C2" },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPrimary: { backgroundColor: palette.primary, borderColor: palette.primary },
  button: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
  },
  buttonCompact: { minHeight: 44, borderRadius: 14, paddingHorizontal: 15 },
  buttonAuto: { alignSelf: "flex-start" },
  buttonPrimary: { backgroundColor: palette.primary, borderColor: palette.primary },
  buttonSecondary: { backgroundColor: palette.surface, borderColor: palette.border },
  buttonDestructive: { backgroundColor: palette.coral, borderColor: palette.coral },
  buttonQuiet: { backgroundColor: "transparent", borderColor: "transparent" },
  buttonLabel: { fontSize: 16, lineHeight: 21, fontWeight: "700" },
  buttonLabelLight: { color: palette.white },
  buttonLabelDark: { color: palette.ink },
  buttonLabelPrimary: { color: palette.primary },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
  pressed: { opacity: 0.62 },
  disabled: { opacity: 0.42 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: palette.ink, fontWeight: "800", letterSpacing: -0.2 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  chipNeutral: { backgroundColor: palette.surfaceAlt },
  chipGreen: { backgroundColor: palette.primarySoft },
  chipAmber: { backgroundColor: palette.amberSoft },
  chipCoral: { backgroundColor: palette.coralSoft },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  chipTextNeutral: { color: palette.muted },
  chipTextGreen: { color: palette.primaryDark },
  chipTextAmber: { color: "#8E5A0E" },
  chipTextCoral: { color: palette.coral },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceAlt,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  metric: { flex: 1, gap: 4 },
  metricValue: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  metricLabel: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
