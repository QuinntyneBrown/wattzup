// Slice 16.2 · Build shaders and warm up. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are World loading for 30 Minute HIIT Cardio over Old Town Criterium: its programs building in batches,
// ready with the frame rate the warm-up held, and slow after 20 seconds with Start at Low quality and Ride with the
// panorama, at 1440 px and three other widths, then the class ride on the panorama, from shots.ts. Every position is
// a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: built, warm, or a way out ──────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 16.2 · Build shaders and warm up',
  words: 'Every shader counted,',
  accent: 'every frame warm.',
  width: 900,
  device: (S) => onBrowser(S, 'ready-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('build', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-152 AC4', 'Built in batches,', 'each one counted.', 110, 160, 780)}
  ${terminal(S, 'the build, as the probe saw it', [
    prompt('compileAsync(scene, camera) → the scene pass'),
    [`  ${ok('1 of 143')} … ${ok('41 of 143')} … ${ok('143 of 143')}`],
    [`  programs built  ${ok('68')}`],
    [`  warm-up adds    ${ok('4')} ${dim('its passes, nothing twice')}`],
  ], 0.2, `${at(110, 560, 800)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('building-xl', `${at(960, 200, 860)};${PAGE}`, pop(S, onBeat(S, part('build', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('warm', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-152 AC5, AC7', 'Warmed up,', 'frame rate held.', 110, 160, 820)}
  <div style="${at(110, 580, 780)}">
    ${fact(S, 1, onBeat(S, part('warm', 0, 0.2)), 'Auto quality · Low')}
    ${fact(S, 2, onBeat(S, part('warm', 0, 0.4)), "main's warm-up, timed frame by frame")}
    ${fact(S, 3, onBeat(S, part('warm', 0, 0.6)), 'Holding the frame rate at Low')}
  </div>
  ${closeup('ready-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('warm', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('slow', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-155 AC1, AC2', 'Twenty seconds?', 'It says so.', 110, 160, 800)}
  ${terminal(S, 'the slow load, as the spec saw it', [
    prompt('clock.fastForward(20_000)'),
    [`  ${ok('This is taking longer than usual.')}`],
    [`  status  ${ok('Still downloading the world, 0 percent.')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('slow-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('slow', 0, 0.1)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('choices', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-155 AC3, AC4, L2-156 AC3', 'Low, the panorama,', 'or keep waiting.', 110, 160, 820)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('choices', 0, 0.25)), 'Start at Low quality, for this ride')}
    ${fact(S, 2, onBeat(S, part('choices', 0, 0.45)), 'Ride with the panorama')}
    ${fact(S, 3, onBeat(S, part('choices', 0, 0.65)), 'A failed build steps down a level')}
  </div>
  ${closeup('slow-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('choices', 0, 0.1)), { tilt: 1 }))}
  ${closeup('ride-xl', `${at(1080, 540, 700)};${PAGE}`, pop(S, onBeat(S, part('choices', 0, 0.55)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/slow-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'A way out,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('256 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1533 passed')} ${dim('16 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Built, warm,', 'or a way out.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Programs counted, frame rate held')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Slow after 20 seconds, with Low')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'The panorama stops the load')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 16.2 · Build shaders and warm up' });

wipeInto('slow');
bug();

Film.start();
