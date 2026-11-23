import type { Routes } from '@angular/router';
import { HttpProgressApi, PROGRESS_API } from '@telo/api';
import { provideClasses } from '../classes/provide-classes';

/**
 * The Class Library's route, loaded with it: the catalogue client and the rider's progress are bound here, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes
 * when the rider leaves.
 */
export const classLibraryRoutes: Routes = [
  {
    path: '',
    title: 'Classes · Telo Ride',
    providers: [
      provideClasses(),
      // The rider level, from the backend, which opens each class tier (L2-043, L2-044).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
    ],
    loadComponent: () => import('./class-library-page'),
  },
];
