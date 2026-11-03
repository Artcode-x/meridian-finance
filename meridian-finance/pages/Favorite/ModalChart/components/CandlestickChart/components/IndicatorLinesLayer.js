// IndicatorLinesLayer.js
// -----------------------------------------------------------------------------
// Слой ВСЕХ линий индикаторов, чтобы не засорять ChartSvg:
//   - NW: mid (пунктир), upper (красный), lower (зелёный), opacity 0.5
//   - MA: bbFill (заливка BBands), bbUpper/bbLower, bbMid, fast, slow
//   - PRO: ema200 (толстая), ema50 (тонкая)
//   - ALPHA: slow (пунктир), mid (тонкая)
//
// Каждый блок под собственным null-check — если индикатор выключен, его paths
// приходят как null и просто не рисуются.
//
// Вход: nwPaths, maPaths, proPaths, alphaPaths (результаты build*Visuals.paths).

import React from 'react';
import { Path, G } from 'react-native-svg';
import {
  NW_MID_COLOR,
  NW_DN_COLOR,
  NW_UP_COLOR,
  BB_FILL_COLOR,
  BB_BAND_COLOR,
  BB_BASIS_COLOR,
  MA_SLOW_COLOR,
  MA_FAST_COLOR,
  PRO_COLOR_MAIN,
  PRO_COLOR_EMA50,
  ALPHA_COLOR_SLOW,
  ALPHA_COLOR_MID,
} from '../constants/chartTheme';

export const IndicatorLinesLayer = ({ nwPaths, maPaths, proPaths, alphaPaths }) => {
  return (
    <G>
      {/* NW */}
      {nwPaths && (
        <G opacity={0.5}>
          <Path
            d={nwPaths.mid}
            stroke={NW_MID_COLOR}
            strokeWidth='1'
            strokeDasharray='4,3'
            fill='none'
          />
          <Path
            d={nwPaths.upper}
            stroke={NW_DN_COLOR}
            strokeWidth='1.5'
            strokeDasharray='6,3'
            fill='none'
          />
          <Path
            d={nwPaths.lower}
            stroke={NW_UP_COLOR}
            strokeWidth='1.5'
            strokeDasharray='6,3'
            fill='none'
          />
        </G>
      )}

      {/* MA */}
      {maPaths && (
        <G>
          {maPaths.bbFill !== '' && <Path d={maPaths.bbFill} fill={BB_FILL_COLOR} />}
          <Path d={maPaths.bbUpper} stroke={BB_BAND_COLOR} strokeWidth='1' fill='none' />
          <Path d={maPaths.bbLower} stroke={BB_BAND_COLOR} strokeWidth='1' fill='none' />
          <Path d={maPaths.bbMid} stroke={BB_BASIS_COLOR} strokeWidth='1' fill='none' />
          <Path d={maPaths.slow} stroke={MA_SLOW_COLOR} strokeWidth='1.5' fill='none' />
          <Path d={maPaths.fast} stroke={MA_FAST_COLOR} strokeWidth='1.5' fill='none' />
        </G>
      )}

      {/* PRO */}
      {proPaths && (
        <G>
          <Path
            d={proPaths.ema200}
            stroke={PRO_COLOR_MAIN}
            strokeWidth='2'
            fill='none'
            opacity={0.8}
          />
          <Path
            d={proPaths.ema50}
            stroke={PRO_COLOR_EMA50}
            strokeWidth='1.5'
            fill='none'
            opacity={0.6}
          />
        </G>
      )}

      {/* ALPHA */}
      {alphaPaths && (
        <G>
          <Path
            d={alphaPaths.slow}
            stroke={ALPHA_COLOR_SLOW}
            strokeWidth='1.5'
            strokeDasharray='5,3'
            fill='none'
          />
          <Path
            d={alphaPaths.mid}
            stroke={ALPHA_COLOR_MID}
            strokeWidth='1.2'
            fill='none'
            opacity={0.8}
          />
        </G>
      )}
    </G>
  );
};
