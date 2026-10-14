import { LinearGradient } from "expo-linear-gradient"
import React, { memo } from "react"
import { View, Image, StyleSheet } from "react-native"
import { colors, space, goldAlpha, responsive } from "../../theme"
import { PressableScale, Surface, Text, Sparkline, PriceText, PercentBadge, IconButton } from "../ui"

/**
 * Единая карточка монеты для рынка.
 * layout: "grid" (плитка) | "row" (строка списка)
 */
const CoinCard = ({ item, layout = "grid", isFavorite, onPress, onToggleFavorite, width }) => {
  const spark = item.sparkline_in_7d?.price
  const change = item.price_change_percentage_24h
  // Цвет графика и подсветки плитки — по направлению спарклайна (7d), иначе по 24h
  const sparkUp = spark?.length > 1 ? spark[spark.length - 1] >= spark[0] : (change ?? 0) >= 0
  const tone = sparkUp ? "up" : "down"
  const cardWidth = width || responsive.gridCardWidth()
  // Лёгкий цветной градиент сверху плитки по направлению 24h
  const tint = [tone === "up" ? "rgba(61,214,140,0.14)" : "rgba(240,82,95,0.14)", "transparent"]

  if (layout === "row") {
    return (
      <PressableScale scaleTo={0.985} onPress={() => onPress(item)} style={{ marginBottom: space[2] }}>
        <Surface level={1} radius='md' style={styles.row}>
          <View style={styles.rowInner}>
            <View style={styles.logoWrap}>
              <Image source={{ uri: item.image }} style={styles.logoSm} />
            </View>
            <View style={{ flex: 1, marginLeft: space[3], minWidth: 0 }}>
              <Text variant='bodyStrong' numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant='caption' color='tertiary' numberOfLines={1}>
                {item.symbol?.toUpperCase()}
                {item.market_cap_rank ? ` · #${item.market_cap_rank}` : ""}
              </Text>
            </View>
            <View style={styles.rowSpark}>{spark && <Sparkline data={spark} width={56} height={26} />}</View>
            <View style={styles.rowRight}>
              <PriceText value={item.current_price} variant='mono' />
              <PercentBadge value={change} style={{ marginTop: 3 }} />
            </View>
            <IconButton
              name={isFavorite ? "star" : "star-outline"}
              size={32}
              iconSize={16}
              active={isFavorite}
              onPress={() => onToggleFavorite(item)}
              style={{ marginLeft: space[2] }}
            />
          </View>
        </Surface>
      </PressableScale>
    )
  }

  return (
    <PressableScale
      scaleTo={0.97}
      onPress={() => onPress(item)}
      style={[styles.gridWrap, { width: cardWidth }]}
    >
      <Surface level={2} radius='lg' shadow='card' style={styles.grid}>
        <LinearGradient colors={tint} style={styles.tint} pointerEvents='none' />
        <View style={styles.gridInner}>
          <View style={styles.gridHeader}>
            <View style={styles.logoWrap}>
              <Image source={{ uri: item.image }} style={styles.logo} />
            </View>
            <IconButton
              name={isFavorite ? "star" : "star-outline"}
              size={30}
              iconSize={15}
              active={isFavorite}
              tone='neutral'
              onPress={() => onToggleFavorite(item)}
            />
          </View>
          <Text variant='h3' numberOfLines={1} style={{ marginTop: space[3] }}>
            {item.symbol?.toUpperCase()}
          </Text>
          <Text variant='caption' color='tertiary' numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.sparkArea}>
            {spark && <Sparkline data={spark} width={cardWidth} height={36} tone={tone} />}
          </View>
          <PriceText value={item.current_price} variant='mono' numberOfLines={1} adjustsFontSizeToFit />
          <PercentBadge value={change} style={{ marginTop: 4 }} />
        </View>
        {isFavorite && <View style={styles.favStripe} />}
      </Surface>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  gridWrap: { margin: space[1] },
  grid: { flex: 1 },
  gridInner: { padding: space[3] },
  tint: { position: "absolute", top: 0, left: 0, right: 0, height: 96 },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: colors.bg[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3)
  },
  logo: { width: 28, height: 28, borderRadius: 14 },
  logoSm: { width: 26, height: 26, borderRadius: 13 },
  // График на всю ширину плитки: компенсируем внутренние отступы
  sparkArea: { height: 36, marginVertical: space[2], marginHorizontal: -space[3] },
  favStripe: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 0,
    backgroundColor: colors.gold[500]
  },
  row: {},
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[3],
    paddingHorizontal: space[3]
  },
  rowSpark: { width: 56, alignItems: "center", marginHorizontal: space[2] },
  rowRight: { alignItems: "flex-end", minWidth: 80 }
})

export default memo(CoinCard)
