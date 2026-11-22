// Unit test
// Traces to: L2-044 AC2; L2-074 AC2, AC3, AC4; L2-125 AC1, AC3
// Description: the outbox sends a finished ride once for its ride id and follows it: sending, then recorded with the
// backend's answer; waiting offline when the request never reached the backend, and sent again when the browser is back
// online; while the backend answers result_pending, sent again every 5 seconds for up to 3 minutes; not recorded when
// the backend refused it otherwise or failed. It holds the last ten rides, and stops listening for the network and
// retrying when it goes.
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RIDES_API, type RideRecordedDto, type SubmitRideRequest } from '@telo/api';
import { Subject } from 'rxjs';
import { RESULT_RETRY_MS, RESULT_WAIT_MS, SessionRideOutbox } from './session-ride-outbox';

const ride = (rideId: string) =>
  ({ rideId, kind: 'class', classId: 'hiit-cardio-30' }) as SubmitRideRequest;
const answer = (rideId: string) => ({ rideId, xpTotal: 110 }) as RideRecordedDto;

describe('SessionRideOutbox', () => {
  let sent: { ride: SubmitRideRequest; reply: Subject<RideRecordedDto> }[];
  let outbox: SessionRideOutbox;

  beforeEach(() => {
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        SessionRideOutbox,
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
    outbox = TestBed.inject(SessionRideOutbox);
  });

  afterEach(() => TestBed.resetTestingModule());

  const fail = (index: number, status: number) =>
    sent[index].reply.error(new HttpErrorResponse({ status }));
  const refuse = (index: number, status: number, code: string) =>
    sent[index].reply.error(new HttpErrorResponse({ status, error: { status, code } }));

  it('sends a ride, and follows it from sending to recorded with the answer', () => {
    outbox.submit(ride('a'));
    expect(outbox.status('a')()).toEqual({ kind: 'sending' });

    sent[0].reply.next(answer('a'));
    sent[0].reply.complete();

    expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
  });

  it('sends a ride id once, however often it is submitted', () => {
    outbox.submit(ride('a'));
    outbox.submit(ride('a'));
    sent[0].reply.next(answer('a'));
    outbox.submit(ride('a'));

    expect(sent.length).toBe(1);
  });

  it('reads a ride it has not been given as sending', () => {
    expect(outbox.status('unknown')()).toEqual({ kind: 'sending' });
  });

  it('waits offline when the request never reached the backend, and sends it again when the browser is back online', () => {
    outbox.submit(ride('a'));
    fail(0, 0);
    expect(outbox.status('a')()).toEqual({ kind: 'waitingOffline' });

    window.dispatchEvent(new Event('online'));
    expect(sent.length).toBe(2);
    expect(outbox.status('a')()).toEqual({ kind: 'sending' });
    sent[1].reply.next(answer('a'));

    expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
  });

  it('marks a ride the backend refused or failed as not recorded, and never sends it again', () => {
    outbox.submit(ride('a'));
    outbox.submit(ride('b'));
    fail(0, 422);
    fail(1, 500);

    expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
    expect(outbox.status('b')()).toEqual({ kind: 'notRecorded' });
    window.dispatchEvent(new Event('online'));
    outbox.submit(ride('a'));
    expect(sent.length).toBe(2);
  });

  describe('while the race result is pending', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('stays sending and sends the ride again every 5 seconds until the backend records it (L2-125 AC1)', () => {
      outbox.submit(ride('a'));
      refuse(0, 409, 'result_pending');
      expect(outbox.status('a')()).toEqual({ kind: 'sending' });

      vi.advanceTimersByTime(RESULT_RETRY_MS - 1);
      expect(sent.length).toBe(1);
      vi.advanceTimersByTime(1);
      expect(sent.map((each) => each.ride)).toEqual([ride('a'), ride('a')]);
      sent[1].reply.next(answer('a'));

      expect(outbox.status('a')()).toEqual({ kind: 'recorded', answer: answer('a') });
    });

    it('marks the ride not recorded once 3 minutes of retries find no result', () => {
      outbox.submit(ride('a'));
      for (let index = 0; outbox.status('a')().kind === 'sending'; index += 1) {
        refuse(index, 409, 'result_pending');
        vi.advanceTimersByTime(RESULT_RETRY_MS);
      }

      expect(sent.length).toBe(RESULT_WAIT_MS / RESULT_RETRY_MS + 1);
      expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
    });

    it('marks a conflict with another code not recorded at once', () => {
      outbox.submit(ride('a'));
      refuse(0, 409, 'ride_conflict');

      vi.advanceTimersByTime(RESULT_RETRY_MS);
      expect(sent.length).toBe(1);
      expect(outbox.status('a')()).toEqual({ kind: 'notRecorded' });
    });

    it('stops retrying when it goes', () => {
      outbox.submit(ride('a'));
      refuse(0, 409, 'result_pending');

      TestBed.resetTestingModule();
      vi.advanceTimersByTime(RESULT_RETRY_MS);

      expect(sent.length).toBe(1);
    });
  });

  it('holds the last ten rides', () => {
    for (let index = 0; index < 11; index += 1) outbox.submit(ride(`r${index}`));

    outbox.submit(ride('r0'));
    outbox.submit(ride('r10'));
    expect(sent.map((each) => each.ride.rideId)).toEqual([
      ...Array.from({ length: 11 }, (_, index) => `r${index}`),
      'r0',
    ]);
  });

  it('stops listening for the network when it goes', () => {
    outbox.submit(ride('a'));
    fail(0, 0);

    TestBed.resetTestingModule();
    window.dispatchEvent(new Event('online'));

    expect(sent.length).toBe(1);
  });
});
