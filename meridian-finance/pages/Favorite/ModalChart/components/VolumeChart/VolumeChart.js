import React, { useMemo } from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Rect } from "react-native-svg"
import { Text, Badge } from "../../../../../components/ui"
import { colors, space } from "../../../../../theme"

const fmt = (v) =>
  v >= 1e9
    ? `${(v / 1e9).toFixed(1)}B`
    : v >= 1e6
      ? `${(v / 1e6).toFixed(1)}M`
      : v >= 1e3
        ? `${(v / 1e3).toFixed(0)}K`
        : v.toFixed(0)

// Бары объёма, окрашенные по направлению свечи
export const VolumeChart = ({ candles, width, height = 90 }) => {
  const stats = useMemo(() => {
    const vols = (candles || []).map((c) => Number(c.volume) || 0)
    if (!vols.length) return null
    const max = Math.max(...vols)
    const current = vols[vols.length - 1]
    const avg = vols.reduce((a, b) => a + b, 0) / vols.length
    return { vols, max, current, avg }
  }, [candles])

  if (!stats) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text variant='caption' color='tertiary'>
          No volume data
        </Text>
      </View>
    )
  }

  const ratio = stats.current / stats.avg
  const tone = ratio > 1.2 ? "up" : ratio < 0.8 ? "down" : "neutral"
  const gap = 1
  const barW = Math.max(1.5, (width - gap * (stats.vols.length - 1)) / stats.vols.length)
  const chartH = height - 28

  return (
    <View>
      <View style={styles.statsRow}>
        <Badge tone={tone} label={`Now ${fmt(stats.current)}`} />
        <Text variant='small' color='tertiary'>
          Avg {fmt(stats.avg)} · Peak {fmt(stats.max)}
        </Text>
      </View>
      <Svg width={width} height={chartH}>
        {stats.vols.map((v, i) => {
          const h = Math.max(1, (v / stats.max) * chartH)
          const c = candles[i]
          const up = c.close >= c.open
          return (
            <Rect
              key={i}
              x={i * (barW + gap)}
              y={chartH - h}
              width={barW}
              height={h}
              fill={up ? colors.up.fg : colors.down.fg}
              opacity={0.45 + (v / stats.max) * 0.55}
            />
          )
        })}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[1],
    marginBottom: space[2]
  }
})

export default VolumeChart
