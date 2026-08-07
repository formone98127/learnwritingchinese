import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { VOICE_CLIPS } from '@/data/voice';

export type VoiceLang = 'yue' | 'cmn';
export type Speed = 'slow' | 'normal' | 'fast';

const LANG_KEY = 'strokeapp.voiceLang';
const SPEED_KEY = 'strokeapp.speed';
const DEMO_KEY = 'strokeapp.demoSpeed';
const SPEED_MAP: Record<Speed, number> = { slow: 0.75, normal: 1, fast: 1.3 };
const DEMO_MAP: Record<Speed, number> = { slow: 2.6, normal: 1, fast: 0.6 };

let demoSpeedListeners = new Set<() => void>();

export function subscribeDemoSpeed(listener: () => void): () => void {
  demoSpeedListeners.add(listener);
  return () => {
    demoSpeedListeners.delete(listener);
  };
}

let lang: VoiceLang = 'yue';
let speed: Speed = 'normal';
let demoSpeed: Speed = 'normal';
// once the user explicitly changes a setting, don't let the async hydrate clobber it
let langDirty = false;
let speedDirty = false;
let demoDirty = false;

const isWeb = Platform.OS === 'web';

// SSR (static rendering) has no window — skip hydration entirely
if (!isWeb || typeof window !== 'undefined') {
  AsyncStorage.getItem(LANG_KEY).then((v) => {
    if (!langDirty && (v === 'yue' || v === 'cmn')) lang = v;
  });
  AsyncStorage.getItem(SPEED_KEY).then((v) => {
    if (!speedDirty && (v === 'slow' || v === 'normal' || v === 'fast')) speed = v;
  });
  AsyncStorage.getItem(DEMO_KEY).then((v) => {
    if (!demoDirty && (v === 'slow' || v === 'normal' || v === 'fast')) demoSpeed = v;
  });
}

export function getVoiceLang(): VoiceLang {
  return lang;
}
export function setVoiceLang(l: VoiceLang) {
  lang = l;
  langDirty = true;
  if (typeof window !== 'undefined') AsyncStorage.setItem(LANG_KEY, l);
}
export function getSpeed(): Speed {
  return speed;
}
export function setSpeed(s: Speed) {
  speed = s;
  speedDirty = true;
  player?.setPlaybackRate(SPEED_MAP[s], 'high');
  if (typeof window !== 'undefined') AsyncStorage.setItem(SPEED_KEY, s);
}

export function getDemoSpeed(): Speed {
  return demoSpeed;
}
export function setDemoSpeed(s: Speed) {
  demoSpeed = s;
  demoDirty = true;
  if (typeof window !== 'undefined') AsyncStorage.setItem(DEMO_KEY, s);
  demoSpeedListeners.forEach((fn) => fn());
}
export function getDemoDurationMultiplier(): number {
  return DEMO_MAP[demoSpeed];
}

let player: AudioPlayer | undefined;
let audioModeReady = false;
let onDoneCb: (() => void) | undefined;

let gestured = Platform.OS !== 'web';
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const unlock = () => {
    gestured = true;
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('touchstart', unlock, true);
  };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
}

function voicePlayer(): AudioPlayer {
  if (!audioModeReady) {
    audioModeReady = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  if (!player) {
    player = createAudioPlayer(null);
    player.setPlaybackRate(SPEED_MAP[speed], 'high');
    player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish && onDoneCb) {
        const cb = onDoneCb;
        onDoneCb = undefined;
        cb();
      }
    });
  }
  return player;
}

function speak(text: string, onDone?: () => void) {
  const langClips = VOICE_CLIPS[lang];
  const src = langClips?.[text];
  if (!src) {
    console.warn(`[speech] no bundled clip for "${text}" (${lang})`);
    onDone?.();
    return;
  }
  if (!gestured) {
    onDone?.();
    return;
  }
  const p = voicePlayer();
  onDoneCb = onDone;
  p.replace(src);
  p.play();
}

const PRAISES_YUE = ['寫得好！', '好嘢！', '叻喎！', '做得好啊！'];
const PRAISES_CMN = ['写得好！', '好耶！', '真棒！', '做得好啊！'];

const ERROR_HINTS_YUE: Record<string, string> = {
  'wrong-start': '要由紅點嗰度起筆呀',
  'wrong-start-test': '起筆位置唔啱，再諗下先',
  sloppy: '寫歪咗，呢筆重新寫',
  'not-standard': '唔夠標準，再寫多次',
  'wrong-direction': '方向倒轉咗，跟返箭嘴寫',
  'too-short': '太短啦，寫長少少',
  incomplete: '未寫完呢筆，繼續',
  'too-fast': '太快啦，慢慢嚟',
};
const ERROR_HINTS_CMN: Record<string, string> = {
  'wrong-start': '要从红点那里起笔哦',
  'wrong-start-test': '起笔位置不对，再想想',
  sloppy: '写歪了，这一笔重新写',
  'not-standard': '不够标准，再写一次',
  'wrong-direction': '方向反了，跟着箭头写',
  'too-short': '太短啦，写长一点',
  incomplete: '还没写完这一笔，继续',
  'too-fast': '太快啦，慢慢来',
};

export function speakError(errorKey: string) {
  const map = lang === 'cmn' ? ERROR_HINTS_CMN : ERROR_HINTS_YUE;
  const text = map[errorKey];
  if (text) speak(text);
}

export function speakStrokeName(name: string, onDone?: () => void) {
  speak(name, onDone);
}

export function speakChar(char: string) {
  speak(char);
}

export function speakPraise(text?: string) {
  const pool = lang === 'cmn' ? PRAISES_CMN : PRAISES_YUE;
  speak(text ?? pool[Math.floor(Math.random() * pool.length)]);
}

export function randomPraise() {
  const pool = lang === 'cmn' ? PRAISES_CMN : PRAISES_YUE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function stopSpeech() {
  onDoneCb = undefined;
  player?.pause();
}
