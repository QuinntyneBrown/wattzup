// Slice 8.5 · Step down when frames drop. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are one solo race on Old Town Criterium from shots.ts, opened at High and judged as a rider's ride
// is, on the fake Bluetooth and a browser without WebGPU: at High, after slow frames at Medium, and after very slow
// frames at Low. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: detail gives way ──────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 8.5 · Step down when frames drop',
  words: 'Detail gives way,',
  accent: 'the ride never.',
  width: 860,
  device: (S) => onBrowser(S, 'high-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('period', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Before the first frame', 'Your display,', 'measured.', 110, 160, 700)}
  ${terminal(S, 'measureFramePeriod()', [
    [`30 frame intervals     ${dim('the first left out')}`],
    [`median                 ${dim('16.6 ms')}`],
    [`snapped to             ${ok('60 Hz, P = 16.7 ms')}`],
  ], S.beat(2), `${at(820, 380, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('windows', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Two slow windows,', { accent: 'one level.' })}</h1>
  ${closeup('high-xl', at(110, 230, 820), pop(S, onBeat(S, part('windows', 0, 0.1)), { tilt: -1.5 }))}
  ${closeup('medium-xl', at(990, 230, 820), pop(S, onBeat(S, part('windows', 0, 0.45)), { tilt: 1.5 }))}
  <div style="${at(110, 790, 820)}">${fact(S, 1, onBeat(S, part('windows', 0, 0.2)), 'High, frames at 16.7 ms')}</div>
  <div style="${at(990, 790, 820)}">${fact(S, 2, onBeat(S, part('windows', 0, 0.55)), 'Medium, after two windows at 25 ms')}</div>
  </div>`, { before: 0.4 });

Film.scene('far', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-159 AC4', 'Far too slow?', 'Straight to Low.', 110, 200, 640)}
  ${terminal(S, 'FrameBudget, P = 16.7 ms', [
    [`median 18 ms   ${dim('keep')}`],
    [`median 25 ms   ${ok('drop one level')}`],
    [`median 60 ms   ${ok('drop to low')}`],
  ], S.beat(2), `${at(820, 200, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('low-xl', at(820, 470, 800), pop(S, onBeat(S, part('far', 0, 0.45)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: main's budget, at every width ─────────────────────────────────────────────────────
Film.scene('main', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'World rendering comes from main', 'Down,', 'never up.', 110, 200, 640)}
  ${terminal(S, 'render-quality.ts · FrameBudget', [
    [`window           ${dim('2 s, its median frame')}`],
    [`slow             ${dim('over 1.2 x P')}`],
    [`far              ${dim('3 x P: straight to low')}`],
    [`raise            ${ok('never, during the race')}`],
  ], S.beat(2), `${at(820, 320, 980)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/low-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'still smooth.' })}</h1>
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
    [`  ${ok('112 passed')}`],
    prompt('npm test'),
    [`  ${ok('1187 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('288.21 kB')} ${dim('of 292')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Slow frames drop a level, very slow to Low')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Fast frames never raise it back')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 8.5 · Step down when frames drop' });

wipeInto('far');
bug();

Film.start();
