// Основной селектор для алертов
export const alertsMainSelector = (store) => store.alerts

// Все алерты
export const priceAlertsSelector = (store) => alertsMainSelector(store).alerts || []

// Активные алерты (не сработавшие)
export const activeAlertsSelector = (store) =>
  priceAlertsSelector(store).filter((alert) => alert.isActive && !alert.triggeredAt)

// Сработавшие алерты
export const triggeredAlertsSelector = (store) =>
  priceAlertsSelector(store).filter((alert) => alert.triggeredAt)

// Непрочитанные алерты
export const unreadAlertsSelector = (store) => priceAlertsSelector(store).filter((alert) => !alert.isRead)

// Количество непрочитанных алертов
export const unreadAlertsCountSelector = (store) => alertsMainSelector(store).unreadCount

// Время последней проверки
export const lastAlertCheckSelector = (store) => alertsMainSelector(store).lastCheckTime

// Алёрты для конкретной монеты
export const alertsForCoinSelector = (coinId) => (store) =>
  priceAlertsSelector(store).filter((alert) => alert.coinId === coinId)

// Активные алерты для конкретной монеты
export const activeAlertsForCoinSelector = (coinId) => (store) =>
  priceAlertsSelector(store).filter(
    (alert) => alert.coinId === coinId && alert.isActive && !alert.triggeredAt
  )

// Количество активных алертов для монеты
export const activeAlertsCountForCoinSelector = (coinId) => (store) =>
  activeAlertsForCoinSelector(coinId)(store).length

// Есть ли активные алерты для монеты
export const hasActiveAlertsForCoinSelector = (coinId) => (store) =>
  activeAlertsCountForCoinSelector(coinId)(store) > 0
