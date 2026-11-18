import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { type Machine, MACHINE_API } from '@wattzup/api';
import { LiveStateService } from '../../core/live-state.service';
import { MachineHistoryStore } from '../../core/machine-history.store';
import {
  cardStatus,
  isNotFound,
  machineCardView,
  nearbyHeading,
} from '../../core/machine-page-view';
import { Alert, Icon, MachineCard } from '@wattzup/components';

type PickAlert = 'failed' | 'workout-active';

/** Route `/machine`: pick the bike or the Stride; picking connects at once (L2-073). */
@Component({
  selector: 'wz-machine-page',
  imports: [Alert, Icon, MachineCard, RouterLink],
  templateUrl: './machine-page.html',
  styleUrl: './machine-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachinePage {
  private readonly live = inject(LiveStateService);
  private readonly machines = inject(MACHINE_API);
  private readonly router = inject(Router);
  private readonly history = inject(MachineHistoryStore).load();
  private readonly today = new Date();

  protected readonly state = this.live.state;
  protected readonly loading = computed(() => this.state() === null);
  protected readonly picked = signal<Machine | null>(null);
  /** The scan error number when the rider picked: only a later one counts. */
  private readonly pickedAt = signal(0);
  /** The picked machine's scan reported nothing since the pick (L2-073 AC7). */
  protected readonly failed = computed(() => {
    const error = this.live.scanError();
    const picked = this.picked();
    return !!picked && !!error && error.seq > this.pickedAt() && isNotFound(picked, error);
  });
  protected readonly alert = signal<PickAlert | null>(null);
  protected readonly connecting = computed(() => this.picked() !== null && !this.failed());

  protected readonly heading = computed(() => nearbyHeading(this.state()));
  protected readonly noneNearby = computed(() => this.state()?.nearby.length === 0);
  protected readonly bike = computed(() =>
    machineCardView('bike', this.state(), this.history, this.today),
  );
  protected readonly treadmill = computed(() =>
    machineCardView('treadmill', this.state(), this.history, this.today),
  );
  protected readonly bikeStatus = computed(() => cardStatus('bike', this.picked(), this.failed()));
  protected readonly treadmillStatus = computed(() =>
    cardStatus('treadmill', this.picked(), this.failed()),
  );

  constructor() {
    this.live.ensureStarted();
    // Treadmill support off: the machine page is not reachable (L2-073 AC11, L2-075 AC6).
    effect(() => {
      if (this.state()?.treadmill_enabled === false) {
        void this.router.navigateByUrl('/setup', { replaceUrl: true });
      }
    });
    effect(() => {
      const picked = this.picked();
      const state = this.state();
      if (!picked) return;
      if (state?.machine === picked && state.ble === 'connected') {
        // The bike lands on the class library, the treadmill on setup (L2-073 criterion 6).
        void this.router.navigate([picked === 'bike' ? '/classes' : '/setup']);
      }
    });
  }

  protected async pick(machine: Machine): Promise<void> {
    this.alert.set(null);
    this.pickedAt.set(this.live.scanError()?.seq ?? 0);
    this.picked.set(machine);
    try {
      await this.machines.choose(machine);
    } catch (e) {
      this.picked.set(null);
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      const workoutActive =
        e instanceof HttpErrorResponse && e.status === 409 && e.error?.code === 'workout_active';
      this.alert.set(workoutActive ? 'workout-active' : 'failed');
    }
  }
}
