// Slice 19.3 · Heap checks. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are the screens the heap checks enter and leave: the race with its world and Race Setup after it, and a class ride at
// 1440 px and three other widths with Class Start after it, from shots.ts; the terminals show the checks as Playwright
// lists them. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: what a heap check does ─────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 19.3 · Heap checks',
  words: 'Leave a screen,',
  accent: 'free its memory.',
  width: 900,
  device: (S) => onBrowser(S, 'race-world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-138 AC1', 'Collect, then', 'read the heap.', 110, 160, 900)}
  ${terminal(S, 'npm run heap -- --list', [
    [`  ${dim('heap ›')} the race and its world, entered and left six times`],
    [`  ${dim('heap ›')} a class ride, entered and left six times`],
    [`  ${dim('heap ›')} a three-hour class, minute 1 to minute 180`],
    [`  ${ok('3 checks')} ${dim('HeapProfiler.collectGarbage · Runtime.getHeapUsage')}`],
  ], 0.2, `${at(110, 540, 1000)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('race-world-xl', `${at(1180, 200, 640)};${PAGE}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'Enter and leave · Race', 'Six rounds,', 'at most 5 MB.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'Race Setup → the race and its world')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'End ride → the world is gone')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'First round warms the chunks; five more measured')}
  </div>
  ${closeup('race-setup-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Enter and leave · Class', 'The class too,', 'and three hours.', 110, 160, 760)}
  ${closeup('class-start-xl', `${at(900, 170, 900)};${PAGE}`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('world', 0, 0.3)), 'Six rounds of a class ride: at most 5 MB')}
    ${fact(S, 2, onBeat(S, part('world', 0, 0.5)), 'A three-hour class: at most 50 MB')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-ride-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'In and out,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('278 passed')} ${dim('no heap check among them')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('npm run heap'),
    [`  ${dim('only when a person asks')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What this slice adds', 'Proof on', 'request.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Three heap checks, typed, linted and listed')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Their own config: never verify, never CI')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Each failure names both readings')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 19.3 · Heap checks' });

wipeInto('world');
bug();

Film.start();
