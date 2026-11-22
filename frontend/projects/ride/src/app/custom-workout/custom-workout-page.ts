import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  VideoSync,
  type VideoFrameDrawn,
  formatClock,
} from '@telo/components';
import { CUSTOM_WORKOUT_LIMITS as LIMITS, HIIT_PRESETS, presetOf } from '@telo/domain';
import { CustomWorkoutStore } from './custom-workout-store';
import { VideoPreviewPlayer } from './video-preview-player';

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
    VideoSync,
  ],
  providers: [VideoPreviewPlayer],
  templateUrl: './custom-workout-page.html',
  styleUrl: './custom-workout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'custom-workout' },
})
export default class CustomWorkoutPage {
  protected readonly store = inject(CustomWorkoutStore);
  private readonly player = inject(VideoPreviewPlayer);
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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Start ride opens the ride, which rides this draft's plan (L2-099 AC4). */
  protected start(): void {
    this.store.save();
    void this.router.navigate(['ride'], { relativeTo: this.route });
  }

  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }

  constructor() {
    // The frame goes with the switch or a link that is not YouTube's: its player goes with it (L2-098).
    effect(() => {
      if (this.store.videoId() === null) this.player.release();
    });
  }

  /** Parks the preview at the offset in the frame drawn for its video (L2-098 AC1). */
  protected park(frame: VideoFrameDrawn): void {
    this.player.load(frame.host, frame.videoId, this.store.draft().video.offset);
  }

  /** The offset becomes the preview's time, to a tenth (L2-098 AC4). */
  protected useCurrentTime(): void {
    const time = this.player.currentTime();
    if (time !== null) this.store.setOffset(time);
  }

  /** Seeks the preview to the offset (L2-098 AC4). */
  protected check(): void {
    this.player.seekTo(this.store.draft().video.offset);
  }

  protected pick(id: string): void {
    this.store.choosePreset(id as HiitPresetId);
  }
}
