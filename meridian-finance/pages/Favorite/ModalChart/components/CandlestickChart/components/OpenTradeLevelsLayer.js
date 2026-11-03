// OpenTradeLevelsLayer.js
// -----------------------------------------------------------------------------
// Горизонтальные уровни ОТКРЫТОЙ сделки (если она есть):
//
//   proLevels   — PRO-сделка. Подписи слева (x = MARGIN.left + 62):
//                 STOP (красная), TAKE (зелёная), ENTRY (белая с подложкой)
//
//   alphaLevels — ALPHA-сделка. Подписи справа (x = width - MARGIN.right - 2):
//                 SL/BE (красная), TP (зелёная), LONG/SHORT (жёлтая, с setup)
//
// PRO и ALPHA разведены по разным сторонам специально — если обе сделки
// открыты одновременно, подписи не накладываются.
//
// Вход: proLevels, alphaLevels (объекты из buildProVisuals/buildAlphaVisuals),
//       width — для правой привязки подписей ALPHA.

import React from 'react';
import { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { GREEN, RED, MARGIN, ALPHA_COLOR_MAIN } from '../constants/chartTheme';
import { formatPrice } from '../utils/formatters';

export const OpenTradeLevelsLayer = ({ proLevels, alphaLevels, width }) => {
  return (
    <>
      {proLevels && (
        <G key='pro-levels'>
          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={proLevels.yStop}
            y2={proLevels.yStop}
            stroke={RED}
            strokeWidth='1'
            strokeDasharray='2,2'
          />
          <SvgText
            x={MARGIN.left + 62}
            y={proLevels.yStop - 4}
            fill={RED}
            fontSize='8'
            textAnchor='end'
          >
            {`STOP: ${formatPrice(proLevels.stop)}`}
          </SvgText>

          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={proLevels.yTarget}
            y2={proLevels.yTarget}
            stroke={GREEN}
            strokeWidth='1'
            strokeDasharray='2,2'
          />
          <SvgText
            x={MARGIN.left + 62}
            y={proLevels.yTarget - 4}
            fill={GREEN}
            fontSize='8'
            textAnchor='end'
          >
            {` TAKE: ${formatPrice(proLevels.target)}`}
          </SvgText>

          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={proLevels.yEntry}
            y2={proLevels.yEntry}
            stroke='rgba(255,255,255,0.5)'
            strokeWidth='1'
          />
          <Rect
            x={MARGIN.left}
            y={proLevels.yEntry - 14}
            width={70}
            height={12}
            fill='rgba(0,0,0,0.6)'
            rx={2}
            ry={2}
          />
          <SvgText
            x={MARGIN.left + 4}
            y={proLevels.yEntry - 6}
            fill='rgba(255,255,255,0.85)'
            fontSize='8'
            textAnchor='start'
            fontWeight='bold'
          >
            {`ENTRY: ${formatPrice(proLevels.entry)}`}
          </SvgText>
        </G>
      )}

      {alphaLevels && (
        <G key='alpha-levels'>
          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={alphaLevels.yStop}
            y2={alphaLevels.yStop}
            stroke={RED}
            strokeWidth='1'
            strokeDasharray='4,2'
          />
          <SvgText
            x={width - MARGIN.right - 2}
            y={alphaLevels.yStop - 3}
            fill={RED}
            fontSize='8'
            textAnchor='end'
          >
            {`${alphaLevels.be ? 'BE' : 'SL'} ${formatPrice(alphaLevels.stop)}`}
          </SvgText>

          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={alphaLevels.yTarget}
            y2={alphaLevels.yTarget}
            stroke={GREEN}
            strokeWidth='1'
            strokeDasharray='4,2'
          />
          <SvgText
            x={width - MARGIN.right - 2}
            y={alphaLevels.yTarget - 3}
            fill={GREEN}
            fontSize='8'
            textAnchor='end'
          >
            {`TP ${formatPrice(alphaLevels.target)}`}
          </SvgText>

          <Line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={alphaLevels.yEntry}
            y2={alphaLevels.yEntry}
            stroke={ALPHA_COLOR_MAIN}
            strokeWidth='1'
            opacity={0.7}
          />
          <SvgText
            x={width - MARGIN.right - 2}
            y={alphaLevels.yEntry - 3}
            fill={ALPHA_COLOR_MAIN}
            fontSize='8'
            fontWeight='bold'
            textAnchor='end'
          >
            {`${
              alphaLevels.side === 'buy' ? 'LONG' : 'SHORT'
            } ${formatPrice(alphaLevels.entry)} · ${alphaLevels.setup}`}
          </SvgText>
        </G>
      )}
    </>
  );
};
