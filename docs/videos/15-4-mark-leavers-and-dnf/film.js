// Slice 15.4 · Mark leavers and DNF. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a riders-online race at 5:01 with the service's peers board, then MarcoVelo marked DNF in last
// place at 1440 px and three other widths, from shots.ts. The hub's traffic is shown as the terminal lines of what the
// shared fixture and the backend's tests saw. Every position is a pure function of the scene's time
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
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
// The board's corner of the race at 1440 px.
const BOARD = 'aspect-ratio:4/5;object-fit:cover;object-position:100% 0%';

// ── Act 1: the leaver, on every board ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 15.4 · Mark leavers and DNF',
  words: 'Left the race?',
  accent: 'DNF, for all.',
  width: 900,
  device: (S) => onBrowser(S, 'dnf-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('board', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-124 AC1, L2-060 AC1', 'Eighth, then', 'DNF, last.', 110, 160, 760)}
  ${closeup('before-xl', `${at(900, 120, 460)};${BOARD}`, pop(S, onBeat(S, part('board', 0, 0.1)), { tilt: -2 }))}
  ${closeup('dnf-xl', `${at(1360, 420, 460)};${BOARD}`, pop(S, onBeat(S, part('board', 0, 0.55)), { tilt: 2 }))}
  ${terminal(S, 'RaceStandingsUpdated, the next second', [
    [`  8 MarcoVelo  ${dim('riding')}  → ${ok('−0:05')}`],
    [`  10 MarcoVelo ${dim('dnf')}     → ${ok('DNF')}  ${dim('faint, last')}`],
    [`  ${dim('the text, not the colour, carries it')}`],
  ], 0.25, `${at(110, 560, 700)};font-size:21px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('leave', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-124 AC1', 'Leave,', 'and everyone knows.', 110, 160, 820)}
  ${terminal(S, 'LeaveRace, as the hub heard it', [
    prompt("LeaveRace('old-town-criterium@…T180030Z')"),
    [`  seat kept, status ${ok('dnf')}  ${dim('after the start')}`],
    [`  RaceStandingsUpdated ${ok('at once')}  ${dim('no wait for the tick')}`],
    [`  ${dim('the rider goes to Race Setup')}`],
  ], 0.2, `${at(110, 560, 860)};font-size:20px`, { every: S.BEAT * 0.6 })}
  ${closeup('dnf-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('leave', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('silence', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-124 AC2, AC4', 'Silent or gone,', 'still counted.', 110, 160, 800)}
  ${terminal(S, 'the race session, each second', [
    [`  no progress for ${ok('15 s')}      → DNF`],
    [`  connection gone ${ok('30 s')}      → removed, DNF`],
    [`  JoinRace after removal → ${ok('session_not_found')}`],
    [`  ${dim('held at the line: finished, never DNF')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('dnf-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('silence', 0, 0.15)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/dnf-${s}.png`, width, height }));
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
    [`  ${ok('447 passed')} ${dim('8 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('247 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1462 passed')} ${dim('1 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Who left,', 'everyone sees.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'A leaver DNF for all, at once')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Silent 15 s or gone 30 s: DNF')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'DNF ranked last, "DNF" in place of the gap')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 15.4 · Mark leavers and DNF' });

wipeInto('silence');
bug();

Film.start();
