import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet } from "react-native"
import { colors } from "../../theme"

export const Divider = ({ gold, vertical, style, spacing = 0 }) => {
  if (gold) {
    return (
      <LinearGradient
        colors={colors.gradients.goldHairline}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.h, { marginVertical: spacing }, style]}
      />
    )
  }
  return (
    <View
      style={[
        vertical ? styles.v : styles.h,
        vertical ? { marginHorizontal: spacing } : { marginVertical: spacing },
        style
      ]}
    />
  )
}

const styles = StyleSheet.create({
  h: { height: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: colors.line.default },
  v: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: colors.line.default }
})

export default Divider
