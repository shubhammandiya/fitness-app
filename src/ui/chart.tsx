import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useTheme } from '@/ui/theme-provider';

type Props = {
  values: number[];
  width: number;
  height?: number;
  /** Draw a filled area under the line (kept very subtle in this design). */
  showDots?: boolean;
};

/**
 * Minimal line chart: no axes, no grid, one accent line. Numbers are labelled by
 * the caller (min/max/last), because a gym chart needs "what was it last time",
 * not a graduated scale.
 */
export default function LineChart({ values, width, height = 120, showDots = true }: Props) {
  const t = useTheme();
  if (values.length === 0) return null;

  const pad = 6;
  const w = Math.max(1, width);
  const h = Math.max(1, height);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return { x, y };
  });

  const poly = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h}>
        {points.length > 1 ? (
          <Polyline points={poly} fill="none" stroke={t.acc} strokeWidth={2} strokeLinejoin="round" />
        ) : null}
        {values.length === 1 ? (
          <Line x1={0} y1={points[0].y} x2={w} y2={points[0].y} stroke={t.acc} strokeWidth={2} />
        ) : null}
        {points.map((p, i) =>
          showDots && (i === points.length - 1 || values.length <= 12) ? (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 3.5 : 2}
              fill={i === points.length - 1 ? t.acc : t.bg}
              stroke={t.acc}
              strokeWidth={1.5}
            />
          ) : null
        )}
      </Svg>
    </View>
  );
}
