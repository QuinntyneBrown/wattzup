import { ridersOnRoad } from './race-riders';

describe('ridersOnRoad (L2-064 AC3)', () => {
  it('draws the riders from 4 m behind to the far end of the road, furthest ahead first', () => {
    const riders = ridersOnRoad(
      [
        { jersey: 'nova', metres: 12 },
        { jersey: 'rook', metres: -4 },
        { jersey: 'juno', metres: 60 },
        { jersey: 'atlas', metres: -4.5 },
        { jersey: 'kite', metres: 121 },
      ],
      120,
    );

    expect(riders.map((rider) => rider.jersey)).toEqual(['juno', 'nova', 'rook']);
  });

  it('puts each rider on a line of its own by its order in the field, and the ghost beside the rider', () => {
    const riders = ridersOnRoad(
      [
        { jersey: 'nova', metres: 0 },
        { jersey: 'rook', metres: 0 },
        { jersey: 'ghost', metres: 0 },
      ],
      120,
    );

    expect(riders.map((rider) => rider.lane)).toEqual([1.5, -0.9, 1.2]);
  });

  it('keeps a rider on the same line as the order of places changes', () => {
    const field = [
      { jersey: 'nova', metres: 5 },
      { jersey: 'rook', metres: 10 },
    ];
    const lane = (jersey: string) =>
      ridersOnRoad(field, 120).find((rider) => rider.jersey === jersey)!.lane;

    expect([lane('nova'), lane('rook')]).toEqual([1.5, -0.9]);
  });
});
