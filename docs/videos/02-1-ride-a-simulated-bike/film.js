// Slice 2.1 · Ride a simulated bike. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Connect Bike from shots.ts, in the development build opened with ?simulate; the frames are
// the real bytes EchelonProtocol encodes for the simulated rider's first seconds, and the production terminals the
// real output of the build and the specs. Every position is a pure function of the scene's time
// (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

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

// ── Act 1: no bike, no chooser ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 2.1 · Ride a simulated bike',
  words: 'No bike?',
  accent: 'Still a ride.',
  width: 820,
  device: (S) => onBrowser(S, 'paired-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('nobike', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Development · ?simulate · L2-024 AC1', 'One click,', 'no chooser.', 110, 160, 720)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('nobike', 0, 0.45)), 'localhost:4200/connect?simulate')}
    ${fact(S, 2, onBeat(S, part('nobike', 0, 0.7)), 'An Echelon EX-5s, paired at once')}
  </div>
  ${onPhone(S, 'connect-xs', 900, 150, 380, onBeat(S, part('nobike', 0, 0.2)), -4)}
  ${onPhone(S, 'paired-xs', 1360, 190, 380, onBeat(S, part('nobike', 0, 0.6)), 4)}
  </div>`);

Film.scene('states', (S) => {
  const said = (f) => onBeat(S, part('states', 0, f));
  const steps = [
    ['Searching…', 'from the rider’s click', 0.25],
    ['Pairing…', 'EX5S-0bf669f1', 0.45],
    ['Paired', 'a check on the card', 0.65],
    ['Home', 'half a second later', 0.85],
  ];
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'Connect Bike · /connect', 'Searching to', 'paired.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${steps.slice(1).map((st, n) => arrow(S, 90 + n * 440 + 360, 640, 90 + (n + 1) * 440 - 10, 640, said(st[2] - 0.06))).join('')}
  </svg>
  ${steps.map(([name, note, f], n) => node(S, n === 3 ? 'node--app' : '', name, note, 90 + n * 440, 560, 360, 160, said(f), 40)).join('')}
  </div>`;
}, { before: 0.4 });

// ── Act 2: what the simulator sends ────────────────────────────────────────────────────────────
Film.scene('frames', (S) => `
  <div class="fill field--bone">
  ${title(S, 'EchelonProtocol · L2-024 AC2', 'The real', 'frames.', 110, 200, 640)}
  ${terminal(S, 'the simulated rider’s first three seconds, as EchelonProtocol encodes them', [
    [dim('# each second of the ticker: a D1, then a D2')],
    ['1 s · 60 rpm'],
    [`  F0 ${ok('D1')} 09 00 01 00 00 00 01 00 3C 00 08`],
    [`  F0 ${ok('D2')} 01 08 CB`],
    ['2 s · 61 rpm'],
    [`  F0 ${ok('D1')} 09 00 02 00 00 00 02 00 3D 00 0B`],
    [`  F0 ${ok('D2')} 01 08 CB`],
    ['3 s · 62 rpm'],
    [`  F0 ${ok('D1')} 09 00 03 00 00 00 03 00 3E 00 0E`],
    [`  F0 ${ok('D2')} 01 08 CB`],
    [dim('# warm-up 60 → 85 rpm over 30 s, then 85 ± 5')],
  ], onBeat(S, part('frames', 0, 0.08)), `${at(800, 170, 1010)};font-size:23px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.3 });

Film.scene('resist', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'Target resistance · L2-025', 'Set it,', 'see it.', 110, 200, 660)}
  ${terminal(S, 'setResistance, parsed back, reported by the next D2', [
    prompt('setResistance(14)'),
    [`  sends   F0 ${ok('B1')} 01 0E B0`],
    [`  next    F0 D2 01 ${ok('0E')} D1`],
    [''],
    prompt('setResistance(40)'),
    [`  sends   F0 B1 01 ${ok('20')} C2`],
    [dim('  clamped to 32, as the bike would')],
    [''],
    ['# checksum: the sum of the bytes, mod 256', 'terminal__dim'],
  ], S.beat(2), `${at(800, 230, 1010)};font-size:25px`, { every: S.BEAT * 0.65 })}
  </div>`, { after: 0.6 });

// ── Act 3: riders never get it ─────────────────────────────────────────────────────────────────
Film.scene('production', (S) => {
  const said = (f) => onBeat(S, part('production', 0, f));
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'Production · L2-024 AC3', 'Swapped out', 'at build time.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 520, 1060, 520, said(0.45))}
    ${arrow(S, 760, 780, 1060, 780, said(0.75))}
  </svg>
  ${node(S, '', 'simulated-bike.provider.ts', 'development · SIMULATOR_ENABLED = true', 110, 440, 640, 160, said(0.25), 34)}
  ${node(S, 'node--app', '…provider.production.ts', 'fileReplacements · no simulator', 1080, 440, 720, 160, said(0.5), 34)}
  ${node(S, '', '?simulate', 'in a production build', 110, 700, 640, 160, said(0.6), 34)}
  ${node(S, 'node--app', 'Web Bluetooth', 'the browser’s chooser', 1080, 700, 720, 160, said(0.8), 34)}
  </div>`;
}, { before: 0.6 });

Film.scene('chooser', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'The production build', 'Not one byte', 'of simulator.', 110, 200, 660)}
  ${terminal(S, 'the production build, and its spec against a fake navigator.bluetooth', [
    prompt('grep -l EX5S-0bf669f1 dist/ride/browser/*.js | wc -l'),
    [`       ${ok('0')}`],
    prompt('grep -l requestDevice dist/ride/browser/*.js | wc -l'),
    ['       1'],
    [''],
    prompt('npx playwright test e2e/simulated-bike.spec.ts'),
    [`  ${ok('✓')} a production build ignores ?simulate`],
    ['    and pairs through Web Bluetooth (L2-024 AC3)'],
    [`  ${dim('the card shows the offered ECH-EX5S-141844')}`],
  ], onBeat(S, part('chooser', 0, 0.1)), `${at(800, 200, 1010)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('bundle', (S) => {
  const said = (f) => onBeat(S, part('bundle', 0, f));
  const bars = [['Initial total', 260.02], ['ride-routes · the bike link', 3.02], ['connect-bike-page', 4.34]];
  const width = (kb) => Math.max(14, kb * 3.4);
  return `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Lazy loading first', 'Loaded', 'when needed.', 110, 200, 640)}
  <div style="${at(800, 260, 1000)}">
    ${bars.map(([name, kb], n) => `
    <div style="margin-bottom:56px" ${S.rise(said(0.15 + n * 0.12))}>
      <p class="kicker" style="color:var(--palette-ink)">${esc(name)} · ${kb.toFixed(2)} kB</p>
      <div style="margin-top:14px;height:44px;background:var(--palette-ink);border-radius:8px;width:${width(kb)}px;transform-origin:left"
        ${S.ref((el, t) => { el.style.transform = `scaleX(${enter(t, said(0.18 + n * 0.12), 0.6, ease.out)})`; })}></div>
    </div>`).join('')}
    <p class="lede" style="color:var(--palette-ink);font-size:34px" ${S.rise(said(0.62))}>The bike link arrives with the first screen, one instance for every screen.</p>
  </div>
  </div>`;
}, { after: 0.7 });

// ── Act 4: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/connect-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Every width,', { accent: 'one pair button.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'paired-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npm test'),
    [`  Tests  ${ok('17 passed')} (17)`],
    [`  ${dim('a fake ticker: nothing sleeps')}`],
    [''],
    prompt('npx playwright test'),
    [`  ${ok('14 passed')}`],
  ], 0.1, `${at(80, 290, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Thirty-one,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), '?simulate pairs with no chooser, then Home')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Production ignores it: Web Bluetooth')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 2.1 · Ride a simulated bike' });

wipeInto('frames');
bug();

Film.start();
