import { Ionicons } from "@expo/vector-icons"
import React, { memo } from "react"
import { View, Image, StyleSheet } from "react-native"
import {
  PressableScale,
  Surface,
  Text,
  PriceText,
  PercentBadge,
  IconButton,
  Badge,
  Sparkline
} from "../../../components/ui"
import { colors, space, goldAlpha, responsive } from "../../../theme"

// Карточка актива портфеля: цена, изменение, количество, действия
const PremiumCoinCard = ({
  item,
  removingCoinId,
  userAssets,
  priceAlerts,
  openChartModal,
  openAlertModal,
  openAmountInput,
  removeFromFav
}) => {
  const isRemoving = removingCoinId === item.id
  const amount = (userAssets && userAssets[item.id]) || 0
  const value = amount * (item.current_price || 0)
  const alerts = priceAlerts.filter((a) => a.coinId === item.id && a.isActive && !a.triggeredAt).length
  const spark = item.sparkline_in_7d?.price

  return (
    <PressableScale
      scaleTo={0.975}
      onPress={() => openChartModal(item)}
      style={[styles.wrap, { width: responsive.gridCardWidth() }, isRemoving && { opacity: 0.4 }]}
    >
      <Surface variant='goldCase' radius='lg' shadow='card' style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={{ uri: item.image }} style={styles.logo} />
            </View>
            <View style={{ flex: 1, marginLeft: space[2] }}>
              <Text variant='h3' numberOfLines={1}>
                {item.symbol?.toUpperCase()}
              </Text>
              <View style={styles.rankRow}>
                <Text variant='small' color='tertiary' numberOfLines={1} style={{ flexShrink: 1 }}>
                  {item.name}
                </Text>
                {item.market_cap_rank <= 10 && (
                  <Ionicons name='diamond' size={10} color={colors.gold[400]} style={{ marginLeft: 4 }} />
                )}
              </View>
            </View>
            <IconButton
              name={alerts ? "notifications" : "notifications-outline"}
              size={30}
              iconSize={14}
              active={alerts > 0}
              onPress={() => openAlertModal(item)}
            />
          </View>

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <PriceText value={item.current_price} variant='mono' numberOfLines={1} adjustsFontSizeToFit />
              <PercentBadge value={item.price_change_percentage_24h} style={{ marginTop: 4 }} />
            </View>
            {spark && <Sparkline data={spark} width={64} height={26} />}
          </View>

          <PressableScale
            scaleTo={0.97}
            haptic='selection'
            onPress={() => openAmountInput(item)}
            style={styles.holding}
          >
            <View style={{ flex: 1 }}>
              <Text variant='label' color='tertiary'>
                Holding
              </Text>
              {amount ? (
                <>
                  <Text variant='caption' color='gold' tabular numberOfLines={1}>
                    {amount} {item.symbol?.toUpperCase()}
                  </Text>
                  <PriceText value={value} money variant='bodyStrong' numberOfLines={1} />
                </>
              ) : (
                <Text variant='caption' color='secondary'>
                  Tap to add amount
                </Text>
              )}
            </View>
            <Ionicons name='create-outline' size={16} color={colors.gold[500]} />
          </PressableScale>

          <View style={styles.footer}>
            {alerts > 0 ? (
              <Badge tone='gold' icon='notifications' label={`${alerts} alert${alerts > 1 ? "s" : ""}`} />
            ) : (
              <View />
            )}
            <IconButton
              name='trash-outline'
              size={30}
              iconSize={14}
              tone='down'
              haptic='medium'
              onPress={() => removeFromFav(item)}
            />
          </View>
        </View>
      </Surface>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  wrap: { margin: space[1] },
  inner: { padding: space[3] },
  header: { flexDirection: "row", alignItems: "center" },
  rankRow: { flexDirection: "row", alignItems: "center" },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.bg[3],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35)
  },
  logo: { width: 26, height: 26, borderRadius: 13 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: space[3] },
  holding: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space[3],
    padding: space[2],
    paddingHorizontal: space[3],
    borderRadius: 0,
    backgroundColor: goldAlpha(0.08),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3)
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space[3] }
})

export default memo(PremiumCoinCard)
