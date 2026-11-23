// Slice 2.4 · Keep the bike connected. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike and the radio. The terminals show the writes the fake bike recorded in
// frontend/e2e/keep-the-bike-connected.spec.ts. Every position is a pure function of the scene's time
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

// ── Act 1: the status ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 2.4 · Keep the bike connected',
  words: 'An hour long.',
  accent: 'Still connected.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('status', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'AppHeaderBike · L2-019 AC1', 'The bike,', 'by name.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('status', 0, 0.3)), 'From lg, 1024 px, at the end of the header')}
    ${fact(S, 2, onBeat(S, part('status', 0, 0.6)), 'Read aloud: “Echelon EX-5s connected”')}
  </div>
  ${closeup('bike-on', at(1000, 380, 760), pop(S, onBeat(S, part('status', 0, 0.2)), { tilt: 1.5 }))}
  </div>`);

Film.scene('offline', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'bikeStatus() · L2-019 AC2', 'Not connected?', 'Said three ways.', 110, 160, 760)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('offline', 0, 0.3)), 'Red, and the Bluetooth-off icon')}
    ${fact(S, 2, onBeat(S, part('offline', 0, 0.55)), 'Titled “Bike not connected”')}
    ${fact(S, 3, onBeat(S, part('offline', 0, 0.8)), 'Read aloud: “… not connected”')}
  </div>
  ${closeup('bike-off', at(1000, 380, 760), pop(S, onBeat(S, part('offline', 0, 0.2)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: keep it, lose it, get it back ──────────────────────────────────────────────────────
Film.scene('keepalive', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'KeepaliveScheduler · L2-016', 'Once a second,', 'by the clock.', 110, 200, 660)}
  ${terminal(S, 'what the fake bike recorded, once paired', [
    [`write ${ok('F0 A0 01 01 92')}  ${dim('+1.0 s')}`],
    [`write ${ok('F0 A0 01 01 92')}  ${dim('+2.0 s')}`],
    [`write ${ok('F0 A0 01 01 92')}  ${dim('+3.0 s')}`],
    [`write ${ok('F0 A0 01 01 92')}  ${dim('+4.0 s')}`],
    [`write ${ok('F0 A0 01 01 92')}  ${dim('+5.0 s')}`],
    [''],
    ['# 4 to 6 in any 5 s, each with response', 'terminal__dim'],
  ], S.beat(2), `${at(800, 240, 1010)};font-size:24px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('drop', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'DeviceReconnector · L2-017 AC1', 'Dropped?', 'Tried again.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('drop', 0, 0.3)), 'The keepalives stop at once')}
    ${fact(S, 2, onBeat(S, part('drop', 0, 0.55)), 'Every 3 s, the same bike, no list')}
  </div>
  ${onBrowser(S, 'dropped-xl', 860, 300, 960, onBeat(S, part('drop', 0, 0.2)), { tilt: 2 })}
  </div>`);

Film.scene('back', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-017 AC2, AC4', 'Back,', 'target first.', 110, 200, 660)}
  ${terminal(S, 'the bike switched on again', [
    [`subscribe ${dim('0bf669f4 · notify')}`],
    [`write ${ok('F0 A1 00 91')}`],
    [`write ${ok('F0 A3 00 93')}`],
    [`write ${ok('F0 B0 01 01 A2')}`],
    [`write ${ok('B1 · the last target')}  ${dim('before anything else')}`],
    [`write ${ok('F0 A0 01 01 92')}  ${dim('then the keepalive')}`],
  ], S.beat(2), `${at(800, 240, 1010)};font-size:24px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4 });

Film.scene('retry', (S) => {
  const said = (f) => onBeat(S, part('retry', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'reconnectNow() · L2-017 AC3, AC5', 'Try now,', 'say why.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 520, 1080, 520, said(0.3))}
    ${arrow(S, 760, 800, 1080, 800, said(0.7))}
  </svg>
  ${node(S, '', 'Reconnect', 'reconnectNow()', 100, 440, 640, 160, said(0.15), 44)}
  ${node(S, 'node--app', 'An attempt at once', 'the 3 s wait cancelled', 1100, 440, 640, 160, said(0.35), 40)}
  ${node(S, '', 'An error', 'NetworkError', 100, 720, 640, 160, said(0.55), 44)}
  ${node(S, 'node--app', 'The console, as text', 'name: message · lastError', 1100, 720, 640, 160, said(0.75), 40)}
  </div>`;
});

Film.scene('radio', (S) => `
  <div class="fill field--bone">
  ${title(S, 'getAvailability() · L2-018', 'Bluetooth off?', 'Said plainly.', 110, 140, 760)}
  <div style="${at(110, 520, 760)}">
    ${fact(S, 1, onBeat(S, part('radio', 0, 0.3)), 'An alert in place of the device card')}
    ${fact(S, 2, onBeat(S, part('radio', 0, 0.55)), 'Never “no bike found”')}
    ${fact(S, 3, onBeat(S, part('radio', 0, 0.8)), 'Try again: back to pairing')}
  </div>
  ${onPhone(S, 'bluetooth-off-xs', 1080, 130, 420, onBeat(S, part('radio', 0, 0.15)), -3)}
  </div>`, { before: 0.3 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The ride screens', 'bring their own.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Reconnect banners on the ride screens')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'Custom ride’s status and Bluetooth panel · 21.3')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'A worker ticker for hidden tabs · 18.2')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 3: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'From a laptop’s width,', { accent: 'the bike.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'bluetooth-off-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('30 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('91 passed')} (91)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'A hundred and twenty-one,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Keepalives, a drop, a retry, the target first')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The header’s status; Bluetooth off')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 2.4 · Keep the bike connected' });

wipeInto('radio');
bug();

Film.start();
