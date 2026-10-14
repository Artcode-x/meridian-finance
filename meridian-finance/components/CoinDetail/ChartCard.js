import React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { space } from "../../theme"
import { Surface, Text, Skeleton } from "../ui"

// Карточка графика с заголовком и состояниями загрузки/пустоты
export const ChartCard = ({
  title,
  right,
  loading,
  empty,
  emptyText = "Chart data is unavailable",
  height = 220,
  children,
  style
}) => (
  <Surface level={1} radius='lg' style={style}>
    <View style={styles.header}>
      <Text variant='label' color='gold'>
        {title}
      </Text>
      {right}
    </View>
    <View style={[styles.body, { minHeight: height }]}>
      {loading ? (
        <View style={styles.center}>
          <Skeleton width='90%' height={height - 40} radius='md' />
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <Text variant='caption' color='tertiary' align='center'>
            {emptyText}
          </Text>
        </View>
      ) : (
        children
      )}
    </View>
  </Surface>
)

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2]
  },
  body: { paddingBottom: space[3] },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[4] }
})

export default ChartCard
