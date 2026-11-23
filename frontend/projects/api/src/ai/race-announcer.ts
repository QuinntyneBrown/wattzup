import { InjectionToken, signal, type Signal } from '@angular/core';
import type { AnnouncerVoicePreset } from '../settings/ride-settings';

/** Categories of race moments announced by the play-by-play director (L2-170 AC1). */
export type RaceCalloutKind =
  'countdown' | 'overtake' | 'climb' | 'cadenceLock' | 'ghostSplit' | 'finalSprint' | 'finish';

/** One prioritized, sanitized race callout emitted to audio and captions (L2-170, L2-172). */
export interface RaceCallout {
  readonly id: string;
  readonly kind: RaceCalloutKind;
  readonly badge: string;
  readonly text: string;
  readonly priority: number;
  readonly createdAtMs: number;
}

/** Live race metrics sampled by the announcer director (L2-170 AC1, AC6). */
export interface RaceAnnouncerSnapshot {
  readonly running: boolean;
  readonly paused: boolean;
  readonly countdownSeconds: number | null;
  readonly position: number;
  readonly totalRiders: number;
  readonly aheadName: string | null;
  readonly aheadGapMeters: number | null;
  readonly targetResistance: number;
  readonly cadenceRpm: number;
  readonly targetCadenceRpm: number;
  readonly ghostGapMeters: number | null;
  readonly stageIndex: number;
  readonly stageTitle: string;
  readonly remainingMeters: number;
  readonly remainingSeconds: number;
  readonly finished: boolean;
}

/** Pre-race context used to pre-cache static clips during the lobby countdown (L2-171 AC1). */
export interface LobbyAnnouncerContext {
  readonly voice: AnnouncerVoicePreset;
}

/** Live race signal source bound when a race starts (L2-170). */
export interface RaceAnnouncerSource {
  readonly snapshot: Signal<RaceAnnouncerSnapshot>;
  readonly audioEnabled: Signal<boolean>;
  readonly captionsEnabled: Signal<boolean>;
  readonly voice: Signal<AnnouncerVoicePreset>;
  readonly volume: Signal<number>;
}

/** On-device race announcer contract (L1-028, ADR 0037). */
export interface RaceAnnouncer {
  readonly activeCallout: Signal<RaceCallout | null>;
  readonly ducking: Signal<boolean>;
  prepareLobby(context: LobbyAnnouncerContext): Promise<void>;
  start(source: RaceAnnouncerSource): void;
  pause(): void;
  resume(): void;
  mute(): void;
  stop(): void;
}

/** Status of the opt-in local ONNX voice pack stored in OPFS (L2-168). */
export type VoicePackStatus = 'absent' | 'downloading' | 'ready' | 'error';

export interface VoicePackState {
  readonly status: VoicePackStatus;
  readonly downloadedBytes: number;
  readonly totalBytes: number;
  readonly errorCode: 'network' | 'quota' | 'integrity' | 'unsupported' | null;
  readonly errorMessage: string | null;
}

/** Manages downloading, verifying, persisting, and deleting the voice pack in OPFS (L2-168, L2-174). */
export interface VoicePackStore {
  readonly state: Signal<VoicePackState>;
  readonly freedMegabytes: Signal<number | null>;
  refresh(): Promise<void>;
  download(): Promise<void>;
  cancel(): void;
  remove(): Promise<void>;
  dismissFreed(): void;
}

/** Compute pressure states reported by PressureObserver (L2-173 AC3). */
export type ComputePressureState = 'nominal' | 'fair' | 'serious' | 'critical';

/** Thermal auto-governor pausing live ONNX synthesis under serious/critical pressure (L2-173 AC3). */
export interface ThermalGovernor {
  readonly pressure: Signal<ComputePressureState>;
  readonly allowLiveSynthesis: Signal<boolean>;
  start(): void;
  stop(): void;
}

/** Zero-cost no-op implementation bound when the announcer is disabled (L2-171 AC4, L2-173 AC1). */
export class NoopRaceAnnouncer implements RaceAnnouncer {
  readonly activeCallout = signal<RaceCallout | null>(null).asReadonly();
  readonly ducking = signal(false).asReadonly();
  async prepareLobby(): Promise<void> {
    // Intentionally empty: zero resources allocated while disabled.
  }
  start(): void {
    // Intentionally empty.
  }
  pause(): void {
    // Intentionally empty.
  }
  resume(): void {
    // Intentionally empty.
  }
  mute(): void {
    // Intentionally empty.
  }
  stop(): void {
    // Intentionally empty.
  }
}

export const RACE_ANNOUNCER = new InjectionToken<RaceAnnouncer>('RACE_ANNOUNCER');
export const VOICE_PACK_STORE = new InjectionToken<VoicePackStore>('VOICE_PACK_STORE');
export const THERMAL_GOVERNOR = new InjectionToken<ThermalGovernor>('THERMAL_GOVERNOR');
