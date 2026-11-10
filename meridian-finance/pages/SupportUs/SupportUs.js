import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import {
  Screen,
  ScreenHeader,
  Surface,
  Text,
  Button,
  IconButton,
  SectionHeader,
  Toast,
  Divider,
  PressableScale,
} from '../../components/ui';
import { colors, space, goldAlpha, font } from '../../theme';

const BTC_WALLET = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const CONTACT_EMAIL = 'neonlabs.dev@gmail.com';

// ── Content (edit here, keep it truthful) ────────────────────────────────────

const PRINCIPLES = [
  {
    icon: 'ban-outline',
    title: 'No ads, no trackers',
    text: 'The app never sells your attention or your data. There are no ad SDKs inside.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Your portfolio stays private',
    text: 'Holdings are encrypted. Nobody, including the developer, browses your positions.',
  },
  {
    icon: 'infinite-outline',
    title: 'Everything is free',
    text: 'No paywalls and no premium tier. A donation never unlocks anything, and not donating never limits anything.',
  },
];

const FUNDING = [
  {
    icon: 'cloud-outline',
    title: 'Servers and uptime',
    text: 'Hosting for the backend that calculates portfolios in real time and delivers push alerts.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Market data',
    text: 'Price feeds and historical candles. Reliable data is the largest recurring cost.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Security and maintenance',
    text: 'Dependency updates, patches and compatibility fixes for new Android and iOS releases.',
  },
  {
    icon: 'hammer-outline',
    title: 'Tooling and design',
    text: 'Developer accounts, build services, fonts and design assets.',
  },
];

const ROADMAP = [
  {
    icon: 'analytics-outline',
    title: 'Chart indicators',
    text: 'Moving-average crossovers, Bollinger Bands and more tools for reading the market.',
  },
  {
    icon: 'notifications-outline',
    title: 'Smarter alerts',
    text: 'More alert conditions beyond a simple price level, with less noise.',
  },
  {
    icon: 'albums-outline',
    title: 'Wider asset coverage',
    text: 'More coins and trading pairs, faster after listing.',
  },
];

const FAQ = [
  {
    q: 'Do I get anything for donating?',
    a: 'No. Donations are a thank-you, not a purchase. Every feature is available to everyone.',
  },
  {
    q: 'Why Bitcoin only?',
    a: 'It keeps payments simple and avoids card processors and middlemen. The address is a native SegWit address (bc1q…) on the Bitcoin network.',
  },
  {
    q: 'Is there a minimum amount?',
    a: 'No. Network fees vary, so very small transfers may cost more in fees than they are worth.',
  },
  {
    q: 'Can I get a receipt or a refund?',
    a: 'Blockchain transfers cannot be reversed, so donations are non-refundable. If you need the transaction confirmed for your records, email the developer with the transaction ID.',
  },
  {
    q: 'How do I know the address is correct?',
    a: 'Compare the first and last characters with the address in this screen, or ask by email. The address is never delivered through chat, social media or direct messages.',
  },
];

// ── Small building blocks ────────────────────────────────────────────────────

const Feature = ({ icon, title, text, last }) => (
  <View>
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={17} color={colors.gold[400]} />
      </View>
      <View style={{ flex: 1, marginLeft: space[3] }}>
        <Text variant='bodyStrong'>{title}</Text>
        <Text variant='caption' color='secondary' style={{ marginTop: 2 }}>
          {text}
        </Text>
      </View>
    </View>
    {!last && <Divider style={{ marginLeft: 64 }} />}
  </View>
);

const FaqItem = ({ q, a, open, onToggle, last }) => (
  <View>
    <PressableScale scaleTo={0.995} haptic='selection' onPress={onToggle}>
      <View style={styles.faqHead}>
        <Text variant='bodyStrong' style={{ flex: 1, paddingRight: space[3] }}>
          {q}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </View>
    </PressableScale>
    {open && (
      <Text variant='caption' color='secondary' style={styles.faqBody}>
        {a}
      </Text>
    )}
    {!last && <Divider />}
  </View>
);

const shortAddress = `${BTC_WALLET.slice(0, 8)}…${BTC_WALLET.slice(-8)}`;

// ── Screen ───────────────────────────────────────────────────────────────────

const SupportUs = () => {
  const [toast, setToast] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (message) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), 1800);
  };

  const copyWallet = async () => {
    try {
      await Clipboard.setStringAsync(BTC_WALLET);
      flash('Address copied');
    } catch {
      flash('Could not copy the address');
    }
  };

  const openMail = (subject) =>
    Linking.openURL(
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`,
    ).catch(() => flash('No email app found'));

  return (
    <Screen scroll contentStyle={{ paddingBottom: space[8] }}>
      <ScreenHeader
        back
        title='Support the project'
        subtitle='Optional donations keep Crypto Portfolio independent'
      />

      {/* Hero */}
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
                <Ionicons name='shield-half-outline' size={26} color={colors.gold[400]} />
              </LinearGradient>
            </View>
            <Text variant='h2' style={{ marginTop: space[4] }}>
              An app that answers only to its users
            </Text>
            <Text variant='body' color='secondary' style={{ marginTop: space[2] }}>
              Crypto Portfolio is built and maintained by one developer. It has no
              investors, no ad revenue and no data sales, so the only thing that keeps the
              servers running is people who find it useful.
            </Text>
          </View>
        </Surface>
      </View>

      {/* Principles */}
      <View style={styles.section}>
        <SectionHeader title='What stays true, donation or not' />
        <Surface level={1} radius='lg'>
          {PRINCIPLES.map((item, i) => (
            <Feature key={item.title} {...item} last={i === PRINCIPLES.length - 1} />
          ))}
        </Surface>
      </View>

      {/* Donate */}
      <View style={styles.section}>
        <SectionHeader
          title='Donate with Bitcoin'
          subtitle='Bitcoin network, native SegWit'
        />
        <Surface level={1} radius='lg'>
          <View style={styles.wallet}>
            <View style={styles.walletHead}>
              <View style={styles.chainIcon}>
                <Text variant='label' color='gold'>
                  ₿
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: space[3] }}>
                <Text variant='bodyStrong'>Bitcoin (BTC)</Text>
                <Text variant='small' color='tertiary'>
                  {shortAddress}
                </Text>
              </View>
              <IconButton name='copy-outline' active onPress={copyWallet} />
            </View>
            <View style={styles.address}>
              <Text variant='caption' color='primary' style={styles.mono} selectable>
                {BTC_WALLET}
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
            <View style={styles.checklist}>
              <Text variant='caption' color='primary'>
                Before you send
              </Text>
              <Text variant='small' color='tertiary' style={{ marginTop: space[1] }}>
                Use the Bitcoin network only. Tokens on other networks sent to this
                address are lost. Compare the start and end of the address after pasting.
                Transfers cannot be reversed.
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Funding */}
      <View style={styles.section}>
        <SectionHeader
          title='Where the money goes'
          subtitle='Running costs come first, new features second'
        />
        <Surface level={1} radius='lg'>
          {FUNDING.map((item, i) => (
            <Feature key={item.title} {...item} last={i === FUNDING.length - 1} />
          ))}
        </Surface>
      </View>

      {/* Roadmap */}
      <View style={styles.section}>
        <SectionHeader title='What support helps build next' />
        <Surface level={1} radius='lg'>
          {ROADMAP.map((item, i) => (
            <Feature key={item.title} {...item} last={i === ROADMAP.length - 1} />
          ))}
        </Surface>
        <Text variant='small' color='tertiary' style={{ marginTop: space[2] }}>
          Plans can change. Donations do not guarantee specific features or dates.
        </Text>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <SectionHeader title='Questions' />
        <Surface level={1} radius='lg'>
          {FAQ.map((item, i) => (
            <FaqItem
              key={item.q}
              {...item}
              open={openFaq === i}
              last={i === FAQ.length - 1}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </Surface>
      </View>

      {/* Legal note */}
      <View style={styles.section}>
        <Surface
          level={1}
          radius='lg'
          padding={4}
          style={{ borderColor: colors.warning.border }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name='information-circle' size={18} color={colors.warning.fg} />
            <Text
              variant='caption'
              color='secondary'
              style={{ flex: 1, marginLeft: space[3] }}
            >
              <Text variant='caption' color='primary'>
                Please note:{' '}
              </Text>
              donations are voluntary gifts. No goods, subscriptions or premium tiers are
              sold in exchange. Contributions are non-refundable and do not guarantee
              specific features or timelines. Nothing in the app is financial advice.
            </Text>
          </View>
        </Surface>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Divider gold spacing={space[2]} />
        <Text
          variant='caption'
          color='secondary'
          align='center'
          style={{ marginTop: space[3] }}
        >
          Need a transaction confirmed, or want to say something?
        </Text>
        <Button
          variant='ghost'
          size='sm'
          title={CONTACT_EMAIL}
          icon='mail-outline'
          onPress={() => openMail('Crypto Portfolio: support')}
          style={{ alignSelf: 'center', marginTop: space[2] }}
        />
        <Text
          variant='small'
          color='tertiary'
          align='center'
          style={{ marginTop: space[4] }}
        >
          © 2026 Neon Labs · Crypto Portfolio{'\n'}Independent development project. Not a
          financial institution.
        </Text>
      </View>

      <Toast message={toast} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  hero: { padding: space[4], alignItems: 'flex-start' },
  emblemWrap: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    padding: 3,
  },
  emblem: {
    width: 60,
    height: 60,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3),
  },
  wallet: { padding: space[4] },
  walletHead: { flexDirection: 'row', alignItems: 'center' },
  chainIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.35),
  },
  address: {
    marginTop: space[3],
    padding: space[3],
    borderRadius: 0,
    backgroundColor: colors.bg[1],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default,
  },
  mono: { fontFamily: font.semibold, letterSpacing: 0.6 },
  checklist: {
    marginTop: space[3],
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line.default,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  faqBody: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },
});

export default SupportUs;
