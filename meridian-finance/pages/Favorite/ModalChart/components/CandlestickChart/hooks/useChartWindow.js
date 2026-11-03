// Хук видимого окна данных.
//
// Управляет «сдвигом» (offset) по истории и вычисляет текущий слайс:
//   currentLimit — сколько свечей видно (уже с учётом клэмпа к data.length)
//   maxOffset    — максимально допустимый сдвиг (чтобы не уехать в пустоту)
//   offset       — текущий сдвиг (клэмпнутый)
//   start        — индекс первой видимой свечи в исходном массиве
//   displayData  — срез data на 2 свечи шире (для плавных линий индикаторов)
//
// Возвращает { ...всё_выше, setRawOffset } — setRawOffset ставит «сырой»
// сдвиг, хук сам его клэмпит и пересчитывает start/displayData.
//
// Используется: CandlestickChart.js , useChartScales, useChartGestures.

import { useMemo, useState } from 'react';

export const useChartWindow = (data, limit) => {
  const [rawOffset, setRawOffset] = useState(0);

  const computed = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        currentLimit: 1,
        maxOffset: 0,
        offset: 0,
        start: 0,
        displayData: [],
      };
    }
    const currentLimit = Math.max(1, Math.min(limit, data.length));
    const maxOffset = data.length - currentLimit;
    const offset = Math.min(rawOffset, maxOffset);
    const start = Math.floor(data.length - currentLimit - offset);
    const displayData = data.slice(start, start + currentLimit + 2);
    return { currentLimit, maxOffset, offset, start, displayData };
  }, [data, limit, rawOffset]);

  return { ...computed, rawOffset, setRawOffset };
};
