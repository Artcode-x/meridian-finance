import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { colors, space, goldAlpha } from "../../theme"
import { Surface, Text } from "../ui"

// Сетка статистики: items = [{ label, value, icon, tone }]
export const StatsGrid = ({ items, columns = 2 }) => (
  <View style={styles.grid}>
    {items.map((it, i) => {
      const fg =
        it.tone && colors[it.tone]
          ? colors[it.tone].fg
          : it.tone === "gold"
            ? colors.gold[500]
            : colors.text.primary
      return (
        <View key={i} style={[styles.cell, { width: `${100 / columns}%` }]}>
          <Surface level={1} radius='md' padding={3} style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              {it.icon && (
                <Ionicons name={it.icon} size={12} color={colors.gold[500]} style={{ marginRight: 5 }} />
              )}
              <Text variant='label' color='tertiary' numberOfLines={1}>
                {it.label}
              </Text>
            </View>
            <Text variant='mono' color={fg} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 6 }}>
              {it.value ?? "—"}
            </Text>
            {it.sub && (
              <Text variant='small' color='tertiary' numberOfLines={1}>
                {it.sub}
              </Text>
            )}
          </Surface>
        </View>
      )
    })}
  </View>
)

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -space[1] },
  cell: { padding: space[1] },
  labelRow: { flexDirection: "row", alignItems: "center" }
})

export default StatsGrid
