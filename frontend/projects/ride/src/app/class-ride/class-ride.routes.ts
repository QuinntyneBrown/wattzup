import type { Routes } from '@angular/router';
import { provideClassRide } from './provide-class-ride';

/**
 * The class ride's route, loaded with it: its providers bring `HttpClient` and the catalogue client, so their code
 * stays out of every other screen's chunks (AGENTS.md, lazy loading first).
 */
export const classRideRoutes: Routes = [
  {
    path: '',
    title: 'Class ride · Telo Ride',
    providers: [provideClassRide()],
    loadComponent: () => import('./class-ride-page'),
  },
];
