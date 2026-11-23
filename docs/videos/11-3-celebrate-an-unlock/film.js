// Slice 11.3 · Celebrate an unlock. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Results for the mocks' 2nd of 10 against bots, whose answer opened Neon Docklands, at four
// widths, the card's entrance held at 300, 450 and 650 ms, and Results with no map opened, from shots.ts, each answered
// by the shared fixture. Every position is a pure function of the scene's time (docs/videos/README.md).
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
// The unlock card in a 1440 × 900 shot (x 916–1340, y 80–400).
const CARD = 'aspect-ratio:424/320;object-fit:cover;object-view-box:inset(8.9% 6.94% 55.6% 63.6%)';
// What was earned with no card (x 916–1340, y 80–520).
const EARNED = 'aspect-ratio:424/440;object-fit:cover;object-view-box:inset(8.9% 6.94% 42.2% 63.6%)';

// ── Act 1: the card ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 11.3 · Celebrate an unlock',
  words: 'A new map,',
  accent: 'celebrated.',
  width: 860,
  device: (S) => onBrowser(S, 'unlock-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('card', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-076 AC1', 'Neon Docklands', 'is open.', 110, 220, 640)}
  ${closeup('unlock-xl', `${at(860, 140, 760)};${CARD}`, pop(S, onBeat(S, part('card', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('motion', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-076 AC2', 'Fade, grow,', 'then colour.', 110, 160, 1700)}
  ${[300, 450, 650].map((ms, i) => `
    ${closeup(`entrance-${ms}`, `${at(110 + i * 580, 470, 520)};${CARD}`, pop(S, onBeat(S, part('motion', 0, 0.15 + i * 0.2)), { tilt: i === 1 ? 1 : -1 }))}
    <p class="kicker" style="${at(110 + i * 580, 880, 520)};text-align:center" ${S.rise(onBeat(S, part('motion', 0, 0.2 + i * 0.2)))}>${ms} ms</p>`).join('')}
  </div>`, { before: 0.4 });

Film.scene('rules', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-040 AC2–AC5', 'The backend', 'decides.', 110, 160, 1100)}
  <div style="${at(110, 470, 1100)}">
    ${fact(S, 1, onBeat(S, part('rules', 0, 0.2)), 'Top 3 vs Bots on Old Town Criterium opens Neon Docklands')}
    ${fact(S, 2, onBeat(S, part('rules', 0, 0.4)), '2★ on Cliffside Coast opens Dolomites, 3★ on Dolomites Col du Granit')}
    ${fact(S, 3, onBeat(S, part('rules', 0, 0.6)), 'Rider level 10 opens Vice City, after a class too')}
  </div>
  </div>`);

// ── Act 2: no card, and every width ──────────────────────────────────────────────────────────
Film.scene('none', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-076 AC3', 'Nothing opened,', 'no card.', 110, 220, 640)}
  ${closeup('no-unlock-xl', `${at(960, 110, 640)};${EARNED}`, pop(S, onBeat(S, part('none', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4, after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/unlock-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'First in', { accent: 'what you earned.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('288 passed')} ${dim('16 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('177 passed')} ${dim('3 new')}`],
    prompt('npm test'),
    [`  ${ok('1335 passed')} ${dim('3 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.19 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Every rule,', 'every frame.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'The unlock rules, one case per row')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'The opened map through the API, named once')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'The card, its link and its motion, or none')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 11.3 · Celebrate an unlock' });

wipeInto('rules');
bug();

Film.start();
