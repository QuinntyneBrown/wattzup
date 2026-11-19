import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { WorkoutSnapshot } from '@wattzup/api';
import type { RideViewState } from '../../core/ride-view-state';
import { statusBadge } from '../../core/segment-labels';
import { liveConnectionStatus } from '../../core/connection-status';
import { CountdownService } from '../../core/countdown.service';
import { CueService } from '../../core/cue.service';
import { formatDuration } from '../../core/format-duration';
import { MotionPreference } from '../../core/motion-preference';
import { DialogLauncher } from '../../core/dialog-launcher';
import { RideActions } from '../../core/ride-actions';
import { ThemeService } from '../../core/theme.service';
import { Icon, RideClock, StatusLine } from '@wattzup/components';

/** The ride dashboard's app bar, in DOM order = Tab order (L2-041). */
@Component({
  selector: 'wz-app-bar',
  imports: [RouterLink, StatusLine, RideClock, Icon],
  templateUrl: './app-bar.html',
  styleUrl: './app-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBar {
  readonly workout = input<WorkoutSnapshot | null>(null);
  readonly view = input.required<RideViewState>();
  protected readonly actions = inject(RideActions);
  protected readonly dialogs = inject(DialogLauncher);
  protected readonly cues = inject(CueService);
  protected readonly theme = inject(ThemeService);
  protected readonly countdown = inject(CountdownService);
  protected readonly status = liveConnectionStatus();
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  protected readonly total = computed(() => {
    const w = this.workout();
    return w ? formatDuration(w.total_seconds) : null;
  });

  protected readonly badge = computed(() => {
    const w = this.workout();
    return w ? statusBadge(w.status) : null;
  });
  /** Resume shows while the rider has paused the ride (L2-046). */
  protected readonly paused = computed(() => this.workout()?.status === 'paused');
}
