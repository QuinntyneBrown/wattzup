// Slice 2.2 · Check browser support. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Connect Bike from shots.ts: its Works with list, the alert in a browser without Web
// Bluetooth and the alert on a plain http page, made by the shared fixture's fake Bluetooth. The hosting
// terminals are real output of curl against the API built from this slice in the Production environment. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

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

// ── Act 1: the bikes, and the browsers ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 2.2 · Check browser support',
  words: 'Wrong browser?',
  accent: 'Told why.',
  width: 820,
  device: (S) => onBrowser(S, 'unsupported-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('works', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Works with · L2-007', 'Four Echelons,', 'FTMS in beta.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('works', 0, 0.45)), 'EX-5s, EX-3, EX-8s, Connect Sport: full control')}
    ${fact(S, 2, onBeat(S, part('works', 0, 0.7)), 'One column on a phone, two from 640 px')}
  </div>
  ${onPhone(S, 'works-xs', 1080, 130, 420, onBeat(S, part('works', 0, 0.2)), -3)}
  </div>`);

Film.scene('unsupported', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'No navigator.bluetooth · L2-008', 'Safari, Firefox:', 'Chrome or Edge.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('unsupported', 0, 0.45)), 'An alert in place of the device card')}
    ${fact(S, 2, onBeat(S, part('unsupported', 0, 0.7)), 'Works with stays, to read')}
  </div>
  ${onPhone(S, 'unsupported-xs', 1080, 130, 420, onBeat(S, part('unsupported', 0, 0.2)), 3)}
  </div>`, { before: 0.4 });

Film.scene('retry', (S) => {
  const said = (f) => onBeat(S, part('retry', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Try again · recheck()', 'Read again,', 'pair again.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 860, 640, 1060, 640, said(0.5))}
  </svg>
  ${onPhone(S, 'unsupported-xs', 420, 300, 380, said(0.2), -3)}
  ${onPhone(S, 'connect-xs', 1120, 300, 380, said(0.6), 3)}
  </div>`;
});

// ── Act 2: secure first ────────────────────────────────────────────────────────────────────────
Film.scene('order', (S) => {
  const said = (f) => onBeat(S, part('order', 0, f));
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'BLUETOOTH_SUPPORT · WebBluetoothSupport', 'Secure first,', 'then the browser.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 700, 500, 1080, 500, said(0.38))}
    ${arrow(S, 400, 580, 400, 700, said(0.55))}
    ${arrow(S, 700, 780, 1080, 780, said(0.68))}
    ${arrow(S, 400, 860, 400, 950, said(0.82))}
  </svg>
  ${node(S, '', 'A secure page?', 'isSecureContext · no on plain http', 100, 420, 600, 160, said(0.25), 36)}
  ${node(S, 'node--app', 'insecure-context', 'Open over HTTPS', 1100, 420, 640, 160, said(0.42), 36)}
  ${node(S, '', 'Web Bluetooth?', "'bluetooth' in navigator · no in Safari, Firefox", 100, 700, 600, 160, said(0.55), 36)}
  ${node(S, 'node--app', 'unsupported-browser', 'Chrome or Edge', 1100, 700, 640, 160, said(0.72), 36)}
  ${node(S, '', 'ready', 'pair the bike', 230, 950, 340, 110, said(0.86), 32)}
  </div>`;
}, { before: 0.4 });

Film.scene('https', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Plain http · L2-009 AC4', 'Same page,', 'over HTTPS.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('https', 0, 0.45)), 'Chromium hides Bluetooth on plain http')}
    ${fact(S, 2, onBeat(S, part('https', 0, 0.7)), 'One link to the same address on https')}
  </div>
  ${onPhone(S, 'https-xs', 1080, 130, 420, onBeat(S, part('https', 0, 0.2)), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: the host never answers over http ────────────────────────────────────────────────────
Film.scene('redirect', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'Production · L2-009 AC2', 'Plain http,', 'sent on.', 110, 200, 660)}
  ${terminal(S, 'the API built from this slice, in Production', [
    prompt('curl -i -H "Host: ride.telo.test" localhost:5310/classes/hiit-30'),
    ['HTTP/1.1 308 Permanent Redirect', 'terminal__ok'],
    ['Content-Length: 0'],
    [`Location: ${ok('https://ride.telo.test/classes/hiit-30')}`],
    [''],
    ['# same path, same query, on https', 'terminal__dim'],
  ], S.beat(2), `${at(800, 260, 1010)};font-size:23px`, { every: S.BEAT * 0.65 })}
  </div>`, { after: 0.6 });

Film.scene('hsts', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Strict-Transport-Security', 'A year', 'of https.', 110, 200, 660)}
  ${terminal(S, 'TLS ends at App Service’s front end, which says so', [
    prompt('curl -i -H "X-Forwarded-Proto: https" …/health/live'),
    ['HTTP/1.1 200 OK', 'terminal__ok'],
    [`Strict-Transport-Security: ${ok('max-age=31536000')}`],
    ["Content-Security-Policy: default-src 'self'; …"],
    ['X-Content-Type-Options: nosniff'],
    ['Referrer-Policy: strict-origin-when-cross-origin'],
    [''],
    ['# no includeSubDomains, no preload: not ours to commit', 'terminal__dim'],
  ], onBeat(S, part('hsts', 0, 0.1)), `${at(800, 220, 1010)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('deferred', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Still to come', 'The ride screens', 'bring their own.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('deferred', 0, 0.3)), 'Class Start: the notice, Join disabled · 6.3')}
    ${fact(S, 2, onBeat(S, part('deferred', 0, 0.5)), 'Custom workout: Start ride described · 21.1')}
    ${fact(S, 3, onBeat(S, part('deferred', 0, 0.7)), 'Custom ride: the full panel · 21.3')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 4: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/connect-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Every width,', { accent: 'the same list.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'https-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('17 passed')}`],
    [''],
    prompt('dotnet test --solution Telo.Ride.slnx'),
    ['Test run summary: <span class="terminal__ok">Passed!</span>'],
    ['  total: 28'],
    ['  failed: 0'],
  ], 0.1, `${at(80, 290, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Forty-five,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'No Bluetooth, or plain http: the right alert')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'In production, http redirects; https sends HSTS')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 2.2 · Check browser support' });

wipeInto('https');
bug();

Film.start();
