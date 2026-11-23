import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** What the card shows: the bike it offers, a search under way, or the bike paired. */
export type ConnectDeviceState = 'idle' | 'searching' | 'paired';

/**
 * The device card on Connect Bike (design-system block connect-device): the bike's name and identifier, a spinner with
 * "Looking for bikes nearby…" while searching, and a check once paired.
 */
@Component({
  selector: 'wz-connect-device',
  templateUrl: './connect-device.html',
  styleUrl: './connect-device.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'connect-device' },
})
export class ConnectDevice {
  readonly name = input.required<string>();
  /** The identifier under the name ("EX5S-0bf669f1"), once the bike is known. */
  readonly identifier = input<string | null>(null);
  readonly state = input<ConnectDeviceState>('idle');
}
