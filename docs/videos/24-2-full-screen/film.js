// Slice 24.2 · Full screen. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are the running app from shots.ts; the terminals hold the real outputs of e2e/full-screen-everywhere.spec.ts before
// the change and after it. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the race ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 24.2 · Full screen',
  words: 'Fill the screen,',
  accent: 'from any page.',
  width: 800,
  device: (S) => onBrowser(S, 'race-xl', 1000, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('race', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-144 AC1 · the race', 'Full screen,', 'then Exit.', 110, 140, 760)}
  ${closeup('race-full-screen', `${at(900, 120, 460)};${REGION}`, pop(S, onBeat(S, part('race', 0, 0.2)), { tilt: -2 }))}
  ${closeup('race-exit-full-screen', `${at(1380, 460, 460)};${REGION}`, pop(S, onBeat(S, part('race', 0, 0.55)), { tilt: 2 }))}
  </div>`);

Film.scene('everywhere', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-144 AC1 · every header', 'Every header', 'the mocks draw.', 110, 140, 900)}
  ${onBrowser(S, 'class-ride-xl', 110, 420, 900, onBeat(S, part('everywhere', 0, 0.1)), { ratio: 1440 / 900, tilt: -2 })}
  ${onPhone(S, 'results-xs', 1060, 230, 300, onBeat(S, part('everywhere', 0, 0.3)), -3)}
  ${onPhone(S, 'connect-bike-xs', 1330, 170, 300, onBeat(S, part('everywhere', 0, 0.42)), 2)}
  ${onPhone(S, 'class-start-xs', 1600, 230, 300, onBeat(S, part('everywhere', 0, 0.54)), 4)}
  </div>`, { before: 0.4 });

// ── Act 2: absent, proved ─────────────────────────────────────────────────────────────────────
Film.scene('absent', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-144 AC2 · no Fullscreen API', 'No API,', 'no button.', 110, 140, 700)}
  ${terminal(S, 'frontend · before the change', [
    prompt('npx playwright test e2e/full-screen-everywhere.spec.ts'),
    ['✘ Race Setup · Class Start · Connect Bike · Results offer Full screen in their header', 'terminal__error'],
    ['✘ a race · a class ride · a custom ride: Full screen, then Exit full screen', 'terminal__error'],
    ['✘ the custom workout offers no Full screen where the browser has no Fullscreen API', 'terminal__error'],
    ['✘ a custom ride offers no Full screen where the browser has no Fullscreen API', 'terminal__error'],
    ['  9 failed, 19 passed'],
  ], onBeat(S, part('absent', 0, 0.2)), `${at(110, 430, 1500)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--blue">
  ${title(S, 'e2e/fixtures/screens.ts', 'Pressed in,', 'pressed out.', 110, 160, 700)}
  ${terminal(S, 'frontend · after', [
    prompt('npx playwright test e2e/full-screen-everywhere.spec.ts'),
    [`  ${ok('28 passed')}   14 screens in and out, 14 without the API`],
  ], onBeat(S, part('proof', 0, 0.25)), `${at(820, 300, 1000)};font-size:23px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/race-setup-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Race Setup,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 24.2 · Full screen' });

wipeInto('absent');
bug();

Film.start();
