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
    voiceWindow: [1.2, 4.2],
    charTimings: [
      { char: '静', start: 1.20, end: 1.63 },
      { char: '夜', start: 1.65, end: 2.08 },
      { char: '思', start: 2.10, end: 2.75 },
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
    voiceWindow: [5.8, 9.0],
    charTimings: [
      { char: '床', start: 5.80, end: 6.30 },
      { char: '前', start: 6.32, end: 6.85 },
      { char: '明', start: 7.25, end: 7.72 },
      { char: '月', start: 7.75, end: 8.22 },
      { char: '光', start: 8.25, end: 8.95 },
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
    voiceWindow: [11.8, 15.0],
    charTimings: [
      { char: '疑', start: 11.80, end: 12.30 },
      { char: '是', start: 12.32, end: 12.85 },
      { char: '地', start: 13.25, end: 13.72 },
      { char: '上', start: 13.75, end: 14.22 },
      { char: '霜', start: 14.25, end: 14.95 },
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
    voiceWindow: [17.8, 21.0],
    charTimings: [
      { char: '举', start: 17.80, end: 18.30 },
      { char: '头', start: 18.32, end: 18.85 },
      { char: '望', start: 19.25, end: 19.72 },
      { char: '明', start: 19.75, end: 20.22 },
      { char: '月', start: 20.25, end: 20.95 },
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
    voiceWindow: [24.2, 27.5],
    charTimings: [
      { char: '低', start: 24.20, end: 24.70 },
      { char: '头', start: 24.72, end: 25.25 },
      { char: '思', start: 25.65, end: 26.12 },
      { char: '故', start: 26.15, end: 26.62 },
      { char: '乡', start: 26.65, end: 27.40 },
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
  { t: 18.4, pos: [-0.95, 1.68, 1.48], target: [-0.25, 3.8, -6.0], fov: 44 },
  { t: 21.5, pos: [-0.78, 1.62, 1.38], target: [0.0, 11.5, -18.0], fov: 40 },
  { t: 23.5, pos: [-0.88, 1.68, 1.45], target: [-0.25, 7.5, -12.0], fov: 42 },
  // Verse 4: Tilting downward with Li Bai's bowed head toward the courtyard water basin & golden homeland reflection ("低头思故乡")
  { t: 25.5, pos: [-0.92, 1.78, 1.35], target: [-1.15, 0.32, -0.85], fov: 40 },
  { t: 29.0, pos: [-1.45, 1.92, 2.25], target: [-0.65, 0.55, -0.45], fov: 43 },
  // Outro: Wide panoramic pullback through the West veranda framing the house, window beam, poet, and full moon
  { t: 32.0, pos: [-4.8, 3.25, 4.8], target: [0.0, 2.2, -2.5], fov: 46 },
];

export function getCameraPose(rawTime) {
  const t = clampTime(rawTime);
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i += 1) {
    const k0 = CAMERA_KEYFRAMES[i];
    const k1 = CAMERA_KEYFRAMES[i + 1];
    if (t >= k0.t && t <= k1.t) {
      const u = smoothstep(k0.t, k1.t, t);
      return {
        position: lerpVec3(k0.pos, k1.pos, u),
        target: lerpVec3(k0.target, k1.target, u),
        fov: lerp(k0.fov, k1.fov, u),
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return {
    position: [...last.pos],
    target: [...last.target],
    fov: last.fov,
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

  // Poet head pitch
  let headPitch = 0;
  if (t < 11.0) {
    headPitch = -0.04 * smoothstep(5.0, 10.0, t);
  } else if (t < 17.0) {
    headPitch = lerp(-0.04, -0.14, smoothstep(11.0, 14.5, t));
  } else if (t < 23.5) {
    const upIn = smoothstep(17.2, 19.6, t);
    const holdOut = 1.0 - 0.15 * smoothstep(22.3, 23.5, t);
    headPitch = lerp(-0.14, 0.58, upIn) * holdOut;
  } else if (t < 29.0) {
    const downIn = smoothstep(23.5, 25.4, t);
    headPitch = lerp(0.49, -0.42, downIn);
  } else {
    headPitch = lerp(-0.42, -0.1, smoothstep(29.0, 31.8, t));
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
    headPitch,
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
