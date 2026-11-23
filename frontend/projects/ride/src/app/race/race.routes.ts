import type { Routes } from '@angular/router';
import {
  GHOST_API,
  MAPS_KEY,
  MONOTONIC_TIME,
  HttpProgressApi,
  PROGRESS_API,
  RIDE_HUB_CLIENT,
  RIDE_SOUND,
  SCREEN_WAKE_LOCK,
  SignalRRideHubClient,
  WORLD_RENDERER,
} from '@telo/api';
import { BrowserScreenWakeLock, MapsKeyStore, NoBestRides, WebAudioRideSound } from '@telo/domain';
import { openMapGuard } from '../maps/open-map.guard';
import { provideMaps } from '../maps/provide-maps';

/**
 * The race's route, loaded with it and opened only for a map open to the rider: the map catalogue's client and the
 * rider's progress (the app cache's last answer when the backend cannot be reached), the finished rides' client,
 * the monotonic clock the race runs on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3), ride sound and the
 * world's renderer loader, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides the race itself, which
 * goes when the rider leaves.
 */
export const raceRoutes: Routes = [
  {
    path: '',
    title: 'Race · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, from the backend (L2-040, L2-041).
      { provide: PROGRESS_API, useClass: HttpProgressApi },
      // No ride has a best until rides are recorded (10.1) and a best's trace kept (11.2).
      { provide: GHOST_API, useClass: NoBestRides },
      { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
      // The ride hub's client, whose SignalR library is imported only when a riders-online race joins its session.
      { provide: RIDE_HUB_CLIENT, useClass: SignalRRideHubClient },
      { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
      // Ride sound, made in the browser from the rider's pedalling while Settings has it on (L2-163).
      { provide: RIDE_SOUND, useClass: WebAudioRideSound },
      // The rider's Google Maps Platform key, on this device only (L2-066 AC3).
      { provide: MAPS_KEY, useClass: MapsKeyStore },
      // The world's renderer, imported with the world library and Three.js only when the race draws its world (ADR 0030).
      {
        provide: WORLD_RENDERER,
        useValue: () => import('@telo/world').then((world) => world.loadWorldRenderer()),
      },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-page'),
  },
];
