// Slice 23.3 · Screen readers and motion. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are the running app from shots.ts; the "screen reader hears" cards quote shots/heard.json, the words the
// app's live region held as each shot was taken. The terminals hold the real outputs of the spec before the fix and
// after it. Every position is a pure function of the scene's time (docs/videos/README.md).
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
const HEARD = {
  step: 'Work, round 1 of 8: 0:30 at level 24',
  result: 'Race results: You finished 26:38. +110 XP earned.',
};
/** What the live region said, as a card: the words a screen reader hears. */
const hears = (S, words, when, style) => terminal(S, 'a screen reader hears', [[`“${esc(words)}”`]], when, `${style};font-size:28px`);

// ── Act 1: heard ──────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 23.3 · Screen readers and motion',
  words: 'Heard once,',
  accent: 'not every second.',
  width: 820,
  device: (S) => onPhone(S, 'custom-ride-work-xs', 1180, 160, 380, S.beat(3), 4),
});

Film.scene('step', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-141 AC2 · a step starts', 'Work,', 'round 1 of 8.', 110, 140, 1150)}
  ${onPhone(S, 'custom-ride-work-xs', 1360, 90, 380, onBeat(S, part('step', 0, 0.1)), 3)}
  ${closeup('interval-card', `${at(110, 470, 640)};${REGION}`, pop(S, onBeat(S, part('step', 0, 0.3)), { tilt: -2 }))}
  ${hears(S, HEARD.step, onBeat(S, part('step', 0, 0.5)), at(110, 760, 1100))}
  </div>`);

Film.scene('result', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-141 AC2 · Results opens', 'The result,', 'said.', 110, 140, 700)}
  ${onPhone(S, 'results-xs-open', 1360, 90, 380, onBeat(S, part('result', 0, 0.12)), -3)}
  ${hears(S, HEARD.result, onBeat(S, part('result', 0, 0.4)), at(110, 560, 1150))}
  </div>`, { before: 0.4 });

// ── Act 2: kept and still ─────────────────────────────────────────────────────────────────────
Film.scene('dialog', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-141 AC3 · a dialog', 'Focus kept,', 'app inert.', 110, 140, 640)}
  ${onBrowser(S, 'leave-dialog-xl', 760, 150, 1060, onBeat(S, part('dialog', 0, 0.1)), { ratio: 1440 / 900, tilt: -2 })}
  ${terminal(S, 'e2e/screen-readers-and-motion.spec.ts', [
    ['Library      → the dialog takes the focus'],
    [esc('<wz-root>    inert')],
    ['Tab × 6      the focus stays in the dialog'],
    [`Escape       ${ok('the focus is back on Library')}`],
  ], onBeat(S, part('dialog', 0, 0.4)), `${at(110, 560, 640)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('motion', (S) => `
  <div class="fill field--bone">
  ${title(S, 'L2-142 AC2 · prefers-reduced-motion', 'Nothing', 'slides.', 110, 140, 700)}
  ${terminal(S, 'frontend · before the fix', [
    prompt('npx playwright test e2e/screen-readers-and-motion.spec.ts'),
    ['✘ nothing on a custom ride moves when the device asks for reduced motion', 'terminal__error'],
    ['    "transition of width on div.ride-interval__fill"', 'terminal__error'],
    [''],
    ['# tokens.css: --duration-countdown: 0ms under reduced motion', 'terminal__dim'],
  ], onBeat(S, part('motion', 0, 0.2)), `${at(110, 470, 1300)};font-size:22px`, { every: S.BEAT * 0.55 })}
  ${closeup('interval-card', `${at(1380, 160, 460)};${REGION}`, pop(S, onBeat(S, part('motion', 0, 0.55)), { tilt: 2 }))}
  </div>`);

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/fixtures/screens.ts', 'Heard, kept,', 'still.', 110, 160, 640)}
  ${terminal(S, 'frontend · every run', [
    prompt('npx playwright test e2e/screen-readers-and-motion.spec.ts'),
    [`  ${ok('19 passed')}   2 steps, the result, a dialog, 15 screens still`],
    [''],
    prompt('npm test'),
    [`  ${ok('1842 passed')}   the step words, the result, the region's beat`],
  ], onBeat(S, part('proof', 0, 0.2)), `${at(780, 240, 1040)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/results-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Results,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 23.3 · Screen readers and motion' });

wipeInto('dialog');
bug();

Film.start();
