// Unit test
// Traces to: L2-120 AC1, AC3, AC4; L2-121 AC3; L2-122 AC1, AC2
// Description: the live session opens the hub connection only when the rider joins a session, measures the clock
// offset from five ServerTime calls and then takes the seat, measures again and asks for the same seat after each
// reconnect, and closes the connection when its route goes. A refused join sets its code; a refused or lost connection
// leaves the ride without an offset or a seat, and the ride carries on with the bike.
import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MONOTONIC_TIME,
  RIDE_HUB_CLIENT,
  type RaceSeatAssignment,
  type RaceSeatDto,
  RideHubError,
  type RideHubClient,
  type RideHubState,
  type SeatAssignment,
  type SeatsChanged,
  type RaceStandings,
  type Standings,
} from '@telo/api';
import { LiveSessionStore } from './live-session-store';

const SEAT: SeatAssignment = {
  sessionId: 'session-0715',
  startsAt: '2026-11-21T19:45:00+00:00',
  jersey: 'lena',
};

const LENA: RaceSeatDto = {
  number: 1,
  kind: 'rider',
  name: 'lena.k',
  jersey: 'lena',
  level: 4,
  country: null,
  ready: false,
};
const OPEN: RaceSeatDto = {
  ...LENA,
  number: 2,
  kind: 'open',
  name: null,
  jersey: null,
  level: null,
};
const RACE: RaceSeatAssignment = {
  sessionId: 'old-town-criterium@20261122T180030Z',
  startsAt: '2026-11-22T18:00:30+00:00',
  seat: 1,
  seats: [LENA, OPEN],
};

/** A hub whose answers take 40 ms and whose clock runs `ahead` of the device's. */
class FakeHub implements RideHubClient {
  readonly state = signal<RideHubState>('disconnected');
  now = 10_000;
  ahead = 1500;
  starts = 0;
  stops = 0;
  calls = 0;
  refuse = false;
  /** What the next joins answer: a seat, or an error to reject with. */
  joinAnswer: SeatAssignment | Error = SEAT;
  readonly joins: [string, string][] = [];
  readonly handlers = new Set<() => void>();
  readonly reports: [string, number, number][] = [];
  readonly listeners = new Set<(standings: Standings) => void>();
  readonly races: string[] = [];
  readonly raceJoins: string[] = [];
  readonly readies: [string, boolean][] = [];
  readonly leaves: string[] = [];
  readonly seatListeners = new Set<(seats: SeatsChanged) => void>();
  readonly raceReports: [string, number, number][] = [];
  readonly raceListeners = new Set<(standings: RaceStandings) => void>();
  /** What the next FindRace answers: a seat, or an error to reject with. */
  raceAnswer: RaceSeatAssignment | Error = RACE;

  async start(): Promise<void> {
    this.starts += 1;
    if (this.refuse) throw new Error('401');
    this.state.set('connected');
  }
  async stop(): Promise<void> {
    this.stops += 1;
    this.state.set('disconnected');
  }
  async serverTime(): Promise<number> {
    this.calls += 1;
    const sent = this.now;
    this.now += 40;
    return sent + 20 + this.ahead;
  }
  async joinClassSession(classId: string, sessionId: string): Promise<SeatAssignment> {
    this.joins.push([classId, sessionId]);
    if (this.joinAnswer instanceof Error) throw this.joinAnswer;
    return this.joinAnswer;
  }
  async reportProgress(sessionId: string, outputKj: number, powerWatts: number): Promise<void> {
    this.reports.push([sessionId, outputKj, powerWatts]);
  }
  async reportRaceProgress(
    sessionId: string,
    distanceMetres: number,
    powerWatts: number,
  ): Promise<void> {
    this.raceReports.push([sessionId, distanceMetres, powerWatts]);
  }
  async findRace(mapId: string): Promise<RaceSeatAssignment> {
    this.races.push(mapId);
    if (this.raceAnswer instanceof Error) throw this.raceAnswer;
    return this.raceAnswer;
  }
  async joinRace(sessionId: string): Promise<RaceSeatAssignment> {
    this.raceJoins.push(sessionId);
    if (this.raceAnswer instanceof Error) throw this.raceAnswer;
    return this.raceAnswer;
  }
  async setReady(sessionId: string, ready: boolean): Promise<void> {
    this.readies.push([sessionId, ready]);
  }
  async leaveRace(sessionId: string): Promise<void> {
    this.leaves.push(sessionId);
  }
  onSeatsChanged(handler: (seats: SeatsChanged) => void): () => void {
    this.seatListeners.add(handler);
    return () => this.seatListeners.delete(handler);
  }
  /** The hub sends SeatsChanged. */
  seatsChanged(seats: SeatsChanged): void {
    for (const listener of this.seatListeners) listener(seats);
  }
  onStandings(handler: (standings: Standings) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
  /** The hub sends StandingsUpdated. */
  standings(standings: Standings): void {
    for (const listener of this.listeners) listener(standings);
  }
  onRaceStandings(handler: (standings: RaceStandings) => void): () => void {
    this.raceListeners.add(handler);
    return () => this.raceListeners.delete(handler);
  }
  /** The hub sends RaceStandingsUpdated. */
  raceStandings(standings: RaceStandings): void {
    for (const listener of this.raceListeners) listener(standings);
  }
  onReconnected(handler: () => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  /** Runs the reconnect handlers and waits for what they started. */
  async reconnect(): Promise<void> {
    await Promise.all([...this.handlers].map((handler) => handler() as unknown));
  }
}

describe('LiveSessionStore', () => {
  let hub: FakeHub;
  let injector: EnvironmentInjector;
  let store: LiveSessionStore;
  const session = { kind: 'class', classId: 'hiit-cardio', sessionId: 'session-0715' } as const;

  beforeEach(() => {
    hub = new FakeHub();
    injector = createEnvironmentInjector(
      [
        LiveSessionStore,
        { provide: RIDE_HUB_CLIENT, useValue: hub },
        { provide: MONOTONIC_TIME, useValue: { now: () => hub.now } },
      ],
      TestBed.inject(EnvironmentInjector),
    );
    store = injector.get(LiveSessionStore);
  });

  it('holds no connection until the rider joins a session', () => {
    expect(hub.starts).toBe(0);
    expect(store.offsetMs()).toBeNull();
    expect(store.serverNow()).toBeNull();
  });

  it('connects once on joining and measures the clock offset from five ServerTime calls', async () => {
    await store.join(session);
    await store.join(session);

    expect(hub.starts).toBe(1);
    expect(hub.calls).toBe(5);
    expect(store.connection()).toBe('connected');
    expect(store.offsetMs()).toBe(1500);
    expect(store.serverNow()).toBe(hub.now + 1500);
  });

  it('measures the offset again after a reconnect', async () => {
    await store.join(session);
    hub.ahead = 900;

    await hub.reconnect();

    expect(store.offsetMs()).toBe(900);
    expect(hub.calls).toBe(10);
  });

  it('closes the connection and forgets the reconnect when its route goes', async () => {
    await store.join(session);

    injector.destroy();

    expect(hub.stops).toBe(1);
    expect(hub.handlers.size).toBe(0);
  });

  it('closes nothing when the rider never joined', () => {
    injector.destroy();

    expect(hub.starts).toBe(0);
    expect(hub.stops).toBe(0);
  });

  it('leaves the ride without an offset when the hub refuses the connection', async () => {
    hub.refuse = true;

    await expect(store.join(session)).resolves.toBeUndefined();

    expect(store.offsetMs()).toBeNull();
    expect(store.connection()).toBe('disconnected');
    expect(hub.joins).toEqual([]);
    expect(store.seat()).toBeNull();
  });

  it('takes the seat in its session once the offset is measured', async () => {
    await store.join(session);

    expect(hub.joins).toEqual([['hiit-cardio', 'session-0715']]);
    expect(store.seat()).toEqual(SEAT);
    expect(store.refused()).toBeNull();
  });

  it('asks for the same seat again after a reconnect', async () => {
    await store.join(session);

    await hub.reconnect();

    expect(hub.joins).toEqual([
      ['hiit-cardio', 'session-0715'],
      ['hiit-cardio', 'session-0715'],
    ]);
    expect(store.seat()).toEqual(SEAT);
  });

  it.each(['session_full', 'session_started', 'class_locked', 'session_not_found'] as const)(
    'sets the code when the hub refuses the join with %s',
    async (code) => {
      hub.joinAnswer = new RideHubError(code, null);

      await store.join(session);

      expect(store.refused()).toBe(code);
      expect(store.seat()).toBeNull();
    },
  );

  it('sets no refusal when the connection goes while joining, so the next reconnect asks again', async () => {
    hub.joinAnswer = new Error('connection closed');
    await store.join(session);
    expect(store.refused()).toBeNull();

    hub.joinAnswer = SEAT;
    await hub.reconnect();

    expect(store.seat()).toEqual(SEAT);
  });

  it('reports nothing before it has a seat, then the output and power, dropping a report within 500 ms of the last', async () => {
    store.report(1, 100);
    await store.join(session);

    store.report(2.5, 180);
    hub.now += 499;
    store.report(2.6, 180);
    hub.now += 1;
    store.report(2.7, 190);

    expect(hub.reports).toEqual([
      ['session-0715', 2.5, 180],
      ['session-0715', 2.7, 190],
    ]);
  });

  it('holds only the latest standings the hub sent, and stops listening when its route goes', async () => {
    await store.join(session);
    const first: Standings = { sessionId: 'session-0715', rows: [] };
    const second: Standings = { sessionId: 'session-0715', rows: [] };

    hub.standings(first);
    hub.standings(second);
    expect(store.standings()).toBe(second);

    injector.destroy();
    expect(hub.listeners.size).toBe(0);
  });

  it('ignores standings for another session', async () => {
    await store.join(session);

    hub.standings({ sessionId: 'other@20261121T1945Z', rows: [] });

    expect(store.standings()).toBeNull();
  });

  describe('in a race', () => {
    const race = { kind: 'race', mapId: 'old-town-criterium' } as const;

    it('finds a race on the map after measuring the offset, and holds its seat and grid (L2-121 AC1)', async () => {
      await store.join(race);

      expect(hub.races).toEqual(['old-town-criterium']);
      expect(store.offsetMs()).not.toBeNull();
      expect(store.race()).toEqual(RACE);
      expect(store.seats()).toEqual([LENA, OPEN]);
    });

    it("replaces the grid with each SeatsChanged of its session, keeping the last leaver's name (L2-055)", async () => {
      await store.join(race);
      const marco = {
        ...OPEN,
        kind: 'rider',
        name: 'MarcoVelo',
        jersey: 'marco',
        level: 11,
      } as const;

      hub.seatsChanged({ sessionId: RACE.sessionId, seats: [LENA, marco], left: null });
      expect(store.seats()).toEqual([LENA, marco]);
      hub.seatsChanged({ sessionId: RACE.sessionId, seats: [LENA, OPEN], left: 'MarcoVelo' });
      hub.seatsChanged({
        sessionId: RACE.sessionId,
        seats: [{ ...LENA, ready: true }, OPEN],
        left: null,
      });
      expect(store.left()).toBe('MarcoVelo');
      hub.seatsChanged({ sessionId: 'another', seats: [], left: 'someone' });

      expect(store.seats()).toEqual([{ ...LENA, ready: true }, OPEN]);
      expect(store.left()).toBe('MarcoVelo');
    });

    it('sends ready and leave for its session (L2-053 AC1, L2-057 AC1)', async () => {
      await store.join(race);

      store.setReady(true);
      store.setReady(false);
      store.leaveRace();

      expect(hub.readies).toEqual([
        [RACE.sessionId, true],
        [RACE.sessionId, false],
      ]);
      expect(hub.leaves).toEqual([RACE.sessionId]);
    });

    it('finds the race again after a reconnect, keeping the seat (L2-120 AC3)', async () => {
      await store.join(race);
      await hub.reconnect();

      expect(hub.races).toEqual(['old-town-criterium', 'old-town-criterium']);
    });

    it('joins the session it holds a seat in again at Go, rather than finding a race (L2-056 AC3, L2-121 AC3)', async () => {
      await store.join({ ...race, sessionId: RACE.sessionId });

      expect(hub.raceJoins).toEqual([RACE.sessionId]);
      expect(hub.races).toEqual([]);
      expect(store.race()).toEqual(RACE);
      expect(store.offsetMs()).not.toBeNull();
    });

    it('rides on without a seat or an offset when the hub cannot be reached (L2-126)', async () => {
      hub.refuse = true;

      await store.join({ ...race, sessionId: RACE.sessionId });

      expect(store.race()).toBeNull();
      expect(store.offsetMs()).toBeNull();
    });

    it('sets the refusal code of a map the hub does not know', async () => {
      hub.raceAnswer = new RideHubError('map_not_found', null);

      await store.join(race);

      expect(store.refused()).toBe('map_not_found');
      expect(store.race()).toBeNull();
    });

    it('stops listening for seats when its route goes', async () => {
      await store.join(race);
      injector.destroy();

      expect(hub.seatListeners.size).toBe(0);
    });

    it('reports the distance and power to its session once seated, dropping a report within 500 ms of the last (L2-123 AC1)', async () => {
      store.report(10, 200);
      await store.join({ ...race, sessionId: RACE.sessionId });

      store.report(42, 250);
      hub.now += 499;
      store.report(44, 250);
      hub.now += 1;
      store.report(48, 260);

      expect(hub.raceReports).toEqual([
        [RACE.sessionId, 42, 250],
        [RACE.sessionId, 48, 260],
      ]);
      expect(hub.reports).toEqual([]);
    });

    it('holds only the latest race standings of its session, and stops listening when its route goes (L2-123 AC3)', async () => {
      await store.join({ ...race, sessionId: RACE.sessionId });
      const latest: RaceStandings = { sessionId: RACE.sessionId, rows: [] };

      hub.raceStandings({ sessionId: RACE.sessionId, rows: [] });
      hub.raceStandings({ sessionId: 'other@20261122T180100Z', rows: [] });
      hub.raceStandings(latest);
      hub.raceStandings({ sessionId: 'other@20261122T180100Z', rows: [] });

      expect(store.raceStandings()).toBe(latest);
      injector.destroy();
      expect(hub.raceListeners.size).toBe(0);
    });
  });
});
