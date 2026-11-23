// Slice 12.1 · Earn stars and unlock maps. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Map Select for the mocks' mid rider at four widths, for a new rider and for the veteran, Race
// Setup naming the next unlock, and Neon Docklands' Race Setup once a ride opened it, from shots.ts, each answered by
// the shared fixture. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The mid rider's first four rows in a 1440 × 900 shot (x 100–1020, y 195–710).
const ROWS = 'aspect-ratio:920/515;object-fit:cover;object-view-box:inset(21.7% 29.2% 21.1% 6.94%)';
// Neon Docklands, the mid rider's next unlock (x 100–1020, y 585–710).
const NEXT = 'aspect-ratio:920/125;object-fit:cover;object-view-box:inset(65% 29.2% 21.1% 6.94%)';
// The veteran's Dolomites, Vice City and Col du Granit (x 100–1015, y 485–865).
const VETERAN = 'aspect-ratio:915/380;object-fit:cover;object-view-box:inset(53.9% 29.5% 3.9% 6.94%)';
// Race Setup's goal line (x 895–1340, y 95–180).
const GOAL = 'aspect-ratio:445/85;object-fit:cover;object-view-box:inset(10.6% 6.94% 80% 62.2%)';
// A goal line of one line (x 895–1340, y 95–150).
const GOAL1 = 'aspect-ratio:445/55;object-fit:cover;object-view-box:inset(10.6% 6.94% 83.3% 62.2%)';

// ── Act 1: stars and the next unlock ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 12.1 · Earn stars and unlock maps',
  words: 'Your maps,',
  accent: 'from your rides.',
  width: 860,
  device: (S) => onBrowser(S, 'mid-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('stars', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-039', 'Three stars,', 'never lost.', 110, 220, 600)}
  ${closeup('mid-xl', `${at(780, 160, 1020)};${ROWS}`, pop(S, onBeat(S, part('stars', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('next', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-041 AC2, AC4', 'Next:', 'Neon Docklands.', 110, 160, 1700)}
  ${closeup('mid-xl', `${at(110, 440, 1100)};${NEXT}`, pop(S, onBeat(S, part('next', 0, 0.15)), { tilt: -1 }))}
  ${closeup('setup-old-town-xl', `${at(900, 700, 900)};${GOAL}`, pop(S, onBeat(S, part('next', 0, 0.5)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('veteran', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-041 AC3', 'Then', 'Col du Granit.', 110, 220, 600)}
  ${closeup('veteran-next-xl', `${at(760, 110, 1040)};${VETERAN}`, pop(S, onBeat(S, part('veteran', 0, 0.15)), { tilt: -1 }))}
  ${closeup('setup-dolomites-xl', `${at(980, 700, 820)};${GOAL1}`, pop(S, onBeat(S, part('veteran', 0, 0.5)), { tilt: 1 }))}
  </div>`);

// ── Act 2: a map opened, and every width ─────────────────────────────────────────────────────
Film.scene('opened', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-040 AC5', 'Opened,', 'ready to ride.', 110, 220, 640)}
  ${onBrowser(S, 'setup-docklands-xl', 860, 200, 960, onBeat(S, part('opened', 0, 0.15)), { tilt: -2 })}
  </div>`, { before: 0.4, after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/mid-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One path,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('299 passed')} ${dim('11 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('180 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1341 passed')} ${dim('6 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.20 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every map,', 'one source.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The next unlock, one case per row')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Open maps, stars and bests through the API')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Map Select and Race Setup agree')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 12.1 · Earn stars and unlock maps' });

wipeInto('veteran');
bug();

Film.start();
