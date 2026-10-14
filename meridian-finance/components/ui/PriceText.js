import React from "react"
import { Badge } from "./Badge"
import { Text } from "./Text"
import { smartFormatNumber } from "../../helpers/helpers"

export const formatPrice = (value) => smartFormatNumber(Number(value) || 0, true)
export const formatMoney = (value) => (Number(value) ? smartFormatNumber(Number(value), false) : "$0.00")

export const PriceText = ({ value, money, variant = "mono", color, style, ...rest }) => (
  <Text variant={variant} color={color} tabular style={style} {...rest}>
    {money ? formatMoney(value) : formatPrice(value)}
  </Text>
)

export const PercentBadge = ({ value, size = "sm", showIcon = true, style }) => {
  const v = Number(value) || 0
  const tone = v > 0 ? "up" : v < 0 ? "down" : "neutral"
  const icon = !showIcon ? undefined : v > 0 ? "caret-up" : v < 0 ? "caret-down" : "remove"
  return <Badge tone={tone} icon={icon} size={size} label={`${Math.abs(v).toFixed(2)}%`} style={style} />
}

export default PriceText
