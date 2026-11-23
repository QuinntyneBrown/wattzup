import { formatClock } from '../metric/format-clock';
import { rideTicks, traceArea, traceBlocks, tracePoints } from './ride-trace-geometry';

describe('ride trace geometry', () => {
  const segments = [
    { kind: 'warm-up', duration: 300, target: 143 },
    { kind: 'work', duration: 30, target: 384 },
  ] as const;

  it('draws each target as a block up to its power, ridden ones past', () => {
    expect(traceBlocks(segments, 600, 300)).toEqual([
      { modifier: 'warmup', x: 2, width: 296, y: 457, past: true },
      { modifier: 'work', x: 302, width: 26, y: 216, past: false },
    ]);
  });

  it('puts a point at the middle of each bucket, the power held within the top', () => {
    expect(tracePoints([300, 900], 2, 600)).toBe('1,300 3,0');
  });

  it('closes the area along the bottom, and draws none before the first second', () => {
    expect(traceArea([300, 600], 1, 600)).toBe('M0.5,600 L0.5,300 L1.5,0 L1.5,600 Z');
    expect(traceArea([], 1, 600)).toBe('');
  });

  it('ticks every 5:00 to the end of a 30-minute ride (L2-103 AC4)', () => {
    expect(rideTicks(1800, formatClock).map((tick) => tick.text)).toEqual([
      '0:00',
      '5:00',
      '10:00',
      '15:00',
      '20:00',
      '25:00',
      '30:00',
    ]);
  });

  it('ticks every 15:00 past an hour, and ends on a ride that is not a whole number of steps', () => {
    expect(rideTicks(4000, formatClock).map((tick) => tick.text)).toEqual([
      '0:00',
      '15:00',
      '30:00',
      '45:00',
      '1:00:00',
      '1:06:40',
    ]);
    expect(rideTicks(420, formatClock).map((tick) => [tick.text, tick.anchor])).toEqual([
      ['0:00', 'start'],
      ['5:00', 'middle'],
      ['7:00', 'end'],
    ]);
  });
});
