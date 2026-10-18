# QuietNightThinking (《静夜思》Three.js 视听诗歌剧场) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, video-like 3D web presentation and recitation of Li Bai's《静夜思》using Three.js, synchronized pre-generated voice recitation, and procedural Web Audio guqin/night ambience.

**Architecture:** A deterministic 32.0-second timeline (`TimelineData` + `TimelineEngine`) drives all scene states as pure functions of current time `t ∈ [0, 32]`. A hybrid `CameraController` blends spline-interpolated cinematic shots with mouse parallax during playback and `OrbitControls` free inspection when paused. Audio combines a pre-generated 32s voice recitation MP3 (`public/audio/recitation.mp3`) with a deterministic Web Audio pentatonic guqin and night-ambience synthesizer.

**Tech Stack:** Vite, Three.js (`three`), Web Audio API, HTML5 Audio, Vitest (`vitest` for unit tests), macOS `say` + `ffmpeg` (for offline recitation audio generation).

**Spec:** `docs/superpowers/specs/2026-10-18-quiet-night-thinking-design.md`

## Global Constraints

- Total timeline duration MUST be exactly `TOTAL_DURATION = 32.0` seconds with 6 chapters: `intro` (`0.0-5.0`), `verse1` (`5.0-11.0`), `verse2` (`11.0-17.0`), `verse3` (`17.0-23.5`), `verse4` (`23.5-29.0`), `outro` (`29.0-32.0`).
- Every visual parameter (`frost`, `headPitch`, `homelandGlow`, `moonHalo`, camera `position` & `target`) MUST be deterministically computed from `t` so scrubbing to any timestamp immediately renders the exact frame state.
- Colour palette: Night indigo (`#070b16` ~ `#0f1a2e`), moonlight silver (`#d8e8ff`), candle/homeland warm gold (`#ffaa44`).
- Audio must work out-of-the-box with `public/audio/recitation.mp3` AND gracefully fall back to internal clock + `speechSynthesis` if audio playback fails or is blocked.

## Review Focus

- Out-of-bounds timeline scrubbing (`t < 0` or `t > 32` or `NaN`): `clampTime(t)` must clamp to `[0, 32.0]` and treat `NaN` as `0`.
- Seeking while paused vs playing: `engine.seek(t)` must update `currentTime` and notify subscribers immediately without unintentionally changing `isPlaying` (unless seeking away from `32.0` after completion).
- Reaching end of timeline (`t >= 32.0`): `engine.update(dt)` must clamp at `32.0`, set `isPlaying = false`, and fire `onEnded` callback exactly once.
- Audio element load failure or browser autoplay rejection: `AudioEngine.play(t)` must catch play rejections and never throw an unhandled promise rejection or stall `TimelineEngine`.
- Camera transition from paused `OrbitControls` back to cinematic playback: `CameraController.setPaused(false)` must smoothly damp from the user's orbited camera pose back to `getCameraPose(t)` without a jarring single-frame snap.

---

### Task 1: Project Scaffolding & Deterministic Timeline Core

**Files:**
- Create: `package.json`
- Create: `src/core/TimelineData.js`
- Create: `src/core/TimelineEngine.js`
- Test: `tests/timeline.test.js`

**Interfaces:**
- Consumes: none
- Produces:
  - `TOTAL_DURATION = 32.0`
  - `CHAPTERS`: Array of `{ id, title, subtitle, verseText, pinyin, start, end }` for `intro`, `verse1`, `verse2`, `verse3`, `verse4`, `outro`
  - `clampTime(t: number) -> number`
  - `getChapterAt(t: number) -> Chapter`
  - `getSceneStateAt(t: number) -> { t, chapter, chapterProgress, frost, headPitch, homelandGlow, moonHalo, candleFlicker, showAllVerses, activeCharIndex }`
  - `getCameraPose(t: number) -> { position: [number, number, number], target: [number, number, number], fov: number }`
  - `class TimelineEngine { constructor({ duration = 32.0, onUpdate, onPlayStateChange, onChapterChange, onEnded }); play(); pause(); toggle(); seek(t: number); update(dt: number); getState(); }`

- [ ] **Step 1: Initialize `package.json` with `three`, `vite`, and `vitest`, and install dependencies**

Create `package.json` with `"type": "module"`, scripts `"dev": "vite"`, `"build": "vite build"`, `"test": "vitest run"`, dependencies `"three": "^0.170.0"`, devDependencies `"vite": "^6.0.0"`, `"vitest": "^2.1.0"`, and run `npm install`.

- [ ] **Step 2: Write the failing unit tests in `tests/timeline.test.js`**

```javascript
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

  it('raises poet headPitch (> 0.35 rad) during verse3 and lowers (< -0.25 rad) during verse4', () => {
    expect(getSceneStateAt(2.0).headPitch).toBeCloseTo(0, 1);
    expect(getSceneStateAt(21.0).headPitch).toBeGreaterThan(0.35);
    expect(getSceneStateAt(26.5).headPitch).toBeLessThan(-0.25);
  });

  it('activates homelandGlow during verse4 and camera lookAt elevates on verse3', () => {
    expect(getSceneStateAt(10.0).homelandGlow).toBe(0);
    expect(getSceneStateAt(26.5).homelandGlow).toBeGreaterThan(0.6);
    const poseVerse2 = getCameraPose(14.0);
    const poseVerse3 = getCameraPose(21.0);
    expect(poseVerse3.target[1]).toBeGreaterThan(poseVerse2.target[1] + 5.0);
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/timeline.test.js`
Expected: FAIL with module not found `../src/core/TimelineData.js`

- [ ] **Step 4: Implement `src/core/TimelineData.js` and `src/core/TimelineEngine.js`**

Implement the 6 chapters (`intro`, `verse1` "床前明月光", `verse2` "疑是地上霜", `verse3` "举头望明月", `verse4` "低头思故乡", `outro`), smoothstep keyframe interpolation for `getCameraPose(t)` matching Section 3 of the spec, `getSceneStateAt(t)`, and `TimelineEngine`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/timeline.test.js`
Expected: PASS (all 6 tests passing)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/core/TimelineData.js src/core/TimelineEngine.js tests/timeline.test.js
git commit -m "feat(core): add deterministic 32s timeline data and engine"
```

---

### Task 2: Pre-generated Recitation Audio Track & Hybrid Audio Engine

**Files:**
- Create: `scripts/generate-audio.mjs`
- Create: `public/audio/recitation.mp3`
- Create: `src/audio/AudioEngine.js`
- Test: `tests/audio.test.js`

**Interfaces:**
- Consumes: `CHAPTERS`, `TOTAL_DURATION`, `clampTime` from `src/core/TimelineData.js`
- Produces:
  - `GUQIN_SCORE`: Array of `{ time: number, freq: number, duration: number, type: 'pluck' | 'harmonic' }` spanning `0..32s`
  - `RECITATION_CUES`: Array of `{ id: string, start: number, end: number, text: string }`
  - `getTriggeredNotesBetween(prevTime: number, nextTime: number) -> Array<Note>`
  - `class AudioEngine { constructor({ audioUrl = '/audio/recitation.mp3' }); async init(); async play(currentTime: number); pause(); seek(time: number); update(prevTime: number, currentTime: number); setVolume(v: number); setMuted(muted: boolean); }`

- [ ] **Step 1: Write the failing test in `tests/audio.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import {
  GUQIN_SCORE,
  RECITATION_CUES,
  getTriggeredNotesBetween,
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
    const audio = new AudioEngine({ audioUrl: '/audio/recitation.mp3' });
    await expect(audio.play(0)).resolves.not.toThrow();
    expect(() => audio.seek(12.5)).not.toThrow();
    expect(() => audio.setVolume(0.5)).not.toThrow();
    expect(() => audio.setMuted(true)).not.toThrow();
    expect(() => audio.pause()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio.test.js`
Expected: FAIL with module not found `../src/audio/AudioEngine.js`

- [ ] **Step 3: Create `scripts/generate-audio.mjs` and generate `public/audio/recitation.mp3`**

Write `scripts/generate-audio.mjs` using macOS `say -v Tingting` (with automatic fallback to any available `zh_CN` voice) and `ffmpeg` (`adelay` + `amix` + warm room reverb/EQ filter) to place the 5 recitation phrases at exact spec timestamps (`1.2s` "静夜思。唐，李白。", `5.8s` "床前，明月光，", `11.8s` "疑是，地上霜。", `17.8s` "举头，望明月，", `24.2s` "低头，思故乡。") into a 32.0-second stereo MP3 at `public/audio/recitation.mp3`. Run `node scripts/generate-audio.mjs` and verify `public/audio/recitation.mp3` exists and is ~32s.

- [ ] **Step 4: Implement `src/audio/AudioEngine.js`**

Implement `GUQIN_SCORE` (A-minor pentatonic `A2, C3, D3, E3, G3, A3, C4, D4, E4`), `RECITATION_CUES`, `getTriggeredNotesBetween(prevTime, nextTime)`, and `AudioEngine` (manages `<audio src="/audio/recitation.mp3">`, Web Audio API guqin pluck/harmonic synthesizer, continuous filtered pink-noise night breeze + cricket chirp modulator, and Web Speech API fallback if `<audio>` fails to load).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/audio.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-audio.mjs public/audio/recitation.mp3 src/audio/AudioEngine.js tests/audio.test.js
git commit -m "feat(audio): add 32s recitation audio track and Web Audio guqin synthesizer"
```

---

### Task 3: Hybrid Camera Controller

**Files:**
- Create: `src/core/CameraController.js`
- Test: `tests/camera.test.js`

**Interfaces:**
- Consumes: `getCameraPose(t)` from `src/core/TimelineData.js`, `THREE.PerspectiveCamera`, `OrbitControls` from `three/addons/controls/OrbitControls.js`
- Produces:
  - `class CameraController { constructor(camera: THREE.PerspectiveCamera, domElement?: HTMLElement); setMouseNormalized(nx: number, ny: number); setPaused(paused: boolean, currentTime: number); onSeek(currentTime: number); update(currentTime: number, dt: number, isPlaying: boolean); getMode() -> 'cinematic' | 'orbit'; }`

- [ ] **Step 1: Write the failing test in `tests/camera.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '../src/core/CameraController.js';

describe('CameraController hybrid cinematic & orbit behavior', () => {
  it('follows timeline camera pose and applies subtle mouse parallax when playing', () => {
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
    const controller = new CameraController(camera, null);

    controller.update(6.0, 0.016, true);
    const xBase = camera.position.x;

    controller.setMouseNormalized(1.0, 0.5);
    controller.update(6.0, 0.5, true);
    expect(camera.position.x).not.toBeCloseTo(xBase, 3);
    expect(controller.getMode()).toBe('cinematic');
  });

  it('switches mode to orbit when paused and smoothly blends back on resume', () => {
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
    const controller = new CameraController(camera, null);

    controller.update(10.0, 0.016, true);
    controller.setPaused(true, 10.0);
    expect(controller.getMode()).toBe('orbit');

    // Simulate user orbiting camera far away while paused
    camera.position.set(12, 8, 12);
    controller.setPaused(false, 10.0);
    expect(controller.getMode()).toBe('cinematic');

    // First frame after resume should blend rather than snap 100% instantaneously
    controller.update(10.0, 0.05, true);
    expect(camera.position.x).toBeGreaterThan(2.0);
    expect(camera.position.x).toBeLessThan(12.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/camera.test.js`
Expected: FAIL with module not found `../src/core/CameraController.js`

- [ ] **Step 3: Implement `src/core/CameraController.js`**

Implement `CameraController` supporting headless `domElement = null` in tests and attaching `OrbitControls` when `domElement` is provided in the browser. When `setPaused(false)` is called, set a transition blend factor that damps exponentially back to the timeline spline pose over ~0.4s.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/camera.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/CameraController.js tests/camera.test.js
git commit -m "feat(camera): add hybrid spline camera controller with parallax and pause orbit"
```

---

### Task 4: 3D Tang Courtyard, Poet Character Rig & Visual Effects

**Files:**
- Create: `src/scene/TangCourtyard.js`
- Create: `src/scene/PoetCharacter.js`
- Create: `src/scene/VisualEffects.js`
- Test: `tests/scene.test.js`

**Interfaces:**
- Consumes: `THREE`, scene state `{ t, frost, headPitch, homelandGlow, moonHalo, candleFlicker }` from `TimelineData.js`
- Produces:
  - `class TangCourtyard { constructor(); group: THREE.Group; update(state: SceneState); }`
  - `class PoetCharacter { constructor(); group: THREE.Group; headGroup: THREE.Group; update(state: SceneState); }`
  - `class VisualEffects { constructor(); group: THREE.Group; frostMaterial: THREE.ShaderMaterial; update(state: SceneState); }`

- [ ] **Step 1: Write the failing test in `tests/scene.test.js`**

```javascript
import { describe, it, expect } from 'vitest';
import { getSceneStateAt } from '../src/core/TimelineData.js';
import { TangCourtyard } from '../src/scene/TangCourtyard.js';
import { PoetCharacter } from '../src/scene/PoetCharacter.js';
import { VisualEffects } from '../src/scene/VisualEffects.js';

describe('3D Scene Graph & State Updates', () => {
  it('constructs TangCourtyard with moon, window lattice, bed, and volumetric beam', () => {
    const courtyard = new TangCourtyard();
    expect(courtyard.group.children.length).toBeGreaterThan(5);
    expect(courtyard.group.getObjectByName('FullMoon')).toBeTruthy();
    expect(courtyard.group.getObjectByName('TangBed')).toBeTruthy();
    expect(courtyard.group.getObjectByName('WindowLattice')).toBeTruthy();
    courtyard.update(getSceneStateAt(8.0));
  });

  it('updates PoetCharacter head pitch upward on verse3 and downward on verse4', () => {
    const poet = new PoetCharacter();
    poet.update(getSceneStateAt(21.0));
    const lookUpRotX = poet.headGroup.rotation.x;
    poet.update(getSceneStateAt(26.5));
    const lookDownRotX = poet.headGroup.rotation.x;
    expect(lookUpRotX).not.toBeCloseTo(lookDownRotX, 2);
  });

  it('updates VisualEffects frost shader uniform and homeland glow intensity', () => {
    const fx = new VisualEffects();
    fx.update(getSceneStateAt(3.0));
    expect(fx.frostMaterial.uniforms.uFrostProgress.value).toBe(0);

    fx.update(getSceneStateAt(16.0));
    expect(fx.frostMaterial.uniforms.uFrostProgress.value).toBeGreaterThan(0.8);

    fx.update(getSceneStateAt(26.5));
    expect(fx.homelandGroup.visible).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scene.test.js`
Expected: FAIL with module not found `../src/scene/TangCourtyard.js`

- [ ] **Step 3: Implement `src/scene/TangCourtyard.js`, `src/scene/PoetCharacter.js`, and `src/scene/VisualEffects.js`**

- `TangCourtyard`: builds the wooden chamber interior (`TangBed` 胡床/木榻, low table with flickering warm candle light, half-open `WindowLattice` 雕花直棂窗), outdoor courtyard stone tiles, water basin (`WaterBasin`), pine tree silhouettes (`CourtyardPine`), distant ink mountain silhouettes, volumetric moonlight beams (`MoonlightBeam`), and `FullMoon` with multi-layered glow shader.
- `PoetCharacter`: builds stylized Tang-dynasty Li Bai figure standing near the window/bed in flowing pale-ivory/indigo robes, high crown hairpiece (`Guan`), long sleeves, and hierarchical `torsoGroup` + `headGroup` driven by `state.headPitch` and subtle breathing/wind motion.
- `VisualEffects`: builds night sky starfield particles, floating moonlight dust motes, the custom GLSL `frostMaterial` ground plane (`uFrostProgress`, `uTime` crystalline hexagonal frost shimmer for "疑是地上霜"), and `homelandGroup` (warm golden mountain silhouette particle cloud + expanding water ripples for "低头思故乡").

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scene.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scene/TangCourtyard.js src/scene/PoetCharacter.js src/scene/VisualEffects.js tests/scene.test.js
git commit -m "feat(scene): add Tang courtyard, Li Bai character rig, and frost/homeland shaders"
```

---

### Task 5: Video Player HUD, Calligraphy Subtitles & Application Entry

**Files:**
- Create: `index.html`
- Create: `src/style.css`
- Create: `src/ui/PlayerUI.js`
- Create: `src/main.js`

**Interfaces:**
- Consumes: `TimelineEngine`, `CHAPTERS`, `TOTAL_DURATION`, `getSceneStateAt`, `CameraController`, `AudioEngine`, `TangCourtyard`, `PoetCharacter`, `VisualEffects`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`
- Produces: Complete runnable web application at `index.html` / `src/main.js`

- [ ] **Step 1: Create `index.html` and `src/style.css`**

Build the HTML structure and traditional Chinese aesthetic CSS:
- Fullscreen `#canvas-container` for the Three.js WebGL renderer.
- Opening cover overlay (`#cover-overlay`) with poem title「静夜思」, poet「唐 · 李白」, brief experience guide, and red seal button (`#start-btn`「展卷观赏」).
- Vertical calligraphy overlay (`#subtitle-stage`) displaying the active verse in vertical right-to-left brush typography with per-character reveal glow, plus the full 4-column poem layout during `outro`.
- Camera mode badge (`#camera-mode-badge`) indicating `电影运镜 · 移动鼠标微调视差` when playing or `已暂停 · 拖拽画面 360° 自由环视庭院` when paused.
- Bottom video player control bar (`#player-bar`):
  - Play/Pause button (`#play-pause-btn`) and Replay button (`#replay-btn`);
  - Interactive timeline scrubber track (`#timeline-track`) with progress fill, draggable thumb, and 6 clickable chapter markers (`序 · 静夜`, `一 · 床前明月光`, `二 · 疑是地上霜`, `三 · 举头望明月`, `四 · 低头思故乡`, `尾 · 余韵`);
  - Time readout (`#time-display`: `00:00 / 00:32`), volume slider + mute toggle (`#mute-btn`, `#volume-slider`), and fullscreen button (`#fullscreen-btn`).

- [ ] **Step 2: Implement `src/ui/PlayerUI.js` and `src/main.js`**

- `PlayerUI`: binds DOM events (start button, play/pause, spacebar shortcut, pointerdown/move/up timeline scrubbing, chapter marker clicks, volume/mute, fullscreen) and updates progress bar, time readout (`formatTime(t)`), active chapter marker, and vertical calligraphy character opacity on every frame.
- `main.js`: initializes `THREE.WebGLRenderer` (with tone mapping), `EffectComposer` + `UnrealBloomPass`, `TangCourtyard`, `PoetCharacter`, `VisualEffects`, `CameraController`, `AudioEngine`, `TimelineEngine`, and `PlayerUI`, and runs the `requestAnimationFrame` loop.

- [ ] **Step 3: Run unit tests and production build to verify zero errors**

Run: `npx vitest run && npm run build`
Expected: All unit tests PASS and Vite production build succeeds in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add index.html src/style.css src/ui/PlayerUI.js src/main.js
git commit -m "feat(app): integrate video player HUD, vertical calligraphy subtitles, and bloom pipeline"
```
