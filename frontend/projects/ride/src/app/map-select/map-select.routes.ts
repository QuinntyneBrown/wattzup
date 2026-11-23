import type { Routes } from '@angular/router';
import { HttpProgressApi, PROGRESS_API } from '@telo/api';
import { provideMaps } from '../maps/provide-maps';

/**
 * Map Select's route, loaded with it: the catalogue client and the rider's progress are bound here, so their code stays
 * out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes when
 * the rider leaves.
 */
export const mapSelectRoutes: Routes = [
  {
    path: '',
    title: 'Maps · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, from the backend (L2-040, L2-041).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
    ],
    loadComponent: () => import('./map-select-page'),
  },
];
