// Slice 7.2 · Set up a race. Twelve scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Race Setup on Prairie Paceline for a new rider from shots.ts, on the shared fixture's answered map catalogue.
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

// ── Act 1: the map ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 7.2 · Set up a race',
  words: 'Your map,',
  accent: 'your rivals.',
  width: 860,
  device: (S) => onBrowser(S, 'setup-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('head', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-047 AC1 · AC4', 'The map,', 'in three facts.', 110, 200, 640)}
  <div style="${at(110, 600, 640)}">
    ${fact(S, 1, onBeat(S, part('head', 0, 0.35)), '18.4 km · 90 m climbing · Easy')}
    ${fact(S, 2, onBeat(S, part('head', 0, 0.62)), 'Your best: once you have one')}
  </div>
  ${onBrowser(S, 'setup-xl', 820, 220, 980, onBeat(S, part('head', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('stars', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-047 AC2 · L2-039', 'Stars here,', 'three rules.', 110, 200, 640)}
  ${closeup('stars', at(900, 260, 820), pop(S, onBeat(S, part('stars', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('goal', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-047 AC3', 'Your next unlock,', 'in gold.', 110, 200, 700)}
  ${closeup('goal', at(880, 320, 900), pop(S, onBeat(S, part('goal', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: whom to race ──────────────────────────────────────────────────────────────────────
Film.scene('modes', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-048 AC1 · AC2', 'Race against', 'whom?', 110, 160, 700)}
  <div style="${at(110, 480, 680)}">
    ${fact(S, 1, onBeat(S, part('modes', 0, 0.2)), 'Your best time: a ghost of your fastest ride')}
    ${fact(S, 2, onBeat(S, part('modes', 0, 0.38)), 'Bots: nine computer riders, chosen')}
    ${fact(S, 3, onBeat(S, part('modes', 0, 0.56)), 'Riders online: opens at level 3')}
  </div>
  ${closeup('modes', at(960, 200, 820), pop(S, onBeat(S, part('modes', 0, 0.1)), { tilt: 1.5 }))}
  </div>`);

Film.scene('keys', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-048 AC4 · WAI-ARIA', 'One group,', 'the arrow keys.', 110, 200, 700)}
  ${terminal(S, 'radiogroup "Race mode"', [
    [`radio  ${dim('Your best time')}  ${dim('aria-checked="false"')}`],
    [`radio  ${ok('Bots')}            ${ok('aria-checked="true"')}`],
    [`radio  ${dim('Riders online')}   ${dim('aria-disabled="true"')}`],
    [''],
    [`${ok('↑')}  Bots → Your best time`],
    [`${ok('↓')}  Bots → ${dim('(Riders online passed over)')} → Your best time`],
  ], S.beat(2), `${at(830, 280, 1030)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('pack', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-049 AC1 to AC3', 'Pack strength,', 'their pace.', 110, 160, 700)}
  <div style="${at(110, 480, 680)}">
    ${fact(S, 1, onBeat(S, part('pack', 0, 0.3)), 'Easy · around 130 W')}
    ${fact(S, 2, onBeat(S, part('pack', 0, 0.45)), 'Medium · around 190 W, chosen')}
    ${fact(S, 3, onBeat(S, part('pack', 0, 0.6)), 'Hard · around 250 W')}
  </div>
  ${closeup('pack', at(960, 300, 820), pop(S, onBeat(S, part('pack', 0, 0.1)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('start', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-050 AC1 · AC2', 'One button,', 'two starts.', 110, 200, 640)}
  ${terminal(S, 'the start button opens', [
    [`Go to the start line  ${ok('/race/prairie-paceline/ride')}`],
    [`                      ${dim('?mode=bots&pack=hard')}`],
    [''],
    [`Start ride            ${ok('/race/prairie-paceline/ride')}`],
    [`                      ${dim('?mode=solo')}`],
  ], S.beat(2), `${at(780, 280, 1060)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('locked', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-047 AC5', 'Locked,', 'back to Maps.', 110, 200, 640)}
  ${terminal(S, 'openMapGuard', [
    [`/race/old-town-criterium  ${ok('open → Race Setup')}`],
    [`/race/cliffside-coast     ${dim('locked →')} ${ok('/race')}`],
    [`/race/no-such-map         ${dim('unknown →')} ${ok('/race')}`],
  ], S.beat(2), `${at(800, 330, 1040)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/setup-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one setup.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'setup-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('57 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('72 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.48 kB')} ${dim('of 288')}`],
  ], 0.1, `${at(80, 280, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Nine behaviour specs, thirteen criteria')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The planner, the arrow keys and the catalogue')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 7.2 · Set up a race' });

wipeInto('start');
bug();

Film.start();
