import type {
  ClassResult,
  RaceResult,
  ResultStanding,
  RideRecordedDto,
  RideSyncState,
} from '@telo/api';
import { resultsView } from './results-view';

// Traces to: L2-073 AC1, AC2, AC3; L2-078 AC1; L2-079 AC1; L2-074 AC1-AC4; L2-075 AC1-AC3; L2-077 AC1, AC3, AC4;
// L2-076 AC1, AC3
// Results from the result the ride hands over: the header's context, the hidden heading, "You finished", the place or
// the time, "of 10", the line under it, the final standings and the again action. On the podium the line reads "{time}
// · on the podium"; off it, "{time} · {n} s off the podium", n the seconds behind 3rd.
const SENDING: RideSyncState = { kind: 'sending' };
const WAITING = { state: 'waiting', total: null, lines: [] };

describe('resultsView', () => {
  const rider = (name: string, finishTimeS: number, you = false): ResultStanding => ({
    name,
    jersey: you ? 'you' : name.split(' ')[1].toLowerCase(),
    bot: !you,
    you,
    finishTimeS,
  });
  const race = (
    place: number,
    standings: ResultStanding[],
    over: Partial<RaceResult> = {},
  ): RaceResult => ({
    mapId: 'old-town-criterium',
    mapName: 'Old Town Criterium',
    mode: 'bots',
    pack: 'medium',
    finishTimeS: standings[place - 1].finishTimeS,
    place,
    field: standings.length,
    standings,
    ...over,
  });

  it('heads a riders-online race "Live race" (the peers mock)', () => {
    const view = resultsView({ ...race(1, [rider('You', 1621, true)]), mode: 'online' }, SENDING);

    expect(view.context).toBe('Old Town Criterium · Live race');
  });

  it('reads 2nd of 10 against bots as a podium place, with the standings (AC1, AC3)', () => {
    const view = resultsView(
      race(2, [rider('Pacer Nova', 1592), rider('You', 1598, true), rider('Pacer Rook', 1607)], {
        field: 10,
      }),
      SENDING,
    );

    expect(view).toEqual({
      context: 'Old Town Criterium · vs Bots',
      heading: 'Race results',
      lead: 'You finished',
      big: '2nd',
      podium: true,
      of: 'of 10',
      sub: '26:38 · on the podium',
      standings: [
        { place: 1, name: 'Pacer Nova', jersey: 'nova', bot: true, you: false, value: '26:32' },
        { place: 2, name: 'You', jersey: 'you', bot: false, you: true, value: '26:38' },
        { place: 3, name: 'Pacer Rook', jersey: 'rook', bot: true, you: false, value: '26:47' },
      ],
      again: {
        label: 'Race it again',
        path: '/race/old-town-criterium',
        query: { mode: 'bots', pack: 'medium' },
      },
      xp: WAITING,
      stars: null,
      unlock: null,
    });
  });

  it('reads 6th of 10 as 18 s off the podium (AC2)', () => {
    const standings = [
      rider('Pacer Nova', 1622),
      rider('Pacer Rook', 1628),
      rider('Pacer Juno', 1634),
      rider('Pacer Atlas', 1640),
      rider('Pacer Kite', 1646),
      rider('You', 1652, true),
    ];
    const view = resultsView(race(6, standings, { field: 10 }), SENDING);

    expect(view.big).toBe('6th');
    expect(view.podium).toBe(false);
    expect(view.sub).toBe('27:32 · 18 s off the podium');
  });

  it('reads a solo race as its time against your best, with no standings', () => {
    const view = resultsView(
      race(1, [rider('You', 57, true), rider('Ghost Best', 60)], { mode: 'solo', pack: null }),
      SENDING,
    );

    expect(view).toEqual(
      expect.objectContaining({
        context: 'Old Town Criterium · vs your best',
        big: '0:57',
        podium: false,
        of: null,
        sub: null,
        standings: null,
        again: {
          label: 'Race it again',
          path: '/race/old-town-criterium',
          query: { mode: 'solo' },
        },
      }),
    );
  });

  it('reads a solo class as its time, output and share on target (L2-078 AC1)', () => {
    const result: ClassResult = {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    };

    expect(resultsView(result, SENDING)).toEqual({
      context: '30 Minute HIIT Cardio · Solo',
      heading: 'Class results',
      lead: 'You finished',
      big: '30:00',
      podium: false,
      of: null,
      sub: '342 kJ · 84% on target',
      standings: null,
      again: { label: 'Ride it again', path: '/classes/hiit-cardio-30', query: {} },
      xp: WAITING,
      stars: null,
      unlock: null,
    });
  });

  it('writes an hour or more as h:mm:ss', () => {
    expect(
      resultsView(race(1, [rider('You', 3723, true)], { mode: 'solo', pack: null }), SENDING).big,
    ).toBe('1:02:03');
  });

  describe('what the ride earned', () => {
    const answer = (over: Partial<RideRecordedDto>): RideSyncState => ({
      kind: 'recorded',
      answer: {
        rideId: 'r',
        recordedAt: '2026-11-21T07:31:00Z',
        xpLines: [
          { kind: 'finished', label: 'Finished', xp: 100 },
          { kind: 'place', label: '2nd of 10', xp: 160 },
          { kind: 'podium', label: 'Podium', xp: 75 },
          { kind: 'onTarget', label: '84% on target', xp: 67 },
          { kind: 'streak', label: '4-day streak', xp: 40 },
        ],
        xpTotal: 442,
        totalXp: 2282,
        level: 7,
        levelUp: false,
        nextLevelXp: 2600,
        xpToNextLevel: 318,
        stars: { held: 2, earned: 1 },
        best: { bestSeconds: 1598, previousBestSeconds: null, isNewBest: false },
        openedMapId: null,
        ...over,
      },
    });
    const bots = race(2, [rider('Pacer Nova', 1592), rider('You', 1598, true)], { field: 10 });
    const solo = (finishTimeS: number) =>
      race(1, [rider('You', finishTimeS, true), rider('Ghost Best', 1700)], {
        mode: 'solo',
        pack: null,
      });
    const hiit: ClassResult = {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    };

    it('shows the total and each line in the order returned, and the stars on the map (L2-074 AC1, L2-075 AC1)', () => {
      const view = resultsView(bots, answer({}));

      expect(view.xp).toEqual({
        state: 'ready',
        total: '+442',
        lines: [
          { label: 'Finished', xp: '+100' },
          { label: '2nd of 10', xp: '+160' },
          { label: 'Podium', xp: '+75' },
          { label: '84% on target', xp: '+67' },
          { label: '4-day streak', xp: '+40' },
        ],
      });
      expect(view.stars).toEqual({
        title: 'Stars on Old Town Criterium',
        held: 2,
        newLine: '+1 new star',
      });
      expect(view.lead).toBe('You finished');
    });

    it('reads two new stars in the plural, and none as no line (L2-075 AC1, AC2)', () => {
      expect(resultsView(bots, answer({ stars: { held: 2, earned: 2 } })).stars?.newLine).toBe(
        '+2 new stars',
      );
      expect(
        resultsView(bots, answer({ stars: { held: 2, earned: 0 } })).stars?.newLine,
      ).toBeNull();
    });

    it('waits, waits offline or has not been recorded, with no stars panel (L2-074 AC2, AC3, AC4)', () => {
      expect(
        [
          resultsView(bots, SENDING),
          resultsView(bots, { kind: 'waitingOffline' }),
          resultsView(bots, { kind: 'notRecorded' }),
        ].map((view) => [view.xp.state, view.stars]),
      ).toEqual([
        ['waiting', null],
        ['offline', null],
        ['notRecorded', null],
      ]);
    });

    it('reads a solo race faster than the best as a new personal best (L2-077 AC1)', () => {
      const view = resultsView(
        solo(1598),
        answer({ best: { bestSeconds: 1598, previousBestSeconds: 1630, isNewBest: true } }),
      );

      expect([view.lead, view.big, view.sub]).toEqual([
        'New personal best',
        '26:38',
        'Best before: 27:10',
      ]);
    });

    it('reads a solo race slower than the best with the best (L2-077 AC3)', () => {
      const view = resultsView(
        solo(1652),
        answer({ best: { bestSeconds: 1598, previousBestSeconds: 1598, isNewBest: false } }),
      );

      expect([view.lead, view.big, view.sub]).toEqual(['You finished', '27:32', 'Best: 26:38']);
    });

    it('reads a first solo finish as the time alone (L2-077 AC4)', () => {
      const view = resultsView(solo(1598), answer({}));

      expect([view.lead, view.sub]).toEqual(['You finished', null]);
    });

    const docklands = {
      id: 'neon-docklands',
      name: 'Neon Docklands',
      place: 'A harbour city after dark',
      photoUrl: 'maps/neon-docklands-photo.jpg',
    };

    it('shows the map the ride opened as its unlock card (L2-076 AC1)', () => {
      const view = resultsView(bots, answer({ openedMapId: 'neon-docklands' }), docklands);

      expect(view.unlock).toEqual({
        mapId: 'neon-docklands',
        title: 'Neon Docklands is open',
        place: 'A harbour city after dark.',
        photoUrl: 'maps/neon-docklands-photo.jpg',
        actionLabel: 'Ride Neon Docklands',
        path: '/race/neon-docklands',
      });
    });

    it('shows no unlock card when no map opened, or until the ride is recorded (L2-076 AC3)', () => {
      expect(resultsView(bots, answer({}), docklands).unlock).toBeNull();
      expect(resultsView(bots, SENDING, docklands).unlock).toBeNull();
    });

    it('shows no unlock card until the opened map is known', () => {
      expect(resultsView(bots, answer({ openedMapId: 'neon-docklands' })).unlock).toBeNull();
      expect(resultsView(bots, answer({ openedMapId: 'vice-city' }), docklands).unlock).toBeNull();
    });

    it('gives a class no stars panel (L2-075 AC3)', () => {
      const view = resultsView(hiit, answer({ stars: null, best: null }));

      expect(view.xp.state).toBe('ready');
      expect(view.stars).toBeNull();
    });
  });
});
