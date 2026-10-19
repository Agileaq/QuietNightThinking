# 静夜思 · 唐·李白 — Three.js 沉浸式视听诗歌剧场 (Quiet Night Thought)

基于 Three.js 与 Web Audio API 构建的沉浸式三维视听诗歌长卷，重现唐代诗仙李白《静夜思》的千古意境。支持视频进度条任意拖拽、多角色神经网络语音朗诵、逐字书法高亮、全景视差运镜与暂停 360° 自由环视。

An offline-first Three.js 3D cinematic audiovisual recitation of Li Bai's Tang poem "Quiet Night Thought" (*Jing Ye Si*), deployed to GitHub Pages.

---

## 中文

### 功能特色

1. **盛唐沉浸式三维场景**
   - 完整复原唐代殿宇式轩窗木构建筑（飞檐斗拱、筒瓦垄、直棂格扇窗、木构台基与唐榻案几）。
   - 皎洁明月透过轩窗投射出丁达尔（Tyndall）体积光束与窗棂投影，地面随分镜凝结霜白冰晶（GLSL 着色器）。
2. **次时代 PBR 人物建模与动作编排**
   - 李白人物模型采用 `MeshPhysicalMaterial` 物理材质，包含织物微绒光泽（`sheen`）、和田青白玉銙片透光（`transmission`）、唐代软脚幞头（乌纱幞头）与十三銙躞蹀玉带。
   - 贴图管线采用程序化烘焙切线空间法线贴图（Normal Map）与环境光遮蔽（AO Map）。
   - 动作严格按诗句分镜编排：
     - **序 · 静夜**：轩窗静立，负手迎月。
     - **一 · 床前明月光**：转身凝望室内床榻。
     - **二 · 疑是地上霜**：俯首注视窗前银霜般的地面。
     - **三 · 举头望明月**：移步窗前仰首遥望苍穹明月。
     - **四 · 低头思故乡**：深情垂首思索故园。
     - **尾 · 余韵**：踱步转身恢复初始姿态。
3. **高品质多音色朗诵与逐字书法高亮**
   - 内置 4 款无重采样变调的 Microsoft Edge Neural 中文神经网络发音人：
     1. **青莲 · 清朗书生**（默认音色）
     2. **明月 · 温婉女声**
     3. **太白 · 浑厚男声**
     4. **沧桑 · 老者吟诵**
   - 右侧竖排古典书法字幕与音频朗诵逐字精确高亮同步。
4. **程序化古琴与夜色虫鸣伴奏**
   - 基于 Web Audio API 实时合成五声音阶古琴散音与泛音，随分镜律动，并融合空山夜色风声虫鸣。
5. **双模摄影机运镜**
   - 播放时：平滑贝塞尔样条运镜 + 鼠标微幅视差悬停；
   - 暂停时：平滑切入 OrbitControls 轨道控制器，可 360° 旋转缩放检视场景与角色细节。

### 本地开发

- `npm install` — 安装依赖
- `npm run dev` — 启动本地开发服务器 (`http://localhost:5173`)
- `npm run test` — 运行单元测试（Vitest，覆盖分镜时间轴、音频调度、运镜与三维场景）
- `npm run build` — 打包生产产物输出至 `dist/`
- `npm run preview` — 本地预览打包产物

### 部署到 GitHub Pages

项目已配置相对路径构建与 GitHub Actions 自动部署工作流（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）：

1. 在 GitHub 上创建仓库并推送到 `main` 或 `master` 分支：
   ```bash
   git remote add origin git@github.com:<username>/QuietNightThinking.git
   git push -u origin master
   ```
2. 进入 GitHub 仓库设置：
   **Settings → Pages → Build and deployment → Source 选择 "GitHub Actions"**。
3. GitHub Actions 将自动执行测试、构建并发布至 GitHub Pages：
   `https://<username>.github.io/QuietNightThinking/`

---

## English

### Features

- **Cinematic 3D Tang Dynasty Scene**: Authentic Tang architecture, overhanging eaves, carved lattice window, box-frame platform bed, and volumetric moonlight beam streaming onto the wooden floor.
- **Next-Gen PBR Character & Full-Poem Choreography**: Sculpted Li Bai character rig built with Three.js `MeshPhysicalMaterial`, fabric sheen, Tang *Futou* headwear, *Xiedie* jade belt, and procedural tangent-space normal/AO maps. Follows the narrative actions of the poem (turning to bed -> looking at floor frost -> gazing up at moon -> bowing head -> returning to initial posture).
- **Multiple Neural Recitation Voices & Synced Subtitles**: 4 selectable Edge Neural TTS Chinese recitation voices paired with real-time per-character vertical calligraphy subtitle highlighting.
- **Procedural Web Audio Guqin Score**: Pentatonic guqin plucks & crystalline harmonics synchronized across the 32-second timeline.
- **Hybrid Camera**: Smooth cinematic spline camera with mouse parallax during playback; auto-switches to full 360° OrbitControls upon pause.

### Development

- `npm install`
- `npm run dev` — Start local dev server
- `npm run test` — Run unit tests (Vitest)
- `npm run build` — Build production bundle to `dist/`
- `npm run preview` — Preview built files

### Deploy to GitHub Pages

1. Push to `main` or `master` on GitHub.
2. In the repository settings, set **Settings → Pages → Build and deployment → Source = GitHub Actions** once.
3. The workflow in `.github/workflows/deploy.yml` will automatically build and deploy the app.
