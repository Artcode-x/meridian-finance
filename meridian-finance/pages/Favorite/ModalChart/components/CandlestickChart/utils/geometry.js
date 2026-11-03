// Геометрические хелперы, превращающие массивы чисел в SVG path-data.
//
//   buildXLabels(data, start, limit, candleStep)
//       — рассчитывает подписи оси X (время/дата) и их координаты.
//         Автоматически выбирает формат HH:MM или DD.MM по разнице времени.
//
//   buildSeriesPath(values, start, count, xScale, yScale)
//       — превращает массив значений (с возможными null → разрыв пера)
//         в строку "M... L... L...". Используется для линий NW/MA/PRO/ALPHA.
//
//   buildBandsFillPath(upper, lower, start, count, xScale, yScale)
//       — замыкает верхнюю и нижнюю границы Bollinger Bands в замкнутый путь
//         для заливки области между ними.

import { X_LABELS_COUNT, DAY_MS, MARGIN } from '../constants/chartTheme';
import { getTime } from './candleUtils';
import { pad2 } from './formatters';

export const buildXLabels = (data, start, limit, candleStep) => {
  if (limit < 2) return [];
  const tFirst = getTime(data[start]);
  const tLast = getTime(data[start + limit - 1]);
  if (tFirst == null || tLast == null) return [];
  const intraday = tLast - tFirst < DAY_MS;
  const labels = [];
  for (let i = 0; i <= X_LABELS_COUNT; i++) {
    const shift = (i * (limit - 1)) / X_LABELS_COUNT;
    const ts = getTime(data[Math.round(start + shift)]);
    if (ts == null) continue;
    const d = new Date(ts);
    labels.push({
      text: intraday
        ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
        : `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`,
      x: MARGIN.left + shift * candleStep,
      anchor: i === 0 ? 'start' : i === X_LABELS_COUNT ? 'end' : 'middle',
    });
  }
  return labels;
};

// Строит SVG-path по массиву значений (null = разрыв пера)
export const buildSeriesPath = (values, start, count, xScale, yScale) => {
  let d = '';
  let penDown = false;
  for (let k = 0; k < count; k++) {
    const v = values[start + k];
    if (v == null) {
      penDown = false;
      continue;
    }
    d += `${penDown ? 'L' : 'M'}${xScale(k).toFixed(1)} ${yScale(v).toFixed(1)} `;
    penDown = true;
  }
  return d;
};

// Заливка между верхней и нижней границей BBands
export const buildBandsFillPath = (upper, lower, start, count, xScale, yScale) => {
  const ks = [];
  for (let k = 0; k < count; k++) {
    if (upper[start + k] != null) ks.push(k);
  }
  if (ks.length < 2) return '';
  let d = '';
  ks.forEach((k, n) => {
    d += `${n === 0 ? 'M' : 'L'}${xScale(k)} ${yScale(upper[start + k])} `;
  });
  for (let n = ks.length - 1; n >= 0; n--) {
    d += `L${xScale(ks[n])} ${yScale(lower[start + ks[n]])} `;
  }
  return d + 'Z';
};
