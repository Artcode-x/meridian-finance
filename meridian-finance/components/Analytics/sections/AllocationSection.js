import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, space, chartColorAt, goldAlpha } from '../../../theme';
import {
  Accordion,
  Text,
  PriceText,
  PercentBadge,
  PressableScale,
  Badge,
} from '../../ui';

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};
const segment = (cx, cy, rOuter, rInner, start, end) => {
  const e = Math.min(end, start + 359.99);
  const [sx, sy] = polar(cx, cy, rOuter, start);
  const [ex, ey] = polar(cx, cy, rOuter, e);
  const [isx, isy] = polar(cx, cy, rInner, start);
  const [iex, iey] = polar(cx, cy, rInner, e);
  const large = e - start > 180 ? 1 : 0;
  return `M${sx} ${sy} A${rOuter} ${rOuter} 0 ${large} 1 ${ex} ${ey} L${iex} ${iey} A${rInner} ${rInner} 0 ${large} 0 ${isx} ${isy} Z`;
};

const MAX_SLICES = 7;
const SIZE = 220;

const AllocationSection = ({ portfolioMetrics: m }) => {
  const [selected, setSelected] = useState(null);
  const c = SIZE / 2;

  const { slices, other } = useMemo(() => {
    const main = m.assets.slice(0, MAX_SLICES);
    const rest = m.assets.slice(MAX_SLICES);
    const slices = main.map((a, i) => ({ ...a, color: chartColorAt(i) }));
    const otherAlloc = rest.reduce((s, a) => s + a.allocation, 0);
    if (otherAlloc > 0) {
      slices.push({
        id: 'other',
        symbol: 'Other',
        name: `${rest.length} assets`,
        allocation: otherAlloc,
        value: rest.reduce((s, a) => s + a.value, 0),
        color: chartColorAt(MAX_SLICES),
        isOther: true,
      });
    }
    return { slices, other: rest };
  }, [m.assets]);

  const active = slices.find((s) => s.id === selected);
  const toggle = (id) => setSelected(selected === id ? null : id);

  // Углы считаем заранее, без мутации переменной во время рендера
  let acc = 0;
  const arcs = slices.map((s) => {
    const start = acc;
    const sweep = (s.allocation / 100) * 360;
    acc += sweep;
    return { s, start, sweep };
  });

  const level =
    m.allocationAnalysis.concentration > 40
      ? 'Concentrated'
      : m.allocationAnalysis.concentration > 25
        ? 'Moderate'
        : 'Balanced';

  return (
    <Accordion
      title='Allocation'
      subtitle={`${level} · ${m.effectiveAssets.toFixed(1)} effective assets`}
      icon='pie-chart'
      style={{ marginBottom: space[4] }}
    >
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={c}
            cy={c}
            r={c - 14}
            stroke={colors.surface[2]}
            strokeWidth={28}
            fill='none'
          />
          {arcs.map(({ s, start, sweep }) => {
            const gap = slices.length > 1 ? 1.5 : 0;
            const on = !selected || selected === s.id;
            return (
              <Path
                key={s.id}
                d={segment(c, c, c - 2, c - 30, start + gap, start + sweep - gap)}
                fill={s.color}
                opacity={on ? 1 : 0.3}
                onPress={() => toggle(s.id)}
              />
            );
          })}
          <Circle
            cx={c}
            cy={c}
            r={c - 34}
            fill={colors.bg[2]}
            stroke={goldAlpha(0.3)}
            strokeWidth={1}
          />
        </Svg>
        <View style={styles.center} pointerEvents='none'>
          {active ? (
            <>
              <Text variant='h3' align='center'>
                {active.symbol.toUpperCase()}
              </Text>
              <Text variant='h2' color='gold' tabular>
                {active.allocation.toFixed(1)}%
              </Text>
              <PriceText value={active.value} money variant='small' color='tertiary' />
            </>
          ) : (
            <>
              <PriceText value={m.totalValue} money variant='h3' />
              <Text variant='label' color='tertiary'>
                Total
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((s) => (
          <PressableScale
            key={s.id}
            haptic='selection'
            scaleTo={0.99}
            onPress={() => toggle(s.id)}
            style={[
              styles.legendRow,
              selected === s.id && { backgroundColor: goldAlpha(0.08) },
            ]}
          >
            <View style={styles.legendTop}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <View style={{ flex: 1, marginLeft: space[3] }}>
                <Text variant='bodyStrong'>{s.symbol.toUpperCase()}</Text>
                <Text variant='small' color='tertiary' numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant='mono' color='gold'>
                  {s.allocation.toFixed(1)}%
                </Text>
                {!s.isOther ? (
                  <PercentBadge value={s.priceChange} />
                ) : (
                  <PriceText value={s.value} money variant='small' color='tertiary' />
                )}
              </View>
            </View>
            <View style={styles.track}>
              <View
                style={{
                  width: `${Math.min(100, s.allocation)}%`,
                  height: 2,
                  backgroundColor: s.color,
                }}
              />
            </View>
          </PressableScale>
        ))}
        {other.length > 0 && (
          <View style={styles.otherWrap}>
            {other.map((a) => (
              <Badge
                key={a.id}
                tone='neutral'
                label={`${a.symbol.toUpperCase()} ${a.allocation.toFixed(1)}%`}
              />
            ))}
          </View>
        )}
      </View>
    </Accordion>
  );
};

const styles = StyleSheet.create({
  chartWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: space[2] },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  legend: { marginTop: space[3] },
  legendRow: { paddingVertical: space[2], paddingHorizontal: space[2] },
  legendTop: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12 },
  track: { height: 2, marginTop: space[2], backgroundColor: colors.surface[3] },
  otherWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[2],
    paddingHorizontal: space[2],
  },
});

export default AllocationSection;
