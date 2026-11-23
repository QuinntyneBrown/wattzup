// Slice 10.1 · Record a ride. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a bots race nearing the line and a class in its last seconds, from shots.ts, with the backend
// answered by the shared fixture; the ride the race submitted is printed by shots.ts and drawn in the terminal. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const bad = (text) => `<span class="terminal__error">${esc(text)}</span>`;
// The race's numbers in a 1440 × 900 shot (x 10–330, y 60–370), in a box of their shape.
const NUMBERS = 'aspect-ratio:320/310;object-fit:cover;object-view-box:inset(6.7% 77.1% 58.9% 0.7%)';
// The standings in a 1440 × 900 shot (x 1150–1430, y 60–480), in a box of their shape.
const STANDINGS = 'aspect-ratio:280/420;object-fit:cover;object-view-box:inset(6.7% 0.7% 46.7% 79.9%)';

// ── Act 1: the ride ends, and goes ───────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 10.1 · Record a ride',
  words: 'Cross the line,',
  accent: 'and it’s recorded.',
  width: 860,
  device: (S) => onBrowser(S, 'line-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('race', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-044 AC2', 'At the line,', 'the facts go.', 110, 150, 560)}
  ${closeup('line-xl', `${at(110, 560, 300)};${NUMBERS}`, pop(S, onBeat(S, part('race', 0, 0.2)), { tilt: -2 }))}
  ${closeup('line-xl', `${at(450, 470, 240)};${STANDINGS}`, pop(S, onBeat(S, part('race', 0, 0.3)), { tilt: 2 }))}
  ${terminal(S, 'POST /api/rides', [
    [`rideId          ${dim('b9a35ed4-35b0-…')}`],
    [`kind, mapId     ${ok('race, old-town-criterium')}`],
    [`mode, pack      ${ok('bots, medium')}`],
    [`place           ${ok('1 of 10')}`],
    [`elapsedSeconds  ${ok('57')}`],
    [`distanceMeters  ${ok('508.09')}`],
    [`outputKj        ${ok('37.677')}`],
    [`maxPowerWatts   ${ok('661')}  ${dim('maxSpeedKmh 32.09')}`],
    [`speedSamplesKmh ${ok('57 seconds')} ${dim('add up to 508.09 m')}`],
  ], S.beat(3), `${at(830, 230, 980)};font-size:22px`, { every: S.BEAT * 0.45 })}
  </div>`);

Film.scene('class', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-044 AC2 · L2-022', 'A class too,', 'at the bike’s speed.', 110, 220, 640)}
  ${onBrowser(S, 'class-end-xl', 820, 170, 760, onBeat(S, part('class', 0, 0.2)), { tilt: 2 })}
  ${onPhone(S, 'class-end-xs', 1500, 300, 300, onBeat(S, part('class', 0, 0.5)), -4)}
  </div>`, { before: 0.4 });

// ── Act 2: the backend records it once, if it could be ridden ────────────────────────────────
Film.scene('once', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-125 AC3', 'Recorded once,', 'answered the same.', 110, 220, 640)}
  ${terminal(S, 'one ride id, three times', [
    prompt('POST /api/rides'),
    [`  ${ok('201')} ${dim('{ rideId, recordedAt: 07:00:00 }')}`],
    prompt('POST /api/rides   # the same ride id, five minutes on'),
    [`  ${ok('200')} ${dim('{ rideId, recordedAt: 07:00:00 }')}`],
    prompt('POST /api/rides   # two copies at once; the key refuses one'),
    [`  ${ok('200')} ${dim('the copy that landed first')}`],
  ], S.beat(2), `${at(840, 330, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('plausible', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-125 AC2', 'Only rides', 'that could be ridden.', 110, 200, 600)}
  ${terminal(S, 'POST /api/rides', [
    [`maxPowerWatts 2001                  ${bad('422')} ${dim('ride_not_plausible')}`],
    [`a second at 100.5 km/h              ${bad('422')} ${dim('ride_not_plausible')}`],
    [`distance 6 % past its speeds        ${bad('422')} ${dim('ride_not_plausible')}`],
    [`14.2 km in 511 s, under 100 km/h    ${bad('422')} ${dim('ride_not_plausible')}`],
    [`mapId atlantis                      ${bad('400')} ${dim('validation_failed')}`],
    [`the honest ride, same id            ${ok('201')} ${dim('recorded')}`],
  ], S.beat(2), `${at(800, 400, 1020)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('facts', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-044 AC4', 'Facts only.', 'The backend does the rest.', 110, 220, 760)}
  ${terminal(S, 'what a ride never carries', [
    [`xp               ${dim('not sent; not read if sent')}`],
    [`stars            ${dim('not sent; not read if sent')}`],
    [`unlockedMapIds   ${dim('not sent; not read if sent')}`],
  ], S.beat(3), `${at(980, 400, 820)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('175 passed')} ${dim('42 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('155 passed')}`],
    prompt('npm test'),
    [`  ${ok('1298 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.12 kB')} ${dim('unchanged')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the ride.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Recorded once per ride id, the first answer repeated')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Refused when no one could have ridden it')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Sent the moment a race or class ends')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 10.1 · Record a ride' });

wipeInto('once');
bug();

Film.start();
