import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
} from '@angular/core';
import { CommandFeedbackService } from '../../core/command-feedback.service';
import { DialogLauncher } from '../../core/dialog-launcher';
import { RideActions } from '../../core/ride-actions';
import { rideOverlayText } from '../../core/ride-overlay-text';
import { commandLogView } from '../../core/command-log-view';
import { CueDirector } from '../../core/cue-director';
import { epochClock } from '../../core/local-time';
import { metricItems } from '../../core/metric-items';
import { stripOf } from '../../core/plan-strip';
import { CountdownService } from '../../core/countdown.service';
import { LiveStateService } from '../../core/live-state.service';
import { formatLive } from '../../core/metric-format';
import { powerDelta } from '../../core/power-delta';
import { estimateWatts } from '../../core/plan-expansion';
import { ResistanceCommandService } from '../../core/resistance-command.service';
import { controlsState, planNote, stepLevel } from '../../core/resistance-controls';
import { resistanceView } from '../../core/resistance-view';
import { rideViewState } from '../../core/ride-view-state';
import {
  PlanNote,
  LevelPicker,
  LevelControl,
  EmptyState,
  Readout,
  type MainView,
  MainViewTabs,
  CommandLog,
  MetricList,
  PhaseBanner,
  PlanStrip,
} from '@wattzup/components';
import { AppBar } from '../app-bar/app-bar';
import { ConnectionBanner } from '../connection-banner/connection-banner';
import { RideOverlay } from '../ride-overlay/ride-overlay';
import { RideTrace } from '../ride-trace/ride-trace';
import { Interval } from '../interval/interval';
import { VideoSync } from '../../core/video-sync.service';
import { RideVideo } from '../ride-video/ride-video';

/** Route `/`: the ride dashboard. */
@Component({
  selector: 'wz-ride-page',
  imports: [
    AppBar,
    NgTemplateOutlet,
    CommandLog,
    ConnectionBanner,
    EmptyState,
    RideOverlay,
    RideTrace,
    Interval,
    LevelControl,
    LevelPicker,
    MetricList,
    PhaseBanner,
    PlanNote,
    Readout,
    MainViewTabs,
    PlanStrip,
    RideVideo,
  ],
  providers: [CountdownService, CueDirector, VideoSync],
  templateUrl: './ride-page.html',
  styleUrl: './ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RidePage {
  protected readonly live = inject(LiveStateService);
  protected readonly state = this.live.state;
  protected readonly workout = computed(() => this.state()?.workout ?? null);
  /** The ride-along video of the workout, or null (L2-076 AC1). */
  protected readonly video = computed(() => this.workout()?.plan.video ?? null);
  /** Which tab shows; back to Video for each new workout, kept until it ends (L2-076 AC2). */
  protected readonly mainView = linkedSignal<string | null, MainView>({
    source: computed(() => (this.workout() ? JSON.stringify(this.workout()!.plan) : null)),
    computation: () => 'video',
  });
  private readonly videoSync = inject(VideoSync);
  /** A player error selects Power vs. plan; the ride carries on (L2-076 AC7). */
  private readonly onVideoError = effect(() => {
    if (this.videoSync.failed()) untracked(() => this.mainView.set('chart'));
  });
  protected readonly view = computed(() =>
    rideViewState(this.state(), this.live.connection(), this.live.loadFailed()),
  );

  protected readonly power = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    const target = w
      ? (s?.target_power ?? (segment ? estimateWatts(segment.cadence, segment.level) : null))
      : null;
    return {
      value: formatLive(s?.power ?? null),
      target,
      delta: powerDelta(s?.power ?? null, target, w?.status ?? null),
    };
  });

  protected readonly cadence = computed(() => {
    const s = this.state();
    const w = s?.workout;
    const segment = w?.segments[w.segment];
    return {
      value: formatLive(s?.cadence ?? null),
      sub: segment ? `Aim for ${segment.cadence}` : 'No cadence goal',
    };
  });

  protected readonly commands = inject(ResistanceCommandService);
  protected readonly actions = inject(RideActions);
  protected readonly dialogs = inject(DialogLauncher);
  protected readonly overlay = computed(() => {
    const kind = this.view().overlay;
    const s = this.state();
    return kind && s ? rideOverlayText(kind, s) : null;
  });
  protected readonly resistance = computed(() => resistanceView(this.state()));
  protected readonly resistanceControls = computed(() =>
    controlsState(this.state(), this.view().commandsEnabled),
  );
  protected readonly planNote = computed(() => {
    const note = this.view().controlsNote;
    return note ? { text: note, backToPlan: false } : planNote(this.state());
  });

  protected readonly cues = inject(CueDirector);
  protected readonly metrics = computed(() => metricItems(this.state()));
  protected readonly commandLog = computed(() =>
    commandLogView(this.state()?.commands ?? [], epochClock),
  );
  protected readonly strip = computed(() => {
    const w = this.workout();
    return w ? stripOf(w.segments, w.elapsed_seconds, w.total_seconds) : null;
  });

  protected stepResistance(delta: 1 | -1): void {
    void this.commands.set(stepLevel(this.state(), delta));
  }

  constructor() {
    inject(CommandFeedbackService).start();
    this.live.ensureStarted();
  }
}
