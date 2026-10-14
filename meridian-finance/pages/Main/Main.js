import React, { useEffect, useState, useCallback, useRef } from "react"
import { View, StyleSheet } from "react-native"
import { useSelector, useDispatch } from "react-redux"
import { FetchCoinHistoricalData, GetMarketData, SearchCoins } from "../../components/Api/Api"
import { Chart } from "../../components/Chart/Chart"
import CoinList from "../../components/CoinList/CoinList"
import { prepareChartData } from "../../components/PrepareChartData/PrepareChartData"
import { Screen, ScreenHeader, IconButton, Text, Surface, Button } from "../../components/ui"
import {
  setMarketData,
  addMoreMarketData,
  setMarketCurrentPage,
  setMarketIsLoadingMore,
  setMarketHasMore,
  setMarketLastUpdated,
  setMarketError,
  resetMarketData,
  setFlagForView
} from "../../store/reducersSlice"
import {
  mainDaySelector,
  marketCurrentPageSelector,
  marketDataSelector,
  marketErrorSelector,
  marketHasMoreSelector,
  marketIsLoadingMoreSelector,
  viewMarketFlagSelector
} from "../../store/toolkitSelectors"
import { colors, space, goldAlpha } from "../../theme"

const Main = () => {
  const dispatch = useDispatch()

  // Стейты компонента
  const [search, setSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCoinData, setSelectedCoinData] = useState(null)
  const [coinHistoryData, setCoinHistoryData] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [isloading, setIsLoading] = useState(false)
  const [flagForLoader, setFlagForLoader] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Стейты для обработки ошибки 429
  const [is429Error, setIs429Error] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false)

  // Для поиска
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Refs для управления загрузкой
  const isLoadingMoreRef = useRef(false)
  const retryTimeoutRef = useRef(null)
  const consecutiveErrorsRef = useRef(0)
  const initialLoadDoneRef = useRef(false)
  const countdownIntervalRef = useRef(null)
  const isMountedRef = useRef(true)

  // Данные из Redux
  const marketData = useSelector(marketDataSelector)
  const marketCurrentPage = useSelector(marketCurrentPageSelector)
  const marketIsLoadingMore = useSelector(marketIsLoadingMoreSelector)
  const marketHasMore = useSelector(marketHasMoreSelector)
  const marketError = useSelector(marketErrorSelector)
  const switchChartDays = useSelector(mainDaySelector)
  const marketViewFlag = useSelector(viewMarketFlagSelector)

  // Функция очистки таймеров
  const clearAllTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  //  Для скрытия баннера при окончании отсчета
  useEffect(() => {
    if (retryCountdown === 0 && is429Error) {
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          setIs429Error(false)
        }
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [retryCountdown, is429Error])

  // Функция запуска обратного отсчета
  const startCountdown = useCallback(
    (seconds, retryCallback) => {
      clearAllTimers()
      setIs429Error(true)
      setRetryCountdown(seconds)

      // Отсчет каждую секунду для UI
      let currentCount = seconds

      countdownIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return

        currentCount -= 1
        setRetryCountdown(currentCount)

        if (currentCount <= 0) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null

          // Запуск повтора через 1 секунду после окончания
          if (retryCallback) {
            setTimeout(() => {
              if (isMountedRef.current) {
                retryCallback()
              }
            }, 1000)
          }
        }
      }, 1000)

      // Дублирующий таймаут на случай проблем с интервалом
      retryTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return

        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
        setRetryCountdown(0)

        if (retryCallback) {
          retryCallback()
        }
      }, seconds * 1000)
    },
    [clearAllTimers]
  )

  // Функция загрузки первой страницы
  const fetchInitialMarketData = useCallback(async () => {
    if (flagForLoader || !isMountedRef.current) {
      return
    }

    if (initialLoadDoneRef.current && marketData.length > 0) {
      return
    }

    setFlagForLoader(true)
    setInitialLoadAttempted(true)
    dispatch(setMarketError(null))

    try {
      const firstPageData = await GetMarketData(1)

      if (!firstPageData || !Array.isArray(firstPageData)) {
        throw new Error("Некорректные данные от сервера")
      }

      dispatch(setMarketData(firstPageData))
      dispatch(setMarketCurrentPage(2))
      dispatch(setMarketLastUpdated(Date.now()))
      dispatch(setMarketHasMore(firstPageData.length > 0))

      initialLoadDoneRef.current = true

      // При успешной загрузке - сбрасываем баннер 429

      setIs429Error(false)
      setRetryCountdown(0)
      clearAllTimers()

      consecutiveErrorsRef.current = 0
    } catch (error) {
      console.error("Ошибка загрузки:", error.message)

      if (error.message === "Request failed with status code 429") {
        consecutiveErrorsRef.current += 1

        // Минимальная задержка 1 минута (60000 мс)
        const delay = Math.max(
          60000, // 1 минута минимум
          2000 * Math.pow(2, Math.min(consecutiveErrorsRef.current - 1, 5))
        )

        const delayInSeconds = Math.ceil(delay / 1000)

        // Запуск обратного отсчета с функцией повтора
        startCountdown(delayInSeconds, () => {
          fetchInitialMarketData()
        })

        // Сообщение для пользователя
        dispatch(setMarketError(`Too many requests. Automatically repeat after ${delayInSeconds} sec...`))
      } else {
        // Другие ошибки
        dispatch(setMarketError(error.message || "Ошибка загрузки данных"))
      }
    } finally {
      if (isMountedRef.current) {
        setFlagForLoader(false)
      }
    }
  }, [dispatch, flagForLoader, marketData.length, clearAllTimers, startCountdown])

  // Функция подгрузки следующей страницы
  const loadMoreData = useCallback(async () => {
    if (!marketHasMore || marketIsLoadingMore || isLoadingMoreRef.current || !isMountedRef.current) {
      // Не загружаем: нет данных или уже идет загрузка
      return
    }

    const pageToLoad = marketCurrentPage

    isLoadingMoreRef.current = true

    try {
      dispatch(setMarketIsLoadingMore(true))
      const nextPageData = await GetMarketData(pageToLoad)

      if (nextPageData.length === 0) {
        // Больше данных для загрузки нет
        dispatch(setMarketHasMore(false))
      } else {
        const existingIds = new Set(marketData.map((item) => item.id))
        const newItems = nextPageData.filter((item) => !existingIds.has(item.id))

        if (newItems.length > 0) {
          dispatch(addMoreMarketData(newItems))
          const nextPage = pageToLoad + 1
          dispatch(setMarketCurrentPage(nextPage))
          dispatch(setMarketLastUpdated(Date.now()))
        } else {
          dispatch(setMarketCurrentPage(pageToLoad + 1))
        }
      }

      // Успешная загрузка - сбрасываем баннер 429
      if (is429Error) {
        setIs429Error(false)
        setRetryCountdown(0)
        clearAllTimers()
        dispatch(setMarketError(null))
      }

      consecutiveErrorsRef.current = 0
    } catch (error) {
      console.error(`Ошибка загрузки страницы ${marketCurrentPage}:`, error.message)

      if (error.message === "Request failed with status code 429") {
        consecutiveErrorsRef.current += 1

        // Минимальная задержка 1 минута
        const delay = Math.max(60000, 2000 * Math.pow(2, Math.min(consecutiveErrorsRef.current - 1, 5)))

        const delayInSeconds = Math.ceil(delay / 1000)

        // Запуск обратного отсчета с функцией повтора
        startCountdown(delayInSeconds, () => {
          // Автоматический повтор подгрузки после отсчета
          loadMoreData()
        })

        dispatch(setMarketError(`Too many requests. Automatic repeat after ${delayInSeconds}sec...`))

        return
      } else {
        // Другие ошибки
        dispatch(setMarketError(error.message))
      }
    } finally {
      if (isLoadingMoreRef.current && isMountedRef.current) {
        dispatch(setMarketIsLoadingMore(false))
        isLoadingMoreRef.current = false
      }
    }
  }, [
    marketHasMore,
    marketIsLoadingMore,
    marketCurrentPage,
    marketData,
    dispatch,
    is429Error,
    clearAllTimers,
    startCountdown
  ])

  // Функция обновления (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return

    setRefreshing(true)
    try {
      clearAllTimers()

      // Сброс баннера при ручном обновлении
      if (is429Error) {
        setIs429Error(false)
        setRetryCountdown(0)
      }

      dispatch(resetMarketData())
      dispatch(setMarketError(null))
      initialLoadDoneRef.current = false
      consecutiveErrorsRef.current = 0

      await fetchInitialMarketData()
    } catch (error) {
      console.error("Ошибка:", error)
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [dispatch, fetchInitialMarketData, clearAllTimers, is429Error])

  // Первая загрузка при монтировании - Только один раз!
  useEffect(() => {
    isMountedRef.current = true

    // Загружаем только если еще не пытались
    if (!initialLoadAttempted && marketData.length === 0) {
      fetchInitialMarketData()
    }

    return () => {
      isMountedRef.current = false
      clearAllTimers()
    }
  }, []) // Запуск только при монтировании

  // Ручной повтор
  const handleManualRetry = useCallback(async () => {
    if (!isMountedRef.current) return

    clearAllTimers()
    setIs429Error(false)
    setRetryCountdown(0)
    consecutiveErrorsRef.current = 0
    dispatch(setMarketError(null))

    try {
      if (marketData.length === 0) {
        await fetchInitialMarketData()
      }
    } catch (error) {
      console.error("Ошибка при ручном повторе:", error)
    }
  }, [clearAllTimers, dispatch, marketData.length, fetchInitialMarketData])

  const openModal = async (item) => {
    if (!isMountedRef.current) return

    setSelectedCoinData(item)
    setModalVisible(true)
    setIsLoading(true)

    try {
      const historicalData = await FetchCoinHistoricalData(item.id, switchChartDays)
      setCoinHistoryData(historicalData || [])
    } catch (error) {
      console.error("Ошибка:", error)
      setCoinHistoryData([])
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const closeModal = () => {
    if (!isMountedRef.current) return

    setModalVisible(false)
    setSelectedCoinData(null)
    setCoinHistoryData([])
  }

  useEffect(() => {
    if (!isMountedRef.current || !selectedCoinData) return

    const fetchHistoricalData = async () => {
      setIsLoading(true)
      try {
        const historicalData = await FetchCoinHistoricalData(selectedCoinData.id, switchChartDays)
        setCoinHistoryData(historicalData || [])
      } catch (error) {
        console.error("Ошибка:", error)
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchHistoricalData()
  }, [switchChartDays, selectedCoinData])

  const chartData = prepareChartData(coinHistoryData)

  const handleSearch = (text) => {
    setSearch(text)
    setSearchError(null)

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    if (!text.trim()) {
      setSearchResults([])
      return
    }

    // debounce 500мс
    retryTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current || text.length < 2) return

      setIsSearching(true)
      try {
        const results = await SearchCoins(text)
        if (isMountedRef.current) {
          setSearchResults(results)
        }
      } catch (error) {
        if (error.message === "429") {
          setSearchError("Too many requests, try again later")
        } else {
          setSearchError("Search failed, please try again")
        }
        setSearchResults([])
      } finally {
        if (isMountedRef.current) {
          setIsSearching(false)
        }
      }
    }, 500)
  }

  const toggleSearch = () => {
    if (searchOpen) {
      handleSearch("")
    }
    setSearchOpen(!searchOpen)
  }

  const isInitialLoading = flagForLoader && marketData.length === 0
  const listData = search.trim().length >= 2 ? searchResults : marketData

  return (
    <Screen>
      <ScreenHeader
        large
        eyebrow='Crypto Tracker'
        title='Markets'
        subtitle={marketData.length ? `Top ${marketData.length} by market cap` : "Live prices by market cap"}
        right={
          <>
            <IconButton name='search' active={searchOpen} onPress={toggleSearch} />
            <IconButton
              name={marketViewFlag ? "grid-outline" : "list-outline"}
              onPress={() => dispatch(setFlagForView(!marketViewFlag))}
            />
          </>
        }
        search={{
          visible: searchOpen,
          value: search,
          onChange: handleSearch,
          placeholder: "Search by name or ticker",
          autoFocus: true
        }}
      />

      {is429Error && (
        <Surface level={2} radius='md' style={styles.banner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIcon}>
              <Text variant='h3' color='gold'>
                {retryCountdown}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant='bodyStrong'>Rate limit reached</Text>
              <Text variant='caption' color='tertiary'>
                Retrying automatically in {retryCountdown}s
              </Text>
            </View>
            <Button variant='outline' size='sm' title='Retry' onPress={handleManualRetry} />
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, ((60 - retryCountdown) / 60) * 100)}%` }
              ]}
            />
          </View>
        </Surface>
      )}

      <CoinList
        data={listData}
        layout={marketViewFlag ? "row" : "grid"}
        search={search}
        openModal={openModal}
        refreshing={refreshing}
        setRefreshing={setRefreshing}
        fetchMarketData={handleRefresh}
        errorMessage={is429Error ? null : marketError}
        loadMoreData={loadMoreData}
        isLoadingMore={marketIsLoadingMore}
        hasMore={marketHasMore}
        isSearching={isSearching}
        searchResultsCount={searchResults.length}
        searchError={searchError}
        initialLoading={isInitialLoading}
      />

      <Chart
        selectedCoinData={selectedCoinData}
        chartData={chartData}
        modalVisible={modalVisible}
        closeModal={closeModal}
        isloading={isloading}
        coinHistoryData={coinHistoryData}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: space[4], marginBottom: space[3] },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: space[3], padding: space[3] },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35)
  },
  progressTrack: { height: 2, backgroundColor: colors.surface[3] },
  progressFill: { height: 2, backgroundColor: colors.gold[500] }
})

export default Main
