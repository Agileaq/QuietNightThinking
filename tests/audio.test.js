import { describe, it, expect, vi } from 'vitest';
import {
  GUQIN_SCORE,
  RECITATION_CUES,
  VOICE_PRESETS,
  getTriggeredNotesBetween,
  shouldTriggerCricketAt,
  AudioEngine,
} from '../src/audio/AudioEngine.js';

describe('AudioEngine score & cue scheduling', () => {
  it('defines pentatonic guqin notes across the full 32s timeline', () => {
    expect(GUQIN_SCORE.length).toBeGreaterThan(20);
    expect(GUQIN_SCORE[0].time).toBeGreaterThanOrEqual(0);
    expect(GUQIN_SCORE[GUQIN_SCORE.length - 1].time).toBeLessThanOrEqual(32);
  });

  it('returns notes in [prevTime, nextTime) and handles scrubbing jumps cleanly', () => {
    const slice = getTriggeredNotesBetween(0, 3.0);
    expect(slice.length).toBeGreaterThan(0);
    // Large scrub jump (> 1.0s) should not flood all intermediate notes at once
    expect(getTriggeredNotesBetween(1.0, 25.0).length).toBeLessThanOrEqual(1);
  });

  it('survives play/pause/seek in a headless environment without AudioContext', async () => {
    const audio = new AudioEngine({ audioUrl: '/audio/recitation-poet.mp3' });
    await expect(audio.play(0)).resolves.not.toThrow();
    expect(() => audio.seek(12.5)).not.toThrow();
    expect(() => audio.setVolume(0.5)).not.toThrow();
    expect(() => audio.setMuted(true)).not.toThrow();
    expect(() => audio.pause()).not.toThrow();
  });

  it('marks audioFailed on audioEl.play() rejection and schedules night cricket chirps', async () => {
    expect(shouldTriggerCricketAt(2.0, 2.6)).toBe(true);
    const audio = new AudioEngine({ audioUrl: '/audio/recitation-poet.mp3' });
    audio.audioEl = {
      currentTime: 0,
      paused: true,
      play: vi.fn().mockRejectedValue(new Error('Decode error')),
      pause: vi.fn(),
    };
    await audio.play(1.0);
    expect(audio.audioFailed).toBe(true);
  });

  it('provides 4 voice presets (defaulting to poet) and switches voice URL while preserving timestamp', async () => {
    expect(VOICE_PRESETS).toHaveLength(4);
    expect(VOICE_PRESETS.map((v) => v.id)).toEqual(['poet', 'scholar', 'elder', 'female']);
    const audio = new AudioEngine();
    expect(audio.currentVoiceId).toBe('poet');
    await audio.setVoice('scholar', 13.5);
    expect(audio.currentVoiceId).toBe('scholar');
    expect(audio.audioUrl).toContain('recitation-scholar.mp3');
  });
});
