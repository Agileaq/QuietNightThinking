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

  it('adapts camera framing for iPhone Pro Max portrait mode (aspect 0.46) to encompass poet, bed, and moonlight beam', () => {
    // iPhone Pro Max: 430 x 932 (~0.461 aspect)
    const portraitCamera = new THREE.PerspectiveCamera(45, 430 / 932, 0.1, 200);
    const controller = new CameraController(portraitCamera, null);

    // During verse1 ("床前明月光" at t = 8.0s)
    controller.update(8.0, 0.016, true);
    expect(portraitCamera.fov).toBeGreaterThan(54);
    // Camera pulls back further in Z (> 3.8m) to broaden the horizontal field of view
    expect(portraitCamera.position.z).toBeGreaterThan(3.8);

    // Compare with desktop landscape (16/9)
    const landscapeCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
    const landscapeController = new CameraController(landscapeCamera, null);
    landscapeController.update(8.0, 0.016, true);
    expect(landscapeCamera.fov).toBeLessThan(45);
    expect(landscapeCamera.position.z).toBeLessThan(3.0);
  });
});
