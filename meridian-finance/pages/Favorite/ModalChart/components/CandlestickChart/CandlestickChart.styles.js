import { StyleSheet } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

export const styles = StyleSheet.create({
  chartContainerStyle: {
    flex: 1,
    alignItems: 'center',
  },
  // Строка с подсказкой над графиком
  limitContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  limitHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: RFValue(7),
  },
  // Область самого графика (в неё же кладётся кнопка NW)
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Подписи цен слева
  yAxisLabel: {
    color: 'rgba(255,255,255,0.6)',
  },
});
