import { Platform } from "react-native"
import { colors } from "./colors"

const make = (color, opacity, radius, y, elevation) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: y }
    },
    android: { elevation },
    default: {}
  })

export const elevation = {
  none: {},
  card: make("#000", 0.35, 12, 6, 6),
  gold: make(colors.gold[500], 0.28, 16, 8, 10),
  sheet: make("#000", 0.5, 24, -8, 16)
}
