import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  alerts: [],
  lastCheckTime: null,
  unreadCount: 0,
  serverSyncStatus: "idle", // idle, syncing, synced, error
  lastServerSync: null
}

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    // Добавление нового алерта
    addPriceAlert: (state, action) => {
      const newAlert = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isRead: false,
        triggeredAt: null,
        serverId: null,
        syncStatus: "local",

        createdPrice: Number(action.payload.currentPrice) || 0,
        currentPrice: Number(action.payload.currentPrice) || 0,
        targetPrice: Number(action.payload.targetPrice) || 0
      }

      state.alerts.push(newAlert)
      state.unreadCount = state.alerts.filter((alert) => !alert.isRead).length
    },

    // Обновление алерта
    updatePriceAlert: (state, action) => {
      const { id, updates } = action.payload
      const index = state.alerts.findIndex((alert) => alert.id === id)

      if (index !== -1) {
        const sanitizedUpdates = { ...updates }
        if (updates.createdAt && updates.createdAt instanceof Date) {
          sanitizedUpdates.createdAt = updates.createdAt.toISOString()
        }
        if (updates.triggeredAt && updates.triggeredAt instanceof Date) {
          sanitizedUpdates.triggeredAt = updates.triggeredAt.toISOString()
        }

        state.alerts[index] = {
          ...state.alerts[index],
          ...sanitizedUpdates
        }
        state.unreadCount = state.alerts.filter((alert) => !alert.isRead).length
      }
    },

    // Удаление алерта
    deletePriceAlert: (state, action) => {
      const id = action.payload
      state.alerts = state.alerts.filter((alert) => alert.id !== id)
      state.unreadCount = state.alerts.filter((alert) => !alert.isRead).length
    },

    // Отметить алерт как прочитанный
    markAlertAsRead: (state, action) => {
      const id = action.payload
      const alert = state.alerts.find((a) => a.id === id)

      if (alert && !alert.isRead) {
        alert.isRead = true
        state.unreadCount = state.unreadCount > 0 ? state.unreadCount - 1 : 0
      }
    },

    // Отметить все алерты как прочитанные
    markAllAlertsAsRead: (state) => {
      state.alerts.forEach((alert) => {
        alert.isRead = true
      })
      state.unreadCount = 0
    },

    // Установить время последней проверки
    setLastAlertCheck: (state, action) => {
      state.lastCheckTime = typeof action.payload === "string" ? action.payload : new Date().toISOString()
    },

    // Обновить текущие цены в алертах
    updateAlertPrices: (state, action) => {
      const priceUpdates = action.payload

      state.alerts.forEach((alert) => {
        const update = priceUpdates.find((u) => u.coinId === alert.coinId)
        if (update && alert.isActive && !alert.triggeredAt) {
          alert.currentPrice = Number(update.currentPrice) || 0
        }
      })
    },

    // Активировать сработавший алерт
    triggerAlert: (state, action) => {
      const { id, currentPrice } = action.payload
      const alert = state.alerts.find((a) => a.id === id)

      if (alert && alert.isActive) {
        alert.triggeredAt = new Date().toISOString()
        alert.currentPrice = Number(currentPrice) || 0
        alert.isActive = false
        alert.isRead = false
        state.unreadCount = state.unreadCount + 1
      }
    },

    // Активировать алерт с сервера
    triggerAlertFromServer: (state, action) => {
      const { alertId, currentPrice, triggeredAt } = action.payload

      // Поиск алерта по ID
      const alert = state.alerts.find((a) => a.id === alertId)

      if (alert) {
        // Если алерт уже есть локально
        if (alert.isActive) {
          alert.triggeredAt = triggeredAt || new Date().toISOString()
          alert.currentPrice = Number(currentPrice) || 0
          alert.isActive = false
          alert.isRead = false
          alert.syncStatus = "server_triggered"
          state.unreadCount = state.unreadCount + 1
        }
      } else {
        // Если алерта нет локально, создаем его как сработавший
        const newAlert = {
          id: alertId,
          coinId: action.payload.coinId,
          coinName: action.payload.coinName,
          coinSymbol: action.payload.coinSymbol,
          targetPrice: Number(action.payload.targetPrice) || 0,
          currentPrice: Number(currentPrice) || 0,
          condition: action.payload.condition,
          isActive: false,
          isRead: false,
          triggeredAt: triggeredAt || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          createdPrice: Number(currentPrice) || 0,
          syncStatus: "server_only",
          source: "server"
        }

        state.alerts.push(newAlert)
        state.unreadCount = state.unreadCount + 1
      }
    },

    // Очистить все алерты
    clearAllAlerts: (state) => {
      state.alerts = []
      state.unreadCount = 0
      state.lastCheckTime = null
    },

    // Очистить только сработавшие алерты
    clearTriggeredAlerts: (state) => {
      state.alerts = state.alerts.filter((alert) => !alert.triggeredAt)
      state.unreadCount = state.alerts.filter((alert) => !alert.isRead).length
    },

    // Восстановить алерт (сделать активным)
    restoreAlert: (state, action) => {
      const id = action.payload
      const alert = state.alerts.find((a) => a.id === id)

      if (alert) {
        alert.isActive = true
        alert.triggeredAt = null
        alert.isRead = true
        state.unreadCount = state.unreadCount > 0 ? state.unreadCount - 1 : 0
      }
    },

    // Загрузить алерты (например, из AsyncStorage)
    loadAlerts: (state, action) => {
      const { alerts, lastCheckTime, unreadCount } = action.payload

      // Валидация и очистка данных
      const sanitizedAlerts = alerts.map((alert) => ({
        ...alert,

        createdPrice: Number(alert.createdPrice) || Number(alert.currentPrice) || 0,
        currentPrice: Number(alert.currentPrice) || 0,
        targetPrice: Number(alert.targetPrice) || 0,

        createdAt:
          typeof alert.createdAt === "string"
            ? alert.createdAt
            : alert.createdAt?.toISOString
              ? alert.createdAt.toISOString()
              : new Date().toISOString(),
        triggeredAt: alert.triggeredAt
          ? typeof alert.triggeredAt === "string"
            ? alert.triggeredAt
            : alert.triggeredAt?.toISOString
              ? alert.triggeredAt.toISOString()
              : new Date().toISOString()
          : null
      }))

      state.alerts = sanitizedAlerts
      state.lastCheckTime = typeof lastCheckTime === "string" ? lastCheckTime : null
      state.unreadCount = Number(unreadCount) || 0
    },

    // Обновление статуса синхронизации с сервером
    updateServerSyncStatus: (state, action) => {
      state.serverSyncStatus = action.payload.status
      if (action.payload.timestamp) {
        state.lastServerSync = action.payload.timestamp
      }
    },

    // Обновление serverId для алерта
    updateAlertServerId: (state, action) => {
      const { alertId, serverId } = action.payload
      const alert = state.alerts.find((a) => a.id === alertId)

      if (alert) {
        alert.serverId = serverId
        alert.syncStatus = "synced"
      }
    },

    // Удалить алерты, синхронизированные с сервером
    removeSyncedAlerts: (state) => {
      state.alerts = state.alerts.filter((alert) => alert.syncStatus !== "synced")
      state.unreadCount = state.alerts.filter((alert) => !alert.isRead).length
    }
  }
})

export const {
  addPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  setLastAlertCheck,
  updateAlertPrices,
  triggerAlert,
  triggerAlertFromServer,
  clearAllAlerts,
  clearTriggeredAlerts,
  restoreAlert,
  loadAlerts,
  updateServerSyncStatus,
  updateAlertServerId,
  removeSyncedAlerts
} = alertsSlice.actions

export default alertsSlice.reducer
