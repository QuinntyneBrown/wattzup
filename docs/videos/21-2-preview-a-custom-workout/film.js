// Slice 21.2 · Preview a custom workout. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Custom workout with Your ride at 1440 px and three other widths, Your ride close up for GCN 30-min
// HIIT, after a round is removed and for flat resistance, and the video section synced at 0:12.0 and with a link that
// is not YouTube's, from shots.ts. Every position is a pure function of the scene's time (docs/videos/README.md).
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
/** A page at 1440 px, in CSS pixels. */
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
/** Your ride, to the end of its facts. */
const ASIDE = 'aspect-ratio:872/1140;object-fit:cover;object-position:top';

// ── Act 1: what the ride asks ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 21.2 · Preview a custom workout',
  words: 'Know the ride',
  accent: 'before it starts.',
  width: 900,
  device: (S) => onBrowser(S, 'setup-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('total', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-099 AC1 · L2-100 AC1', '30:00,', 'at a glance.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('total', 0, 0.3)), 'The total, then the profile from 0:00')}
    ${fact(S, 2, onBeat(S, part('total', 0, 0.55)), '17 segments, warm-up to cool-down')}
  </div>
  ${closeup('preview', `${at(1080, 90, 560)};${ASIDE}`, pop(S, onBeat(S, part('total', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('facts', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-099 AC1, AC3', '~154 W,', '~276 kcal.', 110, 160, 760)}
  ${terminal(S, 'custom-plan.spec.ts', [
    [`  structure   ${ok('8 × 0:30 · 3:00 → 1:30 recover')}`],
    [`  under load  ${ok('4:00')}`],
    [`  peak        ${ok('Level 24')}`],
    [`  avg power   ${ok('~154 W')} ${dim('each segment, by its length')}`],
    [`  energy      ${ok('~276 kcal')}`],
  ], part('facts', 0, 0.3), `${at(110, 500, 860)};font-size:19px`, { every: S.BEAT * 0.6 })}
  ${closeup('preview', `${at(1180, 90, 520)};${ASIDE}`, pop(S, onBeat(S, part('facts', 0, 0.1)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('follows', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-095 AC6', 'Every change,', 'at once.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('follows', 0, 0.3)), 'Round 1 removed: 26:30, 15 bars')}
  </div>
  ${closeup('changed', `${at(1080, 90, 560)};${ASIDE}`, pop(S, onBeat(S, part('follows', 0, 0.15)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

// ── Act 2: flat, the video, and every width ───────────────────────────────────────────────────
Film.scene('flat', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('flat', `${at(140, 90, 560)};${ASIDE}`, pop(S, onBeat(S, part('flat', 0, 0.1)), { tilt: 1 }))}
  ${title(S, 'L2-099 AC2', 'Level 12,', 'throughout.', 960, 160, 800)}
  <div style="${at(960, 500, 700)}">
    ${fact(S, 1, onBeat(S, part('flat', 0, 0.35)), '~205 W, ~367 kcal')}
    ${fact(S, 2, onBeat(S, part('flat', 0, 0.55)), 'No time under load')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('video', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-098', 'Synced from', '0:12.0.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('video', 0, 0.3)), 'Parked at the offset, with its controls')}
    ${fact(S, 2, onBeat(S, part('video', 0, 0.5)), 'Use the video’s current time')}
    ${fact(S, 3, onBeat(S, part('video', 0, 0.7)), 'Only a YouTube link')}
  </div>
  ${closeup('video', `${at(880, 120, 900)};${PAGE}`, pop(S, onBeat(S, part('video', 0, 0.1)), { tilt: -1 }))}
  ${closeup('invalid', `${at(1220, 640, 620)};${REGION}`, pop(S, onBeat(S, part('video', 0, 0.7)), { tilt: 2 }))}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/setup-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Your ride,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 21.2 · Preview a custom workout' });

wipeInto('flat');
bug();

Film.start();
