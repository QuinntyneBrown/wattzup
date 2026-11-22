import type { Routes } from '@angular/router';
import { provideClassVideo } from '../classes/provide-class-video';
import { CustomWorkoutStore } from './custom-workout-store';

/**
 * Custom workout's routes, loaded with them. The parent provides the draft's store, so setup and, from slice 21.3, the
 * ride share one draft, which goes when the rider leaves both (AGENTS.md, scope state to its use).
 */
export const customWorkoutRoutes: Routes = [
  {
    path: '',
    // The draft, and the video's player, whose code loads only when the preview asks for it (AGENTS.md).
    providers: [CustomWorkoutStore, provideClassVideo()],
    children: [
      {
        path: '',
        title: 'Custom workout · Telo Ride',
        loadComponent: () => import('./custom-workout-page'),
      },
    ],
  },
];
