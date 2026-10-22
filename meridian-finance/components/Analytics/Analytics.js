import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { useSelector } from "react-redux"
import { FetchCoinHistoricalData } from "../../components/Api/Api"
import { coinSelector, userAssetsSelector } from "../../store/toolkitSelectors"
import { colors, space } from "../../theme"
import { Screen, ScreenHeader, EmptyState, Text } from "../ui"
import AllocationSection from "./sections/AllocationSection"
import HeaderCard from "./sections/HeaderCard"
import OverviewSection from "./sections/OverviewSection"
import RecommendSection from "./sections/RecommendSection"
import RiskSection from "./sections/RiskSection"

const Analytics = () => {
  const coinData = useSelector(coinSelector)
  const userAssets = useSelector(userAssetsSelector)

  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("24h")
  const [historicalChanges, setHistoricalChanges] = useState({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastCalculationTime, setLastCalculationTime] = useState({})
  const tabBarHeight = useBottomTabBarHeight()
  const navigation = useNavigation()

  // Маппинг timeframe на дни для CoinGecko API
  const getDaysForTimeframe = (tf) => {
    const daysMap = {
      "24h": 1, // 1 день (последние 24 часа)
      "7d": 7, // 7 дней
      "30d": 30, // 30 дней
      All: 365 // 1 год
    }
    return daysMap[tf] || 1
  }

  // Проверка нужно ли пересчитывать (кэширование на 10 минут)
  const shouldRecalculate = (coinId, tf) => {
    const cacheKey = `${coinId}_${tf}`
    const lastTime = lastCalculationTime[cacheKey]

    if (!lastTime) return true

    const TEN_MINUTES = 10 * 60 * 1000
    return Date.now() - lastTime > TEN_MINUTES
  }

  // Функция для получения изменения цены за период
  const getPriceChangeForPeriod = async (coinId, days) => {
    try {
      const prices = await FetchCoinHistoricalData(coinId, days)

      if (!prices || prices.length < 2) {
        return 0
      }

      const startPrice = prices[0][1] // [timestamp, price] - первая цена
      const endPrice = prices[prices.length - 1][1] // последняя цена

      const changePercent = ((endPrice - startPrice) / startPrice) * 100
      return changePercent
    } catch (error) {
      console.error(`Error getting ${days}d change for ${coinId}:`, error.message)
      return null // null означает ошибку
    }
  }

  // Загрузка исторических данных
  const fetchHistoricalData = useCallback(
    async (tf) => {
      if (tf === "24h") return // Для 24h используем готовые данные

      setIsCalculating(true)

      try {
        const newHistoricalData = { ...historicalChanges }
        const newCalculationTimes = { ...lastCalculationTime }
        let hasNewData = false

        const days = getDaysForTimeframe(tf)

        // Для каждого актива с amount > 0
        for (const coin of coinData) {
          const amount = userAssets[coin.id] || 0
          if (amount <= 0) continue

          const cacheKey = `${coin.id}_${tf}`

          // Проверяем кэш
          if (newHistoricalData[cacheKey] && !shouldRecalculate(coin.id, tf)) {
            continue // Данные свежие
          }

          try {
            const priceChange = await getPriceChangeForPeriod(coin.id, days)

            if (priceChange !== null) {
              newHistoricalData[cacheKey] = {
                priceChange,
                timestamp: Date.now(),
                days,
                isRealData: true
              }
            } else {
              // Если ошибка API - используем симуляцию
              const baseChange = coin.price_change_percentage_24h || 0
              const simulated = simulatePriceChange(baseChange, tf)

              newHistoricalData[cacheKey] = {
                priceChange: simulated,
                timestamp: Date.now(),
                days,
                isRealData: false,
                isSimulated: true
              }
            }

            newCalculationTimes[cacheKey] = Date.now()
            hasNewData = true
          } catch (error) {
            console.error(`Error processing ${coin.name}:`, error)
            // Fallback на симуляцию
            const baseChange = coin.price_change_percentage_24h || 0
            const simulated = simulatePriceChange(baseChange, tf)

            newHistoricalData[cacheKey] = {
              priceChange: simulated,
              timestamp: Date.now(),
              days,
              isRealData: false,
              isSimulated: true
            }
            newCalculationTimes[cacheKey] = Date.now()
            hasNewData = true
          }
        }

        if (hasNewData) {
          setHistoricalChanges(newHistoricalData)
          setLastCalculationTime(newCalculationTimes)
        }
      } catch (error) {
        console.error("Error in fetchHistoricalData:", error)
      } finally {
        setIsCalculating(false)
      }
    },
    [coinData, userAssets, historicalChanges, lastCalculationTime]
  )

  // Симуляция изменения цены (если API недоступен)
  const simulatePriceChange = (base24hChange, tf) => {
    const multipliers = {
      "7d": 2.5,
      "30d": 6.0,
      All: 15.0
    }
    const multiplier = multipliers[tf] || 1
    const randomFactor = 0.9 + Math.random() * 0.2 // ±10%
    return base24hChange * multiplier * randomFactor
  }

  // Получение изменения цены для актива
  const getPriceChangeForTimeframe = (coin, tf) => {
    if (tf === "24h") {
      return coin.price_change_percentage_24h || 0
    }

    const cacheKey = `${coin.id}_${tf}`
    const cachedData = historicalChanges[cacheKey]

    if (cachedData) {
      return cachedData.priceChange
    }

    return 0 // Данные еще не загружены
  }

  // Проверка наличия реальных данных
  const hasRealData = (coinId, tf) => {
    if (tf === "24h") return true
    const cachedData = historicalChanges[`${coinId}_${tf}`]
    return cachedData?.isRealData === true
  }

  // Проверка загружены ли данные
  const hasData = (coinId, tf) => {
    if (tf === "24h") return true
    return historicalChanges[`${coinId}_${tf}`] !== undefined
  }

  // Обработчик смены таймфрейма
  const handleTimeframeChange = async (tf) => {
    setTimeframe(tf)

    if (tf !== "24h") {
      await fetchHistoricalData(tf)
    }
  }

  // Инициализация
  useEffect(() => {
    const initialize = async () => {
      // Предзагружаем данные для 7d
      await fetchHistoricalData("7d")
      setLoading(false)
    }

    initialize()
  }, [])

  // Рассчет метрик портфеля
  const portfolioMetrics = useMemo(() => {
    if (!coinData.length) return null

    let allDataLoaded = true
    let hasSimulatedData = false

    // Шаг 1: Подготовка данных
    const assetsWithValues = coinData.reduce(
      (acc, coin) => {
        const amount = userAssets[coin.id] || 0
        if (amount <= 0) return acc

        const currentValue = amount * (coin.current_price || 0)
        const priceChange = getPriceChangeForTimeframe(coin, timeframe)
        const hasDataForCoin = hasData(coin.id, timeframe)
        const hasRealDataForCoin = hasRealData(coin.id, timeframe)

        const cachedData = historicalChanges[`${coin.id}_${timeframe}`]
        if (cachedData?.isSimulated) {
          hasSimulatedData = true
        }

        if (!hasDataForCoin && timeframe !== "24h") {
          allDataLoaded = false
        }

        return {
          ...acc,
          totalValue: acc.totalValue + currentValue,
          periodProfit: acc.periodProfit + currentValue * (priceChange / 100),
          assets: [
            ...acc.assets,
            {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              amount,
              value: currentValue,
              priceChange,
              hasData: hasDataForCoin,
              hasRealData: hasRealDataForCoin,
              allocation: 0
            }
          ]
        }
      },
      { totalValue: 0, periodProfit: 0, assets: [] }
    )

    const { totalValue, periodProfit, assets } = assetsWithValues

    if (assets.length === 0) return null

    // Шаг 2: Расчет аллокации
    const assetsWithAllocation = assets.map((asset) => ({
      ...asset,
      allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
    }))

    // Шаг 3: Сортировка по стоимости
    const sortedAssets = [...assetsWithAllocation].sort((a, b) => b.value - a.value)

    // Шаг 4: Находим лучший и худший актив (только с данными)
    const assetsWithData = sortedAssets.filter((asset) => asset.hasData || timeframe === "24h")

    const bestPerformer =
      assetsWithData.length > 0
        ? [...assetsWithData].sort((a, b) => b.priceChange - a.priceChange)[0]
        : sortedAssets[0]

    const worstPerformer =
      assetsWithData.length > 0
        ? [...assetsWithData].sort((a, b) => a.priceChange - b.priceChange)[0]
        : sortedAssets[0]

    // Шаг 5: Анализ распределения
    const allocationAnalysis = {
      top3: sortedAssets.slice(0, 3).reduce((sum, asset) => sum + asset.allocation, 0),
      concentration: sortedAssets.length > 0 ? sortedAssets[0].allocation : 0
    }

    // Шаг 6: Риск-метрики
    const calculatePortfolioVolatility = (assets) => {
      const assetsWithValidData = assets.filter((asset) => asset.hasData)
      if (assetsWithValidData.length === 0) return 0

      const avgVolatility =
        assetsWithValidData.reduce((sum, asset) => sum + Math.abs(asset.priceChange), 0) /
        assetsWithValidData.length

      return Math.min(avgVolatility, 100)
    }

    const calculateDiversificationScore = (assets) => {
      if (!assets.length) return 100

      const idealAllocation = 100 / assets.length
      const deviation = assets.reduce((sum, asset) => sum + Math.abs(asset.allocation - idealAllocation), 0)

      const maxDeviation = 200
      const score = Math.max(0, 100 - (deviation / maxDeviation) * 100)

      return Math.round(score)
    }

    const riskMetrics = {
      volatility: calculatePortfolioVolatility(sortedAssets),
      diversificationScore: calculateDiversificationScore(sortedAssets)
    }

    // Шаг 7: Изменение портфеля в %
    const portfolioChange = totalValue > 0 ? (periodProfit / totalValue) * 100 : 0

    // Шаг 8: Возвращение результата
    return {
      totalValue,
      periodProfit,
      portfolioChange,
      assets: sortedAssets,
      totalAssets: sortedAssets.length,
      bestPerformer,
      worstPerformer,
      allocationAnalysis,
      riskMetrics,
      timeframe,
      allDataLoaded,
      hasSimulatedData,
      dataStatus: allDataLoaded ? "complete" : "loading"
    }
  }, [coinData, userAssets, timeframe, historicalChanges])

  const header = (
    <ScreenHeader
      large
      eyebrow='Insights'
      title='Analytics'
      subtitle='Structure, performance and risk of your portfolio'
    />
  )

  if (loading) {
    return (
      <Screen>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size='large' color={colors.gold[500]} />
          <Text variant='caption' color='tertiary' style={{ marginTop: space[3] }}>
            Analyzing your portfolio…
          </Text>
        </View>
      </Screen>
    )
  }

  if (!portfolioMetrics || portfolioMetrics.totalAssets === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon='pie-chart-outline'
          eyebrow='Portfolio analysis'
          title='No data to analyze'
          body='Add holding amounts to your portfolio coins to unlock allocation, performance and risk insights.'
          action={{ label: "Open portfolio", icon: "star", onPress: () => navigation.navigate("Favorite") }}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space[4], paddingBottom: tabBarHeight + space[4] }}
      >
        <HeaderCard
          timeframe={timeframe}
          isCalculating={isCalculating}
          portfolioMetrics={portfolioMetrics}
          handleTimeframeChange={handleTimeframeChange}
        />
        <OverviewSection portfolioMetrics={portfolioMetrics} timeframe={timeframe} />
        <AllocationSection portfolioMetrics={portfolioMetrics} />
        <RiskSection portfolioMetrics={portfolioMetrics} />
        <RecommendSection portfolioMetrics={portfolioMetrics} timeframe={timeframe} />
        <Text variant='small' color='tertiary' align='center'>
          Data by CoinGecko · updates every 10 minutes
        </Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" }
})

export default Analytics
