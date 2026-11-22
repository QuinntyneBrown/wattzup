import type { Routes } from '@angular/router';
import { AUTH_API, HttpAuthApi } from '@telo/api';
import { provideInertBehindDialogs } from '../dialogs/provide-inert-behind-dialogs';
import { AccountStore } from './account-store';

/**
 * Profile, loaded with it: the account's store and sign-in's client for signing out are bound here, out of every other
 * chunk (AGENTS.md, lazy loading first), and the app goes inert behind its dialogs (L2-141 AC3).
 */
export const profileRoutes: Routes = [
  {
    path: '',
    providers: [
      { provide: AUTH_API, useClass: HttpAuthApi },
      AccountStore,
      provideInertBehindDialogs(),
    ],
    loadComponent: () => import('./profile-page'),
  },
];
