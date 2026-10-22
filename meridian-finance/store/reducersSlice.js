import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  coinItem: [],
  userAssets: {},
  flag: false,
  chartDays: "1h",
  chartDaysMain: 1,
  flagForView: false,
  duplicate: false,

  // для сброса графика в дефолт избранном
  onDoubleTap: false,
  // для рыночных данных
  marketData: [], // Все загруженные монеты
  marketCurrentPage: 1, // Текущая страница
  marketIsLoadingMore: false, // Флаг загрузки дополнительных данных
  marketHasMore: true, // Есть ли еще данные для загрузки
  marketLastUpdated: null, // Когда последний раз обновляли
  marketError: null // Ошибка загрузки
}

const reducersSlice = createSlice({
  name: "reducers",
  initialState,
  reducers: {
    setCoin: (state, action) => {
      state.coinItem = [...state.coinItem, action.payload]
    },
    setFlag: (state, action) => {
      state.flag = action.payload
    },

    removeCoin: (state, action) => {
      const nameCoinForRemove = action.payload

      // Удаляем монету
      state.coinItem = state.coinItem.filter((coin) => coin.name !== nameCoinForRemove.name)

      //  удал монеты из userAssets
      if (state.userAssets[nameCoinForRemove.id]) {
        const newAssets = { ...state.userAssets }
        delete newAssets[nameCoinForRemove.id]
        state.userAssets = newAssets
      }
    },
    setChartDays: (state, action) => {
      state.chartDays = action.payload
    },
    setChartDaysMain: (state, action) => {
      state.chartDaysMain = action.payload
    },
    rewriteFavorite: (state, action) => {
      const updatedCoins = action.payload

      // Обновление только тех монет, которые уже есть в избранном
      updatedCoins.forEach((updatedCoin) => {
        const index = state.coinItem.findIndex((coin) => coin.id === updatedCoin.id)
        if (index !== -1) {
          // Обновление только ценовых данных, сохраняя пользовательские
          state.coinItem[index] = {
            ...state.coinItem[index], // Сохранение старых данных
            current_price: updatedCoin.current_price,
            price_change_percentage_24h: updatedCoin.price_change_percentage_24h,
            market_cap: updatedCoin.market_cap,
            market_cap_rank: updatedCoin.market_cap_rank,
            sparkline_in_7d: updatedCoin.sparkline_in_7d
          }
        }
      })
    },
    setFlagForView: (state, action) => {
      state.flagForView = action.payload
    },
    setDuplicate: (state, action) => {
      state.duplicate = action.payload
    },
    updateUserAsset: (state, action) => {
      const { coinId, amount } = action.payload
      state.userAssets = {
        ...state.userAssets,
        [coinId]: amount
      }
    },

    // нов
    setMarketData: (state, action) => {
      state.marketData = action.payload
    },

    addMoreMarketData: (state, action) => {
      // Доб нов данные к существующим
      state.marketData = [...state.marketData, ...action.payload]
    },

    setMarketCurrentPage: (state, action) => {
      state.marketCurrentPage = action.payload
    },

    setMarketIsLoadingMore: (state, action) => {
      state.marketIsLoadingMore = action.payload
    },

    setMarketHasMore: (state, action) => {
      state.marketHasMore = action.payload
    },

    setMarketLastUpdated: (state, action) => {
      state.marketLastUpdated = action.payload
    },

    setMarketError: (state, action) => {
      state.marketError = action.payload
    },

    resetMarketData: (state) => {
      // Полный сброс рыночных данных
      state.marketData = []
      state.marketCurrentPage = 1
      state.marketHasMore = true
      state.marketIsLoadingMore = false
      state.marketError = null
    },

    updateMarketDataItem: (state, action) => {
      // Обновление конкретной монеты при изменении цены
      const { id, data } = action.payload
      const index = state.marketData.findIndex((item) => item.id === id)
      if (index !== -1) {
        state.marketData[index] = { ...state.marketData[index], ...data }
      }
    },
    setDoubleTap: (state) => {
      state.onDoubleTap = !state.onDoubleTap
    }
  }
})

export const {
  setCoin,
  setFlag,
  removeCoin,
  setChartDays,
  setChartDaysMain,
  rewriteFavorite,
  setFlagForView,
  setDuplicate,
  updateUserAsset,
  // Новые экшены
  setMarketData,
  addMoreMarketData,
  setMarketCurrentPage,
  setMarketIsLoadingMore,
  setMarketHasMore,
  setMarketLastUpdated,
  setMarketError,
  resetMarketData,
  updateMarketDataItem,
  setDoubleTap
} = reducersSlice.actions

export default reducersSlice.reducer
