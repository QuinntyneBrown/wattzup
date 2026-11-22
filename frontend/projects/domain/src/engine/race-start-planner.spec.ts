// Unit test
// Traces to: L2-050 AC1, AC2, AC3
// Description: each race mode starts its own way: Your best time reads "Start ride" and opens the race solo; Bots reads
// "Go to the start line" and opens the race with the chosen pack (the lobby joins with slice 15.1); Riders online reads
// "Find a race" and opens the lobby.
import { RaceStartPlanner } from './race-start-planner';

describe('RaceStartPlanner', () => {
  it.each([
    ['solo', 'medium', 'Start ride', ['/race', 'dolomites', 'ride'], { mode: 'solo' }],
    [
      'bots',
      'medium',
      'Go to the start line',
      ['/race', 'dolomites', 'lobby'],
      { mode: 'bots', pack: 'medium' },
    ],
    [
      'bots',
      'hard',
      'Go to the start line',
      ['/race', 'dolomites', 'lobby'],
      { mode: 'bots', pack: 'hard' },
    ],
    ['online', 'medium', 'Find a race', ['/race', 'dolomites', 'lobby'], { mode: 'online' }],
  ] as const)(
    '%s with a %s pack reads "%s" and opens %j',
    (mode, pack, label, route, queryParams) => {
      expect(RaceStartPlanner.plan('dolomites', mode, pack)).toEqual({ label, route, queryParams });
    },
  );
});
