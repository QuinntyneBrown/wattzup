// Slice 13.2 · Choose the next ride. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home for the mid rider at 1440 px and three other widths, the Next ride card for the mid rider, a
// new rider and a level goal, the Race and Classes doors, and the unlocked banner, from shots.ts, each answered by the
// shared fixture. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// The close-ups' sizes in CSS pixels, from shots/.
const CARD = 'aspect-ratio:1216/371;object-fit:cover';
const CARD_NEW = 'aspect-ratio:1216/331;object-fit:cover';
const CARD_LEVEL = 'aspect-ratio:1216/293;object-fit:cover';
const RACE = 'aspect-ratio:588/237;object-fit:cover';
const CLASSES = 'aspect-ratio:588/156;object-fit:cover';
const BANNER = 'aspect-ratio:1216/62;object-fit:cover';
// The new rider's greeting, "Welcome, Sam. Your first race opens a new map." (x 0–760 of 1232).
const WELCOME = 'aspect-ratio:760/52;object-fit:cover;object-view-box:inset(0% 38.3% 0% 0%)';

// ── Act 1: the next ride ──────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 13.2 · Choose the next ride',
  words: 'What to ride,',
  accent: 'next.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('card', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-033 AC1, AC2', 'Your next ride,', 'chosen.', 110, 130, 1700)}
  ${closeup('card-xl', `${at(110, 400, 1700)};${CARD}`, pop(S, onBeat(S, part('card', 0, 0.12)), { tilt: -1 }))}
  </div>`);

Film.scene('newrider', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-033 AC3, AC4', 'New or levelling,', 'a way on.', 110, 110, 1700)}
  ${closeup('greeting-new-xl', `${at(110, 360, 900)};${WELCOME}`, pop(S, onBeat(S, part('newrider', 0, 0.08)), { tilt: -1 }))}
  ${closeup('card-new-xl', `${at(110, 460, 1060)};${CARD_NEW}`, pop(S, onBeat(S, part('newrider', 0, 0.12)), { tilt: -1 }))}
  ${closeup('card-level-xl', `${at(750, 720, 1060)};${CARD_LEVEL}`, pop(S, onBeat(S, part('newrider', 0, 0.55)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the two doors, and the banner ──────────────────────────────────────────────────────
Film.scene('race', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-034', 'Four maps,', 'one glance.', 110, 240, 640)}
  ${closeup('race-door-xl', `${at(820, 250, 1000)};${RACE}`, pop(S, onBeat(S, part('race', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('classes', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-035', 'A class,', 'ready to ride.', 110, 240, 640)}
  ${closeup('class-door-xl', `${at(820, 340, 1000)};${CLASSES}`, pop(S, onBeat(S, part('classes', 0, 0.15)), { tilt: 1 }))}
  </div>`);

Film.scene('banner', (S) => `
  <div class="fill field--ink" ${zoomOut(S, 960, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-036', 'A new map,', 'announced once.', 110, 110, 1700)}
  ${closeup('banner-xl', `${at(110, 380, 1700)};${BANNER}`, pop(S, onBeat(S, part('banner', 0, 0.1)), { tilt: -1 }))}
  ${onBrowser(S, 'unlocked-xl', 560, 540, 760, onBeat(S, part('banner', 0, 0.4)), { tilt: 2 })}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One Home,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('335 passed')} ${dim('13 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('201 passed')} ${dim('15 new')}`],
    prompt('npm test'),
    [`  ${ok('1371 passed')} ${dim('25 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.21 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'The right ride,', 'every rider.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Mid, new, level goal and every map open')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Tiles to Race Setup; Ride alone to Class Start')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'The banner shows once, then it is gone')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 13.2 · Choose the next ride' });

wipeInto('race');
bug();

Film.start();
