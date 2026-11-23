import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { BikeStatusView } from '@telo/api';

/**
 * The bike status in the app header (element app-header__bike), shown from lg (L2-019 AC1, AC2): the bike's name with
 * hidden text a screen reader reads after it. Not connected, it turns red, swaps the bike for the Bluetooth-off icon
 * and takes the title "Bike not connected", so colour never carries the state alone.
 */
@Component({
  selector: 'wz-app-header-bike',
  templateUrl: './app-header-bike.html',
  styleUrl: './app-header-bike.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-header__bike',
    '[class.app-header__bike--off]': 'off()',
    '[attr.title]': 'status().title',
  },
})
export class AppHeaderBike {
  readonly status = input.required<BikeStatusView>();

  protected readonly off = computed(() => this.status().tone === 'alert');
}
