// Slice 20.2 · World quality controls. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Settings' World section at 1440 px and three other widths, the section with High chosen, without
// WebGPU and without 3D, and a solo race at 1920 × 1080 whose world opened at Medium, from shots.ts. Every position is a
// pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';

// ── Act 1: the controls ───────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 20.2 · World quality controls',
  words: 'Your world,',
  accent: 'drawn your way.',
  width: 900,
  device: (S) => onBrowser(S, 'world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-159 AC2 · AC3 · AC4', 'Five levels,', 'Auto first.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('measure', 0, 0.3)), 'Auto starts at Low, the drawn look')}
    ${fact(S, 2, onBeat(S, part('measure', 0, 0.55)), 'Two slow windows drop one level')}
  </div>
  ${closeup('world-high', `${at(900, 120, 900)};${REGION}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-160 · L2-161', 'Fixed level,', 'your call.', 110, 160, 760)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'Step down: yours to turn off at a fixed level')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'Match display, or 30 fps')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'Resolution 50 to 100 %, WebGPU or WebGL 2')}
  </div>
  ${closeup('world-l', `${at(960, 200, 860)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-159 AC5 · L2-160 AC2 · AC4 · AC5', 'The world', 'follows.', 110, 160, 700)}
  ${closeup('race-medium', `${at(860, 170, 960)};aspect-ratio:16/9;object-fit:cover`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'race-world-settings.spec.ts', [
    [`  level          ${ok('medium')} ${dim('as chosen; two slow windows, still medium')}`],
    [`  frames         ${ok('≥ 32 ms apart')} ${dim('at 30 fps, offered every 16')}`],
    [`  drawing buffer ${ok('640 of 1280 px')} ${dim('at 50 %; the HUD at full')}`],
  ], part('world', 0, 0.45), `${at(110, 560, 720)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/world-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The World section,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('world-webgl2', `${at(70, 110, 860)};${REGION}`, pop(S, onBeat(S, part('proof', 0, 0.1)), { tilt: -1 }))}
  ${closeup('world-none', `${at(500, 520, 820)};${REGION}`, pop(S, onBeat(S, part('proof', 0, 0.35)), { tilt: 1 }))}
  ${title(S, 'L2-159 AC6 · L2-161 AC2 · AC4', 'Honest about', 'this browser.', 1100, 110, 760)}
  <div style="${at(1100, 470, 760)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'WebGL 2 only: Ultra needs WebGPU')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'No 3D: a notice, every World control at rest')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 20.2 · World quality controls' });

wipeInto('world');
bug();

Film.start();
