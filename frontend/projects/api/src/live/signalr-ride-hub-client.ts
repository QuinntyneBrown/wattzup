import { Injectable, signal } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import {
  type FindRaceResult,
  type RaceSeatAssignment,
  type SeatsChanged,
  raceSeatFrom,
} from './find-race';
import { type JoinClassSessionResult, type SeatAssignment, seatFrom } from './join-class-session';
import type { RideHubClient, RideHubState } from './ride-hub-client';
import type { Standings } from './standings';
import { RideHubRetryPolicy } from './ride-hub-retry-policy';

/** The ride hub's address, on the API that serves the app (ADR 0026). */
const RIDE_HUB = '/hubs/ride';

/**
 * The ride hub over SignalR (docs/detailed-designs/multiplayer/connect-to-the-ride-hub). `@microsoft/signalr` is
 * imported on `start()`, so its code loads only when a live session needs it (AGENTS.md, lazy loading first). The
 * connection carries the session cookie (L2-120 AC1) and retries on `RideHubRetryPolicy` after a drop (AC3); `stop()`
 * closes it with its retry timer, and no handler outlives it (AC4).
 */
@Injectable()
export class SignalRRideHubClient implements RideHubClient {
  private readonly link = signal<RideHubState>('disconnected');
  private readonly reconnected = new Set<() => void>();
  private readonly standings = new Set<(standings: Standings) => void>();
  private readonly seatChanges = new Set<(seats: SeatsChanged) => void>();
  private connection: HubConnection | null = null;

  readonly state = this.link.asReadonly();

  async start(): Promise<void> {
    if (this.connection !== null) return;
    this.link.set('connecting');
    const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');
    const connection = new HubConnectionBuilder()
      .withUrl(RIDE_HUB, { withCredentials: true })
      .withAutomaticReconnect(new RideHubRetryPolicy())
      .configureLogging(LogLevel.None)
      .build();
    connection.onreconnecting(() => this.link.set('reconnecting'));
    connection.onreconnected(() => {
      this.link.set('connected');
      for (const handler of this.reconnected) handler();
    });
    connection.onclose(() => this.link.set('disconnected'));
    connection.on('StandingsUpdated', (standings: Standings) => {
      for (const handler of this.standings) handler(standings);
    });
    connection.on('SeatsChanged', (seats: SeatsChanged) => {
      for (const handler of this.seatChanges) handler(seats);
    });
    this.connection = connection;
    try {
      await connection.start();
    } catch (refused) {
      if (this.connection === connection) this.connection = null;
      this.link.set('disconnected');
      throw refused;
    }
    // stop() may have come while the connection opened.
    if (this.connection === connection) this.link.set('connected');
    else await connection.stop();
  }

  async stop(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.link.set('disconnected');
    await connection?.stop();
  }

  serverTime(): Promise<number> {
    if (this.connection === null) return Promise.reject(new Error('The ride hub is not connected'));
    return this.connection.invoke<number>('ServerTime');
  }

  async joinClassSession(classId: string, sessionId: string): Promise<SeatAssignment> {
    if (this.connection === null) throw new Error('The ride hub is not connected');
    return seatFrom(
      await this.connection.invoke<JoinClassSessionResult>('JoinClassSession', classId, sessionId),
    );
  }

  async reportProgress(sessionId: string, outputKj: number, powerWatts: number): Promise<void> {
    if (this.connection?.state !== 'Connected') return;
    await this.connection.send('ReportProgress', sessionId, outputKj, powerWatts);
  }

  async findRace(mapId: string): Promise<RaceSeatAssignment> {
    if (this.connection === null) throw new Error('The ride hub is not connected');
    return raceSeatFrom(await this.connection.invoke<FindRaceResult>('FindRace', mapId));
  }

  async joinRace(sessionId: string): Promise<RaceSeatAssignment> {
    if (this.connection === null) throw new Error('The ride hub is not connected');
    return raceSeatFrom(await this.connection.invoke<FindRaceResult>('JoinRace', sessionId));
  }

  async setReady(sessionId: string, ready: boolean): Promise<void> {
    if (this.connection?.state !== 'Connected') return;
    await this.connection.send('SetReady', sessionId, ready);
  }

  async leaveRace(sessionId: string): Promise<void> {
    if (this.connection?.state !== 'Connected') return;
    await this.connection.send('LeaveRace', sessionId);
  }

  onSeatsChanged(handler: (seats: SeatsChanged) => void): () => void {
    this.seatChanges.add(handler);
    return () => this.seatChanges.delete(handler);
  }

  onStandings(handler: (standings: Standings) => void): () => void {
    this.standings.add(handler);
    return () => this.standings.delete(handler);
  }

  onReconnected(handler: () => void): () => void {
    this.reconnected.add(handler);
    return () => this.reconnected.delete(handler);
  }
}
