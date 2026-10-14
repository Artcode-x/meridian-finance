import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { colors, space, goldAlpha } from "../../theme"
import { Sheet, Text, Button, Surface, Divider } from "../ui"

const Row = ({ icon, text, tone = "gold" }) => {
  const fg = tone === "gold" ? colors.gold[400] : colors[tone].fg
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={fg} style={{ marginTop: 2 }} />
      <Text variant='caption' color='secondary' style={{ flex: 1, marginLeft: space[3] }}>
        {text}
      </Text>
    </View>
  )
}

// Согласие на фоновые (серверные) уведомления
const AlertConsentModal = ({ visible, onAgree, onCancel }) => (
  <Sheet visible={visible} onClose={onCancel} snapHeight={0.78}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
      <View style={styles.emblemWrap}>
        <LinearGradient
          colors={[goldAlpha(0.3), goldAlpha(0.05)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emblem}
        >
          <Ionicons name='notifications' size={30} color={colors.gold[400]} />
        </LinearGradient>
      </View>
      <Text variant='label' color='gold' align='center' style={{ marginTop: space[4] }}>
        Background alerts
      </Text>
      <Text variant='h2' align='center' style={{ marginTop: space[2] }}>
        Get price alerts even when the app is closed
      </Text>
      <Divider gold style={{ width: 64, alignSelf: "center", marginVertical: space[4] }} />

      <Surface level={1} radius='md' padding={4}>
        <Row
          icon='cloud-done-outline'
          text='Our server watches your alerts 24/7 and sends a push when a target is hit.'
          tone='up'
        />
        <Row
          icon='shield-checkmark-outline'
          text='Only your alert rules (coin, target, direction) and a push token are sent. No account, no personal data.'
        />
        <Row icon='phone-portrait-outline' text='Your portfolio amounts never leave the device.' />
        <Row
          icon='settings-outline'
          text='You can switch this off at any time from the Alerts tab.'
          tone='info'
        />
      </Surface>

      <View style={styles.actions}>
        <Button title='Enable background alerts' icon='checkmark-circle' fullWidth onPress={onAgree} />
        <Button
          variant='ghost'
          title='Keep local notifications only'
          fullWidth
          onPress={onCancel}
          style={{ marginTop: space[3] }}
        />
      </View>
    </ScrollView>
  </Sheet>
)

const styles = StyleSheet.create({
  body: { paddingHorizontal: space[4], paddingBottom: space[6], paddingTop: space[2] },
  emblemWrap: {
    alignSelf: "center",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    padding: 4
  },
  emblem: { width: 80, height: 80, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: space[2] },
  actions: { marginTop: space[5] }
})

export default AlertConsentModal
