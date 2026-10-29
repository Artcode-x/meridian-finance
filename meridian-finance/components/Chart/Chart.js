import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setChartDaysMain } from '../../store/reducersSlice';
import { mainDaySelector } from '../../store/toolkitSelectors';
import { space } from '../../theme';
import {
  DetailHeader,
  StatsGrid,
  TimeframeChips,
  ChartCard,
  GoldLineChart,
} from '../CoinDetail';
import { Sheet, Text, Badge, SectionHeader, formatPrice } from '../ui';

import { formatAxisPrice, signedPct } from './utils/chartFormat';

const TIMEFRAMES = [
  { label: '24H', value: 1 },
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
];

const compact = (num) => {
  if (num == null || Number.isNaN(num)) return '—';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const toneOf = (v) => (v == null ? undefined : v >= 0 ? 'up' : 'down');

// Детальный лист монеты с рынка: линейный график + статистика
export const Chart = ({
  selectedCoinData: coin,
  chartData,
  modalVisible,
  closeModal,
  isloading,
}) => {
  const chartDays = useSelector(mainDaySelector);
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();

  const chartWidth = width - 48;
  const periodLabel = TIMEFRAMES.find((t) => t.value === chartDays)?.label;

  // Тренд + максимум/минимум за выбранный период
  const trend = useMemo(() => {
    const p = chartData?.prices;
    if (!p || p.length < 2) return null;
    const first = p[0];
    const last = p[p.length - 1];
    return {
      isUp: last >= first,
      pct: Math.abs(((last - first) / first) * 100).toFixed(2),
      high: Math.max(...p),
      low: Math.min(...p),
    };
  }, [chartData]);

  const stats = coin
    ? [
        {
          label: 'Market cap',
          value: `$${compact(coin.market_cap)}`,
          icon: 'layers-outline',
        },
        {
          label: 'Volume 24h',
          value: `$${compact(coin.total_volume)}`,
          icon: 'swap-vertical-outline',
        },
        {
          label: '24h change',
          value: signedPct(coin.price_change_percentage_24h),
          icon: 'time-outline',
          tone: toneOf(coin.price_change_percentage_24h),
        },
        {
          label: '7d change',
          value: signedPct(coin.price_change_percentage_7d_in_currency),
          icon: 'calendar-outline',
          tone: toneOf(coin.price_change_percentage_7d_in_currency),
        },
        {
          label: '24h High',
          value: formatPrice(coin.high_24h),
          icon: 'arrow-up',
          tone: 'up',
        },
        {
          label: '24h Low',
          value: formatPrice(coin.low_24h),
          icon: 'arrow-down',
          tone: 'down',
        },
        {
          label: 'All-time high',
          value: formatPrice(coin.ath),
          icon: 'trophy-outline',
          tone: 'gold',
        },
        {
          label: 'From ATH',
          value: signedPct(coin.ath_change_percentage),
          icon: 'trending-down-outline',
          tone: toneOf(coin.ath_change_percentage),
        },
      ]
    : [];

  const hasSupply =
    coin &&
    (coin.circulating_supply != null ||
      coin.total_supply != null ||
      coin.max_supply != null);

  const supply = hasSupply
    ? [
        { label: 'Circulating', value: compact(coin.circulating_supply) },
        { label: 'Total', value: compact(coin.total_supply) },
        { label: 'Max', value: coin.max_supply ? compact(coin.max_supply) : '∞' },
      ]
    : [];

  return (
    <Sheet visible={modalVisible} onClose={closeModal} snapHeight='full'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <DetailHeader coin={coin} onClose={closeModal} />

        <View style={styles.section}>
          <TimeframeChips
            options={TIMEFRAMES}
            value={chartDays}
            onChange={(v) => dispatch(setChartDaysMain(v))}
          />
        </View>

        <View style={styles.section}>
          <ChartCard
            title='Price'
            subtitle={`Last ${periodLabel}`}
            loading={isloading}
            empty={!chartData?.prices?.length}
            right={
              trend && !isloading ? (
                <Badge
                  tone={trend.isUp ? 'up' : 'down'}
                  icon={trend.isUp ? 'trending-up' : 'trending-down'}
                  label={`${trend.isUp ? '+' : '−'}${trend.pct}%`}
                />
              ) : null
            }
            footer={
              trend && !isloading ? (
                <View style={styles.range}>
                  <View>
                    <Text variant='small' color='tertiary'>
                      Period low
                    </Text>
                    <Text variant='caption'>{formatPrice(trend.low)}</Text>
                  </View>
                  <View style={styles.rangeRight}>
                    <Text variant='small' color='tertiary'>
                      Period high
                    </Text>
                    <Text variant='caption'>{formatPrice(trend.high)}</Text>
                  </View>
                </View>
              ) : null
            }
          >
            {/* Подписи оси X передаём как есть: их формат и прореживание
                обрабатывает GoldLineChart */}
            <GoldLineChart
              prices={chartData?.prices}
              labels={chartData?.labelDate}
              formatY={formatAxisPrice}
              width={chartWidth}
              height={210}
            />
          </ChartCard>
        </View>

        <View style={styles.section}>
          <SectionHeader title='Statistics' />
          <StatsGrid items={stats} />
        </View>

        {hasSupply && (
          <View style={styles.section}>
            <SectionHeader title='Supply' />
            <StatsGrid items={supply} />
          </View>
        )}

        <Text
          variant='small'
          color='tertiary'
          align='center'
          style={{ marginTop: space[4] }}
        >
          Market data provided by CoinGecko
        </Text>
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: space[8] },
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[2],
  },
  rangeRight: { alignItems: 'flex-end' },
});

export default Chart;
