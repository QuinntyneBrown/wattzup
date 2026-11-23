// 00 · Meet Telo Ride: the pitch. Twelve scenes on the 92.99 BPM grid of Beautiful Boom Bap
// (a bar is 2.58 s): the moment, the problem, meet, pairing, every screen, live Race & 3D courses,
// a showcase of the best worlds created so far, Classes, progression & unlocks, custom workouts,
// coming next (free in-browser AI), and the close with Telo Ride's purpose.
// Every position is a pure function of scene time (docs/videos/README.md).
const { enter, ease, prog, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, counter, lockup, photo, opening, closing, wipeInto, zoomOut, zoomIn, bug } = Film.kit;

/** A shot saved by an earlier slice's film, read from its folder: kit helpers prefix `shots/`. */
const built = (slice, name) => `../../${slice}/shots/${name}`;
/** A photograph the design system ships, as a picture of its own. */
const picture = (name, style, attrs) => `<img class="closeup" src="../../design-system/assets/images/${name}.jpg" alt="" style="${style}" ${attrs}>`;
/** A captured screenshot of one of Telo Ride's 3D worlds or courses from docs/screenshots/. */
const worldShot = (rel, style, attrs) => `<img class="closeup" src="../../screenshots/${rel}" alt="" style="${style}" ${attrs}>`;
/** A captured screenshot from another video folder, as a standalone closeup. */
const sliceShot = (slice, name, style, attrs) => `<img class="closeup" src="../${slice}/shots/${name}.png" alt="" style="${style}" ${attrs}>`;
/** The beat at or after the fraction `f` of line `n` of scene `id`. */
const beatOf = (S, id, f, n = 0) => onBeat(S, part(id, n, f));

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;

const pill = (S, when, label, x, y) => `
  <div style="position:absolute;left:${x}px;top:${y}px;padding:10px 22px;border-radius:999px;background:rgb(10 11 13 / 0.86);color:var(--palette-bone);outline:2px solid var(--palette-signal);font:700 24px/1.1 var(--font-family-sans);letter-spacing:0.06em;text-transform:uppercase" ${S.rise(when, { y: 14, dur: 0.25 })}>${esc(label)}</div>`;

// ── Act 1: another evening on the bike ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Another evening on the bike',
  words: 'Same wall,',
  accent: 'same numbers.',
  width: 900,
  device: (S) => picture('machines/echelon-ex5s', at(1060, 230, 760), pop(S, S.beat(3), { tilt: 2 })),
});

Film.scene('problem', (S) => {
  const dull = (n, f, text) => fact(S, n, beatOf(S, 'problem', f), `<span class="mono">${text}</span>`);
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Then tomorrow', 'No reason', 'to come back.', 110, 180, 900)}
  <div style="${at(1120, 260, 680)}">
    ${dull(1, 0.1, '30:00 on the clock')}
    ${dull(2, 0.3, '150 W, give or take')}
    ${dull(3, 0.5, '80 rpm, again')}
  </div>
  <p class="lede" style="${at(110, 820, 1000)}" ${S.rise(beatOf(S, 'problem', 0.6))}>The bike is smart. The ride isn’t.</p>
  </div>`;
});

// ── Act 2: meet Telo Ride, pairing & every screen ─────────────────────────────────────────────
Film.scene('meet', (S) => `
  <div class="fill field--signal">
  <div style="${at(110, 270, 1000)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Meet</p>
    <div style="margin-top:36px" ${S.rise(S.beat(1), { y: 40 })}>${lockup(130)}</div>
    <p class="lede" style="margin-top:56px;font-weight:700" ${S.rise(beatOf(S, 'meet', 0.45))}>Your smart bike at home,<br>turned into a game.</p>
  </div>
  ${onPhone(S, built('02-3-pair-a-bike', 'default-xs'), 1300, 110, 430, beatOf(S, 'meet', 0.3), 4)}
  </div>`, { before: 0.3 });

Film.scene('pair', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Over Bluetooth', 'One press.', 'Paired.', 110, 140, 760)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, beatOf(S, 'pair', 0.4), 'Reads your power')}
    ${fact(S, 2, beatOf(S, 'pair', 0.65), 'Sets the resistance')}
  </div>
  ${onPhone(S, built('02-3-pair-a-bike', 'pairing-xs'), 960, 110, 400, beatOf(S, 'pair', 0.1), -3)}
  ${closeup(built('02-3-pair-a-bike', 'paired-card'), at(1340, 640, 480), pop(S, beatOf(S, 'pair', 0.3), { tilt: 2 }))}
  </div>`);

Film.scene('everywhere', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]]
    .map(([s, width, height]) => ({ src: `shots/${built('02-3-pair-a-bike', `pairing-${s}`)}.png`, width, height }));
  const grown = part('everywhere', 0, 1);
  const remembered = beatOf(S, 'everywhere', 0, 1);
  return `
  <div class="fill field--panel" ${zoomOut(S, 960, 560)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Chrome or Edge,', { accent: 'any screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 720, style: 'position:absolute;left:0;right:0;top:210px' })}
  <p class="lede" style="position:absolute;left:0;right:0;top:965px;text-align:center;font-weight:700" ${S.ref((el, t) => {
    el.style.opacity = enter(t, S.beat(3), 0.3);
    el.textContent = t < remembered ? 'A phone, a tablet, a laptop or a desktop.' : 'Pair once. Remembered next time.';
  })}></p>
  </div>`;
}, { after: 0.7 });

// ── Act 3: live today — Race, best 3D worlds, Classes, Progression & Custom Workout ───────────
Film.scene('race', (S) => `
  <div class="fill field--ink" ${zoomIn(S)}>
  <div style="position:absolute;inset:0;background:url('../../screenshots/courses/ibiza/sky-01-strip.jpg') center / cover no-repeat;opacity:0.24"></div>
  ${title(S, 'Race · 3D Courses in WebGPU', 'Chase', 'your ghost.', 90, 84, 720)}
  <div style="${at(90, 420, 620)}">
    ${fact(S, 1, beatOf(S, 'race', 0.15, 1), 'Your best-time ghost')}
    ${fact(S, 2, beatOf(S, 'race', 0.45, 1), 'A pack of bots')}
    ${fact(S, 3, beatOf(S, 'race', 0.75, 1), 'Live riders online')}
  </div>
  ${worldShot('courses/ibiza/sky-01-strip.jpg', at(770, 210, 1060), pop(S, beatOf(S, 'race', 0.2, 0), { tilt: 1.5 }))}
  ${pill(S, beatOf(S, 'race', 0.55, 0), 'Ibiza Sunset Strip · WebGPU', 810, 770)}
  </div>`, { before: 0.7 });

Film.scene('worlds', (S) => {
  const b = (f, n = 0) => beatOf(S, 'worlds', f, n);
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, '3D Worlds · Built for the Saddle', 'Best worlds', 'created so far.', 90, 50, 1740)}
  ${worldShot('courses/ibiza/sky-01-strip.jpg', at(90, 270, 550), pop(S, b(0.28, 0), { tilt: -1.5 }))}
  ${pill(S, b(0.32, 0), 'Ibiza Sunset Strip', 110, 520)}
  ${sliceShot('08-2-draw-the-route-world', 'neon-docklands-xl', at(685, 270, 550), pop(S, b(0.45, 0), { tilt: 1 }))}
  ${pill(S, b(0.48, 0), 'Neon Docklands', 705, 520)}
  ${sliceShot('08-2-draw-the-route-world', 'vice-city-xl', at(1280, 270, 550), pop(S, b(0.6, 0), { tilt: -1 }))}
  ${pill(S, b(0.62, 0), 'Vice City', 1300, 520)}

  ${worldShot('courses/realism-on-coast.jpg', at(90, 625, 550), pop(S, b(0.72, 0), { tilt: 1 }))}
  ${pill(S, b(0.75, 0), 'Cliffside Coast', 110, 875)}
  ${worldShot('cinqueterre/course-032-path-crossings.jpg', at(685, 625, 550), pop(S, b(0.84, 0), { tilt: -1 }))}
  ${pill(S, b(0.87, 0), 'Cinque Terre', 705, 875)}
  ${worldShot('haleakala/course-028-fruit-stands.jpg', at(1280, 625, 550), pop(S, b(0.94, 0), { tilt: 1.5 }))}
  ${pill(S, b(0.96, 0), 'Haleakalā', 1300, 875)}

  <p class="kicker" style="${at(90, 990, 1740)};text-align:center;color:var(--palette-muted)" ${S.rise(b(0.2, 1))}>WebGPU &amp; WebGL 2 · Quality tiers from Low to Ultra · Smooth on a tablet</p>
  </div>`;
});

Film.scene('classes', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Classes · Solo or Group', 'Ride along,', 'together.', 110, 70, 1700)}
  ${picture('classes/power-20', at(110, 360, 810), pop(S, beatOf(S, 'classes', 0.18), { tilt: -2 }))}
  ${picture('classes/threshold-20', at(1000, 360, 810), pop(S, beatOf(S, 'classes', 0.52), { tilt: 2 }))}
  <p class="lede" style="${at(110, 935, 1700)};text-align:center" ${S.rise(beatOf(S, 'classes', 0.72))}>Synced video · Live group output board · Automatic resistance</p>
  </div>`);

Film.scene('progress', (S) => {
  const said = (f) => beatOf(S, 'progress', f);
  return `
  <div class="fill field--gold">
  ${title(S, 'One progression', 'Level up.', 'Unlock more.', 90, 68, 1740)}
  <div style="${at(90, 355, 680)}">
    ${fact(S, 1, said(0.25), 'XP & levels 1 to 30')}
    ${fact(S, 2, said(0.45), 'Daily riding streaks')}
    ${fact(S, 3, said(0.65), 'Stars on every map')}
    ${fact(S, 4, said(0.82), 'Celebrated map unlocks')}
  </div>
  ${onBrowser(S, built('11-3-celebrate-an-unlock', 'unlock-xl'), 830, 305, 1000, said(0.3), { tilt: 1.5 })}
  ${S.confetti([said(0.82)], { count: 160 })}
  </div>`;
}, { before: 0.3 });

Film.scene('custom', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Profile · Custom Workout', 'Your own', 'intervals.', 90, 68, 1740)}
  ${onBrowser(S, built('21-3-ride-a-custom-workout', 'ride-xl'), 110, 315, 1020, beatOf(S, 'custom', 0.18), { tilt: -1 })}
  <div style="${at(1190, 385, 640)}">
    ${fact(S, 1, beatOf(S, 'custom', 0.25), 'Build & preview intervals')}
    ${fact(S, 2, beatOf(S, 'custom', 0.55), 'Full manual or plan control')}
    ${fact(S, 3, beatOf(S, 'custom', 0.8), 'Finishes offline on-device')}
  </div>
  </div>`);

// ── Act 4: Coming next — Free In-Browser AI ───────────────────────────────────────────────────
Film.scene('ai', (S) => `
  <div class="fill field--signal">
  ${title(S, 'Coming Next · Free In-Browser AI', 'Local AI.', 'Zero cloud bills.', 90, 68, 1740)}
  <div style="${at(90, 355, 840)}">
    ${fact(S, 1, beatOf(S, 'ai', 0.08, 1), 'Hands-free “Hey Telo” voice cockpit')}
    ${fact(S, 2, beatOf(S, 'ai', 0.28, 1), 'Live Kokoro-82M kart-race announcer')}
    ${fact(S, 3, beatOf(S, 'ai', 0.48, 1), 'Cadence coach & JSON workout builder')}
    ${fact(S, 4, beatOf(S, 'ai', 0.68, 1), 'Opt-in saddle vision & Chrome Canary AI')}
  </div>
  ${counter(S, [
    [beatOf(S, 'ai', 0.2, 0), '55'],
    [beatOf(S, 'ai', 0.55, 0), 'LOCAL'],
    [beatOf(S, 'ai', 0.78, 1), '$0'],
  ], `${at(980, 410, 850)};text-align:center;color:var(--palette-ink);font-size:260px`)}
  <p class="lede" style="${at(980, 745, 850)};text-align:center;font-weight:700" ${S.rise(beatOf(S, 'ai', 0.78, 1))}>Free Hugging Face ONNX models.<br>Nothing ever leaves your device.</p>
  </div>`, { before: 0.3 });

closing('close', { kicker: 'Your bike, now a game', after: 1 });

wipeInto('meet', 'var(--palette-bone)');
wipeInto('progress', 'var(--palette-signal)');
wipeInto('ai', 'var(--palette-ink)');
bug();

Film.start();
