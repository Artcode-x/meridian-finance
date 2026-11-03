import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect } from "react"
import { View, StyleSheet } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from "react-native-reanimated"
import { colors, goldAlpha, radius as radii } from "../../theme"

// Мерцающий плейсхолдер с золотым бликом
export const Skeleton = ({ width = "100%", height = 16, radius = "sm", style }) => {
  const x = useSharedValue(-1)
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false)
  }, [])
  const shimmer = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 300 }] }))
  const r = typeof radius === "number" ? radius : radii[radius]
  return (
    <View style={[styles.base, { width, height, borderRadius: r }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, shimmer]}>
        <LinearGradient
          colors={["transparent", goldAlpha(0.14), "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 300, height: "100%" }}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({ base: { backgroundColor: colors.surface[2], overflow: "hidden" } })

export default Skeleton
