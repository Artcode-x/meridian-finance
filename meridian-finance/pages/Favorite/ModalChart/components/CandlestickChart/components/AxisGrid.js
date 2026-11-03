// AxisGrid.js
// -----------------------------------------------------------------------------
// Сетка графика + оси X/Y + разделитель между ценовой панелью и панелью объёмов.
//
//   - горизонтальные пунктирные линии сетки по yAxisLabels
//   - сплошная линия оси X (axisY)
//   - сплошная линия оси Y (MARGIN.left)
//   - если hasVolume: тонкий разделитель priceBottom + volGap/2
//
// Вход: yAxisLabels, width, height, axisY, hasVolume, priceBottom, volGap.

import React from 'react';
import { Line } from 'react-native-svg';
import { MARGIN, AXIS_COLOR } from '../constants/chartTheme';

export const AxisGrid = ({
  yAxisLabels,
  width,
  height,
  axisY,
  hasVolume,
  priceBottom,
  volGap,
}) => {
  return (
    <>
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

      <Line
        x1={MARGIN.left}
        x2={width - MARGIN.right}
        y1={axisY}
        y2={axisY}
        stroke={AXIS_COLOR}
        strokeWidth='1'
      />
      <Line
        x1={MARGIN.left}
        x2={MARGIN.left}
        y1={MARGIN.top}
        y2={axisY}
        stroke={AXIS_COLOR}
        strokeWidth='1'
      />

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
    </>
  );
};
