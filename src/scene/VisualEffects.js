import * as THREE from 'three';

export class VisualEffects {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'VisualEffectsRoot';

    this.frostMaterial = null;
    this.frostSparkles = null;
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
    // 260 dust motes floating inside the slanted Tyndall window moonlight beam with 3D noise drift & twinkling
    const count = 260;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const a = ((i * 17) % 100) / 100;
      const b = ((i * 31) % 100) / 100;
      const c = ((i * 47) % 100) / 100;
      const z = -0.35 + c * 3.0;
      const maxBeamY = 2.38 - c * 1.55;
      positions[i * 3] = -0.95 + a * 2.25;
      positions[i * 3 + 1] = 0.24 + b * Math.max(0.4, maxBeamY);
      positions[i * 3 + 2] = z;
      phases[i] = i * 1.6180339;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.moonDustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xdceeff) },
      },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        varying float vTwinkle;
        void main() {
          // 3D smooth pseudo-Perlin noise drift inside the Tyndall beam
          vec3 p = position;
          p.x += sin(uTime * 0.55 + aPhase) * 0.065 + cos(uTime * 0.28 + p.y * 3.2) * 0.035;
          p.y += sin(uTime * 0.42 + aPhase * 1.3) * 0.075;
          p.z += cos(uTime * 0.48 + aPhase * 0.7) * 0.055;

          vTwinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.4 + aPhase * 3.7));
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (18.0 + 10.0 * vTwinkle) / max(0.8, -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
          float softDisc = pow(max(0.0, 1.0 - d), 2.2);
          gl_FragColor = vec4(uColor, softDisc * vTwinkle * 0.72);
        }
      `,
    });

    this.moonDust = new THREE.Points(geo, this.moonDustMat);
    this.moonDust.name = 'MoonlightDust';
    this.group.add(this.moonDust);
  }

  _buildFrostEffect() {
    // Custom GLSL Shader for "疑是地上霜": crystalline frost spreading across the window-lit indoor floor in front of the bed
    this.frostMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uFrostProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uColorInner: { value: new THREE.Color(0xeef6ff) },
        uColorOuter: { value: new THREE.Color(0x7cb4ff) },
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

          // Six-fold dendrite ice crystal pattern
          float angle = atan(centered.y, centered.x);
          float crystalBranch = 0.1 * cos(angle * 6.0) + 0.05 * cos(angle * 12.0 + r * 8.0);
          float wave = 0.04 * sin(r * 22.0 - uTime * 1.6);
          float spreadRadius = uFrostProgress * 1.08;

          float mask = smoothstep(spreadRadius, max(0.001, spreadRadius - 0.32), r + crystalBranch + wave);
          float sparkle = step(0.91, hash21(floor(vUv * 72.0) + floor(uTime * 2.5)));
          float rim = smoothstep(0.22, 0.0, abs(r - spreadRadius * 0.86)) * uFrostProgress;

          vec3 col = mix(uColorOuter, uColorInner, 0.55 + 0.45 * sin(r * 12.0));
          col += vec3(0.55, 0.68, 0.9) * sparkle * mask;

          float alpha = (mask * 0.56 + rim * 0.42) * uFrostProgress;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    // Placed right on the indoor chamber floor in front of the bed where the window moonlight lands
    const indoorFrostPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.9, 1, 1),
      this.frostMaterial,
    );
    indoorFrostPlane.rotation.x = -Math.PI / 2;
    indoorFrostPlane.position.set(0.12, 0.21, 1.38);
    indoorFrostPlane.name = 'GroundFrostPlane';
    this.group.add(indoorFrostPlane);

    // Secondary frost shimmer extending onto the courtyard stones outside the window
    const courtyardFrostPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 3.2, 1, 1),
      this.frostMaterial,
    );
    courtyardFrostPlane.rotation.x = -Math.PI / 2;
    courtyardFrostPlane.position.set(-0.2, 0.03, -1.9);
    this.group.add(courtyardFrostPlane);

    // Rising ice-crystal mist particles above the frosted floor
    const sparkleCount = 90;
    const sparklePos = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i += 1) {
      const u = ((i * 23) % 100) / 100;
      const v = ((i * 41) % 100) / 100;
      const w = ((i * 59) % 100) / 100;
      sparklePos[i * 3] = -1.1 + u * 2.4;
      sparklePos[i * 3 + 1] = 0.22 + v * 0.45;
      sparklePos[i * 3 + 2] = 0.1 + w * 2.5;
    }
    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
    this.frostSparkleMat = new THREE.PointsMaterial({
      color: 0xe8f4ff,
      size: 0.038,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.frostSparkles = new THREE.Points(sparkleGeo, this.frostSparkleMat);
    this.group.add(this.frostSparkles);
  }

  _buildHomelandIllusion() {
    // Positioned above the courtyard water basin (-1.15, 0.45, -0.85) for "低头思故乡"
    this.homelandGroup.position.set(-1.15, 0.45, -0.85);
    this.homelandGroup.visible = false;

    const count = 260;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = i / count;
      const x = (u - 0.5) * 1.5;
      const z = (((i * 29) % 100) / 100 - 0.5) * 0.7;
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

    for (let r = 0; r < 3; r += 1) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.12 + r * 0.12, 0.14 + r * 0.12, 32),
        ringMat,
      );
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

    if (this.frostSparkleMat && this.frostSparkles) {
      this.frostSparkleMat.opacity = frost * 0.75;
      this.frostSparkles.position.y = Math.sin(t * 1.4) * 0.04;
    }

    if (this.moonDustMat) {
      this.moonDustMat.uniforms.uTime.value = t;
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
