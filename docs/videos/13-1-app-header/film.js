// Slice 13.1 · App header. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the app header at 1440 px, before and in full screen, on Map Select, the Class Library and
// Profile, and at 390 px, and Map Select at four widths, from shots.ts, each answered by the shared fixture. Every
// position is a pure function of the scene's time (docs/videos/README.md).
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
// A whole header at 1440 px (1440 × 57).
const BAR = 'aspect-ratio:1440/57;object-fit:cover';
// The header's end: bike, streak, level and Full screen (x 1040–1420).
const END = 'aspect-ratio:380/57;object-fit:cover;object-view-box:inset(0% 1.39% 0% 72.2%)';
// The phone header (390 × 101).
const PHONE = 'aspect-ratio:390/101;object-fit:cover';

// ── Act 1: Full screen, and where you are ─────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 13.1 · App header',
  words: 'One header,',
  accent: 'every page.',
  width: 860,
  device: (S) => onBrowser(S, 'race-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('fullscreen', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-144 AC1, AC2', 'Full screen,', 'one press.', 110, 160, 1700)}
  ${closeup('header-xl', `${at(700, 470, 1000)};${END}`, pop(S, onBeat(S, part('fullscreen', 0, 0.12)), { tilt: -1 }))}
  ${closeup('header-full-xl', `${at(700, 720, 1000)};${END}`, pop(S, onBeat(S, part('fullscreen', 0, 0.35)), { tilt: 1 }))}
  <p class="kicker" style="${at(110, 520, 520)}" ${S.rise(onBeat(S, part('fullscreen', 0, 0.12)))}>Full screen</p>
  <p class="kicker" style="${at(110, 770, 520)}" ${S.rise(onBeat(S, part('fullscreen', 0, 0.35)))}>In full screen</p>
  </div>`);

Film.scene('current', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-032 AC1', 'Where you are,', 'marked.', 110, 110, 1700)}
  ${['race', 'classes', 'profile'].map((name, i) =>
    closeup(`header-${name}-xl`, `${at(110 + i * 60, 400 + i * 190, 1640)};${BAR}`, pop(S, onBeat(S, part('current', 0, 0.12 + i * 0.18)), { tilt: i % 2 ? 1 : -1 })),
  ).join('')}
  </div>`, { before: 0.4 });

Film.scene('level', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-032 AC2', 'Level 7,', '4-day streak.', 110, 220, 620)}
  ${closeup('header-xl', `${at(780, 380, 1030)};${END}`, pop(S, onBeat(S, part('level', 0, 0.15)), { tilt: -1 }))}
  </div>`);

// ── Act 2: phone, and every width ─────────────────────────────────────────────────────────────
Film.scene('phone', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-032 AC4', 'On a phone,', 'its own row.', 110, 220, 640)}
  ${closeup('header-xs', `${at(900, 300, 860)};${PHONE}`, pop(S, onBeat(S, part('phone', 0, 0.15)), { tilt: -2 }))}
  </div>`, { before: 0.4, after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/race-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One header,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('322 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('186 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1346 passed')} ${dim('5 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.20 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Full screen,', 'everywhere.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Full screen in, then Exit full screen out')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'No Fullscreen API, no button')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Each page marks its item; phones get a row')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 13.1 · App header' });

wipeInto('level');
bug();

Film.start();
