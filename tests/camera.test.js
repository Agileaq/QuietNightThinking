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

  it('ensures Moon is completely unobstructed by house roof/walls and Poet head is framed in portrait mode during "举头望明月" (t = 20.0s)', () => {
    // iPhone Pro Max: 430 x 932 (~0.461 aspect)
    const portraitCamera = new THREE.PerspectiveCamera(45, 430 / 932, 0.1, 200);
    const controller = new CameraController(portraitCamera, null);

    // During verse3 ("举头望明月" at t = 20.0s)
    controller.update(20.0, 0.016, true);

    const moonPos = [0.0, 8.8, -18.0];
    const pMoon = new THREE.Vector3(...moonPos).project(portraitCamera);

    // Moon must be within screen view bounds
    expect(pMoon.x).toBeGreaterThan(-1.0);
    expect(pMoon.x).toBeLessThan(1.0);
    expect(pMoon.y).toBeGreaterThan(-1.0);
    expect(pMoon.y).toBeLessThan(1.0);

    // Poet head must be within screen view bounds
    const pPoet = new THREE.Vector3(-0.12, 1.62, 0.48).project(portraitCamera);
    expect(pPoet.x).toBeGreaterThan(-1.0);
    expect(pPoet.x).toBeLessThan(1.0);
    expect(pPoet.y).toBeGreaterThan(-1.0);
    expect(pPoet.y).toBeLessThan(1.0);

    // Ray from camera to moon at North Wall (z = -0.35) must pass cleanly through window opening (Y in [0.88, 2.68])
    const dz = moonPos[2] - portraitCamera.position.z;
    const tWall = (-0.35 - portraitCamera.position.z) / dz;
    const ryWall = portraitCamera.position.y + tWall * (moonPos[1] - portraitCamera.position.y);
    expect(ryWall).toBeLessThanOrEqual(2.68);
    expect(ryWall).toBeGreaterThanOrEqual(0.88);
  });
});
