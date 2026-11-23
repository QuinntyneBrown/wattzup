// Slice 19.4 · Web vitals and frame budget. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Home at 1440 px and three other widths after the rider's first tap and Tab, and a solo race at
// 1920 × 1080 on the real clock, from shots.ts; the terminals show the checks' profiles and budgets. Every position is
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

// ── Act 1: the phone and the laptop ───────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 19.4 · Web vitals and frame budget',
  words: 'Quick on a phone,',
  accent: 'smooth in a race.',
  width: 900,
  device: (S) => onBrowser(S, 'race-1920', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-136 AC2', 'A mid-range phone,', 'over 4G.', 110, 160, 900)}
  ${terminal(S, 'home-vitals.perf.ts, its phone', [
    [`  screen   ${ok('412 × 823')} ${dim('at 1.75×, touch')}`],
    [`  CPU      ${ok('4× slower')} ${dim('Emulation.setCPUThrottlingRate')}`],
    [`  network  ${ok('slow 4G')} ${dim('150 ms · 1.6 Mbit/s down · 750 kbit/s up')}`],
  ], 0.2, `${at(110, 560, 1000)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('home-xs', `${at(1380, 120, 380)};aspect-ratio:390/780;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'Home, loaded cold', 'Paint fast,', 'answer fast.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'Largest paint within 2.5 s')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'Each touch answered under 200 ms')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'Reported by the page’s own PerformanceObserver')}
  </div>
  ${closeup('home-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-136 AC3', '50 frames a second,', 'at full HD.', 110, 160, 760)}
  ${closeup('race-1920', `${at(900, 170, 900)};aspect-ratio:16/9;object-fit:cover`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('world', 0, 0.3)), 'A minute of frames, on the real clock')}
    ${fact(S, 2, onBeat(S, part('world', 0, 0.5)), 'Never below 30 a second for over a second')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Quick,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('278 passed')} ${dim('no performance check among them')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('npm run perf -- --headed'),
    [`  ${dim('on the device measured, when a person asks')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What this slice adds', 'Measured where', 'it matters.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Home’s LCP and INP on a phone profile')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The race’s frame rate at 1920 × 1080')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Their own config: never verify, never CI')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 19.4 · Web vitals and frame budget' });

wipeInto('world');
bug();

Film.start();
