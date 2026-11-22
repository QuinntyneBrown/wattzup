// Slice 15.3 · Live standings. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a riders-online race at 5:01 with the service's standings on its board at 1440 px and three
// other widths, and the next second's board with the rider past Pacer Atlas, from shots.ts. The hub's traffic is shown
// as the terminal lines of what the shared fixture and the backend's tests saw. Every position is a pure function of
// the scene's time (docs/videos/README.md).
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
// The board's corner of the race at 1440 px.
const BOARD = 'aspect-ratio:4/5;object-fit:cover;object-position:100% 0%';

// ── Act 1: one board, from the service ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 15.3 · Live standings',
  words: 'One board,',
  accent: 'every second.',
  width: 900,
  device: (S) => onBrowser(S, 'board-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('board', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-123 AC3, L2-060 AC1, AC2', 'Every rider,', 'each gap to you.', 110, 160, 760)}
  ${closeup('board-xl', `${at(900, 120, 460)};${BOARD}`, pop(S, onBeat(S, part('board', 0, 0.1)), { tilt: -2 }))}
  ${closeup('passed-xl', `${at(1360, 420, 460)};${BOARD}`, pop(S, onBeat(S, part('board', 0, 0.55)), { tilt: 2 }))}
  ${terminal(S, 'RaceStandingsUpdated, once a second', [
    [`  1 Pacer Rook  ${dim('0 s')}     → ${ok('+0:07')}`],
    [`  5 You         ${dim('7 s')}     → ${dim('your row, aria-current')}`],
    [`  6 Ollie R.    ${dim('8 s')}     → ${ok('−0:01')}`],
    [`  ${dim('gap to you = your gap to the leader − the row’s')}`],
  ], 0.25, `${at(110, 540, 700)};font-size:21px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('report', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-123 AC1', 'Each second,', 'your distance.', 110, 160, 820)}
  ${terminal(S, 'ReportRaceProgress, as the hub heard it', [
    prompt("ReportRaceProgress('old-town-criterium@…T180030Z', 12.4, 168)"),
    prompt("ReportRaceProgress('old-town-criterium@…T180030Z', 17.1, 172)"),
    [`  ${ok('at most 2 a second')}  ${dim('a report within 500 ms is dropped')}`],
    [`  ${dim('the seat, not the jersey, finds your row')}`],
  ], 0.2, `${at(110, 540, 860)};font-size:20px`, { every: S.BEAT * 0.6 })}
  ${closeup('board-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('report', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('rank', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-123 AC2, AC4', 'The service ranks,', 'the board follows.', 110, 160, 800)}
  ${terminal(S, 'the race session, each second', [
    [`  bots: pace model, ${ok('medium pack')}, at the virtual speed`],
    [`  furthest first; a tie to ${ok('who reached it first')}`],
    [`  gap = seconds since the leader passed ${ok('your distance')}`],
    [`  ${dim('trace: one point a second, the last 600')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('passed-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('rank', 0, 0.15)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/board-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'From a phone,', { accent: 'to the full board.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('439 passed')} ${dim('14 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('245 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1461 passed')} ${dim('5 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One ranking,', 'the same for all.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'One ranking for every rider')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Each gap measured to you')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Reports at most twice a second')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 15.3 · Live standings' });

wipeInto('rank');
bug();

Film.start();
