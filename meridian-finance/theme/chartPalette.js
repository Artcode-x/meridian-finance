// Палитра для долей портфеля (donut): золото → бронза → нейтральные.
export const chartPalette = [
  "#D4AF37",
  "#E6C665",
  "#B8942B",
  "#8F711F",
  "#C9B48A",
  "#8C8778",
  "#5E5A52",
  "#3E3B36"
]

export const chartColorAt = (index) => chartPalette[index % chartPalette.length]
