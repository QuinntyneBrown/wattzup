// Unit test
// Traces to: L2-060 AC1; L2-059 AC1, AC5
// Description: the standings order the rider and the field by distance, a tie keeping the rider ahead; each gap is the
// distance ÷ the rider's speed, at least 4 m/s; gaps and places read as the board and the power panel show them.
import type { FieldPosition } from './race-field';
import { formatGap, ordinal, rankStandings } from './standings';

const bot = (id: string, metres: number): FieldPosition => ({
  id,
  name: id,
  jersey: id,
  bot: true,
  metres,
});

describe('rankStandings', () => {
  it('orders by distance, the furthest first, with each gap at the rider’s speed', () => {
    const rows = rankStandings([bot('a', 70), bot('b', 120), bot('c', 30)], 100, 10);
    expect(rows.map((row) => [row.id, row.place, row.gap])).toEqual([
      ['b', 1, 2],
      ['you', 2, 0],
      ['a', 3, -3],
      ['c', 4, -7],
    ]);
    expect(rows[1]).toMatchObject({ you: true, name: 'You', jersey: 'you', bot: false });
  });

  it('orders riders at the finish line by the second they reached it, the rider ahead in the same second', () => {
    const crossings = new Map([
      ['a', 81],
      ['b', 80],
      ['you', 81],
    ]);
    const rows = rankStandings([bot('a', 500), bot('b', 500), bot('c', 470)], 500, 9, crossings);
    expect(rows.map((row) => row.id)).toEqual(['b', 'you', 'a', 'c']);
  });

  it('keeps the rider ahead of a level opponent, then the field’s order', () => {
    expect(rankStandings([bot('a', 0), bot('b', 0)], 0, null).map((row) => row.id)).toEqual([
      'you',
      'a',
      'b',
    ]);
  });

  it.each([
    [null, 10],
    [0, 10],
    [2, 10],
    [8, 5],
  ])('measures a 40 m gap at %d m/s as %d s', (speed, seconds) => {
    expect(rankStandings([bot('a', 140)], 100, speed)[0]!.gap).toBe(seconds);
  });
});

describe('formatGap', () => {
  it.each([
    [7, '+0:07'],
    [-5, '−0:05'],
    [0, '0:00'],
    [0.4, '0:00'],
    [-0.6, '−0:01'],
    [75, '+1:15'],
  ])('reads %d s as %s', (seconds, text) => {
    expect(formatGap(seconds)).toBe(text);
  });
});

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
  ])('reads %d as %s', (place, text) => {
    expect(ordinal(place)).toBe(text);
  });
});
