import { useEffect, useRef, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { UpdateFavoriteCoins } from "../components/Api/Api"
import { rewriteFavorite } from "../store/reducersSlice"
import { coinSelector } from "../store/toolkitSelectors"

export const useFavoriteUpdate = (intervalMinutes = 1) => {
  const dispatch = useDispatch()
  const favoriteCoins = useSelector(coinSelector)
  const updateIntervalRef = useRef(null)
  const isUpdatingRef = useRef(false)
  const updateCountRef = useRef(0)
  const lastUpdateTimeRef = useRef(Date.now())

  // Функция обновления цен избранных монет
  const updateFavoritePrices = useCallback(async () => {
    // Проверка, прошло ли достаточно времени с последнего обновления
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current

    if (timeSinceLastUpdate < 60000) {
      // Минимум 60 секунд между обновлениями

      return
    }

    updateCountRef.current += 1
    const updateNumber = updateCountRef.current

    // Если нет избранных монет или уже идет обновление
    if (!favoriteCoins || favoriteCoins.length === 0) {
      return
    }

    if (isUpdatingRef.current) {
      return
    }

    isUpdatingRef.current = true
    const startTime = Date.now()
    lastUpdateTimeRef.current = now

    try {
      // Получение ID всех избранных монет
      const coinIds = favoriteCoins.map((coin) => coin.id)

      // Добавляем задержку между запросами
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedCoins = await UpdateFavoriteCoins(coinIds)

      if (updatedCoins && updatedCoins.length > 0) {
        const endTime = Date.now()
        const duration = endTime - startTime

        // Объединяем старые данные с новыми

        const mergedCoins = favoriteCoins.map((oldCoin) => {
          const updatedCoin = updatedCoins.find((c) => c.id === oldCoin.id)

          if (updatedCoin) {
            return {
              ...oldCoin,
              current_price: updatedCoin.current_price,
              price_change_percentage_24h: updatedCoin.price_change_percentage_24h,
              market_cap: updatedCoin.market_cap,
              market_cap_rank: updatedCoin.market_cap_rank,
              sparkline_in_7d: updatedCoin.sparkline_in_7d,
              // Сохранение пользовательских данных
              userAmount: oldCoin.userAmount,
              userValue: oldCoin.userValue
            }
          }
          return oldCoin
        })

        // Обновляем в Redux

        dispatch(rewriteFavorite(mergedCoins))
      } else {
        console.log(`Обновленные данные пусты или не получены`)
      }
    } catch (error) {
      console.error(`Ошибка обновления #${updateNumber}:`, error.message)

      // При ошибке 429 увеличиваем интервал
      if (error.message.includes("429")) {
        console.log(`Ошибка 429, увеличиваем интервал обновления`)
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
          // Устанавливаем новый интервал - 5 минут
          updateIntervalRef.current = setInterval(updateFavoritePrices, 5 * 60 * 1000)
        }
      }
    } finally {
      isUpdatingRef.current = false
      const totalTime = Date.now() - startTime
    }
  }, [favoriteCoins, dispatch])

  // Запускаем интервал обновления - ТОЛЬКО ПРИ ИЗМЕНЕНИИ КОЛИЧЕСТВА МОНЕТ
  useEffect(() => {
    // Очищаем предыдущий интервал
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }

    if (favoriteCoins && favoriteCoins.length > 0) {
      // Первое обновление с задержкой в 5 секунд
      setTimeout(() => {
        updateFavoritePrices()
      }, 5000)

      // Устанавливаем интервал
      updateIntervalRef.current = setInterval(
        () => {
          updateFavoritePrices()
        },
        intervalMinutes * 60 * 1000
      )
    } else {
      console.log(`Автообновление не запущено: нет избранных монет`)
    }

    // Очистка интервала при размонтировании
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [favoriteCoins?.length]) // Только при изменении количества монет

  return { updateFavoritePrices }
}
