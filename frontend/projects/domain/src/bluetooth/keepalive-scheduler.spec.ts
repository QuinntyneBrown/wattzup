// Unit test
// Traces to: L2-016 AC1 to AC3
// Description: the keepalive is timed from the clock, not from counted ticks: about one a second however the ticks
// arrive, none after stop, and a failed write is reported. A Subject stands in for the ticker and a number for the
// clock; nothing sleeps.
import { Subject } from 'rxjs';
import { KeepaliveScheduler } from './keepalive-scheduler';

describe('KeepaliveScheduler', () => {
  let ticks: Subject<number>;
  let clock: number;
  let sent: number[];
  let failures: unknown[];
  let scheduler: KeepaliveScheduler;
  let write: () => Promise<unknown>;

  /** Moves the clock on by `ms` and ticks once. */
  const tickAfter = (ms: number) => {
    clock += ms;
    ticks.next(0);
  };

  beforeEach(() => {
    ticks = new Subject();
    clock = 10_000;
    sent = [];
    failures = [];
    write = async () => void sent.push(clock);
    scheduler = new KeepaliveScheduler(
      { seconds: ticks },
      () => write(),
      (error) => failures.push(error),
      () => clock,
    );
  });

  it('sends one a second: 5 in 5 seconds of ticks (AC1)', () => {
    scheduler.start();
    for (let second = 0; second < 5; second++) tickAfter(1000);

    expect(sent).toHaveLength(5);
  });

  it('sends a tick that comes a little early, so jitter never skips a second', () => {
    scheduler.start();
    tickAfter(1000);
    tickAfter(960);
    tickAfter(1040);

    expect(sent).toHaveLength(3);
  });

  it('sends one a second when ticks come twice a second', () => {
    scheduler.start();
    for (let half = 0; half < 10; half++) tickAfter(500);

    expect(sent).toHaveLength(5);
  });

  it('sends one per late tick, not the ones a throttled tab missed (AC2)', () => {
    scheduler.start();
    tickAfter(1000);
    tickAfter(3000);
    tickAfter(1000);

    expect(sent).toEqual([11_000, 14_000, 15_000]);
  });

  it('sends nothing after stop, and starts again from the clock (AC3)', () => {
    scheduler.start();
    tickAfter(1000);
    scheduler.stop();
    tickAfter(1000);
    tickAfter(1000);
    expect(sent).toHaveLength(1);

    scheduler.start();
    tickAfter(500);
    tickAfter(500);
    expect(sent).toHaveLength(2);
  });

  it('reports a write that fails', async () => {
    const lost = new DOMException('GATT Server is disconnected.', 'NetworkError');
    write = async () => {
      throw lost;
    };
    scheduler.start();
    tickAfter(1000);
    await Promise.resolve();
    await Promise.resolve();

    expect(failures).toEqual([lost]);
  });
});
