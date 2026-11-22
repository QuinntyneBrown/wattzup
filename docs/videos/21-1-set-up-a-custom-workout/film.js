// Slice 21.1 · Set up a custom workout. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Custom workout on GCN 30-min HIIT at 1440 px and three other widths, the ladder close up after the
// rider's edits, Tabata chosen, and flat resistance at 1440 and 390 px, from shots.ts. Every position is a pure
// function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';
/** A page at 1440 px, and a phone's window at 390 × 780, in CSS pixels. */
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
const PHONE = 'aspect-ratio:390/780;object-fit:cover;object-position:top';

// ── Act 1: the plan ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 21.1 · Set up a custom workout',
  words: 'Your ride,',
  accent: 'your way.',
  width: 900,
  device: (S) => onBrowser(S, 'setup-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('plans', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-094 · L2-095', 'GCN 30-min HIIT,', 'or four more.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('plans', 0, 0.3)), '8 × 0:30, recoveries 3:00 to 1:30')}
    ${fact(S, 2, onBeat(S, part('plans', 0, 0.55)), 'Tabata, 40 / 20, Minute on, Long climbs')}
  </div>
  ${closeup('tabata', `${at(900, 170, 880)};${PAGE}`, pop(S, onBeat(S, part('plans', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('ladder', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-095 AC3 to AC6', 'Every round,', 'yours.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('ladder', 0, 0.2)), 'Efforts ±0:05, recoveries ±0:15')}
    ${fact(S, 2, onBeat(S, part('ladder', 0, 0.4)), 'Add, remove, or make them the same')}
    ${fact(S, 3, onBeat(S, part('ladder', 0, 0.6)), 'The plan reads edited')}
  </div>
  ${closeup('ladder', `${at(900, 120, 860)};${REGION}`, pop(S, onBeat(S, part('ladder', 0, 0.1)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('levels', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-096', 'Work 24,', 'recover 6.', 110, 160, 700)}
  ${closeup('levels', `${at(880, 200, 880)};${REGION}`, pop(S, onBeat(S, part('levels', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'custom-workout.spec.ts', [
    [`  levels     ${ok('1 to 32')}`],
    [`  warm-up    ${ok('0:00 to 20:00')} ${dim('±1:00')}`],
    [`  cool-down  ${ok('0:00 to 20:00')} ${dim('±1:00')}`],
  ], part('levels', 0, 0.4), `${at(110, 560, 720)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 2: flat resistance, and every width ───────────────────────────────────────────────────
Film.scene('flat', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('flat-xl', `${at(110, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('flat', 0, 0.1)), { tilt: -1 }))}
  ${closeup('flat-xs', `${at(960, 380, 260)};${PHONE}`, pop(S, onBeat(S, part('flat', 0, 0.3)), { tilt: 2 }))}
  ${title(S, 'L2-097', 'One level,', 'held.', 1300, 130, 520)}
  <div style="${at(1300, 470, 520)}">
    ${fact(S, 1, onBeat(S, part('flat', 0, 0.35)), 'Level 12 / 32')}
    ${fact(S, 2, onBeat(S, part('flat', 0, 0.55)), '30 min at 85 rpm')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/setup-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Custom workout,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 21.1 · Set up a custom workout' });

wipeInto('flat');
bug();

Film.start();
