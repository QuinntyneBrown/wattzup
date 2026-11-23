// Slice 3.1 · Decode bike notifications. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen shows telemetry until slice 3.2, so the bytes, the formulas and the tables are drawn from
// the decoders' and BikeTelemetry's unit tests. Every position is a pure function of the scene's time
// (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;

/** A box of a diagram that pops in at `when`; `size` scales its name. */
const node = (S, cls, name, note, x, y, w, h, when, size = 64) => `<div class="node ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${size}px" ${S.ref((el, t) => {
  const p = enter(t, when, 0.35, ease.back);
  el.style.opacity = clamp(p * 3);
  el.style.transform = `scale(${lerp(0.7, 1, p)})`;
})}><span>${esc(name)}<small>${esc(note)}</small></span></div>`;

/** An arrow that draws itself from (x1, y1) to (x2, y2) from `when`. */
const arrow = (S, x1, y1, x2, y2, when) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = [[0, 0], [-24, -12], [-24, 12]].map(([dx, dy]) =>
    `${x2 + dx * Math.cos(angle) - dy * Math.sin(angle)},${y2 + dx * Math.sin(angle) + dy * Math.cos(angle)}`).join(' ');
  return `<g ${S.ref((el, t) => { el.style.opacity = t >= when ? 1 : 0; })}>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" stroke="var(--palette-bone)" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="1 1" ${S.ref((el, t) => el.setAttribute('stroke-dashoffset', String(1 - enter(t, when, 0.4, ease.inOut))))}/>
    <polygon points="${head}" fill="var(--palette-bone)" ${S.ref((el, t) => { el.style.opacity = enter(t, when + 0.3, 0.15); })}/>
  </g>`;
};

// ── Act 1: the Echelon's frames ───────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 3.1 · Decode bike notifications',
  words: 'Every number,',
  accent: 'from bytes.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('resistance', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'EchelonFrameDecoder · L2-020 AC1', 'D2 is', 'resistance.', 110, 200, 660)}
  ${terminal(S, 'a D2 frame, byte by byte', [
    [`${ok('F0')}  ${dim('marker')}`],
    [`${ok('D2')}  ${dim('type: resistance')}`],
    [`${ok('01')}  ${dim('length: one byte')}`],
    [`${ok('0C')}  ${dim('byte 3: the level')}`],
    [`${ok('CF')}  ${dim('checksum')}`],
    [''],
    ['→ resistance 12'],
  ], S.beat(2), `${at(860, 240, 940)};font-size:26px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('cadence', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'EchelonFrameDecoder · L2-020 AC2', 'D1 is', 'cadence.', 110, 200, 660)}
  ${terminal(S, 'a D1 frame, 13 bytes', [
    [`${dim('F0 D1 09')}  ${dim('marker, type, length')}`],
    [`${dim('00 05')}  ${dim('elapsed: 5 s')}`],
    [`${dim('00 00 00 00')}  ${dim('revolutions')}`],
    [`${ok('00 50')}  ${dim('bytes 9–10, big-endian')}`],
    [`${dim('00 1F')}  ${dim('pad, checksum')}`],
    [''],
    ['→ cadence 80 rpm'],
  ], S.beat(2), `${at(860, 240, 940)};font-size:26px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4 });

Film.scene('ignored', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-020 AC3, AC4', 'Not a frame?', 'Ignored.', 110, 160, 760)}
  <div style="${at(1000, 220, 800)}">
    ${fact(S, 1, onBeat(S, part('ignored', 0, 0.1)), 'Shorter than 4 bytes')}
    ${fact(S, 2, onBeat(S, part('ignored', 0, 0.25)), 'Byte 0 is not F0')}
    ${fact(S, 3, onBeat(S, part('ignored', 0, 0.4)), 'A type it does not know')}
    ${fact(S, 4, onBeat(S, part('ignored', 0, 0.55)), 'A D1 under 13 bytes')}
    ${fact(S, 5, onBeat(S, part('ignored', 0, 0.7)), 'Every D0')}
  </div>
  <div style="${at(110, 560, 760)}">
    ${fact(S, 6, onBeat(S, part('ignored', 0, 0.85)), 'null, never an error')}
  </div>
  </div>`);

// ── Act 2: FTMS, estimates, and a stale number ────────────────────────────────────────────────
Film.scene('ftms', (S) => {
  const said = (f) => onBeat(S, part('ftms', 0, f));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'IndoorBikeDataDecoder · L2-021 AC1', 'The flags', 'decide.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 620, 1080, 460, said(0.3))}
    ${arrow(S, 760, 620, 1080, 780, said(0.6))}
  </svg>
  ${node(S, '', 'Flags', 'uint16, little-endian', 100, 540, 640, 160, said(0.1), 44)}
  ${node(S, 'node--app', 'Read', 'speed · cadence · power · heart rate', 1100, 380, 700, 160, said(0.35), 40)}
  ${node(S, '', 'Skipped by size', 'averages · distance · energy', 1100, 700, 700, 160, said(0.65), 40)}
  </div>`;
}, { before: 0.3 });

Film.scene('estimate', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'SpeedModel · PowerModel · ADR 0003', 'No power?', 'Estimated.', 110, 200, 660)}
  ${terminal(S, 'the formulas, half to even', [
    ['speed = round(80 × 0.37497622, 1)'],
    [`      = ${ok('30.0 km/h')}  ${dim('L2-022 AC1')}`],
    [''],
    ['power = max(0, round(95 × (0.55 + 18 × 0.155)))'],
    [`      = ${ok('317 W')}  ${dim('L2-023 AC1')}`],
    [''],
    [`target(aim 100, level 18) = ${ok('334 W')}  ${dim('AC3')}`],
  ], S.beat(2), `${at(780, 240, 1040)};font-size:24px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('reported', (S) => {
  const said = (f) => onBeat(S, part('reported', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'BikeTelemetry · L2-021 AC2 to AC4', 'Reported wins,', 'else estimate.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 520, 1080, 520, said(0.3))}
    ${arrow(S, 760, 800, 1080, 800, said(0.7))}
  </svg>
  ${node(S, '', 'Power reported', '212 W from the bike', 100, 440, 640, 160, said(0.15), 44)}
  ${node(S, 'node--app', 'Shown as it is', 'powerIsEstimate: false', 1100, 440, 640, 160, said(0.35), 40)}
  ${node(S, '', 'Power left out', 'flags bit 6 clear', 100, 720, 640, 160, said(0.55), 44)}
  ${node(S, 'node--app', 'The estimate, or —', 'when resistance is unknown', 1100, 720, 640, 160, said(0.75), 40)}
  </div>`;
});

Film.scene('stale', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-020 AC5', 'Five quiet seconds,', 'a dash.', 110, 200, 700)}
  ${terminal(S, 'BikeTelemetry, on the clock', [
    [`0.0 s  D1 ${ok('80 rpm')}  ${dim('timer starts')}`],
    [`4.0 s  D1 ${ok('80 rpm')}  ${dim('timer restarts')}`],
    [`6.0 s  D2 ${ok('level 12')}  ${dim('no cadence')}`],
    [`9.0 s  ${ok('cadence —')}  ${ok('power —')}`],
    [''],
    ['# never a number that is no longer true', 'terminal__dim'],
  ], S.beat(2), `${at(860, 240, 940)};font-size:26px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'Slice 3.2', 'shows them.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Power, cadence, speed and resistance readouts')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'Distance, output and energy totals')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'Heart rate from a strap · 3.3')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 3: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Every width,', { accent: 'the same Home.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'connect-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('30 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('136 passed')} (136)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Forty-five new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'One case per row of L2-020 to L2-023')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'End to end on the simulated bike')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 3.1 · Decode bike notifications' });

wipeInto('ftms');
bug();

Film.start();
