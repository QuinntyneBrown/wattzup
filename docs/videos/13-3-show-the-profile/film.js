// Slice 13.3 · Show the profile. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Profile for the mid rider at 1440 px and three other widths, its headline and Settings, a new
// rider's headline and the bike row with no bike, from shots.ts, each answered by the shared fixture. Every position is
// a pure function of the scene's time (docs/videos/README.md).
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
const HEADLINE = 'aspect-ratio:836/112;object-fit:cover';
const SETTINGS = 'aspect-ratio:356/411;object-fit:cover';
const NO_BIKE = 'aspect-ratio:356/76;object-fit:cover';
// Settings' first three rows: the bike, Ride settings and Custom workout (y 32–208 of 411).
const THREE = 'aspect-ratio:356/176;object-fit:cover;object-view-box:inset(7.8% 0% 49.4% 0%)';

// ── Act 1: your level ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 13.3 · Show the profile',
  words: 'Your record,',
  accent: 'one place.',
  width: 860,
  device: (S) => onBrowser(S, 'profile-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('headline', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-109 AC1', 'Level 7,', '23 rides.', 110, 160, 1700)}
  ${closeup('headline-xl', `${at(110, 450, 1700)};${HEADLINE}`, pop(S, onBeat(S, part('headline', 0, 0.12)), { tilt: -1 }))}
  </div>`);

Film.scene('newrider', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-109 AC2', 'Level 1,', 'no rides yet.', 110, 160, 1700)}
  ${closeup('headline-new-xl', `${at(110, 450, 1700)};${HEADLINE}`, pop(S, onBeat(S, part('newrider', 0, 0.12)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: Settings, and every width ──────────────────────────────────────────────────────────
Film.scene('settings', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-112 AC1', 'Your bike,', 'your settings.', 110, 240, 700)}
  ${closeup('settings-xl', `${at(1020, 90, 780)};${SETTINGS}`, pop(S, onBeat(S, part('settings', 0, 0.1)), { tilt: -1 }))}
  ${closeup('settings-xl', `${at(110, 640, 820)};${THREE}`, pop(S, onBeat(S, part('settings', 0, 0.45)), { tilt: 1 }))}
  </div>`);

Film.scene('nobike', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-112 AC2', 'No bike yet,', 'pair one.', 110, 220, 640)}
  ${closeup('bike-none-xl', `${at(880, 420, 900)};${NO_BIKE}`, pop(S, onBeat(S, part('nobike', 0, 0.15)), { tilt: -2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/profile-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One Profile,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('337 passed')} ${dim('2 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('206 passed')} ${dim('5 new')}`],
    prompt('npm test'),
    [`  ${ok('1380 passed')} ${dim('9 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.21 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every number,', 'every row.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Level, XP bar, rides, km and streak')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Bike, Ride settings, Custom workout, in order')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'No bike yet goes to Connect Bike')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 13.3 · Show the profile' });

wipeInto('settings');
bug();

Film.start();
