import { Ionicons } from "@expo/vector-icons"
import React, { memo } from "react"
import { View, StyleSheet } from "react-native"
import { colors, space, goldAlpha } from "../../theme"
import { Surface, Text, IconButton, Badge, PressableScale, formatPrice } from "../ui"

const timeAgo = (iso) => {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Строка алерта: направление, цель, прогресс к цели
const AlertCard = ({ alert, onDelete }) => {
  const isTriggered = !!alert.triggeredAt
  const isAbove = alert.condition === "above"
  const currentPrice = alert.currentPrice || 0
  const targetPrice = alert.targetPrice || 1
  const createdPrice = alert.createdPrice || currentPrice

  const progress = (() => {
    if (isTriggered) return 1
    if (isAbove) {
      if (currentPrice >= targetPrice) return 1
      if (createdPrice >= targetPrice) return 0
      return Math.min(Math.max((currentPrice - createdPrice) / (targetPrice - createdPrice), 0), 1)
    }
    if (currentPrice <= targetPrice) return 1
    if (createdPrice <= targetPrice) return 0
    return Math.min(Math.max((createdPrice - currentPrice) / (createdPrice - targetPrice), 0), 1)
  })()

  const tone = isTriggered ? "gold" : isAbove ? "up" : "down"
  const accent = tone === "gold" ? colors.gold[500] : colors[tone].fg
  const pctToTarget = ((Math.abs(currentPrice - targetPrice) / targetPrice) * 100).toFixed(1)

  return (
    <PressableScale scaleTo={0.985} haptic='selection' onPress={onDelete} style={{ marginBottom: space[2] }}>
      <Surface level={1} radius='md'>
        <View style={styles.row}>
          <View style={[styles.accent, { backgroundColor: accent }]} />
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: tone === "gold" ? goldAlpha(0.14) : colors[tone].bg }
            ]}
          >
            <Ionicons
              name={isTriggered ? "checkmark-done" : isAbove ? "arrow-up" : "arrow-down"}
              size={16}
              color={accent}
            />
          </View>

          <View style={{ flex: 1, marginLeft: space[3] }}>
            <View style={styles.titleRow}>
              <Text variant='bodyStrong' numberOfLines={1} style={{ flexShrink: 1 }}>
                {alert.coinSymbol?.toUpperCase() || "???"}{" "}
                <Text variant='body' color='secondary'>
                  {isAbove ? "above" : "below"}
                </Text>{" "}
                <Text variant='bodyStrong' color={accent} tabular>
                  {formatPrice(targetPrice)}
                </Text>
              </Text>
            </View>
            <View style={styles.meta}>
              <Text variant='small' color='tertiary' tabular>
                {isTriggered
                  ? `Hit ${timeAgo(alert.triggeredAt) || ""}`
                  : `Now ${formatPrice(currentPrice)} · ${pctToTarget}% away`}
              </Text>
              {!isTriggered && alert.createdAt && (
                <Text variant='small' color='tertiary'>
                  {" · "}
                  {timeAgo(alert.createdAt)}
                </Text>
              )}
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accent }]}
              />
            </View>
          </View>

          <View style={styles.right}>
            {isTriggered ? (
              <Badge tone='gold' label='Triggered' />
            ) : (
              <Badge tone={tone} label={`${Math.round(progress * 100)}%`} />
            )}
            <IconButton
              name='trash-outline'
              size={28}
              iconSize={13}
              tone='neutral'
              onPress={onDelete}
              haptic='medium'
              style={{ marginTop: space[2] }}
            />
          </View>
        </View>
      </Surface>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[3],
    paddingLeft: space[4],
    paddingRight: space[3]
  },
  accent: { position: "absolute", left: 0, top: 12, bottom: 12, width: 3, borderRadius: 0 },
  iconWrap: { width: 36, height: 36, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  track: {
    height: 3,
    borderRadius: 0,
    backgroundColor: colors.surface[3],
    marginTop: space[2],
    overflow: "hidden"
  },
  fill: { height: 3, borderRadius: 0 },
  right: { alignItems: "flex-end", marginLeft: space[3] }
})

export default memo(AlertCard)
