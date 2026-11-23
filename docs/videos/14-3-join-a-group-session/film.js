// Slice 14.3 · Join a group session. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Class Start before Join, the group ride after the hub gave its seat at 1440 px and three other
// widths, and Class Start after a full and a started session, from shots.ts. The hub's answers are shown as the
// terminal lines of what the shared fixture saw. Every position is a pure function of the scene's time
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
// The close-ups' sizes in CSS pixels, from shots/: the ride choice cropped to its options and session.
const CHOICE = 'aspect-ratio:452/330;object-fit:cover;object-position:top';
const RIDE = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: a seat, or the next session ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 14.3 · Join a group session',
  words: 'Your seat,',
  accent: 'or the next one.',
  width: 900,
  device: (S) => onBrowser(S, 'start-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('join', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-085 AC3, L2-122 AC1', 'Press Join,', 'take a seat.', 110, 130, 1700)}
  ${terminal(S, 'the ride hub, as the fixture saw it', [
    prompt('open /classes/hiit-cardio-30/ride?session=…T1939Z'),
    [`  WebSocket /hubs/ride  ${ok('connected')}  ServerTime ×5`],
    [`  JoinClassSession(hiit-cardio-30, …T1939Z)`],
    [`  ${ok('seated')}  jersey ${ok('lena')}  ${dim('starts 7:39 PM')}`],
  ], 0.2, `${at(110, 470, 860)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('group-xl', `${at(1040, 430, 780)};${RIDE}`, pop(S, onBeat(S, part('join', 0, 0.55)), { tilt: -1 }))}
  </div>`);

Film.scene('full', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-122 AC2, L2-086 AC2', 'Ten seated,', 'the next one.', 110, 160, 760)}
  ${terminal(S, 'the eleventh rider', [
    [`  JoinClassSession  ${dim('session_full')}`],
    [`  next  ${ok('7:54 PM')}`],
  ], 0.25, `${at(110, 560, 760)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('full-choice', `${at(980, 140, 820)};${CHOICE}`, pop(S, onBeat(S, part('full', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: late, dropped, every width ─────────────────────────────────────────────────────────
Film.scene('started', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-086 AC3', 'Too late,', 'the next session.', 110, 160, 760)}
  ${terminal(S, 'after 7:24 PM', [
    [`  JoinClassSession(…T1924Z)  ${dim('session_started')}`],
    [`  next  ${ok('7:39 PM')}  ${dim('back on Class Start')}`],
  ], 0.25, `${at(110, 560, 820)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('started-choice', `${at(1000, 140, 820)};${CHOICE}`, pop(S, onBeat(S, part('started', 0, 0.15)), { tilt: 1 }))}
  </div>`);

Film.scene('rejoin', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-120 AC3', 'Dropped,', 'same seat.', 110, 160, 700)}
  ${terminal(S, 'after a drop', [
    [`  connection lost  ${dim('reconnecting')}`],
    [`  ${ok('connected')}  ServerTime ×5`],
    [`  JoinClassSession  ${ok('seated')}  jersey ${ok('lena')}`],
  ], 0.15, `${at(110, 520, 760)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('group-xl', `${at(960, 260, 840)};${RIDE}`, pop(S, onBeat(S, part('rejoin', 0, 0.2)), { tilt: -2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/group-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One seat,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('377 passed')} ${dim('27 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('220 passed')} ${dim('5 new')}`],
    prompt('npm test'),
    [`  ${ok('1422 passed')} ${dim('13 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.22 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'A seat,', 'or the next session.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Seated until the start, ten at most')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Full or started: back to the next session')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'A reconnect keeps the same seat')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 14.3 · Join a group session' });

wipeInto('started');
bug();

Film.start();
