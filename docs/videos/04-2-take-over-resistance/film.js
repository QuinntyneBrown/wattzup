// Slice 4.2 · Take over resistance. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen has a stepper yet, so the nudges, picks and refusals are drawn from ResistanceController's
// unit tests. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: by hand ────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 4.2 · Take over resistance',
  words: 'Your legs,',
  accent: 'your call.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('raise', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'nudge(±1) · L2-028 AC1', 'One level', 'at a time.', 110, 200, 660)}
  ${terminal(S, 'the target, press by press', [
    [`plan     ${ok('12')}`],
    [`raise    ${ok('13')}  ${dim('sent · manual')}`],
    [`lower    ${ok('12')}  ${dim('sent · manual')}`],
    [`lower    ${ok('11')}  ${dim('sent · manual')}`],
  ], S.beat(2), `${at(860, 260, 940)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('limits', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-028 AC1', 'Never past', 'the ends.', 110, 200, 660)}
  ${terminal(S, 'clamped to 1 to 32', [
    [`32 + raise  → ${ok('32')}`],
    [` 1 + lower  → ${ok('1')}`],
  ], S.beat(2), `${at(860, 260, 900)};font-size:32px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('frombike', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'BikeTelemetry · resistance', 'No target yet?', 'Start from the bike.', 110, 200, 760)}
  ${terminal(S, 'before any target', [
    [`the bike reports  ${ok('8')}`],
    [`raise             ${ok('9')}  ${dim('sent · manual')}`],
  ], S.beat(2), `${at(960, 300, 860)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('pick', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'setManual(level) · L2-028 AC2', 'Pick a level,', 'get that level.', 110, 200, 760)}
  ${terminal(S, 'a “Level N” bar', [
    [`Level 20  → ${ok('target 20')}`],
    [`           ${dim('sent · manual')}`],
  ], S.beat(2), `${at(960, 300, 860)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

// ── Act 2: the plan comes back, and when the rider cannot ─────────────────────────────────────
Film.scene('plan', (S) => {
  const said = (f) => onBeat(S, part('plan', 0, f));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-028 AC3', 'The next segment,', 'the plan again.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'Plan · 12', 'segment 3 starts', 80, 560, 500, 160, said(0.1), 40)}
  ${node(S, 'node--app', 'Rider · 18', 'by hand, mid-segment', 720, 560, 480, 160, said(0.4), 40)}
  ${node(S, '', 'Plan · 10', 'segment 4 starts', 1320, 560, 500, 160, said(0.7), 40)}
  </div>`;
}, { before: 0.3 });

Film.scene('away', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'canControl · L2-028 AC4', 'Bike away?', 'Hands off.', 110, 160, 760)}
  <div style="${at(1000, 260, 800)}">
    ${fact(S, 1, onBeat(S, part('away', 0, 0.2)), 'Raise and lower send nothing')}
    ${fact(S, 2, onBeat(S, part('away', 0, 0.45)), 'Picking a level sends nothing')}
    ${fact(S, 3, onBeat(S, part('away', 0, 0.7)), 'The target stays the plan’s')}
  </div>
  </div>`);

Film.scene('source', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'The last command', 'Who asked,', 'and how fast.', 110, 200, 700)}
  ${terminal(S, 'last()', [
    [`level   ${ok('11')}`],
    [`source  ${ok('manual')}  ${dim('or plan')}`],
    [`ack     ${ok('30 ms')}`],
  ], S.beat(2), `${at(860, 260, 900)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The ride screens', 'bring the controls.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Steppers: “Resistance 12 of 32” · 5.2, 7.3')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'Thirty-two level bars · 21.3')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'All switched off with no bike')}
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
    [`  Tests  ${ok('199 passed')} (199)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Seven new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'One case per row of L2-028 AC1 to AC4')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The plan always takes back over')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 4.2 · Take over resistance' });

wipeInto('plan');
bug();

Film.start();
