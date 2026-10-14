import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useRef, useCallback } from "react"
import { AppState } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { setCoin, updateUserAsset } from "../../store/reducersSlice"

const StorageSync = () => {
  const dispatch = useDispatch()
  const coinItem = useSelector((state) => state.store.coinItem)
  const userAssets = useSelector((state) => state.store.userAssets)

  const hasLoadedRef = useRef(false)
  const appStateRef = useRef(AppState.currentState)
  const saveTimeoutRef = useRef(null)
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return

    const loadData = async () => {
      try {
        const [fav, assets] = await Promise.all([
          AsyncStorage.getItem("@user_favorites"),
          AsyncStorage.getItem("@user_assets")
        ])

        const loadedFavorites = fav ? JSON.parse(fav) : []
        const loadedAssets = assets ? JSON.parse(assets) : {}

        if (loadedFavorites.length > 0) {
          const processedIds = new Set()

          loadedFavorites.forEach((coin) => {
            if (!processedIds.has(coin.id)) {
              processedIds.add(coin.id)

              const coinWithTimestamp = {
                ...coin,
                loadedAt: new Date().toISOString(),

                current_price: coin.current_price || 0,
                price_change_percentage_24h: coin.price_change_percentage_24h || 0,
                market_cap_rank: coin.market_cap_rank || 9999
              }

              dispatch(setCoin(coinWithTimestamp))
            }
          })
        }

        if (Object.keys(loadedAssets).length > 0) {
          Object.entries(loadedAssets).forEach(([coinId, amount]) => {
            const numericAmount = typeof amount === "string" ? parseFloat(amount) || 0 : amount || 0

            if (numericAmount > 0) {
              dispatch(
                updateUserAsset({
                  coinId,
                  amount: numericAmount
                })
              )
            }
          })
        }

        hasLoadedRef.current = true
      } catch (e) {
        console.error("Критическая ошибка загрузки:", e)

        hasLoadedRef.current = true
      }
    }

    loadData()
  }, [dispatch])

  const saveData = useCallback(async () => {
    if (isSavingRef.current) {
      return
    }

    if (!hasLoadedRef.current) {
      return
    }

    isSavingRef.current = true

    try {
      const favoritesToSave = coinItem.map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        current_price: coin.current_price || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap_rank: coin.market_cap_rank || 9999,
        sparkline_in_7d: coin.sparkline_in_7d || null,
        image: coin.image || "",
        last_updated: coin.last_updated || new Date().toISOString(),
        savedAt: new Date().toISOString()
      }))

      const coinIds = new Set(coinItem.map((coin) => coin.id))
      const assetsToSave = {}

      Object.entries(userAssets).forEach(([coinId, amount]) => {
        if (coinIds.has(coinId) && amount > 0) {
          assetsToSave[coinId] = amount
        }
      })

      await Promise.all([
        AsyncStorage.setItem("@user_favorites", JSON.stringify(favoritesToSave)),
        AsyncStorage.setItem("@user_assets", JSON.stringify(assetsToSave))
      ])
    } catch (e) {
      console.error("Ошибка сохранения:", e)

      try {
        const simpleFavorites = coinItem.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol
        }))
        await AsyncStorage.setItem("@user_favorites", JSON.stringify(simpleFavorites))
      } catch (fallbackError) {
        console.error("Критическая ошибка fallback сохранения:", fallbackError)
      }
    } finally {
      isSavingRef.current = false
    }
  }, [coinItem, userAssets])

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return
    }

    if (hasLoadedRef.current && coinItem.length === 0 && Object.keys(userAssets).length === 0) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveData()
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [coinItem, userAssets, saveData])

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }

        try {
          await saveData()
          console.log("Данные сохранены перед уходом в фон")
        } catch (error) {
          console.error("Ошибка сохранения при сворачивании:", error)
        }
      }

      appStateRef.current = nextAppState
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      if (hasLoadedRef.current) {
        saveData().catch((e) => {
          console.error("Ошибка сохранения при размонтировании:", e)
        })
      }
    }
  }, [saveData])

  useEffect(() => {
    if (!hasLoadedRef.current) return

    const interval = setInterval(() => {
      if (appStateRef.current === "active") {
        saveData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [saveData])

  return null
}

export default StorageSync
