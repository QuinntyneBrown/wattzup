// Slice 20.3 · Check this device. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
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

// ── Act 1: the check ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 20.3 · Check this device',
  words: 'How much',
  accent: 'can it hold?',
  width: 900,
  device: (S) => onBrowser(S, 'check-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-162 AC1 · AC2', 'Off screen,', 'level by level.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('measure', 0, 0.3)), 'Ultra with WebGPU, High with WebGL 2, then down')}
    ${fact(S, 2, onBeat(S, part('measure', 0, 0.55)), 'About 30 seconds a level, off screen')}
  </div>
  ${closeup('check-running', `${at(900, 300, 900)};${REGION}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-162 AC3 · AC4', 'Holds 60 fps.', 'Kept here.', 110, 160, 760)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'The first level that holds the display’s rate')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'Kept on this device, with when')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'A fixed level stays as chosen')}
  </div>
  ${closeup('check-done', `${at(960, 330, 860)};${REGION}`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-159 AC4 · L2-162 AC3 · AC4', 'Auto starts', 'there.', 110, 160, 700)}
  ${closeup('race-checked', `${at(860, 170, 960)};aspect-ratio:16/9;object-fit:cover`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'device-check.spec.ts', [
    [`  trials   ${ok('High 33 fps')} ${dim('then Medium holds 60')}`],
    [`  kept     ${ok('medium')} ${dim('after a reload too')}`],
    [`  race     ${ok('opens at medium')} ${dim('a fixed Low stays Low')}`],
  ], part('world', 0, 0.45), `${at(110, 560, 720)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/check-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The result,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('check-idle', `${at(70, 200, 900)};${REGION}`, pop(S, onBeat(S, part('proof', 0, 0.1)), { tilt: -1 }))}
  ${closeup('check-l', `${at(330, 470, 640)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('proof', 0, 0.35)), { tilt: 1 }))}
  ${title(S, 'L2-162 AC6', 'Stopped,', 'nothing stays.', 1100, 110, 760)}
  <div style="${at(1100, 470, 760)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Stop or a hidden tab disposes the trial')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'No frame drawn after, no result kept')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'First load back to 297 kB')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 20.3 · Check this device' });

wipeInto('world');
bug();

Film.start();
