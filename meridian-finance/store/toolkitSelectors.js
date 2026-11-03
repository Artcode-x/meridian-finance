const mainSelector = (store) => store.store

export default mainSelector

export const flagSelector = (store) => mainSelector(store).flag
export const coinSelector = (store) => mainSelector(store).coinItem
export const daysSelector = (store) => mainSelector(store).chartDays
export const mainDaySelector = (store) => mainSelector(store).chartDaysMain
export const viewMarketFlagSelector = (store) => mainSelector(store).flagForView
export const duplicateSelector = (store) => mainSelector(store).duplicate
export const userAssetsSelector = (store) => mainSelector(store).userAssets || {}

export const marketDataSelector = (store) => mainSelector(store).marketData || {}

export const marketCurrentPageSelector = (store) => mainSelector(store).marketCurrentPage
export const marketIsLoadingMoreSelector = (store) => mainSelector(store).marketIsLoadingMore
export const marketHasMoreSelector = (store) => mainSelector(store).marketHasMore
export const marketErrorSelector = (store) => mainSelector(store).marketError
export const doubleTap = (store) => mainSelector(store).onDoubleTap
