import React, { useState, useCallback, useEffect } from "react"
import { View, ScrollView, StyleSheet, Dimensions } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import CandlestickChart from "./components/CandlestickChart/CandlestickChart"
import { VolumeChart } from "./components/VolumeChart/VolumeChart"
import { FetchCandleData, Get24hrMinMaxPrices, GetSantiment } from "../../../components/Api/Api"
import { DetailHeader, StatsGrid, TimeframeChips, ChartCard } from "../../../components/CoinDetail"
import { Sheet, Surface, Text, SectionHeader, ArcGauge, Badge, formatPrice } from "../../../components/ui"
import { setChartDays } from "../../../store/reducersSlice"
import { doubleTap } from "../../../store/toolkitSelectors"
import { colors, space } from "../../../theme"

const { width: W, height: H } = Dimensions.get("window")

const TIMEFRAMES = [
  { key: "1h", label: "1H" },
  { key: "4h", label: "4H" },
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1M", label: "1M" }
]

const FEAR_GREED_STOPS = [colors.down.fg, colors.warning.fg, colors.gold[400], colors.up.fg]

const sentimentTone = (label = "") => {
  const l = label.toLowerCase()
  if (l.includes("greed")) return "up"
  if (l.includes("fear")) return "down"
  return "neutral"
}

// Детальный лист монеты из портфеля: свечи Binance, объём, индекс страха и жадности
const ModalFavorite = ({ visible, onClose, selectedCoin, chartDays }) => {
  const [prices, setPrices] = useState([])
  const [minMax, setMinMax] = useState({ minPrice: null, maxPrice: null })
  const [loadingChart, setLoadingChart] = useState(false)
  const [limit, setLimit] = useState(100)
  const [santiment, setSantiment] = useState(null)
  const [fearGreedValue, setFearGreedValue] = useState(null)
  const [coinName, setCoinName] = useState(null)

  const dispatch = useDispatch()
  const flagDoubleTap = useSelector(doubleTap)

  const fetchChartData = useCallback(async (coin, days, limitParam) => {
    if (!coin) return
    setLoadingChart(true)
    try {
      const symbol = coin.symbol.toUpperCase()
      setCoinName(symbol)
      const [minMaxPrice, candlePrices] = await Promise.all([
        Get24hrMinMaxPrices(symbol),
        FetchCandleData(symbol, days, limitParam)
      ])
      const response = await GetSantiment()
      if (response?.value != null && response?.classification) {
        setSantiment(response.classification)
        setFearGreedValue(parseInt(response.value))
      } else {
        setSantiment(null)
      }
      setPrices(candlePrices || [])
      setMinMax({ minPrice: minMaxPrice.minPrice, maxPrice: minMaxPrice.maxPrice })
    } catch (error) {
      console.error(error.message)
      setPrices([])
      setSantiment(null)
      setFearGreedValue(null)
    } finally {
      setLoadingChart(false)
    }
  }, [])

  // Сброс состояния при смене монеты
  useEffect(() => {
    if (selectedCoin) {
      setPrices([])
      setMinMax({ minPrice: null, maxPrice: null })
      setSantiment(null)
      setFearGreedValue(null)
      setCoinName(null)
    }
  }, [selectedCoin])

  useEffect(() => {
    if (selectedCoin && visible) fetchChartData(selectedCoin, chartDays, limit)
  }, [chartDays, selectedCoin, visible, flagDoubleTap])

  const current = prices.length ? prices[prices.length - 1] : null
  const chartWidth = W - 48
  const chartHeight = Math.round(H * 0.3)
  const tfLabel = TIMEFRAMES.find((t) => t.key === chartDays)?.label

  const rangeStats = [
    {
      label: "24h Low",
      value: minMax.minPrice && !isNaN(minMax.minPrice) ? formatPrice(minMax.minPrice) : "—",
      icon: "arrow-down",
      tone: "down"
    },
    {
      label: "24h High",
      value: minMax.maxPrice && !isNaN(minMax.maxPrice) ? formatPrice(minMax.maxPrice) : "—",
      icon: "arrow-up",
      tone: "up"
    }
  ]
  const candleStats = current
    ? [
        { label: "Open", value: formatPrice(current.open) },
        { label: "Close", value: formatPrice(current.close) },
        { label: "Low", value: formatPrice(current.low), tone: "down" },
        { label: "High", value: formatPrice(current.high), tone: "up" }
      ]
    : []

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight='full'>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <DetailHeader coin={selectedCoin} onClose={onClose} subtitle={`Binance · ${tfLabel || chartDays}`} />

        {coinName === "BTC" && santiment && fearGreedValue != null && (
          <View style={styles.section}>
            <Surface variant='goldCase' radius='lg' padding={4}>
              <View style={styles.fgHeader}>
                <Text variant='label' color='gold'>
                  Fear & Greed index
                </Text>
                <Badge tone={sentimentTone(santiment)} label={santiment} />
              </View>
              <View style={{ alignItems: "center", marginTop: space[3] }}>
                <ArcGauge value={fearGreedValue} size={200} stops={FEAR_GREED_STOPS} label={santiment} />
              </View>
              <View style={styles.fgScale}>
                <Text variant='small' color='down'>
                  Extreme fear
                </Text>
                <Text variant='small' color='up'>
                  Extreme greed
                </Text>
              </View>
            </Surface>
          </View>
        )}

        <View style={styles.section}>
          <TimeframeChips
            options={TIMEFRAMES.map((t) => ({ label: t.label, value: t.key }))}
            value={chartDays}
            onChange={(v) => dispatch(setChartDays(v))}
          />
        </View>

        <View style={styles.section}>
          <ChartCard
            title='Candles'
            height={chartHeight + 24}
            loading={loadingChart}
            empty={!prices.length}
            emptyText='Detailed candles are available only for coins listed on Binance.'
            right={prices.length ? <Badge tone='gold' label={`${limit} candles`} /> : null}
          >
            <CandlestickChart
              data={prices}
              width={chartWidth}
              height={chartHeight}
              limit={limit}
              setLimit={setLimit}
            />
          </ChartCard>
        </View>

        {!loadingChart && prices.length > 0 && (
          <>
            <View style={styles.section}>
              <SectionHeader title='Last candle' />
              <StatsGrid items={candleStats} columns={4} />
            </View>
            <View style={styles.section}>
              <ChartCard title='Volume' height={110}>
                <View style={{ paddingHorizontal: space[4] }}>
                  <VolumeChart candles={prices} width={chartWidth - 8} height={96} />
                </View>
              </ChartCard>
            </View>
          </>
        )}

        <View style={styles.section}>
          <SectionHeader title='24h range' />
          <StatsGrid items={rangeStats} />
        </View>

        <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[2] }}>
          Candles by Binance · Sentiment by alternative.me
        </Text>
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: space[8] },
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  fgHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fgScale: { flexDirection: "row", justifyContent: "space-between", marginTop: space[2] }
})

export default ModalFavorite
