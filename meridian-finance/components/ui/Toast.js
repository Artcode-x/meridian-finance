import { Ionicons } from "@expo/vector-icons"
import React, { useEffect } from "react"
import { StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "./Text"
import { colors, space, radius, goldAlpha, elevation } from "../../theme"

// Короткое уведомление снизу экрана. message === null → скрыт.
export const Toast = ({ message, icon = "checkmark-circle", tone = "gold", bottomOffset = 0 }) => {
  const insets = useSafeAreaInsets()
  const p = useSharedValue(0)
  useEffect(() => {
    p.value = message ? withSpring(1, { damping: 18, stiffness: 240 }) : withTiming(0, { duration: 180 })
  }, [message])
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 30 }]
  }))
  const fg = tone === "gold" ? colors.gold[400] : colors[tone]?.fg || colors.text.primary
  return (
    <Animated.View
      pointerEvents='none'
      style={[styles.toast, { bottom: insets.bottom + bottomOffset + space[4] }, elevation.card, style]}
    >
      <Ionicons name={icon} size={18} color={fg} />
      <Text variant='caption' style={{ marginLeft: space[2] }}>
        {message}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.bg[3],
    borderWidth: 1,
    borderColor: goldAlpha(0.35)
  }
})

export default Toast
