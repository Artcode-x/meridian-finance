import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { coinSelector, userAssetsSelector } from '../../store/toolkitSelectors';
import { space } from '../../theme';
import { Screen, ScreenHeader, EmptyState, Text } from '../ui';
import AllocationSection from './sections/AllocationSection';
import HeaderCard from './sections/HeaderCard';
import OverviewSection from './sections/OverviewSection';
import RecommendSection from './sections/RecommendSection';
import RiskSection from './sections/RiskSection';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const STABLES = ['usdt', 'usdc', 'dai', 'busd', 'fdusd', 'tusd', 'usde', 'usdd', 'pyusd'];

// Функция нормального распределения (аппроксимация Абрамовица-Стегуна)
const normalCdf = (z) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
};

/**
 * Оценка диапазона на 7 дней.
 * Дневная σ = смесь типичной крипто-волатильности (3.5%) и сегодняшнего движения
 * (E|x| ≈ 0.8σ, поэтому |x|·1.25). Масштабируем на √7. Стейблкоины не считаем.
 * Корреляцию активов принимаем равной 1: честнее для крипторынка, чем «выгода диверсификации».
 */
const buildForecast = (assets, totalValue) => {
  const volatile = assets.filter((a) => !STABLES.includes(a.symbol.toLowerCase()));
  const share = volatile.reduce((s, a) => s + a.allocation, 0) / 100;
  if (share <= 0) {
    return {
      volatileShare: 0,
      band68: 0,
      band95: 0,
      pLoss10: 0,
      pGain10: 0,
      lowValue68: totalValue,
      highValue68: totalValue,
    };
  }
  const observed =
    (volatile.reduce((s, a) => s + Math.abs(a.priceChange) * a.allocation, 0) /
      (share * 100)) *
    1.25;
  const sigmaDay = 0.6 * 3.5 + 0.4 * observed;
  const sigma7 = sigmaDay * Math.sqrt(7) * share;

  const band68 = clamp(sigma7, 0.1, 90);
  const band95 = clamp(sigma7 * 1.96, 0.2, 95);
  return {
    volatileShare: share,
    band68,
    band95,
    pLoss10: normalCdf(-10 / sigma7),
    pGain10: 1 - normalCdf(10 / sigma7),
    lowValue68: totalValue * (1 - band68 / 100),
    highValue68: totalValue * (1 + band68 / 100),
  };
};

// Метрики портфеля за 24 часа
const computeMetrics = (coinData, userAssets) => {
  if (!coinData?.length) return null;

  const rows = [];
  for (const coin of coinData) {
    const amount = userAssets?.[coin.id] || 0;
    if (amount <= 0) continue;
    const value = amount * (coin.current_price || 0);
    const priceChange = coin.price_change_percentage_24h || 0;
    const prev = value / Math.max(0.01, 1 + priceChange / 100);
    rows.push({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      amount,
      value,
      priceChange,
      pnl: value - prev,
    });
  }

  const totalValue = rows.reduce((s, a) => s + a.value, 0);
  if (!rows.length || totalValue <= 0) return null;

  const periodProfit = rows.reduce((s, a) => s + a.pnl, 0);
  const prevTotal = totalValue - periodProfit;
  const portfolioChange = prevTotal > 0 ? (periodProfit / prevTotal) * 100 : 0;

  const assets = rows
    .map((a) => ({ ...a, allocation: (a.value / totalValue) * 100 }))
    .sort((a, b) => b.value - a.value);

  const byChange = [...assets].sort((a, b) => b.priceChange - a.priceChange);
  const top3 = assets.slice(0, 3).reduce((s, a) => s + a.allocation, 0);
  const concentration = assets[0].allocation;

  const hhi = assets.reduce((s, a) => s + (a.allocation / 100) ** 2, 0);
  const effectiveAssets = 1 / hhi;
  const diversificationScore = Math.round(clamp(((1 - hhi) / 0.9) * 100, 0, 100));
  const volatility = clamp(
    assets.reduce((s, a) => s + Math.abs(a.priceChange) * (a.allocation / 100), 0),
    0,
    100,
  );
  const health = Math.round(
    clamp(
      diversificationScore -
        Math.max(0, concentration - 30) * 0.5 -
        Math.max(0, volatility - 8) * 1.5,
      0,
      100,
    ),
  );

  const hit = (list, pct) => -(list.reduce((s, a) => s + a.allocation, 0) * pct) / 100;
  const stress = [
    {
      key: 'top1',
      label: `${assets[0].symbol.toUpperCase()} −20%`,
      change: hit(assets.slice(0, 1), 20),
    },
    ...(assets.length > 2
      ? [{ key: 'top3', label: 'Top 3 −20%', change: hit(assets.slice(0, 3), 20) }]
      : []),
    { key: 'all', label: 'Whole market −10%', change: hit(assets, 10) },
  ].map((s) => ({ ...s, loss: (totalValue * s.change) / 100 }));

  return {
    totalValue,
    periodProfit,
    portfolioChange,
    assets,
    contributors: [...assets].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)),
    totalAssets: assets.length,
    bestPerformer: byChange[0],
    worstPerformer: byChange[byChange.length - 1],
    allocationAnalysis: { top3, concentration },
    riskMetrics: { volatility, diversificationScore },
    effectiveAssets,
    health,
    stress,
    forecast: buildForecast(assets, totalValue),
  };
};

const Analytics = () => {
  const coinData = useSelector(coinSelector);
  const userAssets = useSelector(userAssetsSelector);
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  const portfolioMetrics = useMemo(
    () => computeMetrics(coinData, userAssets),
    [coinData, userAssets],
  );

  const header = (
    <ScreenHeader
      large
      eyebrow='Insights'
      title='Analytics'
      subtitle='Performance, structure, risk and outlook of your portfolio'
    />
  );

  if (!portfolioMetrics) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon='pie-chart-outline'
          eyebrow='Portfolio analysis'
          title='No data to analyze'
          body='Add holding amounts to your portfolio coins to unlock performance, risk and outlook insights.'
          action={{
            label: 'Open portfolio',
            icon: 'star',
            onPress: () => navigation.navigate('Favorite'),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space[4],
          paddingBottom: tabBarHeight + space[4],
        }}
      >
        <HeaderCard portfolioMetrics={portfolioMetrics} />
        <OverviewSection portfolioMetrics={portfolioMetrics} />
        <RecommendSection portfolioMetrics={portfolioMetrics} />
        <AllocationSection portfolioMetrics={portfolioMetrics} />
        <RiskSection portfolioMetrics={portfolioMetrics} />
        <Text variant='small' color='tertiary' align='center'>
          Data by meridian-finance. Not financial advice.
        </Text>
      </ScrollView>
    </Screen>
  );
};

export default Analytics;
