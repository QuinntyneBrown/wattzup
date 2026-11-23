// Slice 22.2 · Validate input and encode output. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are Connect Bike after pairing a bike whose name holds markup, from shots.ts; the backend
// is shown by terminals holding the real answers of the built API (curl on localhost:5310), of its hub tests and of
// lint. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const REGION = 'height:auto';

// ── Act 1: checked on the way in ──────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 22.2 · Validate input and encode output',
  words: 'Data in,',
  accent: 'text out.',
  width: 860,
  device: (S) => onBrowser(S, 'connect-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('rules', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-129 AC1 · InputRules', 'A rule for', 'every field.', 110, 160, 640)}
  ${terminal(S, 'the shapes the validators share', [
    [`class or map id   ${ok('hiit-cardio-30')}   1–64 of a-z 0-9 -`],
    [`session id        ${ok('vice-city@20261122T070000Z')}`],
    [`power             ${ok('0 to 2,000 W')}`],
    [`output, distance  ${ok('finite, 0 or more')}`],
    [''],
    ['# 11 new validators, beside the ride\'s: every request with input', 'terminal__dim'],
    ['# email, code, name and workout keep their own codes', 'terminal__dim'],
  ], onBeat(S, part('rules', 0, 0.25)), `${at(800, 220, 1010)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('refused', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-129 AC1, AC4', '400,', 'naming the field.', 110, 200, 640)}
  ${terminal(S, 'backend · the built API', [
    prompt('curl -i localhost:5310/api/classes/HIIT%20%3Cb%3E'),
    ['HTTP/1.1 400 Bad Request', 'terminal__error'],
    [`{ "errors": { "id": ["An id of lowercase letters, digits and hyphens."] },`],
    [`  "code": "${ok('validation_failed')}" }`],
    [''],
    prompt(`curl -i -X POST localhost:5310/api/auth/code -d '{"email": 42}'`),
    ['HTTP/1.1 400 Bad Request', 'terminal__error'],
    [`{ "errors": { "email": ["This field has the wrong type."] },`],
    [`  "code": "${ok('validation_failed')}", "traceId": "00-50e48bb4…" }`],
  ], S.beat(2), `${at(760, 200, 1080)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('hub', (S) => `
  <div class="fill field--bone">
  ${title(S, 'ValidationHubFilter', 'The hub,', 'the same rule.', 110, 160, 760)}
  ${terminal(S, 'backend · a real SignalR client, InputValidationTests', [
    prompt('connection.InvokeAsync("ReportProgress", session, 1.0, -5.0)'),
    ['HubException: An unexpected error occurred invoking \'ReportProgress\''],
    [`  on the server. HubException: ${ok('validation_failed: powerWatts')}`],
    [''],
    prompt('connection.InvokeAsync("FindRace", "../../etc/passwd")'),
    [`  … HubException: ${ok('validation_failed: mapId')}`],
    ['# the connection stays open; a valid message is answered', 'terminal__dim'],
  ], onBeat(S, part('hub', 0, 0.3)), `${at(110, 480, 1700)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`);

// ── Act 2: shown as text on the way out ───────────────────────────────────────────────────────
Film.scene('text', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-129 AC2', 'Markup,', 'shown as text.', 110, 160, 760)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, onBeat(S, part('text', 0, 0.35)), 'The name, character for character')}
    ${fact(S, 2, onBeat(S, part('text', 0, 0.55)), 'No image, no bold, no script run')}
  </div>
  ${closeup('device', `${at(960, 150, 820)};${REGION}`, pop(S, onBeat(S, part('text', 0, 0.1)), { tilt: -1 }))}
  ${closeup('header-bike', `${at(1040, 760, 700)};${REGION}`, pop(S, onBeat(S, part('text', 0, 0.65)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('lint', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ESLint', 'No way', 'round it.', 110, 160, 640)}
  ${terminal(S, 'frontend · [innerHTML] and a bypass, put in by hand', [
    prompt('npx eslint connect-device.html connect-device.ts'),
    ['15:39  error  Bind text with interpolation, never [innerHTML]', 'terminal__error'],
    ['              or [outerHTML] (L2-129 AC2)'],
    ['23:66  error  Never bypass Angular\'s sanitiser: render text', 'terminal__error'],
    ['              with interpolation (L2-129 AC2)'],
    ['✖ 2 problems (2 errors, 0 warnings)'],
  ], onBeat(S, part('lint', 0, 0.2)), `${at(760, 220, 1080)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/connect-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Connect Bike,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 22.2 · Validate input and encode output' });

wipeInto('text');
bug();

Film.start();
