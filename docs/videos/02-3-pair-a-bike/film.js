// Slice 2.3 · Pair a bike. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are Connect Bike and Home from shots.ts, made by the shared fixture's fake Bluetooth standing in for the
// browser's chooser and the bike. The init terminal is the order the fake bike recorded in the pairing spec. Every
// position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: one press ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 2.3 · Pair a bike',
  words: 'One press.',
  accent: 'Paired.',
  width: 820,
  device: (S) => onBrowser(S, 'pairing-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('press', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'requestDevice · L2-012', 'One press,', 'the browser’s list.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('press', 0, 0.3)), 'Echelon’s service or FTMS · Heart Rate optional')}
    ${fact(S, 2, onBeat(S, part('press', 0, 0.55)), 'Opened only by the press, a user gesture')}
  </div>
  ${closeup('hint', at(1000, 260, 800), pop(S, onBeat(S, part('press', 0, 0.7)), { tilt: 1.5 }))}
  </div>`);

Film.scene('blocked', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'SecurityError · L2-012 AC3, AC4', 'Blocked?', 'Said plainly.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('blocked', 0, 0.2)), 'List closed: back to the start, no error')}
    ${fact(S, 2, onBeat(S, part('blocked', 0, 0.5)), 'A policy: the reason, and Try again')}
  </div>
  ${onPhone(S, 'blocked-xs', 1080, 130, 420, onBeat(S, part('blocked', 0, 0.45)), 3)}
  </div>`, { before: 0.4 });

Film.scene('identity', (S) => {
  const said = (f) => onBeat(S, part('identity', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'bikeIdentity() · L2-011 AC3', 'Its model,', 'its own number.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 560, 1080, 470, said(0.4))}
    ${arrow(S, 760, 640, 1080, 730, said(0.6))}
  </svg>
  ${node(S, '', 'Advertised', 'ECH-EX5S-141844', 100, 520, 640, 160, said(0.2), 44)}
  ${node(S, 'node--app', 'Name', 'Echelon EX-5s', 1100, 380, 640, 160, said(0.45), 44)}
  ${node(S, 'node--app', 'Identifier', 'EX5S-141844', 1100, 650, 640, 160, said(0.65), 44)}
  ${node(S, '', 'Any other bike', 'its own name, as advertised', 100, 860, 640, 130, said(0.8), 34)}
  </div>`;
});

// ── Act 2: what pairing writes ────────────────────────────────────────────────────────────────
Film.scene('init', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'GattWriteQueue · L2-013', 'Subscribe,', 'then three writes.', 110, 200, 660)}
  ${terminal(S, 'what the fake bike recorded, in order', [
    [`subscribe ${dim('0bf669f4 · notify')}`],
    [`write ${ok('F0 A1 00 91')}     ${dim('device info')}`],
    [`write ${ok('F0 A3 00 93')}     ${dim('≥ 300 ms later · range')}`],
    [`write ${ok('F0 B0 01 01 A2')}  ${dim('≥ 300 ms later · start')}`],
    [''],
    ['# one at a time, each with response', 'terminal__dim'],
  ], S.beat(2), `${at(800, 260, 1010)};font-size:24px`, { every: S.BEAT * 0.65 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('pairing', (S) => {
  const said = (f) => onBeat(S, part('pairing', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-011 AC4, AC5', 'Pairing…,', 'then Paired.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 900, 640, 1020, 640, said(0.55))}
  </svg>
  ${closeup('pairing-card', at(110, 430, 760), pop(S, said(0.15), { tilt: -1.5 }))}
  ${closeup('paired-card', at(1050, 430, 760), pop(S, said(0.6), { tilt: 1.5 }))}
  </div>`;
});

Film.scene('ftms', (S) => `
  <div class="fill field--bone">
  ${title(S, 'FtmsLink · L2-014', 'Other bikes,', 'by FTMS.', 110, 140, 760)}
  <div style="${at(110, 500, 760)}">
    ${fact(S, 1, onBeat(S, part('ftms', 0, 0.3)), 'Subscribe 2AD2 and 2AD9, read 2AD6')}
    ${fact(S, 2, onBeat(S, part('ftms', 0, 0.55)), 'Request Control; set only after 80 00 01')}
    ${fact(S, 3, onBeat(S, part('ftms', 0, 0.8)), 'Refused or silent: read only')}
  </div>
  ${onPhone(S, 'ftms-xs', 1080, 130, 420, onBeat(S, part('ftms', 0, 0.15)), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: remembered ─────────────────────────────────────────────────────────────────────────
Film.scene('remember', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'RememberedBikeStore · L2-015 AC1', 'Remembered,', 'reconnected.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('remember', 0, 0.3)), 'One record in this browser')}
    ${fact(S, 2, onBeat(S, part('remember', 0, 0.6)), 'getDevices(): Home, and no list')}
  </div>
  ${onBrowser(S, 'home-xl', 860, 300, 960, onBeat(S, part('remember', 0, 0.2)), { tilt: 2 })}
  </div>`, { after: 0.7 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The next slice', 'keeps it connected.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Keepalive, reconnects, the ble status · 2.4')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.55)), 'Read only status · once it has a mock')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.8)), 'Signal strength · watchAdvertisements()')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 4: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/pairing-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Every width,', { accent: 'one press.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'blocked-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('25 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('62 passed')} (62)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Eighty-seven,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Chooser, init order, FTMS control, a refusal')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Remembered: Home, and no list')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 2.3 · Pair a bike' });

wipeInto('ftms');
bug();

Film.start();
