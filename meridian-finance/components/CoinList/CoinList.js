import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { FlatList, View, RefreshControl, StyleSheet } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { rewriteFavorite, setCoin, setDuplicate } from "../../store/reducersSlice"
import { coinSelector } from "../../store/toolkitSelectors"
import { colors, space, responsive } from "../../theme"
import CoinCard from "../CoinCard/CoinCard"
import { Text, Skeleton, EmptyState, Toast } from "../ui"

const SkeletonGrid = ({ columns }) => (
  <View style={styles.skeletonWrap}>
    {Array.from({ length: columns * 3 }).map((_, i) => (
      <View key={i} style={[styles.skeletonCard, { width: `${100 / columns}%` }]}>
        <Skeleton height={150} radius='lg' />
      </View>
    ))}
  </View>
)

const CoinList = ({
  data,
  openModal,
  search,
  refreshing,
  setRefreshing,
  fetchMarketData,
  errorMessage,
  loadMoreData,
  isLoadingMore,
  hasMore,
  isSearching,
  searchResultsCount,
  searchError,
  layout = "grid",
  initialLoading
}) => {
  const favoriteCoins = useSelector(coinSelector)
  const dispatch = useDispatch()
  const tabBarHeight = useBottomTabBarHeight()
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const endReachedLock = useRef(false)

  const columns = layout === "row" ? 1 : responsive.columns

  // Синхронизация цен избранного с рыночными данными
  useEffect(() => {
    if (!data) return
    const updated = []
    data.forEach((coin) => {
      const fav = favoriteCoins.find((f) => f.id === coin.id)
      if (fav && fav.current_price !== coin.current_price) {
        updated.push({
          name: coin.name,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          image: coin.image,
          otherInfo: coin.otherInfo,
          market_cap_rank: coin.market_cap_rank,
          symbol: coin.symbol,
          id: coin.id
        })
      }
    })
    if (updated.length) dispatch(rewriteFavorite(updated))
  }, [data])

  const showToast = useCallback((t) => {
    clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), 1600)
  }, [])

  const toggleFavorite = useCallback(
    (item) => {
      const exists = favoriteCoins.some((f) => f.id === item.id)
      if (exists) {
        dispatch(setDuplicate(item.id))
        showToast({
          message: `${item.symbol?.toUpperCase()} is already in your portfolio`,
          icon: "star",
          tone: "warning"
        })
        return
      }
      dispatch(
        setCoin({
          name: item.name,
          current_price: item.current_price,
          price_change_percentage_24h: item.price_change_percentage_24h,
          image: item.image,
          otherInfo: item.otherInfo,
          market_cap_rank: item.market_cap_rank,
          symbol: item.symbol,
          id: item.id
        })
      )
      showToast({
        message: `${item.symbol?.toUpperCase()} added to portfolio`,
        icon: "checkmark-circle",
        tone: "gold"
      })
    },
    [favoriteCoins, dispatch, showToast]
  )

  const validData = useMemo(
    () => (Array.isArray(data) ? data.filter((i) => i && i.id && i.name) : []),
    [data]
  )
  const favoriteIds = useMemo(() => new Set(favoriteCoins.map((f) => f.id)), [favoriteCoins])

  const renderItem = useCallback(
    ({ item }) => (
      <CoinCard
        item={item}
        layout={layout}
        isFavorite={favoriteIds.has(item.id)}
        onPress={openModal}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [layout, favoriteIds, openModal, toggleFavorite]
  )

  const handleEndReached = useCallback(() => {
    if (search || isLoadingMore || !hasMore || !loadMoreData || isSearching || endReachedLock.current) return
    endReachedLock.current = true
    loadMoreData()
    setTimeout(() => (endReachedLock.current = false), 1500)
  }, [search, isLoadingMore, hasMore, loadMoreData, isSearching])

  const header = useMemo(() => {
    if (!search || search.length < 2) return null
    if (searchError) {
      return (
        <View style={styles.status}>
          <Text variant='caption' color='down' align='center'>
            {searchError}
          </Text>
        </View>
      )
    }
    if (isSearching) {
      return (
        <View style={styles.status}>
          <Skeleton width={160} height={14} />
        </View>
      )
    }
    if (searchResultsCount === 0) {
      return (
        <EmptyState
          compact
          icon='search-outline'
          title={`No results for “${search}”`}
          body='Try a different name or ticker.'
        />
      )
    }
    return (
      <View style={styles.status}>
        <Text variant='label' color='gold'>
          {searchResultsCount} results
        </Text>
      </View>
    )
  }, [search, searchError, isSearching, searchResultsCount])

  const empty = useMemo(() => {
    if (search || isLoadingMore || refreshing || isSearching) return null
    if (initialLoading) return <SkeletonGrid columns={columns} />
    return (
      <EmptyState
        icon='cloud-offline-outline'
        eyebrow='Markets'
        title='Nothing to show yet'
        body={errorMessage || "Market data is unavailable right now."}
        action={{ label: "Reload", icon: "refresh", onPress: fetchMarketData }}
      />
    )
  }, [search, isLoadingMore, refreshing, isSearching, initialLoading, errorMessage, columns, fetchMarketData])

  const footer = useMemo(() => {
    if (!isLoadingMore || search) return <View style={{ height: space[2] }} />
    return <SkeletonGrid columns={columns} />
  }, [isLoadingMore, search, columns])

  return (
    <>
      <FlatList
        key={`${layout}-${columns}`}
        data={validData}
        numColumns={columns}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          columns === 1 && { paddingHorizontal: space[4] },
          { paddingBottom: tabBarHeight + space[4] }
        ]}
        columnWrapperStyle={columns > 1 ? { paddingHorizontal: space[3] } : undefined}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await fetchMarketData()
              setRefreshing(false)
            }}
            colors={[colors.gold[500]]}
            tintColor={colors.gold[500]}
            progressBackgroundColor={colors.bg[2]}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={9}
        removeClippedSubviews
      />
      <Toast message={toast?.message} icon={toast?.icon} tone={toast?.tone} bottomOffset={tabBarHeight} />
    </>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space[1] },
  status: { paddingHorizontal: space[4], paddingVertical: space[3], alignItems: "center" },
  skeletonWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: space[3] },
  skeletonCard: { padding: space[1] }
})

export default CoinList
