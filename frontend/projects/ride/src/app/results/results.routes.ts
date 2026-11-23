import type { Routes } from '@angular/router';
import { provideMaps } from '../maps/provide-maps';

/** Results, with the map catalogue it reads only for the map a ride opened (L2-076), loaded with it. */
export const resultsRoutes: Routes = [
  {
    path: '',
    title: 'Results · Telo Ride',
    providers: provideMaps(),
    loadComponent: () => import('./results-page'),
  },
];
