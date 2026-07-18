/**
 * PitchZoneSelector
 *
 * A mobile-friendly interactive soccer pitch rendered with react-native-svg.
 * The pitch is divided into 9 zones (3 thirds × 3 channels).
 * Tapping a zone selects it; tapping again deselects.
 *
 * Visual language: dark navy pitch surface with bright green lines,
 * clearly distinct from the assessment flow's light green palette.
 */
import { useWindowDimensions } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { PitchChannel, PitchThird } from "@/types/models";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PitchZone = { third: PitchThird; channel: PitchChannel };

interface Props {
  selected: PitchZone | null;
  onSelect: (zone: PitchZone) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THIRDS: PitchThird[] = ["defensive", "middle", "attacking"];
const CHANNELS: PitchChannel[] = ["left", "central", "right"];

// Zone labels shown inside each cell
const THIRD_LABELS: Record<PitchThird, string> = {
  defensive: "DEF",
  middle: "MID",
  attacking: "ATK",
};
const CHANNEL_LABELS: Record<PitchChannel, string> = {
  left: "L",
  central: "C",
  right: "R",
};

// Pitch colors
const PITCH_BG = "#0D2137"; // deep navy
const LINE_COLOR = "rgba(255,255,255,0.55)";
const GRASS_EVEN = "rgba(255,255,255,0.04)";
const GRASS_ODD = "transparent";
const ZONE_SELECTED = "rgba(22,138,104,0.72)"; // primary green tint
const ZONE_HOVER = "rgba(255,255,255,0.08)";
const LABEL_COLOR = "rgba(255,255,255,0.45)";
const LABEL_SELECTED = "#FFFFFF";

// ─── Component ────────────────────────────────────────────────────────────────
export function PitchZoneSelector({ selected, onSelect }: Props) {
  const { width: screenWidth } = useWindowDimensions();

  // Pitch dimensions — portrait orientation, fills screen width with padding
  const PADDING = 16;
  const pitchW = screenWidth - PADDING * 2;
  // Standard pitch ratio ~68m × 105m → landscape → we show portrait (rotated)
  // Portrait: width = short side, height = long side
  const pitchH = pitchW * (105 / 68);

  // Grid cell sizes
  const cellW = pitchW / 3; // 3 channels
  const cellH = pitchH / 3; // 3 thirds

  // Penalty area dimensions (scaled)
  const penAreaW = (40.32 / 68) * pitchW;
  const penAreaH = (16.5 / 105) * pitchH;
  const penAreaX = (pitchW - penAreaW) / 2;

  // Goal area dimensions
  const goalAreaW = (18.32 / 68) * pitchW;
  const goalAreaH = (5.5 / 105) * pitchH;
  const goalAreaX = (pitchW - goalAreaW) / 2;

  // Centre circle radius
  const circleR = (9.15 / 68) * pitchW;

  // Penalty spot
  const penSpotY = (11 / 105) * pitchH;

  return (
    <Svg
      width={pitchW}
      height={pitchH}
      viewBox={`0 0 ${pitchW} ${pitchH}`}
      style={{ borderRadius: 12, overflow: "hidden" }}
    >
      <Defs />

      {/* ── Background ── */}
      <Rect x={0} y={0} width={pitchW} height={pitchH} fill={PITCH_BG} rx={12} />

      {/* ── Alternating grass stripes (vertical bands) ── */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Rect
          key={`stripe-${i}`}
          x={(i * pitchW) / 6}
          y={0}
          width={pitchW / 6}
          height={pitchH}
          fill={i % 2 === 0 ? GRASS_EVEN : GRASS_ODD}
        />
      ))}

      {/* ── Tappable zone cells ── */}
      {THIRDS.map((third, tIdx) =>
        CHANNELS.map((channel, cIdx) => {
          const isSelected =
            selected?.third === third && selected?.channel === channel;
          const x = cIdx * cellW;
          const y = tIdx * cellH;
          return (
            <Rect
              key={`${third}-${channel}`}
              x={x}
              y={y}
              width={cellW}
              height={cellH}
              fill={isSelected ? ZONE_SELECTED : ZONE_HOVER}
              onPress={() => onSelect({ third, channel })}
            />
          );
        })
      )}

      {/* ── Pitch outline ── */}
      <Rect
        x={1}
        y={1}
        width={pitchW - 2}
        height={pitchH - 2}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={2}
        rx={11}
      />

      {/* ── Halfway line ── */}
      <Line
        x1={0}
        y1={pitchH / 2}
        x2={pitchW}
        y2={pitchH / 2}
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />

      {/* ── Third dividers (subtle dashed) ── */}
      <Line
        x1={0}
        y1={cellH}
        x2={pitchW}
        y2={cellH}
        stroke={LINE_COLOR}
        strokeWidth={0.75}
        strokeDasharray="6,4"
      />
      <Line
        x1={0}
        y1={cellH * 2}
        x2={pitchW}
        y2={cellH * 2}
        stroke={LINE_COLOR}
        strokeWidth={0.75}
        strokeDasharray="6,4"
      />

      {/* ── Channel dividers (subtle dashed) ── */}
      <Line
        x1={cellW}
        y1={0}
        x2={cellW}
        y2={pitchH}
        stroke={LINE_COLOR}
        strokeWidth={0.75}
        strokeDasharray="6,4"
      />
      <Line
        x1={cellW * 2}
        y1={0}
        x2={cellW * 2}
        y2={pitchH}
        stroke={LINE_COLOR}
        strokeWidth={0.75}
        strokeDasharray="6,4"
      />

      {/* ── Top penalty area (attacking end) ── */}
      <Rect
        x={penAreaX}
        y={0}
        width={penAreaW}
        height={penAreaH}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />
      {/* Top goal area */}
      <Rect
        x={goalAreaX}
        y={0}
        width={goalAreaW}
        height={goalAreaH}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />
      {/* Top penalty spot */}
      <Circle
        cx={pitchW / 2}
        cy={penSpotY}
        r={2.5}
        fill={LINE_COLOR}
      />
      {/* Top penalty arc */}
      <Path
        d={`M ${pitchW / 2 - circleR * 0.8} ${penAreaH} A ${circleR} ${circleR} 0 0 1 ${pitchW / 2 + circleR * 0.8} ${penAreaH}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />

      {/* ── Bottom penalty area (defensive end) ── */}
      <Rect
        x={penAreaX}
        y={pitchH - penAreaH}
        width={penAreaW}
        height={penAreaH}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />
      {/* Bottom goal area */}
      <Rect
        x={goalAreaX}
        y={pitchH - goalAreaH}
        width={goalAreaW}
        height={goalAreaH}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />
      {/* Bottom penalty spot */}
      <Circle
        cx={pitchW / 2}
        cy={pitchH - penSpotY}
        r={2.5}
        fill={LINE_COLOR}
      />
      {/* Bottom penalty arc */}
      <Path
        d={`M ${pitchW / 2 - circleR * 0.8} ${pitchH - penAreaH} A ${circleR} ${circleR} 0 0 0 ${pitchW / 2 + circleR * 0.8} ${pitchH - penAreaH}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />

      {/* ── Centre circle ── */}
      <Circle
        cx={pitchW / 2}
        cy={pitchH / 2}
        r={circleR}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
      />
      {/* Centre spot */}
      <Circle
        cx={pitchW / 2}
        cy={pitchH / 2}
        r={2.5}
        fill={LINE_COLOR}
      />

      {/* ── Zone labels ── */}
      {THIRDS.map((third, tIdx) =>
        CHANNELS.map((channel, cIdx) => {
          const isSelected =
            selected?.third === third && selected?.channel === channel;
          const cx = cIdx * cellW + cellW / 2;
          const cy = tIdx * cellH + cellH / 2;
          const label = `${THIRD_LABELS[third]}\n${CHANNEL_LABELS[channel]}`;
          return (
            <SvgText
              key={`label-${third}-${channel}`}
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize={10}
              fontWeight="700"
              fill={isSelected ? LABEL_SELECTED : LABEL_COLOR}
              onPress={() => onSelect({ third, channel })}
            >
              {THIRD_LABELS[third]}
            </SvgText>
          );
        })
      )}

      {/* ── Channel labels at top ── */}
      {CHANNELS.map((channel, cIdx) => (
        <SvgText
          key={`ch-label-${channel}`}
          x={cIdx * cellW + cellW / 2}
          y={14}
          textAnchor="middle"
          fontSize={9}
          fontWeight="600"
          fill="rgba(255,255,255,0.35)"
        >
          {channel.toUpperCase()}
        </SvgText>
      ))}
    </Svg>
  );
}
