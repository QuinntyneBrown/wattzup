// Slice 3.3 · Show heart rate. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Home and Connect Bike from shots.ts, made by the shared fixture's fake Bluetooth standing in
// for the bike. No screen connects a strap or shows heart rate yet, so the bytes, the strap's steps and the sums are
// drawn from the decoder's, the strap's, HeartRateSource's and HeartRateStats' unit tests. Every position is a pure
// function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the strap ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 3.3 · Show heart rate',
  words: 'Your heart,',
  accent: 'beside your power.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('decode', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'The decoder · L2-031 AC2', 'Bit 0', 'decides.', 110, 200, 660)}
  ${terminal(S, 'Heart Rate Measurement, 0x2A37', [
    [`${ok('00')} 8E      ${dim('bit 0 clear: uint8')}`],
    ['→ 142 bpm'],
    [''],
    [`${ok('01')} 2C 01   ${dim('bit 0 set: uint16, little-endian')}`],
    ['→ 300 bpm'],
    [''],
    ['# too short: ignored, never an error', 'terminal__dim'],
  ], S.beat(2), `${at(860, 240, 940)};font-size:26px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('chooser', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'The strap · L2-031 AC1, AC2', 'Choose it', 'once.', 110, 200, 700)}
  ${terminal(S, 'what the fake strap recorded', [
    [`requestDevice  ${ok('filters: services 0x180D')}`],
    [`connect        ${dim('Polar H10 9A1B2C3D')}`],
    [`subscribe      ${ok('0x2A37')}  ${dim('Heart Rate Measurement')}`],
    [`remember       ${dim('telo-ride.strap')}`],
  ], S.beat(2), `${at(860, 260, 960)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('remembered', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'reconnectRemembered() · L2-031 AC3', 'Next time,', 'no list.', 110, 160, 760)}
  <div style="${at(1000, 260, 800)}">
    ${fact(S, 1, onBeat(S, part('remembered', 0, 0.2)), 'The strap’s id, kept on this device')}
    ${fact(S, 2, onBeat(S, part('remembered', 0, 0.45)), 'getDevices() finds it again')}
    ${fact(S, 3, onBeat(S, part('remembered', 0, 0.7)), 'No permission? It waits for the rider')}
  </div>
  </div>`);

Film.scene('drop', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'DeviceReconnector · L2-031 AC4', 'Dropped?', 'Tried again.', 110, 200, 700)}
  ${terminal(S, 'the strap out of range', [
    [`0 s  ${ok('disconnected')}  ${dim('bpm —')}`],
    [`3 s  retry  ${dim('NetworkError: no longer in range')}`],
    [`6 s  retry  ${dim('NetworkError: no longer in range')}`],
    [`9 s  ${ok('connected')}  ${dim('subscribed again')}`],
  ], S.beat(2), `${at(860, 260, 960)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: which number shows, and what the ride keeps ────────────────────────────────────────
Film.scene('source', (S) => {
  const said = (f) => onBeat(S, part('source', 0, f));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'HeartRateSource · L2-030', 'Strap first,', 'then the bike.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 760, 450, 1080, 600, said(0.3))}
    ${arrow(S, 760, 640, 1080, 640, said(0.5))}
    ${arrow(S, 760, 830, 1080, 680, said(0.7))}
  </svg>
  ${node(S, '', 'The strap', '142 bpm · first', 100, 380, 640, 140, said(0.1), 40)}
  ${node(S, '', 'The bike', 'FTMS heart rate · next', 100, 570, 640, 140, said(0.35), 40)}
  ${node(S, '', 'Neither', '“No heart rate”', 100, 760, 640, 140, said(0.55), 40)}
  ${node(S, 'node--app', 'The heart readout', 'bpm, or a dash', 1100, 570, 640, 140, said(0.75), 40)}
  </div>`;
}, { before: 0.3 });

Film.scene('quiet', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-031 AC4', 'Five quiet seconds,', 'a dash.', 110, 200, 700)}
  ${terminal(S, 'the heart readout, on the clock', [
    [`0 s   strap ${ok('142')}  bike ${dim('138')}  → ${ok('142')}`],
    [`      ${dim('the strap’s last beat; the bike’s goes on')}`],
    [`5 s   strap ${dim('—')}  bike ${ok('138')}  → ${ok('138')}`],
    [`      ${dim('the bike’s last beat')}`],
    [`10 s  strap ${dim('—')}  bike ${dim('—')}  → ${ok('—')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('stats', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'HeartRateStats · L2-031 AC5', 'Average', 'and peak.', 110, 200, 660)}
  ${terminal(S, 'each running second', [
    ['140  150  160'],
    [`average ${ok('150')}  peak ${ok('160')}`],
    [''],
    ['120  —  —  130'],
    [`average ${ok('125')}  peak ${ok('130')}`],
    [''],
    ['# a sum, a count and a peak: never a trace', 'terminal__dim'],
  ], S.beat(2), `${at(800, 240, 1020)};font-size:26px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'Settings', 'connects it.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.2)), 'Connect a strap from Settings · 20.1')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.45)), 'The heart readout on every ride screen')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'Average and peak saved with the ride · journey 10')}
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
    [`  Tests  ${ok('181 passed')} (181)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Twenty-five new,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'One case per row of L2-030 and L2-031')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'A fake strap: chosen, dropped, back')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 3.3 · Show heart rate' });

wipeInto('source');
bug();

Film.start();
