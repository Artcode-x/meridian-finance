import React from "react"
import { View, StyleSheet } from "react-native"
import { space } from "../../theme"
import { Chip } from "../ui"

// Ряд таймфреймов: options = [{ label, value }]
export const TimeframeChips = ({ options, value, onChange, style }) => (
  <View style={[styles.row, style]}>
    {options.map((o) => (
      <Chip
        key={String(o.value)}
        label={o.label}
        selected={o.value === value}
        onPress={() => onChange(o.value)}
        style={styles.chip}
      />
    ))}
  </View>
)

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] },
  chip: { flex: 1, paddingHorizontal: 0, justifyContent: "center" }
})

export default TimeframeChips
