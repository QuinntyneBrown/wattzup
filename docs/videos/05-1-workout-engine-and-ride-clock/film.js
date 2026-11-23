// Slice 5.1 · Workout engine and ride clock. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen rides a plan yet, so the clock, ticks, segments and commands are drawn from the unit tests
// of RideClock, RideTicker, planStateAt and WorkoutEngine. Every position is a pure function of the scene's time
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

// ── Act 1: the clock ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 5.1 · Engine and clock',
  words: 'A plan',
  accent: 'on a clock.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('clock', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'RideClock · L2-133 AC1', 'Monotonic,', 'never counted.', 110, 200, 680)}
  ${terminal(S, 'performance.now() − start − paused', [
    [`start        ${ok('0:00')}`],
    [`+7 s         ${ok('0:07')}`],
    [`pause, +5 s  ${ok('0:07')}  ${dim('stands still')}`],
    [`resume, +3 s ${ok('0:10')}`],
  ], S.beat(2), `${at(860, 260, 940)};font-size:28px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('ticker', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'RideTicker · L2-134 AC2', 'Every second,', 'once.', 110, 200, 660)}
  ${terminal(S, 'ticks', [
    [`0:01  ${ok('1')}`],
    [`0:02  ${ok('2')}`],
    [`0:03  ${ok('3')}  ${dim('woken at each whole second')}`],
  ], S.beat(2), `${at(860, 260, 900)};font-size:30px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('plan', (S) => {
  const said = (f) => onBeat(S, part('plan', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Plan · segments', 'Warm-up, work,', 'recover.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'Warm-up · 5:00', 'level 8 · aim 80 rpm', 80, 560, 500, 160, said(0.1), 40)}
  ${node(S, 'node--app', 'Work · 10:00', 'level 18 · aim 100 rpm', 720, 560, 480, 160, said(0.4), 40)}
  ${node(S, '', 'Recover · 5:00', 'level 6 · aim 72 rpm', 1320, 560, 500, 160, said(0.7), 40)}
  </div>`;
});

Film.scene('state', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'planStateAt · L2-089 AC1', 'Where the plan', 'stands.', 110, 200, 700)}
  ${terminal(S, 'planStateAt(plan, 7:30)', [
    [`segment       ${ok('work')}  ${dim('2 of 3')}`],
    [`time left     ${ok('7:30')}`],
    [`progress      ${ok('25%')}`],
    [`target power  ${ok('334 W')}  ${dim('L2-023 AC3')}`],
  ], S.beat(2), `${at(860, 260, 960)};font-size:28px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

// ── Act 2: the engine sends, and holds ────────────────────────────────────────────────────────
Film.scene('boundary', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'WorkoutEngine · L2-027 AC1', 'A new segment,', 'a new level.', 110, 200, 720)}
  ${terminal(S, 'the bike, segment by segment', [
    [`0:00  warm-up   ${ok('B1 → 8')}`],
    [`4:59  ${dim('still warm-up')}`],
    [`5:00  work      ${ok('B1 → 18')}  ${dim('under 500 ms')}`],
    [`next D2         ${ok('resistance 18')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.3 });

Film.scene('paused', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-027 AC3', 'Paused?', 'Nothing moves.', 110, 160, 760)}
  <div style="${at(1000, 260, 800)}">
    ${fact(S, 1, onBeat(S, part('paused', 0, 0.2)), 'The clock stands still')}
    ${fact(S, 2, onBeat(S, part('paused', 0, 0.45)), 'No segment changes')}
    ${fact(S, 3, onBeat(S, part('paused', 0, 0.7)), 'No command is sent')}
  </div>
  </div>`);

Film.scene('hidden', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-133 AC2 · a hidden tab', 'Ten minutes away,', 'caught up at once.', 110, 200, 720)}
  ${terminal(S, 'the tab is hidden at 0:01', [
    [`${dim('timers throttled for 10 minutes')}`],
    [`the tab is shown   tick ${ok('10:01')}`],
    [`segment            ${ok('work')}  ${dim('not warm-up')}`],
    [`sent               ${ok('18')}  ${dim('only the current level')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The class ride', 'takes the stage.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'The class ride screen · 5.2')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'The video in sync · 5.3')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'Pause, leave or finish · 5.4')}
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
    [`  Tests  ${ok('223 passed')} (223)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Twenty-four new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Clock, ticker, plan and engine, on fake timers')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The simulated bike follows the plan')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 5.1 · Workout engine and ride clock' });

wipeInto('boundary');
bug();

Film.start();
