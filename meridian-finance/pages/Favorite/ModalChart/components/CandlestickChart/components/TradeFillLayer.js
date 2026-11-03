// TradeFillLayer.js
// -----------------------------------------------------------------------------
// Полупрозрачные «заливки» под свечами — визуализация результатов сделок:
//
//   maFill      — { fillProfit, fillLoss } — зоны прибыли/убытка MA-сделок
//                 (строятся в buildMaVisuals, clipPath = priceClip)
//   alphaBoxes  — прямоугольники ALPHA-сделок: зелёный entry→TP, красный
//                 entry→SL, каждый с ALPHA_BOX_OPACITY
//
// Всё под priceClip, чтобы не залезать на ось X / панель объёмов.
//
// Вход: maFill, alphaBoxes.

import React from 'react';
import { Path, G, Rect } from 'react-native-svg';
import { GREEN, RED, MA_FILL_OPACITY, ALPHA_BOX_OPACITY } from '../constants/chartTheme';

export const TradeFillLayer = ({ maFill, alphaBoxes }) => {
  return (
    <>
      {maFill && (
        <G clipPath='url(#priceClip)' opacity={MA_FILL_OPACITY}>
          <Path d={maFill.fillProfit} fill={GREEN} />
          <Path d={maFill.fillLoss} fill={RED} />
        </G>
      )}

      {alphaBoxes?.length > 0 && (
        <G clipPath='url(#priceClip)'>
          {alphaBoxes.map((b) => (
            <G key={b.key}>
              <Rect
                x={b.x}
                y={b.tpY}
                width={b.w}
                height={b.tpH}
                fill={GREEN}
                opacity={ALPHA_BOX_OPACITY}
              />
              <Rect
                x={b.x}
                y={b.slY}
                width={b.w}
                height={b.slH}
                fill={RED}
                opacity={ALPHA_BOX_OPACITY}
              />
            </G>
          ))}
        </G>
      )}
    </>
  );
};
