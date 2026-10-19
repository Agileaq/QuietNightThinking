import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOTAL_SECONDS = 32.0;
const SAMPLE_RATE = 24000;

// Hemistich segments placed at exact poetic timestamps — NO time-stretching / NO resampling!
const SEGMENTS = [
  { id: 'intro_title', startSec: 1.20, text: '静夜思', chars: ['静', '夜', '思'] },
  { id: 'intro_author', startSec: 3.05, text: '唐，李白', chars: [] },

  { id: 'v1_a', startSec: 5.80, text: '床前', chars: ['床', '前'] },
  { id: 'v1_b', startSec: 7.25, text: '明月光', chars: ['明', '月', '光'] },

  { id: 'v2_a', startSec: 11.80, text: '疑是', chars: ['疑', '是'] },
  { id: 'v2_b', startSec: 13.25, text: '地上霜', chars: ['地', '上', '霜'] },

  { id: 'v3_a', startSec: 17.80, text: '举头', chars: ['举', '头'] },
  { id: 'v3_b', startSec: 19.25, text: '望明月', chars: ['望', '明', '月'] },

  { id: 'v4_a', startSec: 24.20, text: '低头', chars: ['低', '头'] },
  { id: 'v4_b', startSec: 25.65, text: '思故乡', chars: ['思', '故', '乡'] },
];

// 4 distinct Microsoft Edge Neural Chinese voices (100% native pitch, zero resampling distortion)
const VOICE_PROFILES = [
  {
    id: 'poet',
    fileName: 'recitation-poet.mp3',
    edgeVoice: 'zh-CN-YunjianNeural',
    edgeRate: '-18%',
    edgePitch: '-4Hz',
    fallbackSayVoice: 'Tingting',
    fallbackSayRate: 130,
    gain: 0.95,
  },
  {
    id: 'scholar',
    fileName: 'recitation-scholar.mp3',
    edgeVoice: 'zh-CN-YunxiNeural',
    edgeRate: '-15%',
    edgePitch: '+0Hz',
    fallbackSayVoice: 'Tingting',
    fallbackSayRate: 138,
    gain: 0.95,
  },
  {
    id: 'elder',
    fileName: 'recitation-elder.mp3',
    edgeVoice: 'zh-CN-YunyangNeural',
    edgeRate: '-22%',
    edgePitch: '-8Hz',
    fallbackSayVoice: 'Tingting',
    fallbackSayRate: 118,
    gain: 0.96,
  },
  {
    id: 'female',
    fileName: 'recitation-female.mp3',
    edgeVoice: 'zh-CN-XiaoxiaoNeural',
    edgeRate: '-16%',
    edgePitch: '+0Hz',
    fallbackSayVoice: 'Tingting',
    fallbackSayRate: 132,
    gain: 0.95,
  },
];

function findEdgeTtsBin() {
  const candidates = ['/tmp/tts-venv/bin/edge-tts', 'edge-tts'];
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['--version'], { stdio: 'ignore' });
      return bin;
    } catch {
      // Try next
    }
  }
  return null;
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

function trimSilence(samples, threshold = 0.015) {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  const attackPad = Math.floor(0.012 * SAMPLE_RATE);
  const releasePad = Math.floor(0.04 * SAMPLE_RATE);
  start = Math.max(0, start - attackPad);
  end = Math.min(samples.length - 1, end + releasePad);
  return samples.slice(start, end + 1);
}

// Preserves 100% original sample rate & pitch — only applies a gentle 10ms fade-in / 30ms fade-out
function applyCleanEnvelope(samples, gain = 0.95) {
  const len = samples.length;
  const out = new Float32Array(len);
  const fadeIn = Math.min(len * 0.1, Math.floor(0.01 * SAMPLE_RATE));
  const fadeOut = Math.min(len * 0.15, Math.floor(0.03 * SAMPLE_RATE));
  for (let i = 0; i < len; i += 1) {
    let env = 1.0;
    if (i < fadeIn) env = i / fadeIn;
    else if (i > len - fadeOut) env = (len - i) / fadeOut;
    out[i] = Math.max(-0.98, Math.min(0.98, samples[i] * gain * env));
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
    { startSec: 0.4, freq: 220.0, dur: 4.5, amp: 0.04 },
    { startSec: 5.2, freq: 293.66, dur: 5.0, amp: 0.035 },
    { startSec: 11.2, freq: 329.63, dur: 5.0, amp: 0.035 },
    { startSec: 17.2, freq: 440.0, dur: 5.5, amp: 0.035 },
    { startSec: 23.6, freq: 261.63, dur: 5.5, amp: 0.035 },
    { startSec: 29.0, freq: 220.0, dur: 2.9, amp: 0.04 },
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

function generateTrackForProfile(profile, edgeTtsBin, tmpDir, outDir) {
  const totalSamples = Math.floor(TOTAL_SECONDS * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (const seg of SEGMENTS) {
    const rawMediaPath = path.join(tmpDir, `${profile.id}_${seg.id}.mp3`);
    const wavPath = path.join(tmpDir, `${profile.id}_${seg.id}.wav`);
    try {
      if (edgeTtsBin) {
        execFileSync(edgeTtsBin, [
          '--voice',
          profile.edgeVoice,
          `--rate=${profile.edgeRate}`,
          `--pitch=${profile.edgePitch}`,
          '--text',
          seg.text,
          '--write-media',
          rawMediaPath,
        ]);
      } else {
        const aiffPath = path.join(tmpDir, `${profile.id}_${seg.id}.aiff`);
        execFileSync('say', [
          '-v',
          profile.fallbackSayVoice,
          '-r',
          String(profile.fallbackSayRate),
          '-o',
          aiffPath,
          seg.text,
        ]);
        fs.copyFileSync(aiffPath, rawMediaPath);
      }

      execFileSync('afconvert', [
        '-f',
        'WAVE',
        '-d',
        `LEI16@${SAMPLE_RATE}`,
        '-c',
        '1',
        rawMediaPath,
        wavPath,
      ]);

      const raw = readWavPcm16Mono(wavPath);
      const trimmed = trimSilence(raw);
      const clean = applyCleanEnvelope(trimmed, profile.gain);
      const durSec = clean.length / SAMPLE_RATE;

      if (profile.id === 'poet') {
        console.log(
          `[Timing ${seg.id} "${seg.text}"] start=${seg.startSec.toFixed(2)}s, naturalDur=${durSec.toFixed(2)}s, end=${(seg.startSec + durSec).toFixed(2)}s`,
        );
      }

      const startIdx = Math.floor(seg.startSec * SAMPLE_RATE);
      const taps = [
        { delaySec: 0.0, gainL: 0.9, gainR: 0.9 },
        { delaySec: 0.095, gainL: 0.16, gainR: 0.11 },
        { delaySec: 0.21, gainL: 0.09, gainR: 0.13 },
      ];

      for (const tap of taps) {
        const delaySamples = Math.floor(tap.delaySec * SAMPLE_RATE);
        for (let i = 0; i < clean.length; i += 1) {
          const dst = startIdx + delaySamples + i;
          if (dst < totalSamples) {
            left[dst] += clean[i] * tap.gainL;
            right[dst] += clean[i] * tap.gainR;
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
}

function main() {
  const edgeTtsBin = findEdgeTtsBin();
  console.log(`Using TTS engine: ${edgeTtsBin || 'macOS say fallback'}`);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qnt-neural-'));
  const outDir = path.resolve('public/audio');
  fs.mkdirSync(outDir, { recursive: true });

  for (const profile of VOICE_PROFILES) {
    generateTrackForProfile(profile, edgeTtsBin, tmpDir, outDir);
  }

  fs.copyFileSync(
    path.join(outDir, 'recitation-poet.mp3'),
    path.join(outDir, 'recitation.mp3'),
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main();
