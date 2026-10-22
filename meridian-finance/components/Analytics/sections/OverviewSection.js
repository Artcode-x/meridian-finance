import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { colors, space, goldAlpha } from "../../../theme"
import { Accordion, Surface, Text, PercentBadge } from "../../ui"

const Performer = ({ label, icon, asset, tone, timeframe }) => (
  <Surface level={2} radius='md' style={{ flex: 1 }}>
    <View style={styles.perf}>
      <View style={styles.perfHead}>
        <Ionicons name={icon} size={13} color={tone === "up" ? colors.up.fg : colors.down.fg} />
        <Text variant='label' color='tertiary' style={{ marginLeft: 5 }}>
          {label}
        </Text>
      </View>
      <Text variant='h3' style={{ marginTop: space[2] }}>
        {asset?.symbol?.toUpperCase() || "—"}
      </Text>
      <PercentBadge value={asset?.priceChange} style={{ marginTop: 4 }} />
      {!asset?.hasData && timeframe !== "24h" && (
        <Text variant='small' color='tertiary'>
          loading…
        </Text>
      )}
    </View>
  </Surface>
)

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text variant='h2' color='gold' tabular>
      {value}
    </Text>
    <Text variant='label' color='tertiary'>
      {label}
    </Text>
  </View>
)

const OverviewSection = ({ portfolioMetrics: m, timeframe }) => (
  <Accordion
    title='Overview'
    subtitle='Best, worst and structure'
    icon='stats-chart'
    defaultOpen
    style={{ marginBottom: space[4] }}
  >
    <View style={styles.row}>
      <Performer label='Best' icon='trending-up' asset={m.bestPerformer} tone='up' timeframe={timeframe} />
      <Performer
        label='Worst'
        icon='trending-down'
        asset={m.worstPerformer}
        tone='down'
        timeframe={timeframe}
      />
    </View>
    <View style={styles.stats}>
      <Stat value={m.totalAssets} label='Assets' />
      <View style={styles.divider} />
      <Stat value={`${Math.round(m.allocationAnalysis.top3)}%`} label='Top 3' />
      <View style={styles.divider} />
      <Stat value={m.riskMetrics.diversificationScore} label='Diversity' />
    </View>
  </Accordion>
)

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] },
  perf: { padding: space[3] },
  perfHead: { flexDirection: "row", alignItems: "center" },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space[3],
    padding: space[3],
    borderRadius: 0,
    backgroundColor: goldAlpha(0.06),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.2)
  },
  stat: { flex: 1, alignItems: "center" },
  divider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: goldAlpha(0.3) }
})

export default OverviewSection
