import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import {
  getDemoSpeed,
  getSpeed,
  getVoiceLang,
  setDemoSpeed,
  setSpeed,
  setVoiceLang,
  speakChar,
  type Speed,
  type VoiceLang,
} from '@/lib/speech';
import { t } from '@/lib/i18n';

const LANGS: { id: VoiceLang; label: string; sub: string }[] = [
  { id: 'yue', label: t('voiceYue'), sub: 'Cantonese' },
  { id: 'cmn', label: t('voiceCmn'), sub: 'Mandarin' },
];

const SPEEDS: { id: Speed; label: string }[] = [
  { id: 'slow', label: t('speedSlow') },
  { id: 'normal', label: t('speedNormal') },
  { id: 'fast', label: t('speedFast') },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState(getVoiceLang());
  const [speed, setSpeedState] = useState(getSpeed());
  const [demoSpd, setDemoSpd] = useState(getDemoSpeed());

  const pickLang = (l: VoiceLang) => {
    setLang(l);
    setVoiceLang(l);
    speakChar('一');
  };
  const pickSpeed = (s: Speed) => {
    setSpeedState(s);
    setSpeed(s);
    speakChar('一');
  };
  const pickDemo = (s: Speed) => {
    setDemoSpd(s);
    setDemoSpeed(s);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 4 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('voiceSection')}</Text>
        <View style={styles.row}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.option, lang === l.id && styles.optionActive]}
              onPress={() => pickLang(l.id)}
            >
              <Ionicons
                name={lang === l.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={lang === l.id ? Colors.vermillion : Colors.inkFaint}
              />
              <View>
                <Text style={[styles.optionLabel, lang === l.id && styles.optionLabelActive]}>
                  {l.label}
                </Text>
                <Text style={styles.optionSub}>{l.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('speedSection')}</Text>
        <View style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.speedBtn, speed === s.id && styles.speedBtnActive]}
              onPress={() => pickSpeed(s.id)}
            >
              <Text style={[styles.speedLabel, speed === s.id && styles.speedLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('demoSpeedSection')}</Text>
        <View style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.speedBtn, demoSpd === s.id && styles.speedBtnActive]}
              onPress={() => pickDemo(s.id)}
            >
              <Text style={[styles.speedLabel, demoSpd === s.id && styles.speedLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: Colors.ink },
  section: { paddingHorizontal: 24, marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 12 },
  row: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionActive: { borderColor: Colors.vermillion },
  optionLabel: { fontSize: 17, fontWeight: '600', color: Colors.ink },
  optionLabelActive: { color: Colors.vermillion },
  optionSub: { fontSize: 12, color: Colors.inkLight, marginTop: 1 },
  speedRow: { flexDirection: 'row', gap: 12 },
  speedBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  speedBtnActive: { borderColor: Colors.vermillion },
  speedLabel: { fontSize: 16, fontWeight: '600', color: Colors.inkLight },
  speedLabelActive: { color: Colors.vermillion, fontWeight: '700' },
});
