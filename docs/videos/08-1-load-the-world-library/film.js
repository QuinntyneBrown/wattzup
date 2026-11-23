// Slice 8.1 · Load the world library. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are races on Old Town Criterium from shots.ts, on the fake Bluetooth and a browser without WebGPU:
// the world started and tagged WebGL 2, the panorama alone, and Race Setup after leaving. Every position is a pure
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

// ── Act 1: a world in its own chunk ──────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.1 · Load the world library',
  words: 'Behind every race,',
  accent: 'a world.',
  width: 860,
  device: (S) => onBrowser(S, 'world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('chunk', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0020 · ADR 0030', 'Its own chunk,', 'loaded last.', 110, 160, 700)}
  ${terminal(S, 'ng build ride', [
    [`Initial total    ${ok('288.10 kB')} ${dim('no Three.js')}`],
    [`race-page        ${dim('14.57 kB')}`],
    [`world library    ${dim('imported when a race opens')}`],
    [`world-renderer   ${ok('829.36 kB')} ${dim('three.webgpu, TSL')}`],
  ], S.beat(2), `${at(820, 360, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('tag', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-065 AC1', 'WebGPU,', 'or WebGL 2.', 110, 160, 700)}
  <div style="${at(110, 520, 680)}">
    ${fact(S, 1, onBeat(S, part('tag', 0, 0.3)), 'One WebGPURenderer chooses its backend')}
    ${fact(S, 2, onBeat(S, part('tag', 0, 0.5)), 'Title: The GPU API drawing this world')}
  </div>
  ${closeup('tag-m', at(820, 250, 1000), pop(S, onBeat(S, part('tag', 0, 0.1)), { tilt: -1.5 }))}
  ${onBrowser(S, 'world-xl', 1000, 520, 760, onBeat(S, part('tag', 0, 0.2)), { tilt: 1.5 })}
  </div>`, { before: 0.4 });

Film.scene('panorama', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-065 AC2', 'Neither?', 'The panorama.', 110, 200, 660)}
  ${onBrowser(S, 'panorama-xl', 820, 220, 980, onBeat(S, part('panorama', 0, 0.1)), { tilt: 1.5 })}
  </div>`, { before: 0.4 });

// ── Act 2: release it, and where it comes from ───────────────────────────────────────────────
Film.scene('leave', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'AGENTS.md · release everything', 'Leave,', 'and it goes.', 110, 160, 700)}
  ${terminal(S, 'the world scene, destroyed', [
    [`frame loop        ${ok('stopped')}`],
    [`ResizeObserver    ${ok('disconnected')}`],
    [`listeners         ${ok('removed')}`],
    [`renderer          ${ok('dispose()')}`],
  ], S.beat(2), `${at(110, 520, 680)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${onBrowser(S, 'left-xl', 860, 220, 940, onBeat(S, part('leave', 0, 0.1)), { tilt: -1.5 })}
  </div>`);

Film.scene('main', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'World rendering comes from main', 'Copied,', 'not rebuilt.', 110, 200, 640)}
  ${terminal(S, 'frontend/projects/world/src', [
    [`frame-scheduler.ts   ${dim('the only rAF caller')}`],
    [`frame-period.ts      ${dim('the display, measured')}`],
    [`world-scene.ts       ${dim('the canvas host')}`],
    [`world-renderer.ts    ${dim('WebGPU or WebGL 2')}`],
    [`api: WorldRenderer   ${ok('contract and token')}`],
  ], S.beat(2), `${at(820, 300, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/world-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one world.' })}</h1>
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
    [`  ${ok('103 passed')}`],
    prompt('npm test'),
    [`  ${ok('669 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.10 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Three specs: the tag, the panorama, leaving')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), "main's unit tests, plus start and dispose")}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.1 · Load the world library' });

wipeInto('panorama');
bug();

Film.start();
