// Единый источник всех констант графика: цвета, размеры, лимиты зума, дефолты
// индикаторов (NW/MA/PRO/ALPHA), пороги, форматирование цены по порядку величин.
//
// Любой тюнинг внешнего вида или порогов индикаторов делается в одном месте

export const MIN_LIMIT = 10;
export const MAX_LIMIT = 300;
export const DEFAULT_LIMIT = 100;

export const ZOOM_IN_THRESHOLD = 1.05;
export const ZOOM_OUT_THRESHOLD = 0.95;

export const GREEN = '#4CAF50';
export const RED = '#F44336';
export const AXIS_COLOR = 'rgba(255,255,255,0.4)';

export const MARGIN = { top: 15, right: 15, bottom: 28, left: 45 };

export const X_LABELS_COUNT = 4;
export const DAY_MS = 24 * 3600 * 1000;

// ---------- Панель объёмов ----------
export const VOLUME_SHARE = 0.18;
export const VOLUME_GAP = 6;
export const VOLUME_OPACITY = 0.45;
export const VOLUME_LABEL_COLOR = 'rgba(255,255,255,0.4)';

// ---------- Профиль объёма ----------
export const SHOW_VOLUME_PROFILE = false;
export const VP_ROWS = 48;
export const VP_WIDTH_SHARE = 0.16;
export const VP_RIGHT_OFFSET = 2;
export const VP_OPACITY = 0.22;

// ---------- NW ----------
export const NW_BTN_BORDER = '#B8962E';
export const NW_BANDWIDTH = 8;
export const NW_MULT = 3;
export const NW_WINDOW = 500;
export const NW_UP_COLOR = '#39FF14';
export const NW_DN_COLOR = '#FF1100';
export const NW_MID_COLOR = 'rgba(255,255,255,0.35)';

// ---------- MA ----------
export const MA_MODE = 'or';
export const MA_OPTIONS = {
  fast: 50,
  slow: 200,
  maType: 'ema',
  bbLen: 20,
  bbMult: 2,
  bbReentry: true,
  bbBounceAtr: 0.5,
  confirmBars: 2,
  minGapPct: 0.3,
  maxWait: 8,
  useRsi: true,
  rsiLen: 14,
  rsiHigh: 70,
  rsiLow: 30,
  atrLen: 14,
  stopAtr: 2.5,
  takeAtr: 5,
  useTrendFilter: true,
  trendLen: 200,
  useVolumeFilter: false,
  volumeLen: 20,
  volumeMult: 1.2,
  useContinuation: true,
  continuationBars: 5,
  cooldownBars: 3,
  rsiSellMax: 55,
  rsiBuyMin: 45,
  useRegimeFilter: true,
  useAntiKnife: true,
  useAntiDoubleBottom: true,
  structureBouncePct: 1.5,
  structureLookback: 15,
  useAntiFreefall: true,
  stopCooldownBars: 12,
};

export const MA_FAST_COLOR = '#2962FF';
export const MA_SLOW_COLOR = '#FF9800';
export const BB_BASIS_COLOR = '#FF6D00';
export const BB_BAND_COLOR = '#2962FF';
export const BB_FILL_COLOR = 'rgba(33,150,243,0.1)';
export const MA_BUY_COLOR = '#2196F3';
export const MA_SELL_COLOR = '#FF9800';
export const MA_FILL_OPACITY = 0.5;
export const MA_SIGNAL_BAR = 'signal';

// ---------- PRO ----------
export const PRO_COLOR_MAIN = '#E040FB';
export const PRO_COLOR_EMA50 = '#00E5FF';
export const PRO_COLOR_BUY = '#00E676';
export const PRO_COLOR_SELL = '#FF1744';

// ---------- ALPHA ----------
export const ALPHA_COLOR_MAIN = '#FFD740';
export const ALPHA_COLOR_MID = '#FFD740';
export const ALPHA_COLOR_SLOW = 'rgba(255,255,255,0.75)';
export const ALPHA_COLOR_BUY = '#00C853';
export const ALPHA_COLOR_SELL = '#FF5252';
export const ALPHA_BOX_OPACITY = 0.14;
export const ALPHA_PILL_W = 38;
export const ALPHA_PILL_H = 12;
export const ALPHA_POINTER = 4;
export const ALPHA_SETUP_LETTER = {
  pullback: 'P',
  reversion: 'R',
  breakout: 'B',
  cross: 'C',
};

export const DECIMALS_BY_PRICE = [
  [1, 2],
  [0.1, 3],
  [0.01, 4],
  [0.001, 5],
  [0.0001, 6],
];
