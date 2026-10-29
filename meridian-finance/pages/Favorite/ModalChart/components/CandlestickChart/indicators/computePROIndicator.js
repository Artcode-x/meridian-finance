// EMA (Экспоненциальная скользящая средняя)
const ema = (values, length) => {
  const out = new Array(values.length).fill(null);
  const k = 2 / (length + 1);
  let prev = null;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < length - 1) {
      sum += values[i];
      continue;
    }
    if (i === length - 1) {
      sum += values[i];
      prev = sum / length;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
};

// RSI
const rsi = (values, length) => {
  const out = new Array(values.length).fill(null);
  let avgGain = 0,
    avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    if (i <= length) {
      avgGain += gain;
      avgLoss += loss;
      if (i < length) continue;
      avgGain /= length;
      avgLoss /= length;
    } else {
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
    }
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
};

// ATR (для стопов и целей)
const atr = (data, length) => {
  const out = new Array(data.length).fill(null);
  let prevAtr = null,
    sum = 0;
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const tr =
      i === 0
        ? c.high - c.low
        : Math.max(
            c.high - c.low,
            Math.abs(c.high - data[i - 1].close),
            Math.abs(c.low - data[i - 1].close),
          );
    if (i < length - 1) {
      sum += tr;
      continue;
    }
    if (i === length - 1) {
      sum += tr;
      prevAtr = sum / length;
    } else {
      prevAtr = (prevAtr * (length - 1) + tr) / length;
    }
    out[i] = prevAtr;
  }
  return out;
};

export const computePROIndicator = (data) => {
  const n = data.length;
  if (n < 200) return null; // Нужно хотя бы 200 свечей для EMA200

  const close = data.map((c) => Number(c.close));
  const volume = data.map((c) => Number(c.volume ?? c.vol ?? c.v ?? 0));

  const ema50 = ema(close, 50);
  const ema200 = ema(close, 200);
  const rsiArr = rsi(close, 14);
  const atrArr = atr(data, 14);

  // Средний объём за 20 свечей
  const volSMA = new Array(n).fill(null);
  let volSum = 0;
  for (let i = 0; i < n; i++) {
    volSum += volume[i];
    if (i >= 20) volSum -= volume[i - 20];
    if (i >= 19) volSMA[i] = volSum / 20;
  }

  // Канал Дончиана (20 периодов)
  const donchianHigh = new Array(n).fill(null);
  const donchianLow = new Array(n).fill(null);
  for (let i = 19; i < n; i++) {
    let hh = -Infinity,
      ll = Infinity;
    for (let j = i - 19; j <= i; j++) {
      if (data[j].high > hh) hh = data[j].high;
      if (data[j].low < ll) ll = data[j].low;
    }
    donchianHigh[i] = hh;
    donchianLow[i] = ll;
  }

  const signals = [];
  const trades = [];

  for (let i = 200; i < n - 1; i++) {
    // Условия для Long (Покупка)
    const isUptrend = close[i] > ema200[i] && ema50[i] > ema200[i];
    const isBreakoutUp = close[i] > donchianHigh[i - 1]; // Пробой вверх
    const hasVolume = volume[i] > volSMA[i] * 1.5; // Всплеск объёма
    const rsiOk = rsiArr[i] > 50 && rsiArr[i] < 80; // Импульс вверх, но не перекуплен

    // Условия для Short (Продажа)
    const isDowntrend = close[i] < ema200[i] && ema50[i] < ema200[i];
    const isBreakoutDown = close[i] < donchianLow[i - 1]; // Пробой вниз
    const rsiSellOk = rsiArr[i] < 50 && rsiArr[i] > 20; // Импульс вниз, но не перепродан

    if (isUptrend && isBreakoutUp && hasVolume && rsiOk) {
      signals.push({ index: i, type: 'buy' });
      trades.push({
        type: 'buy',
        entry: data[i].close,
        entryIndex: i,
        exitIndex: null,
        exit: null,
        stop: data[i].close - atrArr[i] * 2,
        target: data[i].close + atrArr[i] * 6, // Risk/Reward 1:3
      });
    } else if (isDowntrend && isBreakoutDown && hasVolume && rsiSellOk) {
      signals.push({ index: i, type: 'sell' });
      trades.push({
        type: 'sell',
        entry: data[i].close,
        entryIndex: i,
        exitIndex: null,
        exit: null,
        stop: data[i].close + atrArr[i] * 2,
        target: data[i].close - atrArr[i] * 6,
      });
    }
  }

  return {
    ema50,
    ema200,
    signals,
    trades,
    donchianHigh,
    donchianLow,
  };
};
