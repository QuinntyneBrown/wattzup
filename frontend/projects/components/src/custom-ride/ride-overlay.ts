import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '../button/button';

/** Why the custom ride cannot run: no bike yet, the bike stopped answering, or Bluetooth is off (L2-105, L2-106). */
export type RideOverlayKind = 'connect' | 'lost' | 'bluetooth-off';

/**
 * The panel over the custom ride's telemetry (design-system block ride-overlay) that says why the ride cannot run and
 * offers what fixes it: Connect bike, Reconnect or Check again, emitted as `acted`. The bike's name is data, rendered
 * as text; with none known the copy says "your bike".
 */
@Component({
  selector: 'wz-ride-overlay',
  imports: [Button],
  templateUrl: './ride-overlay.html',
  styleUrl: './ride-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ride-overlay',
    '[class.ride-overlay--lost]': 'kind() === "lost"',
  },
})
export class RideOverlay {
  readonly kind = input.required<RideOverlayKind>();
  readonly bikeName = input<string | null>(null);
  /** The ride's clock where the bike was lost, as "6:52". */
  readonly savedAt = input('0:00');
  readonly acted = output<void>();

  protected readonly bike = computed(() => this.bikeName() ?? 'your bike');
  protected readonly lostBike = computed(() => this.bikeName() ?? 'Your bike');
}
