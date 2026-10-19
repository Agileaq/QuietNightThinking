import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getCameraPose } from './TimelineData.js';

export class CameraController {
  constructor(camera, domElement = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.mode = 'cinematic';

    this.mouseTarget = new THREE.Vector2(0, 0);
    this.mouseCurrent = new THREE.Vector2(0, 0);

    this.currentLookAt = new THREE.Vector3(0, 1.5, 0);
    this.resumeFromPos = new THREE.Vector3();
    this.resumeFromTarget = new THREE.Vector3();
    this.resumeBlend = 0; // 1 -> 0 when blending back from OrbitControls to spline

    this.orbitControls = null;
    if (domElement) {
      this.orbitControls = new OrbitControls(camera, domElement);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.06;
      this.orbitControls.maxPolarAngle = Math.PI * 0.52;
      this.orbitControls.minDistance = 1.0;
      this.orbitControls.maxDistance = 18.0;
      this.orbitControls.enabled = false;
    }

    this._applyPoseImmediate(0);
  }

  setMouseNormalized(nx, ny) {
    const clampedX = Math.max(-1, Math.min(1, Number(nx) || 0));
    const clampedY = Math.max(-1, Math.min(1, Number(ny) || 0));
    this.mouseTarget.set(clampedX, clampedY);
  }

  setPaused(paused, currentTime = 0) {
    if (paused) {
      this.mode = 'orbit';
      if (this.orbitControls) {
        this.orbitControls.target.copy(this.currentLookAt);
        this.orbitControls.enabled = true;
        this.orbitControls.update();
      }
    } else {
      if (this.mode === 'orbit') {
        this.resumeFromPos.copy(this.camera.position);
        if (this.orbitControls) {
          this.resumeFromTarget.copy(this.orbitControls.target);
        } else {
          this.resumeFromTarget.copy(this.currentLookAt);
        }
        this.resumeBlend = 1.0;
      }
      this.mode = 'cinematic';
      if (this.orbitControls) {
        this.orbitControls.enabled = false;
      }
      void currentTime;
    }
  }

  _getAspect() {
    if (this.domElement && this.domElement.clientWidth && this.domElement.clientHeight) {
      return this.domElement.clientWidth / this.domElement.clientHeight;
    }
    return this.camera?.aspect || 1.77;
  }

  onSeek(currentTime) {
    this.resumeBlend = 0;
    const aspect = this._getAspect();
    const pose = getCameraPose(currentTime, aspect);
    this.camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    this.currentLookAt.set(pose.target[0], pose.target[1], pose.target[2]);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentLookAt);

    if (this.orbitControls) {
      this.orbitControls.target.copy(this.currentLookAt);
      this.orbitControls.update();
    }
  }

  update(currentTime, dt = 0.016, isPlaying = true) {
    const safeDt = Math.max(0.001, Math.min(0.2, Number(dt) || 0.016));

    if (!isPlaying && this.mode === 'orbit') {
      if (this.orbitControls) {
        this.orbitControls.update();
        this.currentLookAt.copy(this.orbitControls.target);
      }
      return;
    }

    // Smooth mouse parallax damping
    const mouseAlpha = 1 - Math.exp(-safeDt * 5.0);
    this.mouseCurrent.lerp(this.mouseTarget, mouseAlpha);

    const aspect = this._getAspect();
    const pose = getCameraPose(currentTime, aspect);
    const splinePos = new THREE.Vector3(
      pose.position[0] + this.mouseCurrent.x * 0.24,
      pose.position[1] + this.mouseCurrent.y * 0.14,
      pose.position[2],
    );
    const splineTarget = new THREE.Vector3(
      pose.target[0] + this.mouseCurrent.x * 0.15,
      pose.target[1] + this.mouseCurrent.y * 0.12,
      pose.target[2],
    );

    if (this.resumeBlend > 0.001) {
      this.resumeBlend = Math.exp(-safeDt * 6.0) * this.resumeBlend;
      this.camera.position.lerpVectors(splinePos, this.resumeFromPos, this.resumeBlend);
      this.currentLookAt.lerpVectors(splineTarget, this.resumeFromTarget, this.resumeBlend);
    } else {
      this.resumeBlend = 0;
      this.camera.position.copy(splinePos);
      this.currentLookAt.copy(splineTarget);
    }

    if (Math.abs(this.camera.fov - pose.fov) > 0.05) {
      this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(this.currentLookAt);
  }

  getMode() {
    return this.mode;
  }

  _applyPoseImmediate(t) {
    const aspect = this._getAspect();
    const pose = getCameraPose(t, aspect);
    this.camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    this.currentLookAt.set(pose.target[0], pose.target[1], pose.target[2]);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentLookAt);
  }
}
