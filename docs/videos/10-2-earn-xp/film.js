// Slice 10.2 · Earn XP. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a bots race on the warm-up's target and a class on target, from shots.ts, with the backend
// answered by the shared fixture; the ride's share on target is the one shots.ts printed, and the XP lines are what the
// backend answers for it. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// The race's numbers in a 1440 × 900 shot (x 10–330, y 60–370), in a box of their shape.
const NUMBERS = 'aspect-ratio:320/310;object-fit:cover;object-view-box:inset(6.7% 77.1% 58.9% 0.7%)';
// The class's power and cadence in a 1440 × 900 shot (x 470–1175, y 770–890), in a box of their shape.
const POWER = 'aspect-ratio:705/120;object-fit:cover;object-view-box:inset(85.6% 18.4% 1.1% 32.6%)';

// ── Act 1: time on target ────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 10.2 · Earn XP',
  words: 'Every ride',
  accent: 'earns XP.',
  width: 860,
  device: (S) => onBrowser(S, 'race-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('ontarget', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-037 AC3', 'Within 10 %,', 'on target.', 110, 200, 600)}
  ${closeup('race-xl', `${at(760, 150, 420)};${NUMBERS}`, pop(S, onBeat(S, part('ontarget', 0, 0.2)), { tilt: -2 }))}
  ${closeup('class-xl', `${at(1230, 250, 600)};${POWER}`, pop(S, onBeat(S, part('ontarget', 0, 0.35)), { tilt: 2 }))}
  ${terminal(S, 'POST /api/rides', [
    [`40 s at 143 W, target 143 W    ${ok('on target')}`],
    [`33 s at 661 W to the line      ${dim('off target')}`],
    [`onTargetShare                  ${ok('0.548')}`],
  ], S.beat(4), `${at(1230, 560, 600)};font-size:20px`, { every: S.BEAT * 0.5 })}
  ${onPhone(S, 'race-xs', 110, 560, 240, onBeat(S, part('ontarget', 0, 0.5)), -4)}
  </div>`);

// ── Act 2: the lines ─────────────────────────────────────────────────────────────────────────
Film.scene('lines', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-037 AC1–AC3', 'Line by line,', 'from the backend.', 110, 220, 640)}
  ${terminal(S, '201 Created', [
    [`Finished          ${ok('+100')}`],
    [`1 of 10           ${ok('+180')} ${dim('(10 − 1) × 20')}`],
    [`Podium            ${ok('+75')}`],
    [`55% on target     ${ok('+44')} ${dim('round(55 × 0.8)')}`],
    [`xpTotal           ${ok('399')}`],
    [`totalXp           ${ok('399')} ${dim('the rider’s first ride')}`],
  ], S.beat(2), `${at(860, 330, 900)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('example', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-037 AC5', 'Second of ten:', '402, then 442.', 110, 200, 600)}
  ${terminal(S, 'XpCalculator', [
    [`Finished          ${ok('+100')}`],
    [`2 of 10           ${ok('+160')}`],
    [`Podium            ${ok('+75')}`],
    [`84% on target     ${ok('+67')}`],
    [`                  ${ok('402')} ${dim('today')}`],
    [`4-day streak      ${ok('+40')} ${dim('slice 10.4')}`],
    [`                  ${ok('442')} ${dim('the worked example')}`],
  ], S.beat(2), `${at(860, 300, 900)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`, { after: 0.7 });

Film.scene('rules', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-037 AC6, AC7 · L2-125 AC3', 'No place to win,', 'no double pay.', 110, 220, 640)}
  ${terminal(S, 'what earns nothing more', [
    [`solo race, class        ${dim('no place, no podium')}`],
    [`a DNF, a discarded ride ${dim('no lines at all')}`],
    [`the same ride id again  ${ok('200')} ${dim('same lines, total unchanged')}`],
    [`xp in the body          ${dim('not read')}`],
  ], S.beat(3), `${at(880, 380, 900)};font-size:23px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('201 passed')} ${dim('26 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('156 passed')}`],
    prompt('npm test'),
    [`  ${ok('1300 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.12 kB')} ${dim('unchanged')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API', 'and the rule.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Every line of L2-037, one case per row')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'The total grows once per ride id')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'The share on target sent with the ride')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 10.2 · Earn XP' });

wipeInto('lines');
bug();

Film.start();
