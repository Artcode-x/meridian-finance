import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space, goldAlpha } from '../../../theme';
import { Surface, Text, Badge, PriceText } from '../../ui';

// ── 7-day outlook (статистическая оценка, не ИИ и не предсказание) ───────────

const fmtPct = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
const pctOfProb = (p) =>
  p < 0.01 ? '<1%' : p > 0.99 ? '>99%' : `${Math.round(p * 100)}%`;

const RangeAxis = ({ f }) => {
  const max = f.band95;
  const at = (v) => `${((v + max) / (2 * max)) * 100}%`;
  return (
    <View style={styles.axisWrap}>
      <View style={styles.axis}>
        <View style={styles.band95} />
        <View
          style={[
            styles.band68,
            { left: at(-f.band68), width: `${(f.band68 / max) * 100}%` },
          ]}
        />
        <View style={[styles.zero, { left: '50%' }]} />
      </View>
      <View style={styles.axisLabels}>
        <Text variant='small' color='down' tabular>
          {fmtPct(-f.band95)}
        </Text>
        <Text variant='small' color='tertiary'>
          now
        </Text>
        <Text variant='small' color='up' tabular>
          {fmtPct(f.band95)}
        </Text>
      </View>
    </View>
  );
};

const Prob = ({ label, value, tone }) => (
  <Surface level={2} radius='md' style={{ flex: 1 }}>
    <View style={styles.prob}>
      <Text variant='label' color='tertiary'>
        {label}
      </Text>
      <Text variant='h2' color={tone} tabular style={{ marginTop: 4 }}>
        {pctOfProb(value)}
      </Text>
    </View>
  </Surface>
);

const OutlookCard = ({ m }) => {
  const f = m.forecast;
  const calm = f.volatileShare < 0.05;

  return (
    <Surface variant='goldCase' radius='lg' style={{ marginBottom: space[4] }}>
      <View style={styles.inner}>
        <View style={styles.head}>
          <Ionicons name='analytics' size={16} color={colors.gold[400]} />
          <Text variant='label' color='gold' style={{ marginLeft: 6, flex: 1 }}>
            7-day outlook
          </Text>
          <Badge tone='neutral' label='Statistical estimate' />
        </View>

        {calm ? (
          <Text variant='caption' color='secondary' style={{ marginTop: space[3] }}>
            Your portfolio is almost entirely stablecoins, so there is very little price
            risk to estimate.
          </Text>
        ) : (
          <>
            <Text variant='caption' color='secondary' style={{ marginTop: space[3] }}>
              Typical range in a week, about two outcomes out of three
            </Text>
            <Text variant='h2' tabular style={{ marginTop: 2 }}>
              {fmtPct(-f.band68)} to {fmtPct(f.band68)}
            </Text>
            <View style={styles.valueRow}>
              <PriceText value={f.lowValue68} money variant='small' color='tertiary' />
              <Text variant='small' color='tertiary'>
                {' '}
                –{' '}
              </Text>
              <PriceText value={f.highValue68} money variant='small' color='tertiary' />
            </View>

            <RangeAxis f={f} />
            <Text variant='small' color='tertiary'>
              Dark band: likely range. Light band: wide range (about 19 in 20).
            </Text>

            <View style={styles.probRow}>
              <Prob label='Drop of 10% or more' value={f.pLoss10} tone='down' />
              <Prob label='Gain of 10% or more' value={f.pGain10} tone='up' />
            </View>
          </>
        )}

        <Text variant='small' color='tertiary' style={styles.method}>
          Method: today’s moves are blended with a typical crypto volatility of about 3.5%
          a day and scaled to 7 days. Stablecoins are excluded, and all other assets are
          assumed to move together. Real markets have fatter tails than this model, so
          bigger swings are possible. This is not a prediction or financial advice.
        </Text>
      </View>
    </Surface>
  );
};

// ── Signals (правила по данным портфеля) ─────────────────────────────────────

const Signal = ({ icon, title, text, tone }) => {
  const fg = tone === 'gold' ? colors.gold[400] : colors[tone].fg;
  return (
    <View style={styles.signal}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: tone === 'gold' ? goldAlpha(0.14) : colors[tone].bg },
        ]}
      >
        <Ionicons name={icon} size={14} color={fg} />
      </View>
      <View style={{ flex: 1, marginLeft: space[3] }}>
        <Text variant='bodyStrong'>{title}</Text>
        <Text variant='caption' color='secondary' style={{ marginTop: 2 }}>
          {text}
        </Text>
      </View>
    </View>
  );
};

const buildSignals = (m) => {
  const s = [];
  const top = m.assets[0];
  const conc = m.allocationAnalysis.concentration;

  if (conc > 40) {
    s.push({
      icon: 'scale-outline',
      tone: 'down',
      title: `${top.symbol.toUpperCase()} is ${conc.toFixed(0)}% of the portfolio`,
      text: `A 20% drop in this asset alone costs about ${(conc * 0.2).toFixed(1)}% of the total.`,
    });
  }
  if (m.totalAssets <= 2) {
    s.push({
      icon: 'add-circle-outline',
      tone: 'warning',
      title: 'Very few assets',
      text: 'With one or two holdings, a single bad day decides the whole result.',
    });
  }
  if (m.portfolioChange <= -3) {
    s.push({
      icon: 'trending-down-outline',
      tone: 'warning',
      title: `Down ${Math.abs(m.portfolioChange).toFixed(1)}% in 24 hours`,
      text: `${m.worstPerformer.symbol.toUpperCase()} moved the most. Check whether the drop is market-wide or specific to one asset.`,
    });
  } else if (m.portfolioChange >= 3) {
    s.push({
      icon: 'trending-up-outline',
      tone: 'up',
      title: `Up ${m.portfolioChange.toFixed(1)}% in 24 hours`,
      text: `${m.bestPerformer.symbol.toUpperCase()} led the move. Strong days are a common moment to review weights.`,
    });
  }
  if (m.riskMetrics.volatility > 8) {
    s.push({
      icon: 'pulse-outline',
      tone: 'warning',
      title: 'Unusually active day',
      text: 'The weighted average move across your holdings is large compared with a typical day.',
    });
  }
  if (!s.length) {
    s.push({
      icon: 'checkmark-circle-outline',
      tone: 'up',
      title: 'No warning signs today',
      text: 'Weights and 24h moves are within normal ranges.',
    });
  }
  return s.slice(0, 4);
};

const RecommendSection = ({ portfolioMetrics: m }) => (
  <>
    <OutlookCard m={m} />
    <Surface variant='goldCase' radius='lg' style={{ marginBottom: space[4] }}>
      <View style={styles.inner}>
        <View style={styles.head}>
          <Ionicons name='bulb' size={16} color={colors.gold[400]} />
          <Text variant='label' color='gold' style={{ marginLeft: 6 }}>
            Signals
          </Text>
        </View>
        {buildSignals(m).map((sig) => (
          <Signal key={sig.title} {...sig} />
        ))}
      </View>
    </Surface>
  </>
);

const styles = StyleSheet.create({
  inner: { padding: space[4] },
  head: { flexDirection: 'row', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  axisWrap: { marginTop: space[4], marginBottom: space[2] },
  axis: { height: 14, justifyContent: 'center' },
  band95: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: goldAlpha(0.14),
  },
  band68: { position: 'absolute', height: 8, backgroundColor: goldAlpha(0.5) },
  zero: { position: 'absolute', width: 1, height: 14, backgroundColor: colors.gold[400] },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  probRow: { flexDirection: 'row', gap: space[2], marginTop: space[4] },
  prob: { padding: space[3] },
  method: {
    marginTop: space[4],
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line.default,
  },
  signal: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: space[2] },
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});

export default RecommendSection;
