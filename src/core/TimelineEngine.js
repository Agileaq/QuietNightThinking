import {
  TOTAL_DURATION,
  clampTime,
  getChapterAt,
  getSceneStateAt,
} from './TimelineData.js';

export class TimelineEngine {
  constructor({
    duration = TOTAL_DURATION,
    onUpdate = null,
    onPlayStateChange = null,
    onChapterChange = null,
    onEnded = null,
  } = {}) {
    this.duration = duration;
    this.currentTime = 0;
    this.isPlaying = false;
    this.currentChapterId = getChapterAt(0).id;

    this.onUpdate = onUpdate;
    this.onPlayStateChange = onPlayStateChange;
    this.onChapterChange = onChapterChange;
    this.onEnded = onEnded;
  }

  play() {
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
      this.currentChapterId = getChapterAt(0).id;
    }
    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(true, this.currentTime);
      }
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.onPlayStateChange) {
        this.onPlayStateChange(false, this.currentTime);
      }
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  seek(targetTime) {
    const prevTime = this.currentTime;
    this.currentTime = clampTime(targetTime);
    this._emitState(prevTime);
  }

  update(dt) {
    if (!this.isPlaying) {
      return this.getState();
    }
    const safeDt = typeof dt === 'number' && !Number.isNaN(dt) ? Math.max(0, dt) : 0;
    const prevTime = this.currentTime;
    const nextTime = this.currentTime + safeDt;

    if (nextTime >= this.duration) {
      this.currentTime = this.duration;
      this.isPlaying = false;
      this._emitState(prevTime);
      if (this.onPlayStateChange) {
        this.onPlayStateChange(false, this.currentTime);
      }
      if (this.onEnded) {
        this.onEnded();
      }
      return this.getState();
    }

    this.currentTime = nextTime;
    return this._emitState(prevTime);
  }

  getState() {
    return getSceneStateAt(this.currentTime);
  }

  _emitState(prevTime) {
    const state = getSceneStateAt(this.currentTime);
    if (state.chapter.id !== this.currentChapterId) {
      this.currentChapterId = state.chapter.id;
      if (this.onChapterChange) {
        this.onChapterChange(state.chapter);
      }
    }
    if (this.onUpdate) {
      this.onUpdate(state, prevTime);
    }
    return state;
  }
}
