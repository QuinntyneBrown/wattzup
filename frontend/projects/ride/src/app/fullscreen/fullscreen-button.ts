import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FULLSCREEN } from '@telo/api';
import { FullscreenToggle } from '@telo/components';

/**
 * Full screen for a page header that takes it in a slot (L2-144): the design system's toggle, entering or leaving full
 * screen through the `Fullscreen` contract, and nothing at all where the browser has no Fullscreen API (AC2).
 */
@Component({
  selector: 'wz-fullscreen-button',
  templateUrl: './fullscreen-button.html',
  styleUrl: './fullscreen-button.scss',
  imports: [FullscreenToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenButton {
  protected readonly fullscreen = inject(FULLSCREEN);

  protected toggle(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }
}
