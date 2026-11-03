// useChartIndicators.js
//
// Хук вычисления всех индикаторов (NW/MA/PRO/ALPHA) с мемоизацией.
//
// На вход — data + флаги видимости (showNW/showMA/showPRO/showALPHA) +
// опции NW (bandwidth, mult) и MA (mode).
//
// Возвращает { nw, ma, pro, alpha }:
//   nw    — null | результат computeNW
//   ma    — null | результат computeMACross
//   pro   — null | результат computePROIndicator
//   alpha — null | результат computeAlpha
//
// Индикатор не считается, если он выключен или данных < 2 свечей — экономия CPU
// при каждом пан/зуме (data не меняется → useMemo возвращает кэш).

import { useMemo } from 'react';
import { computeNW } from '../../../components/CandlestickChart/indicators/computeNW';
import { computeMACross } from '../../../components/CandlestickChart/indicators/computeMACross';
import { computePROIndicator } from '../../../components/CandlestickChart/indicators/computePROIndicator';
import { computeAlpha } from '../../../components/CandlestickChart/indicators/computeAlpha';
import {
  NW_BANDWIDTH,
  NW_MULT,
  NW_WINDOW,
  MA_OPTIONS,
  MA_MODE,
} from '../constants/chartTheme';

export const useChartIndicators = ({
  data,
  showNW,
  showMA,
  showPRO,
  showALPHA,
  nwBandwidth = NW_BANDWIDTH,
  nwMult = NW_MULT,
  maMode = MA_MODE,
}) => {
  const nw = useMemo(
    () =>
      showNW && data && data.length > 1
        ? computeNW(data, nwBandwidth, nwMult, NW_WINDOW)
        : null,
    [showNW, data, nwBandwidth, nwMult],
  );

  const ma = useMemo(
    () =>
      showMA && data && data.length > 1
        ? computeMACross(data, { ...MA_OPTIONS, mode: maMode })
        : null,
    [showMA, data, maMode],
  );

  const pro = useMemo(
    () => (showPRO && data && data.length > 1 ? computePROIndicator(data) : null),
    [showPRO, data],
  );

  const alpha = useMemo(
    () => (showALPHA && data && data.length > 1 ? computeAlpha(data) : null),
    [showALPHA, data],
  );

  return { nw, ma, pro, alpha };
};
