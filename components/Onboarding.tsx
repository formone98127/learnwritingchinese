import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/colors';

const KEY = 'strokeapp.onboarded';

const STEPS = [
  {
    icon: 'hand-left',
    title: '跟住紅點寫',
    text: '由紅點開始，跟住虛線一筆一畫寫。寫得準就有星！',
  },
  {
    icon: 'eye',
    title: '先睇示範',
    text: '每個字會先示範筆順，睇完就自己寫。可以跳過示範直接寫。',
  },
  {
    icon: 'school',
    title: '測試同考核',
    text: '學完一關，可以切換「測試」或者去「考核模式」，冇示範靠自己寫。',
  },
  {
    icon: 'medal',
    title: '攞勳章',
    text: '每個字寫滿 3 星，成關攞滿星就有勳章。仲有複習同報告幫你記得牢！',
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  if (!visible) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const finish = () => {
    setVisible(false);
    AsyncStorage.setItem(KEY, '1');
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: Math.min(width * 0.86, 360) }]}>
          <View style={styles.iconWrap}>
            <Ionicons name={s.icon as never} size={44} color={Colors.vermillion} />
          </View>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.text}>{s.text}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.btnRow}>
            {!last && (
              <TouchableOpacity onPress={finish} hitSlop={8}>
                <Text style={styles.skip}>跳過</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => (last ? finish() : setStep(step + 1))}
            >
              <Text style={styles.nextText}>{last ? '開始學習' : '下一步'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38,34,28,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  text: { fontSize: 15, color: Colors.inkLight, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.inkFaint },
  dotActive: { backgroundColor: Colors.vermillion, width: 18 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 22 },
  skip: { fontSize: 14, color: Colors.inkFaint },
  nextBtn: {
    backgroundColor: Colors.vermillion,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  nextText: { color: '#FFFDF7', fontSize: 15, fontWeight: '700' },
});
