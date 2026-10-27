// Адаптивный формат цены для оси Y
export const formatAxisPrice = (v) => {
  if (v == null || Number.isNaN(v)) return '';
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `$${(v / 1e3).toFixed(1)}K`;
  if (a >= 1e3) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (a >= 1) return `$${v.toFixed(2)}`;
  if (a >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toPrecision(3)}`;
};

export const signedPct = (v, digits = 2) =>
  v == null || Number.isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
