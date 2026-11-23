// Slice 22.3 · Limit abuse. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are Results for a ride the backend refused with 429, from shots.ts; the backend is shown by terminals restating the
// acceptance and unit tests that pass against it (RideLimitTests, ProgressRateTests, ProgressRateGateTests). Every
// position is a pure function of the scene's time (docs/videos/README.md).
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
const REGION = 'height:auto';

// ── Act 1: requests ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 22.3 · Limit abuse',
  words: 'Enough,',
  accent: 'no more.',
  width: 860,
  device: (S) => onBrowser(S, 'results-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('rides', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-130 AC1, AC3', '60 rides', 'an hour.', 110, 160, 640)}
  ${terminal(S, 'backend · RideLimitTests, through the API', [
    ['# rides 1 to 60 within the hour'],
    [`POST /api/rides   ${ok('201 Created')}   × 60`],
    [''],
    ['# the 61st, 50 minutes after the first'],
    ['POST /api/rides   429 Too Many Requests', 'terminal__error'],
    [`Retry-After: ${ok('3000')}`],
    [`{ "code": "${ok('rate_limited')}" }`],
  ], onBeat(S, part('rides', 0, 0.25)), `${at(800, 220, 1010)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('counted', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'SubmitRideCommandHandler', 'Rides counted,', 'not requests.', 110, 200, 680)}
  ${terminal(S, 'backend · the same rider, over the limit', [
    ['# the hour\'s first ride, sent again'],
    [`POST /api/rides   ${ok('200 OK')}   its first answer`],
    [''],
    ['# another rider'],
    [`POST /api/rides   ${ok('201 Created')}`],
    [''],
    ['# once the Retry-After has passed'],
    [`POST /api/rides   ${ok('201 Created')}`],
  ], S.beat(2), `${at(820, 200, 1000)};font-size:23px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('outbox', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-130 AC1 · DeviceRideOutbox', 'The ride', 'waits its turn.', 110, 160, 760)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, onBeat(S, part('outbox', 0, 0.3)), 'Kept on the device, XP on its way')}
    ${fact(S, 2, onBeat(S, part('outbox', 0, 0.55)), 'Sent again when Retry-After has passed')}
  </div>
  ${closeup('xp-waiting', `${at(980, 170, 780)};${REGION}`, pop(S, onBeat(S, part('outbox', 0, 0.1)), { tilt: -1 }))}
  ${closeup('xp-added', `${at(1020, 560, 740)};${REGION}`, pop(S, onBeat(S, part('outbox', 0, 0.6)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the hub ────────────────────────────────────────────────────────────────────────────
Film.scene('hub', (S) => `
  <div class="fill field--bone">
  ${title(S, 'L2-130 AC2 · ProgressRateHubFilter', 'Two a second,', 'then the door.', 110, 160, 860)}
  ${terminal(S, 'backend · ProgressRateGateTests, one row per pattern', [
    ['messages each second              last message'],
    [`2                                 ${ok('Admit')}`],
    ['3                                 Drop', 'terminal__error'],
    ['3 3 3 3 3 3 3 3 3 3               Drop', 'terminal__error'],
    ['3 3 3 3 3 3 3 3 3 3 3             Disconnect', 'terminal__error'],
    [`3 3 3 3 3 3 3 3 2 3 3 3           Drop   ${ok('a second under starts it again')}`],
    [`2 2 2 2 2 2 2 2 2 2 2 2           ${ok('Admit')}`],
  ], onBeat(S, part('hub', 0, 0.3)), `${at(110, 480, 1700)};font-size:23px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('gate', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'LiveSessionStore', 'The app', 'keeps under it.', 110, 160, 640)}
  ${terminal(S, 'backend and frontend · the checks that run', [
    prompt('dotnet test --filter-class "*ProgressRate*"'),
    [`  total: 13   failed: 0   ${ok('succeeded: 13')}`],
    [''],
    ['# the app sends a report at most every 500 ms (L2-123 AC1)', 'terminal__dim'],
    ['const REPORT_INTERVAL_MS = 500;'],
  ], onBeat(S, part('gate', 0, 0.2)), `${at(800, 240, 1010)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/results-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Results, waiting,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 22.3 · Limit abuse' });

wipeInto('outbox');
bug();

Film.start();
