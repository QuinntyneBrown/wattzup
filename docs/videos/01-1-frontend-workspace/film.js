// Slice 1.1 · Frontend workspace. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). Every app picture is a screenshot of the running app from shots.ts; the diagram, the
// type specimens and the two terminals are drawn, from the workspace and the real output of its
// checks. Every position is a pure function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, pop, closeup, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const win = (S, src, x, y, width, when, opts = {}) => onBrowser(S, src, x, y, width, when, { ...opts });

// ── Act 1: one workspace, one direction ────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 1.1 · Frontend workspace',
  words: 'The ride',
  accent: 'starts here.',
  width: 820,
  device: (S) => win(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

/** A box of the diagram that pops in at `when` and kicks once more at `kick`. */
const node = (S, cls, name, note, x, y, w, h, when, kick = -1) => `<div class="node ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" ${S.ref((el, t) => {
  const p = enter(t, when, 0.35, ease.back);
  const k = kick >= 0 && t >= kick ? Math.exp(-(t - kick) * 6) : 0;
  el.style.opacity = clamp(p * 3);
  el.style.transform = `scale(${lerp(0.7, 1, p) + k * 0.08})`;
})}><span>${esc(name)}<small>${esc(note)}</small></span></div>`;

/** An arrow of the diagram that draws itself from (x1, y1) to (x2, y2) from `when`. */
const arrow = (S, x1, y1, x2, y2, when, { dashed = false, label = '' } = {}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = [[0, 0], [-26, -13], [-26, 13]].map(([dx, dy]) =>
    `${x2 + dx * Math.cos(angle) - dy * Math.sin(angle)},${y2 + dx * Math.sin(angle) + dy * Math.cos(angle)}`).join(' ');
  const colour = 'var(--palette-bone)';
  return `<g ${S.ref((el, t) => { el.style.opacity = t >= when ? 1 : 0; })}>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" stroke="${colour}" stroke-width="6" stroke-linecap="round"
      ${dashed ? 'stroke-dasharray="0.04 0.03"' : 'stroke-dasharray="1 1"'} ${S.ref((el, t) => {
        const p = enter(t, when, 0.5, ease.inOut);
        if (dashed) el.style.opacity = p;
        else el.setAttribute('stroke-dashoffset', String(1 - p));
      })}/>
    <polygon points="${head}" fill="${colour}" ${S.ref((el, t) => { el.style.opacity = enter(t, when + 0.4, 0.15); })}/>
    ${label ? `<text x="${(x1 + x2) / 2 - 92}" y="${(y1 + y2) / 2 + 8}" fill="var(--palette-muted)" style="font:500 26px var(--font-family-sans)" ${S.ref((el, t) => { el.style.opacity = enter(t, when + 0.3, 0.3); })}>${esc(label)}</text>` : ''}
  </g>`;
};

Film.scene('workspace', (S) => {
  const named = (f) => onBeat(S, part('workspace', 0, f));
  const uses = (f) => part('workspace', 1, f);
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Workspace · L2-146', 'Four projects,', 'one way.', 110, 130, 700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 1300, 290, 1110, 462, uses(0.05))}
    ${arrow(S, 1390, 290, 1390, 812, uses(0.15))}
    ${arrow(S, 1480, 290, 1630, 462, uses(0.25))}
    ${arrow(S, 1120, 650, 1280, 812, uses(0.3), { dashed: true, label: 'types' })}
    ${arrow(S, 1620, 650, 1500, 812, uses(0.55))}
  </svg>
  ${node(S, 'node--app', 'ride', 'the app', 1170, 110, 440, 170, named(0.86))}
  ${node(S, '', 'components', 'presentation', 900, 470, 380, 170, named(0.62))}
  ${node(S, '', 'domain', 'the bike and its rules', 1480, 470, 380, 170, named(0.5))}
  ${node(S, '', 'api', 'contracts and clients', 1210, 820, 360, 170, named(0.4), uses(0.8))}
  </div>`;
});

Film.scene('lint', (S) => `
  <div class="fill field--blue">
  ${title(S, 'Boundaries · L2-146', 'Lint holds', 'the line.', 110, 150, 620)}
  <p class="lede" style="${at(110, 640, 600)};font-size:34px" ${S.rise(onBeat(S, part('lint', 0, 0.45)))}>A deliberate wrong import, and Web Bluetooth outside <span class="mono">domain/src/bluetooth/</span>.</p>
  ${terminal(S, 'frontend · a wrong import on purpose, then lint', [
    ['<span class="terminal__prompt">$</span> npm run lint'],
    [''],
    ['projects/domain/src/engine/probe.ts', 'terminal__dim'],
    ["  1:1  <span class='terminal__error'>error</span>  '@telo/components' import is restricted from being used."],
    ['       The domain library depends on api only', 'terminal__dim'],
    ['projects/ride/src/app/probe.ts', 'terminal__dim'],
    ["  2:18 <span class='terminal__error'>error</span>  'navigator.bluetooth' is restricted from being used."],
    ['       Only domain/src/bluetooth/ touches navigator.bluetooth', 'terminal__dim'],
    [''],
    ['✖ 2 problems (2 errors, 0 warnings)', 'terminal__error'],
  ], S.beat(2), `${at(760, 190, 1080)};font-size:22px`, { every: S.BEAT * 0.75 })}
  </div>`);

// ── Act 2: Home in the app shell, the tokens and the fonts ─────────────────────────────────────
Film.scene('home', (S) => `
  <div class="fill field--bone">
  ${title(S, 'App shell · L2-146', 'Home, in', 'the shell.', 110, 70, 900)}
  ${win(S, 'home-xl', 80, 360, 1160, 0.1, { tilt: -1 })}
  ${closeup('header', at(980, 150, 860), pop(S, onBeat(S, part('home', 0, 0.42)), { tilt: 1.5 }))}
  ${closeup('current', at(1420, 540, 260), pop(S, onBeat(S, part('home', 0, 0.8)), { tilt: -2 }))}
  </div>`, { before: 0.3 });

/** A card that shows one bundled face in itself. */
const face = (S, when, name, role, font, y) => `<div class="card" style="${at(780, y, 1040)};justify-content:space-between;background:var(--palette-ink);color:var(--palette-bone)" ${S.rise(when, { y: 50 })}>
  <span style="font:${font}">${esc(name)}</span><span style="font:500 26px var(--font-family-sans);color:var(--palette-muted)">${esc(role)}</span></div>`;

/** A colour token: its swatch and its name. */
const swatch = (token, hex, ring) => `<div style="display:flex;align-items:center;gap:28px;margin-bottom:28px">
  <span style="width:110px;height:110px;border-radius:50%;background:var(${token});box-shadow:0 0 0 4px ${ring}"></span>
  <span><span class="mono" style="display:block;font-size:28px">${esc(token)}</span><span class="mono" style="font-size:24px;color:var(--palette-muted)">${esc(hex)}</span></span></div>`;

Film.scene('tokens', (S) => {
  const said = (f) => onBeat(S, part('tokens', 0, f));
  return `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'Design system · tokens and fonts', 'Built from', 'the system.', 110, 70, 1700)}
  <div class="card" style="${at(110, 400, 600)};display:block;background:var(--palette-ink);color:var(--palette-bone);padding:40px" ${S.rise(said(0.12), { y: 50 })}>
    ${swatch('--palette-ink', '#0a0b0d · ink', 'var(--palette-line)')}
    ${swatch('--palette-signal', '#ff4521 · signal', 'var(--palette-ink)')}
  </div>
  ${face(S, said(0.5), 'Barlow Condensed', 'headlines and numbers', 'italic 800 76px/1 var(--font-family-display)', 400)}
  ${face(S, said(0.6), 'Inter Tight', 'words', '600 60px/1.1 var(--font-family-sans)', 590)}
  ${face(S, said(0.7), 'JetBrains Mono', 'code', '500 50px/1.1 var(--font-family-mono)', 780)}
  </div>`;
}, { after: 0.6 });

// ── Act 3: an address that matches no screen, and the keyboard ─────────────────────────────────
Film.scene('notfound', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'Page not found · L2-145', 'No dead', 'ends.', 110, 70, 1000)}
  ${win(S, 'not-found-xl', 760, 300, 1060, 0.1, { tilt: 1 })}
  ${onPhone(S, 'not-found-xs', 470, 340, 330, S.beat(2), -3)}
  ${closeup('not-found-message', at(1010, 120, 760), pop(S, onBeat(S, part('notfound', 0, 0.35)), { tilt: -1, until: onBeat(S, part('notfound', 1, 0)) }))}
  ${closeup('back-home', at(110, 720, 340), pop(S, onBeat(S, part('notfound', 1, 0)), { tilt: 2 }))}
  </div>`, { before: 0.6 });

Film.scene('keyboard', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 620, 640)}>
  ${title(S, 'Keyboard', 'Tab, then', 'Enter.', 110, 70, 1000)}
  ${win(S, 'skip-xl', 80, 330, 1080, 0.1, { tilt: -1 })}
  ${closeup('skip-link', at(1240, 400, 560), pop(S, onBeat(S, part('keyboard', 0, 0.3)), { tilt: 1.5 }))}
  <p class="lede" style="${at(1240, 700, 600)}" ${S.rise(onBeat(S, part('keyboard', 0, 0.7)))}>Focus lands on the page.</p>
  </div>`, { after: 0.7 });

// ── Act 4: every width, the budget, what the tests prove, and the close ───────────────────────
Film.scene('sizes', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/not-found-${s}.png`, width, height }));
  const grown = part('sizes', 0, 0.5);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to', { accent: 'desktop.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'home-xs', 70, 330, 300, onBeat(S, part('sizes', 0, 0.6)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('budget', (S) => `
  <div class="fill field--signal">
  ${title(S, 'Lazy loading · budgets', 'Only what', 'is needed.', 110, 250, 640)}
  ${terminal(S, 'frontend · the production build', [
    ['<span class="terminal__prompt">$</span> npm run build'],
    ['Initial chunk files | Names          |  Raw size | Estimated transfer size', 'terminal__dim'],
    ['main-ZCZGUHBP.js    | main           | 234.66 kB |                63.50 kB'],
    ['styles-TOEPRD6U.css | styles         |  22.80 kB |                 4.16 kB'],
    ['                    | <span class="terminal__ok">Initial total  | 257.46 kB |                67.66 kB</span>'],
    ['Lazy chunk files    | Names          |  Raw size | Estimated transfer size', 'terminal__dim'],
    ['chunk-ClvskaM9.js   | not-found-page |   1.88 kB |               766 bytes'],
    ['chunk-BPsajwMx.js   | main-shell     |   1.38 kB |               700 bytes'],
    ['chunk-BgcbrSVX.js   | home-page      |   1.12 kB |               429 bytes'],
    ['# angular.json budget: warn above 264 kB, fail above 280 kB', 'terminal__dim'],
  ], S.beat(2), `${at(760, 320, 1110)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${onPhone(S, 'not-found-xs', 150, 90, 430, 0.1, -2)}
  ${title(S, 'What the tests prove', 'Six specs,', 'all green.', 720, 110, 1100)}
  <div style="${at(720, 470, 1080)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Behaviour specs on the production build')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.65)), 'A page error or an off-site request fails them')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 1.1 · Frontend workspace' });

wipeInto('home');
bug();

Film.start();
