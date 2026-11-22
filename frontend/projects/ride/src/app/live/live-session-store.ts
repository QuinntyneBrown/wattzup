import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  measureClockOffset,
  MONOTONIC_TIME,
  RIDE_HUB_CLIENT,
  type ClockSample,
  RideHubError,
  type RideHubErrorCode,
  type SeatAssignment,
} from '@telo/api';

/** The session the rider holds a seat in: the arguments a rejoin repeats (L2-120 AC3). */
export interface SessionRef {
  readonly kind: 'class' | 'race';
  readonly sessionId: string;
  readonly classId?: string;
  readonly mapId?: string;
}

/** How many ServerTime calls one measurement of the clock offset takes. */
const SAMPLES = 5;

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
  private session: SessionRef | null = null;
  private forgetReconnect: (() => void) | null = null;

  readonly connection = this.hub.state;
  /** The server's clock minus the device's monotonic clock, in milliseconds; `null` until measured. */
  readonly offsetMs = this.offset.asReadonly();
  /** The rider's seat in the session; `null` until the hub gives it. */
  readonly seat = this.taken.asReadonly();
  /** The code the hub refused the join with; `null` while it has not. */
  readonly refused = this.refusal.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.leave());
  }

  async join(ref: SessionRef): Promise<void> {
    if (this.session !== null) return;
    this.session = ref;
    this.forgetReconnect = this.hub.onReconnected(() => this.rejoin());
    try {
      await this.hub.start();
    } catch {
      return;
    }
    await this.measure();
    await this.takeSeat();
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
    if (session?.kind !== 'class' || session.classId === undefined) return;
    try {
      const seat = await this.hub.joinClassSession(session.classId, session.sessionId);
      if (this.session === session) this.taken.set(seat);
    } catch (error) {
      // A lost connection is not a refusal: the next reconnect asks again.
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
    void this.hub.stop();
  }
}
