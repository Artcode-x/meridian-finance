// buildMaVisuals.js
// -----------------------------------------------------------------------------
// Готовит SVG-данные для индикатора MA cross + Bollinger Bands:
//   paths       — { fast, slow, bbMid, bbUpper, bbLower, bbFill }
//   signals     — треугольники buy/sell (пустой контур — pending-сигнал)
//   fillProfit  — суммарный path зелёных зон (сделки в плюсе)
//   fillLoss    — суммарный path красных зон (сделки в минусе)
//   statsText   — строка статистики для верхнего левого угла
//
// Заливка прибыли/убытка строится по траектории close от entry до exit с
// разбиением в точке пересечения уровня entry — получаются аккуратные
// многоугольники без артефактов.
//
// Вход: ma, data, start, displayData, xScale, yScale, candleStep,
//       showNW/showMA/showPRO, priceBottom, drawMALines, drawBB.
// Выход: { paths, signals, fillProfit, fillLoss, statsText }.

import { MA_BUY_COLOR, MA_SELL_COLOR, MA_SIGNAL_BAR } from '../constants/chartTheme';
import { buildSeriesPath, buildBandsFillPath } from '../utils/geometry';
import { GREEN, RED, MARGIN } from '../constants/chartTheme';

export const buildMaVisuals = ({
  ma,
  data,
  start,
  displayData,
  xScale,
  yScale,
  candleStep,
  showNW,
  showMA,
  showPRO,
  priceBottom,
  drawMALines,
  drawBB,
}) => {
  if (!ma) {
    return {
      paths: null,
      signals: [],
      fillProfit: '',
      fillLoss: '',
      statsText: '',
    };
  }

  const buildMAPath = (values) =>
    buildSeriesPath(values, start, displayData.length, xScale, yScale);

  const paths = {
    fast: drawMALines ? buildMAPath(ma.maFast) : '',
    slow: drawMALines ? buildMAPath(ma.maSlow) : '',
    bbMid: drawBB ? buildMAPath(ma.bbMid) : '',
    bbUpper: drawBB ? buildMAPath(ma.bbUpper) : '',
    bbLower: drawBB ? buildMAPath(ma.bbLower) : '',
    bbFill: drawBB
      ? buildBandsFillPath(
          ma.bbUpper,
          ma.bbLower,
          start,
          displayData.length,
          xScale,
          yScale,
        )
      : '',
  };

  // ---------- Заливки прибыли/убытка ----------
  let fillProfit = '';
  let fillLoss = '';

  const from = start - 1;
  const to = start + displayData.length;

  for (const t of ma.trades) {
    const end = t.exitIndex ?? data.length;
    if (end < from || t.entryIndex > to) continue;

    const pts = [];
    for (let j = Math.max(t.entryIndex, from); j < Math.min(end, to + 1); j++) {
      pts.push({ i: j, p: data[j].close });
    }
    if (
      t.exitIndex != null &&
      pts.length > 0 &&
      pts[pts.length - 1].i === t.exitIndex - 1 &&
      t.exitIndex <= to
    ) {
      pts.push({ i: t.exitIndex, p: t.exit });
    }

    const ye = yScale(t.entry);
    const gain = (p) => (t.side === 'buy' ? p - t.entry : t.entry - p);

    for (let n = 0; n < pts.length - 1; n++) {
      const a = pts[n];
      const b = pts[n + 1];
      const xa = xScale(a.i - start);
      const xb = xScale(b.i - start);
      const ya = yScale(a.p);
      const yb = yScale(b.p);
      const da = gain(a.p);
      const db = gain(b.p);

      if (da * db >= 0) {
        const d = `M${xa} ${ye} L${xa} ${ya} L${xb} ${yb} L${xb} ${ye} Z `;
        if (da + db >= 0) fillProfit += d;
        else fillLoss += d;
      } else {
        const xc = xa + (da / (da - db)) * (xb - xa);
        const d1 = `M${xa} ${ye} L${xa} ${ya} L${xc} ${ye} Z `;
        const d2 = `M${xc} ${ye} L${xb} ${yb} L${xb} ${ye} Z `;
        if (da > 0) fillProfit += d1;
        else fillLoss += d1;
        if (db > 0) fillProfit += d2;
        else fillLoss += d2;
      }
    }
  }

  // ---------- Сигналы MA ----------
  const signals = ma.signals
    .map((s) => ({
      ...s,
      bar: !s.pending && MA_SIGNAL_BAR === 'entry' ? s.entryIndex : s.index,
    }))
    .filter((s) => s.bar >= start && s.bar < start + displayData.length)
    .map((s) => {
      const candle = data[s.bar];
      const x = xScale(s.bar - start);
      const isSell = s.type === 'sell';
      const hw = Math.max(3, Math.min(5.5, candleStep * 0.45));
      const h = hw * 1.7;
      const gap = showNW ? 12 : 4;

      let apex = isSell ? yScale(candle.high) - gap : yScale(candle.low) + gap;
      let base = isSell ? apex - h : apex + h;

      const minY = MARGIN.top + 1;
      const maxY = priceBottom - 1;
      if (isSell && base < minY) {
        apex += minY - base;
        base = minY;
      }
      if (!isSell && base > maxY) {
        apex -= base - maxY;
        base = maxY;
      }

      return {
        key: `ma-${s.type}-${s.index}`,
        color: isSell ? MA_SELL_COLOR : MA_BUY_COLOR,
        pending: s.pending,
        points: `${x},${apex} ${x - hw},${base} ${x + hw},${base}`,
      };
    });

  const statsText = `MA · ${ma.stats.trades} trades · win ${ma.stats.winRate.toFixed(0)}% · PF ${
    ma.stats.profitFactor == null ? '—' : ma.stats.profitFactor.toFixed(2)
  }`;

  return { paths, signals, fillProfit, fillLoss, statsText };
};
