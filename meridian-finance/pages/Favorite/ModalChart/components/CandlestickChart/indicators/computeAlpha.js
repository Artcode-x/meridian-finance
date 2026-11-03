// ALPHA v2 — confluence-индикатор с 4 сетапами (P — pullback, R — reversion,
// B — breakout, C — EMA-cross) + минимум N из 6 подтверждений, плюс разворот
// позиции по противоположному сигналу — поэтому сделок заметно больше. Сигналы считаются по ЗАКРЫТОЙ свече (без перерисовки),
// каждая сделка симулируется (SL/TP/безубыток/тайм-аут, комиссия), поэтому
// статистика на графике — честный бэктест на загруженных данных.

const DEFAULTS = {
  // Тренд
  fastLen: 21,
  midLen: 50,
  slowLen: 200,
  adxLen: 14,
  adxTrendMin: 15, // ниже — тренда нет, pullback/breakout не торгуем
  adxRangeMax: 30, // выше — сильный тренд, reversion не торгуем
  // Осцилляторы
  rsiLen: 14,
  bbLen: 20,
  bbMult: 2,
  stLen: 10,
  stMult: 3,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  // Объём / волатильность
  volLen: 20,
  volMult: 1.0,
  atrLen: 14,
  minAtrPct: 0.1, // слишком «мёртвый» рынок пропускаем
  // Сетапы
  pullbackBars: 8,
  pullbackZoneAtr: 0.25,
  pullbackRsi: 55, // RSI при откате был <= 55 (buy) / >= 45 (sell)
  reversionRsi: 38, // RSI у границы BB <= 38 (buy) / >= 62 (sell)
  breakoutLen: 20, // пробой максимума/минимума N свечей
  breakoutRsiMax: 75,
  enablePullback: true,
  enableReversion: true,
  enableBreakout: true,
  enableCross: true,
  minScore: 3, // из 6 (было 4)
  // Риск-менеджмент
  stopBufferAtr: 0.2,
  minStopAtr: 1,
  maxStopAtr: 3,
  rr: 2, // тейк по умолчанию = rr * риск
  rrBySetup: { pullback: 2, reversion: 1.5, breakout: 2, cross: 2 },
  beAtR: 1, // после +1R стоп переносится в безубыток
  maxBars: 50, // тайм-аут сделки
  cooldownBars: 1,
  stopCooldownBars: 3, // пауза после стопа
  reverseOnOpposite: true, // закрыть позицию и перевернуться по обратному сигналу
  feePct: 0.1, // комиссия за круг, %
};

// ---------- Базовые функции ----------
const isNum = (v) => v != null && Number.isFinite(v);

// Сглаживание со стартом по SMA (пропускает null в начале)
function smooth(values, len, alpha) {
  const out = new Array(values.length).fill(null);
  let cnt = 0;
  let sum = 0;
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!isNum(v)) continue;
    if (prev == null) {
      sum += v;
      cnt++;
      if (cnt === len) {
        prev = sum / len;
        out[i] = prev;
      }
    } else {
      prev += alpha * (v - prev);
      out[i] = prev;
    }
  }
  return out;
}

const ema = (v, len) => smooth(v, len, 2 / (len + 1));
const rma = (v, len) => smooth(v, len, 1 / len);

function sma(values, len) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (isNum(v)) {
      sum += v;
      cnt++;
    }
    if (i >= len) {
      const old = values[i - len];
      if (isNum(old)) {
        sum -= old;
        cnt--;
      }
    }
    if (i >= len - 1 && cnt === len) out[i] = sum / len;
  }
  return out;
}

function bollinger(close, len, mult) {
  const mid = sma(close, len);
  const upper = new Array(close.length).fill(null);
  const lower = new Array(close.length).fill(null);
  for (let i = len - 1; i < close.length; i++) {
    let s = 0;
    for (let j = i - len + 1; j <= i; j++) s += (close[j] - mid[i]) ** 2;
    const sd = Math.sqrt(s / len);
    upper[i] = mid[i] + mult * sd;
    lower[i] = mid[i] - mult * sd;
  }
  return { mid, upper, lower };
}

function rsiCalc(close, len) {
  const gains = new Array(close.length).fill(null);
  const losses = new Array(close.length).fill(null);
  for (let i = 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    gains[i] = d > 0 ? d : 0;
    losses[i] = d < 0 ? -d : 0;
  }
  const rg = rma(gains, len);
  const rl = rma(losses, len);
  return close.map((_, i) => {
    if (rg[i] == null || rl[i] == null) return null;
    if (rl[i] === 0) return rg[i] === 0 ? 50 : 100;
    return 100 - 100 / (1 + rg[i] / rl[i]);
  });
}

function trueRange(high, low, close) {
  return high.map((h, i) =>
    i === 0
      ? h - low[i]
      : Math.max(h - low[i], Math.abs(h - close[i - 1]), Math.abs(low[i] - close[i - 1])),
  );
}

const atrCalc = (high, low, close, len) => rma(trueRange(high, low, close), len);

function adxCalc(high, low, close, len) {
  const n = close.length;
  const pdm = new Array(n).fill(null);
  const mdm = new Array(n).fill(null);
  const tr = new Array(n).fill(null);
  const trFull = trueRange(high, low, close);
  for (let i = 1; i < n; i++) {
    const up = high[i] - high[i - 1];
    const down = low[i - 1] - low[i];
    pdm[i] = up > down && up > 0 ? up : 0;
    mdm[i] = down > up && down > 0 ? down : 0;
    tr[i] = trFull[i];
  }
  const sTr = rma(tr, len);
  const sP = rma(pdm, len);
  const sM = rma(mdm, len);
  const dx = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (sTr[i] == null || sTr[i] === 0) continue;
    const p = (100 * sP[i]) / sTr[i];
    const m = (100 * sM[i]) / sTr[i];
    dx[i] = p + m === 0 ? 0 : (100 * Math.abs(p - m)) / (p + m);
  }
  return rma(dx, len);
}

function macdCalc(close, fast, slow, signal) {
  const ef = ema(close, fast);
  const es = ema(close, slow);
  const line = close.map((_, i) =>
    ef[i] != null && es[i] != null ? ef[i] - es[i] : null,
  );
  const sig = ema(line, signal);
  return line.map((v, i) => (v != null && sig[i] != null ? v - sig[i] : null));
}

function supertrendCalc(high, low, close, atr, mult) {
  const n = close.length;
  const dir = new Array(n).fill(null);
  let fu = null;
  let fl = null;
  let d = 1;
  for (let i = 0; i < n; i++) {
    const a = atr[i];
    if (a == null) continue;
    const hl2 = (high[i] + low[i]) / 2;
    const bu = hl2 + mult * a;
    const bl = hl2 - mult * a;
    if (fu == null) {
      fu = bu;
      fl = bl;
      d = close[i] >= hl2 ? 1 : -1;
    } else {
      fu = bu < fu || close[i - 1] > fu ? bu : fu;
      fl = bl > fl || close[i - 1] < fl ? bl : fl;
      if (d === 1 && close[i] < fl) d = -1;
      else if (d === -1 && close[i] > fu) d = 1;
    }
    dir[i] = d;
  }
  return dir;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- Основная функция ----------
export function computeAlpha(data, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const n = data.length;

  const open = data.map((c) => c.open);
  const high = data.map((c) => c.high);
  const low = data.map((c) => c.low);
  const close = data.map((c) => c.close);
  const vol = data.map((c) => {
    const raw = c.volume ?? c.vol ?? c.v;
    const v = Number(raw);
    return raw != null && Number.isFinite(v) ? v : null;
  });
  const hasVol = vol.some((v) => v != null && v > 0);

  // Если данных мало — укорачиваем медленную EMA
  const slowLen = Math.min(o.slowLen, Math.max(o.midLen + 10, Math.floor(n * 0.6)));

  const fast = ema(close, o.fastLen);
  const mid = ema(close, o.midLen);
  const slow = ema(close, slowLen);
  const rsi = rsiCalc(close, o.rsiLen);
  const atr = atrCalc(high, low, close, o.atrLen);
  const adx = adxCalc(high, low, close, o.adxLen);
  const bb = bollinger(close, o.bbLen, o.bbMult);
  const hist = macdCalc(close, o.macdFast, o.macdSlow, o.macdSignal);
  const stAtr = atrCalc(high, low, close, o.stLen);
  const stDir = supertrendCalc(high, low, close, stAtr, o.stMult);
  const volAvg = sma(
    vol.map((v) => v ?? 0),
    o.volLen,
  );

  const warm = Math.max(
    slowLen + 10,
    o.bbLen + 3,
    o.adxLen * 2 + 2,
    o.macdSlow + o.macdSignal + 2,
  );

  // Оценка сигнала на закрытой свече i в направлении s (1 = buy, -1 = sell)
  const evaluate = (i, s) => {
    const c = close[i];
    const a = atr[i];
    if ((a / c) * 100 < o.minAtrPct) return null;

    const range = high[i] - low[i] || 1e-12;
    const body = Math.abs(c - open[i]);
    const closePos = s === 1 ? (c - low[i]) / range : (high[i] - c) / range;
    const dirCandle = s * (c - open[i]) > 0;
    const rsiNow = rsi[i];
    const rsiTurn = s * (rsiNow - rsi[i - 1]) > 0;
    const macdUp = s * (hist[i] - hist[i - 1]) > 0;
    const volOk =
      !hasVol || (volAvg[i] != null && vol[i] != null && vol[i] >= o.volMult * volAvg[i]);

    const trendOk =
      s * (c - slow[i]) > 0 &&
      s * (mid[i] - slow[i]) > 0 &&
      s * (slow[i] - slow[i - 10]) >= 0;

    let setup = null;

    // P — pullback: откат к EMA21/50 внутри тренда и возобновление движения
    if (
      o.enablePullback &&
      trendOk &&
      adx[i] >= o.adxTrendMin &&
      dirCandle &&
      s * (c - fast[i]) > 0 &&
      (rsiTurn || macdUp)
    ) {
      let touched = false;
      let extRsi = s === 1 ? Infinity : -Infinity;
      for (let j = i - o.pullbackBars; j <= i; j++) {
        const zone =
          s === 1
            ? Math.max(fast[j], mid[j]) + o.pullbackZoneAtr * atr[j]
            : Math.min(fast[j], mid[j]) - o.pullbackZoneAtr * atr[j];
        if (s === 1 ? low[j] <= zone : high[j] >= zone) touched = true;
        extRsi = s === 1 ? Math.min(extRsi, rsi[j]) : Math.max(extRsi, rsi[j]);
      }
      if (touched && (s === 1 ? extRsi <= o.pullbackRsi : extRsi >= 100 - o.pullbackRsi))
        setup = 'pullback';
    }

    // R — reversion: выход за Bollinger и возврат внутрь (не против сильного тренда)
    if (!setup && o.enableReversion && adx[i] < o.adxRangeMax && dirCandle && rsiTurn) {
      let pierce = false;
      let extRsi = s === 1 ? Infinity : -Infinity;
      for (let j = i - 2; j <= i; j++) {
        if (s === 1 ? low[j] < bb.lower[j] : high[j] > bb.upper[j]) pierce = true;
        extRsi = s === 1 ? Math.min(extRsi, rsi[j]) : Math.max(extRsi, rsi[j]);
      }
      const back = s === 1 ? c > bb.lower[i] : c < bb.upper[i];
      if (
        pierce &&
        back &&
        (s === 1 ? extRsi <= o.reversionRsi : extRsi >= 100 - o.reversionRsi)
      )
        setup = 'reversion';
    }

    // B — breakout: закрытие за максимумом/минимумом N свечей с силой
    if (
      !setup &&
      o.enableBreakout &&
      adx[i] >= o.adxTrendMin &&
      body / range >= 0.5 &&
      closePos >= 0.65 &&
      volOk
    ) {
      let ext = s === 1 ? -Infinity : Infinity;
      for (let j = i - o.breakoutLen; j < i; j++) {
        ext = s === 1 ? Math.max(ext, high[j]) : Math.min(ext, low[j]);
      }
      const broke = s === 1 ? c > ext : c < ext;
      const roomRsi =
        s === 1 ? rsiNow < o.breakoutRsiMax : rsiNow > 100 - o.breakoutRsiMax;
      if (broke && roomRsi && (s * (c - slow[i]) > 0 || s * (mid[i] - slow[i]) > 0))
        setup = 'breakout';
    }

    // C — cross: EMA21 пересекает EMA50 по направлению сделки
    if (
      !setup &&
      o.enableCross &&
      dirCandle &&
      s * (fast[i] - mid[i]) > 0 &&
      s * (fast[i - 1] - mid[i - 1]) <= 0 &&
      s * (c - slow[i]) > 0 &&
      s * (slow[i] - slow[i - 10]) >= 0
    ) {
      setup = 'cross';
    }

    if (!setup) return null;

    // Подтверждения (максимум 6)
    let score = 0;
    if (s * (c - slow[i]) > 0) score++; // сторона относительно EMA200
    if (macdUp) score++; // MACD-импульс
    if (volOk) score++;
    if (body / range >= 0.5 && closePos >= 0.6) score++; // качественная свеча
    if (stDir[i] === s) score++; // Supertrend
    if (s === 1 ? rsiNow < 65 : rsiNow > 35) score++; // запас по RSI
    if (score < o.minScore) return null;

    return { setup, score };
  };

  const signals = [];
  const trades = [];
  let openTrade = null;
  let cooldownUntil = -1;

  const ready = (i) =>
    i >= warm &&
    [fast, mid, slow, rsi, atr, adx, bb.lower, bb.upper, hist, stDir].every(
      (arr) => arr[i] != null && arr[i - 1] != null,
    );

  const candidate = (i) => {
    if (!ready(i)) return null;
    const evB = evaluate(i, 1);
    const evS = evaluate(i, -1);
    if (evB && (!evS || evB.score >= evS.score)) return { side: 'buy', ev: evB };
    if (evS) return { side: 'sell', ev: evS };
    return null;
  };

  const closeTrade = (t, i, exit, reason) => {
    const s = t.side === 'buy' ? 1 : -1;
    t.exitIndex = i;
    t.exit = exit;
    t.reason = reason;
    t.pnl = (s * (exit - t.entry) * 100) / t.entry - o.feePct;
    t.r = t.pnl / ((t.risk * 100) / t.entry);
    cooldownUntil = i + (reason === 'sl' ? o.stopCooldownBars : o.cooldownBars);
    openTrade = null;
  };

  const openNew = (i, side, ev) => {
    const s = side === 'buy' ? 1 : -1;
    const c = close[i];
    const a = atr[i];

    // Структурный стоп за экстремумом последних 5 свечей, ограниченный по ATR
    let extreme = s === 1 ? Infinity : -Infinity;
    for (let j = i - 4; j <= i; j++) {
      extreme = s === 1 ? Math.min(extreme, low[j]) : Math.max(extreme, high[j]);
    }
    const rawStop =
      s === 1 ? extreme - o.stopBufferAtr * a : extreme + o.stopBufferAtr * a;
    const risk = clamp(Math.abs(c - rawStop), o.minStopAtr * a, o.maxStopAtr * a);
    const rr = (o.rrBySetup && o.rrBySetup[ev.setup]) || o.rr;
    const stop = c - s * risk;
    const target = c + s * risk * rr;

    signals.push({
      index: i,
      type: side,
      setup: ev.setup,
      score: ev.score,
      pending: i === n - 1,
    });

    openTrade = {
      side,
      setup: ev.setup,
      score: ev.score,
      entryIndex: i,
      entry: c,
      stop,
      initialStop: stop,
      target,
      risk,
      be: false,
      exitIndex: null,
      exit: null,
      reason: null,
      pnl: null,
      r: null,
    };
    trades.push(openTrade);
  };

  for (let i = 0; i < n; i++) {
    // --- Сопровождение открытой сделки ---
    if (openTrade && i > openTrade.entryIndex) {
      const t = openTrade;
      const s = t.side === 'buy' ? 1 : -1;
      const hitStop = s === 1 ? low[i] <= t.stop : high[i] >= t.stop;
      const hitTP = s === 1 ? high[i] >= t.target : low[i] <= t.target;
      let exit = null;
      let reason = null;

      if (hitStop) {
        // Если в одной свече задеты и стоп, и тейк — консервативно считаем стоп
        exit = t.stop;
        reason = t.be ? 'be' : 'sl';
      } else if (hitTP) {
        exit = t.target;
        reason = 'tp';
      } else if (i - t.entryIndex >= o.maxBars) {
        exit = close[i];
        reason = 'time';
      }

      if (exit != null) {
        closeTrade(t, i, exit, reason);
        continue;
      }

      if (
        !t.be &&
        (s === 1
          ? high[i] >= t.entry + t.risk * o.beAtR
          : low[i] <= t.entry - t.risk * o.beAtR)
      ) {
        t.be = true;
        t.stop = t.entry;
      }

      // Разворот: обратный сигнал закрывает позицию по цене закрытия и открывает новую
      if (o.reverseOnOpposite) {
        const cand = candidate(i);
        if (cand && cand.side !== t.side) {
          closeTrade(t, i, close[i], 'flip');
          openNew(i, cand.side, cand.ev);
        }
      }
      continue;
    }
    if (openTrade) continue;

    // --- Поиск входа ---
    if (i < cooldownUntil) continue;
    const cand = candidate(i);
    if (cand) openNew(i, cand.side, cand.ev);
  }

  // ---------- Статистика по закрытым сделкам ----------
  const closed = trades.filter((t) => t.exitIndex != null);
  const wins = closed.filter((t) => t.pnl > 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = closed
    .filter((t) => t.pnl <= 0)
    .reduce((a, t) => a + Math.abs(t.pnl), 0);
  const stats = {
    trades: closed.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    avgR: closed.length ? closed.reduce((a, t) => a + t.r, 0) / closed.length : 0,
    totalPct: closed.reduce((a, t) => a + t.pnl, 0),
  };

  return { mid, slow, signals, trades, stats, openTrade, slowLen };
}
