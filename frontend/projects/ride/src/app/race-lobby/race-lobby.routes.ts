import type { Routes } from '@angular/router';
import {
  HttpProgressApi,
  MONOTONIC_TIME,
  PROGRESS_API,
  RIDE_HUB_CLIENT,
  SignalRRideHubClient,
} from '@telo/api';
import { openMapGuard } from '../maps/open-map.guard';
import { provideMaps } from '../maps/provide-maps';

/**
 * The race lobby's route, loaded with it and opened only for a map open to the rider: the map catalogue's client and
 * the rider's progress (for their level) are bound here, so their code stays out of the other screens' chunks (AGENTS.md,
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
      // The clock the live session measures its offset on, and the ride hub's client, whose SignalR library is imported
      // only when a riders-online lobby joins its session (L2-120).
      { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
      { provide: RIDE_HUB_CLIENT, useClass: SignalRRideHubClient },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-lobby-page'),
  },
];
