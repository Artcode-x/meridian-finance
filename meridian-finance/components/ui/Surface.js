import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet, Platform } from "react-native"
import { colors, radius as radii, space, elevation } from "../../theme"

/**
 * Базовая поверхность.
 * variant: "flat" (полупрозрачная заливка), "glass" (blur на iOS), "goldCase" (эталон Favorite: градиент + золотая кромка), "solid"
 */
export const Surface = ({
  variant = "flat",
  level = 1,
  radius = "lg",
  padding,
  bordered = true,
  shadow,
  style,
  children,
  ...rest
}) => {
  const r = typeof radius === "number" ? radius : (radii[radius] ?? radii.lg)
  const pad = typeof padding === "number" ? padding : padding ? space[padding] : undefined
  const shadowStyle = shadow ? elevation[shadow] : null
  const base = [{ borderRadius: r, overflow: "hidden" }, pad !== undefined && { padding: pad }]

  if (variant === "goldCase") {
    return (
      <View style={[shadowStyle, { borderRadius: r }, style]} {...rest}>
        <LinearGradient
          colors={colors.gradients.goldCase}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[base, styles.goldBorder]}
        >
          <LinearGradient
            colors={colors.gradients.goldWash}
            style={StyleSheet.absoluteFill}
            pointerEvents='none'
          />
          {children}
        </LinearGradient>
      </View>
    )
  }

  if (variant === "glass" && Platform.OS === "ios") {
    return (
      <View style={[shadowStyle, { borderRadius: r }, style]} {...rest}>
        <BlurView
          intensity={40}
          tint='dark'
          style={[base, bordered && styles.border, { backgroundColor: "rgba(15,16,22,0.55)" }]}
        >
          {children}
        </BlurView>
      </View>
    )
  }

  const bg =
    variant === "solid" || variant === "glass"
      ? colors.bg[Math.min(level + 1, 4)]
      : colors.surface[level] || colors.surface[1]

  return (
    <View style={[shadowStyle, { borderRadius: r }, style]} {...rest}>
      <View style={[base, { backgroundColor: bg }, bordered && styles.border]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  border: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line.default },
  goldBorder: { borderWidth: 1, borderColor: colors.line.gold }
})

export default Surface
