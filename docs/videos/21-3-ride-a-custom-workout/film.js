// Slice 21.3 · Ride a custom workout. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the custom ride at 6:52 at 1440 px and three other widths, its readouts, Power vs. plan and bike control
// close up, the ride with its video, flat resistance, and Start ride off under a plan Telo Ride refuses, from
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
/** The bike control, to the end of Sent to bike. */
const ASIDE = 'aspect-ratio:372/860;object-fit:cover;object-position:top';

// ── Act 1: the plan takes the bike ────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 21.3 · Ride a custom workout',
  words: 'The plan',
  accent: 'takes the bike.',
  width: 900,
  device: (S) => onBrowser(S, 'ride-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('interval', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-102 · L2-100 AC2', 'Recover,', 'round 1 of 8.', 110, 160, 820)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, onBeat(S, part('interval', 0, 0.3)), '1:38 left · next: Work 0:30 at level 24')}
    ${fact(S, 2, onBeat(S, part('interval', 0, 0.5)), '107 W on a 107 W target · aim for 72 rpm')}
    ${fact(S, 3, onBeat(S, part('interval', 0, 0.7)), 'Level 6 sent as the recovery starts')}
  </div>
  ${closeup('readouts', `${at(960, 300, 880)};${REGION}`, pop(S, onBeat(S, part('interval', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('trace', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-103 AC3', 'Power', 'against the plan.', 110, 120, 1500)}
  ${closeup('trace', `${at(110, 400, 1100)};${REGION}`, pop(S, onBeat(S, part('trace', 0, 0.15)), { tilt: 1 }))}
  ${terminal(S, 'custom-ride.spec.ts', [
    [`  max     ${ok('600 W')} ${dim('300 W for flat')}`],
    [`  ticks   ${ok('every 5:00')}`],
    [`  points  ${ok('≤ 900')} ${dim('a fixed buffer')}`],
  ], part('trace', 0, 0.45), `${at(1260, 560, 560)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('video', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-103 AC2 · L2-088', 'In sync,', 'at your offset.', 110, 160, 720)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('video', 0, 0.3)), 'The ride clock plus 0:12, no controls')}
    ${fact(S, 2, onBeat(S, part('video', 0, 0.5)), 'Seeks back past 1.5 s of drift')}
    ${fact(S, 3, onBeat(S, part('video', 0, 0.7)), 'Ride progress: 6:52 of 30:00')}
  </div>
  ${closeup('video', `${at(880, 160, 920)};${PAGE}`, pop(S, onBeat(S, part('video', 0, 0.1)), { tilt: -1 }))}
  </div>`);

// ── Act 2: by hand, flat, saved, and every width ──────────────────────────────────────────────
Film.scene('control', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('control', `${at(180, 70, 400)};${ASIDE}`, pop(S, onBeat(S, part('control', 0, 0.1)), { tilt: 1 }))}
  ${title(S, 'L2-028 · L2-029', 'Yours,', 'until the next interval.', 760, 160, 1000)}
  ${terminal(S, 'Sent to bike · BLE · 0bf669f1', [
    [`  6:52  RES ${ok('20')} ${dim('· manual')}  ack 0ms`],
    [`  5:30  RES ${ok('6')} ${dim('· plan')}    ack 0ms`],
    [`  5:00  RES ${ok('24')} ${dim('· plan')}   ack 0ms`],
    [`  ${dim('… the newest 50')}`],
  ], part('control', 0, 0.35), `${at(760, 520, 820)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('flat', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-101 AC2', 'Level 12,', 'the whole ride.', 110, 160, 720)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('flat', 0, 0.35)), 'Steady · Last stretch · aim for 85')}
    ${fact(S, 2, onBeat(S, part('flat', 0, 0.55)), 'Power vs. plan to 300 W')}
  </div>
  ${closeup('flat', `${at(880, 160, 920)};${PAGE}`, pop(S, onBeat(S, part('flat', 0, 0.1)), { tilt: 1 }))}
  </div>`);

Film.scene('saved', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-099 AC4 · L2-094 AC3 · L2-100 AC3', 'Saved', 'for next time.', 110, 160, 860)}
  ${terminal(S, 'PUT /api/riders/me/custom-workout', [
    [`  ${ok('204')}  ${dim('the draft, and its 17 segments')}`],
    [`  GET  ${ok('200')} ${dim('Custom workout opens on it')}`],
    [`  ${ok('400')}  plan_invalid ${dim('under 5 s, past level 32, not 1 to 180 min')}`],
  ], part('saved', 0, 0.3), `${at(110, 520, 880)};font-size:19px`, { every: S.BEAT * 0.7 })}
  ${closeup('refused', `${at(1180, 90, 520)};${REGION}`, pop(S, onBeat(S, part('saved', 0, 0.5)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/ride-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The custom ride,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 21.3 · Ride a custom workout' });

wipeInto('control');
bug();

Film.start();
