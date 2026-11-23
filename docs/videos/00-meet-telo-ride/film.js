// 00 · Meet Telo Ride: the pitch. Ten scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s), in the
// arc of popkin's "Meet Popkin": the moment, the problem, meet, what it does, what comes next, the close. Every
// screenshot is of the running app, saved by slice 2.3's shots.ts and read from its folder, as popkin's pitch reads
// its pictures from earlier films. What is not built yet (Race, Classes, the progression, the custom workout) is
// said as coming next and drawn: cards over the design system's photographs, as slice 2.3 drew "Still to come".
// Every position is a pure function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, esc } = Film;
const { at, part, onBeat, onPhone, closeup, pop, fact, counter, lockup, photo, opening, closing, wipeInto, zoomOut, zoomIn, bug } = Film.kit;

/** A shot saved by slice 2.3's film, read from its folder: the kit's helpers prefix `shots/`. */
const built = (name) => `../../02-3-pair-a-bike/shots/${name}`;
/** A photograph the design system ships, as a picture of its own. */
const picture = (name, style, attrs) => `<img class="closeup" src="../../design-system/assets/images/${name}.jpg" alt="" style="${style}" ${attrs}>`;
/** The beat at or after the fraction `f` of line `n` of scene `id`. */
const beatOf = (S, id, f, n = 0) => onBeat(S, part(id, n, f));

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;

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

// ── Act 2: meet Telo Ride, and what it does today ─────────────────────────────────────────────
Film.scene('meet', (S) => `
  <div class="fill field--signal">
  <div style="${at(110, 270, 1000)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Meet</p>
    <div style="margin-top:36px" ${S.rise(S.beat(1), { y: 40 })}>${lockup(130)}</div>
    <p class="lede" style="margin-top:56px;font-weight:700" ${S.rise(beatOf(S, 'meet', 0.45))}>Your smart bike at home,<br>turned into a game.</p>
  </div>
  ${onPhone(S, built('default-xs'), 1300, 110, 430, beatOf(S, 'meet', 0.3), 4)}
  </div>`, { before: 0.3 });

Film.scene('pair', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Over Bluetooth', 'One press.', 'Paired.', 110, 140, 760)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, beatOf(S, 'pair', 0.4), 'Reads your power')}
    ${fact(S, 2, beatOf(S, 'pair', 0.65), 'Sets the resistance')}
  </div>
  ${onPhone(S, built('pairing-xs'), 960, 110, 400, beatOf(S, 'pair', 0.1), -3)}
  ${closeup(built('paired-card'), at(1340, 640, 480), pop(S, beatOf(S, 'pair', 0.3), { tilt: 2 }))}
  </div>`);

Film.scene('everywhere', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]]
    .map(([s, width, height]) => ({ src: `shots/${built(`pairing-${s}`)}.png`, width, height }));
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

// ── Act 3: what comes next, drawn ─────────────────────────────────────────────────────────────
Film.scene('race', (S) => `
  <div class="fill field--photo" style="${photo('worlds/oldtown')}" ${zoomIn(S)}>
  ${title(S, 'Coming next · Race', 'Chase', 'your ghost.', 110, 140, 900, 'headline')}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, beatOf(S, 'race', 0.35), 'Your best-time ghost')}
    ${fact(S, 2, beatOf(S, 'race', 0.6), 'A pack of bots')}
    ${fact(S, 3, beatOf(S, 'race', 0.85), 'Other riders')}
  </div>
  </div>`, { before: 0.7 });

Film.scene('classes', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Coming next · Classes', 'Ride along,', 'together.', 110, 80, 1700)}
  ${picture('classes/power-20', at(110, 400, 860), pop(S, beatOf(S, 'classes', 0.15), { tilt: -2 }))}
  ${picture('classes/threshold-20', at(1050, 400, 760), pop(S, beatOf(S, 'classes', 0.55), { tilt: 2 }))}
  <p class="kicker" style="${at(110, 960, 1700)};text-align:center" ${S.rise(beatOf(S, 'classes', 0.8))}>Alone · or with a group</p>
  </div>`);

Film.scene('progress', (S) => {
  const said = (f) => beatOf(S, 'progress', f);
  return `
  <div class="fill field--gold">
  ${title(S, 'Coming next · One progression', 'Level up.', 'Unlock more.', 110, 90, 1700)}
  <div style="${at(110, 440, 720)}">
    ${fact(S, 1, said(0.3), 'XP for every ride')}
    ${fact(S, 2, said(0.45), 'Rider levels')}
    ${fact(S, 3, said(0.6), 'Stars on every map')}
    ${fact(S, 4, said(0.8), 'Map unlocks')}
  </div>
  ${counter(S, [[said(0.3), 'XP'], [said(0.45), 'LVL'], [said(0.6), '★★★'], [said(0.8), 'OPEN']], `${at(900, 470, 920)};text-align:center`)}
  ${S.confetti([said(0.8)], { count: 160 })}
  </div>`;
}, { before: 0.3 });

/** A custom workout drawn as its blocks: work in signal, recovery in ink, each rising on its beat. */
const BLOCKS = [[2, 0.3], [6, 1], [2, 0.3], [7, 1], [2, 0.3], [8, 1], [2, 0.3], [6, 1], [3, 0.2]];
Film.scene('custom', (S) => {
  const from = beatOf(S, 'custom', 0.2);
  const total = BLOCKS.reduce((sum, [w]) => sum + w, 0);
  let x = 0;
  const bars = BLOCKS.map(([w, h], i) => {
    const left = (x / total) * 100;
    x += w;
    return `<div style="position:absolute;bottom:0;left:${left}%;width:calc(${(w / total) * 100}% - 10px);border-radius:10px 10px 0 0;background:var(${h > 0.5 ? '--palette-signal' : '--palette-ink'})" ${S.ref((el, t) => {
      el.style.height = `${h * 100 * ease.out(prog(t, from + i * S.BEAT * 0.5, 0.4))}%`;
    })}></div>`;
  }).join('');
  return `
  <div class="fill field--bone">
  ${title(S, 'Coming next · Profile', 'Your own', 'intervals.', 110, 120, 1700)}
  <div style="${at(110, 440, 1700)};height:440px;border-bottom:6px solid var(--palette-ink)">${bars}</div>
  <p class="lede" style="${at(110, 930, 1700)}" ${S.rise(beatOf(S, 'custom', 0.7))}>A custom workout, built your way.</p>
  </div>`;
});

closing('close', { kicker: 'Your bike, now a game', after: 1 });

wipeInto('meet', 'var(--palette-bone)');
wipeInto('progress', 'var(--palette-signal)');
bug();

Film.start();
