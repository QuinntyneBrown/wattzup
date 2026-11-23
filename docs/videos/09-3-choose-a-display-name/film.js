// Slice 9.3 · Choose a display name. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the display name prompt and Profile from shots.ts, with the backend answered by the shared
// fixture: the prompt at four widths, a name typed, one that breaks the rule, Profile and its dialog, desktop and phone.
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
// The prompt's panel in a 1440 × 900 shot (x 480–960, y 150–750), in a box of its shape.
const PANEL = 'aspect-ratio:480/600;object-fit:cover;object-view-box:inset(16.7% 33.3% 16.7% 33.3%)';
// The dialog in a 1440 × 900 shot (x 520–920, y 290–610), in a box of its shape.
const DIALOG = 'aspect-ratio:400/320;object-fit:cover;object-view-box:inset(32.2% 36.1% 32.2% 36.1%)';

// Profile's headline and Settings row in a 1440 × 900 shot (x 80–1360, y 50–290), in a box of its shape.
const HEADLINE = 'aspect-ratio:1280/240;object-fit:cover;object-view-box:inset(5.6% 5.6% 67.8% 5.6%)';

// ── Act 1: the prompt ────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 9.3 · Choose a display name',
  words: 'What should',
  accent: 'riders call you?',
  width: 860,
  device: (S) => onBrowser(S, 'prompt-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('prompt', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-005 AC1', 'A name first,', 'then ride.', 110, 220, 700)}
  ${closeup('ready-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('prompt', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('rule', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-005 AC2, AC4', 'Two to 24,', 'said plainly.', 110, 220, 700)}
  ${closeup('invalid-xl', `${at(1060, 90, 560)};${PANEL}`, pop(S, onBeat(S, part('rule', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('backend', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-005 AC2', 'One rule,', 'kept by the backend.', 110, 200, 560)}
  ${terminal(S, 'PUT /api/riders/me/display-name', [
    [`${esc('{ "displayName": "  Sam  " }')}      ${ok('200')} ${dim('kept as "Sam"')}`],
    [`${esc('{ "displayName": "S" }')}            ${ok('400')} ${dim('display_name_invalid')}`],
    [`${esc('{ "displayName": "<b>Sam</b>" }')}   ${ok('400')} ${dim('display_name_invalid')}`],
    [`after a refusal                  ${ok('the kept name stays')}`],
    [`without a session                ${ok('401')}`],
  ], S.beat(2), `${at(800, 420, 1020)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

// ── Act 2: Profile ───────────────────────────────────────────────────────────────────────────
Film.scene('profile', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-005 AC3', 'Your name,', 'your level.', 110, 220, 600)}
  ${closeup('profile-xl', `${at(700, 300, 1120)};${HEADLINE}`, pop(S, onBeat(S, part('profile', 0, 0.25)), { tilt: 1.5 }))}
  </div>`, { before: 0.7 });

Film.scene('dialog', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-005 AC3', 'Change it', 'from Settings.', 110, 220, 640)}
  ${closeup('dialog-xl', `${at(820, 160, 620)};${DIALOG}`, pop(S, onBeat(S, part('dialog', 0, 0.25)), { tilt: 1.5 }))}
  ${onPhone(S, 'dialog-xs', 1500, 120, 330, onBeat(S, part('dialog', 0, 0.55)), 4)}
  </div>`, { before: 0.4 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/prompt-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--bone" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one calm question.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'profile-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('126 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('146 passed')}`],
    prompt('npm test'),
    [`  ${ok('1241 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.31 kB')} ${dim('the CDK Dialog')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the page.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'No one rides without a name')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'A name that breaks the rule is never kept')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'A new name shows at once')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 9.3 · Choose a display name' });

wipeInto('dialog');
bug();

Film.start();
