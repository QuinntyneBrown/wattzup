// Slice 9.4 · Sign out and delete account. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Profile and sign-in from shots.ts, with the backend answered by the shared fixture: Settings with
// Sign out and Delete my account, a sign-out that failed, the delete dialog ready and failed, and sign-in after a
// deletion at four widths. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// Profile's Settings in a 1440 × 900 shot (x 960–1340, y 80–340), in a box of its shape.
const SETTINGS = 'aspect-ratio:380/260;object-fit:cover;object-view-box:inset(8.9% 6.9% 62.2% 66.7%)';
// Settings and the message under them in a 1440 × 900 shot (x 960–1340, y 80–380), in a box of its shape.
const SETTINGS_MESSAGE = 'aspect-ratio:380/300;object-fit:cover;object-view-box:inset(8.9% 6.9% 57.8% 66.7%)';
// The delete dialog in a 1440 × 900 shot (x 540–900, y 280–620), in a box of its shape.
const DIALOG = 'aspect-ratio:360/340;object-fit:cover;object-view-box:inset(31.1% 37.5% 31.1% 37.5%)';
// The sign-in panel in a 1440 × 900 shot (x 480–960, y 150–750), in a box of its shape.
const PANEL = 'aspect-ratio:480/600;object-fit:cover;object-view-box:inset(16.7% 33.3% 16.7% 33.3%)';

// ── Act 1: sign out ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 9.4 · Sign out and delete account',
  words: 'Your account,',
  accent: 'your call.',
  width: 860,
  device: (S) => onBrowser(S, 'profile-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('signout', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-006 AC1', 'Sign out,', 'at once.', 110, 220, 640)}
  ${closeup('profile-xl', `${at(900, 200, 860)};${SETTINGS}`, pop(S, onBeat(S, part('signout', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('offline', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-006 AC1', 'No connection?', 'Still signed in.', 110, 220, 700)}
  ${closeup('sign-out-failed-xl', `${at(940, 160, 800)};${SETTINGS_MESSAGE}`, pop(S, onBeat(S, part('offline', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: delete ────────────────────────────────────────────────────────────────────────────
Film.scene('dialog', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-006 AC2', 'Type delete,', 'then delete.', 110, 220, 640)}
  ${closeup('ready-xl', `${at(840, 120, 600)};${DIALOG}`, pop(S, onBeat(S, part('dialog', 0, 0.25)), { tilt: 1.5 }))}
  ${onPhone(S, 'ready-xs', 1500, 120, 330, onBeat(S, part('dialog', 0, 0.55)), 4)}
  </div>`, { before: 0.4 });

Film.scene('backend', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-006 AC3, AC4', 'Gone at once,', 'erased in a day.', 110, 200, 640)}
  ${terminal(S, 'DELETE /api/riders/me', [
    [`this device                      ${ok('204')} ${dim('cookie cleared')}`],
    [`every other session              ${ok('401')} ${dim('ended at once')}`],
    [`the same email signs in          ${ok('a new, empty account')}`],
    [`a day later                      ${ok('rider and sessions erased')}`],
    [`POST /api/auth/sign-out          ${ok('204')} ${dim('this session only')}`],
  ], S.beat(2), `${at(800, 420, 1020)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('deleted', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-006 AC3', 'Deleted,', 'and said so.', 110, 220, 560)}
  ${closeup('deleted-xl', `${at(720, 110, 520)};${PANEL}`, pop(S, onBeat(S, part('deleted', 0, 0.25)), { tilt: 1.5 }))}
  ${closeup('delete-failed-xl', `${at(1300, 300, 500)};${DIALOG}`, pop(S, onBeat(S, part('deleted', 0, 0.6)), { tilt: -2 }))}
  </div>`, { before: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/deleted-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--bone" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one calm goodbye.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'dialog-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('133 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('152 passed')}`],
    prompt('npm test'),
    [`  ${ok('1291 passed')} ${dim('now with the app\'s own specs')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.12 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the page.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Sign-out ends one session at once')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Deletion ends every session and frees the email')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Erasure follows within a day')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 9.4 · Sign out and delete account' });

wipeInto('dialog');
bug();

Film.start();
