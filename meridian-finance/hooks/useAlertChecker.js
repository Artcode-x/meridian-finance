import { useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import AlertManager from "../services/AlertManager"
import { priceAlertsSelector } from "../store/alertsSelectors"

export const useAlertChecker = (coinData, checkInterval = 60000) => {
  const dispatch = useDispatch()
  const priceAlerts = useSelector(priceAlertsSelector)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Инициализация AlertManager
    AlertManager.initialize(dispatch)

    // Функция для проверки алертов (только при активном приложении)
    const checkAlerts = () => {
      if (coinData.length > 0 && priceAlerts.length > 0) {
        const activeAlerts = priceAlerts.filter((alert) => alert.isActive && !alert.triggeredAt)

        if (activeAlerts.length > 0) {
          AlertManager.checkAlerts(activeAlerts, coinData)
        }
      }
    }

    // Проверка сразу при монтировании
    checkAlerts()

    // Установка интервала проверки (только когда приложение активно)
    intervalRef.current = setInterval(checkAlerts, checkInterval)

    // Очистка
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [dispatch, coinData, priceAlerts, checkInterval])

  return {
    checkAlerts: () => {
      if (coinData.length > 0 && priceAlerts.length > 0) {
        const activeAlerts = priceAlerts.filter((alert) => alert.isActive && !alert.triggeredAt)
        return AlertManager.checkAlerts(activeAlerts, coinData)
      }
      return []
    }
  }
}
