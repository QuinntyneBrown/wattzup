// Slice 15.2 · Start a live race. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the riders-online lobby with its countdown at 3 at 1440 px and three other widths, the countdown
// at 1, and the race in its session opened 4.5 s after the start, from shots.ts. The hub's traffic is shown as the
// terminal lines of what the shared fixture and the backend's tests saw. Every position is a pure function of the
// scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
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

// ── Act 1: the countdown and the start ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 15.2 · Start a live race',
  words: 'Three, two, one,',
  accent: 'start together.',
  width: 900,
  device: (S) => onBrowser(S, 'countdown-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('countdown', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-056 AC1, AC2, L2-053 AC4', 'From 0:03,', 'ready or not.', 110, 160, 760)}
  ${closeup('countdown-xl', `${at(880, 150, 620)};${PAGE}`, pop(S, onBeat(S, part('countdown', 0, 0.1)), { tilt: -2 }))}
  ${closeup('one-xl', `${at(1200, 520, 620)};${PAGE}`, pop(S, onBeat(S, part('countdown', 0, 0.55)), { tilt: 2 }))}
  ${terminal(S, 'the lobby, once a second', [
    [`  0:03 ${ok('3')}  0:02 ${ok('2')}  0:01 ${ok('1')}  0:00 ${ok('Go')}`],
    [`  ${dim('the lobby behind: inert, aria-hidden')}`],
  ], 0.25, `${at(110, 560, 680)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('join', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-056 AC3, L2-121 AC3', 'At Go,', 'join the race again.', 110, 160, 820)}
  ${terminal(S, 'JoinRace, as the hub answered it', [
    [`  /race/old-town-criterium/ride?mode=online&session=…`],
    prompt("JoinRace('old-town-criterium@…T180030Z')"),
    [`  seat ${ok('6')}  startsAt ${ok('18:00:30.000Z')}  ${dim('server time')}`],
    [`  ${dim('the seat is kept past the start')}`],
  ], 0.2, `${at(110, 540, 860)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('race-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('join', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('clock', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-121 AC3, L2-056 AC4', 'One start,', 'every clock.', 110, 160, 760)}
  ${terminal(S, 'the race, on this device', [
    [`  offset = serverTime − (sent + received) ÷ 2  ${dim('best of 5')}`],
    [`  RideClock.start(${ok('startsAt − offset')})`],
    [`  opened 4.5 s late → ${ok('0:04')}  ${dim('not 0:00')}`],
    [`  opened 1.5 s early → ${ok('0:00')} ${dim('until the start')}`],
  ], 0.2, `${at(110, 520, 820)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('race-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('clock', 0, 0.15)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/countdown-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Full screen,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('425 passed')} ${dim('3 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('243 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1456 passed')} ${dim('3 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One start,', 'the same for all.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), '3, 2, 1 and Go over the lobby')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The seat kept past the start')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Every clock on server time')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 15.2 · Start a live race' });

wipeInto('clock');
bug();

Film.start();
