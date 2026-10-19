import * as THREE from 'three';

export class TangCourtyard {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'TangCourtyardRoot';

    this.moonHaloMat = null;
    this.moonBeamShaderMat = null;
    this.windowFloorMat = null;
    this.candleLight = null;
    this.candleFlame = null;
    this.pineGroup = null;
    this.windowSpotLight = null;

    this._buildLighting();
    this._buildGroundAndChamber();
    this._buildHouseWallsAndWindow();
    this._buildHouseRoof();
    this._buildTangBedAndInteriorFurniture();
    this._buildCourtyardProps();
    this._buildMountainsAndMoon();
    this._buildVolumetricMoonbeams();
  }

  _buildLighting() {
    const ambient = new THREE.HemisphereLight(0x3a5f9c, 0x0a0e1a, 0.56);
    this.group.add(ambient);

    // Primary directional moonlight from the Full Moon at (0, 8.8, -18)
    this.moonLight = new THREE.DirectionalLight(0xd4e6ff, 1.45);
    this.moonLight.position.set(0.0, 8.8, -18.0);
    this.group.add(this.moonLight);

    // Focused moonlight SpotLight shining specifically through the house window into the room with soft shadows
    this.windowSpotLight = new THREE.SpotLight(0xd8ebff, 3.4, 16.0, Math.PI * 0.22, 0.62, 1.2);
    this.windowSpotLight.position.set(0.15, 3.8, -3.5);
    this.windowSpotLight.target.position.set(0.25, 0.18, 1.35);
    this.windowSpotLight.castShadow = true;
    this.windowSpotLight.shadow.mapSize.width = 1024;
    this.windowSpotLight.shadow.mapSize.height = 1024;
    this.windowSpotLight.shadow.camera.near = 1.5;
    this.windowSpotLight.shadow.camera.far = 12.0;
    this.windowSpotLight.shadow.bias = -0.0006;
    this.windowSpotLight.shadow.normalBias = 0.02;
    this.windowSpotLight.shadow.radius = 4;
    this.group.add(this.windowSpotLight);
    this.group.add(this.windowSpotLight.target);

    // Dedicated Cold Rim Light (角色后上方冷色轮廓光) to trace the silhouette of Li Bai's Futou & silk shoulders
    this.rimLight = new THREE.SpotLight(0x9ec8ff, 2.35, 8.0, Math.PI * 0.32, 0.7, 1.2);
    this.rimLight.name = 'PoetRimLight';
    this.rimLight.position.set(-0.22, 2.62, -0.25);
    this.rimLight.target.position.set(-0.25, 1.15, 0.75);
    this.group.add(this.rimLight);
    this.group.add(this.rimLight.target);

    // Subtle cool fill light in outdoor courtyard
    const courtyardFill = new THREE.PointLight(0x6e9eff, 0.55, 14.0);
    courtyardFill.position.set(-1.2, 3.2, -2.5);
    this.group.add(courtyardFill);

    // Warm indoor candle light on the low table beside the bed + subtle warm front bounce on the poet
    this.candleLight = new THREE.PointLight(0xffa844, 1.35, 6.8, 1.5);
    this.candleLight.position.set(1.55, 1.15, 0.72);
    this.group.add(this.candleLight);

    const warmIndoorBounce = new THREE.PointLight(0xffb266, 0.38, 4.5, 1.6);
    warmIndoorBounce.position.set(0.45, 1.25, 1.65);
    this.group.add(warmIndoorBounce);
  }

  _buildGroundAndChamber() {
    // Outdoor courtyard stone floor
    const courtyardGeo = new THREE.PlaneGeometry(42, 42, 32, 32);
    const courtyardMat = new THREE.MeshStandardMaterial({
      color: 0x0f1829,
      roughness: 0.78,
      metalness: 0.14,
    });
    const courtyardFloor = new THREE.Mesh(courtyardGeo, courtyardMat);
    courtyardFloor.rotation.x = -Math.PI / 2;
    courtyardFloor.position.y = 0.0;
    courtyardFloor.receiveShadow = true;
    courtyardFloor.name = 'CourtyardFloor';
    this.group.add(courtyardFloor);

    // Stone courtyard pathway slabs
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1d2a40,
      roughness: 0.68,
      metalness: 0.16,
    });
    for (let i = 0; i < 5; i += 1) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.85), slabMat);
      slab.position.set(-0.2 + (i % 2) * 0.12, 0.02, -1.2 - i * 1.15);
      slab.receiveShadow = true;
      this.group.add(slab);
    }

    // Raised wooden chamber platform (臺基 + 室内木地板)
    // Spans x in [-2.6, 3.0] (width 5.6), z in [-0.4, 3.9] (depth 4.3)
    const foundationMat = new THREE.MeshStandardMaterial({
      color: 0x263144,
      roughness: 0.75,
    });
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.16, 4.7), foundationMat);
    foundation.position.set(0.2, 0.08, 1.75);
    foundation.receiveShadow = true;
    this.group.add(foundation);

    const woodFloorMat = new THREE.MeshPhysicalMaterial({
      color: 0x281a13,
      roughness: 0.46,
      metalness: 0.08,
      clearcoat: 0.22,
      clearcoatRoughness: 0.42,
    });
    const chamberFloor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 4.3), woodFloorMat);
    chamberFloor.position.set(0.2, 0.17, 1.75);
    chamberFloor.receiveShadow = true;
    chamberFloor.name = 'ChamberFloor';
    this.group.add(chamberFloor);

    // Indoor floor wooden plank seams for depth
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x160e0a });
    for (let i = -4; i <= 5; i += 1) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 4.25), seamMat);
      seam.position.set(i * 0.52, 0.202, 1.75);
      this.group.add(seam);
    }

    // Stone steps leading from chamber veranda to courtyard
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.55), foundationMat);
    stepMesh.position.set(-0.4, 0.06, -0.72);
    stepMesh.receiveShadow = true;
    this.group.add(stepMesh);
  }

  _buildHouseWallsAndWindow() {
    const wallsGroup = new THREE.Group();
    wallsGroup.name = 'HouseWalls';

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x4a1f18,
      roughness: 0.48,
      metalness: 0.06,
    });
    const plasterWallMat = new THREE.MeshStandardMaterial({
      color: 0x23242c,
      roughness: 0.82,
    });
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0x361d16,
      roughness: 0.62,
    });
    const latticeWoodMat = new THREE.MeshStandardMaterial({
      color: 0x572b1e,
      roughness: 0.46,
    });
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0x8ea6c8,
      transparent: true,
      opacity: 0.32,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    // 6 Structural Tang Columns (朱漆木柱) with stone bases (柱础)
    const baseStoneMat = new THREE.MeshStandardMaterial({ color: 0x3a4659, roughness: 0.7 });
    const columnCoords = [
      [-2.5, -0.35],
      [0.2, -0.35],
      [2.9, -0.35],
      [-2.5, 3.85],
      [0.2, 3.85],
      [2.9, 3.85],
    ];
    // Wait: keep x=0.2, z=-0.35 open for the grand window! Put front columns at x=-2.5, x=-1.15, x=1.75, x=2.9
    const actualColumns = [
      [-2.5, -0.35],
      [-1.15, -0.35],
      [1.75, -0.35],
      [2.9, -0.35],
      [-2.5, 3.85],
      [2.9, 3.85],
    ];

    for (const [cx, cz] of actualColumns) {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 16), baseStoneMat);
      plinth.position.set(cx, 0.24, cz);
      wallsGroup.add(plinth);

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.125, 3.25, 18), pillarMat);
      col.position.set(cx, 1.88, cz);
      wallsGroup.add(col);
    }

    // ================= NORTH WALL (z = -0.35) WITH GRAND OPEN WINDOW =================
    // Window opening spans x in [-1.05, 1.65], y in [0.88, 2.68]
    // 1) Left solid wall bay (x in [-2.5, -1.15])
    const northLeftWall = new THREE.Mesh(new THREE.BoxGeometry(1.35, 3.2, 0.14), plasterWallMat);
    northLeftWall.position.set(-1.825, 1.8, -0.35);
    wallsGroup.add(northLeftWall);

    const northLeftWainscot = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 0.16), wainscotMat);
    northLeftWainscot.position.set(-1.825, 0.62, -0.35);
    wallsGroup.add(northLeftWainscot);

    // 2) Right solid wall bay (x in [1.75, 2.9])
    const northRightWall = new THREE.Mesh(new THREE.BoxGeometry(1.15, 3.2, 0.14), plasterWallMat);
    northRightWall.position.set(2.325, 1.8, -0.35);
    wallsGroup.add(northRightWall);

    const northRightWainscot = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.16), wainscotMat);
    northRightWainscot.position.set(2.325, 0.62, -0.35);
    wallsGroup.add(northRightWainscot);

    // 3) Under-window wainscot apron (x in [-1.15, 1.75], y in [0.2, 0.88])
    const windowApron = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.68, 0.16), wainscotMat);
    windowApron.position.set(0.3, 0.54, -0.35);
    wallsGroup.add(windowApron);

    // Decorative carved panels on the under-window apron
    for (let k = 0; k < 3; k += 1) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.18), latticeWoodMat);
      panel.position.set(-0.6 + k * 0.9, 0.54, -0.35);
      wallsGroup.add(panel);
    }

    // 4) Over-window transom wall (x in [-1.15, 1.75], y in [2.68, 3.42])
    const windowHeaderWall = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.74, 0.14), plasterWallMat);
    windowHeaderWall.position.set(0.3, 3.05, -0.35);
    wallsGroup.add(windowHeaderWall);

    // 5) Window Frame & Open Carved Shutters (WindowLattice)
    const windowGroup = new THREE.Group();
    windowGroup.name = 'WindowLattice';
    windowGroup.position.set(0.3, 0.88, -0.35);

    // Sill & Lintel
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.08, 0.24), latticeWoodMat);
    sill.position.set(0, 0.0, 0);
    windowGroup.add(sill);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.09, 0.22), latticeWoodMat);
    lintel.position.set(0, 1.8, 0);
    windowGroup.add(lintel);

    // Upper fixed lattice transom (横披窗) at y in [1.58, 1.78]
    const transomBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.045, 0.12), latticeWoodMat);
    transomBar.position.set(0, 1.58, 0);
    windowGroup.add(transomBar);

    for (let i = -6; i <= 6; i += 1) {
      const vStick = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.20, 0.03), latticeWoodMat);
      vStick.position.set(i * 0.21, 1.69, 0);
      windowGroup.add(vStick);
    }

    // Rolled bamboo blind (卷起的竹帘) under the transom
    const bambooRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 2.68, 14),
      new THREE.MeshStandardMaterial({ color: 0x8c734b, roughness: 0.7 }),
    );
    bambooRoll.rotation.z = Math.PI / 2;
    bambooRoll.position.set(0, 1.54, 0.05);
    windowGroup.add(bambooRoll);

    // Helper to build a carved Tang lattice shutter leaf (窗扇)
    const createShutterLeaf = (width, height) => {
      const leaf = new THREE.Group();
      const borderTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.04), latticeWoodMat);
      borderTop.position.set(0, height / 2, 0);
      const borderBot = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.04), latticeWoodMat);
      borderBot.position.set(0, -height / 2, 0);
      const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.04, height, 0.04), latticeWoodMat);
      borderL.position.set(-width / 2, 0, 0);
      const borderR = new THREE.Mesh(new THREE.BoxGeometry(0.04, height, 0.04), latticeWoodMat);
      borderR.position.set(width / 2, 0, 0);
      leaf.add(borderTop, borderBot, borderL, borderR);

      // Vertical直棂 bars
      for (let m = -2; m <= 2; m += 1) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.018, height - 0.06, 0.025), latticeWoodMat);
        bar.position.set(m * (width / 6), 0, 0);
        leaf.add(bar);
      }
      // Horizontal crossbars
      for (let n = -1; n <= 1; n += 1) {
        const cbar = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.018, 0.025), latticeWoodMat);
        cbar.position.set(0, n * (height / 3.2), 0);
        leaf.add(cbar);
      }
      // Translucent rice paper pane (窗纸)
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.06, height - 0.06), paperMat);
      leaf.add(paper);
      return leaf;
    };

    // Left shutter leaf swung open outward into the courtyard
    const leftShutterPivot = new THREE.Group();
    leftShutterPivot.position.set(-1.35, 0.71, 0);
    const leftLeaf = createShutterLeaf(0.68, 1.38);
    leftLeaf.position.x = 0.34;
    leftShutterPivot.add(leftLeaf);
    leftShutterPivot.rotation.y = -Math.PI * 0.62; // Swung wide open outward
    windowGroup.add(leftShutterPivot);

    // Right shutter leaf half-open at an artistic angle catching the moonlight
    const rightShutterPivot = new THREE.Group();
    rightShutterPivot.position.set(1.35, 0.71, 0);
    const rightLeaf = createShutterLeaf(0.68, 1.38);
    rightLeaf.position.x = -0.34;
    rightShutterPivot.add(rightLeaf);
    rightShutterPivot.rotation.y = Math.PI * 0.58; // Swung open outward
    windowGroup.add(rightShutterPivot);

    // One inner decorative side lattice panel on the far right of the window opening
    const innerRightLattice = createShutterLeaf(0.56, 1.38);
    innerRightLattice.position.set(1.06, 0.71, 0);
    windowGroup.add(innerRightLattice);

    wallsGroup.add(windowGroup);

    // ================= EAST WALL (x = 2.9, z in [-0.35, 3.85]) =================
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 4.2), plasterWallMat);
    eastWall.position.set(2.9, 1.8, 1.75);
    wallsGroup.add(eastWall);

    const eastWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 4.2), wainscotMat);
    eastWainscot.position.set(2.89, 0.62, 1.75);
    wallsGroup.add(eastWainscot);

    // Traditional Tang calligraphy & landscape hanging scroll on East Wall
    const scrollMount = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 1.55),
      new THREE.MeshStandardMaterial({ color: 0xcabfa8, roughness: 0.8 }),
    );
    scrollMount.rotation.y = -Math.PI / 2;
    scrollMount.position.set(2.81, 1.95, 1.45);
    wallsGroup.add(scrollMount);

    // ================= WEST WALL (x = -2.5) WITH OPEN ARCHWAY FOR CAMERA =================
    // Front section of West Wall (z in [-0.35, 0.85])
    const westWallFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 1.2), plasterWallMat);
    westWallFront.position.set(-2.5, 1.8, 0.25);
    wallsGroup.add(westWallFront);

    // Upper header over West Veranda opening (z in [0.85, 3.85], y in [2.75, 3.4])
    const westWallHeader = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 3.0), plasterWallMat);
    westWallHeader.position.set(-2.5, 3.08, 2.35);
    wallsGroup.add(westWallHeader);

    // ================= SOUTH BACKDROP SCREEN & HALF-WALL (z = 3.85) =================
    // East portion of South Wall behind the bed (x in [0.1, 2.9])
    const southEastWall = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, 0.14), plasterWallMat);
    southEastWall.position.set(1.5, 1.8, 3.85);
    wallsGroup.add(southEastWall);

    // Upper lintel across the entire South side
    const southTopBeam = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.45, 0.18), pillarMat);
    southTopBeam.position.set(0.2, 3.28, 3.85);
    wallsGroup.add(southTopBeam);

    this.group.add(wallsGroup);
  }

  _buildHouseRoof() {
    const roofGroup = new THREE.Group();
    roofGroup.name = 'HouseRoof';
    roofGroup.position.set(0.2, 3.42, 1.75);

    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x3f1b14,
      roughness: 0.55,
    });
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x151e2e,
      roughness: 0.62,
      metalness: 0.22,
    });
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x26344d,
      roughness: 0.5,
      metalness: 0.28,
    });

    // Perimeter Tie Beams & Dougong Eave Brackets (额枋与斗拱挑檐)
    const northBeam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 0.32), timberMat);
    northBeam.position.set(0, 0.05, -2.1);
    roofGroup.add(northBeam);

    const southBeam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 0.32), timberMat);
    southBeam.position.set(0, 0.05, 2.1);
    roofGroup.add(southBeam);

    const eastBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 4.5), timberMat);
    eastBeam.position.set(2.7, 0.05, 0);
    roofGroup.add(eastBeam);

    const westBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 4.5), timberMat);
    westBeam.position.set(-2.7, 0.05, 0);
    roofGroup.add(westBeam);

    // Dougong bracket blocks along North (courtyard-facing) eave
    for (let i = -3; i <= 3; i += 1) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.58), timberMat);
      bracket.position.set(i * 0.85, 0.2, -2.18);
      roofGroup.add(bracket);
    }

    // Exposed indoor ceiling rafters & purlins (室内梁架藻井)
    for (let r = -2; r <= 2; r += 1) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 4.3), timberMat);
      rafter.position.set(r * 1.25, 0.22, 0);
      roofGroup.add(rafter);
    }

    // North Sloped Roof Plane (faces courtyard & moon, z < 0)
    const northSlope = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 3.3), tileMat);
    northSlope.position.set(0, 0.92, -1.35);
    northSlope.rotation.x = 0.46; // Pitched slope down toward courtyard (-Z)
    roofGroup.add(northSlope);

    // South Sloped Roof Plane (z > 0)
    const southSlope = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 3.3), tileMat);
    southSlope.position.set(0, 0.92, 1.35);
    southSlope.rotation.x = -0.46;
    roofGroup.add(southSlope);

    // Flared Flying Eave Skirts (唐代飞檐翘角) on North & South
    const northEave = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.09, 0.75), tileMat);
    northEave.position.set(0, 0.24, -2.95);
    northEave.rotation.x = 0.18; // Upturned eave curve
    roofGroup.add(northEave);

    const southEave = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.09, 0.75), tileMat);
    southEave.position.set(0, 0.24, 2.95);
    southEave.rotation.x = -0.18;
    roofGroup.add(southEave);

    // Cylindrical clay tile ribs (筒瓦垄) along the North roof slope for authentic Tang roof texture
    for (let tIdx = -16; tIdx <= 16; tIdx += 1) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 3.25, 8),
        ridgeMat,
      );
      rib.position.set(tIdx * 0.21, 0.98, -1.35);
      rib.rotation.x = Math.PI / 2 + 0.46;
      roofGroup.add(rib);
    }

    // East & West Gable Triangles (山墙博风板)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-2.7, 0.15);
    gableShape.lineTo(0, 1.62);
    gableShape.lineTo(2.7, 0.15);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.14, bevelEnabled: false });

    const eastGable = new THREE.Mesh(gableGeo, timberMat);
    eastGable.rotation.y = Math.PI / 2;
    eastGable.position.set(2.7, 0, 0);
    roofGroup.add(eastGable);

    const westGable = new THREE.Mesh(gableGeo, timberMat);
    westGable.rotation.y = Math.PI / 2;
    westGable.position.set(-2.84, 0, 0);
    roofGroup.add(westGable);

    // Main Top Ridge Beam (正脊) & Chiwen Owl-Tail Ornaments (唐代鸱吻)
    const mainRidge = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.24, 0.26), ridgeMat);
    mainRidge.position.set(0, 1.65, 0);
    roofGroup.add(mainRidge);

    for (const side of [-1, 1]) {
      const chiwen = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 8), ridgeMat);
      chiwen.position.set(side * 3.58, 1.88, 0);
      chiwen.rotation.z = -side * 0.28;
      roofGroup.add(chiwen);
    }

    this.group.add(roofGroup);
  }

  _buildTangBedAndInteriorFurniture() {
    const bedGroup = new THREE.Group();
    bedGroup.name = 'TangBed';
    // Placed in the eastern half of the room so the area directly in front of it ("床前") receives the window moonlight
    bedGroup.position.set(1.35, 0.2, 1.55);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4e2618,
      roughness: 0.45,
      metalness: 0.1,
    });
    const matMat = new THREE.MeshStandardMaterial({
      color: 0xd8cfb8,
      roughness: 0.72,
    });
    const quiltMat = new THREE.MeshStandardMaterial({
      color: 0x2c476e,
      roughness: 0.55,
    });

    // Tang Box-Frame Platform Bed (唐代箱式榻/架子床底座) with carved legs & Valance
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.38, 1.35), woodMat);
    bedBase.position.y = 0.19;
    bedGroup.add(bedBase);

    // Woven straw/silk sleeping mat
    const matMesh = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 1.25), matMat);
    matMesh.position.y = 0.4;
    bedGroup.add(matMesh);

    // Folded brocade quilt on the bed
    const quilt = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 1.18), quiltMat);
    quilt.position.set(0.28, 0.46, 0);
    bedGroup.add(quilt);

    // Curved ceramic headrest pillow (唐三彩/青瓷如意枕)
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.54), quiltMat);
    pillow.position.set(-0.62, 0.48, 0.0);
    bedGroup.add(pillow);

    // Three-sided carved bed railings (围子)
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.42, 0.06), woodMat);
    backRail.position.set(0, 0.58, 0.65);
    bedGroup.add(backRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 1.35), woodMat);
    rightRail.position.set(0.95, 0.58, 0);
    bedGroup.add(rightRail);

    // Low footstep stool in front of the bed (脚踏)
    const footStool = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.34), woodMat);
    footStool.position.set(-0.15, 0.06, -0.82);
    bedGroup.add(footStool);

    // Low side table (案几) with warm candle & Tang wine pot
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 0.48), woodMat);
    table.position.set(0.2, 0.26, -0.85);
    bedGroup.add(table);

    const candleStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.06, 0.24, 14),
      new THREE.MeshStandardMaterial({ color: 0xd4a44c, metalness: 0.65, roughness: 0.28 }),
    );
    candleStick.position.set(0.2, 0.64, -0.83);
    bedGroup.add(candleStick);

    const flameGeo = new THREE.SphereGeometry(0.036, 10, 10);
    flameGeo.scale(0.75, 1.9, 0.75);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd275 });
    this.candleFlame = new THREE.Mesh(flameGeo, flameMat);
    this.candleFlame.position.set(0.2, 0.79, -0.83);
    bedGroup.add(this.candleFlame);

    // Indoor folding screen (四折山水屏风) behind the bed area
    const screenGroup = new THREE.Group();
    screenGroup.position.set(-0.3, 0, 1.65);
    const screenPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1d293b,
      roughness: 0.7,
    });
    for (let s = 0; s < 4; s += 1) {
      const panel = new THREE.Group();
      panel.position.set(s * 0.56, 0.98, (s % 2) * 0.12);
      panel.rotation.y = s % 2 === 0 ? 0.18 : -0.18;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.96, 0.04), woodMat);
      const canvas = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.82, 0.05), screenPanelMat);
      panel.add(frame, canvas);
      screenGroup.add(panel);
    }
    bedGroup.add(screenGroup);

    this.group.add(bedGroup);
  }

  _buildCourtyardProps() {
    // Courtyard water basin ("低头思故乡" reflection point at (-1.15, 0.32, -0.75))
    const basinGroup = new THREE.Group();
    basinGroup.name = 'WaterBasin';
    basinGroup.position.set(-1.15, 0.0, -0.85);

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
    this.pineGroup.position.set(-3.6, 0.0, -3.4);

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

    // Radiant Full Moon at (0, 8.8, -18.0) aligned with the open window
    const moonGroup = new THREE.Group();
    moonGroup.name = 'FullMoon';
    moonGroup.position.set(0.0, 8.8, -18.0);

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
    // 1. Tyndall Volumetric Light Shafts (丁达尔体积光束: ConeGeometry + Fresnel & Depth-Decay Custom Shader)
    //    Streaming strictly FROM the North Wall window opening (z = -0.35, y in [0.9, 2.3])
    //    down onto the indoor floor in front of the bed (z in [0.1, 2.75], y = 0.20)
    const beamGroup = new THREE.Group();
    beamGroup.name = 'MoonlightBeam';

    this.moonBeamShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uIntensity: { value: 0.85 },
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xc8e0ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormalView = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        uniform float uIntensity;
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          // Fresnel edge attenuation: smooths out polygon silhouettes at grazing angles
          float ndotv = abs(dot(normalize(vNormalView), normalize(vViewDir)));
          float fresnelFade = pow(ndotv, 0.65);

          // Depth / longitudinal attenuation from window entry (vUv.y=1) to floor dissipation (vUv.y=0)
          float longitudinal = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.14, 1.0 - vUv.y);
          float edgeFade = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);

          // Subtle window-lattice Tyndall ray streaks with gentle atmospheric drift
          float rays = 0.8 + 0.2 * cos(vUv.x * 26.0 + sin(uTime * 0.45 + vUv.y * 4.0) * 0.6);
          float alpha = longitudinal * edgeFade * fresnelFade * rays * 0.125 * uIntensity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    // Primary Tyndall ConeGeometry volume passing through the open window into the chamber
    const tyndallConeGeo = new THREE.ConeGeometry(1.38, 3.25, 36, 1, true);
    const tyndallCone = new THREE.Mesh(tyndallConeGeo, this.moonBeamShaderMat);
    tyndallCone.position.set(0.12, 1.08, 0.88);
    tyndallCone.rotation.x = -Math.PI / 2 + 0.52;
    tyndallCone.scale.set(1.18, 1.0, 0.58);
    beamGroup.add(tyndallCone);

    // Layered angled volumetric planes from top of window opening to bottom sill
    const slices = 5;
    for (let i = 0; i < slices; i += 1) {
      const frac = i / (slices - 1);
      const winY = 1.15 + frac * 1.12;
      const floorZ = 1.55 + frac * 1.15;
      const dz = floorZ - (-0.35);
      const dy = winY - 0.2;
      const length = Math.hypot(dz, dy);
      const angle = Math.atan2(dy, dz);

      const sheetGeo = new THREE.PlaneGeometry(2.15, length);
      const sheet = new THREE.Mesh(sheetGeo, this.moonBeamShaderMat);
      sheet.position.set(0.12, (winY + 0.2) * 0.5, (-0.35 + floorZ) * 0.5);
      sheet.rotation.x = -Math.PI / 2 + angle;
      beamGroup.add(sheet);
    }

    this.group.add(beamGroup);

    // 2. Projected Window-Lattice Moonlight Patch on the indoor wooden floor ("床前明月光")
    this.windowFloorMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uIntensity: { value: 0.9 },
        uColor: { value: new THREE.Color(0xd4e8ff) },
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
        uniform float uIntensity;
        uniform vec3 uColor;
        void main() {
          float borderX = smoothstep(0.02, 0.16, vUv.x) * smoothstep(0.98, 0.84, vUv.x);
          float borderY = smoothstep(0.02, 0.18, vUv.y) * smoothstep(0.98, 0.80, vUv.y);
          float windowFrame = borderX * borderY;

          // Lattice shadow grid on the right & top edge of the projected window light
          float vBars = smoothstep(0.15, 0.45, abs(sin(vUv.x * 3.14159 * 7.0)));
          float hBars = smoothstep(0.12, 0.4, abs(sin(vUv.y * 3.14159 * 4.0)));
          float latticeShadow = mix(1.0, vBars * hBars, smoothstep(0.62, 0.85, vUv.x) * 0.65);

          float glow = windowFrame * latticeShadow * 0.28 * uIntensity;
          gl_FragColor = vec4(uColor, glow);
        }
      `,
    });

    const floorPatch = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 2.55), this.windowFloorMat);
    floorPatch.name = 'WindowFloorLight';
    floorPatch.rotation.x = -Math.PI / 2;
    floorPatch.position.set(0.12, 0.205, 1.38);
    this.group.add(floorPatch);
  }

  update(state) {
    if (!state) return;
    const t = state.t ?? 0;

    if (this.moonHaloMat) {
      this.moonHaloMat.uniforms.uHaloIntensity.value = state.moonHalo ?? 0.7;
    }

    const beamInt = state.moonbeamIntensity ?? 0.85;
    if (this.moonBeamShaderMat) {
      this.moonBeamShaderMat.uniforms.uIntensity.value = 0.55 + 0.55 * beamInt;
      this.moonBeamShaderMat.uniforms.uTime.value = t;
    }
    if (this.windowFloorMat) {
      this.windowFloorMat.uniforms.uIntensity.value = 0.55 + 0.5 * beamInt;
    }

    // Keep the cold rim light focused on the poet's shoulders & Futou as he turns and moves
    if (this.rimLight && Array.isArray(state.poetPosition)) {
      this.rimLight.target.position.set(
        state.poetPosition[0],
        state.poetPosition[1] + 1.25,
        state.poetPosition[2],
      );
    }

    if (this.candleLight && this.candleFlame) {
      const flicker = state.candleFlicker ?? 1.0;
      this.candleLight.intensity = 1.25 * flicker;
      this.candleFlame.scale.set(0.75, 1.65 + 0.35 * flicker, 0.75);
    }

    if (this.pineGroup) {
      this.pineGroup.rotation.z = Math.sin(t * 0.8) * 0.012;
    }
  }
}
