import axios from "axios"

/**
 * Кэш GET-запросов к CoinGecko: один и тот же URL не уходит в сеть чаще, чем раз в TTL.
 * Параллельные запросы к одному URL склеиваются в один. При 429 или сетевой ошибке
 * отдаётся устаревший ответ из кэша, если он есть.
 */
const TTL_MS = 30 * 1000
const CACHED_HOSTS = ["https://api.coingecko.com/"]

const cache = new Map() // url -> { data, at }
const inFlight = new Map() // url -> Promise

const isCacheable = (url) => CACHED_HOSTS.some((h) => url.startsWith(h))

// Возвращает объект вида { data } — как ответ axios
export async function cachedGet(url, config) {
  if (!isCacheable(url)) return axios.get(url, config)

  const hit = cache.get(url)
  const now = Date.now()
  if (hit && now - hit.at < TTL_MS) return { data: hit.data, fromCache: true }

  if (inFlight.has(url)) return inFlight.get(url)

  const request = axios
    .get(url, config)
    .then((res) => {
      cache.set(url, { data: res.data, at: Date.now() })
      return { data: res.data }
    })
    .catch((error) => {
      // Лимит или сеть недоступна — используем устаревшие данные, чтобы не ронять UI
      if (hit) {
        console.warn(`CoinGecko: ${error.message}, используем кэш для ${url}`)
        return { data: hit.data, fromCache: true, stale: true }
      }
      throw error
    })
    .finally(() => inFlight.delete(url))

  inFlight.set(url, request)
  return request
}

export const clearRequestCache = () => cache.clear()
