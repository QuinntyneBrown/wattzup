import type { FeatureView, FilmChapter } from '@telo/components';

/**
 * The marketing page's fixed copy (ADR 0027), in the words of the purpose in `AGENTS.md` and the
 * script of the film. The photographs are the design system's, copied into `public/images` by
 * `npm run media:sync`.
 */

/**
 * The pitch film "Meet Telo Ride", docs/videos/00-meet-telo-ride, copied into `public/media` with
 * its captions by `npm run media:sync`. The chapters are its acts (its README's run sheet).
 */
export const FILM = {
  src: 'media/meet-telo-ride.mp4',
  captions: 'media/meet-telo-ride.vtt',
  // A frame of the film at 0:24, kept in git.
  still: 'images/meet-telo-ride.jpg',
  label: 'Meet Telo Ride',
  playLabel: 'Play the Telo Ride film',
  length: '2:19',
  chapters: [
    { at: 0, time: '0:00', title: 'Same wall, same numbers' },
    { at: 21, time: '0:21', title: 'Meet Telo Ride' },
    { at: 57, time: '0:57', title: 'Race and Classes' },
    { at: 80, time: '1:20', title: 'Level up, unlock more' },
    { at: 103, time: '1:43', title: 'Your bike, now a game' },
  ] satisfies readonly FilmChapter[],
} as const;

export const HERO = {
  kicker: 'From the Telo family',
  heading: 'Your bike, now a game.',
  lead: 'Telo Ride turns a smart bike at home into a game. It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.',
  note: 'Runs in Chrome or Edge, on a phone, a tablet or a desktop. Nothing to install.',
  image: 'images/machines/echelon-ex5s.jpg',
} as const;

export const FEATURES: readonly FeatureView[] = [
  {
    image: 'images/worlds/oldtown.jpg',
    kicker: 'Race',
    heading: 'Chase your ghost.',
    text: 'Ride a map against the ghost of your best time, a pack of bots, or other riders.',
  },
  {
    image: 'images/classes/power-20.jpg',
    kicker: 'Classes',
    heading: 'Ride along, together.',
    text: 'Ride along to a video, alone or with a group.',
  },
  {
    image: 'images/worlds/dolomites.jpg',
    kicker: 'Progression',
    heading: 'Level up. Unlock more.',
    text: 'Race and Classes feed one progression: XP, rider levels, stars and map unlocks.',
  },
  {
    image: 'images/classes/threshold-20.jpg',
    kicker: 'Custom workout',
    heading: 'Your own intervals.',
    text: 'Build a custom workout under Profile and ride it at the resistance you set.',
  },
];

export const FOOTER = {
  blurb: 'Telo Ride, from the Telo family, turns a smart bike at home into a game.',
  legal: '© 2026 Telo',
} as const;
