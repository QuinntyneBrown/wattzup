// Slice 9.2 · Verify and stay signed in. Ten scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the code screen and the Class Library from shots.ts, with the backend answered by the shared
// fixture: five digits typed at four widths, the three refusals, a visitor sent to sign-in and back.
// Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The sign-in panel's region of a 1440 × 900 shot (x 480–960, y 150–750), in a box of its shape.
const PANEL = 'aspect-ratio:480/600;object-fit:cover;object-view-box:inset(16.7% 33.3% 16.7% 33.3%)';

// ── Act 1: the six digits ────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 9.2 · Verify and stay signed in',
  words: 'Six digits,',
  accent: 'then ride.',
  width: 860,
  device: (S) => onBrowser(S, 'typing-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('code', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-002 AC2, AC5', 'Type, paste', 'or take the offer.', 110, 220, 700)}
  ${closeup('typing-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('code', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('mismatch', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-002 AC3', 'Not that one?', 'Try again.', 110, 220, 700)}
  ${closeup('mismatch-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('mismatch', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('refused', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-002 AC4, AC6 · L2-003 AC3', 'Ten minutes,', 'five tries.', 110, 220, 640)}
  ${closeup('expired-xl', `${at(800, 90, 480)};${PANEL}`, pop(S, onBeat(S, part('refused', 0, 0.25)), { tilt: 1.5 }))}
  ${closeup('locked-xl', `${at(1330, 150, 480)};${PANEL}`, pop(S, onBeat(S, part('refused', 0, 0.5)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the session ───────────────────────────────────────────────────────────────────────
Film.scene('backend', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-002 AC2 · L2-004 AC1, AC2', 'One cookie,', 'no secrets.', 110, 200, 640)}
  ${terminal(S, 'POST /api/auth/code/confirm', [
    [`{ "email": "ada.rider@example.com", "code": "314159" }`],
    [`code         ${ok('HMAC compared in fixed time')}`],
    [`rider        ${ok('found, or made')} ${dim('isNewAccount')}`],
    [`Set-Cookie   ${ok('__Host-telo-session')}`],
    [`             ${dim('HttpOnly · Secure · SameSite=Lax · 365 days')}`],
    [`kept         ${ok('SHA-256 of the key, never the key')}`],
  ], S.beat(2), `${at(800, 280, 1020)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('guard', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-001 AC1 · L2-002 AC2', 'Sign in,', 'then back.', 110, 200, 560)}
  ${onBrowser(S, 'sent-xl', 740, 90, 640, onBeat(S, part('guard', 0, 0.2)), { tilt: 2 })}
  ${onBrowser(S, 'back-xl', 1220, 470, 640, onBeat(S, part('guard', 0, 0.55)), { tilt: -2 })}
  <p class="kicker" style="${at(110, 560, 600)}" ${S.rise(onBeat(S, part('guard', 0, 0.4)))}>/classes → sign-in → /classes</p>
  </div>`, { before: 0.7 });

Film.scene('session', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-004 AC1, AC3, AC5', 'A year', 'from the last ride.', 110, 220, 700)}
  ${terminal(S, 'GET /api/riders/me', [
    [`after 364 days         ${ok('200')} ${dim('moved forward')}`],
    [`364 days after that    ${ok('200')}`],
    [`366 days of silence    ${ok('401')} ${dim('sign in again')}`],
    [`backend unreachable    ${ok('the screen opens')}`],
  ], S.beat(2), `${at(900, 300, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/typing-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--bone" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one calm row.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'typing-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('98 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('137 passed')}`],
    prompt('npm test'),
    [`  ${ok('1223 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('292.60 kB')} ${dim('HttpClient at start-up')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the page.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The right code signs you in, once')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Every wrong code is counted')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'A session lasts a year from its last use')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 9.2 · Verify and stay signed in' });

wipeInto('refused');
bug();

Film.start();
