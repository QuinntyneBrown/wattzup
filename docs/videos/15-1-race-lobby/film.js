// Slice 15.1 · Race lobby. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Race Setup with Riders online, the riders-online lobby waiting at 1440 px and three other widths,
// the lobby after MarcoVelo leaves and the lobby full after the bot fill, from shots.ts. The hub's traffic is shown as
// the terminal lines of what the shared fixture and the backend's tests saw. Every position is a pure function of the
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

// ── Act 1: from Race Setup to a seat ──────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 15.1 · Race lobby',
  words: 'Race riders online,',
  accent: 'start together.',
  width: 900,
  device: (S) => onBrowser(S, 'lobby-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('setup', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-048 AC1, AC3, L2-050 AC3', 'Riders online,', 'from level 3.', 110, 160, 760)}
  ${terminal(S, 'Race Setup, every 10 seconds', [
    prompt('GET /api/maps/old-town-criterium/queue'),
    [`  { riders: ${ok('5')} }  ${dim('seated in open sessions')}`],
    [`  ${ok('5 riders queuing now.')} ${dim('8–10 per race')}`],
    [`  Find a race → ${ok('/race/old-town-criterium/lobby?mode=online')}`],
  ], 0.2, `${at(110, 520, 800)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('setup-xl', `${at(980, 220, 840)};${PAGE}`, pop(S, onBeat(S, part('setup', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('seat', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-121 AC1, L2-051, L2-052', 'The fullest race,', 'or a new one.', 110, 160, 820)}
  ${terminal(S, 'FindRace, as the hub answered it', [
    prompt("FindRace('old-town-criterium')"),
    [`  sessionId ${dim('old-town-criterium@…T180030Z')}`],
    [`  startsAt ${ok('now + 30 s')}  seat ${ok('6')}  ${dim('5 riders, 4 open')}`],
    [`  You first, then by seat  clock ${ok('0:24')}`],
  ], 0.25, `${at(110, 560, 820)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('lobby-xl', `${at(980, 200, 840)};${PAGE}`, pop(S, onBeat(S, part('seat', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('follow', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-055 AC1, AC3, L2-057', 'Come and go,', 'seats follow.', 110, 160, 760)}
  ${terminal(S, 'SeatsChanged, to the session', [
    [`  seat 7 ${ok('kenji.cyc Lv 9')}  ${dim('a rider joins')}`],
    [`  seat 2 ${ok('Open seat')}  left ${ok('MarcoVelo')}`],
    [`  ${dim('a lost connection frees its seat after 10 s')}`],
    [`  LeaveRace → ${ok('/race/old-town-criterium?mode=online')}`],
  ], 0.2, `${at(110, 520, 800)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('left-xl', `${at(980, 220, 840)};${PAGE}`, pop(S, onBeat(S, part('follow', 0, 0.15)), { tilt: 1 }))}
  </div>`);

Film.scene('fill', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-054 AC1, AC2, L2-051 AC4, L2-121 AC2', 'At 0:10,', 'the race starts full.', 110, 160, 760)}
  ${terminal(S, 'the service, once a second', [
    prompt('SessionTicker → TickLiveSessionsCommand'),
    [`  0:10  ${ok('+ 5 bots')}  ${dim('Pacer Nova … Pacer Kite, ready')}`],
    [`  ${ok('10 / 10')}  On the start line  ${dim('target resistance 8')}`],
  ], 0.2, `${at(110, 560, 800)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('full-xl', `${at(980, 220, 840)};${PAGE}`, pop(S, onBeat(S, part('fill', 0, 0.15)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/lobby-${s}.png`, width, height }));
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
    [`  ${ok('422 passed')} ${dim('20 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('239 passed')} ${dim('12 new')}`],
    prompt('npm test'),
    [`  ${ok('1453 passed')} ${dim('8 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One grid,', 'the same for all.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Seated by the hub, You first')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Joins, leaves and bots at 0:10')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Leave frees your seat')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 15.1 · Race lobby' });

wipeInto('follow');
bug();

Film.start();
