// Slice 10.4 · Keep a streak. Six scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home's header and Profile for the mid rider and a new rider, from shots.ts, with GET
// /api/progress answered by the shared fixture. The ride answers are what the backend's tests receive. Every position
// is a pure function of the scene's time (docs/videos/README.md).
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
// The header's streak and level in a 1440 × 900 shot (x 1080–1440, y 0–60), in a box of their shape.
const STREAK = 'aspect-ratio:360/60;object-fit:cover;object-view-box:inset(0% 0% 93.3% 75%)';
// Profile's badge, headline and meta line in a 1440 × 900 shot (x 100–450, y 90–220).
const LEVEL = 'aspect-ratio:350/130;object-fit:cover;object-view-box:inset(10% 68.75% 75.6% 6.9%)';

// ── Act 1: the days ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 10.4 · Keep a streak',
  words: 'Ride every day,',
  accent: 'keep the flame.',
  width: 860,
  device: (S) => onBrowser(S, 'profile-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('days', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-042 AC1–AC3', 'One a day,', 'on your calendar.', 110, 220, 640)}
  ${terminal(S, 'POST /api/rides', [
    [`Mon 07:00 London          ${ok('1-day streak')}`],
    [`Mon 07:30 London          ${ok('1-day streak')} ${dim('same day')}`],
    [`Tue 07:00 London          ${ok('2-day streak')}`],
    [`Wed 07:00 London          ${ok('3-day streak')}`],
    [`Thu, no ride              ${dim('still 3 until midnight')}`],
    [`Fri                       ${ok('0')} ${dim('GET /api/progress')}`],
    [`23:30 and 00:30 Toronto   ${ok('2-day streak')} ${dim('one UTC day')}`],
  ], S.beat(3), `${at(860, 280, 920)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

// ── Act 2: where it shows ────────────────────────────────────────────────────────────────────
Film.scene('xp', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-037 AC4 · L2-042 AC4', 'Ten a day,', 'one number.', 110, 220, 600)}
  ${terminal(S, 'a first ride: 201 Created', [
    [`Finished          ${ok('+100')}`],
    [`2 of 10           ${ok('+160')}`],
    [`Podium            ${ok('+75')}`],
    [`84% on target     ${ok('+67')}`],
    [`1-day streak      ${ok('+10')} ${dim('new in 10.4')}`],
    [`xpTotal           ${ok('412')}`],
  ], S.beat(2), `${at(860, 320, 880)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('shows', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-032 AC2, AC3', 'The flame,', 'and 4 days.', 110, 180, 600)}
  ${closeup('home-xl', `${at(780, 150, 760)};${STREAK}`, pop(S, onBeat(S, part('shows', 0, 0.1)), { tilt: -1 }))}
  ${closeup('profile-xl', `${at(780, 330, 560)};${LEVEL}`, pop(S, onBeat(S, part('shows', 0, 0.3)), { tilt: 1 }))}
  ${closeup('new-xl', `${at(780, 590, 560)};${LEVEL}`, pop(S, onBeat(S, part('shows', 0, 0.5)), { tilt: -1 }))}
  ${onPhone(S, 'home-xs', 1480, 300, 280, onBeat(S, part('shows', 0, 0.7)), 4)}
  </div>`, { after: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${zoomIn(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('257 passed')} ${dim('16 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('161 passed')}`],
    prompt('npm test'),
    [`  ${ok('1311 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.17 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every case,', 'across midnight.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Each case of the rule, one per row')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'The streak through the API, the clock moved, never slept')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'The header and Profile, from the same progress')}
  </div>
  </div>`, { before: 0.7 });

closing('close', { kicker: 'Slice 10.4 · Keep a streak' });

wipeInto('xp');
bug();

Film.start();
