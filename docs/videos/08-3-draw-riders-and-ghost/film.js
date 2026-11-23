// Slice 8.3 · Draw riders and ghost. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are races from shots.ts, on the fake Bluetooth and a browser without WebGPU, with main's world and
// the race's riders drawn behind the HUD: the nine bots on Old Town Criterium and in Neon Docklands, and the ghost of a
// solo race. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the field, in the world ───────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.3 · Draw riders and ghost',
  words: 'Everyone you race,',
  accent: 'on the road.',
  width: 860,
  device: (S) => onBrowser(S, 'bots-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('bots', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-064 AC3', 'Nine bots,', 'nine jerseys.', 110, 140, 700)}
  <div style="${at(110, 500, 640)}">
    ${fact(S, 1, onBeat(S, part('bots', 0, 0.3)), 'Each in its --jersey colour')}
    ${fact(S, 2, onBeat(S, part('bots', 0, 0.5)), 'The same colour as its dot on the board')}
  </div>
  ${closeup('bots-xl', at(800, 200, 1040), pop(S, onBeat(S, part('bots', 0, 0.1)), { tilt: -1.5 }))}
  </div>`);

Film.scene('ghost', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-064 AC3', 'Your best,', 'in gold.', 110, 160, 640)}
  <div style="${at(110, 520, 600)}">
    ${fact(S, 1, onBeat(S, part('ghost', 0, 0.35)), 'Translucent: the road shows through')}
    ${fact(S, 2, onBeat(S, part('ghost', 0, 0.55)), 'Beside you, on its own line')}
  </div>
  ${onBrowser(S, 'ghost-xl', 780, 190, 1060, onBeat(S, part('ghost', 0, 0.1)), { tilt: 1.5 })}
  </div>`, { before: 0.4 });

Film.scene('places', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'At their places', 'A line', 'each.', 110, 200, 640)}
  ${closeup('docklands-xl', at(780, 180, 1040), pop(S, onBeat(S, part('places', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: from main, at every width ─────────────────────────────────────────────────────────
Film.scene('main', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'World rendering comes from main', 'One kit,', 'every rider.', 110, 200, 640)}
  ${terminal(S, 'frontend/projects/world/src', [
    [`world-cyclist.ts     ${dim("main's rider and bike")}`],
    [`race-riders.ts       ${dim('a line each, 4 m behind to ahead')}`],
    [`--jersey-nova … echo ${dim("the design system's colours")}`],
    [`ghost                ${ok('new: translucent gold, 0.45')}`],
  ], S.beat(2), `${at(820, 320, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/bots-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'the field ahead.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'bots-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('107 passed')}`],
    prompt('npm test'),
    [`  ${ok('1186 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.21 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'The bots drawn in their jersey colours, in order')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The ghost gold, and see-through')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.3 · Draw riders and ghost' });

wipeInto('places');
bug();

Film.start();
