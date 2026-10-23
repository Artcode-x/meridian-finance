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
  Text as SvgText,
  Defs,
  ClipPath,
} from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { setDoubleTap } from '../../../../../store/reducersSlice';
import { RFValue } from 'react-native-responsive-fontsize';
import { styles } from './CandlestickChart.styles';
import { computeNW } from './indicators/computeNW';
import { profileBars } from './indicators/profileBars';
/* =====================================================================
 * Как работает компонент (коротко):
 *
 * 1. Из всего массива `data` берём "окно" из `limit` свечей.
 *    - limit    — сколько свечей видно на экране (меняется щипком/pinch)
 *    - offset   — на сколько свечей окно сдвинуто в прошлое (меняется свайпом/pan)
 * 2. Находим минимальную и максимальную цену в окне и растягиваем их
 *    на высоту ЦЕНОВОЙ панели (yScale). Номер свечи в окне переводим
 *    в координату X (xScale).
 * 3. Рисуем через SVG: сетку, оси, объёмы, свечи, индикатор, подписи и плашку последней цены.
 * 4. Жесты:
 *    - pinch        → меняет limit (зум)
 *    - pan          → меняет offset (прокрутка по времени)
 *    - двойной тап  → сброс зума и сдвига
 * 5. Индикатор Nadaraya-Watson Envelope (LuxAlgo):
 *    - считается ОДИН раз на весь массив данных (useMemo), а не на каждый
 *      кадр прокрутки — поэтому pan/zoom остаются плавными;
 *    - включается маленькой кнопкой "NW" в правом верхнем углу графика.
 * 6. Объёмы:
 *    - всегда рисуются столбиками внизу графика (отдельная панель под ценой),
 *      цвет столбика = цвет свечи, высота масштабируется по максимуму
 *      среди видимых свечей;
 *    - если в данных нет объёма, панель не показывается и график
 *      занимает всю высоту.
 *
 * Ожидаемый формат свечи: { open, high, low, close, volume, time }
 * (объём может называться volume / vol / v, число или строка;
 *  время может называться time / timestamp / openTime / t,
 *  в секундах или миллисекундах)
 * ===================================================================== */

// ---------- Константы графика ----------

const MIN_LIMIT = 10;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

const ZOOM_IN_THRESHOLD = 1.05;
const ZOOM_OUT_THRESHOLD = 0.95;

const GREEN = '#4CAF50';
const RED = '#F44336';
const AXIS_COLOR = 'rgba(255,255,255,0.4)';

const MARGIN = { top: 15, right: 15, bottom: 28, left: 45 };

const X_LABELS_COUNT = 4;
const DAY_MS = 24 * 3600 * 1000;

// ---------- Константы панели объёмов ----------
const VOLUME_SHARE = 0.18; // какую долю высоты графика занимают объёмы
const VOLUME_GAP = 6; // зазор между ценовой панелью и объёмами, px
const VOLUME_OPACITY = 0.45; // прозрачность столбиков
const VOLUME_LABEL_COLOR = 'rgba(255,255,255,0.4)';

// ---------- Константы горизонтального профиля объёма (справа) ----------
// Профиль показывает, на каких ЦЕНАХ торговалось больше всего (а не когда).
const SHOW_VOLUME_PROFILE = true; // включён ли профиль при запуске (дальше — кнопка VP)
const VP_ROWS = 48; // на сколько ценовых уровней режем диапазон (больше = детальнее)
const VP_WIDTH_SHARE = 0.16; // максимальная ширина профиля — доля ширины графика
const VP_RIGHT_OFFSET = 2; // отступ профиля от правого края экрана, px (0 = вплотную)
const VP_OPACITY = 0.22; // чем меньше, тем прозрачнее
// Цвета профиля: объём растущих свечей — GREEN, падающих — RED (те же, что у свечей)

// Золотая окантовка кнопки NW (тёмное золото)
const NW_BTN_BORDER = '#B8962E';

const DECIMALS_BY_PRICE = [
  [1, 2],
  [0.1, 3],
  [0.01, 4],
  [0.001, 5],
  [0.0001, 6],
];

// ---------- Константы индикатора Nadaraya-Watson Envelope ----------
// Значения по умолчанию такие же, как в LuxAlgo на TradingView:
//   Bandwidth (h) = 8, Mult = 3, расчёт по последним 500 барам.
const NW_BANDWIDTH = 8;
const NW_MULT = 3;
const NW_WINDOW = 500;

// Цвета как у LuxAlgo: верхняя граница красная, нижняя зелёная
const NW_UP_COLOR = '#39FF14'; // нижняя граница + сигнал "buy"
const NW_DN_COLOR = '#FF1100'; // верхняя граница + сигнал "sell"
const NW_MID_COLOR = 'rgba(255,255,255,0.35)';

// ---------- Вспомогательные функции ----------

const formatPrice = (price) => {
  if (price >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
  if (price >= 1e3) return `$${(price / 1e3).toFixed(2)}k`;

  const decimals = DECIMALS_BY_PRICE.find(([min]) => price >= min)?.[1] ?? 8;
  const text = `$${price.toFixed(decimals)}`;

  return text.length > 12 ? `$${price.toExponential(3)}` : text;
};

// Объём: 1234567 → "1.23M"
const formatVolume = (v) => {
  if (v == null) return '';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
};

const pad2 = (n) => String(n).padStart(2, '0');

const isGreen = (candle) => candle.close >= candle.open;

// Достаёт объём свечи как число. Биржи отдают поле по-разному (volume / vol / v),
// иногда строкой — приводим к числу. Нет объёма → null.
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
// Props:
//   data        — массив свечей (от старых к новым)
//   width/height — размеры графика в пикселях
//   limit       — сколько свечей показывать (хранится в родителе)
//   setLimit    — функция для изменения limit
//   nwDefault   — (необязательно) включить индикатор сразу, по умолчанию false
//   nwBandwidth — (необязательно) h, по умолчанию 8
//   nwMult      — (необязательно) множитель ширины канала, по умолчанию 3
const CandlestickChart = ({
  data,
  width,
  height,
  limit,
  setLimit,
  nwDefault = false,
  nwBandwidth = NW_BANDWIDTH,
  nwMult = NW_MULT,
}) => {
  const [rawOffset, setRawOffset] = useState(0);
  // Включён ли индикатор Nadaraya-Watson
  const [showNW, setShowNW] = useState(nwDefault);
  // Включён ли горизонтальный профиль объёма справа
  const [showVP, setShowVP] = useState(SHOW_VOLUME_PROFILE);

  const startOffset = useRef(0);
  const pinchRef = useRef();
  const panRef = useRef();
  const dispatch = useDispatch();

  // Расчёт индикатора. Пересчитывается только когда пришли новые данные
  // или поменялись параметры/включение — при прокрутке и зуме НЕ считается.
  // Хук стоит ДО раннего return, чтобы порядок хуков не менялся.
  const nw = useMemo(
    () =>
      showNW && data && data.length > 1
        ? computeNW(data, nwBandwidth, nwMult, NW_WINDOW)
        : null,
    [showNW, data, nwBandwidth, nwMult],
  );

  if (!data || data.length === 0) return null;

  // ===== 1. Какие свечи показываем =====
  const currentLimit = Math.max(1, Math.min(limit, data.length));

  const maxOffset = data.length - currentLimit;
  const offset = Math.min(rawOffset, maxOffset);

  const start = Math.floor(data.length - currentLimit - offset);
  const displayData = data.slice(start, start + currentLimit + 2);

  // ===== 2. Диапазон цен (ось Y) =====
  let minPrice = Math.min(...displayData.map((c) => c.low));
  let maxPrice = Math.max(...displayData.map((c) => c.high));

  // Как в TradingView: если индикатор на графике цены, шкала подстраивается и под него.
  if (nw) {
    for (let k = 0; k < displayData.length; k++) {
      const idx = start + k - nw.first;
      if (idx < 0 || idx >= nw.mid.length) continue;
      if (nw.lower[idx] < minPrice) minPrice = nw.lower[idx];
      if (nw.upper[idx] > maxPrice) maxPrice = nw.upper[idx];
    }
  }
  const priceRange = maxPrice - minPrice || 1;

  // ===== 2.1 Максимальный объём среди видимых свечей =====
  // Столбики масштабируются относительно него: самый большой объём = вся высота панели.
  let maxVolume = 0;
  for (let k = 0; k < displayData.length; k++) {
    const v = getVolume(displayData[k]);
    if (v != null && v > maxVolume) maxVolume = v;
  }
  const hasVolume = maxVolume > 0;

  // ===== 3. Размеры и масштабирование =====
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const axisY = height - MARGIN.bottom;

  // Делим рабочую область на две панели: сверху цена, снизу объёмы.
  // Нет объёмов → ценовая панель занимает всё место, как раньше.
  const volGap = hasVolume ? VOLUME_GAP : 0;
  const volHeight = hasVolume ? innerHeight * VOLUME_SHARE : 0;
  const priceHeight = innerHeight - volHeight - volGap;
  const priceBottom = MARGIN.top + priceHeight; // нижняя граница ценовой панели

  // Горизонтальный профиль объёма рисуется у правого края ПОД всем остальным:
  // свечи, индикатор и линии лежат поверх него и ширину графика он не меняет.
  const hasProfile = showVP && hasVolume;
  const profileMaxWidth = hasProfile ? innerWidth * VP_WIDTH_SHARE : 0;

  const candleStep = innerWidth / currentLimit;
  const candleWidth = Math.max(2, candleStep * 0.6);

  const xScale = (index) => MARGIN.left + index * candleStep;

  // Цена → Y внутри ЦЕНОВОЙ панели (а не всей высоты графика)
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

  // ===== 3.1 Линии индикатора (только видимая часть) =====
  // Собираем SVG-path вида "M x y L x y L x y ...".
  // Если у свечи нет значения индикатора (она раньше окна расчёта) — рвём линию.
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

  // Стрелки-сигналы, которые попали в видимое окно
  const nwSignals = nw
    ? nw.signals
        .filter((s) => s.index >= start && s.index < start + displayData.length)
        .map((s) => {
          const candle = data[s.index];
          const x = xScale(s.index - start);
          if (s.type === 'sell') {
            // Треугольник остриём вниз над свечой
            const y = yScale(candle.high) - 3;
            return {
              key: s.index,
              color: NW_DN_COLOR,
              points: `${x},${y} ${x - 3.5},${y - 6} ${x + 3.5},${y - 6}`,
            };
          }
          // Треугольник остриём вверх под свечой
          const y = yScale(candle.low) + 3;
          return {
            key: s.index,
            color: NW_UP_COLOR,
            points: `${x},${y} ${x - 3.5},${y + 6} ${x + 3.5},${y + 6}`,
          };
        })
    : [];

  // ===== 4. Подписи осей =====
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
    const price = minPrice + (priceRange * i) / 5;
    return { text: formatPrice(price), y: yScale(price) };
  });

  const xAxisLabels = buildXLabels(data, start, currentLimit, candleStep);

  // ===== 5. Плашка с ценой последней свечи =====
  const lastCandle = displayData[displayData.length - 1];
  const lastColor = isGreen(lastCandle) ? GREEN : RED;

  // Линия и плашка последней цены остаются внутри ценовой панели
  const lastPriceY = Math.max(
    MARGIN.top,
    Math.min(priceBottom, yScale(lastCandle.close)),
  );

  const tag = { x: 2, width: MARGIN.left + 4, height: 12 };
  tag.y = lastPriceY - tag.height / 2;

  // ===== 6. Подгонка под ширину экрана =====
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

  // Переключатель индикатора (лёгкая вибрация, чтобы было понятно, что нажалось)
  const toggleNW = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowNW((v) => !v);
  };

  // Переключатель бокового профиля объёма
  const toggleVP = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowVP((v) => !v);
  };

  // const hint =
  //   currentLimit < data.length
  //     ? `${currentLimit} of ${data.length} candles • Pinch to zoom • Double tap to reset`
  //     : 'Pinch to zoom • Double tap to reset';

  // ===== 8. Отрисовка =====
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.chartContainerStyle}>
        {/* <View style={styles.limitContainer}>
          <Text style={styles.limitHint}>{hint}</Text>
        </View> */}

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
                  {yAxisLabels.map((label, i) => (
                    <Text
                      key={i}
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
                      </Defs>

                      {/* Горизонтальная сетка */}
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

                      {/* Тонкий разделитель между ценой и объёмами */}
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

                      {/* Горизонтальный профиль объёма у правого края.
                          Рисуется ДО свечей и индикатора, поэтому они лежат поверх него.
                          Полоска уровня: зелёная часть (растущие свечи) у самого края,
                          левее красная (падающие). */}
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

                      <G clipPath='url(#plotClip)'>
                        {/* Объёмы — самый нижний слой, под индикатором и свечами */}
                        {hasVolume && (
                          <G opacity={VOLUME_OPACITY}>
                            {displayData.map((candle, index) => {
                              const v = getVolume(candle);
                              if (v == null || v <= 0) return null;

                              // Высота столбика пропорциональна объёму (минимум 1px)
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

                        {/* Индикатор рисуем ПОД свечами, чтобы не перекрывать их */}
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
                              // пунктир линия
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

                        {/* Свечи */}
                        {displayData.map((candle, index) => {
                          const x = xScale(index);
                          const color = isGreen(candle) ? GREEN : RED;

                          const bodyTop = yScale(Math.max(candle.open, candle.close));
                          const bodyBottom = yScale(Math.min(candle.open, candle.close));

                          return (
                            <G key={start + index}>
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

                        {/* Стрелки-сигналы индикатора — поверх свечей */}
                        {nwSignals.map((s) => (
                          <Polygon key={`nw-${s.key}`} points={s.points} fill={s.color} />
                        ))}

                        {/* Засечки и подписи времени */}
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

                      {/* Максимальный объём в окне — подпись в левом верхнем углу панели объёмов */}
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

                      {/* Плашка с ценой слева */}
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

            {/* Маленькая незаметная кнопка включения индикатора.
                Лежит поверх графика в правом верхнем углу, не часть жестовых обработчиков.
                Выключено — почти прозрачная, включено — подсвечена цветом индикатора.
                hitSlop расширяет зону нажатия, хотя сама кнопка крошечная. */}
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

            {/* Такая же кнопка под NW: включает/выключает боковой профиль объёма (VP) */}
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
          </View>
        </TapGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

export default CandlestickChart;
