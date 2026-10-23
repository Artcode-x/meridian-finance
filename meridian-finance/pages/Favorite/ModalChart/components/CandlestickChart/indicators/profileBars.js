// ===== 3.0 Горизонтальный профиль объёма =====
// Делим диапазон цен на VP_ROWS уровней и складываем объём каждой видимой свечи
// в те уровни, которые она «накрывает» (от low до high). Объём свечи делится
// поровну между этими уровнями. Чем длиннее полоска — тем больше торговали на этой цене.

export const profileBars = ({
  displayData,
  visibleCount,
  minPrice,
  priceRange,
  rows,
  maxWidth,
  yScale,
  getVolume,
  isGreen,
}) => {
  const bars = [];

  if (!maxWidth || priceRange <= 0 || !displayData?.length || rows <= 0) {
    return bars;
  }

  const rowStep = priceRange / rows;
  const upRows = new Array(rows).fill(0);
  const downRows = new Array(rows).fill(0);
  const clampRow = (i) => Math.max(0, Math.min(rows - 1, i));

  const count = Math.min(visibleCount, displayData.length);

  for (let k = 0; k < count; k++) {
    const c = displayData[k];
    const v = getVolume(c);
    if (v == null || v <= 0) continue;

    const lo = clampRow(Math.floor((c.low - minPrice) / rowStep));
    const hi = clampRow(Math.floor((c.high - minPrice) / rowStep));
    const part = v / (hi - lo + 1);
    const target = isGreen(c) ? upRows : downRows;
    for (let r = lo; r <= hi; r++) target[r] += part;
  }

  let maxRow = 0;
  for (let r = 0; r < rows; r++) {
    maxRow = Math.max(maxRow, upRows[r] + downRows[r]);
  }
  if (maxRow <= 0) return bars;

  for (let r = 0; r < rows; r++) {
    if (upRows[r] + downRows[r] <= 0) continue;

    const yTop = yScale(minPrice + (r + 1) * rowStep);
    const yBottom = yScale(minPrice + r * rowStep);
    const rowPx = yBottom - yTop;

    bars.push({
      key: r,
      y: yTop,
      height: Math.max(1, rowPx - (rowPx > 3 ? 1 : 0)),
      upW: (upRows[r] / maxRow) * maxWidth,
      downW: (downRows[r] / maxRow) * maxWidth,
    });
  }

  return bars;
};
