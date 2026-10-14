import AsyncStorage from "@react-native-async-storage/async-storage"
import { configureStore } from "@reduxjs/toolkit"
import alertsSlice from "./alertsSlice"
import reducersSlice from "./reducersSlice"

const ALERTS_STORAGE_KEY = "priceAlerts"

// Middleware для синхронизации алертов с AsyncStorage
const alertsStorageMiddleware = (store) => (next) => (action) => {
  const alertsActions = [
    "alerts/addPriceAlert",
    "alerts/updatePriceAlert",
    "alerts/deletePriceAlert",
    "alerts/markAlertAsRead",
    "alerts/markAllAlertsAsRead",
    "alerts/triggerAlert",
    "alerts/clearAllAlerts",
    "alerts/clearTriggeredAlerts",
    "alerts/restoreAlert",
    "alerts/loadAlerts"
  ]

  const isAlertAction = alertsActions.includes(action.type)
  const result = next(action)

  if (isAlertAction) {
    const state = store.getState()
    const alerts = state.alerts.alerts || []

    // Асинхронное сохранение
    AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts)).catch((error) => {
      console.error("Ошибка сохранения алертов:", error)
    })
  }

  return result
}

const store = configureStore({
  reducer: {
    store: reducersSlice,
    alerts: alertsSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["alerts/loadAlerts"],
        ignoredPaths: ["alerts.alerts"]
      }
    }).concat(alertsStorageMiddleware),
  devTools: process.env.NODE_ENV !== "production"
})

export default store
