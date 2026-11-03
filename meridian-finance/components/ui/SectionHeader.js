import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { PressableScale } from "./PressableScale"
import { Text } from "./Text"
import { colors, space } from "../../theme"

export const SectionHeader = ({ title, subtitle, action, icon, style }) => (
  <View style={[styles.row, style]}>
    <View style={{ flex: 1 }}>
      <View style={styles.titleRow}>
        {icon && <Ionicons name={icon} size={14} color={colors.gold[500]} style={{ marginRight: 6 }} />}
        <Text variant='label' color='gold'>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text variant='caption' color='tertiary' style={{ marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </View>
    {action && (
      <PressableScale haptic='selection' onPress={action.onPress} hitSlop={8}>
        <Text variant='caption' color='secondary'>
          {action.label}
        </Text>
      </PressableScale>
    )}
  </View>
)

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginBottom: space[2],
    marginTop: 0
  },
  titleRow: { flexDirection: "row", alignItems: "center" }
})

export default SectionHeader
