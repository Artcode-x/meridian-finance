import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { PressableScale } from "./PressableScale"
import { Text } from "./Text"
import { colors, radius, space, goldAlpha, elevation } from "../../theme"

const sizes = {
  sm: { height: 36, paddingHorizontal: space[3], variant: "caption", icon: 16 },
  md: { height: 46, paddingHorizontal: space[5], variant: "bodyStrong", icon: 18 },
  lg: { height: 54, paddingHorizontal: space[6], variant: "h3", icon: 20 }
}

export const Button = ({
  title,
  variant = "gold",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  onPress,
  style,
  textStyle
}) => {
  const s = sizes[size]
  const isGold = variant === "gold"
  const textColor = isGold
    ? colors.text.inverse
    : variant === "danger"
      ? colors.down.fg
      : variant === "outline"
        ? colors.gold[500]
        : colors.text.primary

  const inner = (
    <View style={[styles.row, { height: s.height, paddingHorizontal: s.paddingHorizontal }]}>
      {loading ? (
        <ActivityIndicator color={textColor} size='small' />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={s.icon} color={textColor} style={{ marginRight: space[2] }} />}
          <Text variant={s.variant} color={textColor} style={textStyle}>
            {title}
          </Text>
          {iconRight && (
            <Ionicons name={iconRight} size={s.icon} color={textColor} style={{ marginLeft: space[2] }} />
          )}
        </>
      )}
    </View>
  )

  return (
    <PressableScale
      haptic='light'
      onPress={onPress}
      disabled={disabled || loading}
      style={[fullWidth && { alignSelf: "stretch" }, isGold && !disabled && elevation.gold, style]}
    >
      {isGold ? (
        <LinearGradient
          colors={colors.gradients.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shape}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.shape, styles[variant]]}>{inner}</View>
      )}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  shape: { borderRadius: radius.md, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  outline: { borderWidth: 1, borderColor: goldAlpha(0.5), backgroundColor: goldAlpha(0.06) },
  ghost: { backgroundColor: colors.surface[2] },
  danger: { backgroundColor: colors.down.bg, borderWidth: 1, borderColor: colors.down.border }
})

export default Button
