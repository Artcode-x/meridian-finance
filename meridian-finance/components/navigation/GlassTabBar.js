import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect } from "react"
import { View, StyleSheet, Platform } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, goldAlpha } from "../../theme"
import { PressableScale, Text } from "../ui"

export const TAB_BAR_BASE_HEIGHT = 58

const ICONS = {
  Home: ["pulse-outline", "pulse"],
  Favorite: ["star-outline", "star"],
  Alerts: ["notifications-outline", "notifications"],
  Analytics: ["pie-chart-outline", "pie-chart"],
  More: ["ellipsis-horizontal-circle-outline", "ellipsis-horizontal-circle"]
}

// Стеклянный таб-бар: blur на iOS, плотная подложка на Android, скользящий золотой индикатор
export const GlassTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()
  const [width, setWidth] = React.useState(0)
  const count = state.routes.length
  const tabWidth = width / count || 0
  const x = useSharedValue(0)

  useEffect(() => {
    x.value = withSpring(state.index * tabWidth, { damping: 20, stiffness: 220 })
  }, [state.index, tabWidth])

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const height = TAB_BAR_BASE_HEIGHT + insets.bottom

  const Container = Platform.OS === "ios" ? BlurView : View
  const containerProps = Platform.OS === "ios" ? { intensity: 50, tint: "dark" } : {}

  return (
    <View style={[styles.wrap, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Container {...containerProps} style={[StyleSheet.absoluteFill, styles.bg]} />
      <LinearGradient
        colors={colors.gradients.goldHairline}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.hairline}
      />
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents='none'
          style={[styles.indicator, { width: tabWidth - 20, marginLeft: 10 }, indicator]}
        >
          <LinearGradient colors={[goldAlpha(0.18), goldAlpha(0.04)]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          const label = options.title ?? route.name
          const [outline, filled] = ICONS[route.name] || ["ellipse-outline", "ellipse"]
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
          }
          return (
            <PressableScale
              key={route.key}
              haptic='selection'
              scaleTo={0.92}
              onPress={onPress}
              accessibilityRole='button'
              accessibilityState={focused ? { selected: true } : {}}
              style={styles.item}
            >
              <Ionicons
                name={focused ? filled : outline}
                size={22}
                color={focused ? colors.gold[400] : colors.text.tertiary}
              />
              <Text
                variant='small'
                color={focused ? colors.gold[400] : "tertiary"}
                style={styles.label}
                numberOfLines={1}
              >
                {label}
              </Text>
            </PressableScale>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" },
  bg: { backgroundColor: Platform.OS === "ios" ? "rgba(10,10,15,0.72)" : colors.bg[2] },
  hairline: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  indicator: {
    position: "absolute",
    top: 6,
    height: TAB_BAR_BASE_HEIGHT - 12,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3)
  },
  row: { flexDirection: "row", height: TAB_BAR_BASE_HEIGHT },
  item: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 4 },
  label: { marginTop: 3, fontSize: 10, letterSpacing: 0.3 }
})

export default GlassTabBar
