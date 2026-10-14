import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { LinearGradient } from "expo-linear-gradient"
import React, { useState, useRef } from "react"
import { View, StyleSheet, Linking } from "react-native"
import {
  Screen,
  ScreenHeader,
  Surface,
  Text,
  Button,
  IconButton,
  SectionHeader,
  Toast,
  Divider
} from "../../components/ui"
import { colors, space, goldAlpha, font } from "../../theme"

const USDT_WALLET = "TLwXzzrTvXXD4iVAPeXAT3TwLRBpZswMDt"
const CONTACT_EMAIL = "Alex-artcode@yandex.ru"

const Cost = ({ icon, text }) => (
  <View style={styles.cost}>
    <Ionicons name={icon} size={15} color={colors.gold[400]} />
    <Text variant='caption' color='secondary' style={{ marginLeft: space[3], flex: 1 }}>
      {text}
    </Text>
  </View>
)

const SupportUs = () => {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const copyWallet = async () => {
    try {
      await Clipboard.setStringAsync(USDT_WALLET)
      clearTimeout(timer.current)
      setToast("Wallet address copied")
      timer.current = setTimeout(() => setToast(null), 1800)
    } catch {
      setToast("Could not copy")
      timer.current = setTimeout(() => setToast(null), 1800)
    }
  }

  return (
    <Screen scroll contentStyle={{ paddingBottom: space[8] }}>
      <ScreenHeader back title='Support us' subtitle='Voluntary donations keep the project running' />

      <View style={styles.section}>
        <Surface variant='goldCase' radius='xl' shadow='card'>
          <View style={styles.hero}>
            <View style={styles.emblemWrap}>
              <LinearGradient
                colors={[goldAlpha(0.3), goldAlpha(0.05)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emblem}
              >
                <Ionicons name='heart' size={26} color={colors.gold[400]} />
              </LinearGradient>
            </View>
            <Text variant='h2' style={{ marginTop: space[4] }}>
              Independent, free, no ads
            </Text>
            <Text variant='body' color='secondary' style={{ marginTop: space[2] }}>
              Crypto Tracker is built by one developer. Donations offset server, API and tooling costs — the
              app stays fully functional whether you donate or not.
            </Text>
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title='Donate with USDT' subtitle='TRC20 network only' />
        <Surface level={1} radius='lg'>
          <View style={styles.wallet}>
            <View style={styles.walletHead}>
              <View style={styles.chainIcon}>
                <Text variant='label' color='gold'>
                  ₮
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: space[3] }}>
                <Text variant='bodyStrong'>USDT · Tether</Text>
                <Text variant='small' color='tertiary'>
                  TRON (TRC20)
                </Text>
              </View>
              <IconButton name='copy-outline' active onPress={copyWallet} />
            </View>
            <View style={styles.address}>
              <Text variant='caption' color='primary' style={styles.mono} selectable>
                {USDT_WALLET}
              </Text>
            </View>
            <Button
              variant='outline'
              title='Copy address'
              icon='copy'
              fullWidth
              onPress={copyWallet}
              style={{ marginTop: space[3] }}
            />
            <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[3] }}>
              Sending on a different network will result in permanent loss of funds.
            </Text>
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title='What donations cover' />
        <Surface level={1} radius='lg' padding={4}>
          <Cost icon='server-outline' text='Server hosting and 24/7 alert monitoring' />
          <Cost icon='swap-horizontal-outline' text='Market data API subscriptions' />
          <Cost icon='construct-outline' text='Development tools and licenses' />
          <Cost icon='shield-checkmark-outline' text='Security updates and maintenance' />
        </Surface>
      </View>

      <View style={styles.section}>
        <Surface level={1} radius='lg' padding={4} style={{ borderColor: colors.warning.border }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name='information-circle' size={18} color={colors.warning.fg} />
            <Text variant='caption' color='secondary' style={{ flex: 1, marginLeft: space[3] }}>
              <Text variant='caption' color='primary'>
                Important:{" "}
              </Text>
              this is a voluntary donation, not a purchase. No goods, services or premium features are sold.
              Donations are final and non-refundable and do not guarantee specific updates.
            </Text>
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <Divider gold spacing={space[2]} />
        <Text variant='caption' color='secondary' align='center' style={{ marginTop: space[3] }}>
          Questions, confirmations or transparency reports:
        </Text>
        <Button
          variant='ghost'
          size='sm'
          title={CONTACT_EMAIL}
          icon='mail-outline'
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Crypto-Tracker Support Inquiry`)}
          style={{ alignSelf: "center", marginTop: space[2] }}
        />
        <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[4] }}>
          © {new Date().getFullYear()} Alexander Butylev · Crypto Tracker{"\n"}Independent development
          project. Not a financial institution.
        </Text>
      </View>

      <Toast message={toast} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  hero: { padding: space[4], alignItems: "flex-start" },
  emblemWrap: { borderRadius: 0, borderWidth: 1, borderColor: goldAlpha(0.3), padding: 3 },
  emblem: { width: 60, height: 60, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  wallet: { padding: space[4] },
  walletHead: { flexDirection: "row", alignItems: "center" },
  chainIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35)
  },
  address: {
    marginTop: space[3],
    padding: space[3],
    borderRadius: 0,
    backgroundColor: colors.bg[1],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default
  },
  mono: { fontFamily: font.semibold, letterSpacing: 0.6 },
  cost: { flexDirection: "row", alignItems: "center", paddingVertical: space[2] }
})

export default SupportUs
