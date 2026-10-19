import { CHAPTERS, TOTAL_DURATION, clampTime } from '../core/TimelineData.js';

export function formatTime(seconds) {
  const clamped = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class PlayerUI {
  constructor({
    onTogglePlay,
    onSeek,
    onReplay,
    onVolumeChange,
    onMuteToggle,
    onVoiceChange,
  } = {}) {
    this.onTogglePlay = onTogglePlay;
    this.onSeek = onSeek;
    this.onReplay = onReplay;
    this.onVolumeChange = onVolumeChange;
    this.onMuteToggle = onMuteToggle;
    this.onVoiceChange = onVoiceChange;

    this.isDraggingScrubber = false;
    this.isMuted = false;
    this.renderedChapterId = null;

    if (typeof document !== 'undefined') {
      this._cacheDom();
      this._buildChapterMarkers();
      this._bindEvents();
    }
  }

  _cacheDom() {
    this.coverOverlay = document.getElementById('cover-overlay');
    this.startBtn = document.getElementById('start-btn');
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.playPauseLabel = document.getElementById('play-pause-label');
    this.replayBtn = document.getElementById('replay-btn');
    this.timeDisplay = document.getElementById('time-display');
    this.activeChapterPill = document.getElementById('active-chapter-pill');

    this.timelineTrack = document.getElementById('timeline-track');
    this.timelineProgress = document.getElementById('timeline-progress');
    this.timelineThumb = document.getElementById('timeline-thumb');
    this.chapterMarkersContainer = document.getElementById('chapter-markers');

    this.voiceSelect = document.getElementById('voice-select');
    this.muteBtn = document.getElementById('mute-btn');
    this.muteIcon = document.getElementById('mute-icon');
    this.volumeSlider = document.getElementById('volume-slider');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');

    this.cameraModeBadge = document.getElementById('camera-mode-badge');
    this.cameraModeText = document.getElementById('camera-mode-text');

    this.singleVersePanel = document.getElementById('single-verse-panel');
    this.fullPoemPanel = document.getElementById('full-poem-panel');
    this.chapterTitle = document.getElementById('chapter-title');
    this.chapterSubtitle = document.getElementById('chapter-subtitle');
    this.verticalVerse = document.getElementById('vertical-verse');
    this.versePinyin = document.getElementById('verse-pinyin');
    this.verseTranslation = document.getElementById('verse-translation');
  }

  _buildChapterMarkers() {
    if (!this.chapterMarkersContainer) return;
    this.chapterMarkersContainer.innerHTML = '';
    this.markerButtons = [];

    for (const ch of CHAPTERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter-marker-btn';
      btn.dataset.chapterId = ch.id;
      btn.textContent = ch.label;

      // Position marker along [4%, 96%] to avoid clipping at edges
      const pct = (ch.start / TOTAL_DURATION) * 100;
      const safePct = Math.max(4, Math.min(96, pct));
      btn.style.left = `${safePct}%`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onSeek) {
          this.onSeek(ch.start + 0.05);
        }
      });

      this.chapterMarkersContainer.appendChild(btn);
      this.markerButtons.push(btn);
    }
  }

  _bindEvents() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.hideCover();
        if (this.onTogglePlay) {
          this.onTogglePlay(true);
        }
      });
    }

    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.hideCover();
        if (this.onTogglePlay) {
          this.onTogglePlay();
        }
      });
    }

    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', () => {
        this.hideCover();
        if (this.onReplay) {
          this.onReplay();
        }
      });
    }

    if (this.timelineTrack) {
      const scrubFromPointer = (clientX) => {
        const rect = this.timelineTrack.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const targetTime = clampTime(ratio * TOTAL_DURATION);
        if (this.onSeek) {
          this.onSeek(targetTime);
        }
      };

      this.timelineTrack.addEventListener('pointerdown', (e) => {
        this.isDraggingScrubber = true;
        this.timelineTrack.setPointerCapture(e.pointerId);
        scrubFromPointer(e.clientX);
      });

      this.timelineTrack.addEventListener('pointermove', (e) => {
        if (!this.isDraggingScrubber) return;
        scrubFromPointer(e.clientX);
      });

      const endScrub = (e) => {
        if (!this.isDraggingScrubber) return;
        this.isDraggingScrubber = false;
        try {
          this.timelineTrack.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore
        }
      };

      this.timelineTrack.addEventListener('pointerup', endScrub);
      this.timelineTrack.addEventListener('pointercancel', endScrub);
    }

    if (this.voiceSelect) {
      this.voiceSelect.addEventListener('change', (e) => {
        if (this.onVoiceChange) {
          this.onVoiceChange(e.target.value);
        }
      });
    }

    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        if (this.muteIcon) {
          this.muteIcon.textContent = this.isMuted ? '🔇' : '🔊';
        }
        if (this.onMuteToggle) {
          this.onMuteToggle(this.isMuted);
        }
      });
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0 && this.isMuted) {
          this.isMuted = false;
          if (this.muteIcon) this.muteIcon.textContent = '🔊';
          if (this.onMuteToggle) this.onMuteToggle(false);
        }
        if (this.onVolumeChange) {
          this.onVolumeChange(val);
        }
      });
    }

    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        this.hideCover();
        if (this.onTogglePlay) {
          this.onTogglePlay();
        }
      }
    });
  }

  hideCover() {
    if (this.coverOverlay) {
      this.coverOverlay.classList.add('fade-out');
    }
  }

  setPlayState(isPlaying) {
    if (this.playPauseIcon && this.playPauseLabel) {
      this.playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
      this.playPauseLabel.textContent = isPlaying ? '暂停' : '播放';
    }
    if (this.cameraModeBadge && this.cameraModeText) {
      if (isPlaying) {
        this.cameraModeBadge.classList.remove('orbit-active');
        this.cameraModeText.textContent = '电影运镜 · 移动鼠标微调视差';
      } else {
        this.cameraModeBadge.classList.add('orbit-active');
        this.cameraModeText.textContent = '已暂停 · 拖拽画面 360° 自由环视庭院';
      }
    }
  }

  update(state) {
    if (!state || typeof document === 'undefined') return;

    const pct = Math.max(0, Math.min(100, (state.t / TOTAL_DURATION) * 100));
    if (this.timelineProgress) {
      this.timelineProgress.style.width = `${pct}%`;
    }
    if (this.timelineThumb) {
      this.timelineThumb.style.left = `${pct}%`;
    }
    if (this.timelineTrack) {
      this.timelineTrack.setAttribute('aria-valuenow', state.t.toFixed(1));
    }
    if (this.timeDisplay) {
      this.timeDisplay.textContent = `${formatTime(state.t)} / ${formatTime(TOTAL_DURATION)}`;
    }
    if (this.activeChapterPill) {
      this.activeChapterPill.textContent = state.chapter.label;
    }

    if (this.markerButtons) {
      for (const btn of this.markerButtons) {
        btn.classList.toggle('active', btn.dataset.chapterId === state.chapter.id);
      }
    }

    // Update right-hand calligraphy panel
    if (state.showAllVerses) {
      this.singleVersePanel?.classList.add('hidden');
      this.fullPoemPanel?.classList.remove('hidden');
    } else {
      this.singleVersePanel?.classList.remove('hidden');
      this.fullPoemPanel?.classList.add('hidden');

      if (this.renderedChapterId !== state.chapter.id) {
        this.renderedChapterId = state.chapter.id;
        if (this.chapterTitle) this.chapterTitle.textContent = state.chapter.title;
        if (this.chapterSubtitle) this.chapterSubtitle.textContent = state.chapter.subtitle;
        if (this.versePinyin) this.versePinyin.textContent = state.chapter.pinyin;
        if (this.verseTranslation) this.verseTranslation.textContent = state.chapter.translation;

        if (this.verticalVerse) {
          this.verticalVerse.innerHTML = '';
          const chars = Array.from(state.chapter.verseText);
          chars.forEach((ch, idx) => {
            const span = document.createElement('span');
            span.className = 'verse-char';
            span.dataset.idx = String(idx);
            span.textContent = ch;
            this.verticalVerse.appendChild(span);
          });
        }
      }

      if (this.verticalVerse) {
        const charNodes = this.verticalVerse.querySelectorAll('.verse-char');
        charNodes.forEach((node, idx) => {
          node.classList.toggle('revealed', idx < state.activeCharIndex);
          node.classList.toggle('speaking', idx === state.speakingCharIndex);
        });
      }
    }
  }
}
