// PriceTag.js
// -----------------------------------------------------------------------------
// Плашка последней цены в левом верхнем углу (как в TradingView «last price tag»):
// скруглённый прямоугольник цвета последней свечи (opacity 0.5) + текст цены.
//
// Вход: tag = { x, y, width, height } (координаты рассчитаны в CandlestickChart),
//       color — GREEN или RED,
//       priceText — уже отформатированная строка (formatPrice(lastCandle.close)).

import React from 'react';
import { Rect, Text as SvgText } from 'react-native-svg';
import { RFValue } from 'react-native-responsive-fontsize';

export const PriceTag = ({ tag, color, priceText }) => {
  return (
    <>
      <Rect
        x={tag.x}
        y={tag.y}
        width={tag.width}
        height={tag.height}
        fill={color}
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
        {priceText}
      </SvgText>
    </>
  );
};
