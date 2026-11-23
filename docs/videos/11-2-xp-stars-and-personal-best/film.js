// Slice 11.2 · XP, stars and personal best. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Results for the mocks' bots race at four widths, a solo race's new personal best and a slower
// one, a class, and the XP panel recording, offline and not recorded, from shots.ts, each answered by the shared
// fixture. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// The XP panel with five lines in a 1440 × 900 shot (x 916–1340, y 90–300).
const XP = 'aspect-ratio:424/210;object-fit:cover;object-view-box:inset(10% 6.94% 66.7% 63.6%)';
// The XP panel with three lines (x 916–1340, y 90–235).
const XP3 = 'aspect-ratio:424/145;object-fit:cover;object-view-box:inset(10% 6.94% 73.9% 63.6%)';
// The stars panel under five XP lines (x 916–1340, y 315–430).
const STARS = 'aspect-ratio:424/115;object-fit:cover;object-view-box:inset(35% 6.94% 52.2% 63.6%)';
// The stars panel under three XP lines (x 916–1340, y 250–365).
const STARS3 = 'aspect-ratio:424/115;object-fit:cover;object-view-box:inset(27.8% 6.94% 59.4% 63.6%)';
// The XP panel's head and note (x 916–1340, y 80–180).
const NOTE = 'aspect-ratio:424/100;object-fit:cover;object-view-box:inset(8.9% 6.94% 80% 63.6%)';
// The lead, the time and the line under it (x 100–460, y 80–290).
const RESULT = 'aspect-ratio:360/210;object-fit:cover;object-view-box:inset(8.9% 68.06% 67.8% 6.94%)';

// ── Act 1: what the ride earned ──────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 11.2 · XP, stars and personal best',
  words: 'What the ride',
  accent: 'earned.',
  width: 860,
  device: (S) => onBrowser(S, 'bots-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('xp', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-074 AC1', '+442,', 'line by line.', 110, 220, 620)}
  ${closeup('bots-xl', `${at(800, 200, 900)};${XP}`, pop(S, onBeat(S, part('xp', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('stars', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-075 AC1–AC3', '2 of 3,', '+1 new star.', 110, 220, 620)}
  ${closeup('bots-xl', `${at(820, 220, 800)};${STARS}`, pop(S, onBeat(S, part('stars', 0, 0.15)), { tilt: -1 }))}
  ${closeup('class-xl', `${at(1060, 560, 640)};${XP3}`, pop(S, onBeat(S, part('stars', 0, 0.55)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('best', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-077 AC1, AC3', 'A new best,', 'or your best.', 110, 220, 600)}
  ${closeup('best-xl', `${at(760, 110, 500)};${RESULT}`, pop(S, onBeat(S, part('best', 0, 0.15)), { tilt: -1 }))}
  ${closeup('best-xl', `${at(1290, 170, 560)};${STARS3}`, pop(S, onBeat(S, part('best', 0, 0.3)), { tilt: 1 }))}
  ${closeup('slower-xl', `${at(1000, 560, 520)};${RESULT}`, pop(S, onBeat(S, part('best', 0, 0.55)), { tilt: 1 }))}
  </div>`);

// ── Act 2: while it is recorded, and at every width ──────────────────────────────────────────
Film.scene('states', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-074 AC2–AC4', 'Recording,', 'offline, refused.', 110, 220, 640)}
  ${closeup('recording-xl', `${at(840, 150, 900)};${NOTE}`, pop(S, onBeat(S, part('states', 0, 0.1)), { tilt: -1 }))}
  ${closeup('offline-xl', `${at(880, 420, 900)};${NOTE}`, pop(S, onBeat(S, part('states', 0, 0.35)), { tilt: 1 }))}
  ${closeup('not-recorded-xl', `${at(840, 690, 900)};${NOTE}`, pop(S, onBeat(S, part('states', 0, 0.6)), { tilt: -1 }))}
  </div>`, { before: 0.4, after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/bots-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Below,', { accent: 'then beside.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('272 passed')} ${dim('15 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('174 passed')} ${dim('7 new')}`],
    prompt('npm test'),
    [`  ${ok('1332 passed')} ${dim('14 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.17 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every star,', 'every state.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The star rules, one case per row')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Stars and best through the API, a repeat the same')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Waiting, filled, offline and back, refused')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 11.2 · XP, stars and personal best' });

wipeInto('best');
bug();

Film.start();
