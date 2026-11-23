import { Injector, inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { DEVICE_CHECK, GRAPHICS_SUPPORT } from '@telo/api';
import { BrowserGraphicsSupport } from '@telo/domain';
import { provideInertBehindDialogs } from '../dialogs/provide-inert-behind-dialogs';

/**
 * Settings, loaded with it: what this browser draws worlds with, asked only here (L2-159 AC1), and Check this device,
 * which loads with the world library on the rider's press (L2-162), are bound out of every other chunk (AGENTS.md,
 * lazy loading first).
 */
export const settingsRoutes: Routes = [
  {
    path: '',
    providers: [
      { provide: GRAPHICS_SUPPORT, useClass: BrowserGraphicsSupport },
      // Diagnostics, from the Bike row, leaves the app inert behind it (L2-141 AC3, L2-113 AC1).
      provideInertBehindDialogs(),
      {
        provide: DEVICE_CHECK,
        useFactory: () => {
          const injector = inject(Injector);
          return () => import('@telo/world').then((world) => world.deviceCheck(injector));
        },
      },
    ],
    loadComponent: () => import('./settings-page'),
  },
];
