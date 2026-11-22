// Slice 17.1 · Ride outbox. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are Results of a solo race on Old Town Criterium finished without a network, its XP pending, at 1440 px and three
// other widths, and the same Results once the ride is recorded, from shots.ts. Every position is a pure function of the
// scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';

// ── Act 1: kept, sent in order, tried again, recorded ─────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 17.1 · Ride outbox',
  words: 'Finished offline,',
  accent: 'recorded later.',
  width: 900,
  device: (S) => onBrowser(S, 'recorded-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('pending', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC1, L2-074 AC3', 'No network?', 'XP pending.', 110, 160, 800)}
  ${terminal(S, 'the device, as the spec saw it', [
    [`  POST /api/rides  ${dim('no answer')}`],
    [`  Results  ${ok('Your XP will be added when you’re back online.')}`],
    [`  IndexedDB telo-ride / rides-waiting`],
    [`    ${ok('the race')} ${dim('by its ride id, finished 7:30')}`],
  ], 0.2, `${at(110, 580, 840)};font-size:20px`, { every: S.BEAT * 0.6 })}
  ${closeup('pending-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('pending', 0, 0.15)), { tilt: -1 }))}
  ${closeup('pending-xp', `${at(1120, 600, 700)};${REGION}`, pop(S, onBeat(S, part('pending', 0, 0.35)), { tilt: 2 }))}
  </div>`);

Film.scene('order', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-135 AC2', 'Back online,', 'oldest first.', 110, 160, 820)}
  <div style="${at(110, 580, 780)}">
    ${fact(S, 1, onBeat(S, part('order', 0, 0.2)), 'When the app opens, or the network returns')}
    ${fact(S, 2, onBeat(S, part('order', 0, 0.4)), 'One ride at a time, by when it finished')}
    ${fact(S, 3, onBeat(S, part('order', 0, 0.6)), 'The ride id makes a repeat safe')}
  </div>
  ${terminal(S, 'two rides waiting, as the spec saw them', [
    prompt('the app opens online'),
    [`  1  ${ok('6:45 ride')} ${dim('recorded, removed')}`],
    [`  2  ${ok('7:30 ride')} ${dim('recorded, removed')}`],
  ], 0.3, `${at(1000, 300, 800)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('retry', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC2', 'Still out of reach?', 'Try again, slower.', 110, 160, 900)}
  ${terminal(S, 'the retry timer, as the spec saw it', [
    [`  0:00   ${dim('503, kept')}`],
    [`  0:30   ${dim('503, kept')}`],
    [`  1:30   ${ok('recorded')}`],
    [`  ${dim('then 2 min, 4 min… up to an hour')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('pending-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('retry', 0, 0.1)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('recorded', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-135 AC2', 'Recorded,', 'then removed.', 110, 160, 860)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('recorded', 0, 0.25)), 'The XP fills in on Results')}
    ${fact(S, 2, onBeat(S, part('recorded', 0, 0.45)), 'The ride leaves the device')}
    ${fact(S, 3, onBeat(S, part('recorded', 0, 0.65)), 'A refused ride is dropped, not resent')}
  </div>
  ${closeup('recorded-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('recorded', 0, 0.1)), { tilt: 1 }))}
  ${closeup('recorded-xp', `${at(1120, 560, 700)};${REGION}`, pop(S, onBeat(S, part('recorded', 0, 0.3)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/pending-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'XP pending,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('266 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1572 passed')} ${dim('15 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.41 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Kept,', 'then sent.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Kept in IndexedDB, XP pending')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Oldest first, then removed')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), '30 s, then a minute, up to an hour')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 17.1 · Ride outbox' });

wipeInto('retry');
bug();

Film.start();
