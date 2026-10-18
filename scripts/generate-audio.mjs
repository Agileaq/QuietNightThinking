import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOTAL_SECONDS = 32.0;
const SAMPLE_RATE = 24000;

const PHRASES = [
  { id: 'intro', startSec: 1.2, rate: 138, text: '静夜思。唐，李白。' },
  { id: 'verse1', startSec: 5.8, rate: 125, text: '床前，明月光，' },
  { id: 'verse2', startSec: 11.8, rate: 125, text: '疑是，地上霜。' },
  { id: 'verse3', startSec: 17.8, rate: 122, text: '举头，望明月，' },
  { id: 'verse4', startSec: 24.2, rate: 118, text: '低头，思故乡。' },
];

function detectChineseVoice() {
  try {
    const out = execFileSync('say', ['-v', '?'], { encoding: 'utf8' });
    const lines = out.split('\n');
    const preferred = ['Tingting', 'Meijia', 'Sinji'];
    for (const name of preferred) {
      if (lines.some((l) => l.startsWith(name + ' ') || l.includes(name))) {
        return name;
      }
    }
    const zhLine = lines.find((l) => l.includes('zh_CN') || l.includes('zh_TW'));
    if (zhLine) {
      return zhLine.trim().split(/\s+/)[0];
    }
  } catch {
    // Fallback default
  }
  return 'Tingting';
}

function readWavPcm16Mono(wavPath) {
  const buf = fs.readFileSync(wavPath);
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const dataStart = offset + 8;
      const sampleCount = Math.floor(chunkSize / 2);
      const samples = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount && dataStart + i * 2 + 1 < buf.length; i += 1) {
        samples[i] = buf.readInt16LE(dataStart + i * 2) / 32768.0;
      }
      return samples;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return new Float32Array(0);
}

function writeWavPcm16Stereo(filePath, left, right, sampleRate) {
  const numSamples = left.length;
  const dataSize = numSamples * 4;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // Stereo
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let pos = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), pos);
    buf.writeInt16LE(Math.round(r * 32767), pos + 2);
    pos += 4;
  }
  fs.writeFileSync(filePath, buf);
}

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qnt-audio-'));
  const totalSamples = Math.floor(TOTAL_SECONDS * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);
  const voice = detectChineseVoice();

  for (const phrase of PHRASES) {
    const aiffPath = path.join(tmpDir, `${phrase.id}.aiff`);
    const wavPath = path.join(tmpDir, `${phrase.id}.wav`);
    try {
      execFileSync('say', ['-v', voice, '-r', String(phrase.rate), '-o', aiffPath, phrase.text]);
      execFileSync('afconvert', [
        '-f',
        'WAVE',
        '-d',
        `LEI16@${SAMPLE_RATE}`,
        '-c',
        '1',
        aiffPath,
        wavPath,
      ]);
      const samples = readWavPcm16Mono(wavPath);
      const startIdx = Math.floor(phrase.startSec * SAMPLE_RATE);

      // Mix dry voice + gentle stereo courtyard reverb taps
      const taps = [
        { delaySec: 0.0, gainL: 0.88, gainR: 0.88 },
        { delaySec: 0.11, gainL: 0.22, gainR: 0.14 },
        { delaySec: 0.24, gainL: 0.12, gainR: 0.18 },
        { delaySec: 0.41, gainL: 0.08, gainR: 0.06 },
      ];

      for (const tap of taps) {
        const delaySamples = Math.floor(tap.delaySec * SAMPLE_RATE);
        for (let i = 0; i < samples.length; i += 1) {
          const dst = startIdx + delaySamples + i;
          if (dst < totalSamples) {
            left[dst] += samples[i] * tap.gainL;
            right[dst] += samples[i] * tap.gainR;
          }
        }
      }
    } catch (err) {
      console.warn(`Warning generating ${phrase.id}:`, err.message);
    }
  }

  // Add subtle warm pentatonic resonance chime under each phrase so track is never silent
  const chimeNotes = [
    { startSec: 0.4, freq: 220.0, dur: 4.5, amp: 0.06 },
    { startSec: 5.2, freq: 293.66, dur: 5.0, amp: 0.05 },
    { startSec: 11.2, freq: 329.63, dur: 5.0, amp: 0.05 },
    { startSec: 17.2, freq: 440.0, dur: 5.5, amp: 0.05 },
    { startSec: 23.6, freq: 261.63, dur: 5.5, amp: 0.05 },
    { startSec: 29.0, freq: 220.0, dur: 2.9, amp: 0.05 },
  ];

  for (const n of chimeNotes) {
    const startIdx = Math.floor(n.startSec * SAMPLE_RATE);
    const len = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < len && startIdx + i < totalSamples; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / 0.04) * Math.exp(-t * 1.15);
      const sig =
        (Math.sin(2 * Math.PI * n.freq * t) +
          0.35 * Math.sin(2 * Math.PI * n.freq * 2 * t) +
          0.12 * Math.sin(2 * Math.PI * n.freq * 3 * t)) *
        env *
        n.amp;
      left[startIdx + i] += sig;
      right[startIdx + i] += sig * 0.95;
    }
  }

  const outDir = path.resolve('public/audio');
  fs.mkdirSync(outDir, { recursive: true });
  const wavOut = path.join(tmpDir, 'master.wav');
  writeWavPcm16Stereo(wavOut, left, right, SAMPLE_RATE);

  const mp3Out = path.join(outDir, 'recitation.mp3');
  try {
    execFileSync('ffmpeg', ['-y', '-i', wavOut, '-codec:a', 'libmp3lame', '-qscale:a', '3', mp3Out], {
      stdio: 'ignore',
    });
  } catch {
    // If ffmpeg is unavailable, write standard WAV bytes (browsers decode WAV/RIFF regardless of extension)
    fs.copyFileSync(wavOut, mp3Out);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  const stat = fs.statSync(mp3Out);
  console.log(`Generated ${mp3Out} (${stat.size} bytes, ${TOTAL_SECONDS}s)`);
}

main();
