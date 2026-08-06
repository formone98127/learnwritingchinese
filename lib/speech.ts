import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { VOICE_CLIPS } from '@/data/voice';

// Cantonese voice is fully bundled (Edge TTS zh-HK-HiuMaanNeural, generated
// offline by scripts/gen-voice.py). No device TTS, no downloads, no setup.
let player: AudioPlayer | undefined;
let audioModeReady = false;
let onDoneCb: (() => void) | undefined;

// Browsers block audio before the first user gesture; skip playback until then
// (native has no such restriction).
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
  const src = VOICE_CLIPS[text];
  if (!src) {
    console.warn(`[speech] no bundled clip for "${text}"`);
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

const PRAISES = ['寫得好！', '好嘢！', '叻喎！', '做得好啊！'];

export function speakStrokeName(name: string, onDone?: () => void) {
  speak(name, onDone);
}

export function speakChar(char: string) {
  speak(char);
}

export function speakPraise() {
  speak(PRAISES[Math.floor(Math.random() * PRAISES.length)]);
}

export function stopSpeech() {
  onDoneCb = undefined;
  player?.pause();
}
