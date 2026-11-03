// YAxisLabels.js
// -----------------------------------------------------------------------------
// Подписи оси Y. Рисуются НЕ в SVG, а как обычные RN <Text> поверх Svg —
// так шрифт чётче и не «плывёт» при масштабировании, и можно использовать
// RFValue (адаптивный размер) без хаков.
//
// Вход: labels = [{ text, y }, ...], left — горизонтальный отступ
//       (зависит от ширины экрана — см. yAxisLeftOffset в CandlestickChart).
// Выход: массив <Text> с абсолютным позиционированием (top = label.y - 8).

import React from 'react';
import { Text } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { styles } from '../CandlestickChart.styles';

export const YAxisLabels = ({ labels, left }) => {
  return labels.map((label, i) => (
    <Text
      key={`y-${i}`}
      style={[
        styles.yAxisLabel,
        {
          position: 'absolute',
          top: label.y - 8,
          left,
          zIndex: 1,
          backgroundColor: 'transparent',
          fontSize: RFValue(7),
        },
      ]}
    >
      {label.text}
    </Text>
  ));
};
