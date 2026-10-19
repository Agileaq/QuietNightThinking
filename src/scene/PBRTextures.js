import * as THREE from 'three';

let cachedSilkMaps = null;
let cachedLeatherMaps = null;

/**
 * Procedural Next-Gen Bake Pipeline:
 * Generates tangent-space Normal Maps, Ambient Occlusion (AO) Maps, Roughness Maps,
 * and sRGB Damask Silk Albedo Maps so PBR MeshPhysicalMaterial has rich micro-surface
 * relief, fold shadows, and fabric sheen without external multi-megabyte downloads.
 */
export function getBakedSilkMaps() {
  if (cachedSilkMaps) {
    return cachedSilkMaps;
  }

  const width = 128;
  const height = 128;
  const size = width * height;

  const colorData = new Uint8Array(size * 4);
  const normalData = new Uint8Array(size * 4);
  const aoData = new Uint8Array(size * 4);
  const roughnessData = new Uint8Array(size * 4);

  // Heightfield function combining vertical drapery pleats, secondary diagonal creases, and fine silk weave
  const sampleHeight = (u, v) => {
    const twoPi = Math.PI * 2;
    const primaryPleat = Math.sin(u * twoPi * 8.0 + Math.sin(v * twoPi * 2.0) * 0.35) * 0.52;
    const secondaryFold = Math.cos(u * twoPi * 16.0 - v * twoPi * 3.0) * 0.24;
    const microCrease = Math.sin(u * twoPi * 24.0 + v * twoPi * 6.0) * 0.1;
    const silkWeave =
      (Math.sin(u * twoPi * 64.0) * Math.cos(v * twoPi * 64.0)) * 0.05;
    // Subtle Tang cloud-brocade medallion motif (暗花云纹)
    const cx = ((u * 4.0) % 1.0) - 0.5;
    const cy = ((v * 4.0) % 1.0) - 0.5;
    const r = Math.hypot(cx, cy);
    const brocade = Math.exp(-r * r * 18.0) * Math.cos(r * 28.0) * 0.08;

    return primaryPleat + secondaryFold + microCrease + silkWeave + brocade;
  };

  const du = 1.0 / width;
  const dv = 1.0 / height;
  const strength = 2.6;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      const hCenter = sampleHeight(u, v);
      const hRight = sampleHeight((u + du) % 1.0, v);
      const hUp = sampleHeight(u, (v + dv) % 1.0);

      const dHdU = (hRight - hCenter) * strength;
      const dHdV = (hUp - hCenter) * strength;

      // Tangent-space normal (-dHdU, -dHdV, 1.0) normalized
      let nx = -dHdU;
      let ny = -dHdV;
      let nz = 1.0;
      const invLen = 1.0 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      normalData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      // Ambient Occlusion (AO): crevices of folds (hCenter < 0) receive deep soft shadow
      const aoVal = Math.max(0.38, Math.min(1.0, 0.78 + hCenter * 0.34));
      const aoByte = Math.round(aoVal * 255);
      aoData[idx] = aoByte;
      aoData[idx + 1] = aoByte;
      aoData[idx + 2] = aoByte;
      aoData[idx + 3] = 255;

      // Roughness map: raised silk ridges catch slightly more sheen (lower roughness)
      const roughVal = Math.max(0.28, Math.min(0.85, 0.54 - hCenter * 0.16));
      const roughByte = Math.round(roughVal * 255);
      roughnessData[idx] = roughByte;
      roughnessData[idx + 1] = roughByte;
      roughnessData[idx + 2] = roughByte;
      roughnessData[idx + 3] = 255;

      // Albedo color map: subtle moon-white / silver-blue silk damask variation
      const shade = 0.92 + 0.08 * hCenter;
      colorData[idx] = Math.min(255, Math.round(234 * shade));
      colorData[idx + 1] = Math.min(255, Math.round(242 * shade));
      colorData[idx + 2] = Math.min(255, Math.round(253 * shade));
      colorData[idx + 3] = 255;
    }
  }

  const configureMap = (data, isSRGB = false, repeatX = 2, repeatY = 2) => {
    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  cachedSilkMaps = {
    colorMap: configureMap(colorData, true, 3, 2),
    normalMap: configureMap(normalData, false, 3, 2),
    aoMap: configureMap(aoData, false, 1, 1),
    roughnessMap: configureMap(roughnessData, false, 3, 2),
  };

  return cachedSilkMaps;
}

/**
 * Generates Normal + Roughness + AO maps for Tang Xiedie leather belt (躞蹀带),
 * carved jade/gold belt plaques (銙片), and dark gauze Futou headwear (幞头).
 */
export function getBakedLeatherAndCarvingMaps() {
  if (cachedLeatherMaps) {
    return cachedLeatherMaps;
  }

  const width = 64;
  const height = 64;
  const size = width * height;

  const normalData = new Uint8Array(size * 4);
  const roughnessData = new Uint8Array(size * 4);

  const sampleCarving = (u, v) => {
    const twoPi = Math.PI * 2;
    // Border stitching groove + Tang floral scroll relief (唐草卷云纹)
    const borderY = Math.min(v, 1.0 - v);
    const stitchGroove = borderY < 0.14 ? -0.35 * Math.cos(u * twoPi * 16.0) : 0.0;
    const scrollRelief =
      Math.sin(u * twoPi * 6.0) * Math.cos(v * twoPi * 3.0) * 0.4 +
      Math.cos((u + v) * twoPi * 12.0) * 0.15;
    return stitchGroove + scrollRelief;
  };

  const du = 1.0 / width;
  const dv = 1.0 / height;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      const h0 = sampleCarving(u, v);
      const hx = sampleCarving((u + du) % 1.0, v);
      const hy = sampleCarving(u, (v + dv) % 1.0);

      let nx = -(hx - h0) * 2.4;
      let ny = -(hy - h0) * 2.4;
      let nz = 1.0;
      const inv = 1.0 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;

      normalData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      const rough = Math.max(0.2, Math.min(0.85, 0.48 - h0 * 0.25));
      const rByte = Math.round(rough * 255);
      roughnessData[idx] = rByte;
      roughnessData[idx + 1] = rByte;
      roughnessData[idx + 2] = rByte;
      roughnessData[idx + 3] = 255;
    }
  }

  const makeTex = (data) => {
    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.NoColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  cachedLeatherMaps = {
    normalMap: makeTex(normalData),
    roughnessMap: makeTex(roughnessData),
  };

  return cachedLeatherMaps;
}

/**
 * Ensures a BufferGeometry has a 'uv2' attribute required by Three.js for aoMap support,
 * and computes smooth vertex normals and tangents.
 */
export function preparePBRGeometry(geometry) {
  geometry.computeVertexNormals();
  const uv = geometry.getAttribute('uv');
  if (uv && !geometry.getAttribute('uv2')) {
    geometry.setAttribute('uv2', uv.clone());
  }
  if (uv && geometry.index && typeof geometry.computeTangents === 'function') {
    try {
      geometry.computeTangents();
    } catch {
      // Ignore if geometry lacks indexed triangles
    }
  }
  return geometry;
}

/**
 * Generates a cold-moonlight night sky + warm indoor bounce PMREM environment map
 * so PBR materials (sheen cloth, jade, gilt bronze, dark wood) have realistic reflections.
 */
export function createNightEnvironmentTexture(renderer) {
  if (!renderer || typeof THREE.PMREMGenerator === 'undefined') {
    return null;
  }

  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0a1326);

    // Upper cold moonlit sky dome light
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0x1b3058,
        side: THREE.BackSide,
      }),
    );
    envScene.add(skyDome);

    // Bright cold-blue moon radiance patch in the north-upper hemisphere
    const moonPatch = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xdceeff }),
    );
    moonPatch.position.set(0, 9, -12);
    envScene.add(moonPatch);

    // Subtle warm candlelight bounce patch from the lower-right interior
    const candlePatch = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x5c3618 }),
    );
    candlePatch.position.set(8, -4, 4);
    envScene.add(candlePatch);

    const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
    pmremGenerator.dispose();
    return renderTarget.texture;
  } catch {
    return null;
  }
}
