import React from "react"
import { View, StyleSheet } from "react-native"
import { colors, space } from "../../../theme"
import { Accordion, ArcGauge, Text, Surface } from "../../ui"

const Meter = ({ label, value, max = 100, tone, hint }) => {
  const fg = colors[tone]?.fg || colors.gold[500]
  return (
    <Surface level={2} radius='md' style={{ flex: 1 }}>
      <View style={styles.meter}>
        <Text variant='label' color='tertiary'>
          {label}
        </Text>
        <Text variant='h3' color={fg} tabular style={{ marginTop: 4 }}>
          {value}
        </Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(100, (parseFloat(value) / max) * 100)}%`, backgroundColor: fg }
            ]}
          />
        </View>
        <Text variant='small' color='tertiary' style={{ marginTop: 6 }}>
          {hint}
        </Text>
      </View>
    </Surface>
  )
}

const RiskSection = ({ portfolioMetrics: m }) => {
  const vol = m.riskMetrics.volatility
  const div = m.riskMetrics.diversificationScore
  const conc = m.allocationAnalysis.concentration
  // Итоговый балл здоровья портфеля: диверсификация минус штрафы за концентрацию и волатильность
  const health = Math.round(
    Math.max(0, Math.min(100, div - Math.max(0, conc - 30) * 0.5 - Math.max(0, vol - 15) * 0.5))
  )
  const healthLabel = health > 70 ? "Balanced" : health > 40 ? "Moderate risk" : "High risk"
  const healthTone = health > 70 ? "up" : health > 40 ? "warning" : "down"

  return (
    <Accordion title='Risk' subtitle={healthLabel} icon='shield-checkmark' style={{ marginBottom: space[4] }}>
      <View style={{ alignItems: "center", marginBottom: space[4] }}>
        <ArcGauge
          value={health}
          size={180}
          label='Portfolio health'
          color={colors[healthTone].fg}
          stops={[colors.down.fg, colors.warning.fg, colors.up.fg]}
        />
      </View>
      <View style={styles.row}>
        <Meter
          label='Volatility'
          value={`${vol.toFixed(1)}%`}
          tone={vol > 30 ? "down" : vol > 15 ? "warning" : "up"}
          hint={vol > 30 ? "Very volatile" : vol > 15 ? "Moderate" : "Stable"}
        />
        <Meter
          label='Diversity'
          value={`${div}`}
          tone={div > 70 ? "up" : div > 40 ? "warning" : "down"}
          hint={div > 70 ? "Well spread" : div > 40 ? "Could improve" : "Concentrated"}
        />
        <Meter
          label='Top asset'
          value={`${conc.toFixed(0)}%`}
          tone={conc > 40 ? "down" : conc > 25 ? "warning" : "up"}
          hint={conc > 40 ? "Heavy weight" : conc > 25 ? "Noticeable" : "Healthy"}
        />
      </View>
    </Accordion>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] },
  meter: { padding: space[3] },
  track: {
    height: 3,
    borderRadius: 0,
    backgroundColor: colors.surface[3],
    marginTop: space[2],
    overflow: "hidden"
  },
  fill: { height: 3, borderRadius: 0 }
})

export default RiskSection
