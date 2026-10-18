import * as THREE from 'three';

export class PoetCharacter {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'PoetLiBai';
    // Positioned near the open wooden window looking toward the courtyard & moon
    this.group.position.set(-0.55, 0.18, 0.65);
    this.group.rotation.y = Math.PI - 0.15;

    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.82;
    this.group.add(this.torsoGroup);

    this.headGroup = new THREE.Group();
    this.headGroup.name = 'PoetHead';
    this.headGroup.position.y = 0.56;
    this.torsoGroup.add(this.headGroup);

    this.leftSleeve = null;
    this.rightSleeve = null;
    this. sashRibbon = null;

    this._buildFigure();
  }

  _buildFigure() {
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0xdce6f5,
      roughness: 0.62,
      metalness: 0.08,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x243b5e,
      roughness: 0.5,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe6cbb2,
      roughness: 0.65,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x161922,
      roughness: 0.7,
    });

    // Lower flowing robe skirt
    const lowerRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.31, 0.86, 20), robeMat);
    lowerRobe.position.y = 0.43;
    this.group.add(lowerRobe);

    // Indigo waist sash
    const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 20), trimMat);
    sash.position.y = 0.02;
    this.torsoGroup.add(sash);

    // Upper torso (Tang round-collar scholar robe)
    const upperTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.54, 20), robeMat);
    upperTorso.position.y = 0.27;
    this.torsoGroup.add(upperTorso);

    // Crossed lapel collar trim
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 10, 20), trimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.52;
    this.torsoGroup.add(collar);

    // Wide flowing Tang sleeves (clasped behind/at side in contemplation)
    const sleeveGeo = new THREE.ConeGeometry(0.17, 0.56, 14);
    this.leftSleeve = new THREE.Mesh(sleeveGeo, robeMat);
    this.leftSleeve.position.set(-0.24, 0.24, 0.04);
    this.leftSleeve.rotation.z = 0.28;
    this.leftSleeve.rotation.x = 0.18;
    this.torsoGroup.add(this.leftSleeve);

    this.rightSleeve = new THREE.Mesh(sleeveGeo, robeMat);
    this.rightSleeve.position.set(0.24, 0.24, 0.04);
    this.rightSleeve.rotation.z = -0.28;
    this.rightSleeve.rotation.x = 0.18;
    this.torsoGroup.add(this.rightSleeve);

    // Flowing silk sash ribbon catching the night breeze
    const ribbonGeo = new THREE.PlaneGeometry(0.09, 0.62, 1, 6);
    this.sashRibbon = new THREE.Mesh(
      ribbonGeo,
      new THREE.MeshStandardMaterial({
        color: 0x3b5882,
        side: THREE.DoubleSide,
        roughness: 0.5,
      }),
    );
    this.sashRibbon.position.set(0.16, -0.22, -0.14);
    this.torsoGroup.add(this.sashRibbon);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 14), skinMat);
    neck.position.y = 0.04;
    this.headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 20), skinMat);
    head.scale.set(0.92, 1.08, 0.96);
    head.position.y = 0.18;
    this.headGroup.add(head);

    // Tang topknot & scholar crown (冠)
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14, 0, Math.PI * 2, 0, 1.75), hairMat);
    hairCap.position.y = 0.2;
    this.headGroup.add(hairCap);

    const topknot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.14, 12), hairMat);
    topknot.position.set(0, 0.37, -0.02);
    this.headGroup.add(topknot);

    const crownPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xd8c898, metalness: 0.5, roughness: 0.3 }),
    );
    crownPin.rotation.z = Math.PI / 2;
    crownPin.position.set(0, 0.38, -0.02);
    this.headGroup.add(crownPin);
  }

  update(state) {
    if (!state) return;
    const t = state.t ?? 0;
    const pitch = state.headPitch ?? 0;

    // Facing -Z (since group.rotation.y ≈ PI), negative rotation.x tilts the head UP toward the moon (-Z, +Y),
    // and positive rotation.x bows the head DOWN toward the ground/basin.
    this.headGroup.rotation.x = -pitch;
    this.torsoGroup.rotation.x = -pitch * 0.28;

    // Subtle breathing & night breeze sway
    const breath = Math.sin(t * 1.6) * 0.012;
    this.torsoGroup.position.y = 0.82 + breath;

    if (this.leftSleeve && this.rightSleeve) {
      const sway = Math.sin(t * 1.25) * 0.04;
      this.leftSleeve.rotation.z = 0.28 + sway;
      this.rightSleeve.rotation.z = -0.28 + sway;
    }

    if (this.sashRibbon) {
      this.sashRibbon.rotation.x = 0.12 + Math.sin(t * 2.1) * 0.08;
      this.sashRibbon.rotation.z = Math.cos(t * 1.7) * 0.06;
    }
  }
}
