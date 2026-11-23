// Slice 12.2 · Open class tiers. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the Class Library for a new rider (level 1), the mocks' mid rider (level 7) at four widths and
// the veteran (level 18), and Class Start for 30 Min Tempo Paceline, from shots.ts, each answered by the shared
// fixture. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The 30 min and 60 min shelves in a 1440 × 900 shot scrolled to them (x 100–1340, y 75–875).
const SHELVES = 'aspect-ratio:1240/800;object-fit:cover;object-view-box:inset(8.3% 6.94% 2.8% 6.94%)';
// The rider's level in the header (x 1190–1420, y 0–56).
const LEVEL = 'aspect-ratio:230/56;object-fit:cover;object-view-box:inset(0% 1.4% 93.8% 82.6%)';

const tier = (S, id, kicker, words, accent, shot) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, kicker, words, accent, 110, 220, 580)}
  ${closeup(`${shot}-longer-xl`, `${at(700, 150, 1110)};${SHELVES}`, pop(S, onBeat(S, part(id, 0, 0.15)), { tilt: -1 }))}
  ${closeup(`${shot}-xl`, `${at(110, 620, 420)};${LEVEL}`, pop(S, onBeat(S, part(id, 0, 0.4)), { tilt: 1 }))}
  </div>`;

// ── Act 1: three riders, three levels ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 12.2 · Open class tiers',
  words: 'Level up,',
  accent: 'ride longer.',
  width: 860,
  device: (S) => onBrowser(S, 'mid-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('level1', (S) => tier(S, 'level1', 'L2-043 AC2', 'Level 1:', 'three open.', 'new'));
Film.scene('level7', (S) => tier(S, 'level7', 'L2-043 AC3', 'Level 7:', 'Tempo opens.', 'mid'), { before: 0.4 });
Film.scene('level18', (S) => tier(S, 'level18', 'L2-044 AC1', 'Level 18:', 'one to go.', 'veteran'));

// ── Act 2: ready to ride, and every width ────────────────────────────────────────────────────
Film.scene('opened', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-082 AC4', 'Opened,', 'ready to ride.', 110, 220, 640)}
  ${onBrowser(S, 'start-tempo-xl', 860, 200, 960, onBeat(S, part('opened', 0, 0.15)), { tilt: -2 })}
  </div>`, { before: 0.4, after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/mid-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Every tier,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('322 passed')} ${dim('23 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('182 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1341 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.20 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Four tiers,', 'one level.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Only 1, 5, 10 and 20, one case per level')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Any other tier is left out, through the API')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Levels 1, 7 and 18 open the right classes')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 12.2 · Open class tiers' });

wipeInto('level18');
bug();

Film.start();
