// Slice 27.2 · Update to a new version. Six scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app with its real service worker, from shots.ts; the terminal holds real outputs: the
// update spec before the change and after, the same spec with the ride's hold taken away, and the unit spec. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const label = (S, text, x, y, w, when) => `<p class="kicker" style="${at(x, y, w)};text-align:center" ${S.rise(when)}>${esc(text)}</p>`;

// ── Act 1: the offer ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 27.2 · Update to a new version',
  words: 'Every version,',
  accent: 'between rides.',
  width: 700,
  device: (S) => onBrowser(S, 'home-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('offer', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-150 AC2 · when the app opens', 'A new version,', 'offered.', 110, 140, 700)}
  ${closeup('toast', `${at(900, 380, 860)};height:auto`, pop(S, onBeat(S, part('offer', 0, 0.2)), { tilt: -2 }))}
  </div>`);

Film.scene('ride', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-150 AC2 · never during a ride', 'Never', 'mid-ride.', 110, 140, 1100)}
  ${onBrowser(S, 'ride-held-xl', 110, 370, 800, onBeat(S, part('ride', 0, 0.15)), { ratio: 1440 / 900, tilt: -2 })}
  ${label(S, 'Ride in progress: the new version waits', 110, 950, 800, onBeat(S, part('ride', 0, 0.15)))}
  ${onBrowser(S, 'profile-offer-xl', 1010, 260, 800, onBeat(S, part('ride', 0, 0.6)), { ratio: 1440 / 900, tilt: 2 })}
  ${label(S, 'End: Profile, and the offer', 1010, 840, 800, onBeat(S, part('ride', 0, 0.6)))}
  </div>`, { before: 0.4 });

// ── Act 2: the proof ──────────────────────────────────────────────────────────────────────────
Film.scene('check', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'app-update.spec.ts · sw-app-updates.spec.ts', 'The real worker,', 'a real deploy.', 110, 120, 1300)}
  ${terminal(S, 'before, after, and with the hold taken away', [
    prompt('npx playwright test e2e/app-update.spec.ts'),
    ["    Error: element(s) not found", 'terminal__error'],
    ["      - waiting for locator('.toast').filter({ hasText: 'A new version is ready' })", 'terminal__error'],
    ['  3 failed', 'terminal__error'],
    prompt('npx playwright test e2e/app-update.spec.ts'),
    [`  ${ok('3 passed')} (17.9s)`],
    prompt('# this.activity.begin() taken out of the custom ride'),
    ['    Error: expect(locator).toBeHidden() failed', 'terminal__error'],
    ['    Expected: hidden   Received: visible', 'terminal__error'],
    prompt("npx ng test ride --include='**/sw-app-updates.spec.ts'"),
    [`      Tests  ${ok('5 passed')} (5)`],
  ], onBeat(S, part('check', 0, 0.2)), `${at(110, 390, 1700)};font-size:21px`, { every: S.BEAT * 0.4 })}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The offer,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 27.2 · Update to a new version' });

wipeInto('check');
bug();

Film.start();
