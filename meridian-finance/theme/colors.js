// Единый источник цветов приложения. Все компоненты берут цвета отсюда.
export const goldAlpha = (a) => `rgba(212,175,55,${a})`
export const whiteAlpha = (a) => `rgba(245,243,236,${a})`
export const blackAlpha = (a) => `rgba(0,0,0,${a})`

export const colors = {
  bg: { 0: "#07070B", 1: "#0A0A0F", 2: "#0F1016", 3: "#14151D", 4: "#1B1C26" },
  surface: {
    1: "rgba(255,255,255,0.04)",
    2: "rgba(255,255,255,0.07)",
    3: "rgba(255,255,255,0.11)"
  },
  line: {
    subtle: "rgba(255,255,255,0.06)",
    default: "rgba(255,255,255,0.10)",
    strong: "rgba(255,255,255,0.18)",
    gold: goldAlpha(0.35)
  },
  gold: {
    300: "#F1DC9A",
    400: "#E6C665",
    500: "#D4AF37",
    600: "#B8942B",
    700: "#8F711F"
  },
  text: {
    primary: "#F5F3EC",
    secondary: "rgba(245,243,236,0.68)",
    tertiary: "rgba(245,243,236,0.42)",
    disabled: "rgba(245,243,236,0.26)",
    inverse: "#0A0A0F",
    gold: "#D4AF37"
  },
  up: { fg: "#3DD68C", bg: "rgba(61,214,140,0.12)", border: "rgba(61,214,140,0.3)" },
  down: { fg: "#F0525F", bg: "rgba(240,82,95,0.12)", border: "rgba(240,82,95,0.3)" },
  warning: { fg: "#F2B94B", bg: "rgba(242,185,75,0.12)", border: "rgba(242,185,75,0.3)" },
  info: { fg: "#6FA8FF", bg: "rgba(111,168,255,0.12)", border: "rgba(111,168,255,0.3)" },
  overlay: "rgba(4,4,8,0.72)",
  gradients: {
    goldCase: ["rgba(48,46,40,0.96)", "rgba(20,21,27,0.96)"],
    goldStroke: ["#F1DC9A", "#D4AF37", "#8F711F"],
    goldButton: ["#E6C665", "#D4AF37", "#B8942B"],
    goldHairline: ["transparent", goldAlpha(0.7), "transparent"],
    goldWash: [goldAlpha(0.08), "transparent"],
    header: ["#14151D", "#0A0A0F"],
    screen: ["#0F1016", "#0A0A0F", "#0A0A0F"]
  }
}

export const toneColors = {
  up: colors.up,
  down: colors.down,
  warning: colors.warning,
  info: colors.info,
  gold: { fg: colors.gold[500], bg: goldAlpha(0.12), border: goldAlpha(0.35) },
  neutral: { fg: colors.text.secondary, bg: colors.surface[2], border: colors.line.default }
}
