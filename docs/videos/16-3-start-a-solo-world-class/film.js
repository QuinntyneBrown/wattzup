// Slice 16.3 · Start a solo world class. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are World loading for 30 Minute HIIT Cardio over Old Town Criterium, ready with no bike and then with the
// bike connected, the class ride in its world with the video in the corner at 1440 px and three other widths, and the
// class ride on the panorama without its video, from shots.ts. Every position is a pure function of the scene's time
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

// ── Act 1: the bike, the start, the world ─────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 16.3 · Start a solo world class',
  words: 'Press Start riding,',
  accent: 'the world fades in.',
  width: 900,
  device: (S) => onBrowser(S, 'world-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('gate', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-157 AC1, AC2', 'No bike?', 'The world keeps loading.', 110, 160, 800)}
  ${terminal(S, 'World loading, as the spec saw it', [
    [`  facts   ${ok('No bike')}`],
    [`  alert   ${ok('Your bike isn’t connected.')}`],
    [`  action  ${ok('Connect bike')} ${dim('tries the bike in place')}`],
    [`  Start riding  ${dim('disabled')}`],
  ], 0.2, `${at(110, 580, 820)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('nobike-xl', `${at(960, 200, 860)};${PAGE}`, pop(S, onBeat(S, part('gate', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('start', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-153 AC2, L2-157 AC3', 'Ready and connected,', 'Start riding.', 110, 160, 820)}
  <div style="${at(110, 580, 780)}">
    ${fact(S, 1, onBeat(S, part('start', 0, 0.2)), 'The world is ready')}
    ${fact(S, 2, onBeat(S, part('start', 0, 0.4)), 'The bike is connected')}
    ${fact(S, 3, onBeat(S, part('start', 0, 0.6)), 'Start riding turns on and takes focus')}
  </div>
  ${closeup('ready-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('start', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('handover', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-153 AC3, AC5', 'Warmed once,', 'ridden at once.', 110, 160, 800)}
  ${terminal(S, 'Start riding, as the spec saw it', [
    prompt('Start riding'),
    [`  graphics contexts  ${ok('unchanged')} ${dim('no second renderer')}`],
    [`  canvas  ${ok('opacity 0 → 1')} ${dim('over 200 ms')}`],
    [`  first command  ${ok('target resistance 8')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('world-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('handover', 0, 0.1)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('music', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-153 AC3, L2-163 AC1', 'The video in the corner,', 'or the world’s track.', 110, 160, 860)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('music', 0, 0.25)), 'The video plays with its own sound')}
    ${fact(S, 2, onBeat(S, part('music', 0, 0.45)), 'No video: music/oldtown.ogg plays')}
    ${fact(S, 3, onBeat(S, part('music', 0, 0.65)), 'Leaving stops it and lets it go')}
  </div>
  ${closeup('world-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('music', 0, 0.1)), { tilt: 1 }))}
  ${closeup('novideo-xl', `${at(1080, 540, 700)};${PAGE}`, pop(S, onBeat(S, part('music', 0, 0.55)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/world-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'In its world,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('260 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1556 passed')} ${dim('23 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One renderer,', 'faded in.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Start riding waits for the bike')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The warm world, with no second context')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'The world’s track when the video can’t play')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 16.3 · Start a solo world class' });

wipeInto('handover');
bug();

Film.start();
