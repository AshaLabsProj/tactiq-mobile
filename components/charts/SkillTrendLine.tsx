/**
 * SkillTrendLine — SVG line chart for development over time
 *
 * Shows overall average rating or a specific skill over time.
 * Time range: 4w / 3m / season
 * Annotations: assessment dots with date labels on tap.
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { palette, ratingColor, spacing, typography } from "@/lib/palette";
import type { Assessment, SkillKey } from "@/types/models";
import { averageRatings } from "@/lib/insights";

type TimeRange = "4w" | "3m" | "season";

interface DataPoint {
  date: Date;
  value: number;
  assessmentId: string;
}

function filterByRange(assessments: Assessment[], range: TimeRange): Assessment[] {
  const now = Date.now();
  const cutoff =
    range === "4w"     ? now - 28 * 86_400_000 :
    range === "3m"     ? now - 90 * 86_400_000 :
    0; // season = all
  return assessments.filter((a) => Date.parse(a.createdAt) >= cutoff);
}

function buildPoints(assessments: Assessment[], skillKey?: SkillKey): DataPoint[] {
  return [...assessments]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((a) => ({
      date: new Date(a.createdAt),
      value: skillKey ? a.ratings[skillKey] : averageRatings(a.ratings),
      assessmentId: a.id,
    }));
}

function buildPath(points: DataPoint[], w: number, h: number, pad: number): string {
  if (points.length < 2) return "";
  const minD = points[0].date.getTime();
  const maxD = points[points.length - 1].date.getTime();
  const rangeD = maxD - minD || 1;
  const toX = (d: Date) => pad + ((d.getTime() - minD) / rangeD) * (w - pad * 2);
  const toY = (v: number) => h - pad - ((v - 1) / 2) * (h - pad * 2);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.date).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(" ");
}

function buildAreaPath(points: DataPoint[], w: number, h: number, pad: number): string {
  if (points.length < 2) return "";
  const minD = points[0].date.getTime();
  const maxD = points[points.length - 1].date.getTime();
  const rangeD = maxD - minD || 1;
  const toX = (d: Date) => pad + ((d.getTime() - minD) / rangeD) * (w - pad * 2);
  const toY = (v: number) => h - pad - ((v - 1) / 2) * (h - pad * 2);
  const bottom = h - pad;
  const pts = points.map((p) => `${toX(p.date).toFixed(1)},${toY(p.value).toFixed(1)}`);
  return `M${toX(points[0].date).toFixed(1)},${bottom} L${pts.join(" L")} L${toX(points[points.length - 1].date).toFixed(1)},${bottom} Z`;
}

interface SkillTrendLineProps {
  assessments: Assessment[];
  skillKey?: SkillKey;
  width?: number;
  height?: number;
  showRangeSelector?: boolean;
}

export function SkillTrendLine({
  assessments,
  skillKey,
  width = 320,
  height = 160,
  showRangeSelector = true,
}: SkillTrendLineProps) {
  const [range, setRange] = useState<TimeRange>("3m");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const filtered = filterByRange(assessments, range);
  const points = buildPoints(filtered, skillKey);

  const pad = 24;
  const linePath = buildPath(points, width, height, pad);
  const areaPath = buildAreaPath(points, width, height, pad);

  const minD = points.length ? points[0].date.getTime() : 0;
  const maxD = points.length ? points[points.length - 1].date.getTime() : 1;
  const rangeD = maxD - minD || 1;
  const toX = (d: Date) => pad + ((d.getTime() - minD) / rangeD) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - 1) / 2) * (height - pad * 2);

  const lineColor = palette.primary;

  const selectedPoint = selectedIdx !== null ? points[selectedIdx] : null;

  return (
    <View style={styles.container}>
      {showRangeSelector ? (
        <View style={styles.rangeRow}>
          {(["4w", "3m", "season"] as TimeRange[]).map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              onPress={() => { setRange(r); setSelectedIdx(null); }}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                {r === "4w" ? "4 Weeks" : r === "3m" ? "3 Months" : "Season"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {points.length < 2 ? (
        <View style={[styles.empty, { width, height }]}>
          <Text style={styles.emptyText}>
            {assessments.length === 0
              ? "No assessments yet"
              : "Not enough data for this range"}
          </Text>
        </View>
      ) : (
        <View style={{ width, height }}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
                <Stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Y-axis grid lines at 1, 2, 3 */}
            {[1, 2, 3].map((v) => {
              const y = toY(v);
              return (
                <Line
                  key={v}
                  x1={pad}
                  y1={y}
                  x2={width - pad}
                  y2={y}
                  stroke={palette.border}
                  strokeWidth={1}
                  strokeDasharray={v === 1 || v === 3 ? undefined : "4 4"}
                />
              );
            })}

            {/* Y-axis labels */}
            {[
              { v: 1, label: "Dev" },
              { v: 2, label: "Sec" },
              { v: 3, label: "Str" },
            ].map(({ v, label }) => (
              <SvgText
                key={v}
                x={pad - 4}
                y={toY(v) + 4}
                textAnchor="end"
                fill={palette.faint}
                fontSize={9}
                fontWeight="600"
              >
                {label}
              </SvgText>
            ))}

            {/* Area fill */}
            <Path d={areaPath} fill="url(#areaGrad)" />

            {/* Line */}
            <Path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {points.map((p, i) => {
              const x = toX(p.date);
              const y = toY(p.value);
              const dotColor = ratingColor(Math.round(p.value) as 1 | 2 | 3);
              return (
                <Circle
                  key={p.assessmentId}
                  cx={x}
                  cy={y}
                  r={i === selectedIdx ? 6 : 4}
                  fill={dotColor}
                  stroke={palette.surface}
                  strokeWidth={2}
                  onPress={() => setSelectedIdx(i === selectedIdx ? null : i)}
                />
              );
            })}

            {/* Selected point tooltip */}
            {selectedPoint ? (() => {
              const x = toX(selectedPoint.date);
              const y = toY(selectedPoint.value);
              const label = selectedPoint.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const valLabel = selectedPoint.value >= 2.5 ? "Strong" : selectedPoint.value >= 1.5 ? "Secure" : "Developing";
              const boxW = 72;
              const boxH = 28;
              const bx = Math.min(Math.max(x - boxW / 2, pad), width - pad - boxW);
              const by = y - boxH - 8;
              return (
                <>
                  <Rect x={bx} y={by} width={boxW} height={boxH} rx={6} fill={palette.navy} />
                  <SvgText x={bx + boxW / 2} y={by + 11} textAnchor="middle" fill={palette.white} fontSize={9} fontWeight="700">
                    {valLabel}
                  </SvgText>
                  <SvgText x={bx + boxW / 2} y={by + 22} textAnchor="middle" fill={palette.matchMuted} fontSize={9}>
                    {label}
                  </SvgText>
                </>
              );
            })() : null}
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  rangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  rangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
  },
  rangeBtnActive: { backgroundColor: palette.navy },
  rangeBtnText: { ...typography.caption, color: palette.muted, fontWeight: "600" as const },
  rangeBtnTextActive: { color: palette.white },
  empty: { alignItems: "center", justifyContent: "center" },
  emptyText: { ...typography.caption, color: palette.muted },
});
