import React from "react"
import { Text as RNText, StyleSheet } from "react-native"
import { colors, type } from "../../theme"

// Цвет по токену ("secondary", "gold", "up") или любой raw-цвет
const resolveColor = (c) => {
  if (!c) return colors.text.primary
  if (colors.text[c]) return colors.text[c]
  if (c === "up" || c === "down" || c === "warning" || c === "info") return colors[c].fg
  return c
}

export const Text = ({ variant = "body", color, align, tabular, style, children, ...rest }) => (
  <RNText
    allowFontScaling={false}
    {...rest}
    style={[
      styles.base,
      type[variant] || type.body,
      { color: resolveColor(color) },
      align && { textAlign: align },
      tabular && styles.tabular,
      style
    ]}
  >
    {children}
  </RNText>
)

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  tabular: { fontVariant: ["tabular-nums"] }
})

export default Text
