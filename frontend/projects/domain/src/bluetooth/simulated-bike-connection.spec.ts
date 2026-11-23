// Unit test
// Traces to: L2-024 AC1, AC2
// Description: the simulated bike resolves an Echelon EX-5s with no chooser, sends a D1 and a D2 frame each second of
// the ticker once connected, and reports a new resistance in its next D2. A fake ticker drives it; nothing sleeps.
import { TestBed } from '@angular/core/testing';
import { TICKER } from '@telo/api';
import { Subject } from 'rxjs';
import { toHex } from '../protocol/echelon-protocol';
import { SIMULATED_BIKE, SimulatedBikeConnection } from './simulated-bike-connection';

describe('SimulatedBikeConnection', () => {
  let second: Subject<number>;
  let bike: SimulatedBikeConnection;
  let frames: string[];

  beforeEach(() => {
    second = new Subject<number>();
    TestBed.configureTestingModule({
      providers: [SimulatedBikeConnection, { provide: TICKER, useValue: { seconds: second } }],
    });
    bike = TestBed.inject(SimulatedBikeConnection);
    frames = [];
    bike.frames.subscribe((frame) => frames.push(toHex(frame)));
  });

  const tick = (): void => second.next(0);

  it('resolves an Echelon EX-5s at once, with no chooser', async () => {
    await expect(bike.requestBike()).resolves.toEqual({
      id: 'EX5S-0bf669f1',
      name: 'Echelon EX-5s',
      identifier: 'EX5S-0bf669f1',
      kind: 'echelon',
    });
    expect(SIMULATED_BIKE.name).toBe('Echelon EX-5s');
  });

  it('sends nothing until it is connected', () => {
    tick();

    expect(frames).toEqual([]);
  });

  it('sends a D1 then a D2 frame each second once connected', async () => {
    await bike.connect();

    tick();
    tick();

    expect(frames.map((frame) => frame.slice(0, 5))).toEqual(['F0 D1', 'F0 D2', 'F0 D1', 'F0 D2']);
    expect(frames[0].slice(9, 14)).toBe('00 01'); // elapsed: 1 s
    expect(frames[2].slice(9, 14)).toBe('00 02'); // elapsed: 2 s
  });

  it('reports a new resistance in its next D2 frame', async () => {
    await bike.connect();

    await bike.setResistance(14);
    tick();

    expect(frames[1]).toBe('F0 D2 01 0E D1');
  });

  it('clamps a target above 32 as the bike would', async () => {
    await bike.connect();

    await bike.setResistance(40);
    tick();

    expect(frames[1]).toBe('F0 D2 01 20 E3');
  });

  it('stops sending when it disconnects', async () => {
    await bike.connect();
    bike.disconnect();

    tick();

    expect(frames).toEqual([]);
  });
});
