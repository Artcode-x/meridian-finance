import * as Haptics from "expo-haptics"
import React, { useCallback } from "react"
import { Pressable } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const haptic = (kind) => {
  if (!kind) return
  if (kind === "selection") return Haptics.selectionAsync().catch(() => {})
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy
  }
  return Haptics.impactAsync(map[kind] || map.light).catch(() => {})
}

// База для всех тапабельных элементов: мягкое сжатие + опциональная вибрация
export const PressableScale = ({
  scaleTo = 0.97,
  haptic: hapticKind,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  style,
  children,
  ...rest
}) => {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }))

  const handleIn = useCallback(
    (e) => {
      scale.value = withSpring(scaleTo, { damping: 18, stiffness: 300 })
      opacity.value = withTiming(0.9, { duration: 80 })
      onPressIn?.(e)
    },
    [scaleTo, onPressIn]
  )
  const handleOut = useCallback(
    (e) => {
      scale.value = withSpring(1, { damping: 14, stiffness: 260 })
      opacity.value = withTiming(1, { duration: 120 })
      onPressOut?.(e)
    },
    [onPressOut]
  )
  const handlePress = useCallback(
    (e) => {
      haptic(hapticKind)
      onPress?.(e)
    },
    [hapticKind, onPress]
  )

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      style={[animatedStyle, disabled && { opacity: 0.45 }, style]}
    >
      {children}
    </AnimatedPressable>
  )
}

export default PressableScale
