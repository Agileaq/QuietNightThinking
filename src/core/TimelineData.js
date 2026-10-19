export const TOTAL_DURATION = 32.0;

export const CHAPTERS = [
  {
    id: 'intro',
    index: 0,
    label: '序 · 静夜',
    title: '静夜思',
    subtitle: '唐 · 李白',
    verseText: '静夜思',
    pinyin: 'Jìng Yè Sī · Táng Lǐ Bái',
    translation: 'Quiet Night Thought — Li Bai (Tang Dynasty)',
    start: 0.0,
    end: 5.0,
    voiceWindow: [1.2, 4.28],
    charTimings: [
      { char: '静', start: 1.20, end: 1.48 },
      { char: '夜', start: 1.48, end: 1.76 },
      { char: '思', start: 1.76, end: 2.10 },
    ],
  },
  {
    id: 'verse1',
    index: 1,
    label: '一 · 床前明月光',
    title: '第一幕',
    subtitle: '月照轩窗',
    verseText: '床前明月光',
    pinyin: 'Chuáng qián míng yuè guāng',
    translation: 'Before my bed, the bright moonlight gleams,',
    start: 5.0,
    end: 11.0,
    voiceWindow: [5.8, 8.15],
    charTimings: [
      { char: '床', start: 5.80, end: 6.13 },
      { char: '前', start: 6.13, end: 6.50 },
      { char: '明', start: 7.25, end: 7.52 },
      { char: '月', start: 7.52, end: 7.79 },
      { char: '光', start: 7.79, end: 8.15 },
    ],
  },
  {
    id: 'verse2',
    index: 2,
    label: '二 · 疑是地上霜',
    title: '第二幕',
    subtitle: '寒霜凝地',
    verseText: '疑是地上霜',
    pinyin: 'Yí shì dì shàng shuāng',
    translation: 'Like autumn frost upon the ground it seems.',
    start: 11.0,
    end: 17.0,
    voiceWindow: [11.8, 14.05],
    charTimings: [
      { char: '疑', start: 11.80, end: 12.04 },
      { char: '是', start: 12.04, end: 12.32 },
      { char: '地', start: 13.25, end: 13.49 },
      { char: '上', start: 13.49, end: 13.73 },
      { char: '霜', start: 13.73, end: 14.05 },
    ],
  },
  {
    id: 'verse3',
    index: 3,
    label: '三 · 举头望明月',
    title: '第三幕',
    subtitle: '仰望苍穹',
    verseText: '举头望明月',
    pinyin: 'Jǔ tóu wàng míng yuè',
    translation: 'I raise my head to gaze at the radiant moon,',
    start: 17.0,
    end: 23.5,
    voiceWindow: [17.8, 20.12],
    charTimings: [
      { char: '举', start: 17.80, end: 18.11 },
      { char: '头', start: 18.11, end: 18.46 },
      { char: '望', start: 19.25, end: 19.51 },
      { char: '明', start: 19.51, end: 19.77 },
      { char: '月', start: 19.77, end: 20.12 },
    ],
  },
  {
    id: 'verse4',
    index: 4,
    label: '四 · 低头思故乡',
    title: '第四幕',
    subtitle: '千里故园',
    verseText: '低头思故乡',
    pinyin: 'Dī tóu sī gù xiāng',
    translation: 'Then bow my head, lost in thoughts of home.',
    start: 23.5,
    end: 29.0,
    voiceWindow: [24.2, 26.60],
    charTimings: [
      { char: '低', start: 24.20, end: 24.51 },
      { char: '头', start: 24.51, end: 24.86 },
      { char: '思', start: 25.65, end: 25.94 },
      { char: '故', start: 25.94, end: 26.23 },
      { char: '乡', start: 26.23, end: 26.60 },
    ],
  },
  {
    id: 'outro',
    index: 5,
    label: '尾 · 余韵',
    title: '余韵',
    subtitle: '月满长安',
    verseText: '床前明月光 · 疑是地上霜 · 举头望明月 · 低头思故乡',
    pinyin: 'Jìng Yè Sī',
    translation: 'Echoes in the Quiet Night',
    start: 29.0,
    end: 32.0,
    voiceWindow: [29.2, 31.5],
    charTimings: [],
  },
];

export const FULL_POEM_VERSES = [
  '床前明月光',
  '疑是地上霜',
  '举头望明月',
  '低头思故乡',
];

export function clampTime(t) {
  if (typeof t !== 'number' || Number.isNaN(t)) {
    return 0;
  }
  return Math.max(0, Math.min(TOTAL_DURATION, t));
}

export function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const u = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return u * u * (3 - 2 * u);
}

export function lerp(a, b, u) {
  return a + (b - a) * u;
}

export function lerpVec3(v0, v1, u) {
  return [
    lerp(v0[0], v1[0], u),
    lerp(v0[1], v1[1], u),
    lerp(v0[2], v1[2], u),
  ];
}

export function getChapterAt(rawTime) {
  const t = clampTime(rawTime);
  for (let i = 0; i < CHAPTERS.length; i += 1) {
    const ch = CHAPTERS[i];
    if (t >= ch.start && (t < ch.end || i === CHAPTERS.length - 1)) {
      return ch;
    }
  }
  return CHAPTERS[CHAPTERS.length - 1];
}

const CAMERA_KEYFRAMES = [
  // Intro: Courtyard front-quarter view showcasing the Tang house roof, walls, and open window, then gliding inside
  { t: 0.0, pos: [-3.8, 2.85, -4.8], target: [0.2, 1.85, 0.9], fov: 46 },
  { t: 3.2, pos: [-2.2, 2.15, -1.8], target: [0.1, 1.55, 0.8], fov: 44 },
  { t: 5.0, pos: [-1.45, 1.95, 2.35], target: [0.25, 1.25, 0.45], fov: 44 },
  // Verse 1: Inside the house viewing the window moonlight beam streaming through the open window onto the floor in front of the bed ("床前明月光")
  { t: 7.5, pos: [-1.35, 1.82, 2.65], target: [0.35, 1.05, 0.65], fov: 42 },
  { t: 11.0, pos: [-0.85, 1.48, 2.45], target: [0.2, 0.65, 0.95], fov: 42 },
  // Verse 2: Low-angle sweep inside the room across the window-lit floor as silver frost crystallizes ("疑是地上霜")
  { t: 13.5, pos: [-0.75, 0.72, 2.55], target: [0.12, 0.25, 1.15], fov: 40 },
  { t: 17.0, pos: [-0.95, 0.95, 2.15], target: [-0.15, 0.42, 0.55], fov: 42 },
  // Verse 3: Beside Li Bai inside the room, tilting upward through the open window toward the Full Moon ("举头望明月")
  { t: 18.4, pos: [-0.65, 1.58, 1.48], target: [-0.15, 3.8, -6.0], fov: 44 },
  { t: 21.5, pos: [-0.45, 1.52, 1.45], target: [0.0, 7.5, -16.0], fov: 42 },
  { t: 23.5, pos: [-0.55, 1.58, 1.48], target: [-0.10, 5.5, -10.0], fov: 42 },
  // Verse 4: Tilting downward with Li Bai's bowed head toward the courtyard water basin & golden homeland reflection ("低头思故乡")
  { t: 25.5, pos: [-0.92, 1.78, 1.35], target: [-1.15, 0.32, -0.85], fov: 40 },
  { t: 29.0, pos: [-1.45, 1.92, 2.25], target: [-0.65, 0.55, -0.45], fov: 43 },
  // Outro: Wide panoramic pullback through the West veranda framing the house, window beam, poet, and full moon
  { t: 32.0, pos: [-4.8, 3.25, 4.8], target: [0.0, 2.2, -2.5], fov: 46 },
];

const CAMERA_PORTRAIT_KEYFRAMES = [
  // Intro: Wide courtyard view into the house in portrait orientation
  { t: 0.0, pos: [-3.2, 3.2, -5.2], target: [0.2, 1.8, 0.8], fov: 56 },
  { t: 3.2, pos: [-2.1, 2.4, -1.6], target: [0.15, 1.5, 0.7], fov: 56 },
  { t: 5.0, pos: [-1.65, 2.25, 4.45], target: [0.48, 1.15, 1.25], fov: 58 },
  // Verse 1 ("床前明月光"): Elevated pull-back view encompassing poet's head on left, bed on right, window beam in center
  { t: 7.5, pos: [-1.55, 2.2, 4.35], target: [0.48, 1.18, 1.25], fov: 58 },
  { t: 11.0, pos: [-1.45, 2.05, 4.25], target: [0.45, 1.12, 1.28], fov: 58 },
  // Verse 2 ("疑是地上霜"): Lowers slightly to emphasize floor frost while keeping poet, bed, and beam framed
  { t: 13.5, pos: [-1.35, 1.75, 4.15], target: [0.42, 0.72, 1.32], fov: 60 },
  { t: 17.0, pos: [-1.45, 1.85, 3.85], target: [0.35, 0.85, 1.15], fov: 60 },
  // Verse 3 ("举头望明月"): High vertical framing capturing Li Bai looking up in lower-left, Full Moon completely clear of house roof/wall in upper sky
  { t: 18.2, pos: [0.02, 1.38, 2.25], target: [0.02, 4.2, -10.0], fov: 62 },
  { t: 21.5, pos: [0.08, 1.32, 2.05], target: [-0.01, 4.8, -12.0], fov: 64 },
  { t: 23.5, pos: [0.02, 1.38, 2.25], target: [0.02, 4.2, -10.0], fov: 62 },
  // Verse 4 ("低头思故乡"): Poet bowing head with bed, moonlight, and water reflection
  { t: 25.5, pos: [-1.42, 2.12, 3.95], target: [-0.15, 0.72, 0.25], fov: 58 },
  { t: 29.0, pos: [-1.65, 2.35, 4.45], target: [0.25, 1.05, 0.95], fov: 60 },
  // Outro: Panoramic pullback
  { t: 32.0, pos: [-4.2, 3.85, 6.2], target: [0.2, 1.8, 0.5], fov: 62 },
];

function interpolateKeyframeTrack(keyframes, t) {
  for (let i = 0; i < keyframes.length - 1; i += 1) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];
    if (t >= k0.t && t <= k1.t) {
      const u = smoothstep(k0.t, k1.t, t);
      return {
        position: lerpVec3(k0.pos, k1.pos, u),
        target: lerpVec3(k0.target, k1.target, u),
        fov: lerp(k0.fov, k1.fov, u),
      };
    }
  }
  const last = keyframes[keyframes.length - 1];
  return {
    position: [...last.pos],
    target: [...last.target],
    fov: last.fov,
  };
}

export function getCameraPose(rawTime, aspect = 1.77) {
  const t = clampTime(rawTime);
  const landscapePose = interpolateKeyframeTrack(CAMERA_KEYFRAMES, t);

  // If aspect ratio is wide/desktop landscape (>= 1.15), use pure landscape keyframes
  if (typeof aspect !== 'number' || aspect >= 1.15) {
    return landscapePose;
  }

  // For portrait screens (such as iPhone Pro Max with aspect ~0.46), blend into dedicated portrait framing
  const portraitPose = interpolateKeyframeTrack(CAMERA_PORTRAIT_KEYFRAMES, t);
  const uPortrait = smoothstep(1.15, 0.55, aspect);

  return {
    position: lerpVec3(landscapePose.position, portraitPose.position, uPortrait),
    target: lerpVec3(landscapePose.target, portraitPose.target, uPortrait),
    fov: lerp(landscapePose.fov, portraitPose.fov, uPortrait),
  };
}

export function getSceneStateAt(rawTime) {
  const t = clampTime(rawTime);
  const chapter = getChapterAt(t);
  const chapterSpan = Math.max(0.001, chapter.end - chapter.start);
  const chapterProgress = Math.max(0, Math.min(1, (t - chapter.start) / chapterSpan));

  // Frost ("疑是地上霜"): grows from 0 -> 1 between 11.2s and 16.5s, stays crystalline afterward
  let frost = 0;
  if (t >= 11.0 && t < 16.8) {
    frost = smoothstep(11.0, 16.5, t);
  } else if (t >= 16.8) {
    frost = 1.0 - 0.12 * smoothstep(28.0, 32.0, t);
  }

  // Poet 6-chapter full-body choreography:
  // 0) intro (0-5s): Initial state near window
  // 1) verse1 (5-11s, "床前明月光"): Turns toward the TangBed in the eastern chamber and looks at the bed
  // 2) verse2 (11-17s, "疑是地上霜"): Turns toward the moonlit floor and looks down at the silver frost
  // 3) verse3 (17-23.5s, "举头望明月"): Turns to the open North window and raises head to gaze at the Full Moon
  // 4) verse4 (23.5-29s, "低头思故乡"): Bows head deeply in homesick contemplation
  // 5) outro (29-32s, "尾 · 余韵"): Moves and rotates smoothly back to the exact initial state
  const INIT_POS = [-0.42, 0.2, 0.62];
  const BED_POS = [-0.25, 0.2, 0.92];
  const FROST_POS = [-0.20, 0.2, 0.84];
  const MOON_POS = [-0.12, 0.2, 0.48];
  const BOW_POS = [-0.15, 0.2, 0.52];

  const INIT_YAW = Math.PI - 0.14; // ~3.0016 rad
  const BED_YAW = 1.18; // Facing East-Southeast directly at TangBed (1.35, 0.2, 1.55)
  const FROST_YAW = 2.05; // Facing the indoor frosted floor patch (0.12, 0.21, 1.38)
  const MOON_YAW = Math.PI; // Facing directly out the North window toward FullMoon (0, 8.8, -18)
  const BOW_YAW = Math.PI - 0.06;

  let poetAction = 'initial';
  let poetPosition = [...INIT_POS];
  let poetRotationY = INIT_YAW;
  let headPitch = 0;
  let headYaw = 0;
  let walkIntensity = 0;

  if (t < 5.0) {
    poetAction = 'initial';
    poetPosition = [...INIT_POS];
    poetRotationY = INIT_YAW;
    headPitch = 0;
    headYaw = 0;
    walkIntensity = 0;
  } else if (t < 11.0) {
    // Verse 1: Turn around to look at the bed ("床前明月光")
    poetAction = 'look_at_bed';
    const uTurn = smoothstep(5.0, 6.8, t);
    poetPosition = lerpVec3(INIT_POS, BED_POS, uTurn);
    poetRotationY = lerp(INIT_YAW, BED_YAW, uTurn);
    headPitch = lerp(0, -0.12, uTurn);
    headYaw = lerp(0, -0.08, uTurn);
    walkIntensity = Math.sin(uTurn * Math.PI);
  } else if (t < 17.0) {
    // Verse 2: Look down at the frost-covered floor ("疑是地上霜")
    poetAction = 'look_at_frost';
    const uFrost = smoothstep(11.0, 12.8, t);
    poetPosition = lerpVec3(BED_POS, FROST_POS, uFrost);
    poetRotationY = lerp(BED_YAW, FROST_YAW, uFrost);
    headPitch = lerp(-0.12, -0.38, uFrost);
    headYaw = lerp(-0.08, 0.05, uFrost);
    walkIntensity = Math.sin(uFrost * Math.PI) * 0.65;
  } else if (t < 23.5) {
    // Verse 3: Turn to window and raise head to gaze at the Full Moon ("举头望明月")
    poetAction = 'look_at_moon';
    const uMoon = smoothstep(17.0, 19.0, t);
    const holdOut = 1.0 - 0.12 * smoothstep(22.4, 23.5, t);
    poetPosition = lerpVec3(FROST_POS, MOON_POS, uMoon);
    poetRotationY = lerp(FROST_YAW, MOON_YAW, uMoon);
    headPitch = lerp(-0.38, 0.58, uMoon) * holdOut;
    headYaw = lerp(0.05, 0.0, uMoon);
    walkIntensity = Math.sin(uMoon * Math.PI) * 0.85;
  } else if (t < 29.0) {
    // Verse 4: Bow head deeply in thoughts of homeland ("低头思故乡")
    poetAction = 'bow_head_homesick';
    const uBow = smoothstep(23.5, 25.4, t);
    poetPosition = lerpVec3(MOON_POS, BOW_POS, uBow);
    poetRotationY = lerp(MOON_YAW, BOW_YAW, uBow);
    headPitch = lerp(0.51, -0.46, uBow);
    headYaw = lerp(0.0, -0.06, uBow);
    walkIntensity = Math.sin(uBow * Math.PI) * 0.35;
  } else {
    // Outro: Walk and turn smoothly back to initial position & posture ("尾部时人物移动恢复到初始状态")
    poetAction = 'return_to_initial';
    const uReturn = smoothstep(29.0, 31.5, t);
    poetPosition = lerpVec3(BOW_POS, INIT_POS, uReturn);
    poetRotationY = lerp(BOW_YAW, INIT_YAW, uReturn);
    headPitch = lerp(-0.46, 0.0, uReturn);
    headYaw = lerp(-0.06, 0.0, uReturn);
    walkIntensity = Math.sin(uReturn * Math.PI);
  }

  // Homeland warm golden memory glow ("低头思故乡")
  let homelandGlow = 0;
  if (t >= 23.5 && t <= 29.5) {
    const rise = smoothstep(23.7, 25.5, t);
    const fade = 1.0 - 0.35 * smoothstep(28.2, 29.5, t);
    homelandGlow = rise * fade;
  } else if (t > 29.5) {
    homelandGlow = 0.65 * (1.0 - smoothstep(29.5, 32.0, t));
  }

  const moonbeamIntensity = 0.35 + 0.65 * smoothstep(2.5, 7.5, t);
  const moonHalo = 0.45 + 0.55 * smoothstep(17.0, 20.5, t) * (1.0 - 0.3 * smoothstep(24.0, 28.0, t));
  const candleFlicker = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.cos(t * 3.1);

  // Exact per-character synchronization based on chapter.charTimings
  const [vStart, vEnd] = chapter.voiceWindow;
  const voiceProgress = smoothstep(vStart, vEnd, t);

  let activeCharIndex = 0;
  let speakingCharIndex = -1;

  if (Array.isArray(chapter.charTimings) && chapter.charTimings.length > 0) {
    for (let i = 0; i < chapter.charTimings.length; i += 1) {
      const ct = chapter.charTimings[i];
      if (t >= ct.start) {
        activeCharIndex = i + 1;
      }
      if (t >= ct.start && t <= ct.end) {
        speakingCharIndex = i;
      }
    }
  }

  return {
    t,
    chapter,
    chapterProgress,
    frost,
    poetAction,
    poetPosition,
    poetRotationY,
    headPitch,
    headYaw,
    walkIntensity,
    homelandGlow,
    moonbeamIntensity,
    moonHalo,
    candleFlicker,
    voiceProgress,
    activeCharIndex,
    speakingCharIndex,
    showAllVerses: chapter.id === 'outro',
  };
}
