// buildNwVisuals.js
// -----------------------------------------------------------------------------
// Готовит SVG-данные для индикатора Nadaraya-Watson:
//   paths   — { upper, mid, lower } — три строки path для линий канала
//   signals — массив треугольников ▼/▲ (sell/buy) над/под свечами
//
// Логика: берём абсолютные индексы nw.first..nw.first+n-1, переводим в
// локальные индексы displayData (idx = start + k - nw.first) и строим пути
// через xScale/yScale. Сигналы фильтруем по видимому диапазону.
//
// Вход: nw, data, start, displayData, xScale, yScale.
// Выход: { paths, signals }.
// Используется: CandlestickChart.js → ChartSvg → IndicatorLinesLayer/SignalsLayer.

import { NW_UP_COLOR, NW_DN_COLOR } from '../constants/chartTheme';
import { buildSeriesPath } from '../utils/geometry';

export const buildNwVisuals = ({ nw, data, start, displayData, xScale, yScale }) => {
  if (!nw) return { paths: null, signals: [] };

  const buildNwPath = (values) => {
    let d = '';
    let penDown = false;
    for (let k = 0; k < displayData.length; k++) {
      const idx = start + k - nw.first;
      const v = idx >= 0 && idx < values.length ? values[idx] : null;
      if (v == null) {
        penDown = false;
        continue;
      }
      d += `${penDown ? 'L' : 'M'}${xScale(k).toFixed(1)} ${yScale(v).toFixed(1)} `;
      penDown = true;
    }
    return d;
  };

  const paths = {
    upper: buildNwPath(nw.upper),
    mid: buildNwPath(nw.mid),
    lower: buildNwPath(nw.lower),
  };

  const signals = nw.signals
    .filter((s) => s.index >= start && s.index < start + displayData.length)
    .map((s) => {
      const candle = data[s.index];
      const x = xScale(s.index - start);
      if (s.type === 'sell') {
        const y = yScale(candle.high) - 3;
        return {
          key: `nw-s-${s.index}`,
          color: NW_DN_COLOR,
          points: `${x},${y} ${x - 3.5},${y - 6} ${x + 3.5},${y - 6}`,
        };
      }
      const y = yScale(candle.low) + 3;
      return {
        key: `nw-b-${s.index}`,
        color: NW_UP_COLOR,
        points: `${x},${y} ${x - 3.5},${y + 6} ${x + 3.5},${y + 6}`,
      };
    });

  return { paths, signals };
};
