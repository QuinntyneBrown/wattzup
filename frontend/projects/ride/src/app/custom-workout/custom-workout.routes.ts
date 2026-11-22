import type { Routes } from '@angular/router';
import {
  CUSTOM_WORKOUT_API,
  HttpCustomWorkoutApi,
  MONOTONIC_TIME,
  SCREEN_WAKE_LOCK,
} from '@telo/api';
import { BrowserScreenWakeLock } from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { CustomWorkoutStore } from './custom-workout-store';
import { provideInertBehindDialogs } from '../dialogs/provide-inert-behind-dialogs';

/**
 * Custom workout's routes, loaded with them. The parent provides the draft's store, so setup and the ride share one
 * draft, which goes when the rider leaves both (AGENTS.md, scope state to its use).
 */
export const customWorkoutRoutes: Routes = [
  {
    path: '',
    // The draft, saved on the rider's account, and the video's player, whose code loads only when the preview or the
    // ride asks for it (AGENTS.md).
    providers: [
      { provide: CUSTOM_WORKOUT_API, useClass: HttpCustomWorkoutApi },
      CustomWorkoutStore,
      provideClassVideo(),
    ],
    children: [
      {
        path: '',
        title: 'Custom workout · Telo Ride',
        loadComponent: () => import('./custom-workout-page'),
      },
      {
        path: 'ride',
        title: 'Custom ride · Telo Ride',
        // The monotonic clock the ride runs on (L2-133 AC1) and the screen wake lock (AC3), with the ride; the app goes
        // inert behind its leave dialog (L2-141 AC3).
        providers: [
          { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
          { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
          provideInertBehindDialogs(),
        ],
        loadComponent: () => import('../custom-ride/custom-ride-page'),
      },
    ],
  },
];
