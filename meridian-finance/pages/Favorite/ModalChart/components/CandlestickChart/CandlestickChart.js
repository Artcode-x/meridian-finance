import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useMemo } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Svg, {
  Rect,
  Line,
  G,
  Path,
  Polygon,
  Circle,
  Text as SvgText,
  Defs,
  ClipPath,
} from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { setDoubleTap } from '../../../../../store/reducersSlice';
import { RFValue } from 'react-native-responsive-fontsize';
import { styles } from './CandlestickChart.styles';

import { computeNW } from './indicators/computeNW';
import { computeMACross } from './indicators/computeMACross';
import { computePROIndicator } from './indicators/computePROIndicator';
import { profileBars } from './indicators/profileBars';

// ---------- Константы графика ----------
const MIN_LIMIT = 10;
const MAX_LIMIT = 300;
const DEFAULT_LIMIT = 100;

const ZOOM_IN_THRESHOLD = 1.05;
const ZOOM_OUT_THRESHOLD = 0.95;

const GREEN = '#4CAF50';
const RED = '#F44336';
const AXIS_COLOR = 'rgba(255,255,255,0.4)';

const MARGIN = { top: 15, right: 15, bottom: 28, left: 45 };

const X_LABELS_COUNT = 4;
const DAY_MS = 24 * 3600 * 1000;

// ---------- Панель объёмов ----------
const VOLUME_SHARE = 0.18;
const VOLUME_GAP = 6;
const VOLUME_OPACITY = 0.45;
const VOLUME_LABEL_COLOR = 'rgba(255,255,255,0.4)';

// ---------- Профиль объёма ----------
const SHOW_VOLUME_PROFILE = false;
const VP_ROWS = 48;
const VP_WIDTH_SHARE = 0.16;
const VP_RIGHT_OFFSET = 2;
const VP_OPACITY = 0.22;

const NW_BTN_BORDER = '#B8962E';
const DECIMALS_BY_PRICE = [
  [1, 2],
  [0.1, 3],
  [0.01, 4],
  [0.001, 5],
  [0.0001, 6],
];

// ---------- NW ----------
const NW_BANDWIDTH = 8;
const NW_MULT = 3;
const NW_WINDOW = 500;
const NW_UP_COLOR = '#39FF14';
const NW_DN_COLOR = '#FF1100';
const NW_MID_COLOR = 'rgba(255,255,255,0.35)';

// ---------- MA ----------
const MA_MODE = 'or';
const MA_OPTIONS = {
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

const MA_FAST_COLOR = '#2962FF';
const MA_SLOW_COLOR = '#FF9800';
const BB_BASIS_COLOR = '#FF6D00';
const BB_BAND_COLOR = '#2962FF';
const BB_FILL_COLOR = 'rgba(33,150,243,0.1)';
const MA_BUY_COLOR = '#2196F3';
const MA_SELL_COLOR = '#FF9800';
const MA_FILL_OPACITY = 0.5;

const MA_SIGNAL_BAR = 'signal';

// ---------- PRO ----------
const PRO_COLOR_MAIN = '#E040FB';
const PRO_COLOR_EMA50 = '#00E5FF';
const PRO_COLOR_BUY = '#00E676';
const PRO_COLOR_SELL = '#FF1744';

// ---------- Утилиты ----------
const formatPrice = (price) => {
  if (price >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
  if (price >= 1e3) return `$${(price / 1e3).toFixed(2)}k`;
  const decimals = DECIMALS_BY_PRICE.find(([min]) => price >= min)?.[1] ?? 8;
  const text = `$${price.toFixed(decimals)}`;
  return text.length > 12 ? `$${price.toExponential(3)}` : text;
};

const formatVolume = (v) => {
  if (v == null) return '';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
};

const pad2 = (n) => String(n).padStart(2, '0');
const isGreen = (candle) => candle.close >= candle.open;

const getVolume = (candle) => {
  const raw = candle.volume ?? candle.vol ?? candle.v;
  if (raw == null) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
};

const getTime = (candle) => {
  const t = candle.time ?? candle.timestamp ?? candle.openTime ?? candle.t;
  if (t == null) return null;
  const ms = typeof t === 'number' ? t : new Date(t).getTime();
  if (isNaN(ms)) return null;
  return ms < 1e12 ? ms * 1000 : ms;
};

const buildXLabels = (data, start, limit, candleStep) => {
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

// ---------- Компонент ----------
const CandlestickChart = ({
  data,
  width,
  height,
  limit,
  setLimit,
  nwDefault = false,
  nwBandwidth = NW_BANDWIDTH,
  nwMult = NW_MULT,
  maDefault = false,
  maMode = MA_MODE,
  proDefault = false,
}) => {
  const [rawOffset, setRawOffset] = useState(0);
  const [showNW, setShowNW] = useState(nwDefault);
  const [showVP, setShowVP] = useState(SHOW_VOLUME_PROFILE);
  const [showMA, setShowMA] = useState(maDefault);
  const [showPRO, setShowPRO] = useState(proDefault);

  const startOffset = useRef(0);
  const pinchRef = useRef();
  const panRef = useRef();
  const dispatch = useDispatch();

  // --- Расчёт индикаторов (memoized) ---
  const nw = useMemo(
    () =>
      showNW && data && data.length > 1
        ? computeNW(data, nwBandwidth, nwMult, NW_WINDOW)
        : null,
    [showNW, data, nwBandwidth, nwMult],
  );

  const ma = useMemo(
    () =>
      showMA && data && data.length > 1
        ? computeMACross(data, { ...MA_OPTIONS, mode: maMode })
        : null,
    [showMA, data, maMode],
  );

  const pro = useMemo(
    () => (showPRO && data && data.length > 1 ? computePROIndicator(data) : null),
    [showPRO, data],
  );

  if (!data || data.length === 0) return null;

  // ===== 1. Окно =====
  const currentLimit = Math.max(1, Math.min(limit, data.length));
  const maxOffset = data.length - currentLimit;
  const offset = Math.min(rawOffset, maxOffset);
  const start = Math.floor(data.length - currentLimit - offset);
  const displayData = data.slice(start, start + currentLimit + 2);

  // ===== 2. Диапазон цен =====
  let minPrice = Math.min(...displayData.map((c) => c.low));
  let maxPrice = Math.max(...displayData.map((c) => c.high));

  if (nw) {
    for (let k = 0; k < displayData.length; k++) {
      const idx = start + k - nw.first;
      if (idx < 0 || idx >= nw.mid.length) continue;
      if (nw.lower[idx] < minPrice) minPrice = nw.lower[idx];
      if (nw.upper[idx] > maxPrice) maxPrice = nw.upper[idx];
    }
  }

  const drawMALines = !!ma && maMode !== 'bb';
  const drawBB = !!ma && maMode !== 'ma';

  if (ma) {
    const series = [];
    if (drawMALines) series.push(ma.maFast, ma.maSlow);
    if (drawBB) series.push(ma.bbUpper, ma.bbLower);
    for (const s of series) {
      for (let k = 0; k < displayData.length; k++) {
        const v = s[start + k];
        if (v == null) continue;
        if (v < minPrice) minPrice = v;
        if (v > maxPrice) maxPrice = v;
      }
    }
  }

  if (pro) {
    for (let k = 0; k < displayData.length; k++) {
      const v50 = pro.ema50[start + k];
      const v200 = pro.ema200[start + k];
      if (v50 != null) {
        if (v50 < minPrice) minPrice = v50;
        if (v50 > maxPrice) maxPrice = v50;
      }
      if (v200 != null) {
        if (v200 < minPrice) minPrice = v200;
        if (v200 > maxPrice) maxPrice = v200;
      }
    }
  }

  const priceRange = maxPrice - minPrice || 1;

  // ===== 2.1 Объём =====
  let maxVolume = 0;
  for (let k = 0; k < displayData.length; k++) {
    const v = getVolume(displayData[k]);
    if (v != null && v > maxVolume) maxVolume = v;
  }
  const hasVolume = maxVolume > 0;

  // ===== 3. Размеры и масштаб =====
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const axisY = height - MARGIN.bottom;

  const volGap = hasVolume ? VOLUME_GAP : 0;
  const volHeight = hasVolume ? innerHeight * VOLUME_SHARE : 0;
  const priceHeight = innerHeight - volHeight - volGap;
  const priceBottom = MARGIN.top + priceHeight;

  const hasProfile = showVP && hasVolume;
  const profileMaxWidth = hasProfile ? innerWidth * VP_WIDTH_SHARE : 0;

  const candleStep = innerWidth / currentLimit;
  const candleWidth = Math.max(2, candleStep * 0.6);

  const xScale = (index) => MARGIN.left + index * candleStep;
  const yScale = (price) =>
    MARGIN.top + priceHeight - ((price - minPrice) / priceRange) * priceHeight;

  const horizontalBars = hasProfile
    ? profileBars({
        displayData,
        visibleCount: Math.min(currentLimit, displayData.length),
        minPrice,
        priceRange,
        rows: VP_ROWS,
        maxWidth: profileMaxWidth,
        yScale,
        getVolume,
        isGreen,
      })
    : [];

  // ===== 3.1 NW пути =====
  const buildNWPath = (values) => {
    let d = '';
    let penDown = false;
    for (let k = 0; k < displayData.length; k++) {
      const idx = start + k - nw.first;
      const v = idx >= 0 && idx < values.length ? values[idx] : null;
      if (v == null) {
        penDown = false;
        continue;
      }
      d += `${penDown ? 'L' : 'M'}${xScale(k).toFixed(1)} ${yScale(v).toFixed(1)} `;
      penDown = true;
    }
    return d;
  };

  const nwPaths = nw
    ? {
        upper: buildNWPath(nw.upper),
        mid: buildNWPath(nw.mid),
        lower: buildNWPath(nw.lower),
      }
    : null;

  const nwSignals = nw
    ? nw.signals
        .filter((s) => s.index >= start && s.index < start + displayData.length)
        .map((s) => {
          const candle = data[s.index];
          const x = xScale(s.index - start);
          if (s.type === 'sell') {
            const y = yScale(candle.high) - 3;
            return {
              key: `nw-s-${s.index}`,
              color: NW_DN_COLOR,
              points: `${x},${y} ${x - 3.5},${y - 6} ${x + 3.5},${y - 6}`,
            };
          }
          const y = yScale(candle.low) + 3;
          return {
            key: `nw-b-${s.index}`,
            color: NW_UP_COLOR,
            points: `${x},${y} ${x - 3.5},${y + 6} ${x + 3.5},${y + 6}`,
          };
        })
    : [];

  // ===== 3.2 MA пути =====
  const buildMAPath = (values) => {
    let d = '';
    let penDown = false;
    for (let k = 0; k < displayData.length; k++) {
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

  const buildBBFill = () => {
    const ks = [];
    for (let k = 0; k < displayData.length; k++) {
      if (ma.bbUpper[start + k] != null) ks.push(k);
    }
    if (ks.length < 2) return '';
    let d = '';
    ks.forEach((k, n) => {
      d += `${n === 0 ? 'M' : 'L'}${xScale(k)} ${yScale(ma.bbUpper[start + k])} `;
    });
    for (let n = ks.length - 1; n >= 0; n--) {
      d += `L${xScale(ks[n])} ${yScale(ma.bbLower[start + ks[n]])} `;
    }
    return d + 'Z';
  };

  let fillProfit = '';
  let fillLoss = '';

  if (ma) {
    const from = start - 1;
    const to = start + displayData.length;

    for (const t of ma.trades) {
      const end = t.exitIndex ?? data.length;
      if (end < from || t.entryIndex > to) continue;

      const pts = [];
      for (let j = Math.max(t.entryIndex, from); j < Math.min(end, to + 1); j++) {
        pts.push({ i: j, p: data[j].close });
      }
      if (
        t.exitIndex != null &&
        pts.length > 0 &&
        pts[pts.length - 1].i === t.exitIndex - 1 &&
        t.exitIndex <= to
      ) {
        pts.push({ i: t.exitIndex, p: t.exit });
      }

      const ye = yScale(t.entry);
      const gain = (p) => (t.side === 'buy' ? p - t.entry : t.entry - p);

      for (let n = 0; n < pts.length - 1; n++) {
        const a = pts[n];
        const b = pts[n + 1];
        const xa = xScale(a.i - start);
        const xb = xScale(b.i - start);
        const ya = yScale(a.p);
        const yb = yScale(b.p);
        const da = gain(a.p);
        const db = gain(b.p);

        if (da * db >= 0) {
          const d = `M${xa} ${ye} L${xa} ${ya} L${xb} ${yb} L${xb} ${ye} Z `;
          if (da + db >= 0) fillProfit += d;
          else fillLoss += d;
        } else {
          const xc = xa + (da / (da - db)) * (xb - xa);
          const d1 = `M${xa} ${ye} L${xa} ${ya} L${xc} ${ye} Z `;
          const d2 = `M${xc} ${ye} L${xb} ${yb} L${xb} ${ye} Z `;
          if (da > 0) fillProfit += d1;
          else fillLoss += d1;
          if (db > 0) fillProfit += d2;
          else fillLoss += d2;
        }
      }
    }
  }

  const maPaths = ma
    ? {
        fast: drawMALines ? buildMAPath(ma.maFast) : '',
        slow: drawMALines ? buildMAPath(ma.maSlow) : '',
        bbMid: drawBB ? buildMAPath(ma.bbMid) : '',
        bbUpper: drawBB ? buildMAPath(ma.bbUpper) : '',
        bbLower: drawBB ? buildMAPath(ma.bbLower) : '',
        bbFill: drawBB ? buildBBFill() : '',
      }
    : null;

  const maSignals = ma
    ? ma.signals
        .map((s) => ({
          ...s,
          bar: !s.pending && MA_SIGNAL_BAR === 'entry' ? s.entryIndex : s.index,
        }))
        .filter((s) => s.bar >= start && s.bar < start + displayData.length)
        .map((s) => {
          const candle = data[s.bar];
          const x = xScale(s.bar - start);
          const isSell = s.type === 'sell';
          const hw = Math.max(3, Math.min(5.5, candleStep * 0.45));
          const h = hw * 1.7;
          const gap = showNW ? 12 : 4;

          let apex = isSell ? yScale(candle.high) - gap : yScale(candle.low) + gap;
          let base = isSell ? apex - h : apex + h;

          const minY = MARGIN.top + 1;
          const maxY = priceBottom - 1;
          if (isSell && base < minY) {
            apex += minY - base;
            base = minY;
          }
          if (!isSell && base > maxY) {
            apex -= base - maxY;
            base = maxY;
          }

          return {
            key: `ma-${s.type}-${s.index}`,
            color: isSell ? MA_SELL_COLOR : MA_BUY_COLOR,
            pending: s.pending,
            points: `${x},${apex} ${x - hw},${base} ${x + hw},${base}`,
          };
        })
    : [];

  const maStatsText = ma
    ? `MA · ${ma.stats.trades} trades · win ${ma.stats.winRate.toFixed(0)}% · PF ${ma.stats.profitFactor == null ? '—' : ma.stats.profitFactor.toFixed(2)}`
    : '';

  // ===== 3.3 PRO пути =====
  const proPaths = pro
    ? {
        ema50: buildMAPath(pro.ema50),
        ema200: buildMAPath(pro.ema200),
      }
    : null;

  const proSignals = pro
    ? pro.signals
        .filter((s) => s.index >= start && s.index < start + displayData.length)
        .map((s) => {
          const candle = data[s.index];
          const x = xScale(s.index - start);
          const isBuy = s.type === 'buy';
          const offsetY = showNW ? 24 : 16;
          const y = isBuy ? yScale(candle.low) + offsetY : yScale(candle.high) - offsetY;
          return { key: `pro-${s.index}`, x, y, isBuy };
        })
    : [];

  // ===== 4. Подписи осей =====
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
    const price = minPrice + (priceRange * i) / 5;
    return { text: formatPrice(price), y: yScale(price) };
  });

  const xAxisLabels = buildXLabels(data, start, currentLimit, candleStep);

  // ===== 5. Плашка цены =====
  const lastCandle = displayData[displayData.length - 1];
  const lastColor = isGreen(lastCandle) ? GREEN : RED;
  const lastPriceY = Math.max(
    MARGIN.top,
    Math.min(priceBottom, yScale(lastCandle.close)),
  );
  const tag = { x: 2, width: MARGIN.left + 4, height: 12 };
  tag.y = lastPriceY - tag.height / 2;

  // ===== 6. Экраны =====
  const screenWidth = Dimensions.get('window').width;
  const yAxisLeftOffset = screenWidth > 600 ? 4 : 9;
  const axisLeftLine = screenWidth > 400 && screenWidth < 600 ? 3 : 0;

  // ===== 7. Жесты =====
  const onPinchEnd = ({ nativeEvent }) => {
    if (nativeEvent.oldState !== State.ACTIVE) return;
    if (nativeEvent.scale > ZOOM_IN_THRESHOLD) {
      setLimit(Math.max(MIN_LIMIT, Math.floor(currentLimit * 0.8)));
    } else if (nativeEvent.scale < ZOOM_OUT_THRESHOLD) {
      setLimit(Math.min(MAX_LIMIT, data.length, Math.ceil(currentLimit * 1.2)));
    }
  };

  const onPanStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.BEGAN) startOffset.current = offset;
  };

  const onPan = ({ nativeEvent }) => {
    const next = startOffset.current + nativeEvent.translationX / candleStep;
    setRawOffset(Math.max(0, Math.min(maxOffset, next)));
  };

  const onDoubleTap = ({ nativeEvent }) => {
    if (nativeEvent.state !== State.ACTIVE) return;
    setLimit(DEFAULT_LIMIT);
    setRawOffset(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    dispatch(setDoubleTap());
  };

  const toggleNW = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowNW((v) => !v);
  };
  const toggleVP = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowVP((v) => !v);
  };
  const toggleMA = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowMA((v) => !v);
  };
  const togglePRO = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowPRO((v) => !v);
  };

  // ===== 8. Отрисовка =====
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.chartContainerStyle}>
        <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
          <View style={[styles.chartBox, { width }]}>
            <PinchGestureHandler
              ref={pinchRef}
              simultaneousHandlers={panRef}
              onHandlerStateChange={onPinchEnd}
            >
              <PanGestureHandler
                ref={panRef}
                simultaneousHandlers={pinchRef}
                onHandlerStateChange={onPanStateChange}
                onGestureEvent={onPan}
                minPointers={1}
                maxPointers={1}
              >
                <View style={{ width, height }}>
                  {/* Y-axis labels (React Native Text над SVG) */}
                  {yAxisLabels.map((label, i) => (
                    <Text
                      key={`y-${i}`}
                      style={[
                        styles.yAxisLabel,
                        {
                          position: 'absolute',
                          top: label.y - 8,
                          left: yAxisLeftOffset,
                          zIndex: 1,
                          backgroundColor: 'transparent',
                          fontSize: RFValue(7),
                        },
                      ]}
                    >
                      {label.text}
                    </Text>
                  ))}

                  <View style={{ paddingLeft: axisLeftLine }}>
                    <Svg width={width} height={height}>
                      <Defs>
                        <ClipPath id='plotClip'>
                          <Rect
                            x={MARGIN.left}
                            y={0}
                            width={innerWidth}
                            height={height}
                          />
                        </ClipPath>
                        <ClipPath id='priceClip'>
                          <Rect
                            x={MARGIN.left}
                            y={MARGIN.top}
                            width={innerWidth}
                            height={priceHeight}
                          />
                        </ClipPath>
                      </Defs>

                      {/* Сетка */}
                      {yAxisLabels.map((label, i) => (
                        <Line
                          key={`grid-${i}`}
                          x1={MARGIN.left}
                          x2={width - MARGIN.right}
                          y1={label.y}
                          y2={label.y}
                          stroke='rgba(255,255,255,0.15)'
                          strokeWidth='0.5'
                          strokeDasharray='2,2'
                        />
                      ))}

                      {/* Ось X */}
                      <Line
                        x1={MARGIN.left}
                        x2={width - MARGIN.right}
                        y1={axisY}
                        y2={axisY}
                        stroke={AXIS_COLOR}
                        strokeWidth='1'
                      />
                      {/* Ось Y */}
                      <Line
                        x1={MARGIN.left}
                        x2={MARGIN.left}
                        y1={MARGIN.top}
                        y2={axisY}
                        stroke={AXIS_COLOR}
                        strokeWidth='1'
                      />

                      {/* Разделитель объёмов */}
                      {hasVolume && (
                        <Line
                          x1={MARGIN.left}
                          x2={width - MARGIN.right}
                          y1={priceBottom + volGap / 2}
                          y2={priceBottom + volGap / 2}
                          stroke='rgba(255,255,255,0.12)'
                          strokeWidth='0.5'
                        />
                      )}

                      {/* Профиль объёма */}
                      {hasProfile && (
                        <G opacity={VP_OPACITY}>
                          {horizontalBars.map((bar) => (
                            <G key={`vp-${bar.key}`}>
                              <Rect
                                x={width - VP_RIGHT_OFFSET - bar.upW}
                                y={bar.y}
                                width={bar.upW}
                                height={bar.height}
                                fill={GREEN}
                              />
                              <Rect
                                x={width - VP_RIGHT_OFFSET - bar.upW - bar.downW}
                                y={bar.y}
                                width={bar.downW}
                                height={bar.height}
                                fill={RED}
                              />
                            </G>
                          ))}
                        </G>
                      )}

                      {/* Заливка сделок MA */}
                      {ma && (
                        <G clipPath='url(#priceClip)' opacity={MA_FILL_OPACITY}>
                          <Path d={fillProfit} fill={GREEN} />
                          <Path d={fillLoss} fill={RED} />
                        </G>
                      )}

                      <G clipPath='url(#plotClip)'>
                        {/* Объёмы */}
                        {hasVolume && (
                          <G opacity={VOLUME_OPACITY}>
                            {displayData.map((candle, index) => {
                              const v = getVolume(candle);
                              if (v == null || v <= 0) return null;
                              const barH = Math.max(1, (v / maxVolume) * volHeight);
                              return (
                                <Rect
                                  key={`vol-${start + index}`}
                                  x={xScale(index) - candleWidth / 2}
                                  y={axisY - barH}
                                  width={candleWidth}
                                  height={barH}
                                  fill={isGreen(candle) ? GREEN : RED}
                                />
                              );
                            })}
                          </G>
                        )}

                        {/* NW */}
                        {nwPaths && (
                          <G opacity={0.5}>
                            <Path
                              d={nwPaths.mid}
                              stroke={NW_MID_COLOR}
                              strokeWidth='1'
                              strokeDasharray='4,3'
                              fill='none'
                            />
                            <Path
                              d={nwPaths.upper}
                              stroke={NW_DN_COLOR}
                              strokeWidth='1.5'
                              strokeDasharray='6,3'
                              fill='none'
                            />
                            <Path
                              d={nwPaths.lower}
                              stroke={NW_UP_COLOR}
                              strokeWidth='1.5'
                              strokeDasharray='6,3'
                              fill='none'
                            />
                          </G>
                        )}

                        {/* MA */}
                        {maPaths && (
                          <G>
                            {maPaths.bbFill !== '' && (
                              <Path d={maPaths.bbFill} fill={BB_FILL_COLOR} />
                            )}
                            <Path
                              d={maPaths.bbUpper}
                              stroke={BB_BAND_COLOR}
                              strokeWidth='1'
                              fill='none'
                            />
                            <Path
                              d={maPaths.bbLower}
                              stroke={BB_BAND_COLOR}
                              strokeWidth='1'
                              fill='none'
                            />
                            <Path
                              d={maPaths.bbMid}
                              stroke={BB_BASIS_COLOR}
                              strokeWidth='1'
                              fill='none'
                            />
                            <Path
                              d={maPaths.slow}
                              stroke={MA_SLOW_COLOR}
                              strokeWidth='1.5'
                              fill='none'
                            />
                            <Path
                              d={maPaths.fast}
                              stroke={MA_FAST_COLOR}
                              strokeWidth='1.5'
                              fill='none'
                            />
                          </G>
                        )}

                        {/* PRO — линии EMA50 / EMA200 */}
                        {proPaths && (
                          <G>
                            <Path
                              d={proPaths.ema200}
                              stroke={PRO_COLOR_MAIN}
                              strokeWidth='2'
                              fill='none'
                              opacity={0.8}
                            />
                            <Path
                              d={proPaths.ema50}
                              stroke={PRO_COLOR_EMA50}
                              strokeWidth='1.5'
                              fill='none'
                              opacity={0.6}
                            />
                          </G>
                        )}

                        {/* Свечи */}
                        {displayData.map((candle, index) => {
                          const x = xScale(index);
                          const color = isGreen(candle) ? GREEN : RED;
                          const bodyTop = yScale(Math.max(candle.open, candle.close));
                          const bodyBottom = yScale(Math.min(candle.open, candle.close));
                          return (
                            <G key={`candle-${start + index}`}>
                              <Line
                                x1={x}
                                x2={x}
                                y1={yScale(candle.high)}
                                y2={yScale(candle.low)}
                                stroke={color}
                                strokeWidth='0.8'
                              />
                              <Rect
                                x={x - candleWidth / 2}
                                y={bodyTop}
                                width={candleWidth}
                                height={Math.max(1, bodyBottom - bodyTop)}
                                fill={color}
                                stroke={color}
                                strokeWidth='0.5'
                              />
                            </G>
                          );
                        })}

                        {/* NW сигналы */}
                        {nwSignals.map((s) => (
                          <Polygon key={s.key} points={s.points} fill={s.color} />
                        ))}

                        {/* MA сигналы */}
                        {maSignals.map((s) => (
                          <Polygon
                            key={s.key}
                            points={s.points}
                            fill={s.pending ? 'none' : s.color}
                            stroke={s.color}
                            strokeWidth={s.pending ? 1.2 : 0}
                          />
                        ))}

                        {/* PRO сигналы — большие круги */}
                        {proSignals.map((s) => (
                          <G key={s.key}>
                            <Circle
                              cx={s.x}
                              cy={s.y}
                              r={10}
                              fill={s.isBuy ? PRO_COLOR_BUY : PRO_COLOR_SELL}
                              opacity={0.2}
                            />
                            <Circle
                              cx={s.x}
                              cy={s.y}
                              r={6}
                              fill={s.isBuy ? PRO_COLOR_BUY : PRO_COLOR_SELL}
                            />
                            <SvgText
                              x={s.x}
                              y={s.y + 3}
                              fill='#fff'
                              fontSize='8'
                              fontWeight='bold'
                              textAnchor='middle'
                            >
                              {s.isBuy ? 'B' : 'S'}
                            </SvgText>
                          </G>
                        ))}

                        {/* === ОТРИСОВКА СТОП-ЛОССА И ТЕЙК-ПРОФИТА === */}
                        {pro &&
                          pro.trades.map((t, idx) => {
                            // Ищем, открыта ли сделка прямо сейчас (последняя в массиве и exitIndex = null)
                            const isLastOpen =
                              idx === pro.trades.length - 1 && t.exitIndex === null;
                            if (!isLastOpen) return null;

                            // Превращаем цены в координаты Y
                            const yEntry = yScale(t.entry);
                            const yStop = yScale(t.stop);
                            const yTarget = yScale(t.target);

                            return (
                              <G key='pro-levels'>
                                {/* Линия Стоп-Лосса (Красная) */}
                                <Line
                                  x1={MARGIN.left}
                                  x2={width - MARGIN.right}
                                  y1={yStop}
                                  y2={yStop}
                                  stroke={RED}
                                  strokeWidth='1'
                                  strokeDasharray='2,2'
                                />
                                <SvgText
                                  // x={width - MARGIN.right}
                                  x={MARGIN.left + 62}
                                  y={yStop - 4}
                                  fill={RED}
                                  fontSize='8'
                                  textAnchor='end'
                                >
                                  {`STOP: ${formatPrice(t.stop)}`}
                                </SvgText>

                                {/* Линия Тейк-Профита (Зеленая) */}
                                <Line
                                  x1={MARGIN.left}
                                  x2={width - MARGIN.right}
                                  y1={yTarget}
                                  y2={yTarget}
                                  stroke={GREEN}
                                  strokeWidth='1'
                                  strokeDasharray='2,2'
                                />

                                <SvgText
                                  // x={width - MARGIN.right}
                                  x={MARGIN.left + 62}
                                  y={yTarget - 4}
                                  fill={GREEN}
                                  fontSize='8'
                                  textAnchor='end'
                                >
                                  {` TAKE: ${formatPrice(t.target)}`}
                                </SvgText>

                                {/* Линия Входа (Белая) */}
                                <Line
                                  x1={MARGIN.left}
                                  x2={width - MARGIN.right}
                                  y1={yEntry}
                                  y2={yEntry}
                                  stroke='rgba(255,255,255,0.5)'
                                  strokeWidth='1'
                                />
                                <Rect
                                  x={MARGIN.left}
                                  y={yEntry - 14}
                                  width={70}
                                  height={12}
                                  fill='rgba(0,0,0,0.6)'
                                  rx={2}
                                  ry={2}
                                />
                                <SvgText
                                  x={MARGIN.left + 4} // отступ 4px от левого края
                                  y={yEntry - 6} // центрируем текст по вертикали внутри 12px подложки
                                  fill='rgba(255,255,255,0.85)'
                                  fontSize='8'
                                  textAnchor='start' // текст растет вправо (слева-направо)
                                  fontWeight='bold'
                                >
                                  {`ENTRY: ${formatPrice(t.entry)}`}
                                </SvgText>
                              </G>
                            );
                          })}

                        {/* Подписи оси X */}
                        {xAxisLabels.map((label, i) => (
                          <G key={`xl-${i}`}>
                            <Line
                              x1={label.x}
                              x2={label.x}
                              y1={axisY + 3}
                              y2={axisY + 4}
                              stroke={AXIS_COLOR}
                              strokeWidth='1'
                            />
                            <SvgText
                              x={label.x}
                              y={axisY + 16}
                              fill='rgba(255,255,255,0.6)'
                              fontSize='9'
                              textAnchor={label.anchor}
                            >
                              {label.text}
                            </SvgText>
                          </G>
                        ))}

                        {/* Линия последней цены */}
                        <Line
                          x1={MARGIN.left}
                          x2={width - MARGIN.right}
                          y1={lastPriceY}
                          y2={lastPriceY}
                          stroke={lastColor}
                          strokeWidth='1'
                          strokeDasharray='3,3'
                        />
                      </G>

                      {/* Подпись макс. объёма */}
                      {hasVolume && (
                        <SvgText
                          x={MARGIN.left + 4}
                          y={axisY - volHeight + 9}
                          fill={VOLUME_LABEL_COLOR}
                          fontSize='8.5'
                        >
                          {`Vol ${formatVolume(maxVolume)}`}
                        </SvgText>
                      )}

                      {/* Статистика MA */}
                      {ma && (
                        <SvgText
                          x={MARGIN.left + 4}
                          y={MARGIN.top + 9}
                          fill='rgba(255,255,255,0.55)'
                          fontSize='8.5'
                        >
                          {maStatsText}
                        </SvgText>
                      )}

                      {/* Плашка цены */}
                      <Rect
                        x={tag.x}
                        y={tag.y}
                        width={tag.width}
                        height={tag.height}
                        fill={lastColor}
                        rx={3}
                        ry={3}
                        opacity={0.5}
                      />
                      <SvgText
                        x={tag.x + tag.width / 2}
                        y={tag.y + tag.height / 2 + 3}
                        fill='rgba(255, 255, 255, 0.7)'
                        fontSize={RFValue(7.5)}
                        fontWeight='bold'
                        textAnchor='middle'
                      >
                        {formatPrice(lastCandle.close)}
                      </SvgText>
                    </Svg>
                  </View>
                </View>
              </PanGestureHandler>
            </PinchGestureHandler>

            {/* Кнопки переключения */}
            <TouchableOpacity
              onPress={toggleNW}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 1,
                right: MARGIN.right + 2,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: NW_BTN_BORDER,
                backgroundColor: showNW ? 'rgba(57,255,20,0.12)' : 'transparent',
                opacity: showNW ? 0.95 : 0.6,
              }}
            >
              <Text
                style={{
                  fontSize: RFValue(6),
                  color: showNW ? NW_UP_COLOR : 'rgba(255,255,255,0.8)',
                }}
              >
                NW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleVP}
              activeOpacity={0.6}
              hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 24,
                right: MARGIN.right + 2,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: NW_BTN_BORDER,
                backgroundColor: showVP ? 'rgba(57,255,20,0.12)' : 'transparent',
                opacity: showVP ? 0.95 : 0.6,
              }}
            >
              <Text
                style={{
                  fontSize: RFValue(6),
                  color: showVP ? NW_UP_COLOR : 'rgba(255,255,255,0.8)',
                }}
              >
                VP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleMA}
              activeOpacity={0.6}
              hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 47,
                right: MARGIN.right + 2,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: NW_BTN_BORDER,
                backgroundColor: showMA ? 'rgba(41,98,255,0.18)' : 'transparent',
                opacity: showMA ? 0.95 : 0.6,
              }}
            >
              <Text
                style={{
                  fontSize: RFValue(6),
                  color: showMA ? '#4FC3F7' : 'rgba(255,255,255,0.8)',
                }}
              >
                MA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePRO}
              activeOpacity={0.6}
              hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
              style={{
                position: 'absolute',
                top: 70,
                right: MARGIN.right + 2,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: PRO_COLOR_MAIN,
                backgroundColor: showPRO ? 'rgba(224,64,251,0.15)' : 'transparent',
                opacity: showPRO ? 0.95 : 0.6,
              }}
            >
              <Text
                style={{
                  fontSize: RFValue(6),
                  color: showPRO ? PRO_COLOR_MAIN : 'rgba(255,255,255,0.8)',
                  fontWeight: 'bold',
                }}
              >
                PRO
              </Text>
            </TouchableOpacity>
          </View>
        </TapGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

export default CandlestickChart;
