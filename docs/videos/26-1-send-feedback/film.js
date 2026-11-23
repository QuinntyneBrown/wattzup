// Slice 26.1 · Send feedback. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are the running app from shots.ts; the terminal holds the real outputs of e2e/feedback.spec.ts before the change and
// after it, and of the unit tests. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// The spec on the code before the slice: every test waits in vain for Feedback; then the slice, and the unit tests.
const TERMINAL = [
  prompt('npx playwright test e2e/feedback.spec.ts --timeout 12000'),
  ['  1) Feedback pauses the ride and offers a bug, an idea or kudos, with the ride’s context', 'terminal__error'],
  ['     Error: locator.click: Test timeout of 12000ms exceeded.', 'terminal__error'],
  ['  7 failed'],
  prompt('npx playwright test e2e/feedback.spec.ts --repeat-each 3'),
  [`  ${ok('21 passed')} (16.5s)`],
  prompt('npx ng test ride --watch=false'),
  [`  Test Files  ${ok('144 passed')} (144)`],
  [`       Tests  ${ok('1934 passed')} (1934)`],
];

// ── Act 1: the note ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 26.1 · Send feedback',
  words: 'Say what happened,',
  accent: 'mid-ride.',
  width: 760,
  device: (S) => onBrowser(S, 'ride-feedback-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('kinds', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-116 AC2 · L2-117 AC1', 'Bug, idea', 'or kudos.', 110, 140, 640)}
  ${closeup('form-bug', `${at(760, 170, 520)};${REGION}`, pop(S, onBeat(S, part('kinds', 0, 0.15)), { tilt: -2 }))}
  ${closeup('form-kudos', `${at(1320, 250, 520)};${REGION}`, pop(S, onBeat(S, part('kinds', 0, 0.45)), { tilt: 2 }))}
  </div>`);

Film.scene('context', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-117 AC2 · Attached from Ride', 'The ride,', 'as it stood.', 110, 140, 700)}
  ${closeup('form-context', `${at(960, 70, 490)};${REGION}`, pop(S, onBeat(S, part('context', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: sending ────────────────────────────────────────────────────────────────────────────
Film.scene('sending', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-118 · Sending… then thanks', 'Sent,', 'and still paused.', 110, 140, 640)}
  ${closeup('form-sending', `${at(760, 200, 520)};${REGION}`, pop(S, onBeat(S, part('sending', 0, 0.15)), { tilt: -2 }))}
  ${closeup('form-sent', `${at(1320, 330, 520)};${REGION}`, pop(S, onBeat(S, part('sending', 0, 0.5)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--blue">
  ${title(S, 'e2e/feedback.spec.ts', 'Failing first,', 'passing now.', 110, 140, 900)}
  ${terminal(S, 'frontend · before, then after', TERMINAL, onBeat(S, part('proof', 0, 0.2)), `${at(110, 430, 1700)};font-size:20px`, { every: S.BEAT * 0.4 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/feedback-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Send feedback,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 26.1 · Send feedback' });

wipeInto('sending');
bug();

Film.start();
