import React, { useMemo } from "react"
import { View, ScrollView, StyleSheet, Dimensions } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { setChartDaysMain } from "../../store/reducersSlice"
import { mainDaySelector } from "../../store/toolkitSelectors"
import { space } from "../../theme"
import { DetailHeader, StatsGrid, TimeframeChips, ChartCard, GoldLineChart } from "../CoinDetail"
import { Sheet, Text, Badge, SectionHeader, formatPrice } from "../ui"

const TIMEFRAMES = [
  { label: "24H", value: 1 },
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 }
]

const compact = (num) => {
  if (!num && num !== 0) return "—"
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

// Детальный лист монеты с рынка: линейный график + статистика
export const Chart = ({ selectedCoinData: coin, chartData, modalVisible, closeModal, isloading }) => {
  const chartDays = useSelector(mainDaySelector)
  const dispatch = useDispatch()
  const { width } = Dimensions.get("window")

  const trend = useMemo(() => {
    const p = chartData?.prices
    if (!p || p.length < 2) return null
    const first = p[0]
    const last = p[p.length - 1]
    return { isUp: last >= first, pct: Math.abs(((last - first) / first) * 100).toFixed(2) }
  }, [chartData])

  const stats = coin
    ? [
        { label: "24h High", value: formatPrice(coin.high_24h), icon: "arrow-up", tone: "up" },
        { label: "24h Low", value: formatPrice(coin.low_24h), icon: "arrow-down", tone: "down" },
        { label: "Market cap", value: `$${compact(coin.market_cap)}`, icon: "layers-outline" },
        { label: "Volume 24h", value: `$${compact(coin.total_volume)}`, icon: "swap-vertical-outline" },
        {
          label: "7d change",
          value: `${coin.price_change_percentage_7d_in_currency?.toFixed(2) ?? "—"}%`,
          icon: "calendar-outline",
          tone: (coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "up" : "down"
        },
        { label: "All-time high", value: formatPrice(coin.ath), icon: "trophy-outline", tone: "gold" }
      ]
    : []

  return (
    <Sheet visible={modalVisible} onClose={closeModal} snapHeight='full'>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <DetailHeader coin={coin} onClose={closeModal} />

        <View style={styles.section}>
          <TimeframeChips
            options={TIMEFRAMES}
            value={chartDays}
            onChange={(v) => dispatch(setChartDaysMain(v))}
          />
        </View>

        <View style={styles.section}>
          <ChartCard
            title='Price'
            loading={isloading}
            empty={!chartData?.prices?.length}
            right={
              trend && !isloading ? (
                <Badge
                  tone={trend.isUp ? "up" : "down"}
                  icon={trend.isUp ? "trending-up" : "trending-down"}
                  label={`${trend.pct}% · ${TIMEFRAMES.find((t) => t.value === chartDays)?.label}`}
                />
              ) : null
            }
          >
            <GoldLineChart
              prices={chartData?.prices}
              labels={chartData?.labelDate}
              width={width - 48}
              height={210}
            />
          </ChartCard>
        </View>

        <View style={styles.section}>
          <SectionHeader title='Statistics' />
          <StatsGrid items={stats} />
        </View>

        {coin?.market_data && (
          <View style={styles.section}>
            <SectionHeader title='Supply' />
            <StatsGrid
              items={[
                { label: "Circulating", value: compact(coin.market_data.circulating_supply) },
                {
                  label: "Total",
                  value: coin.market_data.total_supply ? compact(coin.market_data.total_supply) : "∞"
                }
              ]}
            />
          </View>
        )}
        <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[4] }}>
          Data by CoinGecko
        </Text>
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: space[8] },
  section: { paddingHorizontal: space[4], marginBottom: space[4] }
})

export default Chart
