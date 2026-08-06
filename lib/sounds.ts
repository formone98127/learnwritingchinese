import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type SoundName = 'stroke-done' | 'char-done' | 'level-done' | 'wrong';

const SOURCES: Record<SoundName, number> = {
  'stroke-done': require('@/assets/sounds/stroke-done.wav'),
  'char-done': require('@/assets/sounds/char-done.wav'),
  'level-done': require('@/assets/sounds/level-done.wav'),
  'wrong': require('@/assets/sounds/wrong.wav'),
};

const players = new Map<SoundName, AudioPlayer>();
let audioModeReady = false;

function player(name: SoundName): AudioPlayer | undefined {
  try {
    if (!audioModeReady) {
      audioModeReady = true;
      setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
    }
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players.set(name, p);
    }
    return p;
  } catch {
    return undefined;
  }
}

export function playSound(name: SoundName) {
  try {
    const p = player(name);
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch {
    // audio is decorative — never break the lesson over it
  }
}
