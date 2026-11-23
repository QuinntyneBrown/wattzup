import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BIKE_CONNECTION, type TelemetrySample } from '@telo/api';
import { EchelonFrameDecoder } from '../protocol/echelon-frame-decoder';
import { IndoorBikeDataDecoder } from '../protocol/indoor-bike-data-decoder';
import { PowerModel } from './power-model';
import { SpeedModel } from './speed-model';

/** How long cadence stays shown without a new reading before it, and the power it drives, read "—" (L2-020 AC5). */
export const CADENCE_TIMEOUT_MS = 5000;

/**
 * The bike's live metrics (docs/detailed-designs/bike/read-bike-telemetry). It decodes each of the connection's
 * notifications by the bike's kind and merges the samples into signals. A reported FTMS power or speed is used as it
 * is (L2-021 AC2, AC3); a metric the bike does not report falls back to its estimate (L2-022 AC1, L2-023 AC1), or to
 * `null` when the estimate's inputs are unknown (L2-021 AC4, L2-023 AC2). Five seconds without cadence blanks cadence
 * and power (L2-020 AC5). Provided by the screens that show readouts; it lets go of the notifications and its timer
 * when they are destroyed.
 */
@Injectable()
export class BikeTelemetry {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly cadenceRpm = signal<number | null>(null);
  private readonly level = signal<number | null>(null);
  private readonly reportedSpeed = signal<number | null>(null);
  private readonly reportedPower = signal<number | null>(null);
  private expiry: ReturnType<typeof setTimeout> | undefined;

  readonly cadence = this.cadenceRpm.asReadonly();
  readonly resistance = this.level.asReadonly();
  private readonly heart = signal<number | null>(null);
  private heartExpiry: ReturnType<typeof setTimeout> | undefined;
  /** An FTMS bike's own heart rate, `null` once it has reported none for 5 seconds (L2-030 AC1). */
  readonly heartRate = this.heart.asReadonly();
  readonly speedKmh = computed(() => {
    const cadence = this.cadenceRpm();
    return this.reportedSpeed() ?? (cadence === null ? null : SpeedModel.speedKmh(cadence));
  });
  readonly powerW = computed(
    () => this.reportedPower() ?? PowerModel.estimate(this.cadenceRpm(), this.level()),
  );
  readonly powerIsEstimate = computed(() => this.reportedPower() === null);

  constructor() {
    this.connection.frames.pipe(takeUntilDestroyed()).subscribe((bytes) => this.decode(bytes));
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.expiry);
      clearTimeout(this.heartExpiry);
    });
  }

  /**
   * Merges one sample. One that carries a ride metric (cadence, speed or power) replaces the reported speed and
   * power with its own, so a field the flags left out falls back to its estimate; one with only resistance changes
   * resistance alone. Cadence restarts the 5-second timer.
   */
  accept(sample: TelemetrySample): void {
    if (sample.resistance !== undefined) this.level.set(sample.resistance);
    if (sample.heartRate !== undefined) this.acceptHeartRate(sample.heartRate);
    const { cadence, speedKmh, powerW } = sample;
    if (cadence === undefined && speedKmh === undefined && powerW === undefined) return;
    this.reportedSpeed.set(speedKmh ?? null);
    this.reportedPower.set(powerW ?? null);
    if (cadence === undefined) return;
    this.cadenceRpm.set(cadence);
    clearTimeout(this.expiry);
    this.expiry = setTimeout(() => this.expireCadence(), CADENCE_TIMEOUT_MS);
  }

  private decode(bytes: Uint8Array): void {
    const decoder =
      this.connection.bike()?.kind === 'ftms' ? IndoorBikeDataDecoder : EchelonFrameDecoder;
    const sample = decoder.decode(bytes, Date.now());
    if (sample) this.accept(sample);
  }

  private acceptHeartRate(bpm: number): void {
    this.heart.set(bpm);
    clearTimeout(this.heartExpiry);
    this.heartExpiry = setTimeout(() => this.heart.set(null), CADENCE_TIMEOUT_MS);
  }

  private expireCadence(): void {
    this.cadenceRpm.set(null);
    this.reportedPower.set(null);
  }
}
