import { InjectionToken, type Signal } from '@angular/core';
import type { RaceSeatAssignment, SeatsChanged } from './find-race';
import type { SeatAssignment } from './join-class-session';
import type { Standings } from './standings';

/** The link to the ride hub (docs/detailed-designs/multiplayer/connect-to-the-ride-hub). */
export type RideHubState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * The ride hub at `/hubs/ride`, for live races and group classes (L2-120). The only way the app talks to the hub: no
 * component opens its own connection. Bound by the routes that hold a live session, never by `app.config.ts`, so the
 * rest of the app holds no connection (AC4). The session methods arrive with the slices that use them (14.3 to 15).
 */
export interface RideHubClient {
  readonly state: Signal<RideHubState>;
  /** Opens the connection with the session cookie (AC1); it rejects when the hub refuses it (AC2). */
  start(): Promise<void>;
  /** Closes the connection and its retry timer. */
  stop(): Promise<void>;
  /** The hub's time in Unix milliseconds, for the clock offset (L2-121 AC3). */
  serverTime(): Promise<number>;
  /**
   * A seat in a class's group session (L2-122 AC1); a seated rider who asks again keeps the seat (L2-120 AC3). It
   * rejects with a `RideHubError` when the hub refuses (`session_full`, `session_started`, `class_locked`,
   * `session_not_found`), and with any other error when the connection goes.
   */
  joinClassSession(classId: string, sessionId: string): Promise<SeatAssignment>;
  /**
   * Sends the rider's output in kJ and power in watts in a session (`ReportProgress`, L2-123 AC1), awaiting no answer;
   * it does nothing while the hub is not connected.
   */
  reportProgress(sessionId: string, outputKj: number, powerWatts: number): Promise<void>;
  /**
   * "Find a race" on a map (L2-121 AC1): a seat in the open race session with the most riders, or a new one; a seated
   * rider who asks again keeps the seat (L2-120 AC3). It rejects with a `RideHubError` (`map_not_found`) when the hub
   * refuses, and with any other error when the connection goes.
   */
  findRace(mapId: string): Promise<RaceSeatAssignment>;
  /**
   * Joins the race session the rider holds a seat in again, at Go on the race's own connection (L2-056 AC3): its seat,
   * grid and start as server time (L2-121 AC3). It rejects with a `RideHubError` (`session_not_found`) when the rider
   * holds no seat there.
   */
  joinRace(sessionId: string): Promise<RaceSeatAssignment>;
  /** Sends "I'm ready" or not for the rider's seat (`SetReady`, L2-053 AC1, AC2), awaiting no answer. */
  setReady(sessionId: string, ready: boolean): Promise<void>;
  /** Releases the rider's seat in a race lobby (`LeaveRace`, L2-057 AC1), awaiting no answer. */
  leaveRace(sessionId: string): Promise<void>;
  /** Runs `handler` on each `SeatsChanged` the hub sends (L2-055 AC3); returns what removes it. */
  onSeatsChanged(handler: (seats: SeatsChanged) => void): () => void;
  /** Runs `handler` on each `StandingsUpdated` the hub sends (L2-123 AC3); returns what removes it. */
  onStandings(handler: (standings: Standings) => void): () => void;
  /** Runs `handler` after each reconnect (AC3); returns what removes it. */
  onReconnected(handler: () => void): () => void;
}

export const RIDE_HUB_CLIENT = new InjectionToken<RideHubClient>('RIDE_HUB_CLIENT');
