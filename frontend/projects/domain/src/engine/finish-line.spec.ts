// Unit test
// Traces to: L2-071 AC1
// Description: the finish line holds a rider at the map's distance from the second they first reach it, and keeps that
// second for the placing.
import { FinishLine } from './finish-line';
import type { FieldPosition } from './race-field';

const bot = (id: string, metres: number): FieldPosition => ({
  id,
  name: id,
  jersey: id,
  bot: true,
  metres,
});

describe('FinishLine', () => {
  it('leaves a rider short of the line where they are', () => {
    const line = new FinishLine(500);
    expect(line.hold('you', 499.4, 56)).toBe(499.4);
    expect(line.crossings.size).toBe(0);
  });

  it('holds a rider at the line and keeps the second they first reached it', () => {
    const line = new FinishLine(500);
    expect(line.hold('you', 508.3, 57)).toBe(500);
    expect(line.hold('you', 517.2, 58)).toBe(500);
    expect(line.crossings.get('you')).toBe(57);
  });

  it('holds the field, each at its own second', () => {
    const line = new FinishLine(500);
    line.holdAll([bot('nova', 480), bot('rook', 505)], 80);
    const field = line.holdAll([bot('nova', 503), bot('rook', 511)], 81);
    expect(field.map((rider) => rider.metres)).toEqual([500, 500]);
    expect([...line.crossings]).toEqual([
      ['rook', 80],
      ['nova', 81],
    ]);
  });
});
