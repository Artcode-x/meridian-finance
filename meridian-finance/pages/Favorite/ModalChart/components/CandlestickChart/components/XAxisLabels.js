// XAxisLabels.js
// -----------------------------------------------------------------------------
// Подписи оси X (время/дата) + маленькие засечки.
//
// Вход: labels = [{ text, x, anchor }] — рассчитываются в buildXLabels
//       (utils/geometry.js); anchor = 'start' | 'middle' | 'end' для первой/
//       промежуточных/последней подписи, чтобы крайние не вылезали за край.
//       axisY — Y-координата линии оси X (засечки рисуются ниже неё).
//
// Выход: массив <G> — по одной группе (Line + SvgText) на подпись.

import React from 'react';
import { G, Line, Text as SvgText } from 'react-native-svg';
import { AXIS_COLOR } from '../constants/chartTheme';

export const XAxisLabels = ({ labels, axisY }) => {
  return labels.map((label, i) => (
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
  ));
};
