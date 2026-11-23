// Slice 8.7 · Real-world scenery. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are solo races on Old Town Criterium from shots.ts, drawn at Low with WebGL 2 on the fake
// Bluetooth, with Google's Map Tiles API answered by the shared fixture: the offer, a refused key and the tiles
// streaming. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// The scenery panel's region of a 1440 × 900 shot (x 440–1000, y 520–760), in a box of its shape.
const PANEL = 'aspect-ratio:560/240;object-fit:cover;object-view-box:inset(57.8% 30.6% 15.5% 30.6%)';

// ── Act 1: the real place ────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.7 · Real-world scenery',
  words: 'A real place,',
  accent: 'your own key.',
  width: 860,
  device: (S) => onBrowser(S, 'offer-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('offer', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-066 AC1, AC2', 'Ride the real', 'Bruges.', 110, 200, 640)}
  ${closeup('offer-xl', `${at(820, 300, 980)};${PANEL}`, pop(S, onBeat(S, part('offer', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('key', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-066 AC3', 'Your key goes', 'to Google only.', 110, 200, 680)}
  ${terminal(S, 'where the key goes', [
    [`this device        ${ok('localStorage')}`],
    [`tile.googleapis.com ${ok('/v1/3dtiles/root.json?key=…')}`],
    [`Telo Ride backend  ${ok('never')}`],
    [`${dim('3d-tiles-renderer 0.5.4, loaded on Stream it')}`],
  ], S.beat(2), `${at(820, 320, 1000)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('refused', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-066 AC4', 'Refused?', 'The world stays.', 110, 200, 640)}
  ${closeup('refused-xl', `${at(820, 300, 980)};${PANEL}`, pop(S, onBeat(S, part('refused', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: streaming, at every width ─────────────────────────────────────────────────────────
Film.scene('streaming', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-066 AC7', 'Streaming,', 'credited.', 110, 200, 640)}
  ${closeup('streaming-xl', `${at(820, 300, 980)};${PANEL}`, pop(S, onBeat(S, part('streaming', 0, 0.3)), { tilt: 1.5 }))}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/offer-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'clear of the HUD.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'offer-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('59 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('120 passed')}`],
    prompt('npm test'),
    [`  ${ok('1195 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.47 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The key reaches Google, and nothing else')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Refused, the built-in world stays')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'A stored key waits for Stream it')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.7 · Real-world scenery' });

wipeInto('refused');
bug();

Film.start();
