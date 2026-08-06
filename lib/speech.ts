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
const DEMO_MAP: Record<Speed, number> = { slow: 1.5, normal: 1, fast: 0.65 };

let lang: VoiceLang = 'yue';
let speed: Speed = 'normal';
let demoSpeed: Speed = 'normal';

AsyncStorage.getItem(LANG_KEY).then((v) => {
  if (v === 'yue' || v === 'cmn') lang = v;
});
AsyncStorage.getItem(SPEED_KEY).then((v) => {
  if (v === 'slow' || v === 'normal' || v === 'fast') speed = v;
});
AsyncStorage.getItem(DEMO_KEY).then((v) => {
  if (v === 'slow' || v === 'normal' || v === 'fast') demoSpeed = v;
});

export function getVoiceLang(): VoiceLang {
  return lang;
}
export function setVoiceLang(l: VoiceLang) {
  lang = l;
  AsyncStorage.setItem(LANG_KEY, l);
}
export function getSpeed(): Speed {
  return speed;
}
export function setSpeed(s: Speed) {
  speed = s;
  player?.setPlaybackRate(SPEED_MAP[s], 'high');
  AsyncStorage.setItem(SPEED_KEY, s);
}

export function getDemoSpeed(): Speed {
  return demoSpeed;
}
export function setDemoSpeed(s: Speed) {
  demoSpeed = s;
  AsyncStorage.setItem(DEMO_KEY, s);
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
