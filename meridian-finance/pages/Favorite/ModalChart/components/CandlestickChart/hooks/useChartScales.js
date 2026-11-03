// useChartScales.js
// -----------------------------------------------------------------------------
// Главный вычислительный хук графика: диапазон цен, масштабы, объёмы, профиль.
//
// Считает minPrice / maxPrice с учётом ВСЕХ видимых линий (NW, MA/BB, PRO,
// ALPHA) и уровней открытой ALPHA-сделки — чтобы ничего не вылезло за пределы
// области рисования. Затем выводит:
//
//   priceRange, maxVolume, hasVolume
//   innerWidth/innerHeight/axisY      — геометрия области рисования
//   volGap/volHeight/priceHeight/priceBottom — вертикальная раскладка
//   candleStep, candleWidth           — ширина шага и свечи
//   xScale(i), yScale(price)          — функции перевода индекс/цена → пиксели
//   horizontalBars                    — бары горизонтального профиля объёма
//   drawMALines, drawBB               — что из MA рисовать в текущем режиме
//
// Возвращает null, если данных нет — оркестратор проверяет это до рендера.

import { useMemo } from 'react';
import {
  MARGIN,
  VOLUME_GAP,
  VOLUME_SHARE,
  VP_WIDTH_SHARE,
} from '../constants/chartTheme';
import { getVolume } from '../utils/candleUtils';
import { profileBars } from '../../../components/CandlestickChart/indicators/profileBars';

export const useChartScales = ({
  data,
  displayData,
  start,
  currentLimit,
  nw,
  ma,
  pro,
  alpha,
  showVP,
  width,
  height,
  maMode,
}) => {
  return useMemo(() => {
    if (!data || data.length === 0 || displayData.length === 0) {
      return null;
    }

    // ---------- Диапазон цен ----------
    let minPrice = Math.min(...displayData.map((c) => c.low));
    let maxPrice = Math.max(...displayData.map((c) => c.high));

    if (nw) {
      for (let k = 0; k < displayData.length; k++) {
        const idx = start + k - nw.first;
        if (idx < 0 || idx >= nw.mid.length) continue;
        if (nw.lower[idx] < minPrice) minPrice = nw.lower[idx];
        if (nw.upper[idx] > maxPrice) maxPrice = nw.upper[idx];
      }
    }

    const drawMALines = !!ma && maMode !== 'bb';
    const drawBB = !!ma && maMode !== 'ma';

    if (ma) {
      const series = [];
      if (drawMALines) series.push(ma.maFast, ma.maSlow);
      if (drawBB) series.push(ma.bbUpper, ma.bbLower);
      for (const s of series) {
        for (let k = 0; k < displayData.length; k++) {
          const v = s[start + k];
          if (v == null) continue;
          if (v < minPrice) minPrice = v;
          if (v > maxPrice) maxPrice = v;
        }
      }
    }

    if (pro) {
      for (let k = 0; k < displayData.length; k++) {
        const v50 = pro.ema50[start + k];
        const v200 = pro.ema200[start + k];
        if (v50 != null) {
          if (v50 < minPrice) minPrice = v50;
          if (v50 > maxPrice) maxPrice = v50;
        }
        if (v200 != null) {
          if (v200 < minPrice) minPrice = v200;
          if (v200 > maxPrice) maxPrice = v200;
        }
      }
    }

    if (alpha) {
      for (const s of [alpha.mid, alpha.slow]) {
        for (let k = 0; k < displayData.length; k++) {
          const v = s[start + k];
          if (v == null) continue;
          if (v < minPrice) minPrice = v;
          if (v > maxPrice) maxPrice = v;
        }
      }
      const ot = alpha.openTrade;
      if (ot) {
        for (const v of [ot.stop, ot.target]) {
          if (v < minPrice) minPrice = v;
          if (v > maxPrice) maxPrice = v;
        }
      }
    }

    const priceRange = maxPrice - minPrice || 1;

    // ---------- Объёмы ----------
    let maxVolume = 0;
    for (let k = 0; k < displayData.length; k++) {
      const v = getVolume(displayData[k]);
      if (v != null && v > maxVolume) maxVolume = v;
    }
    const hasVolume = maxVolume > 0;

    // ---------- Размеры и масштаб ----------
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
    const axisY = height - MARGIN.bottom;

    const volGap = hasVolume ? VOLUME_GAP : 0;
    const volHeight = hasVolume ? innerHeight * VOLUME_SHARE : 0;
    const priceHeight = innerHeight - volHeight - volGap;
    const priceBottom = MARGIN.top + priceHeight;

    const hasProfile = showVP && hasVolume;
    const profileMaxWidth = hasProfile ? innerWidth * VP_WIDTH_SHARE : 0;

    const candleStep = innerWidth / currentLimit;
    const candleWidth = Math.max(2, candleStep * 0.6);

    const xScale = (index) => MARGIN.left + index * candleStep;
    const yScale = (price) =>
      MARGIN.top + priceHeight - ((price - minPrice) / priceRange) * priceHeight;

    const horizontalBars = hasProfile
      ? profileBars({
          displayData,
          visibleCount: Math.min(currentLimit, displayData.length),
          minPrice,
          priceRange,
          rows: 48,
          maxWidth: profileMaxWidth,
          yScale,
          getVolume,
          isGreen: (c) => c.close >= c.open,
        })
      : [];

    return {
      minPrice,
      maxPrice,
      priceRange,
      maxVolume,
      hasVolume,
      innerWidth,
      innerHeight,
      axisY,
      volGap,
      volHeight,
      priceHeight,
      priceBottom,
      hasProfile,
      profileMaxWidth,
      candleStep,
      candleWidth,
      xScale,
      yScale,
      horizontalBars,
      drawMALines,
      drawBB,
    };
  }, [
    data,
    displayData,
    start,
    currentLimit,
    nw,
    ma,
    pro,
    alpha,
    showVP,
    width,
    height,
    maMode,
  ]);
};
