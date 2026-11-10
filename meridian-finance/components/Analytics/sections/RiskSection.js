import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../../../theme';
import { Accordion, ArcGauge, Text, Surface } from '../../ui';

const formatSignedMoney = (n, digits = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: digits })} $`;

const Meter = ({ label, display, ratio, tone, hint }) => {
  const fg = colors[tone]?.fg || colors.gold[500];
  return (
    <Surface level={2} radius='md' style={{ flex: 1 }}>
      <View style={styles.meter}>
        <Text variant='label' color='tertiary'>
          {label}
        </Text>
        <Text variant='h3' color={fg} tabular style={{ marginTop: 4 }}>
          {display}
        </Text>
        <View style={styles.track}>
          <View
            style={{
              height: 3,
              width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
              backgroundColor: fg,
            }}
          />
        </View>
        <Text variant='small' color='tertiary' style={{ marginTop: 6 }}>
          {hint}
        </Text>
      </View>
    </Surface>
  );
};

const RiskSection = ({ portfolioMetrics: m }) => {
  const { health } = m;
  const { volatility: vol, diversificationScore: div } = m.riskMetrics;
  const conc = m.allocationAnalysis.concentration;
  const label = health > 70 ? 'Balanced' : health > 40 ? 'Moderate risk' : 'High risk';
  const tone = health > 70 ? 'up' : health > 40 ? 'warning' : 'down';

  return (
    <Accordion
      title='Risk'
      subtitle={label}
      icon='shield-checkmark'
      style={{ marginBottom: space[4] }}
    >
      <View style={{ alignItems: 'center', marginBottom: space[4] }}>
        <ArcGauge
          value={health}
          size={180}
          label='Portfolio health'
          color={colors[tone].fg}
          stops={[colors.down.fg, colors.warning.fg, colors.up.fg]}
        />
      </View>

      <View style={styles.row}>
        <Meter
          label='24h swing'
          display={`${vol.toFixed(1)}%`}
          ratio={vol / 15}
          tone={vol > 8 ? 'down' : vol > 4 ? 'warning' : 'up'}
          hint={vol > 8 ? 'Very active' : vol > 4 ? 'Moderate' : 'Calm'}
        />
        <Meter
          label='Diversity'
          display={`${div}`}
          ratio={div / 100}
          tone={div > 70 ? 'up' : div > 40 ? 'warning' : 'down'}
          hint={div > 70 ? 'Well spread' : div > 40 ? 'Could improve' : 'Concentrated'}
        />
        <Meter
          label='Top asset'
          display={`${conc.toFixed(0)}%`}
          ratio={conc / 100}
          tone={conc > 40 ? 'down' : conc > 25 ? 'warning' : 'up'}
          hint={conc > 40 ? 'Heavy weight' : conc > 25 ? 'Noticeable' : 'Healthy'}
        />
      </View>

      <Text
        variant='label'
        color='tertiary'
        style={{ marginTop: space[4], marginBottom: space[2] }}
      >
        Stress test
      </Text>
      <Surface level={2} radius='md'>
        {m.stress.map((s, i) => (
          <View key={s.key} style={[styles.stressRow, i > 0 && styles.stressDivider]}>
            <Text variant='caption' color='secondary' style={{ flex: 1 }}>
              {s.label}
            </Text>
            <Text variant='small' color='down' tabular style={{ marginRight: space[3] }}>
              {formatSignedMoney(s.loss, 0)}
            </Text>
            <Text
              variant='bodyStrong'
              color='down'
              tabular
              style={{ width: 62, textAlign: 'right' }}
            >
              {s.change.toFixed(1)}%
            </Text>
          </View>
        ))}
      </Surface>
      <Text variant='small' color='tertiary' style={{ marginTop: space[2] }}>
        Simple arithmetic on current weights, not a forecast.
      </Text>
    </Accordion>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2] },
  meter: { padding: space[3] },
  track: {
    height: 3,
    backgroundColor: colors.surface[3],
    marginTop: space[2],
    overflow: 'hidden',
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[3],
  },
  stressDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line.default,
  },
});

export default RiskSection;
