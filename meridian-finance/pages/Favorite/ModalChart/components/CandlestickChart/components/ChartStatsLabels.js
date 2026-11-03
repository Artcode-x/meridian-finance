// ChartStatsLabels.js
// -----------------------------------------------------------------------------
// Текстовые подписи-статистика поверх графика:
//
//   Vol X.XXK/M/B       — максимальный объём в видимом окне (левый низ панели
//                          объёмов, чуть выше оси X)
//   MA · N trades · ... — статистика бэктеста MA-стратегии (левый верх)
//   ALPHA · N trades ...— статистика бэктеста ALPHA-стратегии (под MA, если
//                          MA включена; иначе на том же месте)
//
// Вход: hasVolume, maxVolume, axisY, volHeight (для позиции Vol),
//       maStatsText, alphaStatsText (готовые строки из build*Visuals,
//       пустые строки → блок не рисуется).

import React from 'react';
import { Text as SvgText } from 'react-native-svg';
import { MARGIN, VOLUME_LABEL_COLOR, ALPHA_COLOR_MAIN } from '../constants/chartTheme';
import { formatVolume } from '../utils/formatters';

export const ChartStatsLabels = ({
  hasVolume,
  maxVolume,
  axisY,
  volHeight,
  maStatsText,
  alphaStatsText,
}) => {
  return (
    <>
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

      {maStatsText ? (
        <SvgText
          x={MARGIN.left + 4}
          y={MARGIN.top + 9}
          fill='rgba(255,255,255,0.55)'
          fontSize='8.5'
        >
          {maStatsText}
        </SvgText>
      ) : null}

      {alphaStatsText ? (
        <SvgText
          x={MARGIN.left + 4}
          y={MARGIN.top + 9 + (maStatsText ? 10 : 0)}
          fill={ALPHA_COLOR_MAIN}
          fillOpacity={0.85}
          fontSize='8.5'
        >
          {alphaStatsText}
        </SvgText>
      ) : null}
    </>
  );
};
