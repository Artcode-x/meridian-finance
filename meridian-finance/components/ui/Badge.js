import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { View, StyleSheet } from "react-native"
import { PressableScale } from "./PressableScale"
import { Text } from "./Text"
import { toneColors, radius, space, goldAlpha, colors } from "../../theme"

export const Badge = ({ label, tone = "neutral", icon, size = "sm", style }) => {
  const t = toneColors[tone] || toneColors.neutral
  const big = size === "md"
  return (
    <View
      style={[styles.badge, big && styles.badgeMd, { backgroundColor: t.bg, borderColor: t.border }, style]}
    >
      {icon && <Ionicons name={icon} size={big ? 14 : 11} color={t.fg} style={{ marginRight: 3 }} />}
      <Text variant={big ? "caption" : "small"} color={t.fg} tabular>
        {label}
      </Text>
    </View>
  )
}

// Выбираемая пилюля (таймфреймы, фильтры)
export const Chip = ({ label, selected, onPress, icon, count, style, disabled }) => (
  <PressableScale
    haptic='selection'
    onPress={onPress}
    disabled={disabled}
    scaleTo={0.94}
    style={[styles.chip, selected && styles.chipSelected, style]}
  >
    {icon && (
      <Ionicons
        name={icon}
        size={13}
        color={selected ? colors.text.inverse : colors.text.secondary}
        style={{ marginRight: 5 }}
      />
    )}
    <Text
      variant='caption'
      color={selected ? "inverse" : "secondary"}
      style={selected && { fontFamily: "Manrope_700Bold", fontWeight: "700" }}
    >
      {label}
    </Text>
    {count !== undefined && (
      <View style={[styles.count, selected && { backgroundColor: "rgba(10,10,15,0.18)" }]}>
        <Text variant='small' color={selected ? "inverse" : "tertiary"} tabular>
          {count}
        </Text>
      </View>
    )}
  </PressableScale>
)

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start"
  },
  badgeMd: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    backgroundColor: colors.surface[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default
  },
  chipSelected: { backgroundColor: colors.gold[500], borderColor: goldAlpha(0.8) },
  count: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 0,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface[3]
  }
})

export default Badge
