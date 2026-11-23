// Slice 7.1 · Browse maps. Twelve scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Map Select for a new rider from shots.ts, on the shared fixture's answered map catalogue.
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

// ── Act 1: the path ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 7.1 · Browse maps',
  words: 'Every map,',
  accent: 'one path.',
  width: 860,
  device: (S) => onBrowser(S, 'maps-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('head', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-046 AC1 · L2-040 AC1', 'Each map', 'opens the next.', 110, 200, 640)}
  <div style="${at(110, 660, 640)}">
    ${fact(S, 1, onBeat(S, part('head', 0, 0.45)), 'Prairie Paceline, open')}
    ${fact(S, 2, onBeat(S, part('head', 0, 0.62)), 'Old Town Criterium, open')}
  </div>
  ${onBrowser(S, 'maps-xl', 820, 220, 980, onBeat(S, part('head', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('catalogue', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-045 AC1 · ADR 0029', 'Seven maps,', 'one file.', 110, 200, 640)}
  ${terminal(S, 'GET /api/maps  (no sign-in)', [
    [`Prairie Paceline     18.4 km    90 m  ${dim('Easy')}`],
    [`Old Town Criterium   14.2 km   140 m  ${dim('Easy')}`],
    [`Cliffside Coast        32 km   410 m  ${dim('Moderate')}`],
    [`Neon Docklands       21.6 km   120 m  ${dim('Moderate')}`],
    [`Dolomites            38.5 km   860 m  ${dim('Hard')}`],
    [`Vice City              24 km    60 m  ${dim('Moderate')}`],
    [`Col du Granit        16.1 km  1240 m  ${ok('Brutal')}`],
  ], S.beat(2), `${at(800, 240, 1040)};font-size:22px`, { every: S.BEAT * 0.4 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('open', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-046 AC2', 'Open,', 'it leads on.', 110, 200, 640)}
  ${closeup('open', at(900, 280, 860), pop(S, onBeat(S, part('open', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('next', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-046 AC3 · L2-041 AC1', 'Next,', 'ringed gold.', 110, 200, 640)}
  ${closeup('next', at(900, 280, 860), pop(S, onBeat(S, part('next', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: locks, the words behind them, and the star rules ─────────────────────────────────
Film.scene('locked', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-046 AC4 · L2-040 AC6', 'Locked,', 'one goal each.', 110, 160, 700)}
  <div style="${at(110, 480, 700)}">
    ${fact(S, 1, onBeat(S, part('locked', 0, 0.35)), 'Finish top 3 vs Bots on Old Town Criterium')}
    ${fact(S, 2, onBeat(S, part('locked', 0, 0.5)), 'Earn 2★ on Cliffside Coast')}
    ${fact(S, 3, onBeat(S, part('locked', 0, 0.65)), 'Reach rider level 10')}
  </div>
  ${closeup('locked', at(960, 280, 820), pop(S, onBeat(S, part('locked', 0, 0.15)), { tilt: 1.5 }))}
  </div>`);

Film.scene('heard', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'WCAG · colour is not the only sign', 'Locked,', 'in words.', 110, 200, 700)}
  ${terminal(S, 'what a screen reader hears', [
    [`&lt;a href="/race/prairie-paceline"&gt;  ${ok('Prairie Paceline')}`],
    [`&lt;button disabled&gt;  ${ok('Cliffside Coast, locked, your next unlock')}`],
    [`&lt;button disabled&gt;  ${dim('Neon Docklands, locked')}`],
    [`stars   ${dim('img · 0 of 3 stars')}`],
  ], S.beat(2), `${at(840, 300, 1020)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('aside', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-046 AC5 · L2-039', 'Three stars,', 'every map.', 110, 200, 700)}
  ${closeup('aside', at(960, 220, 700), pop(S, onBeat(S, part('aside', 0, 0.15)), { tilt: -1.5 }))}
  </div>`);

Film.scene('offline', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-046 AC7 · L2-135 AC3', 'Kept,', 'or try again.', 110, 200, 720)}
  ${closeup('error', at(110, 560, 640), pop(S, onBeat(S, part('offline', 0, 0.45)), { tilt: -1 }))}
  ${onBrowser(S, 'unavailable-xl', 960, 260, 860, onBeat(S, part('offline', 0, 0.15)), { tilt: 2 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/maps-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one path.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'maps-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('56 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('63 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.44 kB')} ${dim('of 288')}`],
  ], 0.1, `${at(80, 280, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Seven behaviour specs, eleven criteria')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The catalogue and its goals, through the API')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 7.1 · Browse maps' });

wipeInto('catalogue');
bug();

Film.start();
