import React, { useEffect, useState } from "react"
import { Modal, View, StyleSheet, Pressable, Dimensions, KeyboardAvoidingView, Platform } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { IconButton } from "./IconButton"
import { Text } from "./Text"
import { colors, space, elevation, goldAlpha } from "../../theme"

const { height: H } = Dimensions.get("window")

/**
 * Нижний лист. snapHeight: "half" | "full" | number (0..1).
 * title — заголовок с кнопкой закрытия; scrollable контент передавать внутри.
 */
export const Sheet = ({
  visible,
  onClose,
  snapHeight = "half",
  title,
  subtitle,
  headerRight,
  children,
  keyboardAvoiding,
  contentStyle
}) => {
  const insets = useSafeAreaInsets()
  const [mounted, setMounted] = useState(visible)
  const progress = useSharedValue(0)

  const ratio = snapHeight === "full" ? 0.94 : snapHeight === "half" ? 0.56 : snapHeight
  const sheetHeight = Math.round(H * ratio)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      progress.value = withSpring(1, { damping: 22, stiffness: 220, mass: 0.9 })
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false)
      })
    }
  }, [visible])

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }))
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * sheetHeight }] }))

  if (!mounted) return null

  const Wrapper = keyboardAvoiding ? KeyboardAvoidingView : View
  const wrapperProps = keyboardAvoiding
    ? { behavior: Platform.OS === "ios" ? "padding" : undefined, style: styles.fill }
    : { style: styles.fill }

  return (
    <Modal visible transparent statusBarTranslucent animationType='none' onRequestClose={onClose}>
      <Wrapper {...wrapperProps}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={styles.fill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom }, elevation.sheet, body]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {(title || headerRight) && (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {title && <Text variant='h2'>{title}</Text>}
                {subtitle && (
                  <Text variant='caption' color='tertiary'>
                    {subtitle}
                  </Text>
                )}
              </View>
              {headerRight}
              <IconButton name='close' size={36} onPress={onClose} style={{ marginLeft: space[2] }} />
            </View>
          )}
          <View style={[styles.fill, contentStyle]}>{children}</View>
        </Animated.View>
      </Wrapper>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: colors.overlay },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg[2],
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: goldAlpha(0.25)
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 0, backgroundColor: goldAlpha(0.45) },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space[4],
    paddingVertical: space[3]
  }
})

export default Sheet
