import { Ionicons } from "@expo/vector-icons"
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold
} from "@expo-google-fonts/manrope"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { AppState, View, StyleSheet, ActivityIndicator } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Provider, useDispatch, useSelector } from "react-redux"
import AlertConsentModal from "./components/AlertConsentModal/AlertConsentModal"
import { AppRoute } from "./components/AppRoute/AppRoute"
import StorageSync from "./components/StorageSync/StorageSync"
import { Text, Button } from "./components/ui"
import NotificationService from "./services/NotificationService"
import ServerSyncService from "./services/ServerSyncService"
import { priceAlertsSelector } from "./store/alertsSelectors"
import { loadAlerts, markAlertAsRead, triggerAlertFromServer } from "./store/alertsSlice"
import store from "./store/store"
import { colors, space, goldAlpha } from "./theme"

SplashScreen.preventAutoHideAsync().catch(() => {})

// Золотой монограмм для загрузочного/ошибочного экранов
const Monogram = ({ size = 72 }) => (
  <View style={[shell.monoOuter, { width: size + 8, height: size + 8, borderRadius: 0 }]}>
    <LinearGradient
      colors={[goldAlpha(0.3), goldAlpha(0.05)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[shell.mono, { width: size, height: size, borderRadius: 0 }]}
    >
      <Ionicons name='pulse' size={size * 0.45} color={colors.gold[400]} />
    </LinearGradient>
  </View>
)

const shell = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg[1],
    alignItems: "center",
    justifyContent: "center",
    padding: space[6]
  },
  monoOuter: { borderWidth: 1, borderColor: goldAlpha(0.35), padding: 4 },
  mono: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.4)
  }
})

// Компонент для отображения ошибок
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const errorHandler = (error) => {
      console.error("Необработанная ошибка:", error)
      setHasError(true)
      setError(error.message || error.toString())
    }

    const originalErrorHandler = ErrorUtils.getGlobalHandler()
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      errorHandler(error)
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal)
      }
    })

    return () => {
      ErrorUtils.setGlobalHandler(originalErrorHandler)
    }
  }, [])

  if (hasError) {
    return (
      <View style={shell.root}>
        <Monogram />
        <Text variant='label' color='gold' style={{ marginTop: space[6] }}>
          Something went wrong
        </Text>
        <Text variant='h2' align='center' style={{ marginTop: space[2] }}>
          The app hit an unexpected error
        </Text>
        <Text
          variant='caption'
          color='tertiary'
          align='center'
          style={{ marginTop: space[3], maxWidth: 320 }}
        >
          {error || "Unknown error"}
        </Text>
        <Button
          variant='outline'
          title='Reload app'
          icon='refresh'
          style={{ marginTop: space[6] }}
          onPress={() => {
            setHasError(false)
            setError(null)
          }}
        />
      </View>
    )
  }

  return children
}

function AppContent() {
  const dispatch = useDispatch()
  const [isReady, setIsReady] = useState(false)
  const [appState, setAppState] = useState(AppState.currentState)
  const priceAlerts = useSelector(priceAlertsSelector)

  // состояния для модалки
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    let notificationSubscriptions = []

    const initializeApp = async () => {
      try {
        // 1. Проверка, давал ли пользователь уже согласие
        try {
          const consent = await AsyncStorage.getItem("@background_alerts_consent")

          setHasConsent(consent === "agreed")

          //  Если согласия нет - показываем модалку
          if (consent === null) {
            // Показываем с задержкой для лучшего UX
            setTimeout(() => {
              setShowConsentModal(true)
            }, 2000)
          }
        } catch (consentError) {
          console.error("Ошибка проверки согласия:", consentError)
        }

        // 2. Загрузка алертов из AsyncStorage
        try {
          const storedAlertsJson = await AsyncStorage.getItem("priceAlerts")
          if (storedAlertsJson) {
            const storedAlerts = JSON.parse(storedAlertsJson)
            const validAlerts = storedAlerts.filter(
              (alert) =>
                alert && alert.id && alert.coinId && alert.coinName && typeof alert.targetPrice === "number"
            )

            if (validAlerts.length > 0) {
              dispatch(
                loadAlerts({
                  alerts: validAlerts,
                  lastCheckTime: null,
                  unreadCount: validAlerts.filter((alert) => !alert.isRead).length
                })
              )
            }
          }
        } catch (storageError) {
          console.error("Ошибка загрузки алертов:", storageError)
        }

        // 3. Инициализация службы уведомлений
        try {
          const notificationInitialized = await NotificationService.initialize()

          if (notificationInitialized) {
            // 4. Запрос разрешений
            const permissionGranted = await NotificationService.requestPermissions()

            if (permissionGranted) {
              // 5. Регистрация для push-уведомлений
              const fcmToken = await NotificationService.registerForPushNotificationsAsync()

              if (fcmToken) {
                // 6. Инициализация синхронизации с сервером (ВСЕГДА, как в старой версии)
                await ServerSyncService.initialize(fcmToken, dispatch)

                // 7. Регистрация обработчиков уведомлений (как в старой версии)
                notificationSubscriptions = NotificationService.registerNotificationHandlers(
                  // Обработчик получения уведомления (как ранее)
                  (notification) => {
                    try {
                      const data = notification.request.content.data

                      // !! Проверяем, не от сервера ли уведомление
                      if (data?.type === "price-alert") {
                        // ! Если уведомление пришло от сервера - не показываем локальное
                        if (data.source === "server" || data.isServerTriggered === "true") {
                          // Отметка алерта как сработавшего в Redux
                          dispatch(
                            triggerAlertFromServer({
                              alertId: data.alertId || data.serverId,
                              currentPrice: parseFloat(data.currentPrice) || 0,
                              triggeredAt: data.triggeredAt || new Date().toISOString(),
                              coinId: data.coinId,
                              coinName: data.coinName,
                              coinSymbol: data.coinSymbol,
                              targetPrice: parseFloat(data.targetPrice) || 0,
                              condition: data.condition
                            })
                          )

                          return // Прерывание дальнейшей обработки
                        }

                        // Если уведомление локальное - обработка как обычно
                        if (data?.alertId) {
                          dispatch(markAlertAsRead(data.alertId))
                        }
                      }
                    } catch (error) {
                      console.error("Ошибка обработки уведомления:", error)
                    }
                  },
                  // Обработчик нажатия на уведомление
                  async (response) => {
                    try {
                      const data = response.notification.request.content.data

                      if (data?.type === "price-alert" && (data?.alertId || data?.serverId)) {
                        const alertId = data.alertId || data.serverId

                        // Пометка как прочитанного вне зависимости от источника
                        dispatch(markAlertAsRead(alertId))

                        // Если уведомление от сервера, но алерт еще не помечен как сработавший
                        if (data.source === "server" || data.isServerTriggered === "true") {
                          dispatch(
                            triggerAlertFromServer({
                              alertId,
                              currentPrice: parseFloat(data.currentPrice) || 0,
                              triggeredAt: data.triggeredAt || new Date().toISOString(),
                              coinId: data.coinId,
                              coinName: data.coinName,
                              coinSymbol: data.coinSymbol,
                              targetPrice: parseFloat(data.targetPrice) || 0,
                              condition: data.condition
                            })
                          )
                        }
                      }
                    } catch (error) {
                      console.error("Ошибка обработки нажатия на уведомление:", error)
                    }
                  }
                )
              }
            }
          }
        } catch (notificationError) {
          console.error("Ошибка инициализации уведомлений:", notificationError)
        }

        setIsReady(true)
      } catch (error) {
        console.error("Критическая ошибка инициализации:", error)
        setIsReady(true)
      }
    }

    initializeApp()

    // Слушатель изменения состояния приложения
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState)

      // При сворачивании приложения синхронизация алертов с сервером (с проверкой согласия)

      // Обновление состояния на сервере (только если есть согласие)
      AsyncStorage.getItem("@background_alerts_consent").then((consent) => {
        if (consent === "agreed") {
          ServerSyncService.updateAppStateOnServer(nextAppState)
        }
      })
    })

    return () => {
      subscription.remove()
      if (notificationSubscriptions && notificationSubscriptions.length > 0) {
        NotificationService.removeNotificationHandlers(notificationSubscriptions)
      }
    }
  }, [dispatch])

  // обработчики для модалки
  const handleAgree = async () => {
    try {
      await AsyncStorage.setItem("@background_alerts_consent", "agreed")
      setHasConsent(true)
      setShowConsentModal(false)

      // Активация серверной синхронизации
      const fcmToken = await NotificationService.getFCMToken()
      if (fcmToken) {
        console.log("Активация серверной синхронизации...")
      }
    } catch (error) {
      console.error("Error saving consent:", error)
    }
  }

  const handleCancel = async () => {
    try {
      await AsyncStorage.setItem("@background_alerts_consent", "denied")
      setHasConsent(false)
      setShowConsentModal(false)

      // ServerSyncService остается инициализированным, но будет проверять согласие перед действиями
    } catch (error) {
      console.error("Error saving consent:", error)
    }
  }

  if (!isReady) {
    return (
      <View style={shell.root}>
        <Monogram />
        <Text variant='label' color='gold' style={{ marginTop: space[6] }}>
          Crypto Tracker
        </Text>
        <ActivityIndicator color={colors.gold[500]} style={{ marginTop: space[4] }} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StorageSync />
      <AppRoute />
      {/* рендер модалки */}
      <AlertConsentModal visible={showConsentModal} onAgree={handleAgree} onCancel={handleCancel} />
    </GestureHandlerRootView>
  )
}

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded, fontsError])

  // Пока шрифты грузятся, держим нативный splash (тёмный фон из app.json)
  if (!fontsLoaded && !fontsError) return null

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
