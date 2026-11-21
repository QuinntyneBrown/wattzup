// The worlds that declare an ambience (L2-129 AC12). Any world not listed declares none.
import type { WorldId } from '@wattzup/api';
import type { AmbiencePreset } from './ride-sound';

const PRESETS: Readonly<Record<AmbiencePreset, readonly WorldId[]>> = {
  coast: [
    'atlanticroad',
    'bathsheba',
    'beachroad',
    'bigsur',
    'blackpool',
    'bondi',
    'brighton',
    'calobra',
    'cinqueterre',
    'coast',
    'coney',
    'copacabana',
    'cornwall',
    'daytona',
    'greatocean',
    'miami',
    'okinawa',
    'oregon',
    'santamonica',
    'seapoint',
    'sevensisters',
    'southbeach',
    'surfers',
    'sydneyharbour',
    'valparaiso',
  ],
  alpine: [
    'alpe',
    'angliru',
    'aubisque',
    'campolongo',
    'dolomites',
    'engadin',
    'furka',
    'galibier',
    'gardena',
    'lakelouise',
    'paine',
    'sella',
    'sellaronda',
    'stbernard',
    'stelvio',
    'tourmalet',
    'tremola',
    'trollstigen',
    'valais',
    'veleta',
    'ventoux',
    'zoncolan',
  ],
  city: [
    'brooklyn',
    'bund',
    'chicago',
    'docklands',
    'dubai',
    'glasgow',
    'knicks',
    'shibuya',
    'timessquare',
    'toronto',
    'vegas',
    'westminster',
  ],
  park: [
    'blueridge',
    'centralpark',
    'cherryblossom',
    'goldengate',
    'prospect',
    'serpentine',
    'stanleypark',
    'tulips',
    'wicklow',
    'yosemite',
  ],
};

const BY_WORLD = new Map<WorldId, AmbiencePreset>(
  (Object.entries(PRESETS) as [AmbiencePreset, readonly WorldId[]][]).flatMap(([preset, ids]) =>
    ids.map((id) => [id, preset] as const),
  ),
);

/** The world's ambience preset, or null when it declares none. */
export function ambienceOf(world: WorldId): AmbiencePreset | null {
  return BY_WORLD.get(world) ?? null;
}
