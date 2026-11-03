// Утилиты для нормализации «сырых» свечей из разных источников данных.
//
// Источники кладут OHLCV в разные поля (volume / vol / v, time / timestamp /
// openTime / t), а время — то в секундах, то в миллисекундах. Эти три функции
// прячут всю эту грязь от остального кода:
//
//   isGreen(candle)   — true, если close >= open (для выбора цвета свечи/объёма)
//   getVolume(candle) — number | null (унифицированный объём)
//   getTime(candle)   — ms | null (унифицированное время; секунды → миллисекунды)
//
// Используется: CandlesLayer, VolumeBarsLayer, VolumeProfileLayer,
// useChartScales, geometry.buildXLabels.

export const isGreen = (candle) => candle.close >= candle.open;

export const getVolume = (candle) => {
  const raw = candle.volume ?? candle.vol ?? candle.v;
  if (raw == null) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
};

export const getTime = (candle) => {
  const t = candle.time ?? candle.timestamp ?? candle.openTime ?? candle.t;
  if (t == null) return null;
  const ms = typeof t === 'number' ? t : new Date(t).getTime();
  if (isNaN(ms)) return null;
  return ms < 1e12 ? ms * 1000 : ms;
};
