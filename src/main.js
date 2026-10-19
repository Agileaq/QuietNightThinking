import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { TOTAL_DURATION, getSceneStateAt } from './core/TimelineData.js';
import { TimelineEngine } from './core/TimelineEngine.js';
import { CameraController } from './core/CameraController.js';
import { TangCourtyard } from './scene/TangCourtyard.js';
import { PoetCharacter } from './scene/PoetCharacter.js';
import { VisualEffects } from './scene/VisualEffects.js';
import { createNightEnvironmentTexture } from './scene/PBRTextures.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { PlayerUI } from './ui/PlayerUI.js';

function bootstrapApp() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // 1. Scene & Atmospheric Fog
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.FogExp2(0x070b16, 0.032);

  // 2. Camera & Renderer (ACESFilmicToneMapping + PCFSoftShadowMap)
  const camera = new THREE.PerspectiveCamera(
    44,
    window.innerWidth / window.innerHeight,
    0.1,
    120,
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.appendChild(renderer.domElement);

  // PMREM Cold-Moonlight Night & Warm-Interior Environment Reflection Map for PBR Materials
  const envMap = createNightEnvironmentTexture(renderer);
  if (envMap) {
    scene.environment = envMap;
  }

  // 3. Post-processing Selective Bloom Pipeline (High threshold to prevent white-out wash)
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.46, // strength (selective glow, avoiding harsh white wash)
    0.38, // radius
    0.84, // high threshold so only moon, candle, frost crystals, and specular rims bloom
  );
  composer.addPass(bloomPass);

  // 4. 3D World Subsystems
  const courtyard = new TangCourtyard();
  const poet = new PoetCharacter();
  const visualEffects = new VisualEffects();

  scene.add(courtyard.group);
  scene.add(poet.group);
  scene.add(visualEffects.group);

  // 5. Hybrid Camera, Audio & Timeline Engine
  const cameraController = new CameraController(camera, renderer.domElement);
  const audioEngine = new AudioEngine({ voiceId: 'scholar' });

  let ui = null;

  const applySceneState = (state) => {
    courtyard.update(state);
    poet.update(state);
    visualEffects.update(state);
    if (ui) {
      ui.update(state);
    }
  };

  const timeline = new TimelineEngine({
    duration: TOTAL_DURATION,
    onUpdate: (state, prevTime) => {
      applySceneState(state);
      audioEngine.update(prevTime, state.t);
    },
    onPlayStateChange: (isPlaying, currentTime) => {
      cameraController.setPaused(!isPlaying, currentTime);
      if (ui) {
        ui.setPlayState(isPlaying);
      }
      if (isPlaying) {
        audioEngine.play(currentTime);
      } else {
        audioEngine.pause();
      }
    },
  });

  ui = new PlayerUI({
    onTogglePlay: (forcePlay) => {
      if (forcePlay === true) {
        timeline.play();
      } else {
        timeline.toggle();
      }
    },
    onSeek: (targetTime) => {
      timeline.seek(targetTime);
      audioEngine.seek(targetTime);
      cameraController.onSeek(targetTime);
    },
    onReplay: () => {
      timeline.seek(0);
      audioEngine.seek(0);
      cameraController.onSeek(0);
      timeline.play();
    },
    onVolumeChange: (vol) => {
      audioEngine.setVolume(vol);
    },
    onMuteToggle: (muted) => {
      audioEngine.setMuted(muted);
    },
    onVoiceChange: (voiceId) => {
      audioEngine.setVoice(voiceId, timeline.currentTime);
    },
  });

  // Render initial state at t=0
  applySceneState(getSceneStateAt(0));

  // Mouse Parallax Listener
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    cameraController.setMouseNormalized(nx, ny);
  });

  // Responsive Resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  });

  // 6. Main Animation Loop
  let lastTimeMs = performance.now();
  function animate(nowMs) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, Math.max(0.001, (nowMs - lastTimeMs) / 1000));
    lastTimeMs = nowMs;

    if (timeline.isPlaying) {
      timeline.update(dt);
    } else {
      // Keep subtle ambient animations alive even while paused
      const state = timeline.getState();
      courtyard.update(state);
      visualEffects.update(state);
    }

    cameraController.update(timeline.currentTime, dt, timeline.isPlaying);
    composer.render();
  }

  requestAnimationFrame(animate);
}

if (typeof window !== 'undefined') {
  bootstrapApp();
}
