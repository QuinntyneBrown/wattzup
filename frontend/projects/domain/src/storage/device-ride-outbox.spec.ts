// Unit test
// Traces to: L2-135 AC1, AC2; L2-044 AC2; L2-074 AC2, AC3, AC4; L2-125 AC1, AC3; L2-004 AC4
// Description: the outbox keeps a finished ride on the device before it sends it, sends a ride id once and follows it
// from sending to recorded, then removes it. Waiting rides go one at a time, oldest first, when the outbox starts, when
// the browser is back online and on a retry timer of 30 seconds doubling up to an hour; the first that does not reach
// the backend (no answer, 5xx, 429, 401) stops the rest and waits offline. A ride refused for good is not recorded and
// dropped. While the backend answers result_pending, it is sent again every 5 seconds for up to 3 minutes. It follows
// the last ten rides, and stops listening for the network and retrying when it goes.
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  RIDES_API,
  RIDES_WAITING,
  type RideRecordedDto,
  type RidesWaiting,
  type SubmitRideRequest,
  type WaitingRide,
} from '@telo/api';
import { Subject } from 'rxjs';
import {
  DeviceRideOutbox,
  FIRST_RETRY_MS,
  LONGEST_RETRY_MS,
  RESULT_RETRY_MS,
  RESULT_WAIT_MS,
  retryDelay,
} from './device-ride-outbox';

const ride = (rideId: string, finishedAt = '2026-11-21T07:30:00.000Z') =>
  ({ rideId, finishedAt, kind: 'class', classId: 'hiit-cardio-30' }) as SubmitRideRequest;
const answer = (rideId: string) => ({ rideId, xpTotal: 110 }) as RideRecordedDto;

/** The device's rides in memory, as IndexedDB would keep them. */
class MemoryRidesWaiting implements RidesWaiting {
  readonly kept = new Map<string, WaitingRide>();
  async oldestFirst(): Promise<readonly WaitingRide[]> {
    return [...this.kept.values()].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  }
  async put(waiting: WaitingRide): Promise<void> {
    this.kept.set(waiting.rideId, waiting);
  }
  async remove(rideId: string): Promise<void> {
    this.kept.delete(rideId);
  }
}

/** Lets the outbox's promises run: storage reads and writes, then the next send. */
async function settle(): Promise<void> {
  for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
}

describe('DeviceRideOutbox', () => {
  let sent: { ride: SubmitRideRequest; reply: Subject<RideRecordedDto> }[];
  let device: MemoryRidesWaiting;
  let outbox: DeviceRideOutbox;

  /** Starts the outbox, as the app does, with the rides already on the device. */
  async function start(...waiting: WaitingRide[]): Promise<void> {
    for (const each of waiting) device.kept.set(each.rideId, each);
    outbox = TestBed.inject(DeviceRideOutbox);
    await settle();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sent = [];
    device = new MemoryRidesWaiting();
    TestBed.configureTestingModule({
      providers: [
        DeviceRideOutbox,
        { provide: RIDES_WAITING, useValue: device },
        {
          provide: RIDES_API,
          useValue: {
            submitRide: (submitted: SubmitRideRequest) => {
              const reply = new Subject<RideRecordedDto>();
              sent.push({ ride: submitted, reply });
              return reply;
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  const record = async (index: number) => {
    sent[index].reply.next(answer(sent[index].ride.rideId));
    sent[index].reply.complete();
    await settle();
  };
  const fail = async (index: number, status: number) => {
    sent[index].reply.error(new HttpErrorResponse({ status }));
    await settle();
  };
  const refuse = async (index: number, status: number, code: string) => {
    sent[index].reply.error(new HttpErrorResponse({ status, error: { status, code } }));
    await settle();
  };
  const waiting = (rideId: string, finishedAt: string, attempts = 0): WaitingRide => ({
    rideId,
    finishedAt,
    attempts,
    ride: ride(rideId, finishedAt),
  });

  it('keeps a ride on the device before it sends it, follows it to recorded, then removes it (L2-135 AC1, AC2)', async () => {
    await start();
    outbox.submit(ride('a'));
    expect(outbox.status('a')()).toEqual({ kind: 'sending' });
    await settle();
    expect([...device.kept.keys()]).toEqual(['a']);
    expect(sent.map((each) => each.ride.rideId)).toEqual(['a']);

    await record(0);

    expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
    expect(device.kept.size).toBe(0);
  });

  it('sends a ride id once, however often it is submitted', async () => {
    await start();
    outbox.submit(ride('a'));
    outbox.submit(ride('a'));
    await settle();
    await record(0);
    outbox.submit(ride('a'));
    await settle();

    expect(sent.length).toBe(1);
  });

  it('reads a ride it has not been given as sending', async () => {
    await start();
    expect(outbox.status('unknown')()).toEqual({ kind: 'sending' });
  });

  for (const status of [0, 500, 503, 429, 401]) {
    it(`keeps a ride answered ${status} on the device, waiting offline, and sends it when the browser is back online`, async () => {
      await start();
      outbox.submit(ride('a'));
      await settle();
      await fail(0, status);
      expect(outbox.status('a')()).toEqual({ kind: 'waitingOffline' });
      expect(device.kept.get('a')?.attempts).toBe(1);

      window.dispatchEvent(new Event('online'));
      await settle();
      expect(sent.length).toBe(2);
      expect(outbox.status('a')()).toEqual({ kind: 'sending' });
      await record(1);

      expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
      expect(device.kept.size).toBe(0);
    });
  }

  for (const [attempts, delay] of [
    [1, 30_000],
    [2, 60_000],
    [3, 120_000],
    [7, 1_920_000],
    [8, LONGEST_RETRY_MS],
    [30, LONGEST_RETRY_MS],
  ]) {
    it(`waits ${delay / 1000} s after ${attempts} tries that did not reach the backend (L2-135 AC2)`, () => {
      expect(retryDelay(attempts)).toBe(delay);
    });
  }

  it('sends a ride that did not reach the backend again after 30 seconds, then a minute (L2-135 AC2)', async () => {
    await start();
    outbox.submit(ride('a'));
    await settle();
    await fail(0, 0);

    await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS - 1);
    expect(sent.length).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await settle();
    expect(sent.length).toBe(2);
    await fail(1, 503);

    await vi.advanceTimersByTimeAsync(2 * FIRST_RETRY_MS - 1);
    expect(sent.length).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    await settle();
    expect(sent.length).toBe(3);
    expect(device.kept.get('a')?.attempts).toBe(2);
  });

  it('sends the rides waiting on the device when it starts, oldest first, one at a time (L2-135 AC2)', async () => {
    await start(
      waiting('later', '2026-11-21T07:30:00.000Z'),
      waiting('earlier', '2026-11-21T06:45:00.000Z'),
    );

    expect(sent.map((each) => each.ride.rideId)).toEqual(['earlier']);
    await record(0);
    expect(sent.map((each) => each.ride.rideId)).toEqual(['earlier', 'later']);
    await record(1);

    expect(device.kept.size).toBe(0);
    expect(outbox.status('later')()).toEqual({ kind: 'recorded', answer: answer('later') });
  });

  it('stops at the first ride that does not reach the backend, keeping the rest for the next try', async () => {
    await start(
      waiting('earlier', '2026-11-21T06:45:00.000Z'),
      waiting('later', '2026-11-21T07:30:00.000Z'),
    );

    await fail(0, 0);

    expect(sent.map((each) => each.ride.rideId)).toEqual(['earlier']);
    expect([...device.kept.keys()].sort()).toEqual(['earlier', 'later']);
  });

  for (const [status, code] of [
    [422, 'ride_not_plausible'],
    [400, 'ride_invalid'],
    [409, 'ride_conflict'],
  ] as const) {
    it(`drops a ride refused with ${status} ${code} as not recorded, and never sends it again (L2-074 AC4)`, async () => {
      await start();
      outbox.submit(ride('a'));
      await settle();
      await refuse(0, status, code);

      expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
      expect(device.kept.size).toBe(0);
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(LONGEST_RETRY_MS);
      expect(sent.length).toBe(1);
    });
  }

  describe('while the race result is pending', () => {
    it('stays sending and sends the ride again every 5 seconds until the backend records it (L2-125 AC1)', async () => {
      await start();
      outbox.submit(ride('a'));
      await settle();
      await refuse(0, 409, 'result_pending');
      expect(outbox.status('a')()).toEqual({ kind: 'sending' });

      await vi.advanceTimersByTimeAsync(RESULT_RETRY_MS - 1);
      expect(sent.length).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(sent.map((each) => each.ride.rideId)).toEqual(['a', 'a']);
      await record(1);

      expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
      expect(device.kept.size).toBe(0);
    });

    it('does not hold up the rides behind it', async () => {
      await start(
        waiting('race', '2026-11-21T06:45:00.000Z'),
        waiting('class', '2026-11-21T07:30:00.000Z'),
      );
      await refuse(0, 409, 'result_pending');

      expect(sent.map((each) => each.ride.rideId)).toEqual(['race', 'class']);
    });

    it('marks the ride not recorded and drops it once 3 minutes of retries find no result', async () => {
      await start();
      outbox.submit(ride('a'));
      await settle();
      for (let index = 0; outbox.status('a')().kind === 'sending'; index += 1) {
        await refuse(index, 409, 'result_pending');
        await vi.advanceTimersByTimeAsync(RESULT_RETRY_MS);
      }

      expect(sent.length).toBe(RESULT_WAIT_MS / RESULT_RETRY_MS + 1);
      expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
      expect(device.kept.size).toBe(0);
    });

    it('stops retrying when it goes', async () => {
      await start();
      outbox.submit(ride('a'));
      await settle();
      await refuse(0, 409, 'result_pending');

      TestBed.resetTestingModule();
      await vi.advanceTimersByTimeAsync(RESULT_RETRY_MS);

      expect(sent.length).toBe(1);
    });
  });

  it('follows the last ten rides', async () => {
    await start();
    for (let index = 0; index < 11; index += 1) {
      outbox.submit(ride(`r${index}`, `2026-11-21T07:${10 + index}:00.000Z`));
      await settle();
      await record(index);
    }

    expect(outbox.status('r10')()).toEqual({ kind: 'recorded', answer: answer('r10') });
    expect(outbox.status('r0')()).toEqual({ kind: 'sending' });
  });

  it('stops listening for the network and retrying when it goes', async () => {
    await start();
    outbox.submit(ride('a'));
    await settle();
    await fail(0, 0);

    TestBed.resetTestingModule();
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(LONGEST_RETRY_MS);

    expect(sent.length).toBe(1);
  });
});
