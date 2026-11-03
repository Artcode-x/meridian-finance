import { scale } from "./responsive"

export const font = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold"
}

// fontWeight дублируется для системного фолбэка, если шрифты не загрузились
export const type = {
  display: {
    fontSize: scale(32),
    lineHeight: scale(38),
    fontFamily: font.extrabold,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  h1: {
    fontSize: scale(24),
    lineHeight: scale(30),
    fontFamily: font.bold,
    fontWeight: "700",
    letterSpacing: -0.3
  },
  h2: { fontSize: 20, lineHeight: 26, fontFamily: font.bold, fontWeight: "700" },
  h3: { fontSize: 17, lineHeight: 22, fontFamily: font.semibold, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 21, fontFamily: font.regular, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontFamily: font.semibold, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: font.medium, fontWeight: "500" },
  small: { fontSize: 11, lineHeight: 15, fontFamily: font.medium, fontWeight: "500" },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: font.semibold,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  mono: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: font.semibold,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  }
}
