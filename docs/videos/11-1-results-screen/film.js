// Slice 11.1 · Results screen. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Results for a bots race 2nd and 6th of 10, a solo race and a solo class, from shots.ts, each
// result set in the navigation's state as the ride leaves it. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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
// The lead, the place or time and the line under it in a 1440 × 900 shot (x 100–460, y 80–290).
const RESULT = 'aspect-ratio:360/210;object-fit:cover;object-view-box:inset(8.9% 68.06% 67.8% 6.94%)';
// The first three rows of the standings in a 1440 × 900 shot (x 100–800, y 300–440).
const TOP3 = 'aspect-ratio:700/140;object-fit:cover;object-view-box:inset(33.3% 44.44% 51.1% 6.94%)';
// The actions in a 1440 × 900 shot of the bots race (x 920–1360, y 630–760).
const ACTIONS = 'aspect-ratio:440/130;object-fit:cover;object-view-box:inset(70% 5.56% 15.6% 63.89%)';

// ── Act 1: the place ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 11.1 · Results screen',
  words: 'Cross the line,',
  accent: 'see where you finished.',
  width: 860,
  device: (S) => onBrowser(S, 'podium-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('place', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-073 AC1, AC3', '2nd of 10,', 'on the podium.', 110, 200, 620)}
  ${closeup('podium-xl', `${at(110, 520, 540)};${RESULT}`, pop(S, onBeat(S, part('place', 0, 0.2)), { tilt: -1 }))}
  ${closeup('podium-xl', `${at(760, 300, 1040)};${TOP3}`, pop(S, onBeat(S, part('place', 0, 0.45)), { tilt: 1 }))}
  ${onPhone(S, 'podium-xs', 1500, 560, 260, onBeat(S, part('place', 0, 0.65)), -3)}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/podium-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One column,', { accent: 'then two from 1024.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.4 });

Film.scene('off', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-073 AC2', '6th,', '18 s off the podium.', 110, 220, 640)}
  ${onBrowser(S, 'sixth-xl', 860, 260, 940, S.beat(2), { tilt: -2 })}
  </div>`, { before: 0.4 });

// ── Act 2: the other rides, and what next ────────────────────────────────────────────────────
Film.scene('solo', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-073 · L2-078 AC1', 'Your time,', 'or your class.', 110, 200, 600)}
  ${closeup('solo-xl', `${at(800, 180, 480)};${RESULT}`, pop(S, onBeat(S, part('solo', 0, 0.2)), { tilt: -1 }))}
  ${closeup('class-xl', `${at(1320, 420, 480)};${RESULT}`, pop(S, onBeat(S, part('solo', 0, 0.5)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

Film.scene('next', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-079 AC1', 'Done,', 'or again.', 110, 220, 600)}
  ${closeup('podium-xl', `${at(820, 220, 760)};${ACTIONS}`, pop(S, onBeat(S, part('next', 0, 0.15)), { tilt: -1 }))}
  ${terminal(S, 'where each one goes', [
    [`Done            ${ok('/')}`],
    [`Race it again   ${ok('/race/old-town-criterium?mode=bots&pack=medium')}`],
    [`Ride it again   ${ok('/classes/hiit-cardio-30')}`],
  ], onBeat(S, part('next', 0, 0.4)), `${at(820, 560, 1000)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${zoomIn(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('167 passed')} ${dim('6 new')}`],
    prompt('npm test'),
    [`  ${ok('1318 passed')} ${dim('7 new')}`],
    prompt('dotnet test'),
    [`  ${ok('257 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.17 kB')} ${dim('results 6.5 kB lazy')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Real rides,', 'every line.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'A raced map and a ridden class end on Results')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Each line of the view, one case per test')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Done, Race it again with its mode and pack, Ride it again')}
  </div>
  </div>`, { before: 0.7 });

closing('close', { kicker: 'Slice 11.1 · Results screen' });

wipeInto('off');
bug();

Film.start();
