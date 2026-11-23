// Slice 14.5 · Live group board. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the group ride at 7:00 with its output board at 1440 px and three other widths, and the board
// close up before and after the next standings, from shots.ts. The hub's traffic is shown as the terminal lines of what
// the shared fixture and the backend's tests saw. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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
// The close-ups' sizes in CSS pixels, from shots/: the board cropped to its nine rows, and the ride at 1440 px.
const BOARD = 'aspect-ratio:296/430;object-fit:cover;object-position:top';
const RIDE = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: the board and what feeds it ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 14.5 · Live group board',
  words: 'Ride together,',
  accent: 'see the field.',
  width: 900,
  device: (S) => onBrowser(S, 'board-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('board', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-090 AC1, L2-087 AC1', 'Output,', 'and your place.', 110, 160, 860)}
  ${terminal(S, 'StandingsUpdated, as the fixture sent it', [
    [`  sessionId ${dim('hiit-cardio-30@…T1923Z')}`],
    [`  1 kenji.cyc ${ok('73.2')}  2 Pacer Nova ${ok('68.4')}  ${dim('bot')}`],
    [`  5 lena.k ${ok('65.1')}  ${dim('your seat: lena')}`],
    [`  board  ${ok('5th / 9')}  header  ${ok('· Group · 9 riders')}`],
  ], 0.2, `${at(110, 520, 860)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('board-detail', `${at(1180, 110, 520)};${BOARD}`, pop(S, onBeat(S, part('board', 0, 0.4)), { tilt: -1 }))}
  </div>`);

Film.scene('report', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-123 AC1', 'Each second,', 'your output.', 110, 160, 760)}
  ${terminal(S, 'ReportProgress, as the fixture heard it', [
    [`  ReportProgress(…T1923Z, ${ok('0.108')} kJ, ${ok('108')} W)`],
    [`  ReportProgress(…T1923Z, ${ok('0.216')} kJ, ${ok('108')} W)`],
    [`  ${dim('never two within 500 ms')}`],
  ], 0.25, `${at(110, 560, 820)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('board-xl', `${at(980, 200, 840)};${RIDE}`, pop(S, onBeat(S, part('report', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('bots', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-122 AC3, L2-123 AC2, AC4, L2-083', 'Bots fill the seats,', 'ranked by output.', 110, 130, 1700)}
  ${terminal(S, 'the service, once a second', [
    prompt('SessionTicker → TickLiveSessionsCommand'),
    [`  2 seated  ${ok('+ 8 bots')}  ${dim('Pacer Nova … Pacer Flint, easy pack')}`],
    [`  pace  ${dim('130 W + drift + swing × sin(2πt ÷ period + phase)')}`],
    [`  rank by output  ${ok('StandingsUpdated')} → session:hiit-cardio-30@…`],
    [`  8 seated  ${ok('no bots')}`],
  ], 0.15, `${at(110, 420, 1700)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

// ── Act 2: moving up, every width ─────────────────────────────────────────────────────────────
Film.scene('reorder', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-090 AC2', 'Pull ahead,', 'slide up.', 110, 160, 700)}
  ${closeup('board-detail', `${at(860, 110, 460)};${BOARD}`, pop(S, onBeat(S, part('reorder', 0, 0.1)), { tilt: -2 }))}
  ${closeup('board-reordered', `${at(1380, 110, 460)};${BOARD}`, pop(S, onBeat(S, part('reorder', 0, 0.4)), { tilt: 2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/board-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Beside or below,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('402 passed')} ${dim('25 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('227 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1445 passed')} ${dim('22 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.22 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One board,', 'the same for all.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Ranked by output, your row marked')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Bots fill to ten on the pace model')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Reports at most twice a second')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 14.5 · Live group board' });

wipeInto('bots');
bug();

Film.start();
