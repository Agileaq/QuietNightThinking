import { describe, it, expect, vi } from 'vitest';
import {
  TOTAL_DURATION,
  CHAPTERS,
  clampTime,
  getChapterAt,
  getSceneStateAt,
  getCameraPose,
} from '../src/core/TimelineData.js';
import { TimelineEngine } from '../src/core/TimelineEngine.js';

describe('TimelineData deterministic state', () => {
  it('clamps out-of-range and NaN timestamps to [0, 32]', () => {
    expect(clampTime(-5)).toBe(0);
    expect(clampTime(99)).toBe(TOTAL_DURATION);
    expect(clampTime(Number.NaN)).toBe(0);
  });

  it('maps timestamps to the 6 spec chapters', () => {
    expect(CHAPTERS).toHaveLength(6);
    expect(getChapterAt(0).id).toBe('intro');
    expect(getChapterAt(6.0).id).toBe('verse1');
    expect(getChapterAt(12.5).id).toBe('verse2');
    expect(getChapterAt(19.0).id).toBe('verse3');
    expect(getChapterAt(26.0).id).toBe('verse4');
    expect(getChapterAt(30.5).id).toBe('outro');
  });

  it('computes frost progression in verse2 and holds it afterward', () => {
    expect(getSceneStateAt(4.0).frost).toBe(0);
    const midFrost = getSceneStateAt(14.0).frost;
    expect(midFrost).toBeGreaterThan(0.2);
    expect(midFrost).toBeLessThan(0.95);
    expect(getSceneStateAt(18.0).frost).toBeGreaterThanOrEqual(0.95);
  });

  it('choreographs poet actions across all 6 chapters: turn to bed (verse1), look at frosted floor (verse2), look up at moon (verse3), bow head (verse4), and move back to initial state (outro)', () => {
    const initial = getSceneStateAt(2.0);
    expect(initial.poetAction).toBe('initial');
    expect(initial.headPitch).toBeCloseTo(0, 1);

    // Verse 1 ("床前明月光"): turns toward the bed in the eastern chamber
    const v1 = getSceneStateAt(8.5);
    expect(v1.poetAction).toBe('look_at_bed');
    expect(Math.abs(v1.poetRotationY - initial.poetRotationY)).toBeGreaterThan(1.2);

    // Verse 2 ("疑是地上霜"): looks down at the frost-covered indoor floor
    const v2 = getSceneStateAt(14.5);
    expect(v2.poetAction).toBe('look_at_frost');
    expect(v2.headPitch).toBeLessThan(-0.3);

    // Verse 3 ("举头望明月"): turns to window and raises head to gaze at the moon
    const v3 = getSceneStateAt(21.0);
    expect(v3.poetAction).toBe('look_at_moon');
    expect(v3.headPitch).toBeGreaterThan(0.45);
    expect(v3.poetRotationY).toBeCloseTo(Math.PI, 1);

    // Verse 4 ("低头思故乡"): bows head deeply
    const v4 = getSceneStateAt(26.5);
    expect(v4.poetAction).toBe('bow_head_homesick');
    expect(v4.headPitch).toBeLessThan(-0.35);

    // Outro ("尾 · 余韵"): moves and rotates back to initial state
    const outroEnd = getSceneStateAt(31.8);
    expect(outroEnd.poetAction).toBe('return_to_initial');
    expect(outroEnd.poetPosition[0]).toBeCloseTo(initial.poetPosition[0], 2);
    expect(outroEnd.poetPosition[2]).toBeCloseTo(initial.poetPosition[2], 2);
    expect(outroEnd.poetRotationY).toBeCloseTo(initial.poetRotationY, 2);
    expect(outroEnd.headPitch).toBeCloseTo(initial.headPitch, 2);
  });

  it('activates homelandGlow during verse4 and camera lookAt elevates on verse3', () => {
    expect(getSceneStateAt(10.0).homelandGlow).toBe(0);
    expect(getSceneStateAt(26.5).homelandGlow).toBeGreaterThan(0.6);
    const poseVerse2 = getCameraPose(14.0);
    const poseVerse3 = getCameraPose(21.0);
    expect(poseVerse3.target[1]).toBeGreaterThan(poseVerse2.target[1] + 5.0);
  });

  it('synchronizes activeCharIndex and speakingCharIndex with exact 2-3 poetic cadence', () => {
    // Verse 1: 床(5.80-6.13) 前(6.13-6.50) [pause 6.50-7.25] 明(7.25-7.52) 月(7.52-7.79) 光(7.79-8.15)
    const beforeSpeak = getSceneStateAt(5.4);
    expect(beforeSpeak.activeCharIndex).toBe(0);
    expect(beforeSpeak.speakingCharIndex).toBe(-1);

    const char1 = getSceneStateAt(5.95); // "床"
    expect(char1.activeCharIndex).toBe(1);
    expect(char1.speakingCharIndex).toBe(0);

    const char2 = getSceneStateAt(6.3); // "前"
    expect(char2.activeCharIndex).toBe(2);
    expect(char2.speakingCharIndex).toBe(1);

    const caesuraPause = getSceneStateAt(6.95); // 2-3 poetic pause between 前 and 明
    expect(caesuraPause.activeCharIndex).toBe(2);
    expect(caesuraPause.speakingCharIndex).toBe(-1);

    const char3 = getSceneStateAt(7.38); // "明"
    expect(char3.activeCharIndex).toBe(3);
    expect(char3.speakingCharIndex).toBe(2);

    const char5 = getSceneStateAt(7.95); // "光"
    expect(char5.activeCharIndex).toBe(5);
    expect(char5.speakingCharIndex).toBe(4);
  });
});

describe('TimelineEngine playback & scrubbing', () => {
  it('advances time while playing, preserves pause state on seek, and stops at 32s', () => {
    const onEnded = vi.fn();
    const onChapterChange = vi.fn();
    const engine = new TimelineEngine({ onEnded, onChapterChange });

    engine.play();
    expect(engine.isPlaying).toBe(true);
    engine.update(6.0);
    expect(engine.currentTime).toBeCloseTo(6.0, 3);
    expect(onChapterChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'verse1' }));

    engine.pause();
    engine.seek(20.0);
    expect(engine.isPlaying).toBe(false);
    expect(engine.currentTime).toBe(20.0);

    engine.play();
    engine.update(20.0);
    expect(engine.currentTime).toBe(TOTAL_DURATION);
    expect(engine.isPlaying).toBe(false);
    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
