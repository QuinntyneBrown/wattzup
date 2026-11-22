import { inject, provideEnvironmentInitializer } from '@angular/core';
import type { Routes } from '@angular/router';
import {
  DISPLAY_PREFERENCES,
  FULLSCREEN,
  HttpRiderProgressApi,
  NETWORK_STATUS,
  PROGRESS_STORE,
  RIDE_SETTINGS,
  RIDER_PROGRESS_API,
} from '@telo/api';
import {
  BrowserDisplayPreferences,
  BrowserFullscreen,
  BrowserNetworkStatus,
  LocalRideSettingsStore,
} from '@telo/domain';
import { provideAppCache } from './app-cache/provide-app-cache';
import { provideBikeConnection } from './bike/provide-bike-connection';
import { rememberedBikeGuard } from './bike/remembered-bike.guard';
import { reconnectRememberedBikeGuard } from './bike/reconnect-remembered-bike.guard';
import { RiderProgressStore } from './progress/rider-progress-store';
import { authGuard } from './session/auth.guard';
import { provideSession } from './session/provide-session';

/**
 * Every screen, under one parent that provides the bike connection: one instance shared from Connect Bike to the ride,
 * loaded with the first screen instead of with the initial bundle (AGENTS.md, lazy loading first).
 */
export const rideRoutes: Routes = [
  {
    path: '',
    providers: [
      provideBikeConnection(),
      provideSession(),
      provideAppCache(),
      // Whether the browser has a network, for the screens that offer rides with other people (L2-135 AC4).
      { provide: NETWORK_STATUS, useClass: BrowserNetworkStatus },
      // The ride settings, which Settings changes and every ride screen follows (L2-158 AC3).
      { provide: RIDE_SETTINGS, useClass: LocalRideSettingsStore },
      // Theme, motion and ride numbers on <html>, applied from the start and at once on each change (L2-164 AC2 to AC4).
      { provide: DISPLAY_PREFERENCES, useClass: BrowserDisplayPreferences },
      provideEnvironmentInitializer(() => void inject(DISPLAY_PREFERENCES)),
      // Full screen, which the header offers and a ride's start can enter (L2-144, L2-164 AC6).
      { provide: FULLSCREEN, useClass: BrowserFullscreen },
    ],
    // Every screen needs a rider but sign-in, the code screen and not-found (L2-001 AC1).
    canActivateChild: [authGuard],
    children: [
      // Sign-in and the code screen stand alone, with no app navigation (docs/mocks/pages/sign-in/).
      {
        path: 'sign-in',
        loadChildren: () => import('./sign-in/sign-in.routes').then((m) => m.signInRoutes),
      },
      // Connect Bike stands alone, with no app navigation (docs/mocks/pages/connect-bike/).
      {
        path: 'connect',
        title: 'Connect your bike · Telo Ride',
        loadComponent: () => import('./connect/connect-bike-page'),
      },
      // A class ride has its own header, with no app navigation (docs/mocks/pages/class-ride/).
      {
        path: 'classes/:id/ride',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./class-ride/class-ride.routes').then((m) => m.classRideRoutes),
      },
      // Class Start has its own header, with no app navigation (docs/mocks/pages/class-start/).
      {
        path: 'classes/:id',
        loadChildren: () =>
          import('./class-start/class-start.routes').then((m) => m.classStartRoutes),
      },
      // The race is full screen, with no app header (docs/mocks/pages/race/).
      {
        path: 'race/:mapId/ride',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./race/race.routes').then((m) => m.raceRoutes),
      },
      // Results has its own header, with no app navigation (docs/mocks/pages/results/).
      {
        path: 'results',
        loadChildren: () => import('./results/results.routes').then((m) => m.resultsRoutes),
      },
      // The race lobby is full height, with its own header (docs/mocks/pages/race-lobby/).
      {
        path: 'race/:mapId/lobby',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./race-lobby/race-lobby.routes').then((m) => m.raceLobbyRoutes),
      },
      // Custom workout has its own header, with no app navigation (docs/mocks/pages/custom-setup/).
      {
        path: 'profile/custom',
        canActivate: [reconnectRememberedBikeGuard],
        loadChildren: () =>
          import('./custom-workout/custom-workout.routes').then((m) => m.customWorkoutRoutes),
      },
      // Race Setup has its own header, with no app navigation (docs/mocks/pages/race-setup/).
      {
        path: 'race/:mapId',
        loadChildren: () => import('./race-setup/race-setup.routes').then((m) => m.raceSetupRoutes),
      },
      {
        path: '',
        loadComponent: () => import('./main-shell/main-shell'),
        // The rider's progress, which the header, Home and Profile share (L2-032 AC2).
        providers: [
          { provide: RIDER_PROGRESS_API, useClass: HttpRiderProgressApi },
          RiderProgressStore,
          { provide: PROGRESS_STORE, useExisting: RiderProgressStore },
        ],
        children: [
          {
            path: '',
            pathMatch: 'full',
            title: 'Telo Ride',
            canActivate: [rememberedBikeGuard],
            loadComponent: () => import('./home/home-page'),
          },
          {
            path: 'race',
            pathMatch: 'full',
            loadChildren: () =>
              import('./map-select/map-select.routes').then((m) => m.mapSelectRoutes),
          },
          {
            path: 'classes',
            loadChildren: () =>
              import('./class-library/class-library.routes').then((m) => m.classLibraryRoutes),
          },
          {
            path: 'settings',
            title: 'Settings · Telo Ride',
            loadChildren: () => import('./settings/settings.routes').then((m) => m.settingsRoutes),
          },
          {
            path: 'profile',
            title: 'Profile · Telo Ride',
            loadChildren: () => import('./profile/profile.routes').then((m) => m.profileRoutes),
          },
          // An address that matches no screen (L2-145). Always last.
          {
            path: '**',
            title: 'Page not found · Telo Ride',
            loadComponent: () => import('./not-found/not-found-page'),
          },
        ],
      },
    ],
  },
];
