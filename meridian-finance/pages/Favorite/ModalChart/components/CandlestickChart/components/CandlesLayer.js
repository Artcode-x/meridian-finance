// CandlesLayer.js
// -----------------------------------------------------------------------------
// Рисует сами свечи: тень (high-low) + тело (open-close).
// Цвет берётся из isGreen(candle); тело всегда минимум 1px (Math.max),
// чтобы доджи не исчезали на мелком масштабе.
//
// Вход: displayData, start (для key), candleWidth, xScale, yScale.
// Выход: массив <G> — по одной группе (Line + Rect) на свечу.

import React from 'react';
import { Rect, Line, G } from 'react-native-svg';
import { GREEN, RED } from '../constants/chartTheme';
import { isGreen } from '../utils/candleUtils';

export const CandlesLayer = ({ displayData, start, candleWidth, xScale, yScale }) => {
  return displayData.map((candle, index) => {
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
  });
};
