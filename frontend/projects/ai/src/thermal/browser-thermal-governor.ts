import { signal } from '@angular/core';
import type { ComputePressureState, ThermalGovernor } from '@telo/api';

const RECOVERY_MS = 30_000;

export interface PressureRecordLike {
  readonly state: ComputePressureState;
}

export interface PressureObserverLike {
  observe(source: 'cpu', options?: { sampleInterval?: number }): Promise<void>;
  disconnect(): void;
}

export type PressureObserverFactory = (
  callback: (records: readonly PressureRecordLike[]) => void,
) => PressureObserverLike | null;

function defaultObserverFactory(
  callback: (records: readonly PressureRecordLike[]) => void,
): PressureObserverLike | null {
  const Ctor = (globalThis as Record<string, unknown>)['PressureObserver'] as
    | (new (cb: (records: readonly PressureRecordLike[]) => void) => PressureObserverLike)
    | undefined;
  if (typeof Ctor !== 'function') return null;
  try {
    return new Ctor(callback);
  } catch {
    return null;
  }
}

/**
 * Wraps the browser's Compute Pressure API (`PressureObserver`). Entering `serious` or `critical`
 * pauses live ONNX synthesis immediately and restores it only after 30 continuous seconds in
 * `nominal` or `fair` (L2-173 AC3).
 */
export class BrowserThermalGovernor implements ThermalGovernor {
  private readonly pressureState = signal<ComputePressureState>('nominal');
  private readonly liveAllowed = signal(true);
  private observer: PressureObserverLike | null = null;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pressure = this.pressureState.asReadonly();
  readonly allowLiveSynthesis = this.liveAllowed.asReadonly();

  constructor(private readonly createObserver: PressureObserverFactory = defaultObserverFactory) {}

  start(): void {
    if (this.observer) return;
    this.observer = this.createObserver((records) => {
      const latest = records[records.length - 1];
      if (latest) this.handlePressure(latest.state);
    });
    if (this.observer) {
      void this.observer.observe('cpu', { sampleInterval: 1000 }).catch(() => {
        this.observer?.disconnect();
        this.observer = null;
      });
    }
  }

  handlePressure(state: ComputePressureState): void {
    this.pressureState.set(state);
    if (state === 'serious' || state === 'critical') {
      this.clearRecoveryTimer();
      this.liveAllowed.set(false);
      return;
    }
    if (!this.liveAllowed() && this.recoveryTimer === null) {
      this.recoveryTimer = setTimeout(() => {
        this.recoveryTimer = null;
        if (this.pressureState() === 'nominal' || this.pressureState() === 'fair') {
          this.liveAllowed.set(true);
        }
      }, RECOVERY_MS);
    }
  }

  stop(): void {
    this.clearRecoveryTimer();
    this.observer?.disconnect();
    this.observer = null;
  }

  private clearRecoveryTimer(): void {
    if (this.recoveryTimer !== null) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
}
