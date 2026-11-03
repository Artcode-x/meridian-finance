// CandlestickChart.js
// -----------------------------------------------------------------------------
// Точка входа графика. Оркестратор — сам почти ничего не считает и не рисует:
//
//   1. useState × 5           — видимость NW/VP/MA/PRO/ALPHA
//   2. useChartWindow         — текущее окно (offset/start/displayData)
//   3. useChartIndicators     — nw/ma/pro/alpha (мемоизированы)
//   4. useChartScales         — min/max цена, xScale/yScale, объёмы, профиль
//   5. useChartGestures       — pinch/pan/doubleTap
//   6. build*Visuals          — готовые SVG-данные для каждого индикатора
//   7. buildXLabels           — подписи оси X
//   8. последняя цена         — цвет/координата/плашка
//
//   9. JSX                    — GestureHandlerRootView → Tap → View → Pinch →
//                               Pan → View → YAxisLabels + ChartSvg +
//                               IndicatorToggleButtons
//
// Было ~1500 строк, стало ~170. Вся тяжёлая логика — в hooks/ и chartRenderers/,
// вся геометрия — в utils/geometry.js, все цвета/числа — в constants/chartTheme.js,
// каждый визуальный слой — в components/*.js.
//
// Вход (props): data, width, height, limit, setLimit,
//               nwDefault, nwBandwidth, nwMult,
//               maDefault, maMode, proDefault, alphaDefault.

import React, { useState } from 'react';
import { Dimensions, View } from 'react-native';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import { RFValue } from 'react-native-responsive-fontsize';
import { styles } from './CandlestickChart.styles';

import {
  GREEN,
  RED,
  MARGIN,
  NW_BANDWIDTH,
  NW_MULT,
  MA_MODE,
  SHOW_VOLUME_PROFILE,
} from './constants/chartTheme';

import { useChartWindow } from './hooks/useChartWindow';
import { useChartIndicators } from './hooks/useChartIndicators';
import { useChartScales } from './hooks/useChartScales';
import { useChartGestures } from './hooks/useChartGestures';

import { buildXLabels } from './utils/geometry';
import { formatPrice } from './utils/formatters';
import { isGreen } from './utils/candleUtils';

import { buildNwVisuals } from './chartRenderers/buildNwVisuals';
import { buildMaVisuals } from './chartRenderers/buildMaVisuals';
import { buildProVisuals } from './chartRenderers/buildProVisuals';
import { buildAlphaVisuals } from './chartRenderers/buildAlphaVisuals';

import { YAxisLabels } from './components/YAxisLabels';
import { ChartSvg } from './components/ChartSvg';
import { IndicatorToggleButtons } from './components/IndicatorToggleButtons';

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
  alphaDefault = false,
}) => {
  // ---------- Состояние видимости индикаторов ----------
  const [showNW, setShowNW] = useState(nwDefault);
  const [showVP, setShowVP] = useState(SHOW_VOLUME_PROFILE);
  const [showMA, setShowMA] = useState(maDefault);
  const [showPRO, setShowPRO] = useState(proDefault);
  const [showALPHA, setShowALPHA] = useState(alphaDefault);

  // ---------- Окно данных ----------
  const { currentLimit, maxOffset, offset, start, displayData, setRawOffset } =
    useChartWindow(data, limit);

  // ---------- Индикаторы ----------
  const { nw, ma, pro, alpha } = useChartIndicators({
    data,
    showNW,
    showMA,
    showPRO,
    showALPHA,
    nwBandwidth,
    nwMult,
    maMode,
  });

  // ---------- Масштабы ----------
  const scales = useChartScales({
    data,
    displayData,
    start,
    currentLimit,
    nw,
    ma,
    pro,
    alpha,
    showVP,
    width,
    height,
    maMode,
  });

  // ---------- Жесты ----------
  const { pinchRef, panRef, onPinchEnd, onPanStateChange, onPan, onDoubleTap } =
    useChartGestures({
      data,
      currentLimit,
      setLimit,
      offset,
      maxOffset,
      setRawOffset,
      candleStep: scales?.candleStep ?? 1,
    });

  // Если данных нет — ничего не рендерим
  if (!data || data.length === 0 || !scales) return null;

  const {
    minPrice,
    priceRange,
    maxVolume,
    hasVolume,
    innerWidth,
    axisY,
    volGap,
    volHeight,
    priceHeight,
    priceBottom,
    hasProfile,
    candleStep,
    candleWidth,
    xScale,
    yScale,
    horizontalBars,
    drawMALines,
    drawBB,
  } = scales;

  // ---------- Визуализации индикаторов ----------
  const nwVisuals = buildNwVisuals({
    nw,
    data,
    start,
    displayData,
    xScale,
    yScale,
  });

  const maVisuals = buildMaVisuals({
    ma,
    data,
    start,
    displayData,
    xScale,
    yScale,
    candleStep,
    showNW,
    showMA,
    showPRO,
    priceBottom,
    drawMALines,
    drawBB,
  });

  const proVisuals = buildProVisuals({
    pro,
    data,
    start,
    displayData,
    xScale,
    yScale,
    showNW,
  });

  const alphaVisuals = buildAlphaVisuals({
    alpha,
    data,
    start,
    displayData,
    xScale,
    yScale,
    priceBottom,
    showNW,
    showMA,
    showPRO,
  });

  // ---------- Подписи осей ----------
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
    const price = minPrice + (priceRange * i) / 5;
    return { text: formatPrice(price), y: yScale(price) };
  });

  const xAxisLabels = buildXLabels(data, start, currentLimit, candleStep);

  // ---------- Плашка последней цены ----------
  const lastCandle = displayData[displayData.length - 1];
  const lastColor = isGreen(lastCandle) ? GREEN : RED;
  const lastPriceY = Math.max(
    MARGIN.top,
    Math.min(priceBottom, yScale(lastCandle.close)),
  );
  const priceTag = {
    x: 2,
    width: MARGIN.left + 4,
    height: 12,
    y: lastPriceY - 6,
  };

  // ---------- Экраны ----------
  const screenWidth = Dimensions.get('window').width;
  const yAxisLeftOffset = screenWidth > 600 ? 4 : 9;
  const axisLeftLine = screenWidth > 400 && screenWidth < 600 ? 3 : 0;

  // ---------- JSX ----------
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
                  <YAxisLabels labels={yAxisLabels} left={yAxisLeftOffset} />

                  <View style={{ paddingLeft: axisLeftLine }}>
                    <ChartSvg
                      width={width}
                      height={height}
                      innerWidth={innerWidth}
                      priceHeight={priceHeight}
                      xScale={xScale}
                      yScale={yScale}
                      candleWidth={candleWidth}
                      axisY={axisY}
                      displayData={displayData}
                      start={start}
                      data={data}
                      // линии
                      nwPaths={nwVisuals.paths}
                      maPaths={maVisuals.paths}
                      proPaths={proVisuals.paths}
                      alphaPaths={alphaVisuals.paths}
                      // сигналы
                      nwSignals={nwVisuals.signals}
                      maSignals={maVisuals.signals}
                      proSignals={proVisuals.signals}
                      alphaSignals={alphaVisuals.signals}
                      // заливки
                      maFillProfit={maVisuals.fillProfit}
                      maFillLoss={maVisuals.fillLoss}
                      alphaBoxes={alphaVisuals.boxes}
                      // открытые уровни
                      proOpenLevels={proVisuals.openLevels}
                      alphaOpenLevels={alphaVisuals.openLevels}
                      // объёмы
                      maxVolume={maxVolume}
                      volHeight={volHeight}
                      volGap={volGap}
                      hasVolume={hasVolume}
                      hasProfile={hasProfile}
                      horizontalBars={horizontalBars}
                      // оси
                      yAxisLabels={yAxisLabels}
                      xAxisLabels={xAxisLabels}
                      // статистика
                      maStatsText={maVisuals.statsText}
                      alphaStatsText={alphaVisuals.statsText}
                      // последняя цена
                      lastCandle={lastCandle}
                      lastColor={lastColor}
                      lastPriceY={lastPriceY}
                      priceTag={priceTag}
                      lastPriceText={formatPrice(lastCandle.close)}
                    />
                  </View>
                </View>
              </PanGestureHandler>
            </PinchGestureHandler>

            <IndicatorToggleButtons
              showNW={showNW}
              showVP={showVP}
              showMA={showMA}
              showPRO={showPRO}
              showALPHA={showALPHA}
              onToggleNW={() => setShowNW((v) => !v)}
              onToggleVP={() => setShowVP((v) => !v)}
              onToggleMA={() => setShowMA((v) => !v)}
              onTogglePRO={() => setShowPRO((v) => !v)}
              onToggleALPHA={() => setShowALPHA((v) => !v)}
            />
          </View>
        </TapGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

export default CandlestickChart;
