// Slice 14.1 · Connect to the ride hub. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are 30 Minute HIIT Cardio ridden in a group session at 7:00, holding its connection to the ride hub,
// at 1440 px and three other widths, its bike panel, and Home, which holds none, from shots.ts. The hub's traffic is
// shown as the terminal lines of what the shared fixture saw. Every position is a pure function of the scene's time
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
// The close-ups' sizes in CSS pixels, from shots/.
const BIKE = 'aspect-ratio:1432/132;object-fit:cover';
const RIDE = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: one link, measured ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 14.1 · Connect to the ride hub',
  words: 'One live link,',
  accent: 'only when it counts.',
  width: 900,
  device: (S) => onBrowser(S, 'group-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('connect', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-120 AC1', 'Join a group,', 'one connection.', 110, 130, 1700)}
  ${terminal(S, 'the ride hub, as the fixture saw it', [
    prompt('open /classes/hiit-cardio/ride?session=session-0715'),
    [`  POST /hubs/ride/negotiate  ${ok('session cookie')}`],
    [`  WebSocket /hubs/ride  ${ok('connected')}`],
    [`  connections  ${ok('1')}`],
  ], 0.2, `${at(110, 470, 820)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('group-xl', `${at(1000, 430, 820)};${RIDE}`, pop(S, onBeat(S, part('connect', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('offset', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-121 AC3', 'Five asks,', 'one clock.', 110, 130, 1700)}
  ${terminal(S, 'ServerTime, five times', [
    [`  sent ${dim('10,000')}  server ${dim('11,520')}  back ${dim('10,100')}`],
    [`  sent ${dim('10,040')}  server ${dim('11,560')}  back ${dim('10,080')}  ${ok('shortest')}`],
    [`  ${dim('…three more')}`],
    [`  offset = server − midpoint = ${ok('+1,500 ms')}`],
  ], 0.15, `${at(110, 470, 900)};font-size:24px`, { every: S.BEAT * 0.6 })}
  <div style="${at(1090, 470, 720)}">
    ${fact(S, 1, onBeat(S, part('offset', 0, 0.3)), 'Five ServerTime calls')}
    ${fact(S, 2, onBeat(S, part('offset', 0, 0.5)), 'The quickest round trip wins')}
    ${fact(S, 3, onBeat(S, part('offset', 0, 0.7)), 'Measured on every connect')}
  </div>
  </div>`, { before: 0.4 });

// ── Act 2: drops, solo, every width ───────────────────────────────────────────────────────────
Film.scene('reconnect', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-120 AC3', 'Dropped,', 'back at once.', 110, 130, 1700)}
  ${terminal(S, 'after a drop', [
    [`  connection lost  ${dim('reconnecting')}`],
    [`  retry after ${ok('0 s')}  POST /hubs/ride/negotiate`],
    [`  ${ok('connected')}  ServerTime ×5, offset measured again`],
    [`  next drops wait ${dim('2 s, 5 s, 10 s, then every 30 s')}`],
  ], 0.15, `${at(110, 440, 1100)};font-size:24px`, { every: S.BEAT * 0.6 })}
  ${closeup('bike-xl', `${at(110, 820, 1700)};${BIKE}`, pop(S, onBeat(S, part('reconnect', 0, 0.5)), { tilt: 1 }))}
  </div>`);

Film.scene('solo', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-120 AC4', 'Solo or browsing,', 'no link.', 110, 220, 700)}
  ${closeup('home-xl', `${at(880, 300, 920)};${RIDE}`, pop(S, onBeat(S, part('solo', 0, 0.15)), { tilt: -2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/group-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One ride,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('338 passed')} ${dim('1 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('209 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1397 passed')} ${dim('17 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.21 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One link,', 'nothing left open.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'A group ride connects once, with a measured clock')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'A drop reconnects at once and measures again')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Leaving, solo and Home hold no connection')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 14.1 · Connect to the ride hub' });

wipeInto('reconnect');
bug();

Film.start();
