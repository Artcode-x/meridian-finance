import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import React from "react"
import { View, StyleSheet, Linking } from "react-native"
import { privacySections, PRIVACY_UPDATED, PRIVACY_CONTACT } from "./privacyContent"
import { Screen, ScreenHeader, Surface, Text, Accordion, Button, PressableScale } from "../../components/ui"
import { colors, space, goldAlpha } from "../../theme"

const Block = ({ block }) => {
  switch (block.type) {
    case "h":
      return (
        <Text variant='label' color='gold' style={styles.h}>
          {block.text}
        </Text>
      )
    case "p":
      return (
        <Text variant='body' color='secondary' style={styles.p}>
          {block.text}
        </Text>
      )
    case "note":
      return (
        <View style={styles.note}>
          <Ionicons name='shield-checkmark' size={14} color={colors.gold[400]} style={{ marginTop: 3 }} />
          <Text variant='caption' color='primary' style={{ flex: 1, marginLeft: space[2] }}>
            {block.text}
          </Text>
        </View>
      )
    case "ul":
    case "ol":
      return (
        <View style={styles.list}>
          {block.items.map((it, i) => (
            <View key={i} style={styles.li}>
              {block.type === "ol" ? (
                <View style={styles.num}>
                  <Text variant='small' color='gold'>
                    {i + 1}
                  </Text>
                </View>
              ) : (
                <View style={styles.bullet} />
              )}
              <Text variant='body' color='secondary' style={{ flex: 1 }}>
                {it}
              </Text>
            </View>
          ))}
        </View>
      )
    case "table":
      return (
        <View style={styles.table}>
          {[block.headers, ...block.rows].map((row, r) => (
            <View
              key={r}
              style={[styles.tr, r === 0 && styles.th, r === block.rows.length && { borderBottomWidth: 0 }]}
            >
              {row.map((cell, c) => (
                <Text
                  key={c}
                  variant={r === 0 ? "label" : "small"}
                  color={r === 0 ? "gold" : c === 0 ? "primary" : "secondary"}
                  style={[styles.td, c === 0 && { flex: 1.1 }]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )
    case "link":
      return (
        <PressableScale haptic='selection' onPress={() => Linking.openURL(block.url)} style={styles.link}>
          <Ionicons name='open-outline' size={14} color={colors.info.fg} />
          <Text variant='caption' color='info' style={{ marginLeft: 6 }}>
            {block.text}
          </Text>
        </PressableScale>
      )
    default:
      return null
  }
}

const PrivacyPolicy = () => (
  <Screen scroll contentStyle={{ paddingBottom: space[8] }}>
    <ScreenHeader back title='Privacy policy' subtitle={`Last updated ${PRIVACY_UPDATED}`} />

    <View style={styles.section}>
      <Surface variant='goldCase' radius='lg'>
        <View style={styles.summary}>
          {[
            ["phone-portrait-outline", "Your data", "Stays on device"],
            ["checkmark-circle-outline", "Consent", "Explicit & optional"],
            ["key-outline", "Control", "Always yours"]
          ].map(([icon, label, value]) => (
            <View key={label} style={styles.summaryItem}>
              <Ionicons name={icon} size={18} color={colors.gold[400]} />
              <Text variant='label' color='tertiary' style={{ marginTop: space[2] }}>
                {label}
              </Text>
              <Text variant='caption' align='center'>
                {value}
              </Text>
            </View>
          ))}
        </View>
      </Surface>
    </View>

    <View style={styles.section}>
      {privacySections.map((sec, i) => (
        <Accordion
          key={sec.id}
          title={sec.title}
          icon={sec.icon}
          defaultOpen={i === 0}
          style={{ marginBottom: space[2] }}
        >
          {sec.blocks.map((b, j) => (
            <Block key={j} block={b} />
          ))}
        </Accordion>
      ))}
    </View>

    <View style={styles.section}>
      <Surface level={1} radius='lg' padding={4}>
        <Text variant='label' color='gold'>
          Contact
        </Text>
        <Text variant='body' style={{ marginTop: space[2] }}>
          Developer: Alexander Butylev
        </Text>
        <Text variant='caption' color='secondary' style={{ marginTop: space[1] }}>
          Privacy questions, data requests, security concerns or issue reports. I aim to respond within 48
          hours.
        </Text>
        <Button
          variant='ghost'
          size='sm'
          title={PRIVACY_CONTACT}
          icon='mail-outline'
          onPress={() => Linking.openURL(`mailto:${PRIVACY_CONTACT}?subject=Crypto-Tracker Privacy`)}
          style={{ alignSelf: "flex-start", marginTop: space[3] }}
        />
      </Surface>
      <Text variant='small' color='tertiary' align='center' style={{ marginTop: space[4] }}>
        © {new Date().getFullYear()} Alexander Butylev · App v{Constants.expoConfig?.version || "2.0.0"} ·
        Policy v1.0{"\n"}Applies to the Crypto-Tracker app and its background alert service.
      </Text>
    </View>
  </Screen>
)

const styles = StyleSheet.create({
  section: { paddingHorizontal: space[4], marginBottom: space[4] },
  summary: { flexDirection: "row", padding: space[4] },
  summaryItem: { flex: 1, alignItems: "center" },
  h: { marginTop: space[3], marginBottom: space[2] },
  p: { marginBottom: space[2] },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: space[3],
    borderRadius: 0,
    backgroundColor: goldAlpha(0.08),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: goldAlpha(0.3),
    marginVertical: space[2]
  },
  list: { marginBottom: space[2] },
  li: { flexDirection: "row", alignItems: "flex-start", marginBottom: space[2] },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 0,
    backgroundColor: colors.gold[500],
    marginTop: 8,
    marginRight: space[3]
  },
  num: {
    width: 20,
    height: 20,
    borderRadius: 0,
    backgroundColor: goldAlpha(0.14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: space[2],
    marginTop: 1
  },
  table: {
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line.default,
    overflow: "hidden",
    marginBottom: space[2]
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line.subtle
  },
  th: { backgroundColor: goldAlpha(0.08) },
  td: { flex: 1, padding: space[2] },
  link: { flexDirection: "row", alignItems: "center", marginTop: space[2] }
})

export default PrivacyPolicy
