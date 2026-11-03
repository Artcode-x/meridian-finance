import { Dimensions } from "react-native"

export const removeYearFromDate = (datesArray) => {
  const screenWidth = Dimensions.get("window").width
  const isTablet = screenWidth >= 600

  // Если уникальных дат меньше 5, генерируем нормальные метки
  // if (datesArray.length < 1) {
  //   return datesArray.map((_, index) => `${index + 1}`)
  // }

  return datesArray.map((date) => {
    const parts = date.split("/")
    const day = parseInt(parts[1], 10)
    const month = parseInt(parts[0], 10)

    const monthStr = month.toString().padStart(2, "0")

    if (isTablet) {
      return `${day}.${monthStr}`
    } else {
      return `${month}`
    }
  })
}

export const uniqueDates = (datesArray) => {
  // Используем Set для хранения уникальных значений
  const uniqueSet = new Set(datesArray)

  // Преобразуем Set обратно в массив
  return Array.from(uniqueSet)
}

// для меньших ТФ
export const getTimeLabels = (prices) => {
  // Извлекаем время из объектов
  const timeLabels = prices.map((item) => {
    // item.time имеет формат "дата, время"
    const time = item.time.split(", ")[0]
    // Преобразуем строку времени в объект Date
    const date = new Date(time)

    // Убираем секунды
    const test = time.split(":").slice(0, 2).join(":")
    // Форматируем дату и время
    const optionsDate = { day: "numeric", month: "long", year: "numeric" }
    const optionsTime = { hour: "2-digit", minute: "2-digit" }
    // Получаем читаемую дату и время
    const readableDate = date.toLocaleDateString("ru-RU", optionsDate)
    const readableTime = date.toLocaleTimeString("ru-RU", optionsTime)

    return `${readableTime}`
  })

  // return time.split(":").slice(0, 2).join(":")
  // })
  // Показываем максимум 10 меток
  const step = Math.ceil(timeLabels.length / 7)
  // Возвращаем только каждую n-ю метку
  return timeLabels.filter((_, index) => index % step === 0)
}

// для больших ТФ
export const formatTime = (prices) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return prices
    .map((item) => {
      const date = new Date(item.time)
      const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()]} ${String(
        date.getFullYear()
      ).slice(-2)}`
      return formattedDate
    })
    .filter((_, index, array) => index % Math.ceil(array.length / 7) === 0)
}

export const formatCryptoAmount = (amount) => {
  // ЗАЩИТА ОТ UNDEFINED И NULL
  if (amount === undefined || amount === null) {
    return "0"
  }

  // Преобразуем в число
  const numAmount = Number(amount)

  // Проверяем, что это валидное число
  if (isNaN(numAmount)) {
    return "0"
  }

  // Если 0 - возвращаем "0"
  if (numAmount === 0) return "0"

  // Преобразуем в строку
  let result = numAmount.toString()

  // Обработка десятичных знаков
  if (result.includes(".")) {
    // Убираем лишние нули в конце
    while (result.endsWith("0")) {
      result = result.slice(0, -1)
    }

    // Убираем точку если она в конце
    if (result.endsWith(".")) {
      result = result.slice(0, -1)
    }
  }

  // Форматирование больших чисел без десятичных знаков
  if (!result.includes(".") && result.length > 3) {
    try {
      result = parseInt(result).toLocaleString("en-US")
    } catch (error) {
      // В случае ошибки возвращаем как есть
      console.warn("Ошибка форматирования числа:", amount, error)
    }
  }

  return result
}

// Формат чисел для аналитики
export const formatNumber = (num, decimals = 2) => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(decimals)}M`
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(decimals)}K`
  }
  return `$${num.toFixed(decimals)}`
}

// Умное форматирование чисел с поддержкой очень маленьких значений для компонента Favorite (а точнее PremiumCoinCard в нем)
export const smartFormatNumber = (num, isPrice = false, isCrypto = false) => {
  if (num === 0 || num === null || num === undefined) return isPrice ? "$0.00" : "0"

  const absNum = Math.abs(num)

  // Для криптовалютных количеств (очень маленькие числа)
  if (isCrypto) {
    // Экстремально маленькие числа (< 0.00000001)
    if (absNum < 0.00000001) {
      return num.toExponential(4)
    }

    // Очень маленькие числа (< 0.001)
    if (absNum < 0.001) {
      // Ищем первую ненулевую цифру
      const str = absNum.toFixed(12)
      const match = str.match(/0\.0*([1-9])/)
      if (match) {
        const zerosBefore = match[0].length - 3 // количество нулей
        if (zerosBefore >= 4) {
          // Показываем как 0.0000...123
          const significant = str.substring(zerosBefore + 2)
          const firstSix = significant.substring(0, Math.min(6, significant.length))
          return `0.${"0".repeat(zerosBefore)}${firstSix}${firstSix.length === 6 ? "…" : ""}`
        }
      }
      return num.toFixed(8).replace(/(\.\d*?[1-9])0+$/, "$1")
    }

    // Средние числа
    if (absNum >= 1000000) {
      return (num / 1000000).toFixed(2) + "M"
    }

    if (absNum >= 1000) {
      return (num / 1000).toFixed(2) + "K"
    }

    // Стандартные числа
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  // Для цен активов (долларов)
  if (isPrice) {
    // Экстремально маленькие цены (< $0.000001)
    if (absNum < 0.000001) {
      const formatted = num.toFixed(12)
      const match = formatted.match(/0\.0*([1-9])/)
      if (match) {
        const zerosBefore = match[0].length - 3
        if (zerosBefore >= 4) {
          const significant = formatted.substring(zerosBefore + 2)
          const firstSix = significant.substring(0, Math.min(6, significant.length))
          return `$0.${"0".repeat(zerosBefore)}${firstSix}${firstSix.length === 6 ? "…" : ""}`
        }
      }
      return `$${num.toFixed(8)}`
    }

    // Маленькие цены (< $0.01)
    if (absNum < 0.01) {
      return `$${num.toFixed(6)}`
    }

    // Стандартные цены
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.abs(num) < 1 ? 6 : 2
    })}`
  }

  // Для денежных значений (стоимость в долларах)
  if (absNum < 0.01) {
    return "< $0.01"
  }

  if (absNum >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`
  }

  if (absNum >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`
  }

  if (absNum >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`
  }

  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Форматирование числа (потом в helpers)
export const formatCurrency = (num, decimals = 2) => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(decimals)}M`
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(decimals)}K`
  }
  return `$${num.toFixed(decimals)}`
}
