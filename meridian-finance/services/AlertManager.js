import NotificationService from "./NotificationService"
import ServerSyncService from "./ServerSyncService"
import { triggerAlert, updateAlertPrices } from "../store/alertsSlice"

const AlertManager = {
  dispatch: null,

  // Инициализация
  initialize(dispatchFunction) {
    AlertManager.dispatch = dispatchFunction
  },

  // Проверка всех алертов
  checkAlerts(alerts, coinData) {
    if (!alerts || !coinData) {
      console.warn("AlertManager: Missing alerts or coin data")
      return []
    }

    const triggeredAlerts = []
    const activeAlerts = alerts.filter((alert) => alert.isActive && !alert.triggeredAt)

    activeAlerts.forEach((alert) => {
      const coin = coinData.find((c) => c.id === alert.coinId)
      if (!coin || !coin.current_price) {
        console.log(`AlertManager: Coin data not found for alert ${alert.coinName}`)
        return
      }

      const currentPrice = coin.current_price
      const shouldTrigger = AlertManager.checkAlertCondition(alert, currentPrice)

      if (shouldTrigger) {
        triggeredAlerts.push({
          alert,
          currentPrice,
          coin
        })
      }
    })

    // Активация сработавших алертов
    if (triggeredAlerts.length > 0) {
      triggeredAlerts.forEach(({ alert, currentPrice, coin }) => {
        AlertManager.triggerAlert(alert, currentPrice, coin)
      })
    }

    // Обновление цены во всех алертах
    AlertManager.updateAllAlertPrices(coinData)

    return triggeredAlerts
  },

  // Проверка условия алерта
  checkAlertCondition(alert, currentPrice) {
    if (!alert || !currentPrice) {
      console.warn("AlertManager: Invalid alert or price data")
      return false
    }

    switch (alert.condition) {
      case "above":
        return currentPrice >= alert.targetPrice
      case "below":
        return currentPrice <= alert.targetPrice
      case "equals":
        return Math.abs(currentPrice - alert.targetPrice) < 0.01
      default:
        console.warn(`AlertManager: Unknown condition ${alert.condition}`)
        return false
    }
  },

  // Активация алерта
  async triggerAlert(alert, currentPrice, coin) {
    try {
      if (AlertManager.dispatch) {
        AlertManager.dispatch(
          triggerAlert({
            id: alert.id,
            currentPrice
          })
        )
      }

      // Определяем тип уведомления
      const appState = ServerSyncService.appState
      const isAppActive = appState === "active"

      if (isAppActive) {
        // Если приложение активно, отправляем локальное уведомление
        const notificationSuccess = await NotificationService.sendPriceAlertNotification({
          ...alert,
          currentPrice
        })

        if (notificationSuccess) {
          console.log(`AlertManager: Local notification sent successfully`)
        } else {
          console.warn("AlertManager: Failed to send local notification")
        }
      } else {
        // Если приложение не активно, уведомление придет от сервера через FCM
        console.log(`AlertManager: Notification will come from server via FCM`)
      }

      return true
    } catch (error) {
      console.error("AlertManager: Error triggering alert:", error)
      return false
    }
  },

  // Обновление цен во всех алертах
  updateAllAlertPrices(coinData) {
    if (!AlertManager.dispatch) {
      console.warn("AlertManager: Dispatch not initialized")
      return
    }

    if (!coinData || !Array.isArray(coinData)) {
      console.warn("AlertManager: Invalid coin data")
      return
    }

    try {
      const priceUpdates = coinData.map((coin) => ({
        coinId: coin.id,
        currentPrice: coin.current_price || 0
      }))

      AlertManager.dispatch(updateAlertPrices(priceUpdates))
    } catch (error) {
      console.error("AlertManager: Error updating alert prices:", error)
    }
  },

  // Синхронизация алертов с сервером
  async syncAlertsWithServer(alerts) {
    try {
      const result = await ServerSyncService.syncAlertsWithServer(alerts)
      return result
    } catch (error) {
      console.error("AlertManager: Error syncing alerts with server:", error)
      return false
    }
  },

  // Получение статуса сервера
  getServerStatus() {
    return ServerSyncService.getStatus()
  },

  // Тестирование подключения к серверу
  async testServerConnection() {
    return await ServerSyncService.testConnection()
  },

  // Сброс состояния менеджера
  reset() {
    AlertManager.dispatch = null
    // AlertManager reset
  }
}

export default AlertManager
