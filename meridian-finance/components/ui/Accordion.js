import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import { PressableScale } from "./PressableScale"
import { Surface } from "./Surface"
import { Text } from "./Text"
import { colors, space, goldAlpha } from "../../theme"

// Раскрывающаяся секция; контент вне тапабельной области заголовка
export const Accordion = ({ title, subtitle, icon, defaultOpen = false, right, children, style }) => {
  const [open, setOpen] = useState(defaultOpen)
  const [contentHeight, setContentHeight] = useState(0)
  const progress = useSharedValue(defaultOpen ? 1 : 0)

  const toggle = () => {
    const next = !open
    setOpen(next)
    progress.value = withTiming(next ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) })
  }

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight ? progress.value * contentHeight : open ? undefined : 0,
    opacity: progress.value
  }))
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }))

  return (
    <Surface level={1} style={style}>
      <PressableScale scaleTo={0.99} haptic='selection' onPress={toggle} style={styles.header}>
        {icon && (
          <View style={styles.icon}>
            <Ionicons name={icon} size={16} color={colors.gold[500]} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text variant='h3'>{title}</Text>
          {subtitle && (
            <Text variant='caption' color='tertiary'>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
        <Animated.View style={chevron}>
          <Ionicons name='chevron-down' size={18} color={colors.text.tertiary} />
        </Animated.View>
      </PressableScale>
      <Animated.View style={[styles.body, bodyStyle]}>
        <View style={styles.measure} onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
          {children}
        </View>
      </Animated.View>
    </Surface>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: space[4], gap: space[3] },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3)
  },
  body: { overflow: "hidden" },
  measure: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: space[4],
    paddingBottom: space[4]
  }
})

export default Accordion
