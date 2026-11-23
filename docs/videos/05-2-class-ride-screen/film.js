// Slice 5.2 · Class ride screen. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the class ride from shots.ts, ridden solo on the shared fixture's fake Bluetooth with the class
// answered by its API fixture and Playwright's clock moving the ride. Every position is a pure function of the scene's
// time (docs/videos/README.md).
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

// ── Act 1: the screen ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 5.2 · Class ride screen',
  words: 'Pick a class,',
  accent: 'ride it.',
  width: 860,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('header', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'ClassHeader · L2-087 AC1', 'The class,', 'on the clock.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('header', 0, 0.3)), '“30 Minute HIIT Cardio · Solo”')}
    ${fact(S, 2, onBeat(S, part('header', 0, 0.55)), 'A timer: “7:00 of 30:00”')}
    ${fact(S, 3, onBeat(S, part('header', 0, 0.8)), 'No Finish shortcut in production')}
  </div>
  ${closeup('name', at(960, 300, 820), pop(S, onBeat(S, part('header', 0, 0.2)), { tilt: 1.5 }))}
  ${closeup('clock', at(1260, 620, 460), pop(S, onBeat(S, part('header', 0, 0.5)), { tilt: -2 }))}
  </div>`);

Film.scene('segment', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'ClassSegment · L2-089 AC1', 'Where you are', 'in the plan.', 110, 160, 760)}
  ${closeup('warmup', at(110, 520, 700), pop(S, onBeat(S, part('segment', 0, 0.2)), { tilt: -1.5, until: onBeat(S, part('segment', 0, 0.55)) }))}
  ${closeup('segment', at(960, 330, 860), pop(S, onBeat(S, part('segment', 0, 0.5)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('power', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'PowerModel.onTarget · L2-089 AC2, AC3', 'On target,', 'or the gap.', 110, 160, 760)}
  ${closeup('power', at(110, 520, 560), pop(S, onBeat(S, part('power', 0, 0.3)), { tilt: -1.5 }))}
  ${closeup('power-under', at(740, 520, 560), pop(S, onBeat(S, part('power', 0, 0.55)), { tilt: 1 }))}
  ${closeup('cadence', at(1370, 520, 480), pop(S, onBeat(S, part('power', 0, 0.8)), { tilt: 1.5 }))}
  </div>`);

Film.scene('stepper', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'ClassResist · L2-026, L2-028', 'Your hand', 'on the hill.', 110, 160, 760)}
  ${closeup('stepper-unknown', at(110, 560, 560), pop(S, onBeat(S, part('stepper', 0, 0.25)), { tilt: -1.5 }))}
  ${closeup('stepper', at(1000, 380, 700), pop(S, onBeat(S, part('stepper', 0, 0.5)), { tilt: 1.5 }))}
  </div>`, { before: 0.4, after: 0.6 });

// ── Act 2: what it sends, where the class comes from ─────────────────────────────────────────
Film.scene('sent', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-027 AC1 · L2-133 AC2', 'Each boundary,', 'one level.', 110, 200, 720)}
  ${terminal(S, 'B1 writes to the bike', [
    [`0:00  warm-up   ${ok('F0 B1 01 08 AA')}`],
    [`${dim('the clock jumps to 7:00')}`],
    [`7:00  recover   ${ok('F0 B1 01 06 A8')}  ${dim('not the 18 it passed')}`],
    [`+ − −           ${ok('7, 6, 5')}  ${dim('the rider’s own')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.3 });

Film.scene('source', (S) => {
  const said = (f) => onBeat(S, part('source', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'CLASSES_API · ADR 0014', 'One request,', 'then ride.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'GET /api/classes/{id}', 'title, length, plan', 80, 560, 500, 160, said(0.1), 36)}
  ${node(S, 'node--app', 'ClassRideStore', 'starts as it arrives', 720, 560, 480, 160, said(0.4), 36)}
  ${node(S, '', 'Clock · engine', 'the plan on the bike', 1320, 560, 500, 160, said(0.7), 36)}
  </div>`;
});

Film.scene('bundle', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'Bundle budget · AGENTS.md', 'HttpClient,', 'paid for once.', 110, 200, 720)}
  ${terminal(S, 'ng build ride', [
    [`initial   260 kB  ${dim('before')}`],
    [`initial   ${ok('284 kB')}  ${dim('+20.7 kB raw, +5.3 kB sent')}`],
    [`budget    ${ok('warn 288 · fail 300 kB')}`],
    [`${dim('platform-browser imports common/http')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The class', 'comes alive.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'The video in sync · 5.3')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'Pause, leave or finish · 5.4')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'The catalogue API · 6.1')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Two columns,', { accent: 'then one row.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'class-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('34 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('238 passed')} (238)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Four new specs,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Header, segment, power, cadence, stepper')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'On a fake clock and a fake bike')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 5.2 · Class ride screen' });

wipeInto('sent');
bug();

Film.start();
