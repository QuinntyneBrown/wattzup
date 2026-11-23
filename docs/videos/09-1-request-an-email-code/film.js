// Slice 9.1 · Request an email code. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the sign-in and code screens from shots.ts, with the backend answered by the shared fixture:
// sign-in at four widths, sending, an address that is not one, too many codes, the countdown and a new code sent.
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

// ── Act 1: asking for a code ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 9.1 · Request an email code',
  words: 'One email,',
  accent: 'one code.',
  width: 860,
  device: (S) => onBrowser(S, 'sign-in-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('send', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-001 AC2', 'Send my code,', 'then wait.', 110, 220, 700)}
  ${closeup('sending-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('send', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('invalid', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-001 AC3', 'Not an address?', 'Nothing is sent.', 110, 220, 700)}
  ${closeup('invalid-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('invalid', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('code', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-002 AC1 · L2-003 AC1', 'Check your email,', 'thirty seconds.', 110, 220, 700)}
  ${closeup('code-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('code', 0, 0.3)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the backend and its limits ────────────────────────────────────────────────────────
Film.scene('backend', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-001 AC4, AC6 · ADR 0031', 'The same answer', 'for everyone.', 110, 200, 640)}
  ${terminal(S, 'POST /api/auth/code', [
    [`{ "email": " Ada.Rider@Example.COM " }`],
    [`kept as      ${ok('Ada.Rider@example.com')}`],
    [`code         ${ok('six digits, HMAC-SHA256 only')}`],
    [`sent by      ${ok('SMTP · MailKit')}`],
    [`answer       ${ok('202')} ${dim('account or not')}`],
  ], S.beat(2), `${at(800, 300, 1020)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

Film.scene('limited', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-003 AC4, AC5', 'Too many?', 'Come back later.', 110, 220, 700)}
  ${terminal(S, 'refused with 429', [
    [`6th for an address   ${ok('rate_limited')}`],
    [`21st for a network   ${ok('rate_limited')}`],
    [`again inside 30 s    ${ok('resend_too_soon')}`],
    [`${dim('Retry-After: 2501')}`],
  ], S.beat(2), `${at(110, 560, 700)};font-size:20px`, { every: S.BEAT * 0.5 })}
  ${closeup('limited-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('limited', 0, 0.45)), { tilt: -1.5 }))}
  </div>`, { before: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/sign-in-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one calm panel.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'sign-in-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('81 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('128 passed')}`],
    prompt('npm test'),
    [`  ${ok('1214 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.47 kB')} ${dim('unchanged')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the page.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The code goes to the address, normalised')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'A bad address sends nothing')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Every limit says when to come back')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 9.1 · Request an email code' });

wipeInto('code');
bug();

Film.start();
