import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Full screen in a page header (L2-144 AC1): the design system's edge icon button, named for what it does next, "Full
 * screen" or "Exit full screen", with the expand or the minimize corners. It sets no `aria-pressed`, since its name
 * already changes with the state. The page leaves it out where the browser has no Fullscreen API (AC2).
 */
@Component({
  selector: 'wz-fullscreen-toggle',
  templateUrl: './fullscreen-toggle.html',
  styleUrl: './fullscreen-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenToggle {
  /** Whether the app is in full screen now. */
  readonly active = input.required<boolean>();
  /** Pressed: the page enters or leaves full screen. */
  readonly toggled = output<void>();
}
