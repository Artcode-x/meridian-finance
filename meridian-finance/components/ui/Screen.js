import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet, ScrollView, StatusBar } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "../../theme"

// Обёртка экрана: фон, верхний safe-area, опциональный скролл
export const Screen = ({
  scroll,
  children,
  style,
  contentStyle,
  edges = ["top"],
  refreshControl,
  keyboardShouldPersistTaps
}) => {
  const insets = useSafeAreaInsets()
  const paddingTop = edges.includes("top") ? insets.top : 0
  return (
    <View style={[styles.root, style]}>
      <StatusBar barStyle='light-content' backgroundColor={colors.bg[1]} translucent />
      <LinearGradient colors={colors.gradients.screen} style={StyleSheet.absoluteFill} pointerEvents='none' />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingTop }, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop }, contentStyle]}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg[1] } })

export default Screen
