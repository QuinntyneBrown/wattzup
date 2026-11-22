// Slice 20.5 · Manage saved worlds. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are Settings' This device with three saved worlds at 1440 px and three other widths, the section close up,
// the section cleared with its toast at 1440 and 390 px, and World loading with Old Town Criterium downloaded and
// saved, from shots.ts. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';
/** A page at 1440 px, and a phone's window at 390 × 780, in CSS pixels. */
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
const PHONE = 'aspect-ratio:390/780;object-fit:cover;object-position:top';

// ── Act 1: what is kept ───────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 20.5 · Manage saved worlds',
  words: 'Worlds,',
  accent: 'kept here.',
  width: 900,
  device: (S) => onBrowser(S, 'device-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('saved', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-165 AC1', 'Three worlds,', '61 MB.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('saved', 0, 0.3)), 'How many, and how much space')}
    ${fact(S, 2, onBeat(S, part('saved', 0, 0.55)), 'Each world named')}
  </div>
  ${closeup('device', `${at(900, 300, 900)};${REGION}`, pop(S, onBeat(S, part('saved', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('clear', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-165 AC2', 'Cleared,', '61 MB freed.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('clear', 0, 0.2)), 'The row reads None saved')}
    ${fact(S, 2, onBeat(S, part('clear', 0, 0.4)), 'A toast with the space freed')}
    ${fact(S, 3, onBeat(S, part('clear', 0, 0.6)), 'Closes after 6 seconds, or with ×')}
  </div>
  ${closeup('cleared-xl', `${at(880, 170, 800)};${PAGE}`, pop(S, onBeat(S, part('clear', 0, 0.1)), { tilt: 1 }))}
  ${closeup('cleared-xs', `${at(1500, 420, 300)};${PHONE}`, pop(S, onBeat(S, part('clear', 0, 0.35)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: keeping, every width, and the proof ────────────────────────────────────────────────
Film.scene('keep', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-165 AC3', 'Keep worlds,', 'or not.', 110, 160, 700)}
  ${closeup('loading', `${at(860, 170, 960)};${PAGE}`, pop(S, onBeat(S, part('keep', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'settings-saved-worlds.spec.ts', [
    [`  on       ${ok('1 world · 0.2 MB')} ${dim('listed after a class')}`],
    [`  off      ${ok('nothing saved')} ${dim('downloads again')}`],
  ], part('keep', 0, 0.45), `${at(110, 560, 720)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/device-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'This device,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('device-l', `${at(110, 200, 820)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('proof', 0, 0.1)), { tilt: -1 }))}
  ${title(S, 'L2-165 AC4', 'Evicted?', 'No harm.', 1040, 130, 760)}
  <div style="${at(1040, 470, 760)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The browser may clear space itself')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'World loading downloads it again')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Nothing fails')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 20.5 · Manage saved worlds' });

wipeInto('keep');
bug();

Film.start();
