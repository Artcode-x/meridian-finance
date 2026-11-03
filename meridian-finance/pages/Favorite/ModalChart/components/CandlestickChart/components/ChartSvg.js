// ChartSvg.js
// -----------------------------------------------------------------------------
// Корневой <Svg> графика. Собирает все слои в правильном z-order:
//
//   1. <Defs><ClipPath>           — plotClip (всё) и priceClip (только цена)
//   2. AxisGrid                   — сетка + оси X/Y + разделитель объёмов
//   3. VolumeProfileLayer         — горизонтальный профиль объёма (если вкл.)
//   4. TradeFillLayer             — заливки MA-сделок и боксы ALPHA (под свечами)
//   5. <G clipPath=plotClip>
//        VolumeBarsLayer          — вертикальные объёмы
//        IndicatorLinesLayer      — линии NW / MA / BB / PRO / ALPHA
//        CandlesLayer             — сами свечи
//        SignalsLayer             — треугольники/круги/плашки сигналов
//        OpenTradeLevelsLayer     — горизонтальные уровни открытых сделок
//        XAxisLabels              — подписи оси X
//        Line (lastPrice)         — пунктир последней цены
//      </G>
//   6. ChartStatsLabels           — Vol / MA / ALPHA статистика (поверх)
//   7. PriceTag                   — плашка последней цены
//
// Все координаты приходят уже рассчитанными — компонент ничего не вычисляет,
// только рисует. Это позволяет кэшировать вычисления в chartRenderers/hooks
// и не пересчитывать их при каждом ре-рендере.
//
// Вход: ~35 пропсов (см. сигнатуру ниже) — они сгруппированы по слоям,
//       чтобы в месте вызова (CandlestickChart.js) было видно, что откуда.

import React from 'react';
import Svg, { G, Line, Defs, ClipPath, Rect } from 'react-native-svg';
import { MARGIN } from '../constants/chartTheme';

import { AxisGrid } from './AxisGrid';
import { VolumeProfileLayer } from './VolumeProfileLayer';
import { VolumeBarsLayer } from './VolumeBarsLayer';
import { TradeFillLayer } from './TradeFillLayer';
import { IndicatorLinesLayer } from './IndicatorLinesLayer';
import { CandlesLayer } from './CandlesLayer';
import { SignalsLayer } from './SignalsLayer';
import { OpenTradeLevelsLayer } from './OpenTradeLevelsLayer';
import { XAxisLabels } from './XAxisLabels';
import { ChartStatsLabels } from './ChartStatsLabels';
import { PriceTag } from './PriceTag';

export const ChartSvg = ({
  width,
  height,
  innerWidth,
  priceHeight,
  xScale,
  yScale,
  candleWidth,
  axisY,
  displayData,
  start,
  data,
  nwPaths,
  maPaths,
  proPaths,
  alphaPaths,
  nwSignals,
  maSignals,
  proSignals,
  alphaSignals,
  maFillProfit,
  maFillLoss,
  alphaBoxes,
  proOpenLevels,
  alphaOpenLevels,
  maxVolume,
  volHeight,
  volGap,
  hasVolume,
  hasProfile,
  horizontalBars,
  yAxisLabels,
  xAxisLabels,
  maStatsText,
  alphaStatsText,
  lastColor,
  lastPriceY,
  priceTag,
  lastPriceText,
}) => {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id='plotClip'>
          <Rect x={MARGIN.left} y={0} width={innerWidth} height={height} />
        </ClipPath>
        <ClipPath id='priceClip'>
          <Rect x={MARGIN.left} y={MARGIN.top} width={innerWidth} height={priceHeight} />
        </ClipPath>
      </Defs>

      <AxisGrid
        yAxisLabels={yAxisLabels}
        width={width}
        height={height}
        axisY={axisY}
        hasVolume={hasVolume}
        priceBottom={priceHeight + MARGIN.top}
        volGap={volGap}
      />

      {hasProfile && <VolumeProfileLayer bars={horizontalBars} width={width} />}

      <TradeFillLayer
        maFill={{ fillProfit: maFillProfit, fillLoss: maFillLoss }}
        alphaBoxes={alphaBoxes}
      />

      <G clipPath='url(#plotClip)'>
        {hasVolume && (
          <VolumeBarsLayer
            displayData={displayData}
            start={start}
            axisY={axisY}
            maxVolume={maxVolume}
            volHeight={volHeight}
            candleWidth={candleWidth}
            xScale={xScale}
          />
        )}

        <IndicatorLinesLayer
          nwPaths={nwPaths}
          maPaths={maPaths}
          proPaths={proPaths}
          alphaPaths={alphaPaths}
        />

        <CandlesLayer
          displayData={displayData}
          start={start}
          candleWidth={candleWidth}
          xScale={xScale}
          yScale={yScale}
        />

        <SignalsLayer
          nwSignals={nwSignals}
          maSignals={maSignals}
          proSignals={proSignals}
          alphaSignals={alphaSignals}
        />

        <OpenTradeLevelsLayer
          proLevels={proOpenLevels}
          alphaLevels={alphaOpenLevels}
          width={width}
        />

        <XAxisLabels labels={xAxisLabels} axisY={axisY} />

        <Line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={lastPriceY}
          y2={lastPriceY}
          stroke={lastColor}
          strokeWidth='1'
          strokeDasharray='3,3'
        />
      </G>

      <ChartStatsLabels
        hasVolume={hasVolume}
        maxVolume={maxVolume}
        axisY={axisY}
        volHeight={volHeight}
        maStatsText={maStatsText}
        alphaStatsText={alphaStatsText}
      />

      <PriceTag tag={priceTag} color={lastColor} priceText={lastPriceText} />
    </Svg>
  );
};
