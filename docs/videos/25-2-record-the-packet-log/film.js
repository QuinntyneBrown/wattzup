// Slice 25.2 · Record the packet log. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app from shots.ts; the terminals hold the real file shots.ts saved, and the real outputs of
// e2e/packet-log.spec.ts before the change and after it, and of the unit tests. Every position is a pure function of the scene's time
// (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const REGION = 'height:auto';

const FIRST = [
    "{\"time\":\"2026-11-21T18:00:00.170Z\",\"direction\":\"out\",\"frame\":\"A1\",\"hex\":\"F0 A1 00 91\"}",
    "{\"time\":\"2026-11-21T18:00:00.473Z\",\"direction\":\"out\",\"frame\":\"A3\",\"hex\":\"F0 A3 00 93\"}",
    "{\"time\":\"2026-11-21T18:00:00.776Z\",\"direction\":\"out\",\"frame\":\"B0\",\"hex\":\"F0 B0 01 01 A2\"}",
    "{\"time\":\"2026-11-21T18:01:00.000Z\",\"direction\":\"out\",\"frame\":\"A0\",\"hex\":\"F0 A0 01 01 92\"}",
    "{\"time\":\"2026-11-21T18:01:00.001Z\",\"direction\":\"out\",\"frame\":\"B1\",\"hex\":\"F0 B1 01 08 AA\"}",
];
const INCOMING = [
    "{\"time\":\"2026-11-21T18:01:04.463Z\",\"direction\":\"in\",\"frame\":\"D1\",\"hex\":\"F0 D1 09 00 05 00 00 00 00 00 4E 00 1D\"}",
    "{\"time\":\"2026-11-21T18:01:04.463Z\",\"direction\":\"in\",\"frame\":\"D2\",\"hex\":\"F0 D2 01 08 CB\"}",
];
const line = (text) => [`<span style="color:var(--color-muted)">${esc(text)}</span>`];

// ── Act 1: what it keeps ──────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 25.2 · Record the packet log',
  words: 'The bytes,',
  accent: 'kept here.',
  width: 760,
  device: (S) => onBrowser(S, 'ride-log-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('commands', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-114 AC1 · Log every packet off', 'Commands,', 'by default.', 110, 140, 700)}
  ${closeup('log-off', `${at(860, 230, 820)};${REGION}`, pop(S, onBeat(S, part('commands', 0, 0.2)), { tilt: -2 }))}
  </div>`);

Film.scene('recording', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-114 AC2 · Log every packet on', 'Every packet,', 'both ways.', 110, 140, 760)}
  ${closeup('log-recording', `${at(820, 300, 680)};${REGION}`, pop(S, onBeat(S, part('recording', 0, 0.15)), { tilt: 2 }))}
  ${onPhone(S, 'profile-log-xs', 1540, 130, 320, onBeat(S, part('recording', 0, 0.5)), 3)}
  </div>`, { before: 0.4 });

// ── Act 2: the file ───────────────────────────────────────────────────────────────────────────
Film.scene('file', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-114 AC3 · telo-ride-packets-2026-11-21.jsonl', 'One line', 'per message.', 110, 140, 1200)}
  ${terminal(S, 'Downloads', [
    prompt('head -n 5 telo-ride-packets-2026-11-21.jsonl'),
    ...FIRST.map(line),
    prompt(`grep '"in"' telo-ride-packets-2026-11-21.jsonl | head -n 2`),
    ...INCOMING.map(line),
  ], onBeat(S, part('file', 0, 0.2)), `${at(110, 420, 1700)};font-size:19px`, { every: S.BEAT * 0.4 })}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--blue">
  ${title(S, 'e2e/packet-log.spec.ts', 'Failing first,', 'passing now.', 110, 140, 900)}
  ${terminal(S, 'frontend · before, then after', [
    prompt('npx playwright test e2e/packet-log.spec.ts'),
    ['✘ with "Log every packet" off, the log keeps the commands and saves them as JSON Lines', 'terminal__error'],
    ['✘ with "Log every packet" on, every message both ways is kept and counted as Recording', 'terminal__error'],
    ['  2 failed'],
    prompt('npx playwright test e2e/packet-log.spec.ts --repeat-each 4'),
    [`  ${ok('8 passed')} (13.0s)`],
    prompt('npx ng test ride --watch=false'),
    [`  Test Files  ${ok('142 passed')} (142)`],
    [`       Tests  ${ok('1916 passed')} (1916)`],
  ], onBeat(S, part('proof', 0, 0.2)), `${at(110, 450, 1500)};font-size:21px`, { every: S.BEAT * 0.45 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/profile-log-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The packet log,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 25.2 · Record the packet log' });

wipeInto('file');
bug();

Film.start();
