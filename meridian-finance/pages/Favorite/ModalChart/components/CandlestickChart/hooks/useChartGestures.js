// useChartGestures.js
// -----------------------------------------------------------------------------
// Хук всех жестов графика: пинч-зум, панорамирование, двойной тап.
//
//   onPinchEnd          — zoom in/out по scale (пороги 1.05 / 0.95)
//   onPanStateChange    — запоминает offset в начале пана
//   onPan               — сдвигает окно (translationX / candleStep)
//   onDoubleTap         — сброс зума и сдвига + haptic + dispatch(setDoubleTap)
//
// Возвращает { pinchRef, panRef, onPinchEnd, onPanStateChange, onPan, onDoubleTap }.
// Refs нужны, чтобы PinchGestureHandler и PanGestureHandler работали одновременно.
//
// Используется: CandlestickChart.js (оборачивает дерево в три gesture-handler).

import { useRef } from 'react';
import { State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useDispatch } from 'react-redux';
import { setDoubleTap } from '../../../../../../store/reducersSlice';
import {
  MIN_LIMIT,
  MAX_LIMIT,
  DEFAULT_LIMIT,
  ZOOM_IN_THRESHOLD,
  ZOOM_OUT_THRESHOLD,
} from '../constants/chartTheme';

export const useChartGestures = ({
  data,
  currentLimit,
  setLimit,
  offset,
  maxOffset,
  setRawOffset,
  candleStep,
}) => {
  const startOffset = useRef(0);
  const pinchRef = useRef();
  const panRef = useRef();
  const dispatch = useDispatch();

  const onPinchEnd = ({ nativeEvent }) => {
    if (nativeEvent.oldState !== State.ACTIVE) return;
    if (nativeEvent.scale > ZOOM_IN_THRESHOLD) {
      setLimit(Math.max(MIN_LIMIT, Math.floor(currentLimit * 0.8)));
    } else if (nativeEvent.scale < ZOOM_OUT_THRESHOLD) {
      setLimit(Math.min(MAX_LIMIT, data.length, Math.ceil(currentLimit * 1.2)));
    }
  };

  const onPanStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.BEGAN) startOffset.current = offset;
  };

  const onPan = ({ nativeEvent }) => {
    const next = startOffset.current + nativeEvent.translationX / candleStep;
    setRawOffset(Math.max(0, Math.min(maxOffset, next)));
  };

  const onDoubleTap = ({ nativeEvent }) => {
    if (nativeEvent.state !== State.ACTIVE) return;
    setLimit(DEFAULT_LIMIT);
    setRawOffset(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    dispatch(setDoubleTap());
  };

  return { pinchRef, panRef, onPinchEnd, onPanStateChange, onPan, onDoubleTap };
};
