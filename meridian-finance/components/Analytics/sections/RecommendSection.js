import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { colors, space, goldAlpha } from "../../../theme"
import { Surface, Text } from "../../ui"

const Tip = ({ icon, text, tone = "gold" }) => {
  const fg = tone === "gold" ? colors.gold[400] : colors[tone].fg
  return (
    <View style={styles.tip}>
      <View
        style={[styles.iconWrap, { backgroundColor: tone === "gold" ? goldAlpha(0.14) : colors[tone].bg }]}
      >
        <Ionicons name={icon} size={14} color={fg} />
      </View>
      <Text variant='caption' color='secondary' style={{ flex: 1, marginLeft: space[3] }}>
        {text}
      </Text>
    </View>
  )
}

const RecommendSection = ({ portfolioMetrics: m, timeframe }) => (
  <Surface variant='goldCase' radius='lg' style={{ marginBottom: space[4] }}>
    <View style={styles.inner}>
      <View style={styles.head}>
        <Ionicons name='bulb' size={16} color={colors.gold[400]} />
        <Text variant='label' color='gold' style={{ marginLeft: 6 }}>
          Insights
        </Text>
      </View>
      {m.totalAssets <= 2 && (
        <Tip icon='add-circle-outline' text='Add more assets to improve diversification.' tone='up' />
      )}
      {m.allocationAnalysis.concentration > 40 && (
        <Tip
          icon='scale-outline'
          text='Your top asset dominates the portfolio. Consider rebalancing.'
          tone='down'
        />
      )}
      {m.portfolioChange < -3 && (
        <Tip
          icon='trending-down-outline'
          text='Market is down — strong assets may be at a discount.'
          tone='warning'
        />
      )}
      {timeframe !== "24h" && !m.allDataLoaded && (
        <Tip
          icon='time-outline'
          text='Historical data is still loading. Check back in a moment.'
          tone='info'
        />
      )}
      {m.hasSimulatedData && (
        <Tip icon='flask-outline' text='Some values are simulated where the API failed.' tone='warning' />
      )}
      <Tip icon='calendar-outline' text='Review your portfolio regularly and rebalance quarterly.' />
    </View>
  </Surface>
)

const styles = StyleSheet.create({
  inner: { padding: space[4] },
  head: { flexDirection: "row", alignItems: "center", marginBottom: space[2] },
  tip: { flexDirection: "row", alignItems: "center", paddingVertical: space[2] },
  iconWrap: { width: 28, height: 28, borderRadius: 0, alignItems: "center", justifyContent: "center" }
})

export default RecommendSection
