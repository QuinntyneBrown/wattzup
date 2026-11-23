// Slice 8.4 · Quality levels. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are one solo race on Old Town Criterium from shots.ts, on the fake Bluetooth and a browser without
// WebGPU, drawn at Low, Medium and High, and asked for at Ultra, which draws at High with WebGL 2. Every position is a
// pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: four levels ───────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.4 · Quality levels',
  words: 'One world,',
  accent: 'four levels.',
  width: 860,
  device: (S) => onBrowser(S, 'high-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('low', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-065 AC5', 'Every race', 'opens at Low.', 110, 140, 700)}
  <div style="${at(110, 500, 640)}">
    ${fact(S, 1, onBeat(S, part('low', 0, 0.3)), 'The drawn look: toon shading, ink, a flat sky')}
    ${fact(S, 2, onBeat(S, part('low', 0, 0.5)), 'Never starts high and drops in front of you')}
  </div>
  ${closeup('low-xl', at(800, 200, 1040), pop(S, onBeat(S, part('low', 0, 0.1)), { tilt: -1.5 }))}
  </div>`);

Film.scene('levels', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Medium, then', { accent: 'High.' })}</h1>
  ${closeup('medium-xl', at(110, 230, 820), pop(S, onBeat(S, part('levels', 0, 0.1)), { tilt: -1.5 }))}
  ${closeup('high-xl', at(990, 230, 820), pop(S, onBeat(S, part('levels', 0, 0.45)), { tilt: 1.5 }))}
  <div style="${at(110, 790, 820)}">${fact(S, 1, onBeat(S, part('levels', 0, 0.2)), 'Materials and shadows')}</div>
  <div style="${at(990, 790, 820)}">${fact(S, 2, onBeat(S, part('levels', 0, 0.55)), 'Reflections, ambient occlusion, TAA')}</div>
  </div>`, { before: 0.4 });

Film.scene('cap', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-065 AC4', 'Ultra needs', 'WebGPU.', 110, 200, 640)}
  ${terminal(S, 'asked for at Ultra, with WebGL 2', [
    [`backend       ${dim('webgl2')}`],
    [`asked for     ${dim('ultra')}`],
    [`drawn at      ${ok('high')}`],
  ], S.beat(2), `${at(820, 200, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('ultra-xl', at(820, 470, 800), pop(S, onBeat(S, part('cap', 0, 0.45)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: main's levels, at every width ─────────────────────────────────────────────────────
Film.scene('main', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'World rendering comes from main', "main's table,", 'main’s start.', 110, 200, 640)}
  ${terminal(S, 'render-quality.ts', [
    [`TECHNIQUES        ${dim('54 rows, each from a level')}`],
    [`techniquesAt()    ${dim('webgl2 caps at high')}`],
    [`startTier()       ${ok("'low' on both backends")}`],
    [`L2-159 Auto       ${dim('starts at Low, or the check')}`],
  ], S.beat(2), `${at(820, 320, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/low-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'the drawn look.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'low-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('110 passed')}`],
    prompt('npm test'),
    [`  ${ok('1186 passed')}`],
    prompt('break the WebGL 2 cap'),
    [`  ${dim('expected "high", received "ultra"')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Each level draws its own techniques')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Ultra on WebGL 2 draws at High')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.4 · Quality levels' });

wipeInto('cap');
bug();

Film.start();
