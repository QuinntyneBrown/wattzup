// Slice 6.3 · Class Start. Twelve scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are 30 Minute HIIT Cardio's Class Start from shots.ts, on the shared fixture's answered catalogue,
// the mocks' covers and a fake player. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the class ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 6.3 · Class Start',
  words: 'One look,',
  accent: 'then ride.',
  width: 860,
  device: (S) => onBrowser(S, 'start-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('head', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC1', 'Its page,', 'its facts.', 110, 200, 640)}
  <div style="${at(110, 560, 640)}">
    ${fact(S, 1, onBeat(S, part('head', 0, 0.3)), 'GCN Training · 30 min · HIIT')}
    ${fact(S, 2, onBeat(S, part('head', 0, 0.55)), '← Classes, back to the library')}
  </div>
  ${onBrowser(S, 'start-xl', 820, 220, 980, onBeat(S, part('head', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('plan', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC2', 'What the bike', 'will do.', 110, 200, 720)}
  ${closeup('plan', at(860, 260, 960), pop(S, onBeat(S, part('plan', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('watts', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-099 AC3 · PlanSummary', 'Weighted,', 'not guessed.', 110, 200, 720)}
  ${terminal(S, 'target power × time', [
    [`warm-up    5:00  ${dim('level 8 · 80 rpm')}   143 W`],
    [`work     8×0:30  ${dim('level 24 · 100 rpm')} 427 W`],
    [`recover 15:00    ${dim('level 6 · 72 rpm')}   107 W`],
    [`cool-down  6:00  ${dim('level 6 · 68 rpm')}   101 W`],
    [`average          ${ok('~154 W')}`],
  ], S.beat(2), `${at(860, 280, 980)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('video', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC1 · ADR 0012', 'Parked,', 'and waiting.', 110, 200, 720)}
  ${terminal(S, 'the parked player', [
    [`video      ${dim('QUoToFsMNig')}`],
    [`start      ${ok('12 s')}  ${dim('the sync offset')}`],
    [`controls   ${ok('on')}`],
    [`playing    ${dim('no, until the ride')}`],
    [`leave      ${dim('player destroyed')}`],
  ], S.beat(2), `${at(860, 280, 980)};font-size:24px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('sync', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC3', 'The link,', 'the sync.', 110, 200, 720)}
  ${closeup('sync', at(860, 300, 960), pop(S, onBeat(S, part('sync', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.3 });

// ── Act 2: the choice, the start and the locks ──────────────────────────────────────────────
Film.scene('choice', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-085 AC1 · AC5', 'Alone,', 'for now.', 110, 200, 720)}
  ${closeup('choice', at(900, 240, 880), pop(S, onBeat(S, part('choice', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('start', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-085 AC4', 'Start class,', 'straight in.', 110, 200, 640)}
  <div style="${at(110, 560, 640)}">
    ${fact(S, 1, onBeat(S, part('start', 0, 0.35)), '/classes/hiit-cardio-30/ride?mode=solo')}
  </div>
  ${onBrowser(S, 'ride-xl', 820, 220, 980, onBeat(S, part('start', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('locked', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-082 AC4', 'Locked,', 'back to the library.', 110, 200, 720)}
  ${terminal(S, 'classUnlockedGuard', [
    [`/classes/vice-city-pyramid-30  ${dim('opens at 10')}  → ${ok('/classes')}`],
    [`/classes/no-such-class         ${dim('not held')}     → ${ok('/classes')}`],
    [`/classes/hiit-cardio-30        ${dim('open')}         → ${ok('Class Start')}`],
  ], S.beat(2), `${at(860, 300, 1000)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/start-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one to two.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'start-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('56 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.44 kB')} ${dim('of 288')}`],
    prompt('node tools/verify/verify.mjs'),
    [`  ${ok('all checks passed')}`],
  ], 0.1, `${at(80, 300, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Seven behaviour specs, seven criteria')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Nine unit tests for PlanSummary')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 6.3 · Class Start' });

wipeInto('watts');
bug();

Film.start();
