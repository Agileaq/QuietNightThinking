import * as THREE from 'three';

export class VisualEffects {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'VisualEffectsRoot';

    this.frostMaterial = null;
    this.frostParticles = null;
    this.moonDust = null;
    this.homelandGroup = new THREE.Group();
    this.homelandGroup.name = 'HomelandIllusion';
    this.homelandMaterial = null;
    this.rippleRings = [];

    this._buildStarfield();
    this._buildMoonlightDust();
    this._buildFrostEffect();
    this._buildHomelandIllusion();
  }

  _buildStarfield() {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Deterministic pseudo-random distribution across night sky dome
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 43758.5453;
      const s3 = Math.sin(i * 39.425) * 43758.5453;
      const u = s1 - Math.floor(s1);
      const v = s2 - Math.floor(s2);
      const w = s3 - Math.floor(s3);

      const theta = (u - 0.5) * Math.PI * 1.4;
      const height = 3.5 + v * 20.0;
      const depth = -14.0 - w * 18.0;
      positions[i * 3] = Math.sin(theta) * 24.0;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = depth;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xd8e8ff,
      size: 0.09,
      transparent: true,
      opacity: 0.82,
    });
    const stars = new THREE.Points(geo, mat);
    stars.name = 'NightStars';
    this.group.add(stars);
  }

  _buildMoonlightDust() {
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = ((i * 17) % 100) / 100;
      const b = ((i * 31) % 100) / 100;
      const c = ((i * 47) % 100) / 100;
      positions[i * 3] = -2.2 + a * 4.4;
      positions[i * 3 + 1] = 0.25 + b * 3.2;
      positions[i * 3 + 2] = -2.0 + c * 5.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xcce2ff,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.moonDust = new THREE.Points(geo, mat);
    this.moonDust.name = 'MoonlightDust';
    this.group.add(this.moonDust);
  }

  _buildFrostEffect() {
    // Custom GLSL Shader for "疑是地上霜" crystalline frost spreading across the moonlit stones
    this.frostMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uFrostProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uColorInner: { value: new THREE.Color(0xe6f2ff) },
        uColorOuter: { value: new THREE.Color(0x6ea8ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uFrostProgress;
        uniform float uTime;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        void main() {
          vec2 centered = (vUv - vec2(0.5)) * 2.0;
          float r = length(centered);

          // Hexagonal crystalline wave pattern
          float angle = atan(centered.y, centered.x);
          float hexMod = 0.08 * cos(angle * 6.0) + 0.04 * sin(r * 18.0 - uTime * 1.4);
          float spreadRadius = uFrostProgress * 1.05;

          float mask = smoothstep(spreadRadius, max(0.001, spreadRadius - 0.35), r + hexMod);
          float sparkle = step(0.92, hash21(floor(vUv * 64.0) + floor(uTime * 2.0)));
          float rim = smoothstep(0.25, 0.0, abs(r - spreadRadius * 0.85)) * uFrostProgress;

          vec3 col = mix(uColorOuter, uColorInner, 0.5 + 0.5 * sin(r * 10.0));
          col += vec3(0.45, 0.55, 0.75) * sparkle * mask;

          float alpha = (mask * 0.48 + rim * 0.35) * uFrostProgress;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const frostPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 6.2, 1, 1), this.frostMaterial);
    frostPlane.rotation.x = -Math.PI / 2;
    frostPlane.position.set(-0.35, 0.19, 0.45);
    frostPlane.name = 'GroundFrostPlane';
    this.group.add(frostPlane);
  }

  _buildHomelandIllusion() {
    // Positioned above the courtyard water basin (-1.15, 0.45, -0.75) for "低头思故乡"
    this.homelandGroup.position.set(-1.15, 0.45, -0.75);
    this.homelandGroup.visible = false;

    const count = 260;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = i / count;
      const x = (u - 0.5) * 1.5;
      const z = (((i * 29) % 100) / 100 - 0.5) * 0.7;
      // Twin warm golden mountain peaks & river curve representing distant hometown
      const peak1 = Math.exp(-Math.pow((x + 0.32) * 3.8, 2)) * 0.42;
      const peak2 = Math.exp(-Math.pow((x - 0.25) * 3.2, 2)) * 0.55;
      const y = peak1 + peak2 + (((i * 13) % 100) / 100) * 0.06;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.homelandMaterial = new THREE.PointsMaterial({
      color: 0xffb84d,
      size: 0.042,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mountainPoints = new THREE.Points(geo, this.homelandMaterial);
    this.homelandGroup.add(mountainPoints);

    // Expanding golden water ripples on the basin surface
    for (let r = 0; r < 3; r += 1) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.12 + r * 0.12, 0.14 + r * 0.12, 32), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      this.homelandGroup.add(ring);
      this.rippleRings.push(ring);
    }

    this.group.add(this.homelandGroup);
  }

  update(state) {
    if (!state) return;
    const t = state.t ?? 0;
    const frost = state.frost ?? 0;
    const homeland = state.homelandGlow ?? 0;

    if (this.frostMaterial) {
      this.frostMaterial.uniforms.uFrostProgress.value = frost;
      this.frostMaterial.uniforms.uTime.value = t;
    }

    if (this.moonDust) {
      this.moonDust.position.y = Math.sin(t * 0.6) * 0.12;
      this.moonDust.rotation.y = t * 0.03;
    }

    if (this.homelandGroup && this.homelandMaterial) {
      this.homelandGroup.visible = homeland > 0.01;
      this.homelandMaterial.opacity = homeland * 0.88;
      this.homelandGroup.rotation.y = Math.sin(t * 0.4) * 0.15;

      for (let i = 0; i < this.rippleRings.length; i += 1) {
        const ring = this.rippleRings[i];
        const phase = (t * 0.65 + i * 0.33) % 1.0;
        const scale = 0.5 + phase * 1.4;
        ring.scale.set(scale, scale, 1);
        ring.material.opacity = (1.0 - phase) * 0.55 * homeland;
      }
    }
  }
}
