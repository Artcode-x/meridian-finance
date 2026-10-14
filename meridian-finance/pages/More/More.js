import { Ionicons } from "@expo/vector-icons"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"
import Constants from "expo-constants"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet, Linking } from "react-native"
import {
  Screen,
  ScreenHeader,
  Surface,
  Text,
  PressableScale,
  Divider,
  SectionHeader
} from "../../components/ui"
import { colors, space, goldAlpha } from "../../theme"

const Row = ({ icon, title, subtitle, onPress, last, tone = "gold" }) => (
  <PressableScale scaleTo={0.99} haptic='selection' onPress={onPress}>
    <View style={styles.row}>
      <View style={[styles.icon, tone !== "gold" && { backgroundColor: colors[tone].bg }]}>
        <Ionicons name={icon} size={17} color={tone === "gold" ? colors.gold[400] : colors[tone].fg} />
      </View>
      <View style={{ flex: 1, marginLeft: space[3] }}>
        <Text variant='bodyStrong'>{title}</Text>
        {subtitle && (
          <Text variant='caption' color='tertiary'>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name='chevron-forward' size={16} color={colors.text.tertiary} />
    </View>
    {!last && <Divider style={{ marginLeft: 64 }} />}
  </PressableScale>
)

const More = () => {
  const navigation = useNavigation()
  const tabBarHeight = useBottomTabBarHeight()
  const version = Constants.expoConfig?.version || "2.0.0"

  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarHeight + space[6] }}>
      <ScreenHeader
        large
        eyebrow='Crypto Tracker'
        title='More'
        subtitle='About the app, support and privacy'
      />

      <View style={styles.section}>
        <Surface variant='goldCase' radius='xl'>
          <View style={styles.brand}>
            <View style={styles.monoOuter}>
              <LinearGradient
                colors={[goldAlpha(0.3), goldAlpha(0.05)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mono}
              >
                <Ionicons name='pulse' size={26} color={colors.gold[400]} />
              </LinearGradient>
            </View>
            <View style={{ flex: 1, marginLeft: space[4] }}>
              <Text variant='h2'>Crypto Tracker</Text>
              <Text variant='caption' color='secondary'>
                Markets, portfolio, alerts and analytics — private by design.
              </Text>
              <Text variant='small' color='gold' style={{ marginTop: space[1] }}>
                Version {version}
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title='Project' />
        <Surface level={1} radius='lg'>
          <Row
            icon='heart-outline'
            title='Support us'
            subtitle='Voluntary donations keep the app free'
            onPress={() => navigation.navigate("SupportUs")}
          />
          <Row
            icon='shield-checkmark-outline'
            title='Privacy policy'
            subtitle='What stays on your device and what does not'
            onPress={() => navigation.navigate("PrivacyPolicy")}
            last
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title='Contact' />
        <Surface level={1} radius='lg'>
          <Row
            icon='mail-outline'
            title='Email the developer'
            subtitle='Alex-artcode@yandex.ru'
            tone='info'
            onPress={() => Linking.openURL("mailto:Alex-artcode@yandex.ru?subject=Crypto-Tracker")}
            last
          />
        </Surface>
      </View>

      <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[4] }}>
        Market data by CoinGecko & Binance{"\n"}© {new Date().getFullYear()} Alexander Butylev
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  brand: { flexDirection: "row", alignItems: "center", padding: space[4] },
  monoOuter: { borderRadius: 0, borderWidth: 1, borderColor: goldAlpha(0.3), padding: 3 },
  mono: { width: 56, height: 56, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: space[3], paddingHorizontal: space[4] },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3)
  }
})

export default More
