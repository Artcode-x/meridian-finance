import React from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg"
import { Text } from "./Text"
import { colors } from "../../theme"

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 180) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}
const arc = (cx, cy, r, from, to) => {
  const [sx, sy] = polar(cx, cy, r, from)
  const [ex, ey] = polar(cx, cy, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M${sx} ${sy} A${r} ${r} 0 ${large} 1 ${ex} ${ey}`
}

/**
 * Полукруглый индикатор 0..100. stops — градиент дуги; value — число; label — подпись под числом.
 */
export const ArcGauge = ({ value = 0, size = 200, stroke = 12, stops, label, valueText, color }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - stroke
  const height = size / 2 + stroke
  const gradientStops = stops || [colors.gold[700], colors.gold[500], colors.gold[300]]
  return (
    <View style={{ width: size, height, alignItems: "center" }}>
      <Svg width={size} height={height}>
        <Defs>
          <LinearGradient id='arcGrad' x1='0' y1='0' x2='1' y2='0'>
            {gradientStops.map((c, i) => (
              <Stop key={i} offset={`${(i / (gradientStops.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Path
          d={arc(cx, cy, r, 0, 180)}
          stroke={colors.surface[3]}
          strokeWidth={stroke}
          fill='none'
          strokeLinecap='butt'
        />
        {v > 0 && (
          <Path
            d={arc(cx, cy, r, 0, (v / 100) * 180)}
            stroke='url(#arcGrad)'
            strokeWidth={stroke}
            fill='none'
            strokeLinecap='butt'
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text variant='display' color={color || "primary"} tabular>
          {valueText ?? Math.round(v)}
        </Text>
        {label && (
          <Text variant='label' color='gold' align='center'>
            {label}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({ center: { position: "absolute", bottom: 0, alignItems: "center" } })

export default ArcGauge
