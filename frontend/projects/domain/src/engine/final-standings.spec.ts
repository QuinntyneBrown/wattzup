import { finalStandings } from './final-standings';
import { type Standing, YOU } from './standings';

// Traces to: L2-073 AC3
// The final standings when the rider crosses the line: every rider with a finish time, in the order they finished. A
// rider who crossed first finishes at the second they crossed; one still riding finishes at the rider's time plus their
// gap behind, rounded to the second.
describe('finalStandings', () => {
  const row = (id: string, place: number, gap: number): Standing => ({
    id,
    name: id === YOU ? 'You' : `Pacer ${id}`,
    jersey: id,
    bot: id !== YOU,
    you: id === YOU,
    place,
    gap,
  });

  it('gives a rider who crossed first the second they crossed', () => {
    const standings = [row('nova', 1, 0), row(YOU, 2, 0), row('rook', 3, -8.6)];
    const crossings = new Map([
      ['nova', 1592],
      [YOU, 1598],
    ]);

    expect(finalStandings(standings, crossings, 1598)).toEqual([
      { name: 'Pacer nova', jersey: 'nova', bot: true, you: false, finishTimeS: 1592 },
      { name: 'You', jersey: YOU, bot: false, you: true, finishTimeS: 1598 },
      { name: 'Pacer rook', jersey: 'rook', bot: true, you: false, finishTimeS: 1607 },
    ]);
  });

  it('keeps the order the riders finished in', () => {
    const standings = [row(YOU, 1, 0), row('juno', 2, -3.2), row('echo', 3, -12.5)];

    expect(
      finalStandings(standings, new Map([[YOU, 57]]), 57).map((rider) => rider.finishTimeS),
    ).toEqual([57, 60, 70]);
  });
});
