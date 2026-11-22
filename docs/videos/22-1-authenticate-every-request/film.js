// Slice 22.1 · Authenticate every request. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The slice changes the backend only, so the app pictures are the doors a visitor may open without a session, sign-in
// and the public Class Library, from shots.ts; the backend is shown by terminals holding the real answers of the built
// API (curl on localhost:5310) and of its tests. Every position is a pure function of the scene's time
// (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, onPhone, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;

// ── Act 1: a session by default ───────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 22.1 · Authenticate every request',
  words: 'Signed in,',
  accent: 'by default.',
  width: 860,
  device: (S) => onBrowser(S, 'library-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('list', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-127 AC1', 'A short,', 'written list.', 110, 160, 640)}
  ${terminal(S, 'anonymous, each marked where it is mapped', [
    [`POST /api/auth/code            ${ok('sign-in')}`],
    [`POST /api/auth/code/confirm    ${ok('sign-in')}`],
    [`POST /api/auth/sign-out        ${ok('nothing to end')}`],
    [`GET  /api/classes, /{id}       ${ok('ADR 0028')}`],
    [`GET  /api/maps, /{mapId}/queue ${ok('ADR 0029')}`],
    [`GET  /health/live, /ready      ${ok('the probes')}`],
    [`GET  the app's files           ${ok('ADR 0026')}`],
    ['# everything else needs a signed-in rider', 'terminal__dim'],
  ], onBeat(S, part('list', 0, 0.25)), `${at(800, 200, 1010)};font-size:24px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('refused', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-127 AC1', 'No session,', '401.', 110, 200, 640)}
  ${terminal(S, 'backend · the built API, without a session', [
    prompt('curl -i -X POST localhost:5310/api/rides'),
    ['HTTP/1.1 401 Unauthorized', 'terminal__error'],
    ['Content-Type: application/problem+json'],
    [''],
    ['{ "title": "Sign in to continue.",'],
    ['  "status": 401,'],
    [`  "code": "${ok('unauthenticated')}" }`],
    ['# no Location header: never a redirect', 'terminal__dim'],
  ], S.beat(2), `${at(800, 230, 1010)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('every', (S) => `
  <div class="fill field--bone">
  ${title(S, 'AnonymousEndpointsTests', 'Every endpoint,', 'asked.', 110, 160, 700)}
  ${terminal(S, 'backend · mark POST /api/rides anonymous by mistake', [
    prompt('dotnet test --filter-method *Only_the_listed_endpoints*'),
    ['Assert.Equal() Failure: Strings differ', 'terminal__error'],
    ['  Expected: ···"de/confirm\\nPOST /api/auth/sign-out"'],
    ['  Actual:   ···"de/confirm\\nPOST /api/auth/sign-out\\nPOST /api/rides"'],
    ['  failed: 1', 'terminal__error'],
    [''],
    ['# put it back: every other endpoint answers 401', 'terminal__dim'],
    [`  succeeded: ${ok('1')}`],
  ], onBeat(S, part('every', 0, 0.3)), `${at(110, 500, 1700)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`);

// ── Act 2: from Telo Ride itself ──────────────────────────────────────────────────────────────
Film.scene('origin', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-127 AC2 · ADR 0033', 'From Telo Ride,', 'or not at all.', 110, 160, 900)}
  <div style="${at(110, 520, 900)}">
    ${fact(S, 1, onBeat(S, part('origin', 0, 0.3)), 'The browser marks each request: Sec-Fetch-Site')}
    ${fact(S, 2, onBeat(S, part('origin', 0, 0.5)), 'A page cannot set or remove the mark')}
    ${fact(S, 3, onBeat(S, part('origin', 0, 0.7)), 'Nothing extra for the app to send')}
  </div>
  ${onPhone(S, 'sign-in-xs', 1260, 140, 380, onBeat(S, part('origin', 0, 0.15)), 4)}
  </div>`, { before: 0.4 });

Film.scene('forged', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-127 AC2', 'Another site,', '403.', 110, 160, 640)}
  ${terminal(S, 'backend · a rename from another site', [
    prompt('curl -i -X PUT localhost:5310/api/riders/me/display-name \\'),
    ['    -H "Sec-Fetch-Site: cross-site" -H "Origin: https://elsewhere.example"'],
    ['HTTP/1.1 403 Forbidden', 'terminal__error'],
    ['{ "title": "This request did not come from Telo Ride.",'],
    [`  "code": "${ok('cross_origin')}" }`],
    [''],
    prompt('curl -i -X POST localhost:5310/hubs/ride/negotiate …cross-site'),
    ['HTTP/1.1 403 Forbidden', 'terminal__error'],
  ], onBeat(S, part('forged', 0, 0.15)), `${at(760, 200, 1080)};font-size:21px`, { every: S.BEAT * 0.55 })}
  </div>`);

// ── Act 3: the rider's side, the proof and the close ──────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/sign-in-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Sign-in,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--gold">
  ${terminal(S, 'backend · every test', [
    prompt('dotnet test --solution Telo.Ride.slnx'),
    [`Test run summary: ${ok('Passed!')}`],
    ['  total: 488'],
    ['  failed: 0'],
    ['  succeeded: 488'],
  ], 0.1, `${at(80, 300, 640)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', '488 tests,', 'all green.', 760, 110, 1100)}
  <div style="${at(760, 470, 1060)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Through the API, on a real host in memory')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.6)), 'No real database, no file, no sleep')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 22.1 · Authenticate every request' });

wipeInto('origin');
bug();

Film.start();
