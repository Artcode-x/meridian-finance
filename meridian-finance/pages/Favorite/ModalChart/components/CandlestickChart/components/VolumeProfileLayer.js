// VolumeProfileLayer.js
// -----------------------------------------------------------------------------
// Горизонтальный профиль объёма справа (как в TradingView "VPVR"):
// для каждого ценового уровня — две полоски: зелёная (up-volume) и красная
// (down-volume), выровненные по правому краю и нарисованные с низкой opacity,
// чтобы не мешать свечам.
//
// Вход: bars — результат profileBars() (см. useChartScales → horizontalBars),
//       width — нужна для привязки к правому краю (width - VP_RIGHT_OFFSET).
//
// Если bars пустой — компонент возвращает null (не рисует G-обёртку).

import React from 'react';
import { Rect, G } from 'react-native-svg';
import { GREEN, RED, VP_OPACITY, VP_RIGHT_OFFSET } from '../constants/chartTheme';

export const VolumeProfileLayer = ({ bars, width }) => {
  if (!bars?.length) return null;
  return (
    <G opacity={VP_OPACITY}>
      {bars.map((bar) => (
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
  );
};
