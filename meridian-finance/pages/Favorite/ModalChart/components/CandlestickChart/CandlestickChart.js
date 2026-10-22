import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import { View, StyleSheet, Dimensions } from 'react-native';

import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  State,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { Text } from '../../../../../components/ui';
import { setDoubleTap } from '../../../../../store/reducersSlice';
import { colors, space } from '../../../../../theme';

const MIN_LIMIT = 10;
const MAX_LIMIT = 200;
const ZOOM_IN_THRESHOLD = 1.05;
const ZOOM_OUT_THRESHOLD = 0.95;
const DEFAULT_LIMIT = 100;

const CandlestickChart = ({
  data,
  width: chartWidth,
  height: chartHeight,
  limit,
  setLimit,
}) => {
  // const [, setZoomScale] = useState(1);
  // const [lastScale, setLastScale] = useState(1);
  // const [internalLimit, setInternalLimit] = useState(limit || data?.length || 0);

  const [offset, setOffset] = useState(0);

  const pinchRef = useRef();
  const panRef = useRef();
  const doubleTapRef = useRef();

  const dispatch = useDispatch();

  if (!data || data.length === 0) return null;

  // Функция для легкой вибрации
  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic not available:', error);
    }
  };

  const currentLimit = limit;

  const margin = { top: 15, right: 15, bottom: 28, left: 45 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const maxOffset = Math.max(0, data.length - currentLimit);

  // Синхронизация internalLimit с limit при изменении извне
  useEffect(() => {
    setOffset((prev) => Math.min(prev, maxOffset));
  }, [maxOffset]);

  // Хуки выше — ранний выход только после них
  if (!data || data.length === 0) return null;

  const { displayData, startIndex } = useMemo(() => {
    const start = Math.max(0, data.length - currentLimit - offset);
    const end = Math.min(data.length, start + currentLimit);
    return {
      displayData: data.slice(start, end),
      startIndex: start,
    };
  }, [data, currentLimit, offset]);

  const { minPrice, maxPrice } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    for (let i = 0; i < displayData.length; i++) {
      const d = displayData[i];
      if (d.low < mn) mn = d.low;
      if (d.open < mn) mn = d.open;
      if (d.close < mn) mn = d.close;
      if (d.high > mx) mx = d.high;
      if (d.open > mx) mx = d.open;
      if (d.close > mx) mx = d.close;
    }
    return { minPrice: mn, maxPrice: mx };
  }, [displayData]);

  const priceRange = maxPrice - minPrice || 1;

  const xScale = (index) =>
    margin.left + (index / Math.max(1, displayData.length - 1)) * innerWidth;

  const yScale = (price) =>
    margin.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight;

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) return;
    const scale = event.nativeEvent.scale;

    if (scale > ZOOM_IN_THRESHOLD) {
      setLimit(Math.max(MIN_LIMIT, Math.floor(currentLimit * 0.8)));
    } else if (scale < ZOOM_OUT_THRESHOLD) {
      setLimit(Math.min(MAX_LIMIT, data.length, Math.ceil(currentLimit * 1.2)));
    }
  };

  const PAN_SENSITIVITY = 15.5;

  // Функция вызывается непрерывно, пока палец движется по экрану (десятки раз в секунду). Задача — превратить движение пальца в пикселях в сдвиг окна в свечах (offset).
  const onPanGestureEvent = (event) => {
    if (displayData.length < 2) return;
    const candleWidthPx = (innerWidth / currentLimit) * PAN_SENSITIVITY;
    const shifted = Math.round(event.nativeEvent.translationX / candleWidthPx);

    if (shifted !== 0) {
      setOffset((prev) => {
        const next = prev + shifted;
        return Math.max(0, Math.min(maxOffset, next));
      });
    }
  };

  const onDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setLimit(DEFAULT_LIMIT);
      setOffset(0);
      triggerHaptic();
      dispatch(setDoubleTap());
    }
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  const getTime = (c) => {
    const t = c.time ?? c.timestamp ?? c.openTime ?? c.t;
    if (t == null) return null;
    const n = typeof t === 'number' ? t : new Date(t).getTime();
    if (isNaN(n)) return null;
    return n < 1e12 ? n * 1000 : n; // секунды -> мс
  };

  const generateXAxisLabels = () => {
    const len = displayData.length;
    if (len < 2) return [];

    const first = getTime(displayData[0]);
    const last = getTime(displayData[len - 1]);
    if (first == null || last == null) return [];

    const intraday = last - first < 24 * 3600 * 1000;
    const count = Math.min(4, len - 1);
    const labels = [];

    for (let i = 0; i <= count; i++) {
      const idx = Math.round((i * (len - 1)) / count);
      const ts = getTime(displayData[idx]);
      if (ts == null) continue;
      const d = new Date(ts);
      labels.push({
        text: intraday
          ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
          : `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`,
        x: xScale(idx),
        anchor: i === 0 ? 'start' : i === count ? 'end' : 'middle',
      });
    }
    return labels;
  };

  const xAxisLabels = generateXAxisLabels();

  const generateYAxisLabels = () => {
    const numberOfLabels = 5;
    const labels = [];

    for (let i = 0; i <= numberOfLabels; i++) {
      const price = minPrice + (priceRange * i) / numberOfLabels;
      const yPosition = yScale(price);

      let formattedPrice;
      if (price >= 1000000) {
        formattedPrice = `$${(price / 1000000).toFixed(2)}M`;
      } else if (price >= 1000) {
        formattedPrice = `$${(price / 1000).toFixed(2)}k`;
      } else if (price >= 1) {
        formattedPrice = `$${price.toFixed(2)}`;
      } else if (price >= 0.1) {
        formattedPrice = `$${price.toFixed(3)}`;
      } else if (price >= 0.01) {
        formattedPrice = `$${price.toFixed(4)}`;
      } else if (price >= 0.001) {
        formattedPrice = `$${price.toFixed(5)}`;
      } else if (price >= 0.0001) {
        formattedPrice = `$${price.toFixed(6)}`;
      } else {
        formattedPrice = `$${price.toFixed(8)}`;
      }

      if (formattedPrice.length > 12) {
        formattedPrice = `$${price.toExponential(3)}`;
      }

      labels.push({
        price: formattedPrice,
        y: yPosition,
        rawPrice: price,
      });
    }

    return labels;
  };

  const yAxisLabels = generateYAxisLabels();
  const candleWidth = Math.max(2, (innerWidth / displayData.length) * 0.6);

  const screenWidth = Dimensions.get('window').width;
  const yAxisLeftOffset = screenWidth > 600 ? 4 : 9;
  const axisLeftLine = screenWidth > 400 && screenWidth < 600 ? 3 : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.chartContainerStyle}>
        {/* <View style={styles.limitContainer}>
          <Text style={styles.limitHint}>
            {currentLimit < data.length
              ? `${currentLimit} of ${data.length} candles • Pinch to zoom • Double tap to reset`
              : `Pinch to zoom • Double tap to reset`}
          </Text>
        </View> */}

        <TapGestureHandler
          ref={doubleTapRef}
          onHandlerStateChange={onDoubleTap}
          numberOfTaps={2}
        >
          <View style={styles.chartBox}>
            <PinchGestureHandler
              ref={pinchRef}
              simultaneousHandlers={panRef}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <PanGestureHandler
                ref={panRef}
                simultaneousHandlers={pinchRef}
                onGestureEvent={onPanGestureEvent}
                minPointers={1}
                maxPointers={1}
              >
                <View style={{ width: chartWidth, height: chartHeight }}>
                  {/* Метки оси Y */}
                  {yAxisLabels.map((label, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.yAxisLabel,
                        {
                          position: 'absolute',
                          top: label.y - 8,
                          left: yAxisLeftOffset,
                          zIndex: 1,
                          backgroundColor: 'transparent',
                          fontSize: RFValue(7),
                          //
                          color: 'rgba(255,255,255,0.6)',
                        },
                      ]}
                    >
                      {label.price}
                    </Text>
                  ))}

                  {/* SVG график */}
                  <View style={{ paddingLeft: axisLeftLine }}>
                    <Svg width={chartWidth} height={chartHeight}>
                      {/* Горизонтальные линии сетки */}
                      {yAxisLabels.map((label, index) => (
                        <Line
                          key={`grid-${index}`}
                          x1={margin.left}
                          y1={label.y}
                          x2={chartWidth - margin.right}
                          y2={label.y}
                          stroke='rgba(255,255,255,0.15)'
                          strokeWidth='0.5'
                          strokeDasharray='2,2'
                        />
                      ))}

                      {/* Ось X */}
                      <Line
                        x1={margin.left}
                        y1={chartHeight - margin.bottom}
                        x2={chartWidth - margin.right}
                        y2={chartHeight - margin.bottom}
                        stroke='rgba(255,255,255,0.4)'
                        strokeWidth='1'
                      />

                      {/* Ось Y */}
                      <Line
                        x1={margin.left}
                        y1={margin.top}
                        x2={margin.left}
                        y2={chartHeight - margin.bottom}
                        stroke='rgba(255,255,255,0.4)'
                        strokeWidth='1'
                      />

                      {/* Свечи */}
                      {displayData.map((candle, index) => {
                        const x = xScale(index) - candleWidth / 2;
                        const openY = yScale(candle.open);
                        const closeY = yScale(candle.close);
                        const highY = yScale(candle.high);
                        const lowY = yScale(candle.low);

                        const isBullish = candle.close >= candle.open;
                        const color = isBullish ? '#4CAF50' : '#F44336';
                        const candleTopY = isBullish ? closeY : openY;
                        const candleBottomY = isBullish ? openY : closeY;
                        const candleHeight = Math.max(
                          1,
                          Math.abs(candleBottomY - candleTopY),
                        );

                        return (
                          <G key={`${startIndex}-${index}`}>
                            <Line
                              x1={x + candleWidth / 2}
                              y1={highY}
                              x2={x + candleWidth / 2}
                              y2={lowY}
                              stroke={color}
                              strokeWidth='0.8'
                            />
                            <Rect
                              x={x}
                              y={candleTopY}
                              width={candleWidth}
                              height={candleHeight}
                              fill={color}
                              stroke={color}
                              strokeWidth='0.5'
                            />
                          </G>
                        );
                      })}
                      {/* Засечки и подписи оси X */}
                      {xAxisLabels.map((label, index) => (
                        <G key={`xl-${index}`}>
                          <Line
                            x1={label.x}
                            y1={chartHeight - margin.bottom + 3} // сдвиг начала засечки
                            x2={label.x}
                            y2={chartHeight - margin.bottom + 4}
                            stroke='rgba(255,255,255,0.4)'
                            strokeWidth='1'
                          />
                          <SvgText
                            x={label.x}
                            y={chartHeight - margin.bottom + 16}
                            fill='rgba(255,255,255,0.6)'
                            // fill='#FFFFFF'
                            fontSize='9'
                            textAnchor={label.anchor}
                          >
                            {label.text}
                          </SvgText>
                        </G>
                      ))}
                    </Svg>
                  </View>
                </View>
              </PanGestureHandler>
            </PinchGestureHandler>
          </View>
        </TapGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  hint: { alignSelf: 'flex-end', paddingHorizontal: space[3], marginBottom: space[1] },
});

export default CandlestickChart;
