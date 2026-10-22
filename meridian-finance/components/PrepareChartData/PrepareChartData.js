import { removeYearFromDate, uniqueDates } from "../../helpers/helpers"

export const prepareChartData = (data) => {
  const labels = data.map(([timestamp]) => new Date(timestamp).toLocaleDateString()) // Получаем метки для графика

  const uniquedates = uniqueDates(labels)
  const labelDate = removeYearFromDate(uniquedates)
  const prices = data.map(([, price]) => price)
  return { labelDate, prices }
}

export default prepareChartData
