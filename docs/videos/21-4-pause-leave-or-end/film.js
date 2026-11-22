// Slice 21.4 · Pause, leave or end. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the custom ride paused at 6:52, with its bike lost, waiting for a bike and with Bluetooth off; "Leave
// this ride?" under Library at 1440 px and three other widths; and Profile after a ride too short to save, from
// shots.ts. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the ride stops when you do ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 21.4 · Pause, leave or end',
  words: 'It stops',
  accent: 'when you do.',
  width: 900,
  device: (S) => onBrowser(S, 'paused', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('pause', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-105 AC1', 'Paused', 'at 6:52.', 110, 160, 720)}
  <div style="${at(110, 520, 720)}">
    ${fact(S, 1, onBeat(S, part('pause', 0, 0.3)), 'The clock, the plan and the readouts hold')}
    ${fact(S, 2, onBeat(S, part('pause', 0, 0.5)), 'The resistance stays in your hands')}
    ${fact(S, 3, onBeat(S, part('pause', 0, 0.7)), 'Pause becomes Resume')}
  </div>
  ${closeup('paused', `${at(880, 160, 920)};${PAGE}`, pop(S, onBeat(S, part('pause', 0, 0.1)), { tilt: -1 }))}
  ${closeup('resume', `${at(1380, 760, 420)};${REGION}`, pop(S, onBeat(S, part('pause', 0, 0.7)), { tilt: 2 }))}
  </div>`);

Film.scene('lost', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-105 AC2, AC3', 'Lost the bike,', 'saved at 6:52.', 110, 160, 820)}
  ${closeup('lost-alert', `${at(110, 470, 700)};${REGION}`, pop(S, onBeat(S, part('lost', 0, 0.35)), { tilt: 1 }))}
  ${closeup('lost', `${at(900, 120, 920)};${PAGE}`, pop(S, onBeat(S, part('lost', 0, 0.1)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('nobike', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-106', 'No bike,', 'no start.', 110, 160, 720)}
  <div style="${at(110, 520, 720)}">
    ${fact(S, 1, onBeat(S, part('nobike', 0, 0.3)), '0:00, Start and End off, every level off')}
    ${fact(S, 2, onBeat(S, part('nobike', 0, 0.5)), 'Connect bike, then Start')}
  </div>
  ${closeup('no-bike', `${at(880, 120, 920)};${PAGE}`, pop(S, onBeat(S, part('nobike', 0, 0.1)), { tilt: 1 }))}
  ${closeup('bluetooth-off', `${at(1240, 660, 560)};${REGION}`, pop(S, onBeat(S, part('nobike', 0, 0.65)), { tilt: -2 }))}
  </div>`);

// ── Act 2: leave or end, and every width ──────────────────────────────────────────────────────
Film.scene('leave', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('leave', `${at(200, 120, 520)};${REGION}`, pop(S, onBeat(S, part('leave', 0, 0.1)), { tilt: 1 }))}
  ${title(S, 'L2-107', 'Leave', 'this ride?', 860, 160, 900)}
  <div style="${at(860, 500, 820)}">
    ${fact(S, 1, onBeat(S, part('leave', 0, 0.35)), 'Paused while you decide')}
    ${fact(S, 2, onBeat(S, part('leave', 0, 0.5)), 'Save, discard, or keep riding')}
    ${fact(S, 3, onBeat(S, part('leave', 0, 0.65)), 'Escape keeps riding')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('end', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-108 · L2-105 AC4', 'End,', 'then Profile.', 110, 160, 760)}
  ${terminal(S, 'POST /api/rides', [
    [`  kind     ${ok('custom')}`],
    [`  seconds  ${ok('412')} ${dim('6:52, as far as it went')}`],
    [`  xp       ${ok('Finished · on target · streak')}`],
    [`  ${dim('under a minute: nothing sent')}`],
  ], part('end', 0, 0.3), `${at(110, 500, 760)};font-size:19px`, { every: S.BEAT * 0.6 })}
  ${closeup('too-short', `${at(940, 160, 860)};${PAGE}`, pop(S, onBeat(S, part('end', 0, 0.55)), { tilt: -1 }))}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/leave-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Leave this ride,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 21.4 · Pause, leave or end' });

wipeInto('leave');
bug();

Film.start();
