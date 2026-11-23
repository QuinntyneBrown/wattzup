// Slice 25.1 · Inspect diagnostics. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app from shots.ts; the terminals hold the real outputs of e2e/diagnostics.spec.ts before the
// change and after it, and of the unit tests. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: open it ────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 25.1 · Inspect diagnostics',
  words: 'What the browser',
  accent: 'sees.',
  width: 760,
  device: (S) => onBrowser(S, 'ride-diagnostics-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('open', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-113 AC1 · the bike status', 'The status', 'opens it.', 110, 140, 700)}
  ${closeup('ride-status', `${at(860, 200, 460)};${REGION}`, pop(S, onBeat(S, part('open', 0, 0.2)), { tilt: -2 }))}
  ${onPhone(S, 'profile-xs', 1420, 150, 320, onBeat(S, part('open', 0, 0.5)), 3)}
  </div>`);

Film.scene('facts', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-113 AC2 · a connected bike', 'Every fact,', 'read here.', 110, 140, 700)}
  ${closeup('facts-connected', `${at(880, 110, 820)};${REGION}`, pop(S, onBeat(S, part('facts', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the missing pieces ─────────────────────────────────────────────────────────────────
Film.scene('missing', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-113 AC3 · AC4', 'No bike,', 'no adapter.', 110, 140, 640)}
  ${closeup('facts-no-bike', `${at(740, 150, 600)};${REGION}`, pop(S, onBeat(S, part('missing', 0, 0.15)), { tilt: -2 }))}
  ${onPhone(S, 'profile-off-xs', 1400, 150, 320, onBeat(S, part('missing', 0, 0.5)), 3)}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--blue">
  ${title(S, 'e2e/diagnostics.spec.ts', 'Failing first,', 'passing now.', 110, 140, 900)}
  ${terminal(S, 'frontend · before, then after', [
    prompt('npx playwright test e2e/diagnostics.spec.ts'),
    ['✘ Diagnostics opens from Profile as a modal dialog and gives the focus back as it closes', 'terminal__error'],
    ['✘ a connected bike’s facts, from the custom ride’s bike status', 'terminal__error'],
    ['✘ with no bike picked, Bike reads "None picked yet" and the link facts are absent', 'terminal__error'],
    ['✘ with Bluetooth off, the adapter and the bike last seen', 'terminal__error'],
    ['  4 failed'],
    prompt('npx playwright test e2e/diagnostics.spec.ts'),
    [`  ${ok('4 passed')} (12.6s)`],
    prompt('npx ng test ride --watch=false'),
    [`  Test Files  ${ok('138 passed')} (138)`],
    [`       Tests  ${ok('1885 passed')} (1885)`],
  ], onBeat(S, part('proof', 0, 0.2)), `${at(110, 450, 1500)};font-size:21px`, { every: S.BEAT * 0.45 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/profile-diagnostics-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Diagnostics,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 25.1 · Inspect diagnostics' });

wipeInto('proof');
bug();

Film.start();
