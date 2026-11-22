import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  measureClockOffset,
  MONOTONIC_TIME,
  RIDE_HUB_CLIENT,
  type ClockSample,
  type RaceSeatAssignment,
  type RaceSeatDto,
  type RaceStandings,
  RideHubError,
  type RideHubErrorCode,
  type SeatAssignment,
  type Standings,
} from '@telo/api';

/**
 * The session the rider holds a seat in: the arguments a rejoin repeats (L2-120 AC3). A class names its session; a race
 * lobby names its map, and the hub chooses the session (L2-121 AC1); the race names the session it holds a seat in
 * (L2-056 AC3).
 */
export interface SessionRef {
  readonly kind: 'class' | 'race';
  readonly sessionId?: string;
  readonly classId?: string;
  readonly mapId?: string;
}

/** How many ServerTime calls one measurement of the clock offset takes. */
const SAMPLES = 5;

/** The shortest time between two progress reports (L2-123 AC1). */
const REPORT_INTERVAL_MS = 500;

/**
 * The rider's live session (docs/detailed-designs/multiplayer/connect-to-the-ride-hub), provided on a route that holds
 * one. Joining opens the hub connection (L2-120 AC1), measures the clock offset (L2-121 AC3) and takes the seat in the
 * session (L2-122 AC1); after each reconnect it measures again and asks for the same seat, which the hub keeps (L2-120
 * AC3). A refused join sets `refused` to its code, for the ride to leave by (L2-122 AC2, L2-086 AC3). When the route
 * goes it closes the connection, its handlers and its retry timer (AC4). A refused or lost connection leaves the ride
 * carrying on with the bike (L2-126).
 */
@Injectable()
export class LiveSessionStore {
  private readonly hub = inject(RIDE_HUB_CLIENT);
  private readonly time = inject(MONOTONIC_TIME);
  private readonly offset = signal<number | null>(null);
  private readonly taken = signal<SeatAssignment | null>(null);
  private readonly refusal = signal<RideHubErrorCode | null>(null);
  private readonly latest = signal<Standings | null>(null);
  private readonly raceSeat = signal<RaceSeatAssignment | null>(null);
  private readonly grid = signal<readonly RaceSeatDto[]>([]);
  private readonly leaver = signal<string | null>(null);
  private forgetSeats: (() => void) | null = null;
  private readonly latestRace = signal<RaceStandings | null>(null);
  private forgetRaceStandings: (() => void) | null = null;
  private lastReportAt: number | null = null;
  private forgetStandings: (() => void) | null = null;
  private session: SessionRef | null = null;
  private forgetReconnect: (() => void) | null = null;

  readonly connection = this.hub.state;
  /** The server's clock minus the device's monotonic clock, in milliseconds; `null` until measured. */
  readonly offsetMs = this.offset.asReadonly();
  /** The rider's seat in the session; `null` until the hub gives it. */
  readonly seat = this.taken.asReadonly();
  /** The code the hub refused the join with; `null` while it has not. */
  readonly refused = this.refusal.asReadonly();
  /** The latest standings the hub sent for the session; each replaces the last, so nothing grows (L2-123 AC3). */
  readonly standings = this.latest.asReadonly();
  /** The rider's seat in a race session: its id, start and seat number; `null` until the hub gives it (L2-121 AC1). */
  readonly race = this.raceSeat.asReadonly();
  /** The race session's start grid, the latest the hub sent; each replaces the last (L2-055 AC3). */
  readonly seats = this.grid.asReadonly();
  /** The rider who last left the race lobby with their seat open again, for the notice (L2-055 AC1). */
  readonly left = this.leaver.asReadonly();
  /** The latest race standings the hub sent for the race session; each replaces the last, so nothing grows (L2-123 AC3). */
  readonly raceStandings = this.latestRace.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.leave());
  }

  async join(ref: SessionRef): Promise<void> {
    if (this.session !== null) return;
    this.session = ref;
    this.forgetReconnect = this.hub.onReconnected(() => this.rejoin());
    this.forgetStandings = this.hub.onStandings((standings) => {
      if (standings.sessionId === ref.sessionId) this.latest.set(standings);
    });
    this.forgetRaceStandings = this.hub.onRaceStandings((standings) => {
      if (standings.sessionId === this.raceSeat()?.sessionId) this.latestRace.set(standings);
    });
    this.forgetSeats = this.hub.onSeatsChanged((change) => {
      if (change.sessionId !== this.raceSeat()?.sessionId) return;
      this.grid.set(change.seats);
      if (change.left !== null) this.leaver.set(change.left);
    });
    try {
      await this.hub.start();
    } catch {
      return;
    }
    await this.measure();
    await this.takeSeat();
  }

  /**
   * Sends the rider's progress and power in watts once seated: in a class the output in kJ, in a race the metres
   * ridden. A report less than 500 ms after the last one sent is dropped, so the hub hears at most two a second
   * (L2-123 AC1).
   */
  report(amount: number, powerWatts: number): void {
    const seat = this.taken();
    const race = this.raceSeat();
    if (this.session === null || (seat === null && race === null)) return;
    const now = this.time.now();
    if (this.lastReportAt !== null && now - this.lastReportAt < REPORT_INTERVAL_MS) return;
    this.lastReportAt = now;
    const sent =
      seat !== null
        ? this.hub.reportProgress(seat.sessionId, amount, powerWatts)
        : this.hub.reportRaceProgress(race!.sessionId, amount, powerWatts);
    void sent.catch(() => undefined);
  }

  /** Tells the hub the rider is ready, or no longer (L2-053 AC1, AC2). */
  setReady(ready: boolean): void {
    const race = this.raceSeat();
    if (race !== null) void this.hub.setReady(race.sessionId, ready).catch(() => undefined);
  }

  /** Releases the rider's seat in the race lobby (L2-057 AC1), then closes the connection as the route goes. */
  leaveRace(): void {
    const race = this.raceSeat();
    if (race !== null) void this.hub.leaveRace(race.sessionId).catch(() => undefined);
  }

  /** The server's time now, in Unix milliseconds, or `null` before the offset is measured. */
  serverNow(): number | null {
    const offset = this.offset();
    return offset === null ? null : this.time.now() + offset;
  }

  private async rejoin(): Promise<void> {
    await this.measure();
    await this.takeSeat();
  }

  private async takeSeat(): Promise<void> {
    const session = this.session;
    if (session?.kind === 'race') return this.findRace(session);
    if (
      session?.kind !== 'class' ||
      session.classId === undefined ||
      session.sessionId === undefined
    )
      return;
    try {
      const seat = await this.hub.joinClassSession(session.classId, session.sessionId);
      if (this.session === session) this.taken.set(seat);
    } catch (error) {
      // A lost connection is not a refusal: the next reconnect asks again.
      if (error instanceof RideHubError && this.session === session) this.refusal.set(error.code);
    }
  }

  /** A lobby finds a race on its map (L2-121 AC1); the race joins its session again at Go (L2-056 AC3). */
  private async findRace(session: SessionRef): Promise<void> {
    try {
      const race =
        session.sessionId !== undefined
          ? await this.hub.joinRace(session.sessionId)
          : await this.hub.findRace(session.mapId ?? '');
      if (this.session !== session) return;
      this.raceSeat.set(race);
      this.grid.set(race.seats);
    } catch (error) {
      if (error instanceof RideHubError && this.session === session) this.refusal.set(error.code);
    }
  }

  private async measure(): Promise<void> {
    const samples: ClockSample[] = [];
    try {
      for (let i = 0; i < SAMPLES; i++) {
        const sentAt = this.time.now();
        const serverTime = await this.hub.serverTime();
        samples.push({ sentAt, serverTime, receivedAt: this.time.now() });
      }
    } catch {
      // The connection went while measuring; the next reconnect measures again.
      return;
    }
    if (this.session !== null) this.offset.set(measureClockOffset(samples));
  }

  private leave(): void {
    if (this.session === null) return;
    this.session = null;
    this.forgetReconnect?.();
    this.forgetReconnect = null;
    this.forgetStandings?.();
    this.forgetStandings = null;
    this.forgetSeats?.();
    this.forgetSeats = null;
    this.forgetRaceStandings?.();
    this.forgetRaceStandings = null;
    void this.hub.stop();
  }
}
