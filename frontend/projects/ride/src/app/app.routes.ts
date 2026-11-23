import type { Routes } from '@angular/router';

/** Every route loads on demand (AGENTS.md, lazy loading first); the screens and their shared providers live in ride.routes.ts. */
export const routes: Routes = [
  { path: '', loadChildren: () => import('./ride.routes').then((m) => m.rideRoutes) },
];
