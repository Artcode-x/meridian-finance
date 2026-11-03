import React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { colors, space } from "../../../theme"
import { Surface, Text, Chip, PriceText, PercentBadge, Badge } from "../../ui"

const TF = ["24h", "7d", "30d", "All"]
const TF_NAMES = { "24h": "24 hours", "7d": "7 days", "30d": "30 days", All: "1 year" }

// Главная карточка аналитики: стоимость портфеля, изменение, таймфрейм
const HeaderCard = ({ timeframe, isCalculating, portfolioMetrics, handleTimeframeChange }) => {
  const m = portfolioMetrics
  const loading = !m.allDataLoaded && timeframe !== "24h"
  return (
    <Surface variant='goldCase' radius='xl' shadow='card' style={{ marginBottom: space[4] }}>
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text variant='label' color='gold'>
            Portfolio value
          </Text>
          {m.hasSimulatedData && <Badge tone='warning' icon='flask-outline' label='Simulated' />}
        </View>
        <PriceText value={m.totalValue} money variant='display' />
        <View style={styles.changeRow}>
          {loading ? (
            <ActivityIndicator color={colors.gold[500]} size='small' />
          ) : (
            <PercentBadge value={m.portfolioChange} size='md' />
          )}
          <Text variant='caption' color='secondary' style={{ marginLeft: space[2] }}>
            {loading ? "Loading history…" : `${TF_NAMES[timeframe]} · `}
            {!loading && (
              <Text variant='caption' color={m.periodProfit >= 0 ? "up" : "down"} tabular>
                {m.periodProfit >= 0 ? "+" : "−"}
                {Math.abs(m.periodProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })} $
              </Text>
            )}
          </Text>
        </View>
        <View style={styles.tfRow}>
          {TF.map((tf) => (
            <Chip
              key={tf}
              label={tf}
              selected={timeframe === tf}
              disabled={isCalculating}
              onPress={() => handleTimeframeChange(tf)}
              style={styles.chip}
            />
          ))}
        </View>
      </View>
    </Surface>
  )
}

const styles = StyleSheet.create({
  inner: { padding: space[4] },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space[2]
  },
  changeRow: { flexDirection: "row", alignItems: "center", marginTop: space[3] },
  tfRow: { flexDirection: "row", gap: space[2], marginTop: space[5] },
  chip: { flex: 1, justifyContent: "center", paddingHorizontal: 0, height: 32 }
})

export default HeaderCard
