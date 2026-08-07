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

/** note: {freq, start, dur, vol, overtones} with soft attack + exp decay */
function render(notes, totalDur) {
  const n = Math.floor(SR * totalDur);
  const out = new Float64Array(n);
  for (const { freq, start, dur, vol = 0.5, glide, overtones = [], attack = 0.008 } of notes) {
    const s0 = Math.floor(start * SR);
    const s1 = Math.min(n, Math.floor((start + dur) * SR));
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const f = glide ? freq + (glide - freq) * (t / dur) : freq;
      const atk = t < attack ? t / attack : 1;
      const env = atk * Math.exp(-2.4 * (t / dur));
      let s = sine(f, t);
      for (let o = 0; o < overtones.length; o++) {
        s += overtones[o] * sine(f * (o + 2), t);
      }
      out[i] += s * vol * env;
    }
  }
  // gentle limiter to avoid clipping when notes overlap
  for (let i = 0; i < n; i++) {
    if (out[i] > 1) out[i] = 1;
    if (out[i] < -1) out[i] = -1;
  }
  return out;
}

// C5=523, D5=587, E5=659, G5=784, C6=1047, E6=1319, G6=1568
const SOUNDS = {
  // bright bell-like ding with sparkle on each correct stroke
  'stroke-done': render(
    [
      { freq: 1047, start: 0, dur: 0.4, vol: 0.42, overtones: [0.25, 0.12] },
      { freq: 1568, start: 0.02, dur: 0.3, vol: 0.12 },
    ],
    0.45,
  ),
  // ascending triad (C-E-G-C) with shimmer — a small "yay!"
  'char-done': render(
    [
      { freq: 523, start: 0, dur: 0.16, vol: 0.4, overtones: [0.15] },
      { freq: 659, start: 0.1, dur: 0.16, vol: 0.4, overtones: [0.15] },
      { freq: 784, start: 0.2, dur: 0.18, vol: 0.45, overtones: [0.18] },
      { freq: 1047, start: 0.32, dur: 0.5, vol: 0.5, overtones: [0.25, 0.1] },
      { freq: 1568, start: 0.36, dur: 0.4, vol: 0.15 },
    ],
    0.85,
  ),
  // triumphant fanfare — rising arpeggio + sustained high chord
  'level-done': render(
    [
      { freq: 523, start: 0, dur: 0.18, vol: 0.4, overtones: [0.15] },
      { freq: 659, start: 0.14, dur: 0.18, vol: 0.4, overtones: [0.15] },
      { freq: 784, start: 0.28, dur: 0.18, vol: 0.45, overtones: [0.18] },
      { freq: 1047, start: 0.42, dur: 0.7, vol: 0.5, overtones: [0.25, 0.12] },
      { freq: 1319, start: 0.46, dur: 0.6, vol: 0.3, overtones: [0.12] },
      { freq: 1568, start: 0.5, dur: 0.5, vol: 0.18 },
    ],
    1.25,
  ),
  // soft gentle "uh-oh" — not punitive, just a nudge
  'wrong': render(
    [
      { freq: 392, glide: 330, start: 0, dur: 0.14, vol: 0.32, overtones: [0.08] },
      { freq: 294, glide: 247, start: 0.12, dur: 0.22, vol: 0.28, overtones: [0.06] },
    ],
    0.35,
  ),
};

await mkdir(path.resolve('assets/sounds'), { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  await writeFile(path.resolve('assets/sounds', `${name}.wav`), wav(samples));
  console.log(`ok ${name}.wav (${(samples.length / SR).toFixed(2)}s)`);
}
