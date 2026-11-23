import type { FeatureView, FilmChapter } from '@telo/components';

/**
 * The marketing page's fixed copy (ADR 0027), in the words of the purpose in `AGENTS.md` and the
 * script of the film. Photographs and world screenshots are copied into `public/images` by
 * `npm run media:sync`.
 */

/**
 * The pitch film "Meet Telo Ride", docs/videos/00-meet-telo-ride, copied into `public/media` with
 * its captions by `npm run media:sync`. The chapters are its acts (its README's run sheet).
 */
export const FILM = {
  src: 'media/meet-telo-ride.mp4',
  captions: 'media/meet-telo-ride.vtt',
  // A frame of the film, kept in git.
  still: 'images/meet-telo-ride.jpg',
  label: 'Meet Telo Ride',
  playLabel: 'Play the Telo Ride film',
  length: '3:11',
  chapters: [
    { at: 0, time: '0:00', title: 'Same wall, same numbers' },
    { at: 21, time: '0:21', title: 'Meet Telo Ride' },
    { at: 57, time: '0:57', title: 'Race & 3D worlds' },
    { at: 106, time: '1:46', title: 'Level up, unlock more' },
    { at: 132, time: '2:12', title: 'Coming next: Local AI' },
    { at: 155, time: '2:35', title: 'Your bike, now a game' },
  ] satisfies readonly FilmChapter[],
} as const;

export const HERO = {
  kicker: 'From the Telo family',
  heading: 'Your bike, now a game.',
  lead: 'Telo Ride turns a smart bike at home into a game. It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.',
  note: 'Runs in Chrome or Edge, on a phone, a tablet or a desktop. Installable and offline-ready.',
  image: 'images/machines/echelon-ex5s.jpg',
} as const;

export const FEATURES: readonly FeatureView[] = [
  {
    image: 'images/showcase/ibiza-course.jpg',
    kicker: 'Race',
    heading: 'Chase your ghost.',
    text: 'Ride 3D courses modelled after real classes against your best-time ghost, a pack of bots, or live riders online.',
  },
  {
    image: 'images/classes/power-20.jpg',
    kicker: 'Classes',
    heading: 'Ride along, together.',
    text: 'Ride along to a synced video, alone or on a live group output board, while Telo Ride sets every interval.',
  },
  {
    image: 'images/showcase/results-unlock.png',
    kicker: 'Progression',
    heading: 'Level up. Unlock more.',
    text: 'Race and Classes feed one progression: XP, rider levels 1 to 30, daily streaks, stars and celebrated map unlocks.',
  },
  {
    image: 'images/showcase/custom-workout.png',
    kicker: 'Custom workout',
    heading: 'Your own intervals.',
    text: 'Build, preview and ride your own intervals under Profile with full manual control—even without a network.',
  },
];

export const WORLDS: readonly FeatureView[] = [
  {
    image: 'images/showcase/ibiza-course.jpg',
    kicker: 'Blender Course · WebGPU',
    heading: 'Ibiza Sunset Strip.',
    text: '8.4 km and 159 m of climbing along the waterfront and beach clubs into a five-sprint sunset finale.',
  },
  {
    image: 'images/showcase/neon-docklands.png',
    kicker: '3D World · Harbour Loop',
    heading: 'Neon Docklands.',
    text: 'A harbour city after dark where every one-minute effort kicks up a glowing bridge ramp over the docks.',
  },
  {
    image: 'images/showcase/vice-city.png',
    kicker: '3D World · Ocean Drive',
    heading: 'Vice City.',
    text: 'Pastel art deco hotels, palms and neon fins facing the Atlantic along a fast sunrise boulevard.',
  },
  {
    image: 'images/showcase/cliffside-coast.jpg',
    kicker: 'Blender Course · 32 km',
    heading: 'Cliffside Coast.',
    text: 'A clifftop headland road at sunset with the sea beside you and steady tempo climbs over every rise.',
  },
  {
    image: 'images/showcase/cinque-terre.jpg',
    kicker: 'Blender Course · Coastal Pack',
    heading: 'Cinque Terre.',
    text: 'Mediterranean sea walls, cypresses and winding coastal tarmac built for pack racing in WebGPU.',
  },
  {
    image: 'images/showcase/haleakala.jpg',
    kicker: 'Blender Course · Summit Climb',
    heading: 'Haleakalā.',
    text: 'Tropical fruit stands, palms and steady volcanic gradients rising toward the crater rim.',
  },
];

export const AI_PLANNED: readonly FeatureView[] = [
  {
    image: 'images/showcase/neon-docklands.png',
    kicker: 'Coming next · Voice Cockpit',
    heading: 'Hands-free from the saddle.',
    text: 'A local “Hey Telo” wake word and Moonshine speech recognition let you nudge resistance, query gaps or report a bug without touching the screen.',
  },
  {
    image: 'images/showcase/ibiza-course.jpg',
    kicker: 'Coming next · Kart Announcer',
    heading: 'Live play-by-play & banter.',
    text: 'Free Kokoro-82M voice synthesis calls climbs, overtakes and map unlocks, with 3D spatial bot banter pre-generated in the lobby.',
  },
  {
    image: 'images/showcase/custom-workout.png',
    kicker: 'Coming next · Coach & Builder',
    heading: 'Smart coaching & workouts.',
    text: 'Chronos-Bolt forecasts fatigue on CPU, 17 MB offline search finds any world in 8 ms, and local SLMs generate schema-valid custom workouts.',
  },
  {
    image: 'images/showcase/cinque-terre.jpg',
    kicker: 'Coming next · Privacy & Canary',
    heading: 'Zero cloud bills. 100% local.',
    text: 'Opt-in MoveNet saddle vision never sends a single frame off-device, with a zero-download fast-path for Chrome Canary Gemini Nano, WebMCP and WebNN NPUs.',
  },
];

export const FOOTER = {
  blurb: 'Telo Ride, from the Telo family, turns a smart bike at home into a game.',
  legal: '© 2026 Telo',
} as const;
