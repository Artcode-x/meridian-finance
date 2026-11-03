import AsyncStorage from "@react-native-async-storage/async-storage"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"
import * as Haptics from "expo-haptics"
import * as Notifications from "expo-notifications"
import React, { useState, useCallback, useRef, useEffect } from "react"
import { View, FlatList, Alert, AppState, StyleSheet, RefreshControl, Platform } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import FavoriteStatsPanel from "./FavoriteStatsPanel/FavoriteStatsPanel"
import ModalFavorite from "./ModalChart/ModalFavorite"
import PremiumCoinCard from "./PremiumCoinCard/PremiumCoinCard"
import AlertModal from "../../components/Alerts/AlertModal/AlertModal"
import { Screen, ScreenHeader, EmptyState, IconButton, PriceText, PercentBadge } from "../../components/ui"
import { useAlertChecker } from "../../hooks/useAlertChecker"
import { useFavoriteUpdate } from "../../hooks/useFavoriteUpdate"
import AlertManager from "../../services/AlertManager"
import NotificationService from "../../services/NotificationService"
import ServerSyncService from "../../services/ServerSyncService"
import { priceAlertsSelector, unreadAlertsCountSelector } from "../../store/alertsSelectors"
import { addPriceAlert, deletePriceAlert, markAlertAsRead } from "../../store/alertsSlice"
import { removeCoin, updateUserAsset } from "../../store/reducersSlice"
import { coinSelector, daysSelector, userAssetsSelector } from "../../store/toolkitSelectors"
import { colors, space, responsive } from "../../theme"
import AmountInputModal from "./FavoriteComponents/AmountInputModal/AmountInputModal"

const Favorite = () => {
  const dispatch = useDispatch()
  const coinData = useSelector(coinSelector)
  const chartDays = useSelector(daysSelector)
  const userAssets = useSelector(userAssetsSelector) || {}
  const priceAlerts = useSelector(priceAlertsSelector)
  const unreadAlertsCount = useSelector(unreadAlertsCountSelector)
  const tabBarHeight = useBottomTabBarHeight()
  const navigation = useNavigation()

  const [removingCoinId, setRemovingCoinId] = useState(null)
  const [isModalVisible, setModalVisible] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [inputModalVisible, setInputModalVisible] = useState(false)
  const [selectedCoinForInput, setSelectedCoinForInput] = useState(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Состояния для алертов и серверной синхронизации
  const [alertModalVisible, setAlertModalVisible] = useState(false)
  const [selectedCoinForAlert, setSelectedCoinForAlert] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(false)
  const [fcmToken, setFcmToken] = useState(null)
  const [appState, setAppState] = useState(AppState.currentState)
  const [serverStatus, setServerStatus] = useState(null)

  const numColumns = responsive.columns

  const amountInputRef = useRef("")

  // Хук обновления
  const { updateFavoritePrices } = useFavoriteUpdate(1)

  // Хук для периодической проверки алертов
  useAlertChecker(coinData, 60000)

  // Мониторинг состояния приложения
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      setAppState(nextAppState)

      // Обновляем состояние на сервере
      if (fcmToken) {
        ServerSyncService.updateAppStateOnServer(nextAppState)
      }

      if (nextAppState === "active") {
        // Приложение вернулось на передний план

        // Проверяем серверную доступность
        checkServerAvailability()

        // Проверяем алерты
        if (coinData.length > 0 && priceAlerts.length > 0) {
          AlertManager.checkAlerts(
            priceAlerts.filter((a) => a.isActive && !a.triggeredAt),
            coinData
          )
        }

        // Обновляем цены
        handleManualUpdate()
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // Приложение сворачивается - синхронизируем с сервером с проверкой согласия

        try {
          const consent = await AsyncStorage.getItem("@background_alerts_consent")
          if (consent === "agreed" && fcmToken && priceAlerts.length > 0) {
            console.log("Согласие получено")
            await ServerSyncService.syncAlertsWithServer(priceAlerts)
          } else if (consent !== "agreed") {
            console.log("Нет согласия на фоновые уведомления")
          }
        } catch (error) {
          console.warn("Ошибка при проверке согласия", error)
        }
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [appState, fcmToken, coinData, priceAlerts])

  const checkServerAvailability = useCallback(async () => {
    try {
      const status = await ServerSyncService.getStatus()
      setServerStatus(status)

      if (!status.serverAvailable) {
        await ServerSyncService.checkServerAvailability()
        const updatedStatus = await ServerSyncService.getStatus()
        setServerStatus(updatedStatus)
      }
    } catch (error) {
      console.warn("Ошибка проверки сервера:", error)
    }
  }, [])

  // Инициализация уведомлений и FCM
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // 1. Проверяем текущие разрешения
        const { granted, status } = await Notifications.getPermissionsAsync()

        setNotificationPermission(granted)

        if (granted) {
          // 2. Инициализируем AlertManager
          AlertManager.initialize(dispatch)

          // 3. Регистрируем обработчики уведомлений
          const subscriptions = NotificationService.registerNotificationHandlers(
            async (notification) => {
              try {
                if (!notification?.request?.content?.data) return
                const data = notification.request.content.data
                if (data?.type === "price-alert" && data?.alertId) {
                  dispatch(markAlertAsRead(data.alertId))
                }
              } catch (error) {
                console.warn("Ошибка обработки уведомления:", error)
              }
            },
            (response) => {
              try {
                if (!response?.notification?.request?.content?.data) return
                const data = response.notification.request.content.data
                if (data?.type === "price-alert" && data?.alertId) {
                  dispatch(markAlertAsRead(data.alertId))
                }
              } catch (error) {
                console.warn("Ошибка обработки ответа:", error)
              }
            }
          )

          // 4. Регистрируемся для FCM с новым методом
          if (Platform.OS !== "web") {
            try {
              // Используем новый метод getFCMToken
              const token = await NotificationService.getFCMToken()
              if (token) {
                setFcmToken(token)

                // Определяем тип токена
                const isExpoToken = token.startsWith("ExponentPushToken[")

                // Логируем предупреждение если это Expo токен
                if (isExpoToken) {
                  console.log("ВНИМАНИЕ: Получен Expo токен.")
                }

                // Инициализируем синхронизацию с сервером
                ServerSyncService.initialize(token)

                // Проверяем доступность сервера
                checkServerAvailability()
              }
            } catch (fcmError) {
              console.warn("Ошибка получения токена:", fcmError)
            }
          }

          return () => {
            if (subscriptions) {
              NotificationService.removeNotificationHandlers(subscriptions)
            }
          }
        }
      } catch (error) {
        console.error("Ошибка инициализации уведомлений:", error)
        setNotificationPermission(false)
      }
    }

    initializeNotifications()
  }, [dispatch])

  // Обновление бейджей при изменении алертов
  useEffect(() => {
    const updateBadges = async () => {
      if (notificationPermission) {
        try {
          await NotificationService.setBadgeCount(unreadAlertsCount)
        } catch (error) {
          console.warn("Не удалось обновить бейджи:", error)
        }
      }
    }

    updateBadges()
  }, [unreadAlertsCount, notificationPermission])

  // Обработчик ручного обновления
  const handleManualUpdate = useCallback(async () => {
    if (isUpdating) {
      // Обновление уже выполняется
      return
    }

    // Ручное обновление избранного
    setIsUpdating(true)
    setLastUpdateTime(new Date().toLocaleTimeString())

    try {
      await updateFavoritePrices()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.error("Ошибка обновления:", error)
    } finally {
      setIsUpdating(false)
    }
  }, [updateFavoritePrices, isUpdating])

  // Подсчет стоимости портфеля
  const totalPortfolioValue = coinData.reduce((total, coin) => {
    const amount = (userAssets && userAssets[coin.id]) || 0
    return total + amount * (coin.current_price || 0)
  }, 0)

  // Статистика
  const stats = {
    total: coinData.length,
    bullish: coinData.filter((c) => c.price_change_percentage_24h >= 0).length,
    bearish: coinData.filter((c) => c.price_change_percentage_24h < 0).length,
    top10: coinData.filter((c) => c.market_cap_rank <= 10).length,
    activeAlerts: priceAlerts.filter((a) => a.isActive && !a.triggeredAt).length,
    triggeredAlerts: priceAlerts.filter((a) => a.triggeredAt).length,
    serverSynced: priceAlerts.filter((a) => a.serverId || a.syncStatus === "synced").length
  }

  // Функция открытия модалки алерта
  const openAlertModal = useCallback(
    async (coin) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const openModal = () => {
        setSelectedCoinForAlert(coin)
        setAlertModalVisible(true)
      }

      try {
        const { granted, status, canAskAgain } = await Notifications.getPermissionsAsync()

        // На web Alert.alert недоступен — открываем модалку напрямую (локальный режим)
        if (granted || Platform.OS === "web") {
          if (!notificationPermission) {
            setNotificationPermission(true)
          }

          if (!fcmToken && Platform.OS !== "web") {
            try {
              const token = await NotificationService.getFCMToken()
              if (token) {
                setFcmToken(token)

                // Инициализация серверной синхронизации
                ServerSyncService.initialize(token)
              }
            } catch (tokenError) {
              console.warn("Не удалось получить FCM токен:", tokenError)
            }
          }

          openModal()
          return
        }

        Alert.alert(
          "🔔 Price Alerts",
          "Enable notifications to receive alerts when prices reach your targets. This works even when the app is closed.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: () => {
                Alert.alert(
                  "Notifications Disabled",
                  "Alert will be saved locally, but you won't receive push notifications when it triggers.",
                  [{ text: "OK", onPress: openModal }]
                )
              }
            },
            {
              text: "Enable",
              onPress: async () => {
                try {
                  const requestNotificationPermission = async () => {
                    if (Platform.OS === "ios") {
                      return await Notifications.requestPermissionsAsync({
                        ios: {
                          allowAlert: true,
                          allowBadge: true,
                          allowSound: true,
                          allowAnnouncements: true
                        }
                      })
                    } else {
                      return await Notifications.requestPermissionsAsync()
                    }
                  }

                  const result = await requestNotificationPermission()
                  const { granted: newGranted } = result

                  setNotificationPermission(newGranted)

                  if (newGranted) {
                    AlertManager.initialize(dispatch)

                    if (Platform.OS !== "web") {
                      try {
                        const token = await NotificationService.getFCMToken()
                        if (token) {
                          setFcmToken(token)

                          ServerSyncService.initialize(token)
                        }
                      } catch (tokenError) {
                        console.warn("Не удалось получить FCM токен:", tokenError)
                      }
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

                    Alert.alert(
                      "✓ Notifications Enabled",
                      "You'll receive push notifications when your price alerts trigger, even when the app is closed.",
                      [{ text: "Great!" }]
                    )
                  }

                  openModal()
                } catch (error) {
                  console.error("Ошибка запроса разрешений:", error)
                  openModal()
                }
              }
            }
          ]
        )
      } catch (error) {
        console.error("Ошибка при открытии алерта:", error)
        openModal()
      }
    },
    [dispatch, notificationPermission, fcmToken]
  )

  // Обработчик сохранения алерта
  const handleSaveAlert = useCallback(
    async (alertData) => {
      const currentCoinPrice = alertData.currentPrice || 0

      const payload = {
        ...alertData,
        currentPrice: currentCoinPrice,
        fcmToken,
        syncStatus: fcmToken ? "pending_sync" : "local_only",
        source: "local"
      }

      // Сохраняем алерт в Redux
      dispatch(addPriceAlert(payload))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Если есть FCM токен и сервер доступен, синхронизируем
      if (fcmToken && notificationPermission) {
        const serverAvailable = serverStatus?.serverAvailable || false

        if (serverAvailable) {
          try {
            // Синхронизируем все алерты с сервером
            const syncedAlerts = [...priceAlerts, payload].filter((a) => a.isActive && !a.triggeredAt)
            await ServerSyncService.syncAlertsWithServer(syncedAlerts)

            Alert.alert(
              "✅ Done!",
              `Your ${alertData.coinSymbol} price alert was set to $${alertData.targetPrice}`,
              [{ text: "Great!" }]
            )
          } catch (syncError) {
            console.warn("Не удалось синхронизировать с сервером:", syncError)
            Alert.alert("⚠️ Alert Saved", `Alert saved locally. Push notifications require app to be open.`, [
              { text: "OK" }
            ])
          }
        } else {
          Alert.alert(
            "✅ Done",
            `Alert saved locally. You'll receive notifications when ${alertData.coinSymbol} reaches $${alertData.targetPrice}, while the app is open.`,
            [{ text: "OK" }]
          )
        }
      } else if (notificationPermission) {
        Alert.alert(
          "✅ Done",
          `Alert saved locally. You'll receive notifications when ${alertData.coinSymbol} reaches $${alertData.targetPrice} while the app is open.`,
          [{ text: "OK" }]
        )
      } else {
        Alert.alert(
          "✅ Alert saved locally",
          "Notifications are disabled. The alert will only work while the app is open.",
          [{ text: "OK" }]
        )
      }
    },
    [dispatch, notificationPermission, fcmToken, priceAlerts, serverStatus]
  )

  // Удаление монеты из избранного
  const removeFromFav = useCallback(
    (coin) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setRemovingCoinId(coin.id)

      // Удаляем все алерты для этой монеты
      const coinAlerts = priceAlerts.filter((alert) => alert.coinId === coin.id)
      coinAlerts.forEach((alert) => {
        dispatch(deletePriceAlert(alert.id))

        // Удаляем алерт с сервера если есть serverId
        if (alert.serverId && fcmToken) {
          ServerSyncService.deleteAlertFromServer(alert.serverId)
        }
      })

      if (coinAlerts.length > 0) {
        console.log(`Удалено ${coinAlerts.length} алертов для монеты`)
      }

      setTimeout(() => {
        setRemovingCoinId(null)
        dispatch(removeCoin(coin))

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }, 1500)
    },
    [dispatch, priceAlerts, fcmToken]
  )

  // Открытие графика
  const openChartModal = useCallback((coin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelectedCoin(coin)
    setModalVisible(true)
  }, [])

  const closeChartModal = useCallback(() => {
    setModalVisible(false)
    setSelectedCoin(null)
  }, [])

  // Открытие формы ввода количества
  const openAmountInput = (coin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedCoinForInput(coin)
    setInputModalVisible(true)
  }

  // Сохранение количества
  const saveAmount = () => {
    if (selectedCoinForInput && amountInputRef.current) {
      const text = amountInputRef.current.replace(/,/g, ".")
      const amount = parseFloat(text) || 0

      dispatch(
        updateUserAsset({
          coinId: selectedCoinForInput.id,
          amount
        })
      )

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    setInputModalVisible(false)
    setSelectedCoinForInput(null)
    amountInputRef.current = ""
  }

  // Функция для тестирования сервера
  const testServerConnection = async () => {
    try {
      const result = await ServerSyncService.testConnection()

      if (result.success) {
        Alert.alert(
          "✅ Сервер доступен",
          `Ping: ${result.ping}ms\nStatus: ${result.status}\nTimestamp: ${result.timestamp}`,
          [{ text: "OK" }]
        )
      } else {
        Alert.alert("Сервер недоступен", `Error: ${result.error}`, [{ text: "OK" }])
      }
    } catch (error) {
      Alert.alert("Ошибка тестирования", error.message, [{ text: "OK" }])
    }
  }

  // Изменение стоимости портфеля за 24ч (взвешенное по позициям)
  const portfolioChange24h = (() => {
    let prev = 0
    coinData.forEach((coin) => {
      const amount = (userAssets && userAssets[coin.id]) || 0
      const pct = coin.price_change_percentage_24h || 0
      prev += (amount * (coin.current_price || 0)) / (1 + pct / 100)
    })
    return prev > 0 ? ((totalPortfolioValue - prev) / prev) * 100 : 0
  })()

  return (
    <Screen>
      <ScreenHeader
        large
        eyebrow='Portfolio'
        title={coinData.length ? undefined : "Portfolio"}
        subtitle={
          lastUpdateTime
            ? `Updated ${lastUpdateTime}`
            : `${coinData.length} asset${coinData.length === 1 ? "" : "s"}`
        }
        left={
          coinData.length ? (
            <View style={{ flex: 1 }}>
              <View style={styles.valueRow}>
                <PriceText value={totalPortfolioValue} money variant='h1' />
                <PercentBadge value={portfolioChange24h} size='md' style={{ marginLeft: space[3] }} />
              </View>
            </View>
          ) : null
        }
        right={
          coinData.length ? (
            <IconButton
              name='refresh'
              onPress={handleManualUpdate}
              disabled={isUpdating}
              active={isUpdating}
            />
          ) : null
        }
      />

      {coinData.length === 0 ? (
        <EmptyState
          icon='star-outline'
          eyebrow='Your holdings'
          title='Your portfolio is empty'
          body='Star coins on the Markets tab to track them here, set alerts and see analytics.'
          action={{ label: "Browse markets", icon: "pulse", onPress: () => navigation.navigate("Home") }}
        />
      ) : (
        <FlatList
          data={coinData}
          ListHeaderComponent={<FavoriteStatsPanel stats={stats} />}
          renderItem={({ item }) => (
            <PremiumCoinCard
              item={item}
              removingCoinId={removingCoinId}
              userAssets={userAssets}
              priceAlerts={priceAlerts}
              openChartModal={openChartModal}
              openAlertModal={openAlertModal}
              openAmountInput={openAmountInput}
              removeFromFav={removeFromFav}
            />
          )}
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: space[3] } : null}
          contentContainerStyle={{ paddingBottom: tabBarHeight + space[4] }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleManualUpdate}
              tintColor={colors.gold[500]}
              colors={[colors.gold[500]]}
              progressBackgroundColor={colors.bg[2]}
            />
          }
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      <AmountInputModal
        inputModalVisible={inputModalVisible}
        setInputModalVisible={setInputModalVisible}
        selectedCoinForInput={selectedCoinForInput}
        userAssets={userAssets}
        saveAmount={saveAmount}
        amountInputRef={amountInputRef}
      />

      {selectedCoinForAlert && (
        <AlertModal
          visible={alertModalVisible}
          onClose={() => {
            setAlertModalVisible(false)
            setSelectedCoinForAlert(null)
          }}
          onSave={handleSaveAlert}
          coin={selectedCoinForAlert}
          currentPrice={selectedCoinForAlert.current_price || 0}
          notificationPermission={notificationPermission}
          fcmToken={fcmToken}
          serverAvailable={serverStatus?.serverAvailable}
        />
      )}

      <ModalFavorite
        visible={isModalVisible}
        onClose={closeChartModal}
        selectedCoin={selectedCoin}
        chartDays={chartDays}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: "row", alignItems: "center" }
})

export default Favorite
