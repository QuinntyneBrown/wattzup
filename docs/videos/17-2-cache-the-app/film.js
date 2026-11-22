// Slice 17.2 · Cache the app. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are a solo race on Prairie Paceline started with no network once the app had been opened, at 1440 px and three other
// widths, its board close up, and Map Select opened again offline with its covers, from shots.ts. Every position is a
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

// ── Act 1: kept on the device, started offline, covers kept ───────────────────────────────────
opening('hook', {
  kicker: 'Slice 17.2 · Cache the app',
  words: 'No network?',
  accent: 'Still riding.',
  width: 900,
  device: (S) => onBrowser(S, 'offline-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('cached', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC3', 'Opened once,', 'kept on the device.', 110, 160, 900)}
  ${terminal(S, 'the service worker’s caches, as the spec saw them', [
    [`  app       ${ok('at once')}  ${dim('index.html, styles, every chunk, fonts')}`],
    [`  assets    ${ok('first use')} ${dim('map covers, bike photo, worlds')}`],
    [`  progress  ${ok('last answer')} ${dim('GET /api/progress')}`],
    [`  ${dim('never: world music, 200 MB')}`],
  ], 0.2, `${at(110, 560, 1100)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('covers-row', `${at(1260, 250, 560)};${REGION}`, pop(S, onBeat(S, part('cached', 0, 0.5)), { tilt: 2 }))}
  </div>`);

Film.scene('offline', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-135 AC3', 'Offline,', 'a solo race starts.', 110, 160, 820)}
  ${terminal(S, 'no network, as the spec saw it', [
    prompt('open /race/prairie-paceline/ride'),
    [`  page, chunks  ${ok('app cache')}`],
    [`  maps          ${ok('kept catalogue')}`],
    [`  progress      ${ok('last answer')}`],
  ], 0.2, `${at(110, 560, 820)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('offline-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('offline', 0, 0.15)), { tilt: -1 }))}
  ${closeup('offline-board', `${at(1180, 560, 560)};${REGION}`, pop(S, onBeat(S, part('offline', 0, 0.4)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('covers', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC3', 'Seen once,', 'shown offline.', 110, 160, 860)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('covers', 0, 0.2)), 'Map Select opens again offline')}
    ${fact(S, 2, onBeat(S, part('covers', 0, 0.4)), 'Its covers come from the app cache')}
    ${fact(S, 3, onBeat(S, part('covers', 0, 0.6)), 'A map photo seen once returns in a race')}
  </div>
  ${closeup('covers-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('covers', 0, 0.1)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

Film.scene('light', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'ADR 0032', 'Registered late,', 'kept light.', 110, 160, 900)}
  <div style="${at(110, 560, 820)}">
    ${fact(S, 1, onBeat(S, part('light', 0, 0.2)), 'From the first screen’s lazy chunk')}
    ${fact(S, 2, onBeat(S, part('light', 0, 0.4)), 'Main grows 40 bytes, not 6.3 kB')}
    ${fact(S, 3, onBeat(S, part('light', 0, 0.6)), 'World downloads go past it, with progress')}
  </div>
  ${terminal(S, 'the first bundle', [
    prompt('ng build ride'),
    [`  provideServiceWorker  ${dim('main 283.72 kB')}`],
    [`  provideAppCache       ${ok('main 277.45 kB')}`],
  ], 0.3, `${at(1000, 330, 800)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/offline-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Offline,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('457 passed')} ${dim('2 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('268 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1578 passed')} ${dim('6 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.45 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Opened once,', 'rides offline.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The app opens again with no network')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'A solo race starts from the cache')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'A cover seen once still shows')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 17.2 · Cache the app' });

wipeInto('covers');
bug();

Film.start();
