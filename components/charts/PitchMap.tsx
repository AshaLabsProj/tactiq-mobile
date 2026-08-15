/**
 * PitchMap — SVG soccer pitch with 9 tappable zones
 *
 * 3 thirds (defensive / middle / attacking) × 3 channels (left / central / right)
 *
 * Usage:
 *   <PitchMap onZonePress={(third, channel) => ...} />
 *   <PitchMap selectedZone={{ third, channel }} readonly />
 *   <PitchHeatmap events={matchEvents} filter="progression" />
 */
import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { palette } from "@/lib/palette";
import type { MatchEvent, MatchOutcome, PitchChannel, PitchThird } from "@/types/models";

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────
const PITCH_GRASS   = "#1A6B3A";
const PITCH_STRIPE  = "#1D7540";
const LINE_COLOR    = "rgba(255,255,255,0.85)";
const ZONE_HOVER    = "rgba(255,255,255,0.18)";
const ZONE_SELECTED = "rgba(255,255,255,0.32)";

const THIRDS:   PitchThird[]   = ["defensive", "middle", "attacking"];
const CHANNELS: PitchChannel[] = ["left", "central", "right"];

const THIRD_LABELS: Record<PitchThird, string>   = { defensive: "Build", middle: "Connect", attacking: "Create" };
const CHANNEL_LABELS: Record<PitchChannel, string> = { left: "L", central: "C", right: "R" };

interface ZoneKey { third: PitchThird; channel: PitchChannel }

// ─────────────────────────────────────────────────────────────────────────────
// PitchMap
// ─────────────────────────────────────────────────────────────────────────────
interface PitchMapProps {
  width?: number;
  height?: number;
  onZonePress?: (third: PitchThird, channel: PitchChannel) => void;
  selectedZone?: ZoneKey | null;
  highlightedZones?: ZoneKey[];
  readonly?: boolean;
  showLabels?: boolean;
}

export function PitchMap({
  width = 300,
  height = 420,
  onZonePress,
  selectedZone,
  highlightedZones,
  readonly = false,
  showLabels = true,
}: PitchMapProps) {
  const pw = width;
  const ph = height;
  const thirdH = ph / 3;
  const channelW = pw / 3;
  const cx = pw / 2;
  const cy = ph / 2;

  // Stripe pattern: alternating columns
  const stripes = [0, 1, 2].map((i) => ({
    x: i * channelW,
    fill: i % 2 === 0 ? PITCH_GRASS : PITCH_STRIPE,
  }));

  const isSelected = (third: PitchThird, channel: PitchChannel) =>
    selectedZone?.third === third && selectedZone?.channel === channel;

  const isHighlighted = (third: PitchThird, channel: PitchChannel) =>
    highlightedZones?.some((z) => z.third === third && z.channel === channel) ?? false;

  const thirdIndex = (t: PitchThird) => THIRDS.indexOf(t);
  const channelIndex = (c: PitchChannel) => CHANNELS.indexOf(c);

  return (
    <View style={[styles.pitchContainer, { width, height }]}>
      <Svg width={pw} height={ph}>
        {/* Background stripes */}
        {stripes.map((s, i) => (
          <Rect key={i} x={s.x} y={0} width={channelW} height={ph} fill={s.fill} />
        ))}

        {/* Zone tap areas */}
        {THIRDS.map((third) =>
          CHANNELS.map((channel) => {
            const ti = thirdIndex(third);
            const ci = channelIndex(channel);
            const x = ci * channelW;
            const y = ti * thirdH;
            const sel = isSelected(third, channel);
            const hi = isHighlighted(third, channel);
            const fill = sel ? ZONE_SELECTED : hi ? ZONE_HOVER : "transparent";
            return (
              <Rect
                key={`${third}-${channel}`}
                x={x}
                y={y}
                width={channelW}
                height={thirdH}
                fill={fill}
                onPress={readonly ? undefined : () => onZonePress?.(third, channel)}
              />
            );
          }),
        )}

        {/* Grid lines — horizontal (thirds) */}
        {[1, 2].map((i) => (
          <Line
            key={`h${i}`}
            x1={0}
            y1={i * thirdH}
            x2={pw}
            y2={i * thirdH}
            stroke={LINE_COLOR}
            strokeWidth={1.5}
          />
        ))}

        {/* Grid lines — vertical (channels) */}
        {[1, 2].map((i) => (
          <Line
            key={`v${i}`}
            x1={i * channelW}
            y1={0}
            x2={i * channelW}
            y2={ph}
            stroke={LINE_COLOR}
            strokeWidth={1.5}
          />
        ))}

        {/* Pitch outline */}
        <Rect x={0} y={0} width={pw} height={ph} fill="none" stroke={LINE_COLOR} strokeWidth={2} />

        {/* Centre circle */}
        <Circle cx={cx} cy={cy} r={pw * 0.13} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
        <Circle cx={cx} cy={cy} r={3} fill={LINE_COLOR} />

        {/* Centre line */}
        <Line x1={0} y1={cy} x2={pw} y2={cy} stroke={LINE_COLOR} strokeWidth={1.5} />

        {/* Penalty areas */}
        {/* Top (defensive) */}
        <Rect
          x={channelW * 0.5}
          y={0}
          width={channelW * 2}
          height={thirdH * 0.45}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.5}
        />
        {/* Bottom (attacking) */}
        <Rect
          x={channelW * 0.5}
          y={ph - thirdH * 0.45}
          width={channelW * 2}
          height={thirdH * 0.45}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.5}
        />

        {/* Goal areas */}
        <Rect
          x={channelW * 0.85}
          y={0}
          width={channelW * 1.3}
          height={thirdH * 0.18}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.5}
        />
        <Rect
          x={channelW * 0.85}
          y={ph - thirdH * 0.18}
          width={channelW * 1.3}
          height={thirdH * 0.18}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.5}
        />

        {/* Penalty spots */}
        <Circle cx={cx} cy={thirdH * 0.28} r={2.5} fill={LINE_COLOR} />
        <Circle cx={cx} cy={ph - thirdH * 0.28} r={2.5} fill={LINE_COLOR} />

        {/* Zone labels */}
        {showLabels
          ? THIRDS.map((third) => {
              const ti = thirdIndex(third);
              const y = ti * thirdH + thirdH / 2;
              return (
                <SvgText
                  key={third}
                  x={pw - 6}
                  y={y + 4}
                  textAnchor="end"
                  fill={LINE_COLOR}
                  fontSize={9}
                  fontWeight="700"
                  opacity={0.7}
                >
                  {THIRD_LABELS[third].toUpperCase()}
                </SvgText>
              );
            })
          : null}
      </Svg>
      {/* Native touch overlays — SVG onPress is unreliable on iOS */}
      {!readonly && onZonePress
        ? THIRDS.map((third) =>
            CHANNELS.map((channel) => {
              const ti = thirdIndex(third);
              const ci = channelIndex(channel);
              const sel = isSelected(third, channel);
              return (
                <Pressable
                  key={`touch-${third}-${channel}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${THIRD_LABELS[third]} ${CHANNEL_LABELS[channel]} zone`}
                  onPress={() => onZonePress(third, channel)}
                  style={{
                    position: "absolute",
                    left: ci * channelW,
                    top: ti * thirdH,
                    width: channelW,
                    height: thirdH,
                    backgroundColor: sel ? "rgba(255,255,255,0.25)" : "transparent",
                    borderWidth: sel ? 2 : 0,
                    borderColor: "#FFFFFF",
                  }}
                />
              );
            }),
          )
        : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PitchHeatmap — zone intensity overlay
// ─────────────────────────────────────────────────────────────────────────────
const OUTCOME_COLORS: Record<MatchOutcome, string> = {
  progression: "#4ADE80",
  chance:      "#FBBF24",
  retention:   "#6EC4A0",
  turnover:    "#F87171",
};

interface PitchHeatmapProps {
  events: MatchEvent[];
  filter?: MatchOutcome | "all";
  width?: number;
  height?: number;
}

export function PitchHeatmap({
  events,
  filter = "all",
  width = 300,
  height = 420,
}: PitchHeatmapProps) {
  const filtered = filter === "all" ? events : events.filter((e) => e.outcome === filter);

  // Count events per zone
  const counts: Record<string, number> = {};
  let maxCount = 0;
  filtered.forEach((e) => {
    if (!e.third || !e.channel) return;
    const key = `${e.third}-${e.channel}`;
    counts[key] = (counts[key] ?? 0) + 1;
    if (counts[key] > maxCount) maxCount = counts[key];
  });

  const thirdH = height / 3;
  const channelW = width / 3;

  const heatColor = filter === "all" ? palette.primary : OUTCOME_COLORS[filter];

  return (
    <View style={[styles.pitchContainer, { width, height }]}>
      {/* Base pitch */}
      <PitchMap width={width} height={height} readonly showLabels={false} />

      {/* Heatmap overlay */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {THIRDS.map((third, ti) =>
          CHANNELS.map((channel, ci) => {
            const key = `${third}-${channel}`;
            const count = counts[key] ?? 0;
            if (!count) return null;
            const intensity = maxCount > 0 ? count / maxCount : 0;
            return (
              <Rect
                key={key}
                x={ci * channelW + 1}
                y={ti * thirdH + 1}
                width={channelW - 2}
                height={thirdH - 2}
                fill={heatColor}
                fillOpacity={0.15 + intensity * 0.55}
                rx={4}
              />
            );
          }),
        )}

        {/* Event count labels */}
        {THIRDS.map((third, ti) =>
          CHANNELS.map((channel, ci) => {
            const key = `${third}-${channel}`;
            const count = counts[key] ?? 0;
            if (!count) return null;
            return (
              <SvgText
                key={`label-${key}`}
                x={ci * channelW + channelW / 2}
                y={ti * thirdH + thirdH / 2 + 5}
                textAnchor="middle"
                fill={palette.white}
                fontSize={16}
                fontWeight="800"
              >
                {count}
              </SvgText>
            );
          }),
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pitchContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
});
