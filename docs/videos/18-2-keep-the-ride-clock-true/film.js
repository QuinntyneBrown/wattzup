// Slice 18.2 · Keep the ride clock true. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are a solo race at 0:10 and again at 10:10 after ten minutes in a throttled hidden tab, at 1440 px and
// three other widths, with its interval and route panels close up, and a class ride after the same ten minutes, from
// shots.ts. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: hidden, throttled, shown again ────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 18.2 · Keep the ride clock true',
  words: 'Away ten minutes?',
  accent: 'No drift.',
  width: 900,
  device: (S) => onBrowser(S, 'race-after-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('hidden', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-133 AC1', 'Timers wait,', 'the clock does not.', 110, 160, 900)}
  ${terminal(S, 'a hidden tab, as the spec plays it', [
    [`  setTimeout       ${dim('waits for the next whole minute')}`],
    [`  bike             ${ok('notifies every second')}`],
    [`  ride clock       ${ok('performance.now()')} ${dim('never counts ticks')}`],
  ], 0.2, `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('interval-before', `${at(1140, 200, 640)};${REGION}`, pop(S, onBeat(S, part('hidden', 0, 0.15)), { tilt: -1 }))}
  ${closeup('route-before', `${at(1140, 560, 640)};${REGION}`, pop(S, onBeat(S, part('hidden', 0, 0.35)), { tilt: 1 }))}
  </div>`);

Film.scene('shown', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-133 AC2 · Race', 'Shown again,', 'right on time.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('shown', 0, 0.2)), 'The clock reads 10:10, at once')}
    ${fact(S, 2, onBeat(S, part('shown', 0, 0.4)), 'Recover · 1:20 left, the plan’s segment')}
    ${fact(S, 3, onBeat(S, part('shown', 0, 0.6)), '3.97 km, as a visible tab reads')}
  </div>
  ${closeup('interval-after', `${at(1140, 200, 640)};${REGION}`, pop(S, onBeat(S, part('shown', 0, 0.15)), { tilt: -1 }))}
  ${closeup('route-after', `${at(1140, 560, 640)};${REGION}`, pop(S, onBeat(S, part('shown', 0, 0.35)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('class', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-133 AC2 · Class', 'The class,', 'in step too.', 110, 160, 760)}
  ${closeup('class-after-xl', `${at(900, 170, 900)};${PAGE}`, pop(S, onBeat(S, part('class', 0, 0.1)), { tilt: -1 }))}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('class', 0, 0.3)), '10:10 / 30:00')}
    ${fact(S, 2, onBeat(S, part('class', 0, 0.5)), 'Recover · 1:20 left')}
  </div>
  </div>`, { after: 0.7 });

Film.scene('leave', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-133 AC4', 'Close mid-race?', 'Asked first.', 110, 160, 900)}
  ${terminal(S, 'the race, as the spec saw it', [
    [`  page.close  ${dim('runBeforeUnload: true')}`],
    [`  dialog      ${ok('beforeunload')}  ${dim('the browser asks')}`],
  ], 0.3, `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('race-before-xl', `${at(1080, 200, 760)};${PAGE}`, pop(S, onBeat(S, part('leave', 0, 0.2)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/race-after-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'On time,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('275 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.44 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Ten minutes away,', 'no drift.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The clock is right the moment the tab shows')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The segment and distance match a visible tab')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'A running race asks before the tab closes')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 18.2 · Keep the ride clock true' });

wipeInto('class');
bug();

Film.start();
