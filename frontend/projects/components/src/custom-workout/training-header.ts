import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FullscreenToggle } from '../fullscreen-toggle/fullscreen-toggle';
import { Lockup } from '../lockup/lockup';

/**
 * Custom workout's header (docs/mocks/pages/custom-setup/, L2-094 AC1): the lockup, the bike's name, the page's Close
 * link (an `a[wz-training-close]`, projected) and Full screen.
 */
@Component({
  selector: 'header[wz-training-header]',
  imports: [FullscreenToggle, Lockup],
  templateUrl: './training-header.html',
  styleUrl: './training-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'training-header' },
})
export class TrainingHeader {
  /** The bike's name; absent while no bike is known. */
  readonly bike = input<string | null>(null);
  readonly fullscreen = input.required<boolean>();
  readonly fullscreenToggled = output<void>();
}
