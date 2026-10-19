import * as THREE from 'three';

export class PoetCharacter {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'PoetLiBai';
    // Standing inside the chamber near the open window, bathed in the incoming window moonlight
    this.group.position.set(-0.42, 0.2, 0.62);
    this.group.rotation.y = Math.PI - 0.14;

    this.torsoGroup = new THREE.Group();
    this.torsoGroup.name = 'PoetTorso';
    this.torsoGroup.position.y = 0.88;
    this.group.add(this.torsoGroup);

    this.headGroup = new THREE.Group();
    this.headGroup.name = 'PoetHead';
    this.headGroup.position.y = 0.62;
    this.torsoGroup.add(this.headGroup);

    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.beardGroup = null;
    this.sashRibbon = null;
    this.crownRibbons = [];

    this._buildRobeAndBody();
    this._buildArmsAndHands();
    this._buildHeadAndFace();
  }

  _buildRobeAndBody() {
    const outerRobeMat = new THREE.MeshStandardMaterial({
      color: 0xe2ecfa,
      roughness: 0.54,
      metalness: 0.08,
    });
    const innerSilkMat = new THREE.MeshStandardMaterial({
      color: 0xf7faff,
      roughness: 0.45,
    });
    const brocadeTrimMat = new THREE.MeshStandardMaterial({
      color: 0x22395c,
      roughness: 0.42,
      metalness: 0.14,
    });
    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x9cd6c2,
      roughness: 0.25,
      metalness: 0.2,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d26,
      roughness: 0.7,
    });

    // 1. Boots peeking from beneath the robe hem (云头履)
    for (const side of [-1, 1]) {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), bootMat);
      boot.position.set(side * 0.11, 0.035, 0.05);
      const toeUp = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), bootMat);
      toeUp.position.set(side * 0.11, 0.06, 0.16);
      this.group.add(boot, toeUp);
    }

    // 2. Sculpted Flared Tang Robe Skirt using LatheGeometry (RobeSkirtLathe)
    const skirtProfile = [
      new THREE.Vector2(0.34, 0.03),
      new THREE.Vector2(0.32, 0.14),
      new THREE.Vector2(0.28, 0.35),
      new THREE.Vector2(0.24, 0.58),
      new THREE.Vector2(0.20, 0.78),
      new THREE.Vector2(0.185, 0.90),
    ];
    const skirtGeo = new THREE.LatheGeometry(skirtProfile, 32);
    const skirtMesh = new THREE.Mesh(skirtGeo, outerRobeMat);
    skirtMesh.name = 'RobeSkirtLathe';
    this.group.add(skirtMesh);

    // Bottom brocade hem border
    const hemRing = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 12, 32), brocadeTrimMat);
    hemRing.rotation.x = Math.PI / 2;
    hemRing.position.y = 0.04;
    this.group.add(hemRing);

    // Sculpted vertical pleat folds around the skirt for realistic fabric depth
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const pleat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.028, 0.82, 8),
        outerRobeMat,
      );
      pleat.position.set(Math.cos(angle) * 0.255, 0.44, Math.sin(angle) * 0.255);
      pleat.rotation.z = -Math.cos(angle) * 0.15;
      pleat.rotation.x = Math.sin(angle) * 0.15;
      this.group.add(pleat);
    }

    // 3. Upper Torso (Sculpted Lathe chest & sloped shoulders)
    const torsoProfile = [
      new THREE.Vector2(0.185, 0.0),
      new THREE.Vector2(0.21, 0.18),
      new THREE.Vector2(0.245, 0.38),
      new THREE.Vector2(0.23, 0.52),
      new THREE.Vector2(0.14, 0.60),
    ];
    const torsoLathe = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 28), outerRobeMat);
    torsoLathe.scale.set(1.08, 1.0, 0.82); // Anatomical chest width vs depth
    this.torsoGroup.add(torsoLathe);

    // 4. Layered Crossed-Collar lapels (交领右衽与护领)
    const innerCollarL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.03), innerSilkMat);
    innerCollarL.position.set(-0.055, 0.44, 0.175);
    innerCollarL.rotation.z = -0.38;
    innerCollarL.rotation.x = -0.18;
    this.torsoGroup.add(innerCollarL);

    const innerCollarR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.03), innerSilkMat);
    innerCollarR.position.set(0.055, 0.44, 0.18);
    innerCollarR.rotation.z = 0.38;
    innerCollarR.rotation.x = -0.18;
    this.torsoGroup.add(innerCollarR);

    const outerCollarL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.38, 0.035), brocadeTrimMat);
    outerCollarL.position.set(-0.07, 0.42, 0.182);
    outerCollarL.rotation.z = -0.42;
    outerCollarL.rotation.x = -0.18;
    this.torsoGroup.add(outerCollarL);

    const outerCollarR = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.42, 0.035), brocadeTrimMat);
    outerCollarR.position.set(0.06, 0.4, 0.188);
    outerCollarR.rotation.z = 0.42;
    outerCollarR.rotation.x = -0.18;
    this.torsoGroup.add(outerCollarR);

    // 5. Tang Waist Belt with Jade Plaques (蹀躞玉带) & Hanging Jade Pendant (玉佩)
    const beltRing = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.212, 0.09, 28), brocadeTrimMat);
    beltRing.scale.set(1.06, 1.0, 0.85);
    beltRing.position.y = 0.04;
    this.torsoGroup.add(beltRing);

    for (let j = 0; j < 8; j += 1) {
      const ang = (j / 8) * Math.PI * 2;
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.02), jadeMat);
      plaque.position.set(Math.cos(ang) * 0.215, 0.04, Math.sin(ang) * 0.18);
      plaque.rotation.y = -ang + Math.PI / 2;
      this.torsoGroup.add(plaque);
    }

    // Hanging Jade Bi-disk & silk ribbon (长绶飘带)
    this.sashRibbon = new THREE.Group();
    this.sashRibbon.position.set(0.17, 0.0, 0.11);

    const jadeDisk = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 10, 20), jadeMat);
    jadeDisk.position.y = -0.12;
    this.sashRibbon.add(jadeDisk);

    const ribbonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.065, 0.58, 2, 8),
      new THREE.MeshStandardMaterial({
        color: 0x35537d,
        side: THREE.DoubleSide,
        roughness: 0.48,
      }),
    );
    ribbonMesh.position.y = -0.34;
    this.sashRibbon.add(ribbonMesh);
    this.torsoGroup.add(this.sashRibbon);
  }

  _buildArmsAndHands() {
    const outerRobeMat = new THREE.MeshStandardMaterial({
      color: 0xe2ecfa,
      roughness: 0.54,
      metalness: 0.08,
    });
    const cuffTrimMat = new THREE.MeshStandardMaterial({
      color: 0x22395c,
      roughness: 0.45,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe8ccb4,
      roughness: 0.55,
    });

    const buildSculptedHand = (isLeft) => {
      const hand = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.025), skinMat);
      hand.add(palm);

      // 4 sculpted fingers
      for (let f = 0; f < 4; f += 1) {
        const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.048, 8), skinMat);
        finger.position.set((f - 1.5) * 0.01, -0.05, 0.004);
        finger.rotation.x = 0.22;
        hand.add(finger);
      }
      // Thumb
      const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.005, 0.038, 8), skinMat);
      const sideSign = isLeft ? 1 : -1;
      thumb.position.set(sideSign * 0.026, -0.018, 0.01);
      thumb.rotation.z = sideSign * 0.55;
      hand.add(thumb);
      return hand;
    };

    // ================= LEFT ARM (Gracefully clasped behind back: 负手而立) =================
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.name = 'LeftArmGroup';
    this.leftArmGroup.position.set(-0.23, 0.48, 0.0);

    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.32, 16), outerRobeMat);
    leftUpperArm.position.set(-0.05, -0.14, -0.04);
    leftUpperArm.rotation.z = 0.32;
    leftUpperArm.rotation.x = -0.28;
    this.leftArmGroup.add(leftUpperArm);

    // Wide draped Tang Sleeve (广袖)
    const sleeveCurvePoints = [
      new THREE.Vector2(0.075, 0.0),
      new THREE.Vector2(0.14, 0.12),
      new THREE.Vector2(0.18, 0.28),
      new THREE.Vector2(0.13, 0.42),
    ];
    const leftWideSleeve = new THREE.Mesh(new THREE.LatheGeometry(sleeveCurvePoints, 20), outerRobeMat);
    leftWideSleeve.position.set(-0.08, -0.46, -0.12);
    leftWideSleeve.rotation.z = -0.45;
    leftWideSleeve.rotation.x = 0.35;
    this.leftArmGroup.add(leftWideSleeve);

    const leftCuffTrim = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.015, 10, 20), cuffTrimMat);
    leftCuffTrim.position.set(-0.02, -0.28, -0.16);
    leftCuffTrim.rotation.y = 0.6;
    this.leftArmGroup.add(leftCuffTrim);

    const leftHand = buildSculptedHand(true);
    leftHand.position.set(0.04, -0.32, -0.18);
    leftHand.rotation.x = Math.PI * 0.45;
    leftHand.rotation.z = -0.5;
    this.leftArmGroup.add(leftHand);

    this.torsoGroup.add(this.leftArmGroup);

    // ================= RIGHT ARM (Raised slightly forward toward the moonlit window) =================
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.name = 'RightArmGroup';
    this.rightArmGroup.position.set(0.23, 0.48, 0.0);

    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.32, 16), outerRobeMat);
    rightUpperArm.position.set(0.05, -0.13, 0.05);
    rightUpperArm.rotation.z = -0.3;
    rightUpperArm.rotation.x = 0.34;
    this.rightArmGroup.add(rightUpperArm);

    const rightWideSleeve = new THREE.Mesh(new THREE.LatheGeometry(sleeveCurvePoints, 20), outerRobeMat);
    rightWideSleeve.position.set(0.11, -0.42, 0.16);
    rightWideSleeve.rotation.z = 0.25;
    rightWideSleeve.rotation.x = -0.42;
    this.rightArmGroup.add(rightWideSleeve);

    const rightCuffTrim = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.015, 10, 20), cuffTrimMat);
    rightCuffTrim.position.set(0.09, -0.22, 0.24);
    rightCuffTrim.rotation.y = -0.35;
    this.rightArmGroup.add(rightCuffTrim);

    const rightHand = buildSculptedHand(false);
    rightHand.position.set(0.08, -0.22, 0.29);
    rightHand.rotation.x = -Math.PI * 0.35;
    rightHand.rotation.z = 0.25;
    this.rightArmGroup.add(rightHand);

    this.torsoGroup.add(this.rightArmGroup);
  }

  _buildHeadAndFace() {
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe8ccb4,
      roughness: 0.56,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x151821,
      roughness: 0.65,
    });
    const crownGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd9b468,
      metalness: 0.65,
      roughness: 0.28,
    });
    const crownDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.45,
      metalness: 0.2,
    });
    const jadePinMat = new THREE.MeshStandardMaterial({
      color: 0xedf7f2,
      roughness: 0.2,
      metalness: 0.15,
    });
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xb8766c,
      roughness: 0.6,
    });

    // 1. Neck & Adam's apple contour
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.076, 0.14, 18), skinMat);
    neck.position.y = 0.03;
    this.headGroup.add(neck);

    // 2. Sculpted Cranium & Jawline (Face faces +Z in local space; whole group is rotated ~PI to face -Z window)
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.142, 28, 24), skinMat);
    cranium.scale.set(0.91, 1.12, 0.96);
    cranium.position.y = 0.19;
    this.headGroup.add(cranium);

    // Sculpted lower jaw & chin for a refined scholar profile
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 16), skinMat);
    jaw.scale.set(0.88, 0.95, 0.92);
    jaw.position.set(0, 0.115, 0.035);
    this.headGroup.add(jaw);

    // 3. Ears (双耳)
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), skinMat);
      ear.scale.set(0.42, 1.15, 0.72);
      ear.position.set(side * 0.128, 0.185, -0.005);
      this.headGroup.add(ear);
    }

    // 4. Sculpted Nose Bridge & Tip (高挺鼻梁)
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.018, 0.068, 12), skinMat);
    noseBridge.position.set(0, 0.185, 0.132);
    noseBridge.rotation.x = -0.22;
    this.headGroup.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), skinMat);
    noseTip.position.set(0, 0.155, 0.144);
    this.headGroup.add(noseTip);

    // 5. Expressive Eyebrows (剑眉) & Eyes (眼眸 + 高光)
    for (const side of [-1, 1]) {
      // Sword eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.009, 0.012), hairMat);
      brow.position.set(side * 0.046, 0.228, 0.124);
      brow.rotation.z = side * 0.14;
      brow.rotation.y = side * 0.22;
      this.headGroup.add(brow);

      // Upper eyelid crease
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.006, 0.01), hairMat);
      lid.position.set(side * 0.045, 0.208, 0.128);
      lid.rotation.y = side * 0.2;
      this.headGroup.add(lid);

      // Dark iris/pupil
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x10131a }),
      );
      eye.scale.set(1.1, 0.85, 0.6);
      eye.position.set(side * 0.045, 0.201, 0.128);
      this.headGroup.add(eye);

      // Moonlight catchlight in eye
      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.0035, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      catchlight.position.set(side * 0.042, 0.204, 0.135);
      this.headGroup.add(catchlight);
    }

    // 6. Serene Lips
    const lips = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.011, 0.014), lipMat);
    lips.position.set(0, 0.118, 0.126);
    this.headGroup.add(lips);

    // 7. Three-strand Flowing Tang Poet Beard & Mustache (PoetBeard: 三缕长须)
    this.beardGroup = new THREE.Group();
    this.beardGroup.name = 'PoetBeard';
    this.beardGroup.position.set(0, 0.125, 0.128);

    // Mustache sweeps
    for (const side of [-1, 1]) {
      const mCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.005, 0.008, 0.004),
        new THREE.Vector3(side * 0.028, 0.002, 0.0),
        new THREE.Vector3(side * 0.042, -0.028, -0.008),
        new THREE.Vector3(side * 0.048, -0.075, -0.015),
      ]);
      const mustache = new THREE.Mesh(new THREE.TubeGeometry(mCurve, 12, 0.0055, 8, false), hairMat);
      this.beardGroup.add(mustache);
    }

    // Central long goatee strand
    const centerBeardCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.025, -0.002),
      new THREE.Vector3(0, -0.08, 0.006),
      new THREE.Vector3(0, -0.15, 0.012),
      new THREE.Vector3(0, -0.21, 0.004),
    ]);
    const centerBeard = new THREE.Mesh(
      new THREE.TubeGeometry(centerBeardCurve, 14, 0.009, 8, false),
      hairMat,
    );
    this.beardGroup.add(centerBeard);

    this.headGroup.add(this.beardGroup);

    // 8. Sculpted Hairline, Sideburns (鬓发), Back Hair & Tang Scholar Crown (高冠玉簪)
    const hairBack = new THREE.Mesh(
      new THREE.SphereGeometry(0.148, 24, 20, 0, Math.PI * 2, 0, 1.95),
      hairMat,
    );
    hairBack.scale.set(0.93, 1.12, 1.0);
    hairBack.position.set(0, 0.205, -0.012);
    this.headGroup.add(hairBack);

    // Temple sideburns framing the face
    for (const side of [-1, 1]) {
      const templeLock = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.008, 0.14, 10), hairMat);
      templeLock.position.set(side * 0.118, 0.18, 0.045);
      templeLock.rotation.x = 0.18;
      this.headGroup.add(templeLock);
    }

    // Topknot bun (发髻)
    const topknot = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.12, 16), hairMat);
    topknot.position.set(0, 0.38, -0.015);
    this.headGroup.add(topknot);

    // Tang Scholar Crown (莲花冠 / 梁冠) with gold filigree rim
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.11, 18), crownDarkMat);
    crownBase.position.set(0, 0.4, -0.015);
    this.headGroup.add(crownBase);

    const crownGoldRimBot = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 10, 24), crownGoldMat);
    crownGoldRimBot.rotation.x = Math.PI / 2;
    crownGoldRimBot.position.set(0, 0.35, -0.015);
    this.headGroup.add(crownGoldRimBot);

    const crownGoldRimTop = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.007, 10, 24), crownGoldMat);
    crownGoldRimTop.rotation.x = Math.PI / 2;
    crownGoldRimTop.position.set(0, 0.45, -0.015);
    this.headGroup.add(crownGoldRimTop);

    // Carved White Jade Hairpin (白玉簪) piercing the crown
    const jadePin = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.24, 12), jadePinMat);
    jadePin.rotation.z = Math.PI / 2;
    jadePin.position.set(0, 0.4, -0.015);
    this.headGroup.add(jadePin);

    // Trailing silk crown ribbons behind the head (冠缨)
    for (const side of [-1, 1]) {
      const ribbon = new THREE.Mesh(
        new THREE.PlaneGeometry(0.028, 0.36, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0x2c4870, side: THREE.DoubleSide }),
      );
      ribbon.position.set(side * 0.055, 0.18, -0.13);
      ribbon.rotation.x = 0.16;
      this.headGroup.add(ribbon);
      this.crownRibbons.push(ribbon);
    }
  }

  update(state) {
    if (!state) return;
    const t = state.t ?? 0;
    const pitch = state.headPitch ?? 0;

    // Group is rotated ~PI around Y (facing -Z toward the open window & moon).
    // Local +Z is forward, so negative rotation.x tilts the head UP toward the moon,
    // and positive rotation.x bows the head DOWN in contemplation.
    this.headGroup.rotation.x = -pitch;
    this.torsoGroup.rotation.x = -pitch * 0.26;

    // Beard counter-rotates slightly so it hangs naturally under gravity when looking up/down
    if (this.beardGroup) {
      this.beardGroup.rotation.x = pitch * 0.45 + Math.sin(t * 1.9) * 0.03;
    }

    // Subtle breathing & night breeze motion
    const breath = Math.sin(t * 1.6) * 0.012;
    this.torsoGroup.position.y = 0.88 + breath;

    if (this.leftArmGroup && this.rightArmGroup) {
      const sway = Math.sin(t * 1.25) * 0.035;
      this.leftArmGroup.rotation.z = sway;
      // Right arm gently lifts slightly as Li Bai gazes up at the full moon
      const armLift = Math.max(0, pitch) * 0.35;
      this.rightArmGroup.rotation.x = armLift;
      this.rightArmGroup.rotation.z = -sway;
    }

    if (this.sashRibbon) {
      this.sashRibbon.rotation.x = 0.08 + Math.sin(t * 2.1) * 0.06;
      this.sashRibbon.rotation.z = Math.cos(t * 1.7) * 0.05;
    }

    for (let i = 0; i < this.crownRibbons.length; i += 1) {
      const r = this.crownRibbons[i];
      r.rotation.x = 0.18 + Math.max(0, pitch) * 0.35 + Math.sin(t * 2.3 + i) * 0.05;
    }
  }
}
