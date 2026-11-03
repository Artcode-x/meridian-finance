import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { space } from '../../theme';
import { Surface, Text, Skeleton } from '../ui';

// Карточка графика: заголовок, подзаголовок, состояния загрузки/пустоты, футер
export const ChartCard = ({
  title,
  subtitle,
  right,
  footer,
  loading,
  empty,
  emptyText = 'Chart data is unavailable',
  height = 220,
  children,
  style,
}) => (
  <Surface level={1} radius='lg' style={style}>
    <View style={styles.header}>
      <View>
        <Text variant='label' color='gold'>
          {title}
        </Text>
        {subtitle ? (
          <Text variant='small' color='tertiary' style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>

    <View style={[styles.body, { minHeight: height }]}>
      {loading ? (
        <View style={styles.center}>
          <Skeleton width='100%' height={height - 40} radius='md' />
        </View>
      ) : empty ? (
        <View style={styles.center}>
          <Ionicons name='analytics-outline' size={28} color='#8A8A8A' />
          <Text
            variant='caption'
            color='tertiary'
            align='center'
            style={styles.emptyText}
          >
            {emptyText}
          </Text>
        </View>
      ) : (
        children
      )}
    </View>

    {!loading && !empty ? footer : null}
    <View style={{ height: space[3] }} />
  </Surface>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  subtitle: { marginTop: 2 },
  body: { paddingBottom: space[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[4] },
  emptyText: { marginTop: space[2] },
});

export default ChartCard;
