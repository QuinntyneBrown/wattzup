import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BIKE_CONNECTION, FULLSCREEN, type HiitPresetId, REMEMBERED_BIKE } from '@telo/api';
import {
  IntervalLadder,
  LevelSlider,
  PlanPreview,
  PresetChips,
  TrainingClose,
  TrainingHeader,
  TrainingModes,
  TrainingStepper,
  formatClock,
} from '@telo/components';
import { CUSTOM_WORKOUT_LIMITS as LIMITS, HIIT_PRESETS, presetOf } from '@telo/domain';
import { CustomWorkoutStore } from './custom-workout-store';

/**
 * Custom workout (docs/mocks/pages/custom-setup/, L2-094 to L2-097): the training header, "Set up your ride", the
 * training mode, then HIIT's plans, ladder, levels, warm-up and cool-down, or flat resistance's level, duration and
 * cadence goal.
 */
@Component({
  selector: 'wz-custom-workout-page',
  imports: [
    IntervalLadder,
    LevelSlider,
    PlanPreview,
    PresetChips,
    RouterLink,
    TrainingClose,
    TrainingHeader,
    TrainingModes,
    TrainingStepper,
  ],
  templateUrl: './custom-workout-page.html',
  styleUrl: './custom-workout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'custom-workout' },
})
export default class CustomWorkoutPage {
  protected readonly store = inject(CustomWorkoutStore);
  protected readonly fullscreen = inject(FULLSCREEN);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly remembered = inject(REMEMBERED_BIKE).get();

  protected readonly limits = LIMITS;
  protected readonly presets = HIIT_PRESETS;
  protected readonly clock = formatClock;
  protected readonly draft = this.store.draft;
  protected readonly bike = computed(
    () => (this.connection.bike() ?? this.remembered)?.name ?? null,
  );
  protected readonly title = computed(() => presetOf(this.draft().preset).title);

  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }

  protected pick(id: string): void {
    this.store.choosePreset(id as HiitPresetId);
  }
}
