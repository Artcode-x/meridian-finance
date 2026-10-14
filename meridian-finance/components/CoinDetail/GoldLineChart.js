import React, { useMemo } from "react"
import { View, Dimensions, StyleSheet } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { colors, space } from "../../theme"
import { Text } from "../ui"

const { width: SCREEN_W } = Dimensions.get("window")

const formatYLabel = (value) => {
  const num = parseFloat(value)
  if (isNaN(num)) return "0"
  if (Math.abs(num) < 0.000001 && num !== 0) return num.toExponential(2)
  if (Math.abs(num) < 0.001 && num !== 0) return num.toFixed(6)
  if (Math.abs(num) < 1) return num.toFixed(4)
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 1 : 2)}k`
  return num.toFixed(2)
}

// Линейный график в золотой гамме поверх react-native-chart-kit
export const GoldLineChart = ({ prices, labels, width = SCREEN_W - 40, height = 200, tone }) => {
  const data = prices || []
  const isUp = data.length > 1 ? data[data.length - 1] >= data[0] : true
  const resolvedTone = tone || (isUp ? "up" : "down")
  const lineColor = resolvedTone === "gold" ? colors.gold[500] : colors[resolvedTone].fg

  const filteredLabels = useMemo(() => {
    if (!labels?.length) return []
    const desired = width >= 500 ? 8 : 6
    const step = Math.max(1, Math.floor(labels.length / desired))
    return labels.filter((_, i) => i % step === 0)
  }, [labels, width])

  const hasSmall = data.length && Math.min(...data) < 0.001

  if (!data.length) return null

  return (
    <View style={styles.wrap}>
      <LineChart
        data={{ labels: filteredLabels, datasets: [{ data, strokeWidth: 2, color: () => lineColor }] }}
        width={width}
        height={height}
        withDots={false}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        withShadow
        fromZero={false}
        formatYLabel={formatYLabel}
        segments={4}
        bezier
        chartConfig={{
          backgroundColor: "transparent",
          backgroundGradientFrom: colors.bg[2],
          backgroundGradientTo: colors.bg[2],
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          fillShadowGradientFrom: lineColor,
          fillShadowGradientFromOpacity: 0.22,
          fillShadowGradientTo: lineColor,
          fillShadowGradientToOpacity: 0,
          decimalPlaces: hasSmall ? 6 : 2,
          color: () => lineColor,
          labelColor: () => colors.text.tertiary,
          propsForBackgroundLines: { stroke: colors.line.default, strokeDasharray: "4,6" },
          propsForLabels: { fontSize: 9, fontFamily: "Manrope_500Medium" }
        }}
        paddingRight={60}
        style={{ marginLeft: -4 }}
      />
      {hasSmall ? (
        <Text variant='small' color='tertiary' style={{ marginLeft: space[4] }}>
          High-precision values
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({ wrap: { overflow: "hidden" } })

export default GoldLineChart
