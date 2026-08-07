import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { explainStrokeRule, showStrokeRuleHints, t } from '@/lib/i18n';

type Props = {
  rules: string[];
};

/** 筆順口訣：traditional stroke-order rules for the character, e.g. 先橫後豎. */
export function StrokeFormula({ rules }: Props) {
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const tappable = showStrokeRuleHints();

  if (rules.length === 0) return null;
  const compact = rules.length > 3;
  const explanation = activeRule ? explainStrokeRule(activeRule) : null;

  return (
    <>
      <View style={[styles.formula, compact && styles.formulaCompact]}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, compact && styles.labelCompact]}>{t('formulaLabel')}</Text>
          {tappable && (
            <Text style={[styles.tapHint, compact && styles.tapHintCompact]}>{t('formulaTapHint')}</Text>
          )}
        </View>
        {rules.map((rule) => {
          const pill = (
            <View style={[styles.pill, compact && styles.pillCompact, tappable && styles.pillTappable]}>
              <Text style={[styles.pillText, compact && styles.pillTextCompact]}>{rule}</Text>
            </View>
          );
          if (!tappable) {
            return (
              <View key={rule}>
                {pill}
              </View>
            );
          }
          return (
            <TouchableOpacity key={rule} activeOpacity={0.7} onPress={() => setActiveRule(rule)}>
              {pill}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        transparent
        visible={activeRule !== null}
        animationType="fade"
        onRequestClose={() => setActiveRule(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setActiveRule(null)}>
          <Pressable
            style={[styles.card, { maxWidth: Math.min(width * 0.88, 360) }]}
            onPress={() => {}}
          >
            <Text style={styles.cardRule}>{activeRule}</Text>
            {explanation && <Text style={styles.cardExplain}>{explanation}</Text>}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveRule(null)}>
              <Text style={styles.closeText}>{t('confirm')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginRight: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 2,
  },
  labelCompact: { fontSize: 11 },
  tapHint: { fontSize: 10, color: Colors.inkFaint, fontWeight: '600' },
  tapHintCompact: { fontSize: 9 },
  pill: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillTappable: {
    borderStyle: 'dashed',
  },
  pillCompact: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  pillText: { fontSize: 14, color: Colors.ink, fontWeight: '600', letterSpacing: 1 },
  pillTextCompact: { fontSize: 12, letterSpacing: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38,34,28,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    width: '100%',
  },
  cardRule: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: 2,
  },
  cardExplain: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkLight,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: Colors.vermillion,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeText: { color: '#FFFDF7', fontSize: 15, fontWeight: '700' },
});
