// Slice 16.1 · Download the world. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are World loading for 30 Minute HIIT Cardio over Old Town Criterium: downloading, ready once main's renderer
// has built the world, stopped part way, ready as a panorama without 3D, and the class ride after Start riding, at
// 1440 px and three other widths, from shots.ts. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: the world gets ready ───────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 16.1 · Download the world',
  words: 'Your world,',
  accent: 'ready before you ride.',
  width: 900,
  device: (S) => onBrowser(S, 'ready-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('download', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-152 AC2, AC3', 'Downloaded once,', 'kept on the device.', 110, 160, 780)}
  ${terminal(S, 'the download, as the tests saw it', [
    prompt('GET /worlds/oldtown/panorama.webp'),
    [`  ${ok('0.1 of 0.2 MB')} ${dim('as the bytes arrive')}`],
    [`  ${ok('0.2 MB')} · saved on this device for next time`],
    [`  next load → ${ok('done at once')}, no request`],
  ], 0.2, `${at(110, 560, 780)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('downloading-xl', `${at(960, 200, 860)};${PAGE}`, pop(S, onBeat(S, part('download', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('build', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-152 AC1, L2-153 AC2', 'Shaders built,', 'first frames warm.', 110, 160, 820)}
  <div style="${at(110, 580, 780)}">
    ${fact(S, 1, onBeat(S, part('build', 0, 0.2)), 'Download the world')}
    ${fact(S, 2, onBeat(S, part('build', 0, 0.4)), "Build the shaders: main's renderer")}
    ${fact(S, 3, onBeat(S, part('build', 0, 0.6)), 'Warm up the first frames')}
  </div>
  ${closeup('ready-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('build', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('stopped', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-156 AC1, AC2', 'Stopped?', 'Pick up where it left off.', 110, 160, 800)}
  ${terminal(S, 'Try again, as the spec saw it', [
    [`  first answer ${dim('cut off')} → Stopped at ${ok('0.1 of 0.2 MB')}`],
    prompt('Try again'),
    [`  Range: ${ok('bytes=101979-')} → 206, the rest`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('stopped-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('stopped', 0, 0.1)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('panorama', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-156 AC4', 'No 3D here?', 'Ride the panorama.', 110, 160, 800)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, onBeat(S, part('panorama', 0, 0.25)), 'Download the panorama')}
    ${fact(S, 2, onBeat(S, part('panorama', 0, 0.45)), 'Shaders and warm-up: not needed')}
    ${fact(S, 3, onBeat(S, part('panorama', 0, 0.65)), 'The plan, clock and bike work the same')}
  </div>
  ${closeup('panorama-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('panorama', 0, 0.1)), { tilt: 1 }))}
  ${closeup('ride-xl', `${at(1080, 540, 700)};${PAGE}`, pop(S, onBeat(S, part('panorama', 0, 0.6)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/ready-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Ready,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('253 passed')} ${dim('5 new')}`],
    prompt('npm test'),
    [`  ${ok('1517 passed')} ${dim('50 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'The world', 'is ready first.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Downloads with its bytes, and is saved')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Resumes from the bytes received')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'The ride waits for Start riding')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 16.1 · Download the world' });

wipeInto('stopped');
bug();

Film.start();
