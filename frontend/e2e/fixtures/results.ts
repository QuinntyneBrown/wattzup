import type { Page } from '@playwright/test';

/**
 * Results as a reload finds it: the result and the ride a finished ride left in the navigation's state. Results submits
 * the ride again, and the backend answers a repeat as it did the first time (L2-125 AC3), so the panels fill as they
 * did. Each ride gets a new id. The state is written from the app's icon, a document of the app's origin that does
 * not start the app: started at `/`, the router ends its first navigation after the page's load (its routes load on
 * demand) and writes its own state over the history entry, which sent one reload in five back to the first screen.
 */
export async function openResults(page: Page, state: object): Promise<void> {
  await page.goto('/favicon.svg');
  await page.evaluate((s) => history.replaceState(s, '', '/results'), state);
  await page.reload();
}

/** A ride's facts as the race submits them, for the given time. */
function rideFacts(elapsedSeconds: number, race: object) {
  return {
    rideId: crypto.randomUUID(),
    elapsedSeconds,
    distanceMeters: 14_200,
    outputKj: 450,
    maxPowerWatts: 410,
    maxSpeedKmh: 32,
    onTargetShare: 0.84,
    speedSamplesKmh: [],
    finishedAt: '2026-11-21T07:30:00.000Z',
    timeZoneId: 'Europe/London',
    ...race,
  };
}

/** A solo race on Old Town Criterium (vs your best) in `finishTimeS`. */
export function soloRace(finishTimeS: number) {
  const standings = [
    { name: 'You', jersey: 'you', bot: false, you: true, finishTimeS },
    { name: 'Your best', jersey: 'ghost', bot: false, you: false, finishTimeS: finishTimeS + 30 },
  ];
  return {
    raceResult: {
      mapId: 'old-town-criterium',
      mapName: 'Old Town Criterium',
      mode: 'solo',
      pack: null,
      finishTimeS,
      place: 1,
      field: 2,
      standings,
    },
    ride: rideFacts(finishTimeS, {
      kind: 'race',
      mapId: 'old-town-criterium',
      mode: 'solo',
      pack: null,
      place: 1,
      fieldSize: 2,
    }),
  };
}

/** 2nd of 10 against the medium pack on Old Town Criterium in 26:38, with the mocks' pacers. */
export function botsRace() {
  const solo = soloRace(1598);
  const times = [1592, 1607, 1613, 1619, 1625, 1631, 1637, 1643, 1649];
  const pacers = ['Nova', 'Rook', 'Juno', 'Atlas', 'Kite', 'Vale', 'Moss', 'Flint', 'Echo'].map(
    (name, index) => ({
      name: `Pacer ${name}`,
      jersey: name.toLowerCase(),
      bot: true,
      you: false,
      finishTimeS: times[index],
    }),
  );
  const you = { name: 'You', jersey: 'you', bot: false, you: true, finishTimeS: 1598 };
  return {
    raceResult: {
      ...solo.raceResult,
      mode: 'bots',
      pack: 'medium',
      place: 2,
      field: 10,
      standings: [pacers[0], you, ...pacers.slice(1)],
    },
    ride: { ...solo.ride, mode: 'bots', pack: 'medium', place: 2, fieldSize: 10 },
  };
}

/** 30 Minute HIIT Cardio, ridden alone to its end. */
export function soloClass() {
  return {
    classResult: {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    },
    ride: { ...rideFacts(1800, { kind: 'class', classId: 'hiit-cardio-30' }), distanceMeters: 0 },
  };
}

/** The backend's answer for `ride`: the XP lines given, the stars and best given (none for a class) and any map opened. */
export function recorded(
  ride: { rideId: string },
  lines: [string, number][],
  stars: { held: number; earned: number } | null,
  best: { bestSeconds: number; previousBestSeconds: number | null; isNewBest: boolean } | null,
  openedMapId: string | null = null,
) {
  const xpTotal = lines.reduce((sum, [, xp]) => sum + xp, 0);
  return {
    rideId: ride.rideId,
    recordedAt: '2026-11-21T07:31:00Z',
    xpLines: lines.map(([label, xp]) => ({ kind: 'finished', label, xp })),
    xpTotal,
    totalXp: 1840 + xpTotal,
    level: 7,
    levelUp: false,
    nextLevelXp: 2600,
    xpToNextLevel: 2600 - 1840 - xpTotal,
    stars,
    best,
    openedMapId,
  };
}
