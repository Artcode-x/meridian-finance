import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "./Button"
import { Divider } from "./Divider"
import { Text } from "./Text"
import { colors, goldAlpha, space } from "../../theme"

export const EmptyState = ({
  icon = "sparkles-outline",
  eyebrow,
  title,
  body,
  action,
  secondaryAction,
  compact,
  style
}) => (
  <View style={[styles.wrap, compact && { paddingVertical: space[6] }, style]}>
    <View style={styles.emblemOuter}>
      <LinearGradient
        colors={[goldAlpha(0.28), goldAlpha(0.04)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emblem}
      >
        <View style={styles.emblemInner}>
          <Ionicons name={icon} size={compact ? 26 : 34} color={colors.gold[400]} />
        </View>
      </LinearGradient>
    </View>
    {eyebrow && (
      <Text variant='label' color='gold' align='center' style={{ marginTop: space[5] }}>
        {eyebrow}
      </Text>
    )}
    <Text variant={compact ? "h3" : "h2"} align='center' style={{ marginTop: eyebrow ? space[2] : space[5] }}>
      {title}
    </Text>
    <Divider gold style={{ width: 64, marginVertical: space[4] }} />
    {body && (
      <Text variant='body' color='secondary' align='center' style={{ maxWidth: 300 }}>
        {body}
      </Text>
    )}
    {action && (
      <Button
        title={action.label}
        icon={action.icon}
        onPress={action.onPress}
        style={{ marginTop: space[6] }}
      />
    )}
    {secondaryAction && (
      <Button
        variant='ghost'
        title={secondaryAction.label}
        icon={secondaryAction.icon}
        onPress={secondaryAction.onPress}
        style={{ marginTop: space[3] }}
      />
    )}
  </View>
)

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8]
  },
  emblemOuter: { borderRadius: 0, borderWidth: 1, borderColor: goldAlpha(0.3), padding: 4 },
  emblem: { width: 88, height: 88, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  emblemInner: {
    width: 72,
    height: 72,
    borderRadius: 0,
    backgroundColor: colors.bg[2],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35)
  }
})

export default EmptyState
