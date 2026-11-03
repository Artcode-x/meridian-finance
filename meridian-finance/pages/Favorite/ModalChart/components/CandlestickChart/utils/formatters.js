// Чистые функции форматирования чисел для отображения на графике.
//
//   pad2(n)          — "5" → "05" (для дат и времени на оси X)
//   formatPrice(p)   — "$1.23k", "$4.56M", "$0.00123" (по порядку величины)
//   formatVolume(v)  — "12.34K", "5.67M", "8.90B"

import { DECIMALS_BY_PRICE } from '../constants/chartTheme';

export const pad2 = (n) => String(n).padStart(2, '0');

export const formatPrice = (price) => {
  if (price >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
  if (price >= 1e3) return `$${(price / 1e3).toFixed(2)}k`;
  const decimals = DECIMALS_BY_PRICE.find(([min]) => price >= min)?.[1] ?? 8;
  const text = `$${price.toFixed(decimals)}`;
  return text.length > 12 ? `$${price.toExponential(3)}` : text;
};

export const formatVolume = (v) => {
  if (v == null) return '';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
};
