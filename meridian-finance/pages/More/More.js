import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, StyleSheet, Linking, Platform, Share } from 'react-native';
import {
  Screen,
  ScreenHeader,
  Surface,
  Text,
  PressableScale,
  Divider,
  SectionHeader,
} from '../../components/ui';
import { colors, space, goldAlpha } from '../../theme';

const CONTACT_EMAIL = 'neonlabs.dev@gmail.com';
const PLAY_ID = 'com.crypto.artcode';
const PLAY_WEB = `https://play.google.com/store/apps/details?id=${PLAY_ID}`;

// ── Content (edit here, keep it truthful) ────────────────────────────────────

const FEATURES = [
  {
    icon: 'pie-chart-outline',
    title: 'Portfolio',
    text: 'Value, profit and allocation recalculated in real time as prices move.',
  },
  {
    icon: 'notifications-outline',
    title: 'Alerts',
    text: 'Push notifications when an asset reaches the level you set.',
  },
  {
    icon: 'candlestick-chart-outline',
    title: 'Charts and indicators',
    text: 'Candlestick charts with moving averages and Bollinger Bands.',
  },
];

const PRIVACY = [
  {
    icon: 'lock-closed-outline',
    title: 'Encrypted data',
    text: 'Your holdings are stored encrypted.',
  },
  {
    icon: 'ban-outline',
    title: 'No ads or trackers',
    text: 'No advertising SDKs, no selling of data.',
  },
  {
    icon: 'wallet-outline',
    title: 'No custody',
    text: 'The app never asks for private keys or seed phrases. Keep it that way: nobody legitimate will request them.',
  },
];

// ── Rows ─────────────────────────────────────────────────────────────────────

const Row = ({ icon, title, subtitle, onPress, last, tone = 'gold', chevron = true }) => (
  <PressableScale scaleTo={0.99} haptic='selection' onPress={onPress}>
    <View style={styles.row}>
      <View
        style={[styles.icon, tone !== 'gold' && { backgroundColor: colors[tone].bg }]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={tone === 'gold' ? colors.gold[400] : colors[tone].fg}
        />
      </View>
      <View style={{ flex: 1, marginLeft: space[3] }}>
        <Text variant='bodyStrong'>{title}</Text>
        {subtitle && (
          <Text variant='caption' color='tertiary'>
            {subtitle}
          </Text>
        )}
      </View>
      {chevron && (
        <Ionicons name='chevron-forward' size={16} color={colors.text.tertiary} />
      )}
    </View>
    {!last && <Divider style={{ marginLeft: 64 }} />}
  </PressableScale>
);

const Fact = ({ icon, title, text, last }) => (
  <View>
    <View style={styles.row}>
      <View style={[styles.icon, { alignSelf: 'flex-start' }]}>
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

// ── Screen ───────────────────────────────────────────────────────────────────

const More = () => {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const version = Constants.expoConfig?.version || '2.0.0';

  const mail = (subject, body) => {
    const query = [`subject=${encodeURIComponent(subject)}`];
    if (body) query.push(`body=${encodeURIComponent(body)}`);
    Linking.openURL(`mailto:${CONTACT_EMAIL}?${query.join('&')}`).catch(() => {});
  };

  const reportBug = () =>
    mail(
      'Crypto Portfolio: bug report',
      `\n\n---\nPlease describe what happened above this line.\nApp ${version} · ${Platform.OS} ${Platform.Version}`,
    );

  const rateApp = () =>
    Linking.openURL(`market://details?id=${PLAY_ID}`).catch(() =>
      Linking.openURL(PLAY_WEB).catch(() => {}),
    );

  const shareApp = () =>
    Share.share({
      message: `Crypto Portfolio: track your holdings, set price alerts and read candlestick charts. ${PLAY_WEB}`,
    }).catch(() => {});

  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarHeight + space[6] }}>
      <ScreenHeader
        large
        eyebrow='Crypto Portfolio'
        title='More'
        subtitle='About the app, privacy, support and contact'
      />

      {/* Brand */}
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
              <Text variant='h2'>Crypto Portfolio</Text>
              <Text variant='caption' color='secondary'>
                One place for your holdings, alerts and charts. Private by design.
              </Text>
              <Text variant='small' color='gold' style={{ marginTop: space[1] }}>
                Version {version}
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* What it does */}
      <View style={styles.section}>
        <SectionHeader title='What the app does' />
        <Surface level={1} radius='lg'>
          {FEATURES.map((item, i) => (
            <Fact key={item.title} {...item} last={i === FEATURES.length - 1} />
          ))}
        </Surface>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <SectionHeader title='Privacy and security' />
        <Surface level={1} radius='lg'>
          {PRIVACY.map((item, i) => (
            <Fact key={item.title} {...item} last={i === PRIVACY.length - 1} />
          ))}
        </Surface>
      </View>

      {/* Project */}
      <View style={styles.section}>
        <SectionHeader title='Project' />
        <Surface level={1} radius='lg'>
          <Row
            icon='heart-outline'
            title='Support the project'
            subtitle='Optional donations keep the app independent'
            onPress={() => navigation.navigate('SupportUs')}
          />
          <Row
            icon='star-outline'
            title='Rate on Google Play'
            subtitle='Reviews help other people find the app'
            onPress={rateApp}
          />
          <Row
            icon='share-social-outline'
            title='Share the app'
            subtitle='Send a link to a friend'
            onPress={shareApp}
            last
          />
        </Surface>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <SectionHeader title='Contact' />
        <Surface level={1} radius='lg'>
          <Row
            icon='bug-outline'
            title='Report a problem'
            subtitle='Opens an email with your app and system version'
            tone='info'
            onPress={reportBug}
          />
          <Row
            icon='mail-outline'
            title='Email the developer'
            subtitle={CONTACT_EMAIL}
            tone='info'
            onPress={() => mail('Crypto Portfolio')}
            last
          />
        </Surface>
      </View>

      <Text
        variant='small'
        color='tertiary'
        align='center'
        style={{ marginTop: space[2], paddingHorizontal: space[4] }}
      >
        Prices are informational and may be delayed. Nothing in the app is financial
        advice.
      </Text>
      <Text
        variant='small'
        color='tertiary'
        align='center'
        style={{ marginTop: space[3] }}
      >
        Market data by Meridian — finance 2026{'\n'}© 2026 Neon Labs
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  brand: { flexDirection: 'row', alignItems: 'center', padding: space[4] },
  monoOuter: { borderRadius: 0, borderWidth: 1, borderColor: goldAlpha(0.3), padding: 3 },
  mono: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3),
  },
});

export default More;
