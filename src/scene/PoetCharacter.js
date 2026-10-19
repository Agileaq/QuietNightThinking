import * as THREE from 'three';
import {
  getBakedSilkMaps,
  getBakedLeatherAndCarvingMaps,
  preparePBRGeometry,
} from './PBRTextures.js';

export class PoetCharacter {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'PoetLiBai';
    // Initial standing position inside the chamber near the open window
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

    this.leftLegGroup = null;
    this.rightLegGroup = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.beardGroup = null;
    this.sashRibbon = null;
    this.crownRibbons = [];

    this._initMaterials();
    this._buildRobeAndBody();
    this._buildArmsAndHands();
    this._buildHeadAndFace();

    // Enable shadow casting & receiving on all character meshes
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  _initMaterials() {
    const silkMaps = getBakedSilkMaps();
    const leatherMaps = getBakedLeatherAndCarvingMaps();

    // 1. Primary Tang Moon-White Silk Robe (MeshPhysicalMaterial with cloth sheen + normalMap + aoMap)
    this.outerRobeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6effc,
      map: silkMaps.colorMap,
      normalMap: silkMaps.normalMap,
      normalScale: new THREE.Vector2(0.48, 0.48),
      aoMap: silkMaps.aoMap,
      aoMapIntensity: 0.72,
      roughnessMap: silkMaps.roughnessMap,
      roughness: 0.52,
      metalness: 0.02,
      sheen: 1.0,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0xdcebff),
    });

    // 2. Inner Pure Silk Collar & Under-sleeve (中衣素纱)
    this.innerSilkMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6faff,
      normalMap: silkMaps.normalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.42,
      metalness: 0.01,
      sheen: 1.0,
      sheenRoughness: 0.38,
      sheenColor: new THREE.Color(0xffffff),
    });

    // 3. Indigo Tang Cloud-Brocade Trim (深青织锦缘边)
    this.brocadeTrimMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f3556,
      normalMap: leatherMaps.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: leatherMaps.roughnessMap,
      roughness: 0.4,
      metalness: 0.12,
      sheen: 0.9,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0x8cb8ff),
    });

    // 4. Xiedie Leather Belt Base (躞蹀带乌皮质地)
    this.leatherBeltMat = new THREE.MeshPhysicalMaterial({
      color: 0x1b1615,
      normalMap: leatherMaps.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: leatherMaps.roughnessMap,
      roughness: 0.36,
      metalness: 0.15,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
    });

    // 5. Hetian Celadon-White Jade Plaques & Pendant (和田青白玉銙片 — 透光温润质感)
    this.jadeMat = new THREE.MeshPhysicalMaterial({
      color: 0xbbe8d8,
      normalMap: leatherMaps.normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      roughness: 0.18,
      metalness: 0.05,
      transmission: 0.34,
      thickness: 0.35,
      ior: 1.61,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xe8fff6),
    });

    // 6. Gilt-Bronze Belt Fittings & Hairpin Trim (鎏金铜扣)
    this.giltGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcb668,
      normalMap: leatherMaps.normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughnessMap: leatherMaps.roughnessMap,
      metalness: 0.86,
      roughness: 0.24,
      clearcoat: 0.4,
    });

    // 7. Tang Futou Black Gauze Headwear (乌纱幞头 — 织物绒感与褶皱法线)
    this.futouMat = new THREE.MeshPhysicalMaterial({
      color: 0x181d2a,
      normalMap: silkMaps.normalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
      aoMap: silkMaps.aoMap,
      aoMapIntensity: 0.65,
      roughness: 0.46,
      metalness: 0.08,
      sheen: 0.92,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color(0x6e85ad),
    });

    // 8. Poet Skin with Subsurface-Scattering Approximation (微弱次表面散射感皮肤)
    this.skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8cab2,
      normalMap: silkMaps.normalMap,
      normalScale: new THREE.Vector2(0.06, 0.06),
      roughness: 0.48,
      metalness: 0.01,
      sheen: 0.38,
      sheenRoughness: 0.62,
      sheenColor: new THREE.Color(0xffbfa8),
      clearcoat: 0.08,
      clearcoatRoughness: 0.55,
    });

    // 9. Hair & Flowing Beard
    this.hairMat = new THREE.MeshPhysicalMaterial({
      color: 0x141720,
      roughness: 0.52,
      metalness: 0.08,
      sheen: 0.65,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color(0x526488),
    });

    // 10. Boots (唐代乌皮云头履)
    this.bootMat = new THREE.MeshPhysicalMaterial({
      color: 0x171a22,
      normalMap: leatherMaps.normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: 0.45,
      metalness: 0.1,
      clearcoat: 0.2,
    });
  }

  /**
   * Builds a high-subdivision organic cloth skirt geometry with baked harmonic drapery pleats
   * instead of rigid primitive cones/cylinders.
   */
  _createSculptedDrapedSkirtGeometry() {
    const radialSegs = 64;
    const heightSegs = 36;
    const geo = new THREE.CylinderGeometry(0.182, 0.345, 0.89, radialSegs, heightSegs, false);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i); // [-0.445 .. +0.445]
      const z = pos.getZ(i);

      const vNorm = (y + 0.445) / 0.89; // 0 at hem, 1 at waist
      const theta = Math.atan2(z, x);
      const rBase = Math.hypot(x, z);

      if (rBase > 0.001) {
        // Natural S-curve silhouette flare near the hem + waist cinch under the Xiedie belt
        const waistPinch = Math.exp(-Math.pow((vNorm - 0.95) * 6.0, 2)) * -0.016;
        const bellFlare = Math.pow(1.0 - vNorm, 1.65) * 0.028;

        // Multi-frequency cloth drapery folds (deepest at the bottom hem, gathered at waist)
        const foldAmp = (0.35 + 0.65 * (1.0 - vNorm)) * 0.019;
        const primaryPleats = Math.cos(theta * 10.0 + vNorm * 0.65) * foldAmp;
        const secondaryFolds = Math.sin(theta * 20.0 - vNorm * 1.1) * (foldAmp * 0.42);
        const frontOverlapCrease =
          Math.exp(-Math.pow(theta - 1.15, 2) * 8.0) * 0.016 * (1.0 - vNorm * 0.3);

        const newR = rBase + waistPinch + bellFlare + primaryPleats + secondaryFolds + frontOverlapCrease;
        const scale = newR / rBase;

        // Subtle oval anatomical cross-section (wider side-to-side than front-to-back)
        pos.setX(i, x * scale * 1.05);
        // Slight wave along bottom hem border
        const hemWave = (1.0 - vNorm) * Math.cos(theta * 10.0) * 0.008;
        pos.setY(i, y + 0.455 + hemWave);
        pos.setZ(i, z * scale * 0.91);
      }
    }

    return preparePBRGeometry(geo);
  }

  /**
   * Builds a sculpted upper torso with natural chest, shoulder slope, and cloth drape folds.
   */
  _createSculptedTorsoGeometry() {
    const radialSegs = 48;
    const heightSegs = 24;
    const geo = new THREE.CylinderGeometry(0.155, 0.185, 0.6, radialSegs, heightSegs, false);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i); // [-0.3 .. +0.3]
      const z = pos.getZ(i);
      const vNorm = (y + 0.3) / 0.6; // 0 at waist, 1 at neck/shoulders
      const theta = Math.atan2(z, x);
      const rBase = Math.hypot(x, z);

      if (rBase > 0.001) {
        // Broaden chest and shoulders around vNorm in [0.45, 0.85], taper smoothly into neck at vNorm -> 1.0
        const shoulderCurve = Math.sin(vNorm * Math.PI * 0.88) * 0.058;
        const neckTaper = vNorm > 0.82 ? -Math.pow((vNorm - 0.82) / 0.18, 1.6) * 0.065 : 0.0;
        const drapeFolds = Math.cos(theta * 8.0 + vNorm * 0.8) * 0.007 * (1.0 - vNorm * 0.5);

        const newR = rBase + shoulderCurve + neckTaper + drapeFolds;
        const scale = newR / rBase;

        // Anatomical shoulder breadth vs chest depth + slight pectoral fullness in front (+Z)
        const chestFullness = z > 0 ? Math.sin(vNorm * Math.PI) * 0.018 : 0.0;
        pos.setX(i, x * scale * 1.15);
        pos.setY(i, y + 0.3);
        pos.setZ(i, z * scale * 0.84 + chestFullness);
      }
    }

    return preparePBRGeometry(geo);
  }

  _buildRobeAndBody() {
    // 1. Articulated Legs & Sculpted Tang Cloud-Toe Boots (云头履) for walking/turning animation
    const buildBootGroup = (side) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.105, 0.24, 0.02);

      const ankle = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.044, 0.14, 10, 16),
        this.innerSilkMat,
      );
      ankle.position.set(0, -0.08, 0);
      legGroup.add(ankle);

      const bootSole = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.048, 0.13, 12, 18),
        this.bootMat,
      );
      bootSole.rotation.x = Math.PI / 2;
      bootSole.scale.set(1.0, 1.0, 0.68);
      bootSole.position.set(0, -0.2, 0.045);
      legGroup.add(bootSole);

      // Upturned Tang cloud-scroll toe cap (云头履翘头)
      const cloudToe = new THREE.Mesh(
        new THREE.SphereGeometry(0.046, 16, 14),
        this.brocadeTrimMat,
      );
      cloudToe.scale.set(0.92, 1.18, 0.88);
      cloudToe.position.set(0, -0.18, 0.145);
      legGroup.add(cloudToe);

      return legGroup;
    };

    this.leftLegGroup = buildBootGroup(-1);
    this.leftLegGroup.name = 'LeftLegGroup';
    this.rightLegGroup = buildBootGroup(1);
    this.rightLegGroup.name = 'RightLegGroup';
    this.group.add(this.leftLegGroup, this.rightLegGroup);

    // 2. High-Subdivision Sculpted Draped Robe Skirt (RobeSkirtLathe)
    const skirtGeo = this._createSculptedDrapedSkirtGeometry();
    const skirtMesh = new THREE.Mesh(skirtGeo, this.outerRobeMat);
    skirtMesh.name = 'RobeSkirtLathe';
    this.group.add(skirtMesh);

    // Bottom brocade hem border following the oval skirt contour
    const hemRing = new THREE.Mesh(
      preparePBRGeometry(new THREE.TorusGeometry(0.342, 0.018, 16, 48)),
      this.brocadeTrimMat,
    );
    hemRing.rotation.x = Math.PI / 2;
    hemRing.scale.set(1.05, 0.91, 1.0);
    hemRing.position.y = 0.032;
    this.group.add(hemRing);

    // 3. Sculpted Upper Torso
    const torsoMesh = new THREE.Mesh(this._createSculptedTorsoGeometry(), this.outerRobeMat);
    this.torsoGroup.add(torsoMesh);

    // 4. Continuous Curved Crossed-Collar Lapels (交领右衽与白纱护领 — TubeGeometry curves, zero flat boxes)
    const buildCollarLapel = (pts, radius, mat, scaleZ = 0.45) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = preparePBRGeometry(new THREE.TubeGeometry(curve, 24, radius, 14, false));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(1.0, 1.0, scaleZ);
      return mesh;
    };

    // Inner white silk collar (护领) wrapping smoothly around the neck to chest
    const innerLapelL = buildCollarLapel(
      [
        new THREE.Vector3(-0.085, 0.58, -0.02),
        new THREE.Vector3(-0.095, 0.51, 0.12),
        new THREE.Vector3(-0.045, 0.39, 0.178),
        new THREE.Vector3(0.03, 0.28, 0.185),
      ],
      0.028,
      this.innerSilkMat,
    );
    const innerLapelR = buildCollarLapel(
      [
        new THREE.Vector3(0.085, 0.58, -0.02),
        new THREE.Vector3(0.095, 0.51, 0.12),
        new THREE.Vector3(0.055, 0.4, 0.175),
        new THREE.Vector3(0.0, 0.32, 0.176),
      ],
      0.026,
      this.innerSilkMat,
    );
    this.torsoGroup.add(innerLapelL, innerLapelR);

    // Outer indigo cloud-brocade crossed collar (交领右衽长襟) sweeping down to the right waist
    const outerLapelL = buildCollarLapel(
      [
        new THREE.Vector3(0.0, 0.59, -0.085),
        new THREE.Vector3(-0.11, 0.52, 0.105),
        new THREE.Vector3(-0.055, 0.38, 0.186),
        new THREE.Vector3(0.055, 0.24, 0.195),
        new THREE.Vector3(0.155, 0.08, 0.165),
      ],
      0.034,
      this.brocadeTrimMat,
    );
    const outerLapelR = buildCollarLapel(
      [
        new THREE.Vector3(0.0, 0.59, -0.085),
        new THREE.Vector3(0.11, 0.52, 0.105),
        new THREE.Vector3(0.068, 0.39, 0.182),
        new THREE.Vector3(-0.01, 0.27, 0.182),
      ],
      0.032,
      this.brocadeTrimMat,
    );
    this.torsoGroup.add(outerLapelL, outerLapelR);

    // 5. Authentic Tang Thirteen-Plaque Xiedie Belt (唐代十三銙躞蹀玉带: XiedieBelt)
    const beltGroup = new THREE.Group();
    beltGroup.name = 'XiedieBelt';
    beltGroup.position.y = 0.035;

    // Sculpted leather main belt hoop
    const leatherBand = new THREE.Mesh(
      preparePBRGeometry(new THREE.TorusGeometry(0.196, 0.032, 16, 48)),
      this.leatherBeltMat,
    );
    leatherBand.rotation.x = Math.PI / 2;
    leatherBand.scale.set(1.12, 0.88, 1.35);
    beltGroup.add(leatherBand);

    // Upper & lower gilt-bronze rim cord on the belt
    for (const dy of [-0.034, 0.034]) {
      const goldRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.198, 0.0055, 10, 40),
        this.giltGoldMat,
      );
      goldRim.rotation.x = Math.PI / 2;
      goldRim.scale.set(1.12, 0.88, 1.0);
      goldRim.position.y = dy;
      beltGroup.add(goldRim);
    }

    // Beveled Jade Plaques (玉带銙) + Gilt frames + Small Xiedie hanging straps (躞蹀小带)
    const plaqueShape = new THREE.Shape();
    plaqueShape.moveTo(-0.02, -0.024);
    plaqueShape.lineTo(0.02, -0.024);
    plaqueShape.lineTo(0.02, 0.018);
    plaqueShape.quadraticCurveTo(0, 0.028, -0.02, 0.018);
    plaqueShape.closePath();

    const plaqueGeo = preparePBRGeometry(
      new THREE.ExtrudeGeometry(plaqueShape, {
        depth: 0.008,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.004,
        bevelThickness: 0.004,
      }),
    );

    const plaqueCount = 10;
    for (let j = 0; j < plaqueCount; j += 1) {
      const ang = (j / plaqueCount) * Math.PI * 2;
      const px = Math.cos(ang) * 0.222;
      const pz = Math.sin(ang) * 0.176;

      const plaqueHolder = new THREE.Group();
      plaqueHolder.position.set(px, 0, pz);
      plaqueHolder.rotation.y = -ang + Math.PI / 2;

      const jadePlaque = new THREE.Mesh(plaqueGeo, this.jadeMat);
      plaqueHolder.add(jadePlaque);

      // Gilt rivet pin on each plaque
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), this.giltGoldMat);
      rivet.position.set(0, -0.012, 0.012);
      plaqueHolder.add(rivet);

      // Hanging Xiedie sub-straps with gilt rings on side plaques
      if (j % 2 === 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.009, 0.0022, 8, 16),
          this.giltGoldMat,
        );
        ring.position.set(0, -0.036, 0.004);
        plaqueHolder.add(ring);

        const smallStrap = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.005, 0.075, 6, 10),
          this.leatherBeltMat,
        );
        smallStrap.scale.set(1.0, 1.0, 0.35);
        smallStrap.position.set(0, -0.08, 0.002);
        plaqueHolder.add(smallStrap);
      }

      beltGroup.add(plaqueHolder);
    }

    this.torsoGroup.add(beltGroup);

    // 6. Hanging Carved Jade Bi-Disk Pendant & Silk Sash (双环玉佩与长绶飘带)
    this.sashRibbon = new THREE.Group();
    this.sashRibbon.position.set(0.175, 0.0, 0.115);

    const goldCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.11, 8),
      this.giltGoldMat,
    );
    goldCord.position.y = -0.055;
    this.sashRibbon.add(goldCord);

    const jadeDisk = new THREE.Mesh(
      preparePBRGeometry(new THREE.TorusGeometry(0.036, 0.01, 16, 32)),
      this.jadeMat,
    );
    jadeDisk.position.y = -0.12;
    this.sashRibbon.add(jadeDisk);

    const innerGoldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.0035, 10, 24),
      this.giltGoldMat,
    );
    innerGoldRing.position.y = -0.12;
    this.sashRibbon.add(innerGoldRing);

    // Curved silk sash ribbon with wave subdivisions
    const ribbonGeo = new THREE.PlaneGeometry(0.062, 0.56, 4, 16);
    const rPos = ribbonGeo.attributes.position;
    for (let k = 0; k < rPos.count; k += 1) {
      const ry = rPos.getY(k);
      rPos.setZ(k, Math.sin(ry * 9.0) * 0.012);
    }
    preparePBRGeometry(ribbonGeo);

    const ribbonMesh = new THREE.Mesh(
      ribbonGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x2b4973,
        side: THREE.DoubleSide,
        roughness: 0.44,
        sheen: 1.0,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color(0xa6c8ff),
      }),
    );
    ribbonMesh.position.y = -0.35;
    this.sashRibbon.add(ribbonMesh);
    this.torsoGroup.add(this.sashRibbon);
  }

  /**
   * Builds a twist-free wide Tang sleeve (广袖) + integrated brocade cuff border (袖缘)
   * using a stable up-vector frame along the 3D arm curve (eliminating Frenet torsion flips
   * and detached floating Torus rings).
   */
  _createSleeveSectionGeometry(curve, uStart, uEnd, radialOffset = 0.0, tubularSegs = 24) {
    const radialSegs = 32;
    const positions = [];
    const uvs = [];
    const indices = [];

    const worldUp = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= tubularSegs; i += 1) {
      const localFrac = i / tubularSegs;
      const u = uStart + (uEnd - uStart) * localFrac;
      const pt = curve.getPointAt(u);
      const T = curve.getTangentAt(u).normalize();

      // Stable horizontal side axis B and vertical-ish normal N (no Frenet flipping!)
      let B = new THREE.Vector3().crossVectors(T, worldUp);
      if (B.lengthSq() < 0.0001) {
        B.set(1, 0, 0);
      } else {
        B.normalize();
      }
      const N = new THREE.Vector3().crossVectors(B, T).normalize();

      // Sleeve radius expands from shoulder (u=0) to wide hanging elbow/cuff, then tapers slightly at wrist opening
      const baseRadius = 0.062 + Math.sin(u * Math.PI * 0.78) * 0.062 + radialOffset;
      // Authentic Tang hanging wide-sleeve belly (垂胡袖下垂弧度) along -N
      const gravityDroop = Math.sin(u * Math.PI * 0.88) * 0.095;

      for (let j = 0; j <= radialSegs; j += 1) {
        const v = j / radialSegs;
        const theta = v * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Soft longitudinal cloth drapery folds
        const fold = Math.cos(theta * 6.0 + u * 3.2) * 0.0055 * Math.sin(u * Math.PI);
        const r = baseRadius + fold;

        // Narrower horizontally (B), deeper vertically (N) for realistic draped cloth silhouette
        const horizR = r * 0.78;
        const vertR = r * 1.12;

        let vx = pt.x + cosT * horizR * B.x + sinT * vertR * N.x;
        let vy = pt.y + cosT * horizR * B.y + sinT * vertR * N.y;
        let vz = pt.z + cosT * horizR * B.z + sinT * vertR * N.z;

        // Pull lower half (sinT < 0) downward under gravity
        if (sinT < 0) {
          vy -= gravityDroop * Math.pow(-sinT, 1.35);
        }

        positions.push(vx, vy, vz);
        uvs.push(u * 2.0, v);
      }
    }

    const ringVerts = radialSegs + 1;
    for (let i = 0; i < tubularSegs; i += 1) {
      for (let j = 0; j < radialSegs; j += 1) {
        const a = i * ringVerts + j;
        const b = (i + 1) * ringVerts + j;
        const c = (i + 1) * ringVerts + (j + 1);
        const d = i * ringVerts + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return preparePBRGeometry(geo);
  }

  /**
   * Generates a continuous 3-phalanx curved finger or thumb mesh (近节 -> 中节 -> 远节指尖)
   * with subtle knuckle contours and a tapered rounded fingertip pad.
   */
  _createArticulatedFingerGeometry(boneVectors, baseRadius, tipRadius) {
    const curve = new THREE.CatmullRomCurve3(boneVectors);
    const tubularSegs = 18;
    const radialSegs = 12;
    const positions = [];
    const uvs = [];
    const indices = [];

    const upHint = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i <= tubularSegs; i += 1) {
      const u = i / tubularSegs;
      const pt = curve.getPointAt(u);
      const T = curve.getTangentAt(u).normalize();

      let B = new THREE.Vector3().crossVectors(T, upHint);
      if (B.lengthSq() < 0.0001) {
        B.set(1, 0, 0);
      } else {
        B.normalize();
      }
      const N = new THREE.Vector3().crossVectors(B, T).normalize();

      // Linear taper from knuckle base to fingertip + rounded hemispherical closure at tip (u > 0.86)
      let r = baseRadius * (1.0 - u) + tipRadius * u;
      // Subtle anatomical knuckle swellings at PIP (u ≈ 0.45) and DIP (u ≈ 0.74)
      const pipSwell = Math.exp(-Math.pow((u - 0.45) * 14.0, 2)) * 0.00045;
      const dipSwell = Math.exp(-Math.pow((u - 0.74) * 16.0, 2)) * 0.0003;
      r += pipSwell + dipSwell;

      if (u > 0.86) {
        const tipU = (u - 0.86) / 0.14;
        r *= Math.cos(tipU * Math.PI * 0.48);
      }

      for (let j = 0; j <= radialSegs; j += 1) {
        const v = j / radialSegs;
        const theta = v * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Slightly wider than thick (anatomical finger cross-section)
        const rx = r * 1.04;
        const rz = r * 0.92;

        const vx = pt.x + cosT * rx * B.x + sinT * rz * N.x;
        const vy = pt.y + cosT * rx * B.y + sinT * rz * N.y;
        const vz = pt.z + cosT * rx * B.z + sinT * rz * N.z;

        positions.push(vx, vy, vz);
        uvs.push(u, v);
      }
    }

    const ringVerts = radialSegs + 1;
    for (let i = 0; i < tubularSegs; i += 1) {
      for (let j = 0; j < radialSegs; j += 1) {
        const a = i * ringVerts + j;
        const b = (i + 1) * ringVerts + j;
        const c = (i + 1) * ringVerts + (j + 1);
        const d = i * ringVerts + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return preparePBRGeometry(geo);
  }

  /**
   * Builds an anatomical, multi-joint sculpted human hand with wrist, contoured metacarpal palm
   * (dorsal arch, palmar hollow, thenar mound), 4 3-phalanx curved fingers, and an opposable thumb.
   * Local coordinate convention:
   *   Origin (0, 0, 0) = Wrist joint center
   *   -Y = Distal direction (from wrist -> palm -> fingertips)
   *   +Z = Palmar face (手心), -Z = Dorsal back of hand (手背)
   *   +X * sideSign = Radial/Thumb side (拇指侧)
   */
  _buildAnatomicalHand(isLeft, handName) {
    const handGroup = new THREE.Group();
    handGroup.name = handName;
    const sideSign = isLeft ? 1 : -1;

    // 1. Forearm & Wrist Bridge (手腕与小臂连接段, y in [+0.045 .. +0.002])
    const wristGeo = new THREE.CylinderGeometry(0.022, 0.021, 0.052, 24, 6, false);
    wristGeo.scale(1.12, 1.0, 0.76);
    preparePBRGeometry(wristGeo);
    const wristMesh = new THREE.Mesh(wristGeo, this.skinMat);
    wristMesh.position.set(0, 0.022, 0);
    handGroup.add(wristMesh);

    // 2. Sculpted Metacarpal Palm (手掌主体: y in [0.004 .. -0.052])
    const palmGeo = new THREE.BoxGeometry(0.048, 0.056, 0.019, 12, 12, 6);
    const pPos = palmGeo.attributes.position;
    for (let i = 0; i < pPos.count; i += 1) {
      let x = pPos.getX(i); // [-0.024 .. +0.024]
      let y = pPos.getY(i); // [-0.028 .. +0.028]
      let z = pPos.getZ(i); // [-0.0095 .. +0.0095]

      const uWidth = x / 0.024; // [-1 .. +1]
      const vDistal = (0.028 - y) / 0.056; // 0 at wrist, 1 at knuckles
      const wThick = z / 0.0095; // [-1 .. +1]

      // Elliptical rounding of box corners so the palm is a smooth organic cushion
      const cornerRound = Math.sqrt(Math.max(0.18, 1.0 - 0.38 * uWidth * uWidth * wThick * wThick));
      z *= cornerRound;

      // Taper at the wrist heel (vDistal -> 0) and flare slightly across the knuckles (vDistal -> 0.85)
      const widthProfile = 0.84 + 0.22 * Math.sin(vDistal * Math.PI * 0.72);
      x *= widthProfile;

      // Natural curved knuckle arch (middle knuckle extends furthest distally, pinky side recedes)
      const radialCoord = uWidth * sideSign; // +1 on thumb side, -1 on pinky side
      const knuckleArch = (1.0 - Math.pow(radialCoord - 0.15, 2) * 0.45) * 0.005 * vDistal;
      y -= knuckleArch;

      // Dorsal arch (back of hand z < 0 curves outward) & Palmar hollow (center of palm z > 0 dips slightly)
      const archCurve = (1.0 - uWidth * uWidth) * Math.sin(vDistal * Math.PI);
      if (z < 0) {
        z -= archCurve * 0.0035;
      } else {
        z -= archCurve * 0.0022;
        // Thenar eminence (大鱼际肌隆起 on the thumb base: radialCoord > 0, vDistal in [0.15..0.65])
        if (radialCoord > 0) {
          const thenar =
            Math.pow(radialCoord, 1.4) *
            Math.sin(Math.min(1.0, vDistal * 1.35) * Math.PI) *
            0.0055;
          z += thenar;
        }
      }

      pPos.setXYZ(i, x, y - 0.024, z);
    }
    preparePBRGeometry(palmGeo);
    const palmMesh = new THREE.Mesh(palmGeo, this.skinMat);
    handGroup.add(palmMesh);

    // 3. Four 3-Phalanx Articulated Curved Fingers (食指、中指、无名指、小指)
    // Progressive natural curl from index to pinky (兰花/儒雅舒展手势)
    const fingerSpecs = [
      {
        // Index finger (食指)
        rootX: sideSign * 0.0175,
        rootY: -0.049,
        len: 0.043,
        rBase: 0.0062,
        rTip: 0.0044,
        splayX: sideSign * 0.0025,
        curl: [0.18, 0.42, 0.62],
      },
      {
        // Middle finger (中指)
        rootX: sideSign * 0.006,
        rootY: -0.052,
        len: 0.048,
        rBase: 0.0066,
        rTip: 0.0046,
        splayX: 0.0,
        curl: [0.24, 0.52, 0.78],
      },
      {
        // Ring finger (无名指)
        rootX: -sideSign * 0.006,
        rootY: -0.050,
        len: 0.044,
        rBase: 0.0061,
        rTip: 0.0043,
        splayX: -sideSign * 0.002,
        curl: [0.34, 0.72, 1.05],
      },
      {
        // Pinky finger (小指)
        rootX: -sideSign * 0.017,
        rootY: -0.046,
        len: 0.036,
        rBase: 0.0053,
        rTip: 0.0038,
        splayX: -sideSign * 0.0045,
        curl: [0.44, 0.88, 1.25],
      },
    ];

    for (const spec of fingerSpecs) {
      const p0 = new THREE.Vector3(spec.rootX, spec.rootY + 0.004, 0.0);
      const l1 = spec.len * 0.46;
      const l2 = spec.len * 0.31;
      const l3 = spec.len * 0.23;

      const p1 = new THREE.Vector3(
        p0.x + spec.splayX * 0.4,
        p0.y - Math.cos(spec.curl[0]) * l1,
        p0.z + Math.sin(spec.curl[0]) * l1,
      );
      const p2 = new THREE.Vector3(
        p1.x + spec.splayX * 0.35,
        p1.y - Math.cos(spec.curl[1]) * l2,
        p1.z + Math.sin(spec.curl[1]) * l2,
      );
      const p3 = new THREE.Vector3(
        p2.x + spec.splayX * 0.25,
        p2.y - Math.cos(spec.curl[2]) * l3,
        p2.z + Math.sin(spec.curl[2]) * l3,
      );

      const fingerGeo = this._createArticulatedFingerGeometry(
        [p0, p1, p2, p3],
        spec.rBase,
        spec.rTip,
      );
      const fingerMesh = new THREE.Mesh(fingerGeo, this.skinMat);
      handGroup.add(fingerMesh);
    }

    // 4. Opposable 3-Joint Thumb (大鱼际至拇指指尖连续曲面)
    const thumbPoints = [
      new THREE.Vector3(sideSign * 0.016, -0.014, 0.003),
      new THREE.Vector3(sideSign * 0.028, -0.028, 0.011),
      new THREE.Vector3(sideSign * 0.033, -0.043, 0.017),
      new THREE.Vector3(sideSign * 0.029, -0.056, 0.021),
    ];
    const thumbGeo = this._createArticulatedFingerGeometry(thumbPoints, 0.0086, 0.0052);
    const thumbMesh = new THREE.Mesh(thumbGeo, this.skinMat);
    handGroup.add(thumbMesh);

    return handGroup;
  }

  /**
   * Builds a complete arm assembly:
   * 1) Outer wide silk sleeve (广袖)
   * 2) Integrated indigo brocade cuff border (织锦袖缘)
   * 3) Fitted inner white silk under-sleeve (中衣窄袖)
   * 4) Coaxially connected anatomical wrist & hand
   */
  _buildCompleteArmAssembly(armCurvePoints, isLeft, armGroupName, handGroupName, wristRoll = 0) {
    const armGroup = new THREE.Group();
    armGroup.name = armGroupName;

    const curve = new THREE.CatmullRomCurve3(armCurvePoints);

    // 1. Outer wide silk sleeve (u in [0.0, 0.92])
    const outerSleeveGeo = this._createSleeveSectionGeometry(curve, 0.0, 0.92, 0.0, 28);
    const outerSleeveMesh = new THREE.Mesh(outerSleeveGeo, this.outerRobeMat);
    armGroup.add(outerSleeveMesh);

    // 2. Integrated indigo brocade cuff border wrapped seamlessly at the sleeve mouth (u in [0.84, 0.93])
    const cuffTrimGeo = this._createSleeveSectionGeometry(curve, 0.84, 0.93, 0.0022, 8);
    const cuffTrimMesh = new THREE.Mesh(cuffTrimGeo, this.brocadeTrimMat);
    armGroup.add(cuffTrimMesh);

    // 3. Fitted inner white silk under-sleeve (中衣束袖) emerging from inside the wide sleeve (u in [0.58, 0.98])
    const innerSubPoints = [
      curve.getPointAt(0.58),
      curve.getPointAt(0.74),
      curve.getPointAt(0.88),
      curve.getPointAt(0.98),
    ];
    const innerCurve = new THREE.CatmullRomCurve3(innerSubPoints);
    const innerSleeveGeo = preparePBRGeometry(
      new THREE.TubeGeometry(innerCurve, 16, 0.031, 16, false),
    );
    const innerSleeveMesh = new THREE.Mesh(innerSleeveGeo, this.innerSilkMat);
    armGroup.add(innerSleeveMesh);

    // 4. Anatomical Sculpted Hand aligned coaxially with the forearm tangent at u = 1.0
    const handGroup = this._buildAnatomicalHand(isLeft, handGroupName);
    const wristPos = curve.getPointAt(1.0);
    const wristTangent = curve.getTangentAt(1.0).normalize();

    handGroup.position.copy(wristPos);
    // Align hand's distal axis (-Y) with the forearm tangent direction
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, -1, 0),
      wristTangent,
    );
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, -1, 0),
      wristRoll,
    );
    handGroup.quaternion.copy(alignQuat).multiply(rollQuat);

    armGroup.add(handGroup);
    return armGroup;
  }

  _buildArmsAndHands() {
    // ================= LEFT ARM (Gracefully clasped behind back: 负手而立) =================
    const leftArmPoints = [
      new THREE.Vector3(0.02, 0.0, 0.0),
      new THREE.Vector3(-0.06, -0.14, -0.06),
      new THREE.Vector3(-0.04, -0.27, -0.15),
      new THREE.Vector3(0.06, -0.33, -0.195),
    ];
    this.leftArmGroup = this._buildCompleteArmAssembly(
      leftArmPoints,
      true,
      'LeftArmGroup',
      'LeftHandGroup',
      -0.35, // Palm facing gently outward/upward behind the waist belt
    );
    this.leftArmGroup.position.set(-0.21, 0.49, 0.0);
    this.torsoGroup.add(this.leftArmGroup);

    // ================= RIGHT ARM (Poised scholar gesture in front: 执礼吟咏) =================
    const rightArmPoints = [
      new THREE.Vector3(-0.02, 0.0, 0.0),
      new THREE.Vector3(0.065, -0.14, 0.05),
      new THREE.Vector3(0.075, -0.24, 0.155),
      new THREE.Vector3(0.015, -0.22, 0.255),
    ];
    this.rightArmGroup = this._buildCompleteArmAssembly(
      rightArmPoints,
      false,
      'RightArmGroup',
      'RightHandGroup',
      0.42, // Natural supination: palm angled softly inward/upward
    );
    this.rightArmGroup.position.set(0.21, 0.49, 0.0);
    this.torsoGroup.add(this.rightArmGroup);
  }

  /**
   * Deforms a high-resolution sphere into an anatomical Tang scholar head mesh
   * with brow ridge, eye sockets, cheekbones, tapered jaw, and chin contour.
   */
  _createAnatomicalHeadGeometry() {
    const geo = new THREE.SphereGeometry(0.142, 48, 40);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Base cranium proportions
      x *= 0.90;
      y *= 1.15;
      z *= 0.97;

      // Taper lower jaw and chin (y < 0)
      if (y < 0.02) {
        const jawFactor = Math.min(1.0, (0.02 - y) / 0.16);
        x *= 1.0 - jawFactor * 0.28;
        if (z > 0) {
          // Project chin slightly forward at the very bottom front
          const chinBump = Math.exp(-Math.pow((y + 0.115) * 18.0, 2) - Math.pow(x * 16.0, 2)) * 0.014;
          z += chinBump - jawFactor * 0.012;
        }
      }

      // Sculpt facial topography on the front (+Z) hemisphere
      if (z > 0.02) {
        // Eye sockets (眼窝凹陷) at x ≈ ±0.045, y ≈ +0.015
        const leftSocket = Math.exp(-Math.pow((x + 0.044) * 26.0, 2) - Math.pow((y - 0.014) * 28.0, 2));
        const rightSocket = Math.exp(-Math.pow((x - 0.044) * 26.0, 2) - Math.pow((y - 0.014) * 28.0, 2));
        z -= (leftSocket + rightSocket) * 0.014;

        // Brow ridge prominence (眉弓隆起) at y ≈ +0.042
        const browRidge =
          Math.exp(-Math.pow((y - 0.042) * 28.0, 2)) *
          Math.exp(-Math.pow(x * 11.0, 2)) *
          0.011;
        z += browRidge;

        // Cheekbones (颧骨饱满度) at x ≈ ±0.072, y ≈ -0.02
        const cheeks =
          (Math.exp(-Math.pow((x + 0.068) * 18.0, 2)) +
            Math.exp(-Math.pow((x - 0.068) * 18.0, 2))) *
          Math.exp(-Math.pow((y + 0.022) * 20.0, 2)) *
          0.009;
        x += Math.sign(x) * cheeks * 0.6;
        z += cheeks;
      }

      pos.setXYZ(i, x, y + 0.185, z);
    }

    return preparePBRGeometry(geo);
  }

  /**
   * Builds an authentic Tang Dynasty Soft-Winged Futou headwear (唐代乌纱幞头: PoetFutou)
   * with contoured front cap, raised back mountain (巾子), fabric folds, and dual curved wings (幞头脚).
   */
  _buildTangFutou() {
    const futouGroup = new THREE.Group();
    futouGroup.name = 'PoetFutou';

    // 1. Lower headband wrapping snugly around the forehead and occiput (幞头额圈)
    const headbandGeo = new THREE.CylinderGeometry(0.132, 0.129, 0.068, 36, 6, false);
    headbandGeo.scale(0.93, 1.0, 1.02);
    preparePBRGeometry(headbandGeo);
    const headband = new THREE.Mesh(headbandGeo, this.futouMat);
    headband.position.set(0, 0.278, -0.008);
    headband.rotation.x = -0.08;
    futouGroup.add(headband);

    // Subtle gilt-bronze forehead clasp ornament (额前金饰)
    const foreheadBadge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.007, 0.022, 8, 12),
      this.giltGoldMat,
    );
    foreheadBadge.position.set(0, 0.275, 0.124);
    futouGroup.add(foreheadBadge);

    // 2. Sculpted Front Dome of the Futou (前拢折褶)
    const frontDomeGeo = new THREE.SphereGeometry(0.13, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const fdPos = frontDomeGeo.attributes.position;
    for (let i = 0; i < fdPos.count; i += 1) {
      let fx = fdPos.getX(i) * 0.91;
      let fy = fdPos.getY(i) * 0.78;
      let fz = fdPos.getZ(i) * 0.98;
      // Add central vertical fabric pleat crease
      const pleat = Math.cos(fx * 42.0) * 0.004;
      fdPos.setXYZ(i, fx, fy + pleat, fz);
    }
    preparePBRGeometry(frontDomeGeo);
    const frontDome = new THREE.Mesh(frontDomeGeo, this.futouMat);
    frontDome.position.set(0, 0.275, -0.005);
    futouGroup.add(frontDome);

    // 3. Raised Back Topknot Mountain (高耸巾子山峰 — Iconic High-Tang Futou silhouette)
    const jinziGeo = new THREE.CylinderGeometry(0.058, 0.078, 0.165, 28, 12, false);
    const jPos = jinziGeo.attributes.position;
    for (let i = 0; i < jPos.count; i += 1) {
      const jx = jPos.getX(i);
      const jy = jPos.getY(i);
      const jz = jPos.getZ(i);
      const u = (jy + 0.0825) / 0.165;
      // Round the crown dome and add vertical silk pleats
      const domeTaper = u > 0.7 ? Math.cos(((u - 0.7) / 0.3) * Math.PI * 0.45) : 1.0;
      const pleat = 1.0 + Math.cos(Math.atan2(jz, jx) * 6.0) * 0.04;
      jPos.setXYZ(i, jx * domeTaper * pleat, jy, jz * domeTaper * pleat * 0.92 + u * 0.015);
    }
    preparePBRGeometry(jinziGeo);
    const jinziPeak = new THREE.Mesh(jinziGeo, this.futouMat);
    jinziPeak.position.set(0, 0.39, -0.032);
    jinziPeak.rotation.x = 0.12;
    futouGroup.add(jinziPeak);

    // Carved White Jade Hairpin (白玉簪) + Gilt end-caps piercing the Futou topknot
    const jadePin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0075, 0.21, 10, 18),
      this.jadeMat,
    );
    jadePin.rotation.z = Math.PI / 2;
    jadePin.position.set(0, 0.385, -0.032);
    futouGroup.add(jadePin);

    // 4. Dual Graceful Tang Futou Wings / Tails (软脚/展脚幞头双翅)
    this.crownRibbons = [];
    for (const side of [-1, 1]) {
      const wingCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.045, 0.28, -0.115),
        new THREE.Vector3(side * 0.125, 0.275, -0.165),
        new THREE.Vector3(side * 0.205, 0.245, -0.205),
        new THREE.Vector3(side * 0.255, 0.195, -0.235),
      ]);
      const wingGeo = preparePBRGeometry(
        new THREE.TubeGeometry(wingCurve, 20, 0.018, 12, false),
      );
      const wingMesh = new THREE.Mesh(wingGeo, this.futouMat);
      wingMesh.scale.set(1.0, 0.42, 1.0); // Flatten into a graceful silk ribbon wing
      futouGroup.add(wingMesh);
      this.crownRibbons.push(wingMesh);
    }

    this.headGroup.add(futouGroup);
  }

  _buildHeadAndFace() {
    const lipMat = new THREE.MeshPhysicalMaterial({
      color: 0xb9786e,
      roughness: 0.48,
      sheen: 0.35,
      clearcoat: 0.15,
    });

    // 1. Sculpted Neck blending into collar
    const neck = new THREE.Mesh(
      preparePBRGeometry(new THREE.CylinderGeometry(0.062, 0.075, 0.145, 24)),
      this.skinMat,
    );
    neck.position.y = 0.032;
    this.headGroup.add(neck);

    // 2. High-Resolution Anatomical Sculpted Head
    const headMesh = new THREE.Mesh(this._createAnatomicalHeadGeometry(), this.skinMat);
    this.headGroup.add(headMesh);

    // 3. Anatomically Contoured Ears (双耳耳轮与耳垂)
    for (const side of [-1, 1]) {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.125, 0.185, -0.006);
      earGroup.rotation.y = -side * 0.22;

      const earHelix = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.036, 8, 14),
        this.skinMat,
      );
      earHelix.scale.set(0.55, 1.0, 0.85);
      earGroup.add(earHelix);
      this.headGroup.add(earGroup);
    }

    // 4. Sculpted Nose Bridge, Ala & Tip (高挺鼻梁与鼻翼)
    const noseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.222, 0.125),
      new THREE.Vector3(0, 0.188, 0.142),
      new THREE.Vector3(0, 0.158, 0.152),
    ]);
    const noseBridge = new THREE.Mesh(
      preparePBRGeometry(new THREE.TubeGeometry(noseCurve, 14, 0.013, 12, false)),
      this.skinMat,
    );
    noseBridge.scale.set(0.92, 1.0, 0.85);
    this.headGroup.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 16, 14), this.skinMat);
    noseTip.scale.set(1.08, 0.92, 0.95);
    noseTip.position.set(0, 0.156, 0.152);
    this.headGroup.add(noseTip);

    for (const side of [-1, 1]) {
      const nostrilWing = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 10), this.skinMat);
      nostrilWing.position.set(side * 0.013, 0.152, 0.142);
      this.headGroup.add(nostrilWing);
    }

    // 5. Curved Sword Eyebrows (剑眉), Eyelids & Wet-Cornea Eyes
    const scleraMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4f6fa,
      roughness: 0.15,
      clearcoat: 0.9,
    });
    const irisMat = new THREE.MeshPhysicalMaterial({
      color: 0x161210,
      roughness: 0.1,
      clearcoat: 1.0,
    });

    for (const side of [-1, 1]) {
      // Smooth curved eyebrow using TubeGeometry
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.022, 0.224, 0.132),
        new THREE.Vector3(side * 0.048, 0.233, 0.126),
        new THREE.Vector3(side * 0.074, 0.236, 0.108),
      ]);
      const brow = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 12, 0.0052, 8, false),
        this.hairMat,
      );
      this.headGroup.add(brow);

      // Upper eyelid fold
      const lidCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.027, 0.203, 0.128),
        new THREE.Vector3(side * 0.046, 0.21, 0.132),
        new THREE.Vector3(side * 0.065, 0.204, 0.12),
      ]);
      const upperLid = new THREE.Mesh(
        new THREE.TubeGeometry(lidCurve, 10, 0.0036, 8, false),
        this.hairMat,
      );
      this.headGroup.add(upperLid);

      // Sclera eyeball + dark iris + bright moonlight catchlight
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 12), scleraMat);
      sclera.scale.set(1.25, 0.78, 0.65);
      sclera.position.set(side * 0.045, 0.2, 0.124);
      this.headGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 12), irisMat);
      iris.scale.set(1.0, 1.0, 0.55);
      iris.position.set(side * 0.045, 0.2, 0.131);
      this.headGroup.add(iris);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.0028, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      catchlight.position.set(side * 0.042, 0.203, 0.136);
      this.headGroup.add(catchlight);
    }

    // 6. Sculpted Upper & Lower Lips
    const upperLipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.118, 0.126),
      new THREE.Vector3(-0.007, 0.122, 0.132),
      new THREE.Vector3(0.0, 0.12, 0.133),
      new THREE.Vector3(0.007, 0.122, 0.132),
      new THREE.Vector3(0.02, 0.118, 0.126),
    ]);
    const upperLip = new THREE.Mesh(
      new THREE.TubeGeometry(upperLipCurve, 12, 0.0042, 8, false),
      lipMat,
    );
    this.headGroup.add(upperLip);

    const lowerLip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0045, 0.022, 8, 12),
      lipMat,
    );
    lowerLip.rotation.z = Math.PI / 2;
    lowerLip.position.set(0, 0.112, 0.129);
    this.headGroup.add(lowerLip);

    // 7. Five-Strand Tapered Flowing Poet Beard & Mustache (PoetBeard: 飘逸长须)
    this.beardGroup = new THREE.Group();
    this.beardGroup.name = 'PoetBeard';
    this.beardGroup.position.set(0, 0.125, 0.13);

    // Sweeping handlebar mustache strands
    for (const side of [-1, 1]) {
      const mCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.004, 0.007, 0.004),
        new THREE.Vector3(side * 0.024, 0.002, 0.0),
        new THREE.Vector3(side * 0.039, -0.026, -0.008),
        new THREE.Vector3(side * 0.046, -0.082, -0.014),
      ]);
      const mustache = new THREE.Mesh(
        new THREE.TubeGeometry(mCurve, 16, 0.0048, 8, false),
        this.hairMat,
      );
      this.beardGroup.add(mustache);
    }

    // Center & side goatee strands with natural wave
    for (const offset of [-0.012, 0.0, 0.012]) {
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(offset * 0.6, -0.022, -0.002),
        new THREE.Vector3(offset, -0.075, 0.005),
        new THREE.Vector3(offset * 1.15, -0.145, 0.01),
        new THREE.Vector3(offset * 0.85, -0.215 - (offset === 0 ? 0.025 : 0), 0.003),
      ]);
      const strand = new THREE.Mesh(
        new THREE.TubeGeometry(bCurve, 16, offset === 0 ? 0.0075 : 0.005, 8, false),
        this.hairMat,
      );
      this.beardGroup.add(strand);
    }

    this.headGroup.add(this.beardGroup);

    // 8. Hairline, Temple Sideburns (鬓角) & Authentic Tang Futou (乌纱幞头)
    const hairBack = new THREE.Mesh(
      new THREE.SphereGeometry(0.144, 28, 22, 0, Math.PI * 2, 0, 1.85),
      this.hairMat,
    );
    hairBack.scale.set(0.91, 1.13, 0.99);
    hairBack.position.set(0, 0.198, -0.012);
    this.headGroup.add(hairBack);

    for (const side of [-1, 1]) {
      const sideburnCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.118, 0.245, 0.042),
        new THREE.Vector3(side * 0.12, 0.185, 0.046),
        new THREE.Vector3(side * 0.112, 0.125, 0.038),
      ]);
      const sideburn = new THREE.Mesh(
        new THREE.TubeGeometry(sideburnCurve, 10, 0.009, 8, false),
        this.hairMat,
      );
      this.headGroup.add(sideburn);
    }

    this._buildTangFutou();
  }

  update(state) {
    if (!state) return;
    const t = state.t ?? 0;
    const pitch = state.headPitch ?? 0;
    const headYaw = state.headYaw ?? 0;
    const walk = state.walkIntensity ?? 0;
    const action = state.poetAction ?? 'initial';

    // 1. Update full-body world position and Y-rotation (turning to bed, frost floor, moon window, and walking back)
    if (Array.isArray(state.poetPosition) && state.poetPosition.length === 3) {
      const bobY = walk * Math.abs(Math.sin(t * 6.5)) * 0.018;
      this.group.position.set(
        state.poetPosition[0],
        state.poetPosition[1] + bobY,
        state.poetPosition[2],
      );
    }
    if (typeof state.poetRotationY === 'number') {
      this.group.rotation.y = state.poetRotationY;
    }

    // 2. Head pitch (up/down) & yaw (left/right gaze)
    // Local +Z is forward on the character; negative rotation.x tilts head UP, positive bows head DOWN
    this.headGroup.rotation.x = -pitch;
    this.headGroup.rotation.y = headYaw;
    this.torsoGroup.rotation.x = -pitch * 0.28;

    // 3. Walking stride on articulated legs & boots during movement transitions
    if (this.leftLegGroup && this.rightLegGroup) {
      const stride = Math.sin(t * 6.5) * 0.28 * walk;
      this.leftLegGroup.rotation.x = stride;
      this.rightLegGroup.rotation.x = -stride;
    }

    // 4. Beard counter-rotates slightly so it hangs naturally under gravity when looking up/down
    if (this.beardGroup) {
      this.beardGroup.rotation.x = pitch * 0.45 + Math.sin(t * 1.9) * 0.025;
    }

    // 5. Breathing & expressive arm gestures matched to each chapter action
    const breath = Math.sin(t * 1.6) * 0.01;
    this.torsoGroup.position.y = 0.88 + breath;

    if (this.leftArmGroup && this.rightArmGroup) {
      const sway = Math.sin(t * 1.25) * 0.03;
      this.leftArmGroup.rotation.z = sway;
      this.leftArmGroup.rotation.x = -walk * Math.sin(t * 6.5) * 0.12;

      let targetArmPitch = 0.0;
      if (action === 'look_at_bed') {
        targetArmPitch = 0.08;
      } else if (action === 'look_at_frost') {
        targetArmPitch = 0.14;
      } else if (action === 'look_at_moon') {
        targetArmPitch = Math.max(0, pitch) * 0.42;
      } else if (action === 'bow_head_homesick') {
        targetArmPitch = -0.06;
      }

      this.rightArmGroup.rotation.x = targetArmPitch + walk * Math.sin(t * 6.5) * 0.12;
      this.rightArmGroup.rotation.z = -sway;
    }

    // 6. Secondary cloth & ribbon physics
    if (this.sashRibbon) {
      this.sashRibbon.rotation.x = 0.06 + Math.sin(t * 2.1) * 0.05 + walk * 0.12;
      this.sashRibbon.rotation.z = Math.cos(t * 1.7) * 0.04;
    }

    for (let i = 0; i < this.crownRibbons.length; i += 1) {
      const r = this.crownRibbons[i];
      r.rotation.z = Math.sin(t * 2.4 + i) * 0.035;
    }
  }
}
