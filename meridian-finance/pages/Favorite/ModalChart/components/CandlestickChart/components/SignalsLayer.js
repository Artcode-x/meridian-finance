// SignalsLayer.js
// -----------------------------------------------------------------------------
// Слой сигналов всех индикаторов:
//
//   nwSignals    — треугольники ▼ (sell) / ▲ (buy) у границ NW-канала
//   maSignals    — треугольники buy/sell; pending → пустой контур
//   proSignals   — круги с «B» / «S» (крупные, с ореолом opacity 0.2)
//   alphaSignals — плашки «BUY P» / «SELL R» с треугольным «хвостом»;
//                  pending → тёмный фон с цветной обводкой
//
// Каждый сигнал — плоский объект с готовыми SVG-координатами и цветом
// (см. build*Visuals). Здесь только рендер, никакой логики.
//
// Вход: nwSignals, maSignals, proSignals, alphaSignals.

import React from 'react';
import { Polygon, G, Circle, Text as SvgText, Rect } from 'react-native-svg';
import {
  PRO_COLOR_BUY,
  PRO_COLOR_SELL,
  ALPHA_COLOR_BUY,
  ALPHA_COLOR_SELL,
  ALPHA_PILL_W,
  ALPHA_PILL_H,
} from '../constants/chartTheme';

export const SignalsLayer = ({ nwSignals, maSignals, proSignals, alphaSignals }) => {
  return (
    <>
      {/* NW */}
      {nwSignals.map((s) => (
        <Polygon key={s.key} points={s.points} fill={s.color} />
      ))}

      {/* MA */}
      {maSignals.map((s) => (
        <Polygon
          key={s.key}
          points={s.points}
          fill={s.pending ? 'none' : s.color}
          stroke={s.color}
          strokeWidth={s.pending ? 1.2 : 0}
        />
      ))}

      {/* PRO */}
      {proSignals.map((s) => (
        <G key={s.key}>
          <Circle
            cx={s.x}
            cy={s.y}
            r={10}
            fill={s.isBuy ? PRO_COLOR_BUY : PRO_COLOR_SELL}
            opacity={0.2}
          />
          <Circle
            cx={s.x}
            cy={s.y}
            r={6}
            fill={s.isBuy ? PRO_COLOR_BUY : PRO_COLOR_SELL}
          />
          <SvgText
            x={s.x}
            y={s.y + 3}
            fill='#fff'
            fontSize='8'
            fontWeight='bold'
            textAnchor='middle'
          >
            {s.isBuy ? 'B' : 'S'}
          </SvgText>
        </G>
      ))}

      {/* ALPHA */}
      {alphaSignals.map((s) => {
        const color = s.isBuy ? ALPHA_COLOR_BUY : ALPHA_COLOR_SELL;
        return (
          <G key={s.key}>
            <Polygon points={s.points} fill={color} />
            <Rect
              x={s.x - ALPHA_PILL_W / 2}
              y={s.pillY}
              width={ALPHA_PILL_W}
              height={ALPHA_PILL_H}
              rx={3}
              ry={3}
              fill={s.pending ? 'rgba(0,0,0,0.6)' : color}
              stroke={color}
              strokeWidth={s.pending ? 1 : 0}
            />
            <SvgText
              x={s.x}
              y={s.pillY + ALPHA_PILL_H - 3.5}
              fill='#fff'
              fontSize='7.5'
              fontWeight='bold'
              textAnchor='middle'
            >
              {s.label}
            </SvgText>
          </G>
        );
      })}
    </>
  );
};
