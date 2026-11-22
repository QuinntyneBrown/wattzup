// Slice 19.1 · Bundle budgets. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are Home's first load at 1440 px and three other widths, and a solo race drawing its world with WebGL 2,
// from shots.ts; the terminals show the gzipped check and the raw budget as the build printed them. Every position is
// a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';

// ── Act 1: the first load, measured ───────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 19.1 · Bundle budgets',
  words: 'First load:',
  accent: '90 kB.',
  width: 900,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-136 AC1', 'Measured gzipped,', 'after every build.', 110, 160, 900)}
  ${terminal(S, 'npm run bundle:size', [
    [`   84.95 kB  ${dim('main-4UF7O6ZN.js')}`],
    [`    4.82 kB  ${dim('styles-TZDQPPMW.css')}`],
    [`   ${ok('89.77 kB')}  initial bundle, gzipped ${dim('(limit 300 kB)')}`],
  ], 0.2, `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('home-xl', `${at(1100, 200, 720)};${PAGE}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'angular.json · initial', 'A tight', 'raw budget.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'Warns at 302 kB, fails at 305 kB')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'The bundle measures 300.26 kB raw')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'Raising it needs a reason in the change')}
  </div>
  ${terminal(S, 'ng build ride', [
    [`  main      ${ok('277.44 kB')}`],
    [`  styles    ${ok(' 22.82 kB')}`],
    [`  initial   ${ok('300.26 kB')} ${dim('budget 302 / 305 kB')}`],
  ], 0.15, `${at(1000, 300, 820)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-136 AC1 · World', 'The world waits', 'for the race.', 110, 160, 760)}
  ${closeup('race-world-xl', `${at(900, 170, 900)};${PAGE}`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('world', 0, 0.3)), 'Home opens without Three.js')}
    ${fact(S, 2, onBeat(S, part('world', 0, 0.5)), 'The 1.13 MB world chunk loads with the race')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Light,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('277 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('npm run bundle:size'),
    [`  initial  ${ok('89.77 kB')} ${dim('gzipped')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Light to open,', 'rich to ride.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The first load stays under 300 KB gzipped')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'A build over its raw budget fails')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Three.js arrives only with a race')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 19.1 · Bundle budgets' });

wipeInto('world');
bug();

Film.start();
