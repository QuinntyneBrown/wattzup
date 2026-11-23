// Slice 19.2 · Bounded ride buffers. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are a three-hour endurance class at 0:01 and a minute from its end, at 1440 px and three other widths, its
// resistance profile close up, and Results once it finishes, from shots.ts. Every position is a pure function of the
// scene's time (docs/videos/README.md).
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

// ── Act 1: three hours, one buffer ────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 19.2 · Bounded ride buffers',
  words: 'Three hours in,',
  accent: 'still light.',
  width: 900,
  device: (S) => onBrowser(S, 'class-end-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-138 AC2', 'One sample a second,', 'in a fixed buffer.', 110, 160, 900)}
  ${terminal(S, 'RideRecorder, as the ride starts', [
    [`  speedsKmh  ${ok('Float64Array(14400)')} ${dim('four hours')}`],
    [`  size       ${ok('115 kB')} ${dim('allocated once')}`],
    [`  each second  ${dim('writes one speed in place')}`],
  ], 0.2, `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('class-start-xl', `${at(1100, 200, 720)};${PAGE}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-138 AC1', 'Nothing grows', 'with the ride.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'Output, top power, time on target: running sums')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'Each standings tick replaces the board')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'A rider who leaves is forgotten')}
  </div>
  ${closeup('class-end-l', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-138 AC2 · The stored ride', '10,800 samples,', 'one a second.', 110, 160, 760)}
  ${closeup('results-xl', `${at(900, 170, 900)};aspect-ratio:16/5;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'POST /api/rides, as the spec saw it', [
    [`  elapsedSeconds    ${ok('10800')}`],
    [`  speedSamplesKmh   ${ok('10800')} ${dim('one a second')}`],
  ], 0.3, `${at(110, 560, 700)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-end-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Hour three,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('278 passed')} ${dim('1 new')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('a two-hour buffer'),
    [`  ${dim('Expected 10800, received')} 7200`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Long rides,', 'flat memory.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'A three-hour ride keeps one sample a second')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The buffer holds the longest ride, set once')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'A smaller buffer fails the spec')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 19.2 · Bounded ride buffers' });

wipeInto('world');
bug();

Film.start();
