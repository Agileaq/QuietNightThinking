import * as THREE from 'three';

export class TangCourtyard {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TangCourtyardRoot';

    this.moonHaloMat = null;
    this.moonBeamMat = null;
    this.candleLight = null;
    this.candleFlame = null;
    this.pineGroup = null;

    this._buildLighting();
    this._buildGroundAndChamber();
    this._buildWindowLattice();
    this._buildTangBedAndTable();
    this._buildCourtyardProps();
    this._buildMountainsAndMoon();
    this._buildVolumetricMoonbeams();
  }

  _buildLighting() {
    const ambient = new THREE.HemisphereLight(0x3a5f9a, 0x0b101d, 0.72);
    this.group.add(ambient);

    // Primary directional moonlight coming from the full moon at (0, 11.5, -18)
    this.moonLight = new THREE.DirectionalLight(0xd8e8ff, 1.85);
    this.moonLight.position.set(0.0, 11.5, -18.0);
    this.group.add(this.moonLight);

    // Subtle cool fill light inside courtyard
    const courtyardFill = new THREE.PointLight(0x7aa8ff, 0.75, 14.0);
    courtyardFill.position.set(-0.5, 3.2, -1.5);
    this.group.add(courtyardFill);

    // Warm indoor candle light
    this.candleLight = new THREE.PointLight(0xffaa44, 1.15, 6.5, 1.6);
    this.candleLight.position.set(1.35, 1.08, 0.85);
    this.group.add(this.candleLight);
  }

  _buildGroundAndChamber() {
    // Outdoor courtyard stone floor
    const courtyardGeo = new THREE.PlaneGeometry(36, 36, 32, 32);
    const courtyardMat = new THREE.MeshStandardMaterial({
      color: 0x111a2b,
      roughness: 0.78,
      metalness: 0.15,
    });
    const courtyardFloor = new THREE.Mesh(courtyardGeo, courtyardMat);
    courtyardFloor.rotation.x = -Math.PI / 2;
    courtyardFloor.position.y = 0.0;
    courtyardFloor.name = 'CourtyardFloor';
    this.group.add(courtyardFloor);

    // Raised wooden chamber floor (indoor)
    const chamberFloorGeo = new THREE.BoxGeometry(5.6, 0.18, 4.4);
    const woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0x241914,
      roughness: 0.65,
      metalness: 0.08,
    });
    const chamberFloor = new THREE.Mesh(chamberFloorGeo, woodFloorMat);
    chamberFloor.position.set(0.2, 0.09, 1.8);
    chamberFloor.name = 'ChamberFloor';
    this.group.add(chamberFloor);

    // Stone steps leading from chamber to courtyard
    const stepGeo = new THREE.BoxGeometry(2.2, 0.1, 0.45);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x263247,
      roughness: 0.7,
      metalness: 0.12,
    });
    const stepMesh = new THREE.Mesh(stepGeo, stoneMat);
    stepMesh.position.set(-0.6, 0.05, -0.55);
    this.group.add(stepMesh);

    // Tang timber pillars & eaves
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x3b1e16,
      roughness: 0.55,
    });
    const pillarPositions = [
      [-2.4, 1.8, -0.35],
      [2.8, 1.8, -0.35],
      [-2.4, 1.8, 3.8],
      [2.8, 1.8, 3.8],
    ];
    for (const [px, py, pz] of pillarPositions) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 3.6, 16), pillarMat);
      pillar.position.set(px, py, pz);
      this.group.add(pillar);
    }

    // Horizontal roof beam over the north wall
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.22, 0.35), pillarMat);
    beam.position.set(0.2, 3.45, -0.35);
    this.group.add(beam);
  }

  _buildWindowLattice() {
    const windowGroup = new THREE.Group();
    windowGroup.name = 'WindowLattice';
    windowGroup.position.set(0.2, 0.18, -0.35);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1c1618,
      roughness: 0.8,
    });
    const woodTrimMat = new THREE.MeshStandardMaterial({
      color: 0x47241a,
      roughness: 0.55,
    });

    // Lower wainscot wall on the right side (under window)
    const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.75, 0.14), wallMat);
    lowerWall.position.set(0.95, 0.38, 0);
    windowGroup.add(lowerWall);

    // Window frame mullions (carved vertical lattice bars)
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.16), woodTrimMat);
    frameTop.position.set(0.95, 2.65, 0);
    windowGroup.add(frameTop);

    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.16), woodTrimMat);
    frameBottom.position.set(0.95, 0.78, 0);
    windowGroup.add(frameBottom);

    // Half-open carved lattice casement on the far right, leaving center-left open for moonlight & poet gaze
    for (let i = 0; i < 7; i += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.85, 0.04), woodTrimMat);
      bar.position.set(1.1 + i * 0.22, 1.72, 0);
      windowGroup.add(bar);
    }
    // Horizontal lattice crossbars
    for (let j = 0; j < 3; j += 1) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.04), woodTrimMat);
      hBar.position.set(1.76, 1.2 + j * 0.5, 0);
      windowGroup.add(hBar);
    }

    this.group.add(windowGroup);
  }

  _buildTangBedAndTable() {
    const bedGroup = new THREE.Group();
    bedGroup.name = 'TangBed';
    bedGroup.position.set(0.95, 0.18, 1.15);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a271b,
      roughness: 0.5,
      metalness: 0.1,
    });
    const matMat = new THREE.MeshStandardMaterial({
      color: 0xd6ceb8,
      roughness: 0.75,
    });
    const silkMat = new THREE.MeshStandardMaterial({
      color: 0x2d4363,
      roughness: 0.45,
    });

    // Tang platform bed (榻)
    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 1.25), woodMat);
    platform.position.y = 0.18;
    bedGroup.add(platform);

    // Woven mat on bed
    const matMesh = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.04, 1.15), matMat);
    matMesh.position.y = 0.38;
    bedGroup.add(matMesh);

    // Ceramic/wooden bolster pillow
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.52), silkMat);
    pillow.position.set(0.62, 0.45, 0.0);
    bedGroup.add(pillow);

    // Low wooden railing on back and side of bed
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.06), woodMat);
    backRail.position.set(0, 0.52, 0.6);
    bedGroup.add(backRail);

    // Low side table (案几) with warm candle and wine vessel
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.52, 0.45), woodMat);
    table.position.set(0.4, 0.26, -0.35);
    bedGroup.add(table);

    const candleStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0xc89b4b, metalness: 0.6, roughness: 0.3 }),
    );
    candleStick.position.set(0.4, 0.63, -0.32);
    bedGroup.add(candleStick);

    const flameGeo = new THREE.SphereGeometry(0.035, 10, 10);
    flameGeo.scale(0.8, 1.8, 0.8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });
    this.candleFlame = new THREE.Mesh(flameGeo, flameMat);
    this.candleFlame.position.set(0.4, 0.78, -0.32);
    bedGroup.add(this.candleFlame);

    this.group.add(bedGroup);
  }

  _buildCourtyardProps() {
    // Courtyard water basin / lotus jar ("低头思故乡" reflection point at (-1.15, 0.32, -0.75))
    const basinGroup = new THREE.Group();
    basinGroup.name = 'WaterBasin';
    basinGroup.position.set(-1.15, 0.0, -0.75);

    const basinWall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.42, 0.42, 24),
      new THREE.MeshStandardMaterial({ color: 0x273549, roughness: 0.45, metalness: 0.2 }),
    );
    basinWall.position.y = 0.21;
    basinGroup.add(basinWall);

    const waterDisk = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 24),
      new THREE.MeshStandardMaterial({
        color: 0x1a3358,
        emissive: 0x102442,
        roughness: 0.1,
        metalness: 0.85,
      }),
    );
    waterDisk.rotation.x = -Math.PI / 2;
    waterDisk.position.y = 0.43;
    basinGroup.add(waterDisk);
    this.group.add(basinGroup);

    // Stylized Tang courtyard pine tree & scholar rocks
    this.pineGroup = new THREE.Group();
    this.pineGroup.name = 'CourtyardPine';
    this.pineGroup.position.set(-3.4, 0.0, -3.2);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a1518, roughness: 0.9 });
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0x102536,
      roughness: 0.75,
    });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 3.8, 10), trunkMat);
    trunk.position.y = 1.9;
    trunk.rotation.z = -0.14;
    this.pineGroup.add(trunk);

    const canopyLayers = [
      { pos: [0.4, 3.5, 0.2], rx: 1.4, ry: 0.36 },
      { pos: [-0.3, 3.9, -0.2], rx: 1.15, ry: 0.32 },
      { pos: [0.85, 3.1, 0.4], rx: 1.0, ry: 0.28 },
    ];
    for (const layer of canopyLayers) {
      const needleCluster = new THREE.Mesh(
        new THREE.ConeGeometry(layer.rx, layer.ry, 9),
        needleMat,
      );
      needleCluster.position.set(layer.pos[0], layer.pos[1], layer.pos[2]);
      this.pineGroup.add(needleCluster);
    }
    this.group.add(this.pineGroup);
  }

  _buildMountainsAndMoon() {
    // Distant ink mountain silhouettes
    const mountainConfigs = [
      { x: -10, z: -22, r: 9.5, h: 6.5, color: 0x0a1324 },
      { x: -2, z: -24, r: 11.0, h: 7.8, color: 0x081020 },
      { x: 9, z: -21, r: 8.5, h: 5.8, color: 0x0b1526 },
    ];
    for (const m of mountainConfigs) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(m.r, m.h, 7),
        new THREE.MeshBasicMaterial({ color: m.color }),
      );
      cone.position.set(m.x, m.h * 0.42, m.z);
      this.group.add(cone);
    }

    // Radiant Full Moon at (0, 11.5, -18.0) matching camera target in verse3 ("举头望明月")
    const moonGroup = new THREE.Group();
    moonGroup.name = 'FullMoon';
    moonGroup.position.set(0.0, 11.5, -18.0);

    const moonCore = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xf4f8ff }),
    );
    moonGroup.add(moonCore);

    this.moonHaloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uHaloIntensity: { value: 0.7 },
        uColor: { value: new THREE.Color(0x9ec5ff) },
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
        uniform float uHaloIntensity;
        uniform vec3 uColor;
        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float glow = pow(max(0.0, 1.0 - dist), 2.4) * uHaloIntensity;
          gl_FragColor = vec4(uColor, glow * 0.65);
        }
      `,
    });

    const haloPlane = new THREE.Mesh(new THREE.PlaneGeometry(13.0, 13.0), this.moonHaloMat);
    haloPlane.position.z = 0.2;
    moonGroup.add(haloPlane);

    this.group.add(moonGroup);
  }

  _buildVolumetricMoonbeams() {
    this.moonBeamMat = new THREE.MeshBasicMaterial({
      color: 0xbfd8ff,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const beamGeo = new THREE.ConeGeometry(2.2, 6.2, 24, 1, true);
    const beamMesh = new THREE.Mesh(beamGeo, this.moonBeamMat);
    beamMesh.name = 'MoonlightBeam';
    beamMesh.position.set(-0.15, 2.25, 0.35);
    beamMesh.rotation.x = 0.58;
    beamMesh.rotation.z = -0.12;
    this.group.add(beamMesh);
  }

  update(state) {
    if (!state) return;

    if (this.moonHaloMat) {
      this.moonHaloMat.uniforms.uHaloIntensity.value = state.moonHalo ?? 0.7;
    }

    if (this.moonBeamMat) {
      this.moonBeamMat.opacity = 0.06 + 0.09 * (state.moonbeamIntensity ?? 0.8);
    }

    if (this.candleLight && this.candleFlame) {
      const flicker = state.candleFlicker ?? 1.0;
      this.candleLight.intensity = 1.1 * flicker;
      this.candleFlame.scale.set(0.8, 1.6 + 0.35 * flicker, 0.8);
    }

    if (this.pineGroup) {
      this.pineGroup.rotation.z = Math.sin((state.t ?? 0) * 0.8) * 0.012;
    }
  }
}
