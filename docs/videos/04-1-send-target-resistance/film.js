// Slice 4.1 · Send target resistance. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen sets a target yet, so the frames, clamps and commands are drawn from ResistanceController's
// and the connection's unit tests. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the command ────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 4.1 · Send target resistance',
  words: 'The plan',
  accent: 'sets the hill.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('frame', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'EchelonProtocol · L2-025 AC1', 'B1 is', 'the target.', 110, 200, 660)}
  ${terminal(S, 'a B1 frame, with response', [
    [`${ok('F0')} B1 01 ${ok('0C')} AE  ${dim('level 12')}`],
    [`${ok('F0')} B1 01 ${ok('20')} C2  ${dim('level 32')}`],
    [''],
    ['# checksum = (0xA2 + level) mod 256', 'terminal__dim'],
  ], S.beat(2), `${at(860, 260, 940)};font-size:28px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('clamp', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'ResistanceController · L2-025 AC2', 'One to', 'thirty-two.', 110, 200, 700)}
  ${terminal(S, 'applyPlanLevel(level)', [
    [`40    → ${ok('32')}`],
    [`0     → ${ok('1')}`],
    [`-3    → ${ok('1')}`],
    [`12.6  → ${ok('13')}`],
  ], S.beat(2), `${at(860, 260, 900)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('ack', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-025 AC4', 'Acknowledged,', 'and timed.', 110, 200, 700)}
  ${terminal(S, 'the last command', [
    [`level   ${ok('12')}`],
    [`source  ${ok('plan')}`],
    [`ack     ${ok('34 ms')}  ${dim('write to acknowledgement')}`],
  ], S.beat(2), `${at(860, 260, 940)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('follows', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-026 AC1 · the simulated bike', 'Sent, then', 'reported back.', 110, 200, 700)}
  ${terminal(S, 'the simulated Echelon', [
    [`write  F0 B1 01 0E B0  ${dim('target 14')}`],
    [`next second`],
    [`D2     F0 D2 01 0E D1  ${dim('resistance 14')}`],
  ], S.beat(2), `${at(840, 260, 1000)};font-size:28px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

// ── Act 2: target and resistance, and when control stops ──────────────────────────────────────
Film.scene('apart', (S) => {
  const said = (f) => onBeat(S, part('apart', 0, f));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Target and resistance · L2-026', 'Two numbers,', 'kept apart.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 520, 1080, 620, said(0.4))}
    ${arrow(S, 760, 800, 1080, 700, said(0.6))}
  </svg>
  ${node(S, '', 'Target resistance', 'the plan’s level · 12', 100, 440, 640, 160, said(0.1), 40)}
  ${node(S, '', 'Resistance', 'what the bike reports · 6', 100, 720, 640, 160, said(0.3), 40)}
  ${node(S, 'node--app', 'The readout', '“6 / of 32”, or a dash', 1100, 580, 640, 160, said(0.75), 40)}
  </div>`;
}, { before: 0.3 });

Film.scene('away', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-027 AC4', 'Away? Kept,', 'then first.', 110, 200, 700)}
  ${terminal(S, 'a segment starts during a drop', [
    [`target 12  ${ok('sent')}`],
    [`${dim('the bike drops')}  canControl ${ok('false')}`],
    [`target 18  ${dim('kept by the connection')}`],
    [`${dim('the bike is back')}  init, then ${ok('B1 18')} first`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('refused', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-028 AC4 · FTMS', 'Refused?', 'Read only.', 110, 160, 760)}
  <div style="${at(1000, 260, 800)}">
    ${fact(S, 1, onBeat(S, part('refused', 0, 0.2)), 'The bike refuses Request Control')}
    ${fact(S, 2, onBeat(S, part('refused', 0, 0.45)), 'canControl turns false')}
    ${fact(S, 3, onBeat(S, part('refused', 0, 0.7)), 'Telemetry goes on')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The rider', 'takes over.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Raise and lower by hand · 4.2')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'The workout engine steps the plan · 5.1')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'Steppers, level bars and “Sent to bike”')}
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
    [`  Tests  ${ok('192 passed')} (192)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Eleven new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Clamp, acknowledgement, away and refused')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'End to end on the simulated bike')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 4.1 · Send target resistance' });

wipeInto('apart');
bug();

Film.start();
