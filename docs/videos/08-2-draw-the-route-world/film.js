// Slice 8.2 · Draw the route world. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are solo races from shots.ts, on the fake Bluetooth and a browser without WebGPU, with main's world
// drawn behind the HUD: Old Town Criterium three seconds apart, and four more maps' worlds. Every position is a pure
// function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the world, moving ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.2 · Draw the route world',
  words: 'Road, terrain,',
  accent: 'and sky.',
  width: 860,
  device: (S) => onBrowser(S, 'world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('road', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-064 AC1', 'Your place,', 'your speed.', 110, 140, 700)}
  <div style="${at(110, 500, 640)}">
    ${fact(S, 1, onBeat(S, part('road', 0, 0.3)), 'The camera at your distance on the route')}
    ${fact(S, 2, onBeat(S, part('road', 0, 0.5)), 'Moving at the virtual speed, 23.9 km/h')}
  </div>
  ${onBrowser(S, 'world-xl', 800, 150, 560, onBeat(S, part('road', 0, 0.1)), { tilt: -1.5 })}
  ${onBrowser(S, 'later-xl', 1180, 520, 600, onBeat(S, part('road', 0, 0.35)), { tilt: 1.5 })}
  </div>`);

Film.scene('worlds', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Each map,', { accent: 'its own world.' })}</h1>
  ${closeup('neon-docklands-xl', at(270, 185, 660), pop(S, onBeat(S, part('worlds', 0, 0.1)), { tilt: -1.5 }))}
  ${closeup('vice-city-xl', at(990, 185, 660), pop(S, onBeat(S, part('worlds', 0, 0.25)), { tilt: 1.5 }))}
  ${closeup('prairie-paceline-xl', at(270, 625, 660), pop(S, onBeat(S, part('worlds', 0, 0.4)), { tilt: 1 }))}
  ${closeup('dolomites-xl', at(990, 625, 660), pop(S, onBeat(S, part('worlds', 0, 0.55)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('pause', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-068 AC1', 'Paused,', 'held still.', 110, 200, 640)}
  ${terminal(S, 'two pictures of the paused world', [
    [`pause at 0:03           ${dim('the loop stops')}`],
    [`one second later        ${dim('no frame drawn')}`],
    [`picture == picture      ${ok('true')}`],
  ], S.beat(2), `${at(820, 360, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: from main, at every width ─────────────────────────────────────────────────────────
Film.scene('main', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'World rendering comes from main', 'Copied,', 'not rebuilt.', 110, 200, 640)}
  ${terminal(S, 'frontend/projects/world/src', [
    [`world-renderer.ts      ${dim("main's renderer, whole")}`],
    [`scene-road, scene-bend ${dim('the road and its bends')}`],
    [`world-kit, streets     ${dim('the shared kit')}`],
    [`world-&lt;id&gt;.ts × 84     ${dim('a module for each world')}`],
    [`world-renderer chunk   ${ok('2.68 MB, loaded with a race')}`],
  ], S.beat(2), `${at(820, 300, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/world-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'never stretched.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'world-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('105 passed')}`],
    prompt('npm test'),
    [`  ${ok('1183 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.21 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'The world moves as you ride, holds when paused')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), "main's road, kit and world specs, green here")}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.2 · Draw the route world' });

wipeInto('pause');
bug();

Film.start();
