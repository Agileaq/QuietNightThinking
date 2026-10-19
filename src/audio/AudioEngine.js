import { clampTime, TOTAL_DURATION } from '../core/TimelineData.js';

export const VOICE_PRESETS = [
  {
    id: 'scholar',
    label: '青莲 · 清朗书生',
    url: '/audio/recitation-scholar.mp3?v=neural2',
    fallbackPitch: 1.0,
    fallbackRate: 0.85,
  },
  {
    id: 'female',
    label: '明月 · 温婉女声',
    url: '/audio/recitation-female.mp3?v=neural2',
    fallbackPitch: 1.1,
    fallbackRate: 0.84,
  },
  {
    id: 'poet',
    label: '太白 · 浑厚男声',
    url: '/audio/recitation-poet.mp3?v=neural2',
    fallbackPitch: 0.88,
    fallbackRate: 0.82,
  },
  {
    id: 'elder',
    label: '沧桑 · 老者吟诵',
    url: '/audio/recitation-elder.mp3?v=neural2',
    fallbackPitch: 0.82,
    fallbackRate: 0.78,
  },
];

export const RECITATION_CUES = [
  { id: 'intro', start: 1.2, end: 4.2, text: '静夜思。唐，李白。' },
  { id: 'verse1', start: 5.8, end: 9.0, text: '床前，明月光，' },
  { id: 'verse2', start: 11.8, end: 15.0, text: '疑是，地上霜。' },
  { id: 'verse3', start: 17.8, end: 21.0, text: '举头，望明月，' },
  { id: 'verse4', start: 24.2, end: 27.5, text: '低头，思故乡。' },
];

export const GUQIN_SCORE = [
  // Intro (0 - 5s): Sparse harmonics in the quiet night
  { time: 0.25, freq: 220.0, duration: 2.8, type: 'harmonic' },
  { time: 1.6, freq: 329.63, duration: 2.4, type: 'harmonic' },
  { time: 3.1, freq: 293.66, duration: 2.5, type: 'pluck' },
  { time: 4.3, freq: 220.0, duration: 2.6, type: 'harmonic' },

  // Verse 1 (5 - 11s): "床前明月光"
  { time: 5.2, freq: 146.83, duration: 3.2, type: 'pluck' },
  { time: 6.6, freq: 220.0, duration: 2.5, type: 'pluck' },
  { time: 7.9, freq: 261.63, duration: 2.4, type: 'harmonic' },
  { time: 9.2, freq: 293.66, duration: 2.6, type: 'pluck' },
  { time: 10.3, freq: 220.0, duration: 2.4, type: 'harmonic' },

  // Verse 2 (11 - 17s): "疑是地上霜" — crystalline high harmonics
  { time: 11.2, freq: 329.63, duration: 2.8, type: 'harmonic' },
  { time: 12.5, freq: 392.0, duration: 2.2, type: 'harmonic' },
  { time: 13.8, freq: 329.63, duration: 2.4, type: 'pluck' },
  { time: 15.1, freq: 261.63, duration: 2.6, type: 'harmonic' },
  { time: 16.2, freq: 196.0, duration: 2.8, type: 'pluck' },

  // Verse 3 (17 - 23.5s): "举头望明月" — ascending melody
  { time: 17.2, freq: 164.81, duration: 3.0, type: 'pluck' },
  { time: 18.5, freq: 220.0, duration: 2.6, type: 'pluck' },
  { time: 19.7, freq: 293.66, duration: 2.8, type: 'pluck' },
  { time: 20.9, freq: 329.63, duration: 3.0, type: 'harmonic' },
  { time: 22.3, freq: 440.0, duration: 3.2, type: 'harmonic' },

  // Verse 4 (23.5 - 29s): "低头思故乡" — warm, deep descending notes
  { time: 23.7, freq: 293.66, duration: 2.8, type: 'pluck' },
  { time: 25.0, freq: 261.63, duration: 2.8, type: 'pluck' },
  { time: 26.2, freq: 196.0, duration: 3.0, type: 'pluck' },
  { time: 27.5, freq: 146.83, duration: 3.2, type: 'pluck' },
  { time: 28.4, freq: 110.0, duration: 3.5, type: 'pluck' },

  // Outro (29 - 32s): Lingering resonance
  { time: 29.3, freq: 220.0, duration: 3.2, type: 'harmonic' },
  { time: 30.6, freq: 110.0, duration: 3.5, type: 'harmonic' },
];

const CRICKET_TIMES = [0.8, 2.4, 4.5, 8.8, 10.6, 14.8, 16.5, 21.8, 23.2, 27.8, 30.2, 31.4];

export function shouldTriggerCricketAt(prevTime, nextTime) {
  if (typeof prevTime !== 'number' || typeof nextTime !== 'number') return false;
  const delta = nextTime - prevTime;
  if (delta <= 0 || delta > 1.0) return false;
  return CRICKET_TIMES.some((t) => t >= prevTime && t < nextTime);
}

export function getTriggeredNotesBetween(prevTime, nextTime) {
  if (typeof prevTime !== 'number' || typeof nextTime !== 'number') {
    return [];
  }
  const delta = nextTime - prevTime;
  if (delta <= 0) {
    return [];
  }
  if (delta > 1.0) {
    const nearest = GUQIN_SCORE.find((n) => Math.abs(n.time - nextTime) <= 0.35);
    return nearest ? [nearest] : [];
  }
  return GUQIN_SCORE.filter((n) => n.time >= prevTime && n.time < nextTime);
}

export class AudioEngine {
  constructor({ voiceId = 'scholar', audioUrl = null } = {}) {
    const preset = VOICE_PRESETS.find((v) => v.id === voiceId) || VOICE_PRESETS[0];
    this.currentVoiceId = preset.id;
    this.audioUrl = audioUrl || preset.url;
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.ambienceNode = null;
    this.audioEl = null;
    this.audioReady = false;
    this.audioFailed = false;
    this.volume = 0.85;
    this.muted = false;
    this.isPlaying = false;
    this.lastSpokenCueId = null;
  }

  async init() {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.42;
        this.bgmGain.connect(this.masterGain);

        this._setupNightAmbience();
      }
    }

    if (!this.audioEl && typeof Audio !== 'undefined') {
      this._createAudioElement(this.audioUrl);
    }
  }

  _createAudioElement(url) {
    if (typeof Audio === 'undefined') return;
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch {
        // Ignore
      }
    }
    this.audioReady = false;
    this.audioFailed = false;
    this.audioEl = new Audio(url);
    this.audioEl.preload = 'auto';
    this.audioEl.volume = this.muted ? 0 : this.volume;
    this.audioEl.addEventListener('canplaythrough', () => {
      this.audioReady = true;
    });
    this.audioEl.addEventListener('error', () => {
      this.audioFailed = true;
    });
  }

  async setVoice(voiceId, currentTime = 0) {
    const preset = VOICE_PRESETS.find((v) => v.id === voiceId);
    if (!preset) return;

    this.currentVoiceId = preset.id;
    this.audioUrl = preset.url;
    this.lastSpokenCueId = null;

    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      const wasPlaying = this.isPlaying;
      this._createAudioElement(this.audioUrl);
      this.seek(currentTime);
      if (wasPlaying) {
        await this.play(currentTime);
      }
    }
  }

  async play(currentTime = 0) {
    this.isPlaying = true;
    await this.init();

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Ignore autoplay restriction errors in non-gesture contexts
      }
    }

    if (this.audioEl && !this.audioFailed) {
      try {
        const clamped = clampTime(currentTime);
        if (Math.abs(this.audioEl.currentTime - clamped) > 0.18) {
          this.audioEl.currentTime = clamped;
        }
        await this.audioEl.play();
      } catch {
        this.audioFailed = true;
        this._updateSpeechSynthesisFallback(currentTime);
      }
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch {
        // Ignore
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  seek(targetTime) {
    const t = clampTime(targetTime);
    this.lastSpokenCueId = null;
    if (this.audioEl && !this.audioFailed) {
      try {
        this.audioEl.currentTime = t;
      } catch {
        // Ignore if metadata not loaded yet
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  update(prevTime, currentTime) {
    if (!this.isPlaying) {
      return;
    }

    const notes = getTriggeredNotesBetween(prevTime, currentTime);
    for (const note of notes) {
      this._triggerGuqinNote(note);
    }

    if (shouldTriggerCricketAt(prevTime, currentTime)) {
      this._triggerCricketChirp();
    }

    // Keep HTMLAudioElement tightly locked (within 0.18s) to timeline for character-accurate sync
    if (this.audioEl && !this.audioFailed && !this.audioEl.paused) {
      const drift = Math.abs(this.audioEl.currentTime - currentTime);
      if (drift > 0.22 && currentTime < TOTAL_DURATION - 0.2) {
        try {
          this.audioEl.currentTime = currentTime;
        } catch {
          // Ignore
        }
      }
    } else if (this.audioFailed) {
      this._updateSpeechSynthesisFallback(currentTime);
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, Number(v) || 0));
    const effective = this.muted ? 0 : this.volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.04);
    }
    if (this.audioEl) {
      this.audioEl.volume = effective;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this.setVolume(this.volume);
  }

  _triggerGuqinNote(note) {
    if (!this.ctx || !this.bgmGain) {
      return;
    }
    const now = this.ctx.currentTime;
    const isHarmonic = note.type === 'harmonic';
    const baseFreq = note.freq;

    const noteGain = this.ctx.createGain();
    const peakGain = isHarmonic ? 0.16 : 0.22;
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + (isHarmonic ? 0.04 : 0.015));
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + note.duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHarmonic ? baseFreq * 4.5 : baseFreq * 6.0, now);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + note.duration * 0.85);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = isHarmonic ? 'sine' : 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(baseFreq * (isHarmonic ? 1.0 : 0.992), now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.09);

    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = isHarmonic ? 0.45 : 0.25;

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.bgmGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + note.duration + 0.05);
    osc2.stop(now + note.duration + 0.05);
  }

  _setupNightAmbience() {
    if (!this.ctx || !this.bgmGain || this.ambienceNode) {
      return;
    }
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.12;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 380;
    bandpass.Q.value = 1.5;

    const ambGain = this.ctx.createGain();
    ambGain.gain.value = 0.08;

    noiseSource.connect(bandpass);
    bandpass.connect(ambGain);
    ambGain.connect(this.bgmGain);
    noiseSource.start();
    this.ambienceNode = noiseSource;
  }

  _triggerCricketChirp() {
    if (!this.ctx || !this.bgmGain) {
      return;
    }
    const now = this.ctx.currentTime;
    for (let pulse = 0; pulse < 3; pulse += 1) {
      const start = now + pulse * 0.055;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4250 + pulse * 80, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.018, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);
      osc.connect(g);
      g.connect(this.bgmGain);
      osc.start(start);
      osc.stop(start + 0.045);
    }
  }

  _updateSpeechSynthesisFallback(currentTime) {
    if (typeof window === 'undefined' || !window.speechSynthesis || this.muted) {
      return;
    }
    const activeCue = RECITATION_CUES.find(
      (c) => currentTime >= c.start && currentTime <= c.start + 0.4,
    );
    if (activeCue && activeCue.id !== this.lastSpokenCueId) {
      this.lastSpokenCueId = activeCue.id;
      const preset = VOICE_PRESETS.find((v) => v.id === this.currentVoiceId) || VOICE_PRESETS[0];
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(activeCue.text);
        utter.lang = 'zh-CN';
        utter.rate = preset.fallbackRate;
        utter.pitch = preset.fallbackPitch;
        utter.volume = this.volume;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore
      }
    }
  }
}
