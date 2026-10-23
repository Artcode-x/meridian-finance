//  * Nadaraya-Watson Envelope (LuxAlgo), режим repaint = true.
//  *
//  * Идея: для каждой свечи i считаем "сглаженную" цену как средневзвешенное
//  * по соседним свечам j, где вес — гауссово ядро:
//  *     w(i, j) = exp( -(i - j)^2 / (2 * h^2) )
//  *     mid[i]  = Σ(close[j] * w) / Σ(w)
//  * Чем ближе свеча — тем больше вес. h (bandwidth) задаёт гладкость:
//  * больше h → линия плавнее.
//  *
//  * Ширина канала = средняя абсолютная ошибка |close - mid| * mult.
//  *     upper = mid + sae,  lower = mid - sae
//  *
//  * Сигналы (как стрелки в TradingView):
//  *   ▼ sell — close пересёк верхнюю границу снизу вверх
//  *   ▲ buy  — close пересёк нижнюю границу сверху вниз
//  *
//  * ВАЖНО: как и в оригинале, это "перерисовывающийся" индикатор — последние
//  * значения меняются при появлении новых свечей (ядро смотрит в обе стороны).
//  *
//  * Оптимизация: гауссов вес на расстоянии > 5h практически ноль
//  * (exp(-12.5) ≈ 4e-6), поэтому считаем только окно ±5h вокруг свечи.
//  * Для h=8 и 500 свечей это ~40 000 операций вместо 250 000.
//  * Результат — абсолютные индексы относительно массива data.
//  * ------------------------------------------------------------------- */

export const computeNW = (data, h, mult, maxWindow) => {
  const n = Math.min(maxWindow, data.length);
  if (n < 2 || h <= 0) return null;

  // Индекс в data, с которого начинается окно расчёта
  const first = data.length - n;

  const src = new Array(n);
  for (let i = 0; i < n; i++) src[i] = Number(data[first + i].close);

  // Заранее считаем веса ядра для расстояний 0..radius
  const radius = Math.ceil(h * 5);
  const denom = 2 * h * h;
  const kernel = new Array(radius + 1);
  for (let d = 0; d <= radius; d++) kernel[d] = Math.exp(-(d * d) / denom);

  const mid = new Array(n);
  let sae = 0;

  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - radius);
    const hi = Math.min(n - 1, i + radius);

    let sum = 0;
    let sumW = 0;
    for (let j = lo; j <= hi; j++) {
      const w = kernel[Math.abs(i - j)];
      sum += src[j] * w;
      sumW += w;
    }

    mid[i] = sum / sumW;
    sae += Math.abs(src[i] - mid[i]);
  }

  sae = (sae / n) * mult;

  const upper = mid.map((v) => v + sae);
  const lower = mid.map((v) => v - sae);

  // Сигналы: пересечение границ (абсолютный индекс свечи + тип)
  const signals = [];
  for (let i = 1; i < n; i++) {
    if (src[i] > upper[i] && src[i - 1] <= upper[i - 1]) {
      signals.push({ index: first + i, type: 'sell' });
    } else if (src[i] < lower[i] && src[i - 1] >= lower[i - 1]) {
      signals.push({ index: first + i, type: 'buy' });
    }
  }

  return { first, mid, upper, lower, signals };
};
