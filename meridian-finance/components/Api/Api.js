import axios from "axios"
import { cachedGet } from "../../services/RequestCache"

// Оригинальная функция с параметром page
export async function GetMarketData(page = 1, perPage = 250) {
  try {
    const response = await cachedGet(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=7d`
    )
    return response.data
  } catch (error) {
    console.error(`Ошибка загрузки страницы ${page}:`, error.message)
    throw error
  }
}

// Новая функция для подгрузки следующей страницы
export async function GetNextMarketPage(page) {
  return GetMarketData(page)
}

// Можно добавить функцию для обновления цен
export async function UpdatePricesForIds(coinIds) {
  try {
    const response = await cachedGet(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(
        ","
      )}&sparkline=false`
    )
    return response.data
  } catch (error) {
    console.error("Ошибка обновления цен:", error)
    return []
  }
}

export async function FetchCoinHistoricalData(coinId, switchChartDays) {
  // Данные для графика за разные таймфреймы/дни (через кэш)
  const response = await cachedGet(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${switchChartDays}`
  )
  return response.data.prices
}

export async function Get24hrMinMaxPrices(symbol) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`)
    const data = await response.json()

    if (!data || Object.keys(data).length === 0) {
      console.log("Нет данных для данного символа.")
      return
    }

    const minPrice = parseFloat(data.lowPrice) // Минимальная цена за 24 часа
    const maxPrice = parseFloat(data.highPrice) // Максимальная цена за 24 часа
    return { minPrice, maxPrice }
  } catch (error) {
    console.error("Ошибка при получении данных:", error)
  }
}

export async function FetchCandleData(symbol, days, limit) {
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${days}&limit=${limit}`
    )
    //   time: new Date(item[0]).toLocaleString(),
    const prices = response.data.map((item) => ({
      time: new Date(item[0]).toISOString(),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }))

    return prices
  } catch (error) {
    console.log(error.message)
    return []
  }
}

export async function GetSantiment() {
  try {
    const response = await axios.get("https://api.alternative.me/fng/?limit=1")

    if (!response.data?.data?.[0]) {
      throw new Error("Empty response from API")
    }
    const data = response.data.data[0]

    return {
      value: data.value,
      classification: data.value_classification
    }
  } catch (error) {
    console.log("Ошибка получения настроений:", error.message)
    return null
  }
}

export async function FetchCoinPriceChange(coinId, days) {
  try {
    const response = await cachedGet(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    )
    const prices = response.data.prices

    if (!prices || prices.length < 2) {
      return 0
    }

    // Берем первую и последнюю цену
    const startPrice = prices[0][1] // [timestamp, price]
    const endPrice = prices[prices.length - 1][1]

    // Рассчитываем процентное изменение
    const priceChange = ((endPrice - startPrice) / startPrice) * 100

    return priceChange
  } catch (error) {
    console.error(`Error fetching ${days}d data for ${coinId}:`, error.message)
    return 0 // Возвращаем 0 при ошибке
  }
}

export async function UpdateFavoriteCoins(coinIds) {
  if (!coinIds || coinIds.length === 0) {
    return []
  }

  try {
    const idsParam = coinIds.slice(0, 50).join(",") // Берем максимум 50 монет

    const response = await cachedGet(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&sparkline=false&price_change_percentage=24h,7d`
    )

    return response.data
  } catch (error) {
    console.error("❌ Ошибка обновления:", error.message)

    // Возвращаем пустой массив при ошибке 429
    if (error.response?.status === 429) {
      console.log("Лимит запросов, ждем следующего интервала")
      return []
    }

    // При других ошибках тоже возвращаем пустой массив
    return []
  }
}

// Функция получения текущих цен для BackgroundService
export async function fetchCurrentPrices(coinIds) {
  try {
    const response = await cachedGet(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd`
    )
    const data = response.data
    const prices = {}

    // Преобразование данных в удобный формат
    coinIds.forEach((id) => {
      prices[id] = data[id]?.usd || 0
    })

    return prices
  } catch (error) {
    console.error("Ошибка получения цен:", error)
    return {}
  }
}

// Для поиска монет

export async function SearchCoins(query) {
  if (!query || query.length < 2) return []

  try {
    const response = await cachedGet(`https://api.coingecko.com/api/v3/search?query=${query}`)

    if (!response.data || !response.data.coins) {
      return []
    }

    // Получаем детальную информацию по найденным монетам (первые 10)
    const coins = response.data.coins.slice(0, 10)

    if (coins.length === 0) return []

    // Получаем рыночные данные для найденных монет
    const coinIds = coins.map((coin) => coin.id).join(",")
    const marketResponse = await cachedGet(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true&price_change_percentage=7d`
    )

    return marketResponse.data
  } catch (error) {
    console.error("Ошибка поиска:", error.message)

    if (error.message === "Request failed with status code 429") {
      throw new Error("429")
    }

    return []
  }
}
