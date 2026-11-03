import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { StyleSheet } from "react-native"
import { PressableScale } from "./PressableScale"
import { colors, goldAlpha, toneColors } from "../../theme"

// Круглая иконочная кнопка. tone: neutral | gold | up | down | warning | info
export const IconButton = ({
  name,
  size = 40,
  iconSize,
  tone = "neutral",
  active,
  onPress,
  haptic = "light",
  style,
  library: Icon = Ionicons,
  disabled
}) => {
  const t = active ? toneColors.gold : toneColors[tone] || toneColors.neutral
  return (
    <PressableScale
      haptic={haptic}
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.9}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: 0,
          backgroundColor: active ? goldAlpha(0.16) : t.bg,
          borderColor: active ? goldAlpha(0.5) : t.border
        },
        style
      ]}
    >
      <Icon name={name} size={iconSize || Math.round(size * 0.5)} color={t.fg} />
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default
  }
})

export default IconButton
