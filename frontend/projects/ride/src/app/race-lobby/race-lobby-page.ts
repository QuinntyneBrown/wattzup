import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FULLSCREEN } from '@telo/api';
import { FullscreenToggle, Lockup, StartClock, StartGrid } from '@telo/components';
import { ResistanceController } from '@telo/domain';
import { LobbyStore } from './lobby-store';

/**
 * The race lobby at `/race/:mapId/lobby` (docs/mocks/pages/race-lobby/, L2-051): the header with the map, Leave and
 * Full screen, the start clock and the start grid, the clock beside the grid from lg. It provides its store and the
 * target resistance, which go when the rider leaves.
 */
@Component({
  selector: 'wz-race-lobby-page',
  imports: [FullscreenToggle, Lockup, RouterLink, StartClock, StartGrid],
  templateUrl: './race-lobby-page.html',
  styleUrl: './race-lobby-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LobbyStore, ResistanceController],
})
export default class RaceLobbyPage {
  protected readonly store = inject(LobbyStore);
  protected readonly fullscreen = inject(FULLSCREEN);

  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }
}
