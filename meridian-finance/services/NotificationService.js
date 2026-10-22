import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform, AppState } from "react-native"

class NotificationService {
  // Инициализация уведомлений с поддержкой FCM
  static async initialize() {
    try {
      // Настройка обработчика уведомлений
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority.HIGH
        })
      })

      // Настройка канала для Android
      if (Platform.OS === "android") {
        await this.setupAndroidChannels()
      }

      return true
    } catch (error) {
      console.error("Ошибка инициализации NotificationService:", error)
      return false
    }
  }

  // Настройка каналов для Android
  static async setupAndroidChannels() {
    try {
      // Основной канал для price alerts
      await Notifications.setNotificationChannelAsync("price-alerts", {
        name: "Price Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: "default",
        enableVibrate: true,
        showBadge: true
      })

      // Канал для FCM push уведомлений
      await Notifications.setNotificationChannelAsync("fcm-push", {
        name: "Push Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#D4AF37",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: "default",
        enableLights: true,
        enableVibrate: true,
        showBadge: true
      })
    } catch (error) {
      console.error("Ошибка настройки Android каналов:", error)
    }
  }

  // Запрос разрешений на уведомления (с FCM)
  static async requestPermissions() {
    try {
      // Проверка, является ли устройство физическим
      if (!Device.isDevice) {
        // Эмулятор/симулятор, FCM может работать ограниченно
      }

      const permissions = {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          allowCriticalAlerts: true
        }
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()

      let finalStatus = existingStatus

      // Запрашиваем разрешения если их еще нет
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync(permissions)
        finalStatus = status
      }

      return finalStatus === "granted"
    } catch (error) {
      console.error("Ошибка запроса разрешений:", error)
      return false
    }
  }

  // Регистрация для push-уведомлений через FCM
  static async registerForPushNotificationsAsync() {
    try {
      // На web push-токены требуют VAPID-ключ в app.json — пропускаем
      if (Platform.OS === "web") {
        return null
      }

      // Проверяем, что устройство физическое
      if (!Device.isDevice) {
        console.warn("Физическое устройство требуется для push-уведомлений")
        return null
      }

      // Проверяем разрешения
      const granted = await this.requestPermissions()
      if (!granted) {
        console.warn("Разрешения на уведомления не получены")
        return null
      }

      // Получаем FCM/Expo push токен
      const token = await this.getDevicePushToken()

      if (token) {
        // Определение типа токена
        const tokenType = this.detectTokenType(token)
      } else {
        console.warn("Не удалось получить push токен")
      }

      return token
    } catch (error) {
      console.error("Ошибка регистрации для push-уведомлений:", error)
      return null
    }
  }

  // Получение токена устройства для push-уведомлений
  static async getDevicePushToken() {
    if (Platform.OS === "web") {
      return null
    }

    try {
      // Попытка получить нативный FCM токен
      let token = await this.getNativeFCMToken()

      // Если не удалось получить нативный токен, используем Expo токен
      if (!token) {
        token = await this.getExpoToken()
      }

      if (token) {
        return token
      } else {
        console.error("Не удалось получить ни один тип токена")
        return null
      }
    } catch (error) {
      console.error("Ошибка получения push токена:", error)
      // Fallback на Expo токен
      try {
        const expoToken = await this.getExpoToken()
        return expoToken
      } catch (expoError) {
        console.error("Ошибка получения Expo токена:", expoError)
        return null
      }
    }
  }

  // Попытка получить нативный FCM токен
  static async getNativeFCMToken() {
    try {
      // На web нативный токен требует VAPID-ключ в app.json — пропускаем
      if (Platform.OS === "web") {
        return null
      }

      // Способ 1: Используем getDevicePushTokenAsync для нативного токена
      // Этот метод возвращает нативный токен в development/production builds
      if (Device.isDevice) {
        const devicePushToken = await Notifications.getDevicePushTokenAsync({
          development: __DEV__ // true для development builds
        })

        // Для Android в development/production builds это будет FCM токен
        if (Platform.OS === "android") {
          if (devicePushToken.type === "fcm" || devicePushToken.type === "android") {
            return devicePushToken.data
          }
        }

        // Для iOS это будет APNS токен
        if (Platform.OS === "ios") {
          if (devicePushToken.type === "apns") {
            return devicePushToken.data
          }
        }
      }

      return null
    } catch (error) {
      console.error("Ошибка получения нативного токена:", error)
      return null
    }
  }

  // Получение Expo токена (fallback)
  static async getExpoToken() {
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })

      return expoToken.data
    } catch (error) {
      console.error("Ошибка получения Expo токена:", error)
      return null
    }
  }

  // Определение типа токена
  static detectTokenType(token) {
    if (!token) return "unknown"

    if (token.startsWith("ExponentPushToken[")) {
      return "expo"
    } else if (token.startsWith("APA91") || token.startsWith("f") || token.length > 100) {
      return "fcm"
    } else if (token.length === 64) {
      return "apns"
    } else {
      return "unknown"
    }
  }

  // Получение FCM токена (основной метод)
  static async getFCMToken() {
    try {
      const token = await this.getDevicePushToken()

      if (token) {
        const tokenType = this.detectTokenType(token)

        if (tokenType === "expo") {
          // Получен Expo токен.
        } else if (tokenType === "fcm") {
          // Получен чистый FCM токен!
        }
      }

      return token
    } catch (error) {
      console.error("Ошибка получения FCM токена:", error)
      return null
    }
  }

  // Проверка, является ли токен валидным FCM токеном
  static isValidFCMToken(token) {
    if (!token) return false

    const tokenType = this.detectTokenType(token)
    return tokenType === "fcm" && token.length > 100
  }

  // Отправка локального уведомления о сработавшем алерте
  static async sendPriceAlertNotification(alert) {
    try {
      if (!alert || !alert.coinName || !alert.coinSymbol) {
        console.warn("Некорректные данные алерта для уведомления")
        return false
      }

      const conditionText = alert.condition === "above" ? "rose above" : "fell below"

      // Текст уведомления
      const title = `🚨 ${alert.coinSymbol.toUpperCase()} Alert!`
      const body = `${alert.coinName} ${conditionText} $${alert.targetPrice.toFixed(
        2
      )}. Current: $${alert.currentPrice.toFixed(2)}`

      // Данные для уведомления
      const notificationData = {
        type: "price-alert",
        alertId: alert.id,
        coinId: alert.coinId,
        coinName: alert.coinName,
        coinSymbol: alert.coinSymbol,
        targetPrice: alert.targetPrice,
        currentPrice: alert.currentPrice,
        condition: alert.condition,
        triggeredAt: new Date().toISOString(),
        source: "local"
      }

      // Проверяем состояние приложения
      const appState = AppState.currentState
      const isAppActive = appState === "active"

      // Планируем уведомление
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notificationData,
          sound: true,
          badge: 1,
          color: "#D4AF37",
          // iOS specific
          // subtitle: "Price Alert Triggered",
          launchImageName: "adaptive-icon",
          // Android specific
          priority: isAppActive
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          autoDismiss: false,
          sticky: !isAppActive,
          channelId: "price-alerts"
        },
        trigger: null
      })

      // Увеличиваем счетчик бейджей
      await this.incrementBadgeCount()

      return true
    } catch (error) {
      console.error(`Ошибка отправки локального уведомления для алерта ${alert?.id}:`, error)
      return false
    }
  }

  // Обработка входящих push-уведомлений от FCM
  static async handleIncomingPushNotification(notification) {
    try {
      if (!notification) {
        console.warn("Пустое уведомление")
        return { handled: false }
      }

      const { data, title, body } = notification

      // Проверяем, является ли уведомление алертом о цене
      if (data?.type === "price-alert") {
        // Создаем локальное уведомление для отображения
        await this.showLocalNotificationFromFCM({
          title: title || `🚨 ${data.coinSymbol?.toUpperCase() || "Crypto"} Alert!`,
          // body: body || "Price alert triggered",
          data
        })

        return {
          handled: true,
          type: "price-alert",
          alertId: data.alertId
        }
      }

      return { handled: false }
    } catch (error) {
      console.error("Ошибка обработки push-уведомления:", error)
      return { handled: false, error: error.message }
    }
  }

  // Показать локальное уведомление из FCM уведомления
  static async showLocalNotificationFromFCM(pushNotification) {
    try {
      const { title, body, data } = pushNotification
      const appState = AppState.currentState
      const isAppActive = appState === "active"

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || "Crypto Alert",
          body: body || "Push notification received",
          data: {
            ...data,
            source: "fcm"
          },
          sound: true,
          badge: 1,
          priority: isAppActive
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.MAX,
          channelId: "fcm-push"
        },
        trigger: null
      })
    } catch (error) {
      console.error("Ошибка показа локального уведомления из FCM:", error)
    }
  }

  // Регистрация обработчиков уведомлений
  static registerNotificationHandlers(onReceived, onResponse) {
    const subscriptions = []

    // Обработчик получения уведомления
    if (onReceived) {
      const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log("Уведомление получено в приложении:", {
          id: notification.request.identifier,
          source: notification.request.content.data?.source || "local"
        })

        onReceived(notification)
      })
      subscriptions.push(receivedSubscription)
    }

    // Обработчик нажатия на уведомление
    if (onResponse) {
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        // Нажатие на уведомление

        onResponse(response)
      })
      subscriptions.push(responseSubscription)
    }

    return subscriptions
  }

  // ===== БАЗОВЫЕ МЕТОДЫ =====

  // Проверка текущих разрешений
  static async checkPermissions() {
    try {
      const { granted, status, expires } = await Notifications.getPermissionsAsync()
      return { granted, status, expires }
    } catch (error) {
      console.error("Ошибка проверки разрешений:", error)
      return { granted: false, error: error.message }
    }
  }

  // Отправка тестового уведомления
  static async sendTestNotification() {
    try {
      const testAlert = {
        id: "test-" + Date.now(),
        coinId: "bitcoin",
        coinName: "Bitcoin",
        coinSymbol: "BTC",
        targetPrice: 50000,
        currentPrice: 51000,
        condition: "above"
      }

      return await this.sendPriceAlertNotification(testAlert)
    } catch (error) {
      console.error("Ошибка отправки тестового уведомления:", error)
      return false
    }
  }

  // Установка количества бейджей
  static async setBadgeCount(count) {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Notifications.setBadgeCountAsync(count)
        return true
      }
      return false
    } catch (error) {
      console.error("Ошибка установки количества бейджей:", error)
      return false
    }
  }

  // Увеличение счетчика бейджей
  static async incrementBadgeCount() {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const currentBadgeCount = await Notifications.getBadgeCountAsync()
        const newBadgeCount = (currentBadgeCount || 0) + 1
        await Notifications.setBadgeCountAsync(newBadgeCount)
        return newBadgeCount
      }
      return 0
    } catch (error) {
      console.error("Ошибка увеличения счетчика бейджей:", error)
      return 0
    }
  }

  // Сброс счетчика бейджей
  static async resetBadgeCount() {
    try {
      await Notifications.setBadgeCountAsync(0)
      return true
    } catch (error) {
      console.error("Ошибка сброса счетчика бейджей:", error)
      return false
    }
  }

  // Получение текущего количества бейджей
  static async getBadgeCount() {
    try {
      const count = await Notifications.getBadgeCountAsync()
      return count || 0
    } catch (error) {
      console.error("Ошибка получения количества бейджей:", error)
      return 0
    }
  }

  // Удаление обработчиков уведомлений
  static removeNotificationHandlers(subscriptions) {
    try {
      if (!subscriptions || !Array.isArray(subscriptions)) {
        console.warn("Нет подписок для удаления")
        return false
      }

      subscriptions.forEach((subscription) => {
        if (subscription && subscription.remove) {
          subscription.remove()
        }
      })

      return true
    } catch (error) {
      console.error("Ошибка удаления обработчиков:", error)
      return false
    }
  }

  // Получение всех запланированных уведомлений
  static async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync()
      return notifications
    } catch (error) {
      console.error("Ошибка получения запланированных уведомлений:", error)
      return []
    }
  }

  // Отмена всех уведомлений
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      return true
    } catch (error) {
      console.error("Ошибка отмены уведомлений:", error)
      return false
    }
  }

  // Получение информации о статусе уведомлений
  static async getNotificationStatus() {
    try {
      const permissions = await this.checkPermissions()
      const badgeCount = await this.getBadgeCount()
      const scheduledNotifications = await this.getAllScheduledNotifications()

      return {
        permissions,
        badgeCount,
        scheduledNotificationsCount: scheduledNotifications.length,
        platform: Platform.OS,
        device: Device.isDevice ? "Физическое устройство" : "Эмулятор",
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error("Ошибка получения статуса уведомлений:", error)
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Полная проверка системы уведомлений
  static async testFullNotificationSystem() {
    try {
      // 1. Проверка разрешений
      const permissions = await this.checkPermissions()

      // 2. Регистрация
      const token = await this.registerForPushNotificationsAsync()
      const tokenType = token ? this.detectTokenType(token) : "none"

      // 3. Отправка тестового уведомления
      const testResult = await this.sendTestNotification()

      // 4. Проверка статуса
      const status = await this.getNotificationStatus()

      return {
        success: true,
        permissions: permissions.granted,
        tokenType,
        token: token ? `${token.substring(0, 20)}...` : null,
        testNotificationSent: testResult,
        status: {
          ...status,
          tokenRegistered: !!token
        }
      }
    } catch (error) {
      console.error("Ошибка тестирования системы уведомлений:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default NotificationService
