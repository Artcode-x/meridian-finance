import * as Haptics from "expo-haptics"
import React, { useState, useRef, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler"
import Svg, { Rect, Line, G, Text as SvgText } from "react-native-svg"
import { useDispatch } from "react-redux"
import { Text } from "../../../../../components/ui"
import { setDoubleTap } from "../../../../../store/reducersSlice"
import { colors, space } from "../../../../../theme"

const CandlestickChart = ({ data, width: chartWidth, height: chartHeight, limit, setLimit }) => {
  const [, setZoomScale] = useState(1)
  const [lastScale, setLastScale] = useState(1)
  const [internalLimit, setInternalLimit] = useState(limit || data?.length || 0)

  const pinchRef = useRef()
  const doubleTapRef = useRef()

  const dispatch = useDispatch()

  // Функция для легкой вибрации
  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.warn("Haptic not available:", error)
    }
  }

  // Синхронизация internalLimit с limit при изменении извне
  useEffect(() => {
    if (limit && limit !== internalLimit) {
      setInternalLimit(limit)
    }
  }, [limit])

  // Хуки выше — ранний выход только после них
  if (!data || data.length === 0) return null

  // Используем либо limit, либо internalLimit
  const currentLimit = limit !== undefined ? limit : internalLimit

  // Ограничение количества отображаемых свечей
  const displayData = data.slice(0, Math.min(currentLimit, data.length))

  const margin = { top: 10, right: 12, bottom: 10, left: 56 }
  const innerWidth = chartWidth - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom

  const minPrice = Math.min(...displayData.map((d) => Math.min(d.low, d.open, d.close)))
  const maxPrice = Math.max(...displayData.map((d) => Math.max(d.high, d.open, d.close)))
  const priceRange = maxPrice - minPrice

  const xScale = (index) => margin.left + (index / (displayData.length - 1)) * innerWidth + 1
  const yScale = (price) => margin.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight

  // Обработка жеста pinch для зума
  const onPinchGestureEvent = (event) => {
    setZoomScale(event.nativeEvent.scale)
  }

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newScale = lastScale * event.nativeEvent.scale
      setLastScale(newScale)

      // Изменение количества отображаемых свечей на основе зума
      if (event.nativeEvent.scale > 1.05) {
        // Увеличиваем (уменьшаем количество свеч)
        const newCount = Math.max(10, Math.floor(currentLimit * 0.8))
        setLimit(newCount)
      } else if (event.nativeEvent.scale < 1.05) {
        // Уменьшаем (увеличиваем количество свеч)
        const newCount = Math.min(200, Math.ceil(currentLimit * 1.2))
        setLimit(newCount)
      }

      setZoomScale(1)
    }
  }

  const onDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Double tap detected, resetting to full data
      setLimit(100)
      triggerHaptic()
      dispatch(setDoubleTap())
    }
  }

  const generateYAxisLabels = () => {
    const numberOfLabels = 5
    const labels = []

    for (let i = 0; i <= numberOfLabels; i++) {
      const price = minPrice + (priceRange * i) / numberOfLabels
      const yPosition = yScale(price)

      let formattedPrice
      if (price >= 1000000) {
        formattedPrice = `$${(price / 1000000).toFixed(2)}M`
      } else if (price >= 1000) {
        formattedPrice = `$${(price / 1000).toFixed(2)}k`
      } else if (price >= 1) {
        formattedPrice = `$${price.toFixed(2)}`
      } else if (price >= 0.1) {
        formattedPrice = `$${price.toFixed(3)}`
      } else if (price >= 0.01) {
        formattedPrice = `$${price.toFixed(4)}`
      } else if (price >= 0.001) {
        formattedPrice = `$${price.toFixed(5)}`
      } else if (price >= 0.0001) {
        formattedPrice = `$${price.toFixed(6)}`
      } else {
        formattedPrice = `$${price.toFixed(8)}`
      }

      if (formattedPrice.length > 12) {
        formattedPrice = `$${price.toExponential(3)}`
      }

      labels.push({
        price: formattedPrice,
        y: yPosition,
        rawPrice: price
      })
    }

    return labels
  }

  const yAxisLabels = generateYAxisLabels()
  const candleWidth = Math.max(2, (innerWidth / displayData.length) * 0.6)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.hint}>
          <Text variant='small' color='tertiary'>
            {currentLimit < data.length
              ? `${currentLimit} of ${data.length} candles · pinch to zoom · double tap to reset`
              : "Pinch to zoom · double tap to reset"}
          </Text>
        </View>

        <TapGestureHandler ref={doubleTapRef} onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
          <View>
            <PinchGestureHandler
              ref={pinchRef}
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <View style={{ width: chartWidth, height: chartHeight }}>
                <Svg width={chartWidth} height={chartHeight}>
                  {yAxisLabels.map((label, index) => (
                    <G key={`grid-${index}`}>
                      <Line
                        x1={margin.left}
                        y1={label.y}
                        x2={chartWidth - margin.right}
                        y2={label.y}
                        stroke={colors.line.default}
                        strokeWidth='1'
                        strokeDasharray='3,5'
                      />
                      <SvgText
                        x={margin.left - 6}
                        y={label.y + 3}
                        fill={colors.text.tertiary}
                        fontSize='9'
                        fontFamily='Manrope_500Medium'
                        textAnchor='end'
                      >
                        {label.price}
                      </SvgText>
                    </G>
                  ))}

                  {displayData.map((candle, index) => {
                    const x = xScale(index) - candleWidth / 2
                    const openY = yScale(candle.open)
                    const closeY = yScale(candle.close)
                    const highY = yScale(candle.high)
                    const lowY = yScale(candle.low)
                    const isBullish = candle.close >= candle.open
                    const color = isBullish ? colors.up.fg : colors.down.fg
                    const candleTopY = isBullish ? closeY : openY
                    const candleBottomY = isBullish ? openY : closeY
                    const candleHeight = Math.max(1, Math.abs(candleBottomY - candleTopY))

                    return (
                      <G key={index}>
                        <Line
                          x1={x + candleWidth / 2}
                          y1={highY}
                          x2={x + candleWidth / 2}
                          y2={lowY}
                          stroke={color}
                          strokeWidth='1'
                        />
                        <Rect x={x} y={candleTopY} width={candleWidth} height={candleHeight} fill={color} />
                      </G>
                    )
                  })}
                </Svg>
              </View>
            </PinchGestureHandler>
          </View>
        </TapGestureHandler>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  hint: { alignSelf: "flex-end", paddingHorizontal: space[3], marginBottom: space[1] }
})

export default CandlestickChart
