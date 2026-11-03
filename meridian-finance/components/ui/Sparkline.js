import React, { useMemo } from "react"
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg"
import { colors } from "../../theme"

let uid = 0

// Мини-график из массива чисел (sparkline_in_7d.price)
export const Sparkline = ({ data, width = 80, height = 28, tone, strokeWidth = 1.5, fill = true }) => {
  const id = useMemo(() => `spark${uid++}`, [])
  const { line, area } = useMemo(() => {
    if (!data || data.length < 2) return { line: "", area: "" }
    // Прореживаем до ~40 точек ради производительности списка
    const step = Math.max(1, Math.floor(data.length / 40))
    const pts = data.filter((_, i) => i % step === 0 || i === data.length - 1)
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const range = max - min || 1
    const dx = width / (pts.length - 1)
    const coords = pts.map((v, i) => [i * dx, height - 2 - ((v - min) / range) * (height - 4)])
    const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
    const area = `${line} L${width} ${height} L0 ${height} Z`
    return { line, area }
  }, [data, width, height])

  if (!line) return null
  const resolved = tone || (data[data.length - 1] >= data[0] ? "up" : "down")
  const color = resolved === "gold" ? colors.gold[500] : colors[resolved].fg

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1='0' y1='0' x2='0' y2='1'>
          <Stop offset='0' stopColor={color} stopOpacity='0.35' />
          <Stop offset='1' stopColor={color} stopOpacity='0' />
        </LinearGradient>
      </Defs>
      {fill && <Path d={area} fill={`url(#${id})`} />}
      <Path
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        fill='none'
        strokeLinejoin='round'
        strokeLinecap='round'
      />
    </Svg>
  )
}

export default Sparkline
