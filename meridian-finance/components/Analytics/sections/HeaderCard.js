import React from 'react';
import { View, StyleSheet } from 'react-native';
import { space, chartColorAt } from '../../../theme';
import { Surface, Text, PriceText, PercentBadge, Badge } from '../../ui';

const STRIP_MAX = 6;
const formatSignedMoney = (n, digits = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: digits })} $`;

// Верхняя карточка: стоимость, изменение за 24 часа, полоса структуры портфеля
const HeaderCard = ({ portfolioMetrics: m }) => {
  const main = m.assets.slice(0, STRIP_MAX);
  const rest = m.assets.slice(STRIP_MAX).reduce((s, a) => s + a.allocation, 0);

  return (
    <Surface
      variant='goldCase'
      radius='xl'
      shadow='card'
      style={{ marginBottom: space[4] }}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text variant='label' color='gold'>
            Portfolio value
          </Text>
          <Badge tone='info' label='Last 24 hours' />
        </View>

        <PriceText value={m.totalValue} money variant='display' />

        <View style={styles.changeRow}>
          <PercentBadge value={m.portfolioChange} size='md' />
          <Text
            variant='caption'
            color={m.periodProfit >= 0 ? 'up' : 'down'}
            tabular
            style={{ marginLeft: space[2] }}
          >
            {formatSignedMoney(m.periodProfit)}
          </Text>
        </View>

        <View style={styles.strip}>
          {main.map((a, i) => (
            <View
              key={a.id}
              style={{
                flex: a.allocation,
                backgroundColor: chartColorAt(i),
                marginRight: 2,
              }}
            />
          ))}
          {rest > 0 && (
            <View style={{ flex: rest, backgroundColor: chartColorAt(STRIP_MAX) }} />
          )}
        </View>
        <View style={styles.legend}>
          {main.slice(0, 3).map((a, i) => (
            <View key={a.id} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: chartColorAt(i) }]} />
              <Text variant='small' color='secondary' tabular>
                {a.symbol.toUpperCase()} {a.allocation.toFixed(0)}%
              </Text>
            </View>
          ))}
          <Text variant='small' color='tertiary'>
            {m.totalAssets} asset{m.totalAssets === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  inner: { padding: space[4] },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: space[3] },
  strip: { flexDirection: 'row', height: 6, marginTop: space[5] },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[3],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, marginRight: 6 },
});

export default HeaderCard;
