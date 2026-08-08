/**
 * SkillRadar — 6-axis SVG radar chart
 *
 * Renders the player's current development shape across 6 skills.
 * Optionally renders a ghost polygon for the previous assessment.
 * Tapping a skill axis calls onSkillPress(skillKey).
 */
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";
import { palette, ratingColor } from "@/lib/palette";
import type { SkillKey, SkillRatings } from "@/types/models";

const SKILLS: { key: SkillKey; label: string }[] = [
  { key: "ballControl",    label: "Ball\nControl" },
  { key: "passing",        label: "Passing" },
  { key: "receiving",      label: "Receiving" },
  { key: "dribbling",      label: "Dribbling" },
  { key: "defending",      label: "Defending" },
  { key: "decisionMaking", label: "Decision\nMaking" },
];

const N = SKILLS.length;
const LEVELS = 3; // max rating

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ratingsToPoints(
  ratings: SkillRatings,
  cx: number,
  cy: number,
  maxR: number,
): string {
  return SKILLS.map(({ key }, i) => {
    const angle = (360 / N) * i;
    const r = (ratings[key] / LEVELS) * maxR;
    const { x, y } = polarToXY(angle, r, cx, cy);
    return `${x},${y}`;
  }).join(" ");
}

interface SkillRadarProps {
  ratings: SkillRatings;
  previousRatings?: SkillRatings;
  size?: number;
  onSkillPress?: (key: SkillKey) => void;
}

export function SkillRadar({
  ratings,
  previousRatings,
  size = 260,
  onSkillPress,
}: SkillRadarProps) {
  const pad = 40;
  const svgSize = size + pad * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.46;

  const gridAngles = useMemo(
    () => SKILLS.map((_, i) => (360 / N) * i),
    [],
  );

  const currentPoints = useMemo(
    () => ratingsToPoints(ratings, cx, cy, maxR),
    [ratings, cx, cy, maxR],
  );

  const previousPoints = useMemo(
    () => previousRatings ? ratingsToPoints(previousRatings, cx, cy, maxR) : null,
    [previousRatings, cx, cy, maxR],
  );

  // Determine the dominant color from the average rating
  const avgRating = Object.values(ratings).reduce((s, v) => s + v, 0) / N;
  const fillColor = avgRating >= 2.5 ? palette.strong : avgRating >= 1.5 ? palette.secure : palette.developing;

  return (
    <View style={[styles.container, { width: svgSize, height: svgSize }]}>
      <Svg width={svgSize} height={svgSize}>
        {/* Grid rings */}
        {[1, 2, 3].map((level) => {
          const r = (level / LEVELS) * maxR;
          return (
            <Circle
              key={level}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={palette.border}
              strokeWidth={level === 3 ? 1.5 : 1}
              strokeDasharray={level < 3 ? "4 4" : undefined}
            />
          );
        })}

        {/* Axis lines */}
        {gridAngles.map((angle, i) => {
          const outer = polarToXY(angle, maxR, cx, cy);
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke={palette.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Previous assessment ghost polygon */}
        {previousPoints ? (
          <Polygon
            points={previousPoints}
            fill={palette.muted}
            fillOpacity={0.12}
            stroke={palette.muted}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        ) : null}

        {/* Current assessment polygon */}
        <Polygon
          points={currentPoints}
          fill={fillColor}
          fillOpacity={0.18}
          stroke={fillColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Skill axis labels */}
        {SKILLS.map(({ label }, i) => {
          const angle = (360 / N) * i;
          const { x, y } = polarToXY(angle, labelR, cx, cy);
          const lines = label.split("\n");
          const textAnchor =
            Math.abs(x - cx) < 4 ? "middle" : x < cx ? "end" : "start";
          const baseY = y - (lines.length - 1) * 7;
          return lines.map((line, li) => (
            <SvgText
              key={`${i}-${li}`}
              x={x}
              y={baseY + li * 14}
              textAnchor={textAnchor}
              fill={palette.inkMid}
              fontSize={11}
              fontWeight="600"
            >
              {line}
            </SvgText>
          ));
        })}

        {/* Vertex dots */}
        {SKILLS.map(({ key }, i) => {
          const angle = (360 / N) * i;
          const r = (ratings[key] / LEVELS) * maxR;
          const { x, y } = polarToXY(angle, r, cx, cy);
          const dotColor = ratingColor(ratings[key] as 1 | 2 | 3);
          return (
            <Circle key={key} cx={x} cy={y} r={4} fill={dotColor} stroke={palette.surface} strokeWidth={1.5} />
          );
        })}
      </Svg>

      {/* Invisible tap targets over each axis label */}
      {onSkillPress
        ? SKILLS.map(({ key }, i) => {
            const angle = (360 / N) * i;
            const { x, y } = polarToXY(angle, labelR, cx, cy);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`View ${SKILLS[i].label.replace("\n", " ")} detail`}
                onPress={() => onSkillPress(key)}
                style={[
                  styles.tapTarget,
                  {
                    left: x - 24,
                    top: y - 20,
                  },
                ]}
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  tapTarget: {
    position: "absolute",
    width: 48,
    height: 40,
  },
});
