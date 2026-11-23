// Slice 27.1 · Installable app. Six scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are the running app from shots.ts, Home after Chromium found it installable, and the manifest's icons as committed;
// the terminals hold real outputs: the manifest as it is, and the install spec and hosting tests before the change and
// after. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const line = (text) => [`<span style="color:var(--color-muted)">${esc(text)}</span>`];
const label = (S, text, x, y, w, when) => `<p class="kicker" style="${at(x, y, w)};text-align:center" ${S.rise(when)}>${esc(text)}</p>`;

const MANIFEST = [
  '{',
  '  "id": "/",',
  '  "name": "Telo Ride",',
  '  "short_name": "Telo Ride",',
  '  "start_url": "/",',
  '  "scope": "/",',
  '  "display": "standalone",',
  '  "background_color": "#0a0b0d",',
  '  "theme_color": "#0a0b0d",',
  '  "icons": [ 192x192, 512x512, 512x512 maskable … ]',
  '}',
];

// ── Act 1: the manifest ───────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 27.1 · Installable app',
  words: 'One tap',
  accent: 'from the bike.',
  width: 700,
  device: (S) => onBrowser(S, 'home-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('manifest', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-150 AC1 · manifest.webmanifest', 'Named,', 'and dressed in ink.', 110, 140, 640)}
  ${terminal(S, 'frontend/projects/ride/public', [
    prompt('cat manifest.webmanifest'),
    ...MANIFEST.map(line),
  ], onBeat(S, part('manifest', 0, 0.2)), `${at(820, 150, 990)};font-size:22px`, { every: S.BEAT * 0.4 })}
  </div>`);

Film.scene('icons', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-150 AC1 · public/icons', 'The mark,', 'at every mask.', 110, 140, 640)}
  ${closeup('icon-192', `${at(130, 560, 192)};height:auto;border-radius:24px`, pop(S, onBeat(S, part('icons', 0, 0.2)), { tilt: -3 }))}
  ${label(S, '192 px', 130, 780, 192, onBeat(S, part('icons', 0, 0.2)))}
  ${closeup('icon-512', `${at(800, 260, 440)};height:auto;border-radius:56px`, pop(S, onBeat(S, part('icons', 0, 0.35)), { tilt: -2 }))}
  ${label(S, '512 px', 800, 730, 440, onBeat(S, part('icons', 0, 0.35)))}
  ${closeup('icon-maskable-512', `${at(1360, 260, 440)};height:auto;border-radius:50%`, pop(S, onBeat(S, part('icons', 0, 0.55)), { tilt: 2 }))}
  ${label(S, '512 px maskable, in a circle', 1300, 730, 560, onBeat(S, part('icons', 0, 0.55)))}
  </div>`, { before: 0.4 });

// ── Act 2: the proof ──────────────────────────────────────────────────────────────────────────
Film.scene('check', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'install.spec.ts · HostingTests.cs', 'Chromium says:', 'installable.', 110, 140, 1100)}
  ${terminal(S, 'before, then after', [
    prompt('npx playwright test e2e/install.spec.ts'),
    ['    TypeError: Invalid URL', 'terminal__error'],
    ['    TypeError: manifest.icons is not iterable', 'terminal__error'],
    ['  2 failed', 'terminal__error'],
    prompt('npx playwright test e2e/install.spec.ts'),
    [`  ${ok('2 passed')} (11.4s)`],
    prompt('dotnet test --solution Telo.Ride.slnx -- --filter-class "*HostingTests"'),
    [`  total: 12   failed: 0   ${ok('succeeded: 12')}`],
  ], onBeat(S, part('check', 0, 0.2)), `${at(110, 450, 1700)};font-size:22px`, { every: S.BEAT * 0.45 })}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Home,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 27.1 · Installable app' });

wipeInto('check');
bug();

Film.start();
