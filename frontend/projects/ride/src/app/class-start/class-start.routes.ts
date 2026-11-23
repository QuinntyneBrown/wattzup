import type { Routes } from '@angular/router';
import { HttpProgressApi, PROGRESS_API } from '@telo/api';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideClasses } from '../classes/provide-classes';
import { classUnlockedGuard } from './class-unlocked.guard';

/**
 * Class Start's route, loaded with it, opened only for a class the rider's level has opened: the catalogue client, the
 * rider's progress and the video's player are bound here, so their code stays
 * out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes when the rider leaves.
 */
export const classStartRoutes: Routes = [
  {
    path: '',
    title: 'Class Start · Telo Ride',
    providers: [
      provideClasses(),
      provideClassVideo(),
      // The rider level, from the backend, which opens each class tier (L2-043, L2-044).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
    ],
    canActivate: [classUnlockedGuard],
    loadComponent: () => import('./class-start-page'),
  },
];
