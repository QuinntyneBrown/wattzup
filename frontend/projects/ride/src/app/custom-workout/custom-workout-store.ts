import { Injectable, signal } from '@angular/core';
import type { CustomWorkoutDraft, HiitPresetId, TrainingMode } from '@telo/api';
import {
  addRound,
  chooseMode,
  choosePreset,
  makeRoundsSame,
  newCustomWorkout,
  removeRound,
  setFlatLevel,
  setRecoverLevel,
  setWorkLevel,
  stepCoolDown,
  stepEffort,
  stepFlatCadence,
  stepFlatMinutes,
  stepRecovery,
  stepWarmUp,
} from '@telo/domain';

/** The custom workout being set up (L2-094 to L2-097): the draft, and one method per edit, each a rule of the domain. */
@Injectable()
export class CustomWorkoutStore {
  private readonly state = signal<CustomWorkoutDraft>(newCustomWorkout());
  readonly draft = this.state.asReadonly();

  chooseMode(mode: TrainingMode): void {
    this.state.update((d) => chooseMode(d, mode));
  }

  choosePreset(id: HiitPresetId): void {
    this.state.update((d) => choosePreset(d, id));
  }

  stepEffort(index: number, direction: 1 | -1): void {
    this.state.update((d) => stepEffort(d, index, direction));
  }

  stepRecovery(index: number, direction: 1 | -1): void {
    this.state.update((d) => stepRecovery(d, index, direction));
  }

  addRound(): void {
    this.state.update(addRound);
  }

  removeRound(index: number): void {
    this.state.update((d) => removeRound(d, index));
  }

  makeRoundsSame(): void {
    this.state.update(makeRoundsSame);
  }

  setWorkLevel(value: number): void {
    this.state.update((d) => setWorkLevel(d, value));
  }

  setRecoverLevel(value: number): void {
    this.state.update((d) => setRecoverLevel(d, value));
  }

  stepWarmUp(direction: 1 | -1): void {
    this.state.update((d) => stepWarmUp(d, direction));
  }

  stepCoolDown(direction: 1 | -1): void {
    this.state.update((d) => stepCoolDown(d, direction));
  }

  setFlatLevel(value: number): void {
    this.state.update((d) => setFlatLevel(d, value));
  }

  stepFlatMinutes(direction: 1 | -1): void {
    this.state.update((d) => stepFlatMinutes(d, direction));
  }

  stepFlatCadence(direction: 1 | -1): void {
    this.state.update((d) => stepFlatCadence(d, direction));
  }
}
