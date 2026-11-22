// Slice 14.4 · Start together. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the group ride waiting for its 7:39 PM session at 1440 px and three other widths, its video
// close up, the ride five seconds after its start, and a rider who arrived two minutes late, from shots.ts. The hub's
// answers are shown as the terminal lines of what the shared fixture saw. Every position is a pure function of the
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
// The close-ups' sizes in CSS pixels, from shots/: the class video and the whole ride at 1440 px.
const VIDEO = 'aspect-ratio:16/9;object-fit:cover';
const RIDE = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: wait, then start ───────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 14.4 · Start together',
  words: 'Wait,',
  accent: 'start as one.',
  width: 900,
  device: (S) => onBrowser(S, 'wait-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('wait', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-087 AC1, AC4', 'Before the start,', 'hold at 0:00.', 110, 130, 1700)}
  ${terminal(S, 'the ride hub, as the fixture saw it', [
    prompt('open /classes/hiit-cardio-30/ride?session=…T1939Z'),
    [`  ServerTime ×5  ${ok('offset measured')}`],
    [`  JoinClassSession  ${ok('seated')}  ${dim('starts 7:39 PM')}`],
    [`  clock ${ok('0:00')}  video ${dim('parked at 0:12')}  Starts in ${ok('9:00')}`],
  ], 0.2, `${at(110, 470, 860)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('wait-video', `${at(1040, 430, 780)};${VIDEO}`, pop(S, onBeat(S, part('wait', 0, 0.55)), { tilt: -1 }))}
  </div>`);

Film.scene('start', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-122 AC3, L2-121 AC3', 'At 7:39,', 'clock and video go.', 110, 160, 760)}
  ${terminal(S, 'the server’s time reaches the start', [
    [`  Starts in ${ok('0:00')}`],
    [`  clock ${ok('0:05')}  video ${ok('playing')}`],
    [`  target resistance ${ok('8')}  ${dim('Warm-up')}`],
  ], 0.25, `${at(110, 560, 760)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('started-xl', `${at(960, 200, 860)};${RIDE}`, pop(S, onBeat(S, part('start', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: late, every width ──────────────────────────────────────────────────────────────────
Film.scene('late', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-122 AC3', 'Late,', 'still in step.', 110, 160, 700)}
  ${terminal(S, 'arriving at 7:30', [
    [`  JoinClassSession  ${ok('seated')}  ${dim('started 7:28 PM')}`],
    [`  clock ${ok('2:00')}  ${dim('the session’s time')}`],
  ], 0.15, `${at(110, 560, 760)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('late-xl', `${at(960, 200, 860)};${RIDE}`, pop(S, onBeat(S, part('late', 0, 0.2)), { tilt: -2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/wait-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One countdown,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('377 passed')} ${dim('no backend change')}`],
    prompt('npx playwright test'),
    [`  ${ok('223 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1423 passed')} ${dim('1 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.22 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Wait,', 'then start as one.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), '0:00 and the time left until the start')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Clock and video start together')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'A late rider rides the session’s time')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 14.4 · Start together' });

wipeInto('late');
bug();

Film.start();
