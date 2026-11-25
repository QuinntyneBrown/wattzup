import { signal } from '@angular/core';

const SAMPLE_RATE = 24_000;
const RAMP_TIME_CONSTANT_S = 0.03;

/**
 * Plays synthesized PCM clips through Web Audio with smooth volume ramping (< 100 ms), emits a
 * `ducking` signal so world music and ride sound lower by 6-10 dB while speech plays, and creates
 * zero AudioContext nodes until the first clip actually plays (L2-169 AC3, L2-171 AC3, AC4).
 */
export class WebAudioAnnouncerMixer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly isDucking = signal(false);

  readonly ducking = this.isDucking.asReadonly();

  constructor(private readonly createContext: () => AudioContext = () => new AudioContext()) {}

  async play(pcm: Float32Array, volumePercent: number): Promise<void> {
    if (pcm.length === 0) return;
    this.stopActive();

    const ctx = this.ensureContext(volumePercent);
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const buffer = ctx.createBuffer(1, pcm.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(pcm);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain!);
    this.activeSource = source;
    this.isDucking.set(true);

    await new Promise<void>((resolve) => {
      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null;
          this.scheduleRestore();
        }
        resolve();
      };
      source.start();
    });
  }

  setVolume(volumePercent: number): void {
    if (!this.context || !this.gain) return;
    const target = Math.max(0, Math.min(1, volumePercent / 100));
    this.gain.gain.setTargetAtTime(target, this.context.currentTime, RAMP_TIME_CONSTANT_S);
  }

  stopActive(): void {
    if (this.restoreTimer !== null) {
      clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // Ignore if already ended.
      }
      this.activeSource.disconnect();
      this.activeSource = null;
    }
    this.isDucking.set(false);
  }

  dispose(): void {
    this.stopActive();
    if (this.gain) {
      this.gain.disconnect();
      this.gain = null;
    }
    if (this.context) {
      void this.context.close();
      this.context = null;
    }
  }

  private ensureContext(volumePercent: number): AudioContext {
    if (!this.context) {
      this.context = this.createContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = Math.max(0, Math.min(1, volumePercent / 100));
      this.gain.connect(this.context.destination);
    } else {
      this.setVolume(volumePercent);
    }
    return this.context;
  }

  private scheduleRestore(): void {
    this.restoreTimer = setTimeout(() => {
      this.restoreTimer = null;
      this.isDucking.set(false);
    }, 250);
  }
}
