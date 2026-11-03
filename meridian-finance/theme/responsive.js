import { Dimensions, Platform } from "react-native"

const { width, height } = Dimensions.get("window")

export const screen = { width, height }
export const isTablet = width >= 768
export const isSmall = height < 700
export const columns = isTablet ? 3 : 2
export const isAndroid = Platform.OS === "android"
export const isIOS = Platform.OS === "ios"

// Масштаб для крупных заголовков на планшетах
export const scale = (n) => (isTablet ? Math.round(n * 1.2) : n)

// Ширина карточки в сетке с учётом горизонтальных отступов списка (12) и полей карточки (4)
export const gridCardWidth = (cols = columns, listPadding = 12, cardMargin = 4) =>
  (width - listPadding * 2) / cols - cardMargin * 2
