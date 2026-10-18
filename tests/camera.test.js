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
