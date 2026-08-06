import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

type Props = {
  rules: string[];
};

/** 筆順口訣：traditional stroke-order rules for the character, e.g. 先橫後豎. */
export function StrokeFormula({ rules }: Props) {
  if (rules.length === 0) return null;
  const compact = rules.length > 3;
  return (
    <View style={[styles.formula, compact && styles.formulaCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>口訣</Text>
      {rules.map((rule) => (
        <View key={rule} style={[styles.pill, compact && styles.pillCompact]}>
          <Text style={[styles.pillText, compact && styles.pillTextCompact]}>{rule}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  formula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    maxWidth: 420,
  },
  formulaCompact: { gap: 4, marginTop: 4, maxWidth: 480 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 2,
    marginRight: 2,
  },
  labelCompact: { fontSize: 11 },
  pill: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillCompact: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  pillText: { fontSize: 14, color: Colors.ink, fontWeight: '600', letterSpacing: 1 },
  pillTextCompact: { fontSize: 12, letterSpacing: 0.5 },
});
