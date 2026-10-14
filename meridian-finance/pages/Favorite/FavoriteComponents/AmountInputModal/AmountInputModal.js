import React from "react"
import { View, TextInput, StyleSheet } from "react-native"
import { Sheet, Text, Button } from "../../../../components/ui"
import { colors, space, goldAlpha, font } from "../../../../theme"

// Ввод количества монеты в портфеле
const AmountInputModal = ({
  inputModalVisible,
  selectedCoinForInput,
  userAssets,
  amountInputRef,
  setInputModalVisible,
  saveAmount
}) => (
  <Sheet
    visible={inputModalVisible}
    onClose={() => setInputModalVisible(false)}
    snapHeight={0.5}
    keyboardAvoiding
    title='Holding amount'
    subtitle={
      selectedCoinForInput
        ? `${selectedCoinForInput.name} · ${selectedCoinForInput.symbol?.toUpperCase()}`
        : ""
    }
  >
    {selectedCoinForInput && (
      <View style={styles.body}>
        <View style={styles.inputWrap}>
          <TextInput
            key={selectedCoinForInput.id}
            defaultValue={(userAssets[selectedCoinForInput.id] || "").toString()}
            onChangeText={(t) => (amountInputRef.current = t)}
            placeholder='0.00'
            placeholderTextColor={colors.text.disabled}
            keyboardType='decimal-pad'
            autoFocus
            selectionColor={colors.gold[500]}
            style={styles.input}
          />
          <Text variant='h3' color='gold'>
            {selectedCoinForInput.symbol?.toUpperCase()}
          </Text>
        </View>
        <Text variant='caption' color='tertiary' align='center' style={{ marginTop: space[3] }}>
          Used to calculate your portfolio value and analytics. Stays on your device.
        </Text>
        <View style={styles.actions}>
          <Button
            variant='ghost'
            title='Cancel'
            onPress={() => setInputModalVisible(false)}
            style={{ flex: 1 }}
          />
          <Button title='Save' icon='checkmark' onPress={saveAmount} style={{ flex: 1 }} />
        </View>
      </View>
    )}
  </Sheet>
)

const styles = StyleSheet.create({
  body: { paddingHorizontal: space[4], paddingTop: space[2] },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: space[4],
    borderRadius: 0,
    backgroundColor: colors.surface[2],
    borderWidth: 1,
    borderColor: goldAlpha(0.4)
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 28,
    fontFamily: font.bold,
    fontVariant: ["tabular-nums"],
    paddingVertical: 0,
    minWidth: 0,
    outlineStyle: "none"
  },
  actions: { flexDirection: "row", gap: space[3], marginTop: space[5] }
})

export default AmountInputModal
