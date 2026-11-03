// buildAlphaVisuals.js
// -----------------------------------------------------------------------------
// Готовит SVG-данные для ALPHA-индикатора (confluence-стратегия):
//   paths       — { mid, slow } — EMA50/EMA200 (тонкие)
//   boxes       — прямоугольники сделок: зелёный (entry→TP) и красный (entry→SL)
//   signals     — плашки "BUY P" / "SELL R" (P/R/B/C — тип сетапа) над/под
//                 свечами; пустой контур — pending (свеча не закрыта)
//   openLevels  — { side, setup, entry, stop, target, be, yEntry, yStop, yTarget }
//                 для открытой сделки (alpha.openTrade), иначе null
//   statsText   — строка "ALPHA · N trades · win X% · PF ... · avg ...R"
//
// Плашки позиционируются с учётом включённых NW/MA/PRO, чтобы не пересекаться
// с их сигналами. Уровни открытой сделки рисуются справа
// (OpenTradeLevelsLayer) — не конфликтуют с PRO-уровнями слева.
//
// Вход: alpha, data, start, displayData, xScale, yScale, priceBottom,
//       showNW, showMA, showPRO.
// Выход: { paths, signals, boxes, openLevels, statsText }.

import {
  ALPHA_COLOR_BUY,
  ALPHA_COLOR_SELL,
  ALPHA_BOX_OPACITY,
  ALPHA_PILL_W,
  ALPHA_PILL_H,
  ALPHA_POINTER,
  ALPHA_SETUP_LETTER,
  MARGIN,
} from '../constants/chartTheme';
import { buildSeriesPath } from '../utils/geometry';

export const buildAlphaVisuals = ({
  alpha,
  data,
  start,
  displayData,
  xScale,
  yScale,
  priceBottom,
  showNW,
  showMA,
  showPRO,
}) => {
  if (!alpha) {
    return { paths: null, signals: [], boxes: [], openLevels: null, statsText: '' };
  }

  const paths = {
    mid: buildSeriesPath(alpha.mid, start, displayData.length, xScale, yScale),
    slow: buildSeriesPath(alpha.slow, start, displayData.length, xScale, yScale),
  };

  // ---------- Боксы сделок ----------
  const boxes = [];
  const from = start;
  const to = start + displayData.length - 1;
  for (const t of alpha.trades) {
    const end = t.exitIndex ?? data.length - 1;
    if (end < from || t.entryIndex > to) continue;
    const x1 = xScale(Math.max(t.entryIndex, from) - start);
    const x2 = xScale(Math.min(end, to) - start);
    const yE = yScale(t.entry);
    const yS = yScale(t.initialStop);
    const yT = yScale(t.target);
    boxes.push({
      key: `alpha-box-${t.entryIndex}`,
      x: x1,
      w: Math.max(1, x2 - x1),
      tpY: Math.min(yE, yT),
      tpH: Math.abs(yE - yT),
      slY: Math.min(yE, yS),
      slH: Math.abs(yE - yS),
    });
  }

  // ---------- Сигналы ALPHA ----------
  const signals = alpha.signals
    .filter((s) => s.index >= start && s.index < start + displayData.length)
    .map((s) => {
      const candle = data[s.index];
      const x = xScale(s.index - start);
      const isBuy = s.type === 'buy';
      const gap = 5 + (showNW ? 10 : 0) + (showMA ? 10 : 0) + (showPRO ? 18 : 0);
      const apex = isBuy ? yScale(candle.low) + gap : yScale(candle.high) - gap;
      let pillY = isBuy ? apex + ALPHA_POINTER : apex - ALPHA_POINTER - ALPHA_PILL_H;
      pillY = Math.max(MARGIN.top + 1, Math.min(priceBottom - ALPHA_PILL_H - 1, pillY));
      const tipY = isBuy ? pillY - ALPHA_POINTER : pillY + ALPHA_PILL_H + ALPHA_POINTER;
      const baseY = isBuy ? pillY : pillY + ALPHA_PILL_H;
      return {
        key: `alpha-${s.index}`,
        x,
        pillY,
        isBuy,
        pending: s.pending,
        label: `${isBuy ? 'BUY' : 'SELL'} ${ALPHA_SETUP_LETTER[s.setup] ?? ''}`,
        points: `${x},${tipY} ${x - 3.5},${baseY} ${x + 3.5},${baseY}`,
      };
    });

  // ---------- Уровни открытой сделки ----------
  let openLevels = null;
  if (alpha.openTrade) {
    const t = alpha.openTrade;
    openLevels = {
      side: t.side,
      setup: t.setup,
      entry: t.entry,
      stop: t.stop,
      target: t.target,
      be: t.be,
      yEntry: yScale(t.entry),
      yStop: yScale(t.stop),
      yTarget: yScale(t.target),
    };
  }

  const statsText = `ALPHA · ${alpha.stats.trades} trades · win ${alpha.stats.winRate.toFixed(0)}% · PF ${
    alpha.stats.profitFactor == null ? '—' : alpha.stats.profitFactor.toFixed(2)
  } · avg ${alpha.stats.avgR.toFixed(2)}R`;

  return { paths, signals, boxes, openLevels, statsText };
};
