// Slice 18.1 · Lose the service mid-ride. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a riders-online race before, during and after a lost service, at 1440 px and three other widths,
// with its board close up, and a group class losing the service, from shots.ts. Every position is a pure function of
// the scene's time (docs/videos/README.md).
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

// ── Act 1: lost, riding on, and back ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 18.1 · Lose the service mid-ride',
  words: 'Service lost?',
  accent: 'Ride on.',
  width: 900,
  device: (S) => onBrowser(S, 'lost-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('lost', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-126 AC1 · Race', 'The board holds,', 'the ride rolls.', 110, 160, 860)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('lost', 0, 0.2)), 'The bike, the plan and the clock carry on')}
    ${fact(S, 2, onBeat(S, part('lost', 0, 0.4)), 'The board keeps its last standings')}
    ${fact(S, 3, onBeat(S, part('lost', 0, 0.6)), 'Reconnecting. The standings will catch up.')}
  </div>
  ${closeup('board-lost', `${at(1180, 110, 560)};${REGION}`, pop(S, onBeat(S, part('lost', 0, 0.1)), { tilt: -1 }))}
  </div>`);

Film.scene('class', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-126 AC1 · Group class', 'The video rolls,', 'the board waits.', 110, 160, 820)}
  ${closeup('class-lost-xl', `${at(960, 170, 860)};${PAGE}`, pop(S, onBeat(S, part('class', 0, 0.1)), { tilt: -1 }))}
  ${closeup('class-board-lost', `${at(260, 470, 380)};aspect-ratio:4/5;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('class', 0, 0.4)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('back', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-126 AC2', 'Back again,', 'same seat.', 110, 160, 760)}
  ${terminal(S, 'the race, as the spec saw it', [
    [`  lost       ${ok('notice shown')}     ${dim('every reconnect refused')}`],
    [`  restored   ${ok('JoinRace again')}   ${dim('same session, same seat')}`],
    [`  rejoined   ${ok('notice gone')}      ${dim('4th on the next standings')}`],
  ], 0.2, `${at(110, 560, 900)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('board-back', `${at(1180, 110, 560)};${REGION}`, pop(S, onBeat(S, part('back', 0, 0.55)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

Film.scene('server', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'JoinRace · JoinClassSession', 'Rejoined,', 'caught up at once.', 110, 160, 900)}
  <div style="${at(110, 560, 820)}">
    ${fact(S, 1, onBeat(S, part('server', 0, 0.2)), 'The standings go to that rider alone')}
    ${fact(S, 2, onBeat(S, part('server', 0, 0.4)), 'No wait for the next once-a-second tick')}
    ${fact(S, 3, onBeat(S, part('server', 0, 0.6)), 'A class keeps your last output; a race, your last distance')}
  </div>
  ${terminal(S, 'LostServiceTests, the clock standing still', [
    [`  class  ${ok('StandingsUpdated')}      ${dim('12.5 kJ, at once')}`],
    [`  race   ${ok('RaceStandingsUpdated')}  ${dim('100 m, at once')}`],
  ], 0.3, `${at(1000, 330, 820)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/lost-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Riding on,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('459 passed')} ${dim('2 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('272 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.44 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Service lost,', 'ride kept.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The ride carries on with its last standings')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The notice shows, then goes on rejoining')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'The standings arrive at once on a rejoin')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 18.1 · Lose the service mid-ride' });

wipeInto('back');
bug();

Film.start();
