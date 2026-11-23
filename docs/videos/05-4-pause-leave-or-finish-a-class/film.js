// Slice 5.4 · Pause, leave or finish a class. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the class ride from shots.ts, ridden solo on the shared fixture's fake Bluetooth, with the class
// answered by its API fixture, the YouTube IFrame API by a fake player over the cover, and Playwright's clock moving it.
// Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: pause and resume ──────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 5.4 · Pause, leave, finish',
  words: 'Pause, leave',
  accent: 'or finish.',
  width: 860,
  device: (S) => onBrowser(S, 'paused-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('pause', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-091 AC1 · L2-088 AC3', 'Everything holds,', 'together.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('pause', 0, 0.3)), 'The clock holds at 7:00')}
    ${fact(S, 2, onBeat(S, part('pause', 0, 0.5)), 'The video pauses under “Paused”')}
    ${fact(S, 3, onBeat(S, part('pause', 0, 0.7)), 'The stepper stays on')}
  </div>
  ${closeup('frame', at(900, 300, 920), pop(S, onBeat(S, part('pause', 0, 0.2)), { tilt: 1.5 }))}
  </div>`);

Film.scene('resume', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-091 AC2', 'Resume, from', 'the same second.', 110, 200, 720)}
  ${terminal(S, 'pause, ten seconds, resume', [
    [`paused      ${ok('7:00 / 30:00')}  ${dim('after 10 s')}`],
    [`video       ${ok('432.2 s')}  ${dim('not playing')}`],
    [`resume      ${ok('seekTo(12 + 420)')}  ${dim('then play')}`],
    [`two later   ${ok('7:02')}  ${dim('video 434.2 s')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: a lost bike, leaving and finishing ───────────────────────────────────────────────
Film.scene('lost', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-092 AC4', 'The ride waits', 'for the bike.', 110, 160, 760)}
  ${onBrowser(S, 'lost-xl', 980, 250, 840, onBeat(S, part('lost', 0, 0.15)), { tilt: 2 })}
  ${closeup('lost', at(110, 470, 700), pop(S, onBeat(S, part('lost', 0, 0.5)), { tilt: -1.5 }))}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('back', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-017 AC4 · L2-092 AC4', 'Back, and', 'carrying on.', 110, 200, 720)}
  ${terminal(S, 'the bike drops at 7:00', [
    [`ble          ${dim('disconnected')}  ${dim('clock held')}`],
    [`Reconnect    ${ok('reconnectNow()')}  ${dim('no 3 s wait')}`],
    [`initialise   ${ok('F0 A1 · F0 A3 · F0 B0')}`],
    [`level        ${ok('F0 B1 01 06 A8')}  ${dim('then the clock moves')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.3 });

Film.scene('beat', (S) => {
  const said = (f) => onBeat(S, part('beat', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'TICKER · ClassRideStore', 'A beat of', 'its own.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'TICKER', 'once a second, always', 80, 560, 500, 160, said(0.1), 36)}
  ${node(S, 'node--app', 'followBike()', 'ble disconnected?', 720, 560, 480, 160, said(0.4), 36)}
  ${node(S, '', 'RideClock', 'pause() or resume()', 1320, 560, 500, 160, said(0.7), 36)}
  </div>`;
});

Film.scene('leave', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-093 AC1', 'Leave,', 'no questions.', 110, 200, 720)}
  ${terminal(S, 'press Leave at 7:00', [
    [`address      ${ok('/classes/hiit-cardio-30')}  ${dim('Class Start, 6.3')}`],
    [`confirmation ${ok('none')}`],
    [`video        ${ok('destroyed')}`],
    [`8:30 work    ${dim('level 18 never sent')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('finish', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-093 AC2', 'Thirty minutes,', 'then Results.', 110, 200, 720)}
  ${terminal(S, 'the ride reaches its length', [
    [`clock        ${ok('stops at 30:00')}`],
    [`video        ${ok('paused')}`],
    [`address      ${ok('/results')}  ${dim('Results, 11.1')}`],
    [`submission   ${dim('comes with 10.1')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('awake', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-133 AC3 · AC4', 'Awake, and', 'asked first.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('awake', 0, 0.2)), 'A screen wake lock from the start')}
    ${fact(S, 2, onBeat(S, part('awake', 0, 0.45)), 'Taken again when the tab comes back')}
    ${fact(S, 3, onBeat(S, part('awake', 0, 0.7)), 'Closing the tab asks to confirm')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/paused-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'An icon on a phone,', { accent: 'then its label.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'lost-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('43 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('253 passed')} (253)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Six new specs,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Pause, lost bike, leave, finish, awake, ask')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Seven cases for the screen wake lock')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 5.4 · Pause, leave or finish a class' });

wipeInto('lost');
bug();

Film.start();
