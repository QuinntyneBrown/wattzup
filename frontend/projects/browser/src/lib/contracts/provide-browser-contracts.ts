// Binds every api contract to its in-browser implementation (L2-088, ADR 0017).
import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  BIKE_API,
  BIKE_PAIRING,
  PACKET_LOG,
  CLASS_API,
  LIVE_STATE_SOURCE,
  SESSION_API,
  SESSION_ARCHIVE,
  WORKOUT_API,
} from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { BLUETOOTH_PORT } from '../bluetooth/bluetooth-port';
import { PacketLog } from '../bluetooth/packet-log';
import { CLOCK } from '../bluetooth/clock';
import {
  SimulatedBluetoothPort,
  simulateLocked,
  simulateRequested,
} from '../bluetooth/simulated-bluetooth-port';
import { WebBluetoothPort } from '../bluetooth/web-bluetooth-port';
import { BikeStateStore } from '../engine/bike-state-store';
import { ResistanceCommander } from '../engine/resistance-commander';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { WorkoutEngine } from '../engine/workout-engine';
import { SessionStore } from '../storage/session-store';
import { WakeLockKeeper } from '../engine/wake-lock-keeper';
import { BrowserBikeApi } from './browser-bike-api';
import { BrowserBikePairing } from './browser-bike-pairing';
import { BrowserClassApi } from './browser-class-api';
import { BrowserSessionApi } from './browser-session-api';
import { BrowserSessionArchive } from './browser-session-archive';
import { BrowserStateSource } from './browser-state-source';
import { BrowserWorkoutApi } from './browser-workout-api';

/** Asks the browser to keep the history when space runs low (L2-094 AC4); a refusal changes nothing
 * on screen, since Your history always says where rides are kept. */
function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => false);
}

export function provideBrowserContracts(): EnvironmentProviders {
  // A development build opened with ?simulate rides the simulated bike (L2-099 AC1).
  const simulate = simulateRequested(isDevMode(), location.search);
  return makeEnvironmentProviders([
    BikeStateStore,
    TelemetryIngestor,
    BikeLink,
    ResistanceCommander,
    WorkoutEngine,
    SessionStore,
    WakeLockKeeper,
    PacketLog,
    { provide: PACKET_LOG, useExisting: PacketLog },
    simulate
      ? {
          provide: BLUETOOTH_PORT,
          useFactory: () =>
            new SimulatedBluetoothPort(inject(CLOCK), simulateLocked(location.search)),
        }
      : { provide: BLUETOOTH_PORT, useClass: WebBluetoothPort },
    { provide: LIVE_STATE_SOURCE, useClass: BrowserStateSource },
    { provide: BIKE_PAIRING, useClass: BrowserBikePairing },
    { provide: BIKE_API, useClass: BrowserBikeApi },
    { provide: WORKOUT_API, useClass: BrowserWorkoutApi },
    BrowserClassApi,
    { provide: CLASS_API, useExisting: BrowserClassApi },
    { provide: SESSION_API, useClass: BrowserSessionApi },
    { provide: SESSION_ARCHIVE, useClass: BrowserSessionArchive },
    provideEnvironmentInitializer(requestPersistentStorage),
    // Keeps the screen on during a ride (L2-092 AC4).
    provideEnvironmentInitializer(() => void inject(WakeLockKeeper)),
    // Saves a ride the page closed on before anything reads the sessions (L2-092 AC5).
    provideEnvironmentInitializer(() => void inject(SessionStore).ready()),
    // Asks at start whether Bluetooth is on, so every page's status line can say (L2-089 AC2).
    provideEnvironmentInitializer(() => void inject(BIKE_PAIRING)),
    provideEnvironmentInitializer(() => {
      if (simulate) inject(BikeStateStore).update((s) => ({ ...s, simulated: true }));
    }),
  ]);
}
