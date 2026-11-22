import type { Routes } from '@angular/router';
import { FULLSCREEN, HttpProgressApi, PROGRESS_API } from '@telo/api';
import { BrowserFullscreen } from '@telo/domain';
import { openMapGuard } from '../maps/open-map.guard';
import { provideMaps } from '../maps/provide-maps';

/**
 * The race lobby's route, loaded with it and opened only for a map open to the rider: the map catalogue's client and
 * the rider's progress (for their level) and Full screen are bound here, so their code stays out of the other screens' chunks (AGENTS.md,
 * lazy loading first). The page provides its own store, which goes when the rider leaves.
 */
export const raceLobbyRoutes: Routes = [
  {
    path: '',
    title: 'Race lobby · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, from the backend (L2-040, L2-041).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
      // The header's Full screen (L2-051 AC1, L2-144).
      { provide: FULLSCREEN, useClass: BrowserFullscreen },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-lobby-page'),
  },
];
