// buildProVisuals.js
// -----------------------------------------------------------------------------
// Готовит SVG-данные для PRO-индикатора (EMA50/EMA200 + breakout-сигналы):
//   paths       — { ema50, ema200 } — две линии
//   signals     — круги с "B"/"S" над/под свечами (смещение зависит от showNW)
//   openLevels  — { entry, stop, target, yEntry, yStop, yTarget } для последней
//                 НЕзакрытой сделки (exitIndex === null), иначе null
//
// openLevels потом рисует OpenTradeLevelsLayer слева (жёлтая подпись ENTRY,
// красная STOP, зелёная TAKE).
//
// Вход: pro, data, start, displayData, xScale, yScale, showNW.
// Выход: { paths, signals, openLevels }.

import { PRO_COLOR_BUY, PRO_COLOR_SELL } from '../constants/chartTheme';
import { buildSeriesPath } from '../utils/geometry';

export const buildProVisuals = ({
  pro,
  data,
  start,
  displayData,
  xScale,
  yScale,
  showNW,
}) => {
  if (!pro) return { paths: null, signals: [], openLevels: null };

  const paths = {
    ema50: buildSeriesPath(pro.ema50, start, displayData.length, xScale, yScale),
    ema200: buildSeriesPath(pro.ema200, start, displayData.length, xScale, yScale),
  };

  const signals = pro.signals
    .filter((s) => s.index >= start && s.index < start + displayData.length)
    .map((s) => {
      const candle = data[s.index];
      const x = xScale(s.index - start);
      const isBuy = s.type === 'buy';
      const offsetY = showNW ? 24 : 16;
      const y = isBuy ? yScale(candle.low) + offsetY : yScale(candle.high) - offsetY;
      return { key: `pro-${s.index}`, x, y, isBuy };
    });

  // ---------- Уровни открытой сделки ----------
  let openLevels = null;
  if (pro.trades?.length) {
    const idx = pro.trades.length - 1;
    const t = pro.trades[idx];
    if (t.exitIndex === null) {
      openLevels = {
        entry: t.entry,
        stop: t.stop,
        target: t.target,
        yEntry: yScale(t.entry),
        yStop: yScale(t.stop),
        yTarget: yScale(t.target),
      };
    }
  }

  return { paths, signals, openLevels };
};
