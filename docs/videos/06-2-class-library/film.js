// Slice 6.2 · Class library. Twelve scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the Class Library from shots.ts, for the new rider, on the shared fixture's answered catalogue
// and the mocks' covers. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the library ─────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 6.2 · Class library',
  words: 'Every class,',
  accent: 'one shelf away.',
  width: 860,
  device: (S) => onBrowser(S, 'library-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('head', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-081 AC1', 'Classes,', 'either way.', 110, 200, 640)}
  ${onBrowser(S, 'library-xl', 820, 220, 980, onBeat(S, part('head', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('shelves', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-081 AC3', 'Three shelves,', 'by length.', 110, 160, 760)}
  <div style="${at(110, 520, 720)}">
    ${fact(S, 1, onBeat(S, part('shelves', 0, 0.2)), '20 min · Short and sharp')}
    ${fact(S, 2, onBeat(S, part('shelves', 0, 0.4)), '30 min · A proper warm-up')}
    ${fact(S, 3, onBeat(S, part('shelves', 0, 0.6)), '60 min endurance · Steady legs')}
  </div>
  ${onBrowser(S, 'library-l', 960, 240, 860, onBeat(S, part('shelves', 0, 0.1)), { tilt: 2 })}
  </div>`, { before: 0.4 });

Film.scene('card', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-081 AC4', 'One card,', 'the whole class.', 110, 200, 720)}
  ${closeup('open', at(900, 200, 860), pop(S, onBeat(S, part('card', 0, 0.15)), { tilt: 1.5 }))}
  </div>`);

Film.scene('link', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-081 AC4 · AC6', 'Open,', 'it leads on.', 110, 200, 720)}
  ${terminal(S, 'an open card', [
    [`&lt;a href="/classes/hiit-cardio-30"&gt;  ${ok('Class Start')}`],
    [`cover   ${dim('i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg')}`],
    [`group   ${dim('no chip until group sessions can be read')}`],
  ], S.beat(2), `${at(860, 300, 980)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('tabs', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-081 AC2', 'One length,', 'or all.', 110, 160, 720)}
  ${closeup('tabs', at(110, 560, 620), pop(S, onBeat(S, part('tabs', 0, 0.5)), { tilt: -1 }))}
  ${onBrowser(S, 'tier-30-xl', 900, 240, 900, onBeat(S, part('tabs', 0, 0.1)), { tilt: 2 })}
  </div>`, { before: 0.3 });

// ── Act 2: locks and the unavailable catalogue ───────────────────────────────────────────────
Film.scene('locked', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-082 AC2 · AC3', 'Locked,', 'and says why.', 110, 200, 720)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('locked', 0, 0.3)), 'Tempo Paceline opens at level 5')}
    ${fact(S, 2, onBeat(S, part('locked', 0, 0.5)), 'Vice City and Dolomites at 10')}
    ${fact(S, 3, onBeat(S, part('locked', 0, 0.7)), 'Coastal Surges at 20')}
  </div>
  ${closeup('locked', at(960, 220, 820), pop(S, onBeat(S, part('locked', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('focus', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'aria-disabled · WCAG', 'Locked,', 'still heard.', 110, 200, 720)}
  ${terminal(S, 'a locked card', [
    [`&lt;button aria-disabled="true"&gt;  ${ok('focusable')}`],
    [`name    ${dim('Opens at level 10 · 30 Min Vice City Pyramid')}`],
    [`Enter   ${dim('stays on /classes')}`],
  ], S.beat(2), `${at(860, 300, 980)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('unavailable', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-081 AC7', 'Nothing kept,', 'try again.', 110, 200, 720)}
  ${closeup('error', at(110, 600, 700), pop(S, onBeat(S, part('unavailable', 0, 0.45)), { tilt: -1 }))}
  ${onBrowser(S, 'unavailable-xl', 960, 260, 860, onBeat(S, part('unavailable', 0, 0.15)), { tilt: 2 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/library-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one to three.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'library-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('49 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.42 kB')} ${dim('of 288')}`],
    prompt('node tools/verify/verify.mjs'),
    [`  ${ok('all checks passed')}`],
  ], 0.1, `${at(80, 300, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Five behaviour specs, ten criteria')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The first bundle under budget')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 6.2 · Class library' });

wipeInto('link');
bug();

Film.start();
