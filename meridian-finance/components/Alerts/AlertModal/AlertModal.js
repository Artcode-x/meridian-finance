import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { View, TextInput, Keyboard, ScrollView, StyleSheet, Image } from "react-native"
import { colors, space, goldAlpha, font } from "../../../theme"
import { Sheet, Text, Button, Chip, Badge, PressableScale, PriceText, formatPrice } from "../../ui"

const PRESETS = [1, 5, 10, 25]

// Создание ценового алерта
const AlertModal = ({
  visible,
  onClose,
  onSave,
  coin,
  currentPrice,
  notificationPermission,
  fcmToken = null
}) => {
  const [targetPrice, setTargetPrice] = useState("")
  const [condition, setCondition] = useState("above")
  const [error, setError] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (visible) {
      setTargetPrice("")
      setCondition("above")
      setError("")
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [visible, currentPrice])

  const decimals = currentPrice < 1 ? 6 : 2
  const suggestions = useMemo(
    () =>
      PRESETS.map((p) => {
        const sign = condition === "above" ? 1 : -1
        return {
          label: `${sign > 0 ? "+" : "−"}${p}%`,
          price: parseFloat((currentPrice * (1 + (sign * p) / 100)).toFixed(decimals))
        }
      }),
    [condition, currentPrice, decimals]
  )

  const parsed = parseFloat(targetPrice)
  const diffPct = parsed > 0 && currentPrice ? ((parsed - currentPrice) / currentPrice) * 100 : null

  const notif = !notificationPermission
    ? { icon: "notifications-off-outline", tone: "down", text: "Notifications off" }
    : fcmToken
      ? { icon: "cloud-done-outline", tone: "up", text: "Push 24/7" }
      : { icon: "notifications-outline", tone: "warning", text: "Local only" }

  const handleSave = () => {
    if (!targetPrice.trim()) {
      setError("Enter a target price")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    if (!parsed || parsed <= 0) {
      setError("Price must be greater than 0")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSave({
      coinId: coin.id,
      coinName: coin.name,
      coinSymbol: coin.symbol,
      targetPrice: parsed,
      currentPrice,
      condition,
      fcmToken,
      syncStatus: fcmToken && notificationPermission ? "pending" : "local_only",
      priceDifference: (((parsed - currentPrice) / currentPrice) * 100).toFixed(2)
    })
    Keyboard.dismiss()
    onClose()
  }

  const handleClose = () => {
    Keyboard.dismiss()
    onClose()
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      snapHeight={0.82}
      keyboardAvoiding
      title='New price alert'
      headerRight={<Badge tone={notif.tone} icon={notif.icon} label={notif.text} />}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <View style={styles.coinRow}>
          <View style={styles.logoWrap}>
            {coin?.image ? (
              <Image source={{ uri: coin.image }} style={styles.logo} />
            ) : (
              <Ionicons name='logo-bitcoin' size={18} color={colors.gold[400]} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: space[3] }}>
            <Text variant='bodyStrong'>{coin?.name}</Text>
            <Text variant='caption' color='tertiary'>
              {coin?.symbol?.toUpperCase()} · now{" "}
              <PriceText value={currentPrice} variant='caption' color='gold' />
            </Text>
          </View>
        </View>

        <Text variant='label' color='tertiary' style={styles.label}>
          Notify me when price is
        </Text>
        <View style={styles.conditions}>
          <Chip
            label='Above'
            icon='trending-up'
            selected={condition === "above"}
            onPress={() => setCondition("above")}
            style={{ flex: 1, justifyContent: "center" }}
          />
          <Chip
            label='Below'
            icon='trending-down'
            selected={condition === "below"}
            onPress={() => setCondition("below")}
            style={{ flex: 1, justifyContent: "center" }}
          />
        </View>

        <Text variant='label' color='tertiary' style={styles.label}>
          Target price (USD)
        </Text>
        <View style={[styles.inputWrap, error && { borderColor: colors.down.border }]}>
          <Text variant='h2' color='gold'>
            $
          </Text>
          <TextInput
            ref={inputRef}
            value={targetPrice}
            onChangeText={(t) => {
              setTargetPrice(t.replace(",", "."))
              setError("")
            }}
            placeholder={formatPrice(currentPrice).replace("$", "")}
            placeholderTextColor={colors.text.disabled}
            keyboardType='decimal-pad'
            selectionColor={colors.gold[500]}
            style={styles.input}
          />
          {!!targetPrice && (
            <PressableScale onPress={() => setTargetPrice("")} hitSlop={8}>
              <Ionicons name='close-circle' size={18} color={colors.text.tertiary} />
            </PressableScale>
          )}
        </View>
        {error ? (
          <Text variant='caption' color='down' style={{ marginTop: space[2] }}>
            {error}
          </Text>
        ) : diffPct !== null ? (
          <Text
            variant='caption'
            color={diffPct >= 0 ? "up" : "down"}
            style={{ marginTop: space[2] }}
            tabular
          >
            {diffPct >= 0 ? "+" : ""}
            {diffPct.toFixed(2)}% from current price
          </Text>
        ) : null}

        <View style={styles.presets}>
          {suggestions.map((s) => (
            <PressableScale
              key={s.label}
              haptic='selection'
              onPress={() => {
                setTargetPrice(String(s.price))
                setError("")
              }}
              style={styles.preset}
            >
              <Text variant='caption' color='gold'>
                {s.label}
              </Text>
              <Text variant='small' color='secondary' tabular numberOfLines={1}>
                {formatPrice(s.price)}
              </Text>
            </PressableScale>
          ))}
        </View>

        <View style={styles.actions}>
          <Button variant='ghost' title='Cancel' onPress={handleClose} style={{ flex: 1 }} />
          <Button
            title='Set alert'
            icon='notifications'
            onPress={handleSave}
            disabled={!targetPrice}
            style={{ flex: 1.4 }}
          />
        </View>
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space[4], paddingBottom: space[6] },
  coinRow: { flexDirection: "row", alignItems: "center", marginBottom: space[4] },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: colors.bg[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35)
  },
  logo: { width: 28, height: 28, borderRadius: 14 },
  label: { marginTop: space[3], marginBottom: space[2] },
  conditions: { flexDirection: "row", gap: space[2] },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    paddingHorizontal: space[4],
    borderRadius: 0,
    backgroundColor: colors.surface[2],
    borderWidth: 1,
    borderColor: goldAlpha(0.4)
  },
  input: {
    flex: 1,
    marginLeft: space[2],
    color: colors.text.primary,
    fontSize: 24,
    fontFamily: font.bold,
    fontVariant: ["tabular-nums"],
    paddingVertical: 0,
    minWidth: 0,
    outlineStyle: "none"
  },
  presets: { flexDirection: "row", gap: space[2], marginTop: space[4] },
  preset: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space[2],
    borderRadius: 0,
    backgroundColor: colors.surface[1],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default
  },
  actions: { flexDirection: "row", gap: space[3], marginTop: space[6] }
})

export default AlertModal
