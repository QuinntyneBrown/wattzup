// Slice 23.1 · Fit every width. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app at 320 and 2560 px and the custom ride across the widths, from shots.ts; the terminals
// hold the real outputs of the width spec before and after the fix and of the margin mutation. Every position is a pure
// function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const REGION = 'height:auto';

// ── Act 1: the narrowest ──────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 23.1 · Fit every width',
  words: '320 to',
  accent: '2560.',
  width: 860,
  device: (S) => onBrowser(S, 'home-2560', 1000, 330, 860, S.beat(3), { ratio: 2560 / 1440, tilt: 3 }),
});

Film.scene('narrow', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-139 AC1 · 320 px', 'Nothing scrolls', 'sideways.', 110, 120, 1200)}
  ${['home-320', 'map-select-320', 'settings-320', 'results-320'].map((src, i) =>
    onPhone(S, src, 120 + i * 430, 380, 330, onBeat(S, part('narrow', 0, 0.12 + i * 0.12)), [-3, 2, -2, 3][i])).join('')}
  </div>`);

Film.scene('found', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'e2e/fit-every-width.spec.ts', 'Five pixels', 'too wide.', 110, 160, 700)}
  ${terminal(S, 'frontend · before the fix', [
    prompt('npx playwright test e2e/fit-every-width.spec.ts -g "ride does"'),
    ['✘ a custom ride does not scroll sideways at 320 px', 'terminal__error'],
    ['    Expected: false   Received: true'],
    [`  1 failed, ${ok('3 passed')}`],
  ], S.beat(2), `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.5 })}
  ${onPhone(S, 'custom-ride-320', 1120, 120, 330, onBeat(S, part('found', 0, 0.35)), -2)}
  ${closeup('ride-header-320', `${at(1480, 640, 380)};${REGION}`, pop(S, onBeat(S, part('found', 0, 0.6)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('margins', (S) => `
  <div class="fill field--bone">
  ${title(S, 'L2-139 AC2', '16, 24, 32,', 'and 80 rem.', 110, 160, 760)}
  ${terminal(S, 'frontend · the page container, measured', [
    [`320 px    margin ${ok('16 px')} either side`],
    [`640 px    margin ${ok('24 px')}`],
    [`1024 px   margin ${ok('32 px')}`],
    [`2560 px   ${ok('1280 px')} wide, centred at 640`],
    [''],
    ['# the sm margin set to 20 px by hand, for one run:', 'terminal__dim'],
    ['    Expected: 24   Received: 20', 'terminal__error'],
  ], onBeat(S, part('margins', 0, 0.25)), `${at(900, 200, 900)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

// ── Act 2: the widest ─────────────────────────────────────────────────────────────────────────
Film.scene('wide', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, '2560 px', 'Wide,', 'not stretched.', 110, 140, 700)}
  ${onBrowser(S, 'home-2560', 740, 300, 1080, onBeat(S, part('wide', 0, 0.15)), { ratio: 2560 / 1440, tilt: -2 })}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/fixtures/screens.ts', 'Fifteen screens,', 'both ends.', 110, 160, 700)}
  ${terminal(S, 'frontend · every run, and on request', [
    prompt('npx playwright test e2e/fit-every-width.spec.ts'),
    [`  ${ok('34 passed')}   15 screens × 320 and 2560 px, margins, 80 rem`],
    [''],
    prompt('npm run sweep:responsive'),
    ['# 320, 640, 768, 1024, 1280 and 2560 px', 'terminal__dim'],
    ['# written and kept current; run only when a person asks', 'terminal__dim'],
  ], onBeat(S, part('proof', 0, 0.25)), `${at(820, 220, 1000)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/custom-ride-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The custom ride,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 23.1 · Fit every width' });

wipeInto('wide');
bug();

Film.start();
