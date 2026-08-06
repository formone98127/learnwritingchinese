// Generates tiny PCM WAV sound effects into assets/sounds/.
// Usage: node scripts/gen-sounds.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SR = 22050;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32767, 44 + i * 2);
  }
  return buf;
}

const sine = (freq, t) => Math.sin(2 * Math.PI * freq * t);

/** note: {freq, start, dur, vol} with exponential decay */
function render(notes, totalDur) {
  const n = Math.floor(SR * totalDur);
  const out = new Float64Array(n);
  for (const { freq, start, dur, vol = 0.5, glide } of notes) {
    const s0 = Math.floor(start * SR);
    const s1 = Math.min(n, Math.floor((start + dur) * SR));
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const f = glide ? freq + (glide - freq) * (t / dur) : freq;
      const env = Math.exp(-3.2 * (t / dur));
      out[i] += sine(f, t) * vol * env;
    }
  }
  return out;
}

const SOUNDS = {
  // short bright ding on each correct stroke
  'stroke-done': render([{ freq: 988, start: 0, dur: 0.28, vol: 0.5 }], 0.3),
  // two-note chime on char completion
  'char-done': render(
    [
      { freq: 659, start: 0, dur: 0.18, vol: 0.5 },
      { freq: 988, start: 0.14, dur: 0.35, vol: 0.5 },
    ],
    0.55,
  ),
  // little arpeggio on level completion
  'level-done': render(
    [
      { freq: 523, start: 0, dur: 0.16, vol: 0.5 },
      { freq: 659, start: 0.13, dur: 0.16, vol: 0.5 },
      { freq: 784, start: 0.26, dur: 0.16, vol: 0.5 },
      { freq: 1047, start: 0.39, dur: 0.5, vol: 0.55 },
    ],
    0.95,
  ),
  // low buzz on wrong start
  'wrong': render([{ freq: 174, glide: 140, start: 0, dur: 0.18, vol: 0.4 }], 0.2),
};

await mkdir(path.resolve('assets/sounds'), { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  await writeFile(path.resolve('assets/sounds', `${name}.wav`), wav(samples));
  console.log(`ok ${name}.wav`);
}
