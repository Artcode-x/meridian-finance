import { chartPalette, chartColorAt } from "./chartPalette"
import { colors, goldAlpha, whiteAlpha, blackAlpha, toneColors } from "./colors"
import * as responsive from "./responsive"
import { elevation } from "./shadows"
import { space, radius, hitSlop } from "./spacing"
import { type, font } from "./typography"

export const theme = {
  colors,
  toneColors,
  goldAlpha,
  whiteAlpha,
  blackAlpha,
  space,
  radius,
  hitSlop,
  type,
  font,
  elevation,
  responsive,
  chartPalette,
  chartColorAt
}

export const useTheme = () => theme

export {
  colors,
  goldAlpha,
  whiteAlpha,
  blackAlpha,
  toneColors,
  space,
  radius,
  hitSlop,
  type,
  font,
  elevation,
  responsive,
  chartPalette,
  chartColorAt
}
