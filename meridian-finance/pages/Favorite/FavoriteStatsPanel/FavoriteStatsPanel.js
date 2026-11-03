import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { Surface, Text } from "../../../components/ui"
import { colors, space, goldAlpha } from "../../../theme"

const Tile = ({ icon, label, value, tone }) => {
  const fg = tone ? colors[tone].fg : colors.text.primary
  return (
    <Surface variant='goldCase' radius='md' style={{ flex: 1 }}>
      <View style={styles.tile}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={13} color={colors.gold[400]} />
        </View>
        <Text
          variant='h3'
          color={fg}
          tabular
          style={{ marginTop: space[2] }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        <Text variant='label' color='tertiary' numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Surface>
  )
}

// Сводка портфеля: три золотых тайла
const FavoriteStatsPanel = ({ stats }) => (
  <View style={styles.row}>
    <Tile icon='trending-up' label='Gaining' value={stats.bullish} tone='up' />
    <Tile icon='trending-down' label='Losing' value={stats.bearish} tone='down' />
    <Tile icon='notifications' label='Alerts' value={stats.activeAlerts} />
  </View>
)

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2], paddingHorizontal: space[4], marginBottom: space[3] },
  tile: { padding: space[3] },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.14),
    alignItems: "center",
    justifyContent: "center"
  }
})

export default FavoriteStatsPanel
