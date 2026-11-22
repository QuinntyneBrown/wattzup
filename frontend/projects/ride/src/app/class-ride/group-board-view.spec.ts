// Unit test
// Traces to: L2-090 AC1; L2-087 AC1
// Description: the board's view of the standings: the rider's place as an ordinal over the field ("5th / 9"), each
// rider's output in whole kJ, highest first, and the rider's own row (the seat's jersey) as "You" in the "you" jersey.
import type { Standings } from '@telo/api';
import { groupBoardView, ordinal } from './group-board-view';

const row = (position: number, name: string, jersey: string, outputKj: number) =>
  ({ position, name, jersey, level: 3, kind: 'person', outputKj, gapKj: 0 }) as const;

describe('groupBoardView', () => {
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
    [22, '22nd'],
    [23, '23rd'],
  ])('reads place %d as %s', (place, text) => {
    expect(ordinal(place)).toBe(text);
  });

  it('marks the seat’s row as You, rounds each output to whole kJ and counts the field', () => {
    const standings: Standings = {
      sessionId: 's',
      rows: [
        row(1, 'kenji.cyc', 'kenji', 73.2),
        row(2, 'lena.k', 'lena', 65.5),
        row(3, 'Pacer Rook', 'rook', 49.8),
      ],
    };

    expect(groupBoardView(standings, 'lena')).toEqual({
      place: '2nd',
      total: 3,
      rows: [
        { position: 1, name: 'kenji.cyc', jersey: 'kenji', kj: 73, you: false },
        { position: 2, name: 'You', jersey: 'you', kj: 66, you: true },
        { position: 3, name: 'Pacer Rook', jersey: 'rook', kj: 50, you: false },
      ],
    });
  });

  it('has no place when the rider is not on the board, and no view before the first standings', () => {
    expect(
      groupBoardView({ sessionId: 's', rows: [row(1, 'kenji.cyc', 'kenji', 1)] }, 'lena')!.place,
    ).toBeNull();
    expect(groupBoardView(null, 'lena')).toBeNull();
  });
});
