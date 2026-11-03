import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"
import * as Haptics from "expo-haptics"
import React, { useMemo, useState, useEffect } from "react"
import { View, Alert as RNAlert, FlatList, StyleSheet } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import AlertCard from "../../components/AlertCard/AlertCard"
import {
  Screen,
  ScreenHeader,
  EmptyState,
  Chip,
  IconButton,
  Surface,
  Text,
  PressableScale
} from "../../components/ui"
import ServerSyncService from "../../services/ServerSyncService"
import { priceAlertsSelector } from "../../store/alertsSelectors"
import { deletePriceAlert, clearTriggeredAlerts } from "../../store/alertsSlice"
import { colors, space } from "../../theme"

const Alerts = () => {
  const dispatch = useDispatch()
  const priceAlerts = useSelector(priceAlertsSelector)
  const tabBarHeight = useBottomTabBarHeight()
  const navigation = useNavigation()

  const [serverAlertsEnabled, setServerAlertsEnabled] = useState(false)
  const [showFirstTimeTooltip, setShowFirstTimeTooltip] = useState(false)

  useEffect(() => {
    loadConsentStatus()
    checkFirstTimeVisit()
  }, [])

  const checkFirstTimeVisit = async () => {
    const tooltipShownCount = await AsyncStorage.getItem("@server_alerts_tooltip_shown_count")
    const count = tooltipShownCount ? parseInt(tooltipShownCount) : 0

    const lastShownDate = await AsyncStorage.getItem("@server_alerts_last_shown_date")
    const today = new Date().toDateString()

    if (count < 3 && lastShownDate !== today) {
      setTimeout(() => setShowFirstTimeTooltip(true), 800)
    }
  }

  const loadConsentStatus = async () => {
    const consent = await AsyncStorage.getItem("@background_alerts_consent")
    setServerAlertsEnabled(consent === "agreed")
  }

  const toggleServerAlerts = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const newStatus = !serverAlertsEnabled
    const consentValue = newStatus ? "agreed" : "denied"

    await AsyncStorage.setItem("@background_alerts_consent", consentValue)
    setServerAlertsEnabled(newStatus)

    if (showFirstTimeTooltip) {
      await hideTooltipAndSave()
    }

    await ServerSyncService.updateConsent(newStatus)

    if (newStatus) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
  }

  const hideTooltip = () => setShowFirstTimeTooltip(false)

  const hideTooltipAndSave = async () => {
    const currentCount = await AsyncStorage.getItem("@server_alerts_tooltip_shown_count")
    const newCount = currentCount ? parseInt(currentCount) + 1 : 1

    await AsyncStorage.setItem("@server_alerts_tooltip_shown_count", newCount.toString())
    await AsyncStorage.setItem("@server_alerts_last_shown_date", new Date().toDateString())

    hideTooltip()
  }

  const triggeredAlerts = useMemo(() => {
    return priceAlerts.filter((alert) => alert.triggeredAt)
  }, [priceAlerts])

  const activeAlerts = useMemo(() => {
    return priceAlerts.filter((alert) => alert.isActive && !alert.triggeredAt)
  }, [priceAlerts])

  const [activeFilter, setActiveFilter] = useState("active")

  const handleDeleteAlert = (alertId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    RNAlert.alert("Delete Alert", "Delete this price alert?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch(deletePriceAlert(alertId))
      }
    ])
  }

  const handleClearTriggered = () => {
    if (triggeredAlerts.length === 0) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    RNAlert.alert("Clear Triggered", `Clear ${triggeredAlerts.length} triggered alerts?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          dispatch(clearTriggeredAlerts())
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
      }
    ])
  }

  const stats = {
    total: priceAlerts.length,
    active: activeAlerts.length,
    triggered: triggeredAlerts.length
  }

  const listData =
    activeFilter === "active" ? activeAlerts : activeFilter === "triggered" ? triggeredAlerts : priceAlerts

  return (
    <Screen>
      <ScreenHeader
        large
        eyebrow='Notifications'
        title='Alerts'
        subtitle={
          priceAlerts.length
            ? `${stats.active} active · ${stats.triggered} triggered`
            : "Get notified when a price crosses your target"
        }
        right={
          <>
            {triggeredAlerts.length > 0 && (
              <IconButton name='trash-outline' tone='down' onPress={handleClearTriggered} haptic='medium' />
            )}
            <IconButton
              name={serverAlertsEnabled ? "cloud-done" : "cloud-offline-outline"}
              active={serverAlertsEnabled}
              onPress={toggleServerAlerts}
            />
          </>
        }
      />

      {showFirstTimeTooltip && (
        <View style={styles.tipWrap}>
          <Surface variant='goldCase' radius='md'>
            <View style={styles.tip}>
              <Ionicons name='cloud-outline' size={18} color={colors.gold[400]} />
              <View style={{ flex: 1, marginHorizontal: space[3] }}>
                <Text variant='bodyStrong'>Background alerts</Text>
                <Text variant='caption' color='secondary'>
                  Tap the cloud icon to turn 24/7 server-side notifications on or off.
                </Text>
              </View>
              <IconButton name='close' size={28} iconSize={14} onPress={hideTooltipAndSave} haptic={null} />
            </View>
          </Surface>
        </View>
      )}

      {priceAlerts.length === 0 ? (
        <EmptyState
          icon='notifications-off-outline'
          eyebrow='Price alerts'
          title='No alerts yet'
          body='Open a coin in your portfolio and tap the bell to be notified when it crosses a price.'
          action={{ label: "Go to portfolio", icon: "star", onPress: () => navigation.navigate("Favorite") }}
        />
      ) : (
        <>
          <View style={styles.filters}>
            <Chip
              label='Active'
              icon='flash'
              count={stats.active}
              selected={activeFilter === "active"}
              onPress={() => setActiveFilter("active")}
            />
            <Chip
              label='Triggered'
              icon='checkmark-done'
              count={stats.triggered}
              selected={activeFilter === "triggered"}
              onPress={() => setActiveFilter("triggered")}
            />
            <Chip
              label='All'
              count={stats.total}
              selected={activeFilter === "all"}
              onPress={() => setActiveFilter("all")}
            />
          </View>
          <FlatList
            data={listData}
            renderItem={({ item }) => <AlertCard alert={item} onDelete={() => handleDeleteAlert(item.id)} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: space[4],
              paddingTop: space[2],
              paddingBottom: tabBarHeight + space[4]
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                compact
                icon='funnel-outline'
                title='Nothing in this filter'
                body='Switch the filter above to see other alerts.'
              />
            }
          />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tipWrap: { paddingHorizontal: space[4], marginBottom: space[3] },
  tip: { flexDirection: "row", alignItems: "center", padding: space[3] },
  filters: { flexDirection: "row", gap: space[2], paddingHorizontal: space[4], marginBottom: space[3] }
})

export default Alerts
