import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import React from "react"
import { View, StyleSheet, TextInput } from "react-native"
import { IconButton } from "./IconButton"
import { Text } from "./Text"
import { colors, space, radius, goldAlpha } from "../../theme"

/**
 * Заголовок экрана. large — крупный титул с подзаголовком; back — кнопка назад;
 * right — узел справа; search — { value, onChange, placeholder, visible }
 */
export const ScreenHeader = ({
  title,
  subtitle,
  eyebrow,
  large,
  back,
  right,
  left,
  search,
  style,
  children
}) => {
  const navigation = useNavigation()
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {back && (
            <IconButton
              name='chevron-back'
              size={40}
              onPress={() => navigation.goBack()}
              style={{ marginRight: space[3] }}
            />
          )}
          <View style={{ flex: 1 }}>
            {eyebrow && (
              <Text variant='label' color='gold' style={{ marginBottom: 2 }}>
                {eyebrow}
              </Text>
            )}
            {left}
            {title && (
              <Text variant={large ? "h1" : "h2"} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant='caption' color='tertiary' style={{ marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {right && <View style={styles.right}>{right}</View>}
      </View>
      {search && search.visible !== false && (
        <View style={styles.search}>
          <Ionicons name='search' size={16} color={colors.text.tertiary} />
          <TextInput
            value={search.value}
            onChangeText={search.onChange}
            placeholder={search.placeholder || "Search"}
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize='none'
            returnKeyType='search'
            selectionColor={colors.gold[500]}
            autoFocus={search.autoFocus}
          />
          {!!search.value && (
            <IconButton
              name='close'
              size={26}
              iconSize={14}
              onPress={() => search.onChange("")}
              haptic={null}
            />
          )}
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[3] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: space[2], marginLeft: space[3] },
  search: {
    marginTop: space[3],
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingLeft: space[3],
    paddingRight: space[2],
    borderRadius: radius.md,
    backgroundColor: colors.surface[2],
    borderWidth: 1,
    borderColor: goldAlpha(0.25)
  },
  input: {
    flex: 1,
    marginLeft: space[2],
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
    paddingVertical: 0,
    minWidth: 0,
    outlineStyle: "none"
  }
})

export default ScreenHeader
