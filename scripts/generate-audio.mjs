import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOTAL_SECONDS = 32.0;
const SAMPLE_RATE = 24000;

// Exact hemistich segments matching CHAPTERS.charTimings in src/core/TimelineData.js
const SEGMENTS = [
  // Intro: 静(1.20-1.63) 夜(1.65-2.08) 思(2.10-2.75) + 唐·李白(3.05-4.35)
  { id: 'intro_title', startSec: 1.20, targetDur: 1.48, text: '静夜思' },
  { id: 'intro_author', startSec: 3.05, targetDur: 1.25, text: '唐，李白' },

  // Verse 1: 床(5.80-6.30) 前(6.32-6.85) | 明(7.25-7.72) 月(7.75-8.22) 光(8.25-8.95)
  { id: 'v1_a', startSec: 5.80, targetDur: 1.04, text: '床前' },
  { id: 'v1_b', startSec: 7.25, targetDur: 1.62, text: '明月光' },

  // Verse 2: 疑(11.80-12.30) 是(12.32-12.85) | 地(13.25-13.72) 上(13.75-14.22) 霜(14.25-14.95)
  { id: 'v2_a', startSec: 11.80, targetDur: 1.04, text: '疑是' },
  { id: 'v2_b', startSec: 13.25, targetDur: 1.62, text: '地上霜' },

  // Verse 3: 举(17.80-18.30) 头(18.32-18.85) | 望(19.25-19.72) 明(19.75-20.22) 月(20.25-20.95)
  { id: 'v3_a', startSec: 17.80, targetDur: 1.04, text: '举头' },
  { id: 'v3_b', startSec: 19.25, targetDur: 1.62, text: '望明月' },

  // Verse 4: 低(24.20-24.70) 头(24.72-25.25) | 思(25.65-26.12) 故(26.15-26.62) 乡(26.65-27.40)
  { id: 'v4_a', startSec: 24.20, targetDur: 1.04, text: '低头' },
  { id: 'v4_b', startSec: 25.65, targetDur: 1.68, text: '思故乡' },
];

const VOICE_PROFILES = [
  {
    id: 'poet',
    fileName: 'recitation-poet.mp3',
    sayVoice: 'Rocko (Chinese (China mainland))',
    fallbackVoice: 'Reed (Chinese (China mainland))',
    sayRate: 135,
    lowpassAlpha: 0.42, // Rich warm baritone chest resonance
    gain: 1.05,
  },
  {
    id: 'scholar',
    fileName: 'recitation-scholar.mp3',
    sayVoice: 'Reed (Chinese (China mainland))',
    fallbackVoice: 'Eddy (Chinese (China mainland))',
    sayRate: 145,
    lowpassAlpha: 0.72, // Clear young scholar timbre
    gain: 0.98,
  },
  {
    id: 'elder',
    fileName: 'recitation-elder.mp3',
    sayVoice: 'Grandpa (Chinese (China mainland))',
    fallbackVoice: 'Rocko (Chinese (China mainland))',
    sayRate: 120,
    lowpassAlpha: 0.36, // Deep, aged contemplative voice
    gain: 1.08,
  },
  {
    id: 'female',
    fileName: 'recitation-female.mp3',
    sayVoice: 'Tingting',
    fallbackVoice: 'Meijia',
    sayRate: 140,
    lowpassAlpha: 0.88, // Crisp, ethereal female voice
    gain: 0.94,
  },
];

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

function trimSilence(samples, threshold = 0.012) {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  // Keep a tiny 15ms natural attack & 35ms release cushion
  const attackPad = Math.floor(0.015 * SAMPLE_RATE);
  const releasePad = Math.floor(0.035 * SAMPLE_RATE);
  start = Math.max(0, start - attackPad);
  end = Math.min(samples.length - 1, end + releasePad);
  return samples.slice(start, end + 1);
}

function fitAndFilterSamples(rawSamples, targetLength, lowpassAlpha, gain) {
  if (rawSamples.length === 0 || targetLength <= 0) {
    return new Float32Array(0);
  }
  const out = new Float32Array(targetLength);
  const srcLen = rawSamples.length;
  let prev = 0;

  for (let i = 0; i < targetLength; i += 1) {
    const srcPos = (i / targetLength) * (srcLen - 1);
    const idx0 = Math.floor(srcPos);
    const idx1 = Math.min(srcLen - 1, idx0 + 1);
    const frac = srcPos - idx0;
    const interpolated = rawSamples[idx0] * (1 - frac) + rawSamples[idx1] * frac;

    // 1-pole warmth filter + soft saturation
    prev = prev + lowpassAlpha * (interpolated - prev);
    const blended = interpolated * 0.65 + prev * 0.55;

    // Smooth fade-in (15ms) and fade-out (45ms) envelope
    const fadeInSamples = Math.min(targetLength * 0.1, 0.015 * SAMPLE_RATE);
    const fadeOutSamples = Math.min(targetLength * 0.15, 0.045 * SAMPLE_RATE);
    let env = 1.0;
    if (i < fadeInSamples) {
      env = i / fadeInSamples;
    } else if (i > targetLength - fadeOutSamples) {
      env = (targetLength - i) / fadeOutSamples;
    }

    out[i] = Math.tanh(blended * gain) * env;
  }
  return out;
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
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
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

function addPentatonicUnderscore(left, right, totalSamples) {
  const chimeNotes = [
    { startSec: 0.4, freq: 220.0, dur: 4.5, amp: 0.045 },
    { startSec: 5.2, freq: 293.66, dur: 5.0, amp: 0.04 },
    { startSec: 11.2, freq: 329.63, dur: 5.0, amp: 0.04 },
    { startSec: 17.2, freq: 440.0, dur: 5.5, amp: 0.04 },
    { startSec: 23.6, freq: 261.63, dur: 5.5, amp: 0.04 },
    { startSec: 29.0, freq: 220.0, dur: 2.9, amp: 0.045 },
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
}

function generateTrackForProfile(profile, tmpDir, outDir) {
  const totalSamples = Math.floor(TOTAL_SECONDS * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (const seg of SEGMENTS) {
    const aiffPath = path.join(tmpDir, `${profile.id}_${seg.id}.aiff`);
    const wavPath = path.join(tmpDir, `${profile.id}_${seg.id}.wav`);
    try {
      try {
        execFileSync('say', ['-v', profile.sayVoice, '-r', String(profile.sayRate), '-o', aiffPath, seg.text]);
      } catch {
        execFileSync('say', ['-v', profile.fallbackVoice, '-r', String(profile.sayRate), '-o', aiffPath, seg.text]);
      }

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

      const raw = readWavPcm16Mono(wavPath);
      const trimmed = trimSilence(raw);
      const targetLen = Math.floor(seg.targetDur * SAMPLE_RATE);
      const fitted = fitAndFilterSamples(trimmed, targetLen, profile.lowpassAlpha, profile.gain);

      const startIdx = Math.floor(seg.startSec * SAMPLE_RATE);

      // Stereo courtyard reverb taps (keeps onset crisp while adding poetic space)
      const taps = [
        { delaySec: 0.0, gainL: 0.88, gainR: 0.88 },
        { delaySec: 0.095, gainL: 0.2, gainR: 0.13 },
        { delaySec: 0.21, gainL: 0.11, gainR: 0.17 },
        { delaySec: 0.36, gainL: 0.06, gainR: 0.05 },
      ];

      for (const tap of taps) {
        const delaySamples = Math.floor(tap.delaySec * SAMPLE_RATE);
        for (let i = 0; i < fitted.length; i += 1) {
          const dst = startIdx + delaySamples + i;
          if (dst < totalSamples) {
            left[dst] += fitted[i] * tap.gainL;
            right[dst] += fitted[i] * tap.gainR;
          }
        }
      }
    } catch (err) {
      console.warn(`Warning generating ${profile.id}/${seg.id}:`, err.message);
    }
  }

  addPentatonicUnderscore(left, right, totalSamples);

  const outPath = path.join(outDir, profile.fileName);
  writeWavPcm16Stereo(outPath, left, right, SAMPLE_RATE);
  console.log(`Generated ${outPath}`);
  return outPath;
}

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qnt-voices-'));
  const outDir = path.resolve('public/audio');
  fs.mkdirSync(outDir, { recursive: true });

  for (const profile of VOICE_PROFILES) {
    generateTrackForProfile(profile, tmpDir, outDir);
  }

  // Copy default 'poet' track to recitation.mp3 for backward compatibility
  fs.copyFileSync(
    path.join(outDir, 'recitation-poet.mp3'),
    path.join(outDir, 'recitation.mp3'),
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main();
