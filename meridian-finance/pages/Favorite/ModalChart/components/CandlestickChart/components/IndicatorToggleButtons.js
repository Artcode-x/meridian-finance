// IndicatorToggleButtons.js
// -----------------------------------------------------------------------------
// Пять кнопок переключения индикаторов, вертикально справа:
//   NW (жёлтая рамка) · VP · MA (синяя) · PRO (пурпурная) · ALPHA (жёлтая)
//
// Каждая кнопка:
//   - вызывает haptic selectionAsync при тапе (внутренний wrap(onPress)),
//   - меняет прозрачность (0.6 выкл → 0.95 вкл) и цвет текста,
//   - подложка активного состояния — полупрозрачный цвет индикатора.
//
// hitSlop расширен по вертикали, чтобы пальцем было легко попасть
// (кнопки мелкие и впритык друг к другу).
//
// Вход: showNW/showVP/showMA/showPRO/showALPHA + onToggle* колбэки.

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import * as Haptics from 'expo-haptics';
import {
  MARGIN,
  NW_BTN_BORDER,
  NW_UP_COLOR,
  PRO_COLOR_MAIN,
  ALPHA_COLOR_MAIN,
} from '../constants/chartTheme';

const toggleStyle = (top, active, borderColor, bgActive) => ({
  position: 'absolute',
  top,
  right: MARGIN.right + 2,
  paddingHorizontal: 5,
  paddingVertical: 1,
  borderRadius: 4,
  borderWidth: 1,
  borderColor,
  backgroundColor: active ? bgActive : 'transparent',
  opacity: active ? 0.95 : 0.6,
});

const labelStyle = (active, activeColor, bold) => ({
  fontSize: RFValue(6),
  color: active ? activeColor : 'rgba(255,255,255,0.8)',
  fontWeight: bold ? 'bold' : 'normal',
});

export const IndicatorToggleButtons = ({
  showNW,
  showVP,
  showMA,
  showPRO,
  showALPHA,
  onToggleNW,
  onToggleVP,
  onToggleMA,
  onTogglePRO,
  onToggleALPHA,
}) => {
  const wrap = (fn) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };

  return (
    <>
      <TouchableOpacity
        onPress={wrap(onToggleNW)}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={toggleStyle(1, showNW, NW_BTN_BORDER, 'rgba(57,255,20,0.12)')}
      >
        <Text style={labelStyle(showNW, NW_UP_COLOR)}>NW</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={wrap(onToggleVP)}
        activeOpacity={0.6}
        hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
        style={toggleStyle(24, showVP, NW_BTN_BORDER, 'rgba(57,255,20,0.12)')}
      >
        <Text style={labelStyle(showVP, NW_UP_COLOR)}>VP</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={wrap(onToggleMA)}
        activeOpacity={0.6}
        hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
        style={toggleStyle(47, showMA, NW_BTN_BORDER, 'rgba(41,98,255,0.18)')}
      >
        <Text style={labelStyle(showMA, '#4FC3F7')}>MA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={wrap(onTogglePRO)}
        activeOpacity={0.6}
        hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
        style={toggleStyle(70, showPRO, PRO_COLOR_MAIN, 'rgba(224,64,251,0.15)')}
      >
        <Text style={labelStyle(showPRO, PRO_COLOR_MAIN, true)}>PRO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={wrap(onToggleALPHA)}
        activeOpacity={0.6}
        hitSlop={{ top: 2, bottom: 10, left: 10, right: 10 }}
        style={toggleStyle(93, showALPHA, ALPHA_COLOR_MAIN, 'rgba(255,215,64,0.15)')}
      >
        <Text style={labelStyle(showALPHA, ALPHA_COLOR_MAIN, true)}>ALPHA</Text>
      </TouchableOpacity>
    </>
  );
};
