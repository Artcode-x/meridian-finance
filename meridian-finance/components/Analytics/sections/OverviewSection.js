import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space, goldAlpha } from '../../../theme';
import { Accordion, Surface, Text, PercentBadge } from '../../ui';

const formatSignedMoney = (n, digits = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: digits })} $`;

const Performer = ({ label, icon, asset, tone }) => (
  <Surface level={2} radius='md' style={{ flex: 1 }}>
    <View style={styles.perf}>
      <View style={styles.perfHead}>
        <Ionicons
          name={icon}
          size={13}
          color={tone === 'up' ? colors.up.fg : colors.down.fg}
        />
        <Text variant='label' color='tertiary' style={{ marginLeft: 5 }}>
          {label}
        </Text>
      </View>
      <Text variant='h3' style={{ marginTop: space[2] }}>
        {asset?.symbol?.toUpperCase() || '—'}
      </Text>
      <PercentBadge value={asset?.priceChange} style={{ marginTop: 4 }} />
    </View>
  </Surface>
);

// Вклад каждого актива в результат портфеля за 24 часа
const Contribution = ({ asset, maxAbs }) => {
  const up = asset.pnl >= 0;
  const width = `${Math.max(3, (Math.abs(asset.pnl) / maxAbs) * 100)}%`;
  const color = up ? colors.up.fg : colors.down.fg;
  return (
    <View style={styles.contribRow}>
      <Text variant='bodyStrong' style={styles.contribSymbol}>
        {asset.symbol.toUpperCase()}
      </Text>
      <View style={styles.axis}>
        <View style={styles.half}>
          {!up && (
            <View
              style={[
                styles.bar,
                { width, backgroundColor: color, alignSelf: 'flex-end' },
              ]}
            />
          )}
        </View>
        <View style={styles.zero} />
        <View style={styles.half}>
          {up && <View style={[styles.bar, { width, backgroundColor: color }]} />}
        </View>
      </View>
      <Text
        variant='small'
        color={up ? 'up' : 'down'}
        tabular
        style={styles.contribValue}
      >
        {formatSignedMoney(asset.pnl, 0)}
      </Text>
    </View>
  );
};

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text variant='h2' color='gold' tabular>
      {value}
    </Text>
    <Text variant='label' color='tertiary'>
      {label}
    </Text>
  </View>
);

const OverviewSection = ({ portfolioMetrics: m }) => {
  const shown = m.contributors.slice(0, 6);
  const maxAbs = Math.max(...shown.map((a) => Math.abs(a.pnl)), 1e-9);

  return (
    <Accordion
      title='Last 24 hours'
      subtitle='Leaders, laggards and what moved the portfolio'
      icon='stats-chart'
      defaultOpen
      style={{ marginBottom: space[4] }}
    >
      <View style={styles.row}>
        <Performer label='Best' icon='trending-up' asset={m.bestPerformer} tone='up' />
        <Performer
          label='Worst'
          icon='trending-down'
          asset={m.worstPerformer}
          tone='down'
        />
      </View>

      <Text
        variant='label'
        color='tertiary'
        style={{ marginTop: space[4], marginBottom: space[2] }}
      >
        Contribution to result
      </Text>
      {shown.map((a) => (
        <Contribution key={a.id} asset={a} maxAbs={maxAbs} />
      ))}

      <View style={styles.stats}>
        <Stat value={m.totalAssets} label='Assets' />
        <View style={styles.divider} />
        <Stat value={`${Math.round(m.allocationAnalysis.top3)}%`} label='Top 3' />
        <View style={styles.divider} />
        <Stat value={m.effectiveAssets.toFixed(1)} label='Effective' />
      </View>
    </Accordion>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2] },
  perf: { padding: space[3] },
  perfHead: { flexDirection: 'row', alignItems: 'center' },
  contribRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  contribSymbol: { width: 52 },
  axis: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 14 },
  half: { flex: 1, height: 14, justifyContent: 'center' },
  zero: { width: StyleSheet.hairlineWidth, height: 14, backgroundColor: goldAlpha(0.5) },
  bar: { height: 8 },
  contribValue: { width: 72, textAlign: 'right' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[4],
    padding: space[3],
    backgroundColor: goldAlpha(0.06),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.2),
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: goldAlpha(0.3),
  },
});

export default OverviewSection;
