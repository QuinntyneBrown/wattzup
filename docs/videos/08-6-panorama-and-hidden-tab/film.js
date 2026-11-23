// Slice 8.6 · Panorama and hidden tab. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are races on Old Town Criterium from shots.ts on the fake Bluetooth: one drawn at Low with WebGL 2,
// before and after a hidden tab, and one where neither graphics API can draw, on the map's panorama. Every position
// is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the race goes on ──────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.6 · Panorama and hidden tab',
  words: 'Whatever draws,',
  accent: 'the race goes on.',
  width: 860,
  device: (S) => onBrowser(S, 'world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('panorama', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-065 AC2', 'No 3D?', 'The panorama.', 110, 200, 640)}
  ${closeup('panorama-xl', at(820, 230, 980), pop(S, onBeat(S, part('panorama', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('hidden', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-065 AC3', 'Tab hidden,', 'nothing drawn.', 110, 200, 640)}
  ${terminal(S, 'a hidden tab, five seconds', [
    [`race clock     ${ok('5:01 → 5:06')}`],
    [`power          ${ok('carries on')}`],
    [`world frames   ${ok('0')}`],
  ], S.beat(2), `${at(820, 320, 980)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('bug', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'A change to main', 'The clock ticked,', 'the scene drew.', 110, 200, 680)}
  ${terminal(S, 'world-scene.ts', [
    [`${dim('main: the loop stopped, the inputs still drew')}`],
    [`frames drawn while hidden   ${dim('5 in 5 s')}`],
    [`+ visible = signal(!document.hidden)`],
    [`frames drawn while hidden   ${ok('0')}`],
  ], S.beat(2), `${at(820, 300, 1000)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: back, and at every width ──────────────────────────────────────────────────────────
Film.scene('back', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Shown again', 'Back,', 'and drawing.', 110, 200, 640)}
  ${closeup('back-xl', at(820, 230, 980), pop(S, onBeat(S, part('back', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/panorama-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'the race runs.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'panorama-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('114 passed')}`],
    prompt('npm test'),
    [`  ${ok('1188 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.21 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'A hidden tab draws no frame; the race runs on')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Shown again, the world draws')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.6 · Panorama and hidden tab' });

wipeInto('bug');
bug();

Film.start();
