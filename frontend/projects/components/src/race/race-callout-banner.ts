import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { RaceCallout } from '@telo/api';

/**
 * High-contrast, saddle-readable race announcer callout banner (docs/mocks/pages/race/announcer.html,
 * L2-172, L2-174 AC3). Renders callout text strictly as plain text and adapts across XS-XL viewports.
 */
@Component({
  selector: 'wz-race-callout-banner',
  templateUrl: './race-callout-banner.html',
  styleUrl: './race-callout-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCalloutBanner {
  readonly callout = input.required<RaceCallout>();
  readonly muted = input(false);
  readonly muteToggled = output<void>();
}
