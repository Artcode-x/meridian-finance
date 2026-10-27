import React, { useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, space } from '../../theme';
import { Text } from '../ui';

const { width: SCREEN_W } = Dimensions.get('window');

// chart-kit использует paddingRight как левый отступ под подписи оси Y
const PADDING_RIGHT = 60;
// Минимальная ширина слота под одну подпись оси X
const X_SLOT_PX = 48;
const MIN_X_TICKS = 3;
const MAX_X_TICKS = 5;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const defaultFormatY = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  if (Math.abs(num) < 0.000001 && num !== 0) return num.toExponential(2);
  if (Math.abs(num) < 0.001 && num !== 0) return num.toFixed(6);
  if (Math.abs(num) < 1) return num.toFixed(4);
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 1 : 2)}k`;
  return num.toFixed(2);
};

// Линейный график в золотой гамме поверх react-native-chart-kit
export const GoldLineChart = ({
  prices,
  labels,
  width = SCREEN_W - 40,
  height = 200,
  tone,
  formatY,
}) => {
  const data = prices || [];
  const isUp = data.length > 1 ? data[data.length - 1] >= data[0] : true;
  const resolvedTone = tone || (isUp ? 'up' : 'down');
  const lineColor = resolvedTone === 'gold' ? colors.gold[500] : colors[resolvedTone].fg;

  // Подписи оси X: от 3 до 5 штук на равном расстоянии.
  // chart-kit ставит i-ю подпись из n на долю i/n ширины, поэтому берём
  // метку из точки i * len / n — ровно там, где её рисует график.
  const xLabels = useMemo(() => {
    if (!labels?.length) return [];
    const plotWidth = width - PADDING_RIGHT;
    const count = Math.min(
      labels.length,
      clamp(Math.floor(plotWidth / X_SLOT_PX), MIN_X_TICKS, MAX_X_TICKS),
    );
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(labels.length - 1, Math.round((i * labels.length) / count));
      return labels[idx];
    });
  }, [labels, width]);

  const yFormatter = useMemo(
    () => (formatY ? (v) => formatY(parseFloat(v)) : defaultFormatY),
    [formatY],
  );

  const hasSmall = data.length && Math.min(...data) < 0.001;

  if (!data.length) return null;

  return (
    <View style={styles.wrap}>
      <LineChart
        data={{
          labels: xLabels,
          datasets: [{ data, strokeWidth: 2, color: () => lineColor }],
        }}
        width={width}
        height={height}
        withDots={false}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        withShadow
        fromZero={false}
        formatYLabel={yFormatter}
        segments={4}
        bezier
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: colors.bg[2],
          backgroundGradientTo: colors.bg[2],
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          fillShadowGradientFrom: lineColor,
          fillShadowGradientFromOpacity: 0.22,
          fillShadowGradientTo: lineColor,
          fillShadowGradientToOpacity: 0,
          decimalPlaces: hasSmall ? 6 : 2,
          color: () => lineColor,
          labelColor: () => colors.text.tertiary,
          propsForBackgroundLines: {
            stroke: colors.line.default,
            strokeDasharray: '4,6',
          },
          propsForLabels: { fontSize: 9, fontFamily: 'Manrope_500Medium' },
        }}
        paddingRight={PADDING_RIGHT}
        style={{ marginLeft: -4 }}
      />
      {hasSmall ? (
        <Text variant='small' color='tertiary' style={{ marginLeft: space[4] }}>
          High-precision values
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({ wrap: { overflow: 'hidden' } });

export default GoldLineChart;
