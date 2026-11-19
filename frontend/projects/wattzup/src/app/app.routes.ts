import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Ride · Wattzup',
    loadComponent: () => import('./dashboard/ride-page/ride-page').then((m) => m.RidePage),
  },
  {
    path: 'setup',
    title: 'Set up your ride · Wattzup',
    loadComponent: () => import('./dashboard/setup-page/setup-page').then((m) => m.SetupPage),
  },
  {
    path: 'classes',
    title: 'Ride a class · Wattzup',
    loadComponent: () =>
      import('./dashboard/class-library-page/class-library-page').then((m) => m.ClassLibraryPage),
  },
  {
    path: 'classes/:id',
    title: 'Class · Wattzup',
    loadComponent: () => import('./dashboard/class-page/class-page').then((m) => m.ClassPage),
  },
  {
    path: 'sessions/:id',
    title: 'Your ride · Wattzup',
    loadComponent: () => import('./dashboard/session-page/session-page').then((m) => m.SessionPage),
  },
  {
    path: 'progress',
    title: 'Progress · Wattzup',
    loadComponent: () =>
      import('./dashboard/progress-page/progress-page').then((m) => m.ProgressPage),
  },
  {
    path: 'unlock',
    title: 'Unlock · Wattzup',
    loadComponent: () => import('./dashboard/unlock-page/unlock-page').then((m) => m.UnlockPage),
  },
  {
    path: '**',
    title: 'Page not found · Wattzup',
    loadComponent: () =>
      import('./dashboard/not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
];
