// VolumeBarsLayer.js
// -----------------------------------------------------------------------------
// Вертикальные бары объёмов ПОД ценовой панелью (классическая «гистограмма»).
// Высота бара = (volume / maxVolume) * volHeight, цвет = цвет свечи.
//
// Вход: displayData, start (для key), axisY (низ баров),
//       maxVolume, volHeight, candleWidth, xScale.
// Выход: null, если maxVolume = 0 (нет данных об объёме).

import React from 'react';
import { Rect, G } from 'react-native-svg';
import { GREEN, RED, VOLUME_OPACITY } from '../constants/chartTheme';
import { getVolume } from '../utils/candleUtils';

export const VolumeBarsLayer = ({
  displayData,
  start,
  axisY,
  maxVolume,
  volHeight,
  candleWidth,
  xScale,
}) => {
  if (!maxVolume) return null;
  return (
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
            fill={candle.close >= candle.open ? GREEN : RED}
          />
        );
      })}
    </G>
  );
};
