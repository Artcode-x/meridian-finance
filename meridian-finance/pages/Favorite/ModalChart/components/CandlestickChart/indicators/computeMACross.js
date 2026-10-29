// Стратегия "MA cross and/or BBands bot".
const sma = (values, length) => {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= length) sum -= values[i - length];
    if (i >= length - 1) out[i] = sum / length;
  }
  return out;
};

const bbands = (values, length, mult) => {
  const mid = sma(values, length);
  const upper = new Array(values.length).fill(null);
  const lower = new Array(values.length).fill(null);

  for (let i = length - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - length + 1; j <= i; j++) {
      const d = values[j] - mid[i];
      sum += d * d;
    }
    const dev = Math.sqrt(sum / length) * mult;
    upper[i] = mid[i] + dev;
    lower[i] = mid[i] - dev;
  }
  return { mid, upper, lower };
};

export const computeMACross = (
  data,
  { fast = 50, slow = 200, bbLen = 20, bbMult = 2, mode = 'or' } = {},
) => {
  const n = data.length;
  const close = data.map((c) => c.close);

  const maFast = sma(close, fast);
  const maSlow = sma(close, slow);
  const bb = bbands(close, bbLen, bbMult);

  // ===== 1. Желаемое направление на каждой свече =====
  const wanted = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const f = maFast[i];
    const s = maSlow[i];
    const fPrev = maFast[i - 1];
    const sPrev = maSlow[i - 1];
    const maReady = f != null && s != null && fPrev != null && sPrev != null;

    const maUp = maReady && fPrev <= sPrev && f > s;
    const maDown = maReady && fPrev >= sPrev && f < s;
    const trendUp = maReady && f > s;
    const trendDown = maReady && f < s;

    const bbBuy = bb.lower[i] != null && close[i] < bb.lower[i];
    const bbSell = bb.upper[i] != null && close[i] > bb.upper[i];

    let buy = false;
    let sell = false;
    if (mode === 'ma') {
      buy = maUp;
      sell = maDown;
    } else if (mode === 'bb') {
      buy = bbBuy;
      sell = bbSell;
    } else if (mode === 'and') {
      buy = bbBuy && trendUp;
      sell = bbSell && trendDown;
    } else {
      buy = maUp || bbBuy; // 'or'
      sell = maDown || bbSell;
    }

    if (buy && !sell) wanted[i] = 1;
    else if (sell && !buy) wanted[i] = -1;
  }

  // ===== 2. Бэктест =====
  const trades = [];
  const signals = [];
  let pos = 0;

  for (let i = 0; i < n - 1; i++) {
    const side = wanted[i];
    if (side === 0 || side === pos) continue;

    const price = data[i + 1].open;

    // Закрываем прошлую сделку (разворот)
    if (trades.length > 0) {
      const last = trades[trades.length - 1];
      last.exitIndex = i + 1;
      last.exit = price;
    }

    trades.push({
      side: side > 0 ? 'buy' : 'sell',
      entryIndex: i + 1,
      entry: price,
      exitIndex: null,
      exit: null,
    });
    signals.push({ index: i + 1, type: side > 0 ? 'buy' : 'sell' });
    pos = side;
  }

  // ===== 3. СТАТИСТИКА (ДОБАВЛЕНО) =====
  // Считаем статистику по закрытым сделкам
  let wins = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let closed = 0;

  for (const t of trades) {
    // Пропускаем последнюю открытую сделку, если она ещё не закрыта
    if (t.exitIndex == null || t.exit == null) continue;

    closed++;
    // Прибыль в процентах (для лонга: (выход - вход) / вход, для шорта наоборот)
    const pnlPct = (t.side === 'buy' ? t.exit - t.entry : t.entry - t.exit) / t.entry;

    if (pnlPct > 0) {
      wins++;
      grossWin += pnlPct;
    } else {
      grossLoss += -pnlPct; // Модуль убытка
    }
  }

  const stats = {
    trades: closed,
    winRate: closed > 0 ? (wins / closed) * 100 : 0,
    // Profit Factor = Сумма прибылей / Сумма убытков. Если убытков нет — null.
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
  };

  return {
    maFast,
    maSlow,
    bbMid: bb.mid,
    bbUpper: bb.upper,
    bbLower: bb.lower,
    signals,
    trades,
    stats, // <--- ВОЗВРАЩАЕМ СТАТИСТИКУ
  };
};
