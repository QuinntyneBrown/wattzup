// Slice 10.3 · Rider levels. Six scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home's header for the mid rider, the veteran and a new rider, and Profile, from shots.ts, with
// GET /api/progress answered by the shared fixture. The ride's answer is what the backend's tests receive. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The header's level link in a 1440 × 900 shot (x 1110–1440, y 0–60), in a box of its shape.
const LEVEL = 'aspect-ratio:330/60;object-fit:cover;object-view-box:inset(0% 0% 93.3% 77.1%)';
// Profile's badge and headline in a 1440 × 900 shot (x 90–500, y 70–210).
const HEADLINE = 'aspect-ratio:410/140;object-fit:cover;object-view-box:inset(7.8% 65.3% 76.7% 6.25%)';

// ── Act 1: thresholds ────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 10.3 · Rider levels',
  words: 'XP adds up',
  accent: 'to a level.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('table', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-038 AC1', 'The highest threshold', 'you reach.', 110, 220, 640)}
  ${terminal(S, 'LevelTable', [
    [`level  1    ${ok('0 XP')}`],
    [`level  2    ${ok('400 XP')}      ${dim('known')}`],
    [`level  7    1,800 XP    ${dim('provisional')}`],
    [`level  8    ${ok('2,600 XP')}    ${dim('known')}`],
    [`level 18    8,600 XP    ${dim('provisional')}`],
    [`level 19    ${ok('10,400 XP')}   ${dim('known')}`],
    [`level 30    21,400 XP   ${dim('then no next level')}`],
  ], S.beat(3), `${at(860, 280, 900)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`);

// ── Act 2: the header ────────────────────────────────────────────────────────────────────────
Film.scene('header', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-032 AC2, AC4', 'Level 7,', '1,840 of 2,600.', 110, 160, 640)}
  ${closeup('home-xl', `${at(800, 140, 760)};${LEVEL}`, pop(S, onBeat(S, part('header', 0, 0.1)), { tilt: -1 }))}
  ${closeup('veteran-xl', `${at(800, 330, 600)};${LEVEL}`, pop(S, onBeat(S, part('header', 0, 0.25)), { tilt: 1 }))}
  ${closeup('new-xl', `${at(800, 490, 500)};${LEVEL}`, pop(S, onBeat(S, part('header', 0, 0.35)), { tilt: -1 }))}
  ${closeup('profile-xl', `${at(800, 640, 420)};${HEADLINE}`, pop(S, onBeat(S, part('header', 0, 0.5)), { tilt: 2 }))}
  ${onPhone(S, 'home-xs', 1500, 300, 280, onBeat(S, part('header', 0, 0.7)), 4)}
  </div>`, { before: 0.4 });

Film.scene('ride', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-038 AC2, AC3', 'Up a level,', 'or stay at 30.', 110, 200, 600)}
  ${terminal(S, 'POST /api/rides', [
    [`a new rider's first ride   ${ok('201')}`],
    [`  totalXp        ${ok('402')}`],
    [`  level          ${ok('2')}`],
    [`  levelUp        ${ok('true')}`],
    [`  xpToNextLevel  ${ok('248')} ${dim('level 3 at 650')}`],
    [`a level-30 rider's ride    ${ok('201')}`],
    [`  totalXp        ${ok('30,140')} ${dim('still grows')}`],
    [`  level          ${ok('30')}   ${dim('levelUp false, no next level')}`],
  ], S.beat(2), `${at(860, 260, 900)};font-size:23px`, { every: S.BEAT * 0.45 })}
  </div>`, { after: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${zoomIn(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('241 passed')} ${dim('40 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('159 passed')}`],
    prompt('npm test'),
    [`  ${ok('1307 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.17 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every row,', 'and the header.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Each of the thirty thresholds, and the cap')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'The level through the API, once per ride id')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'The header and Profile, from the same progress')}
  </div>
  </div>`, { before: 0.7 });

closing('close', { kicker: 'Slice 10.3 · Rider levels' });

wipeInto('header');
bug();

Film.start();
