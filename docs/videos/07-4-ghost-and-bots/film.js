// Slice 7.4 · Ghost and bots. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a race on Old Town Criterium against medium bots at 5:01, and a solo race against the ghost,
// from shots.ts on the fake Bluetooth. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the bots ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 7.4 · Ghost and bots',
  words: 'Nine bots,',
  accent: 'and your ghost.',
  width: 860,
  device: (S) => onBrowser(S, 'bots-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('pack', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-067 AC1', 'A pack,', 'paced and seeded.', 110, 200, 640)}
  ${terminal(S, 'BotPaceModel · old-town-criterium:medium', [
    [`base     ${ok('130 / 190 / 250 W')}  ${dim('easy · medium · hard')}`],
    [`drift    ${ok('± 12 %')}  ${dim('each bot its own')}`],
    [`swing    ${ok('4 to 10 %')}  ${dim('every 45 to 150 s')}`],
    [`seed     ${ok('FNV-1a(map : pack)')}  ${dim('same race, same ride')}`],
  ], S.beat(2), `${at(800, 330, 1040)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('board', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-060 AC1 · AC2', 'Ten riders,', 'by place.', 110, 200, 640)}
  <div style="${at(110, 600, 640)}">
    ${fact(S, 1, onBeat(S, part('board', 0, 0.35)), 'Each bot’s gap to you, in seconds')}
    ${fact(S, 2, onBeat(S, part('board', 0, 0.62)), 'Your row current, in orange')}
  </div>
  ${closeup('board', at(1080, 70, 620), pop(S, onBeat(S, part('board', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('place', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-059 AC1 · AC5', '5th of 10,', 'gaps either side.', 110, 200, 700)}
  ${closeup('power', at(960, 180, 760), pop(S, onBeat(S, part('place', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('slide', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-060 AC3', 'Places swap,', 'rows slide.', 110, 200, 640)}
  ${terminal(S, 'the board, on the race’s tick', [
    [`5:01  ${dim('4 Pacer Moss   0:00')}`],
    [`      ${ok('5 You')}`],
    [`5:02  ${ok('4 You')}  ${dim('slides up a row over 150 ms')}`],
    [`      ${dim('5 Pacer Moss  −0:01  slides down')}`],
    [''],
    [`${dim('reduced motion: the rows move, no slide')}`],
  ], S.beat(2), `${at(800, 300, 1040)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

// ── Act 2: the ghost ─────────────────────────────────────────────────────────────────────────
Film.scene('ghost', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-060 AC4 · L2-050 AC4', 'You,', 'against your best.', 110, 160, 700)}
  <div style="${at(110, 520, 680)}">
    ${fact(S, 1, onBeat(S, part('ghost', 0, 0.3)), 'No best yet: the medium pace, 190 W')}
    ${fact(S, 2, onBeat(S, part('ghost', 0, 0.5)), 'Your best, 0:21 up the road')}
  </div>
  ${closeup('solo-board', at(900, 340, 860), pop(S, onBeat(S, part('ghost', 0, 0.1)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('behind', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-059 AC4 · AC5', 'Ahead', 'or behind.', 110, 200, 640)}
  ${closeup('solo-power', at(960, 180, 760), pop(S, onBeat(S, part('behind', 0, 0.15)), { tilt: 1.5 }))}
  </div>`);

Film.scene('offline', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-067 AC4 · L2-135 AC3', 'No network,', 'still a race.', 110, 200, 640)}
  ${terminal(S, 'the backend out of reach', [
    [`GET /api/maps        ${dim('503')}`],
    [`kept catalogue      ${ok('7 maps')}`],
    [`vs Bots, hard       ${ok('10 riders')}`],
    [`vs your best        ${ok('the ghost rides')}`],
  ], S.beat(2), `${at(800, 330, 1000)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/bots-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The board,', { accent: 'from a tablet up.' })}</h1>
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
    [`  ${ok('89 passed')}`],
    prompt('npm test'),
    [`  ${ok('361 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.48 kB')} ${dim('of 288')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Seven behaviour specs: bots, ghost, slide, offline')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The pace, the ranking and the gaps, unit tested')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 7.4 · Ghost and bots' });

wipeInto('behind');
bug();

Film.start();
