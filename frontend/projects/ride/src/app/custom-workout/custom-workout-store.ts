import { Injectable, computed, signal } from '@angular/core';
import type { CustomWorkoutDraft, HiitPresetId, TrainingMode } from '@telo/api';
import {
  addRound,
  chooseMode,
  choosePreset,
  customWorkoutPreview,
  expandCustomWorkout,
  makeRoundsSame,
  newCustomWorkout,
  parseOffset,
  removeRound,
  setFlatLevel,
  setOffset,
  setRecoverLevel,
  setVideoLink,
  setVideoOn,
  setWorkLevel,
  stepCoolDown,
  stepEffort,
  stepFlatCadence,
  stepFlatMinutes,
  stepOffset,
  stepRecovery,
  stepWarmUp,
  VIDEO_LINK_ERROR,
  formatOffset,
  validatePlan,
  videoFact,
  videoOf,
} from '@telo/domain';

/**
 * The custom workout being set up (L2-094 to L2-097): the draft, and one method per edit, each a rule of the domain;
 * the plan it expands to, the rules that plan breaks and what "Your ride" reads of it, all following every edit at once
 * (L2-099, L2-100).
 */
@Injectable()
export class CustomWorkoutStore {
  private readonly state = signal<CustomWorkoutDraft>(newCustomWorkout());
  readonly draft = this.state.asReadonly();
  readonly plan = computed(() => expandCustomWorkout(this.draft()));
  readonly problems = computed(() => validatePlan(this.plan()));
  readonly preview = computed(() =>
    customWorkoutPreview(this.draft(), this.plan(), videoFact(this.draft())),
  );
  /** The video the preview and the ride play, while the switch is on and the link is YouTube's. */
  readonly videoId = computed(() => videoOf(this.draft()));
  /** The link's message while the switch is on and the link is typed but not YouTube's (L2-098 AC2). */
  readonly videoError = computed(() => {
    const { on, link } = this.draft().video;
    return on && link.trim() !== '' && this.videoId() === null ? VIDEO_LINK_ERROR : null;
  });
  readonly offset = computed(() => formatOffset(this.draft().video.offset));
  /**
   * Why Start ride is off (L2-100 AC3, L2-099 AC5): a plan whose total is not 1 to 180 minutes, one with a segment under
   * 5 seconds or a level outside 1 to 32, or a video link that is not YouTube's; `null` when the ride can start.
   */
  readonly blocked = computed(() => {
    const problems = this.problems();
    if (problems.includes('total-out-of-range')) return 'The ride needs to last 1 to 180 minutes.';
    if (problems.length > 0) return 'Every interval needs 5 seconds or more at level 1 to 32.';
    return this.videoError() === null ? null : 'Fix the YouTube link to start.';
  });

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

  setVideoOn(on: boolean): void {
    this.state.update((d) => setVideoOn(d, on));
  }

  setVideoLink(link: string): void {
    this.state.update((d) => setVideoLink(d, link));
  }

  stepOffset(direction: 1 | -1): void {
    this.state.update((d) => stepOffset(d, direction));
  }

  setOffset(seconds: number): void {
    this.state.update((d) => setOffset(d, seconds));
  }

  /** A typed offset; one that does not read as a time leaves the offset as it was. */
  typeOffset(text: string): void {
    const seconds = parseOffset(text);
    if (seconds !== null) this.setOffset(seconds);
  }
}
