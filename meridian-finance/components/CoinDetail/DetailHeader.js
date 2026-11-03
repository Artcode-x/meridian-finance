import React from "react"
import { View, Image, StyleSheet } from "react-native"
import { colors, space, goldAlpha } from "../../theme"
import { Text, PriceText, PercentBadge, IconButton, Badge } from "../ui"

// Шапка детального листа монеты: лого, имя, цена, изменение
export const DetailHeader = ({ coin, onClose, right, subtitle, changeValue, changeLabel = "24h" }) => (
  <View style={styles.wrap}>
    <View style={styles.top}>
      <View style={styles.logoWrap}>
        <Image source={{ uri: coin?.image }} style={styles.logo} />
      </View>
      <View style={{ flex: 1, marginLeft: space[3] }}>
        <View style={styles.nameRow}>
          <Text variant='h2' numberOfLines={1} style={{ flexShrink: 1 }}>
            {coin?.name}
          </Text>
          {coin?.market_cap_rank && (
            <Badge label={`#${coin.market_cap_rank}`} tone='gold' style={{ marginLeft: space[2] }} />
          )}
        </View>
        <Text variant='caption' color='tertiary'>
          {coin?.symbol?.toUpperCase()}
          {subtitle ? ` · ${subtitle}` : ""}
        </Text>
      </View>
      {right}
      {onClose && <IconButton name='close' size={36} onPress={onClose} style={{ marginLeft: space[2] }} />}
    </View>
    <View style={styles.priceRow}>
      <PriceText value={coin?.current_price} variant='display' />
      <View style={{ marginLeft: space[3], alignItems: "flex-start" }}>
        <PercentBadge value={changeValue ?? coin?.price_change_percentage_24h} size='md' />
        <Text variant='small' color='tertiary' style={{ marginTop: 2 }}>
          {changeLabel}
        </Text>
      </View>
    </View>
  </View>
)

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: space[4] },
  top: { flexDirection: "row", alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center" },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.bg[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: goldAlpha(0.35)
  },
  logo: { width: 34, height: 34, borderRadius: 17 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: space[4] }
})

export default DetailHeader
