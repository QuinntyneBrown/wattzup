import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  MONOTONIC_TIME,
  RIDE_HUB_CLIENT,
  RIDE_SOUND,
  SCREEN_WAKE_LOCK,
  SignalRRideHubClient,
  WORLD_RENDERER,
} from '@telo/api';
import { BrowserScreenWakeLock, WebAudioRideSound } from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideClasses } from '../classes/provide-classes';

/**
 * What the class ride route binds (ride.routes.ts): the class catalogue over HTTP, kept on the device
 * (ADR 0028), the monotonic clock the ride runs
 * on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3), ride sound (L2-163) and the class video's player, whose `video` library
 * is imported only when a ride plays its video, and the ride hub's client, whose SignalR library is imported only when a
 * group ride joins its session (L2-120), and the world's renderer, which `main`'s `WorldScene` asks for: the class ride
 * draws with the one World loading warmed up, so it is imported with the world library only if it is ever loaded. Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    ...provideClasses(),
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
    { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    // Ride sound, made in the browser from the rider's pedalling while Settings has it on (L2-163).
    { provide: RIDE_SOUND, useClass: WebAudioRideSound },
    provideClassVideo(),
    { provide: RIDE_HUB_CLIENT, useClass: SignalRRideHubClient },
    {
      provide: WORLD_RENDERER,
      useValue: () => import('@telo/world').then((world) => world.loadWorldRenderer()),
    },
  ];
}
