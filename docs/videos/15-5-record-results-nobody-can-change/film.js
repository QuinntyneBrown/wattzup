// Slice 15.5 · Record results nobody can change. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are Results of a riders-online race while the service answers result_pending, then once
// it has recorded the ride, at 1440 px and three other widths, from shots.ts. The service's side is shown as the
// terminal lines of what the backend's tests saw. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';

// ── Act 1: the service decides ────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 15.5 · Record results nobody can change',
  words: 'Your place,',
  accent: 'locked by the service.',
  width: 900,
  device: (S) => onBrowser(S, 'recorded-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('end', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-071 AC3', 'When the race', 'is over.', 110, 160, 760)}
  ${terminal(S, 'the race session, each second', [
    [`  every person finished or DNF → ${ok('ends')}`],
    [`  first finish + ${ok('2:00')}         → ${ok('ends')}`],
    [`  ${dim('the rest placed by distance')}`],
    [`  ${dim('then SessionEnded to every rider')}`],
  ], 0.2, `${at(110, 560, 780)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('pending-xl', `${at(960, 200, 860)};${PAGE}`, pop(S, onBeat(S, part('end', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('locked', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-125 AC1', 'Claim the win?', 'The service says 2nd.', 110, 160, 860)}
  ${terminal(S, 'POST /api/rides, as the test sent it', [
    prompt('mode online · place 1 · 30:00'),
    [`  session result → place ${ok('2 of 10')}`],
    [`  time ${ok('10:02')}  output ${ok('from progress')}`],
    [`  ${dim("the submission's own values are ignored")}`],
  ], 0.2, `${at(110, 560, 860)};font-size:20px`, { every: S.BEAT * 0.6 })}
  ${closeup('recorded-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('locked', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('pending', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-125 AC1', 'Finished first?', 'Results waits.', 110, 160, 800)}
  ${terminal(S, 'the outbox, on the page', [
    [`  409 ${ok('result_pending')}  → "Recording your ride…"`],
    [`  again in ${ok('5 s')}            → 201, the XP`],
    [`  ${dim('for up to 3 minutes, the same ride id')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('pending-xl', `${at(1000, 220, 820)};${PAGE}`, pop(S, onBeat(S, part('pending', 0, 0.1)), { tilt: -1 }))}
  ${closeup('recorded-xl', `${at(1080, 520, 700)};${PAGE}`, pop(S, onBeat(S, part('pending', 0, 0.6)), { tilt: 2 }))}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/recorded-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Recorded,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('8 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('248 passed')} ${dim('1 new')}`],
    prompt('npm test'),
    [`  ${ok('1467 passed')} ${dim('5 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'The service', 'keeps the score.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), "The service's place, time and output win")}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Ends when all are in, or 2:00 after the first')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'The app waits and asks again')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 15.5 · Record results nobody can change' });

wipeInto('pending');
bug();

Film.start();
