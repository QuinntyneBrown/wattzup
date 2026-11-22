import type { Routes } from '@angular/router';
import { HttpProgressApi, HttpRaceQueueApi, PROGRESS_API, RACE_QUEUE_API } from '@telo/api';
import { provideMaps } from '../maps/provide-maps';
import { openMapGuard } from '../maps/open-map.guard';

/**
 * Race Setup's route, loaded with it, opened only for a map open to the rider: the map catalogue's client and the rider's progress are bound here, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes
 * when the rider leaves.
 */
export const raceSetupRoutes: Routes = [
  {
    path: '',
    title: 'Race Setup · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, from the backend (L2-040, L2-041).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
      // The riders queuing for Riders online, over HTTP: Race Setup holds no hub connection (L2-048 AC3, L2-120 AC4).
      { provide: RACE_QUEUE_API, useClass: HttpRaceQueueApi },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-setup-page'),
  },
];
