// Slice 3.2 · Show live metrics. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen shows readouts or totals until slice 5.2, so the sums, formulas and formats are drawn from
// RideTotals', EnergyModel's and formatMetric's unit tests. Every position is a pure function of the scene's time
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

// ── Act 1: what a running second adds ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 3.2 · Show live metrics',
  words: 'Every second,',
  accent: 'kept.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('distance', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'RideTotals · L2-022 AC2', 'Speed becomes', 'distance.', 110, 200, 660)}
  ${terminal(S, 'each running second', [
    ['distanceKm += speedKmh ÷ 3600'],
    [''],
    [`   1 s at 30 km/h  ${ok('0.0083 km')}`],
    [` 600 s at 30 km/h  ${ok('5.00 km')}`],
    [`3600 s at 30 km/h  ${ok('30.00 km')}`],
  ], S.beat(2), `${at(860, 260, 940)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('paused', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-022 AC3', 'Paused?', 'Nothing grows.', 110, 160, 760)}
  <div style="${at(1000, 260, 800)}">
    ${fact(S, 1, onBeat(S, part('paused', 0, 0.2)), 'A paused ride has no running seconds')}
    ${fact(S, 2, onBeat(S, part('paused', 0, 0.45)), 'Distance and output hold')}
    ${fact(S, 3, onBeat(S, part('paused', 0, 0.7)), 'However long the pause')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('output', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'RideTotals · L2-023 AC5', 'Power becomes', 'output.', 110, 200, 660)}
  ${terminal(S, 'each running second', [
    ['outputKj += powerW ÷ 1000'],
    [''],
    [`10 s at 200 W  ${ok('2.0 kJ')}`],
    [` 1 s at 300 W  ${ok('2.3 kJ')}`],
    [''],
    ['# unknown power adds nothing', 'terminal__dim'],
  ], S.beat(2), `${at(860, 260, 940)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('energy', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'EnergyModel · L2-023 AC4', 'Work becomes', 'energy.', 110, 200, 660)}
  ${terminal(S, 'a 24% efficient rider', [
    ['avg power = output ÷ running seconds'],
    [''],
    ['kcal = round(208 × 760 ÷ 1000'],
    ['             ÷ 0.24 ÷ 4.184)'],
    [`     = ${ok('157 kcal')}`],
  ], S.beat(2), `${at(800, 260, 1020)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

// ── Act 2: how it shows, where it goes ────────────────────────────────────────────────────────
Film.scene('unknown', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'formatMetric · L2-020 AC5, L2-022 AC4', 'Unknown?', 'A dash.', 110, 200, 700)}
  ${terminal(S, 'every readout, as text', [
    [`formatMetric(317)       ${ok('"317"')}`],
    [`formatMetric(30, 1)     ${ok('"30.0"')}`],
    [`formatMetric(null)      ${ok('"—"')}`],
    [''],
    [`formatDistance(2.2449)  ${ok('"2.24 km"')}`],
  ], S.beat(2), `${at(860, 260, 960)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('shared', (S) => {
  const said = (f) => onBeat(S, part('shared', 0, f));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'The ride-readout families', 'One source,', 'three screens.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 640, 1080, 420, said(0.3))}
    ${arrow(S, 760, 640, 1080, 640, said(0.5))}
    ${arrow(S, 760, 640, 1080, 860, said(0.7))}
  </svg>
  ${node(S, '', 'Totals and telemetry', 'RideTotals · formatMetric', 100, 560, 640, 160, said(0.1), 40)}
  ${node(S, 'node--app', 'Class tiles', 'slice 5.2', 1100, 350, 640, 140, said(0.35), 40)}
  ${node(S, 'node--app', 'Race power panel', 'slice 7.3', 1100, 570, 640, 140, said(0.55), 40)}
  ${node(S, 'node--app', 'Custom dashboard', 'slice 21.3', 1100, 790, 640, 140, said(0.75), 40)}
  </div>`;
}, { before: 0.3 });

Film.scene('simulated', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-024 · end to end', 'A minute', 'on the simulator.', 110, 200, 700)}
  ${terminal(S, 'the simulated Echelon, 60 running seconds', [
    [`D1 + D2 each second  ${dim('SimulatedBikeConnection')}`],
    [`→ cadence, level 14  ${dim('BikeTelemetry')}`],
    [`→ speed, power       ${dim('SpeedModel · PowerModel')}`],
    [`→ ${ok('distance, output, energy')}  ${dim('RideTotals')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The ride screens', 'show them.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'The ride clock ticks the totals · 5.1')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'Class Ride shows readouts, end to end · 5.2')}
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
    [`  Tests  ${ok('156 passed')} (156)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Twenty new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'One case per row of L2-022 and L2-023')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'End to end on the simulated bike')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 3.2 · Show live metrics' });

wipeInto('shared');
bug();

Film.start();
