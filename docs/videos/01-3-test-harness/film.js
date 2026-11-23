// Slice 1.3 · Test harness. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The slice adds no screen, so the app pictures are Home from shots.ts, and the harness is shown by a
// drawn diagram and terminals holding its real code and the real output of its checks: the guard's
// failures, the SignalR frames the hub fixture exchanges, and the test runs. Every position is a pure
// function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const code = (text, cls) => [esc(text), cls];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;

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

// ── Act 1: the app, surrounded ──────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 1.3 · Test harness',
  words: 'Nothing real,',
  accent: 'all proven.',
  width: 820,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('doubles', (S) => {
  const said = (f) => onBeat(S, part('doubles', 0, f));
  const doubles = [
    ['FakeBluetooth', 'instead of the bike', 0.45],
    ['ApiFixture', 'instead of the backend', 0.65],
    ['HubFixture', 'instead of the ride hub', 0.85],
  ];
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'The shared fixture · L2-148', 'Three doubles,', 'one fixture.', 110, 130, 720)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${doubles.map((_, n) => arrow(S, 1420, 245 + n * 295, 1270, 540 + (n - 1) * 40, said(doubles[n][2] + 0.05))).join('')}
  </svg>
  ${node(S, 'node--app', 'Ride app', 'the build riders get', 880, 455, 380, 170, said(0.2), 48)}
  ${doubles.map(([name, note, f], n) => node(S, '', name, note, 1440, 160 + n * 295, 420, 170, said(f), 40)).join('')}
  </div>`;
});

// ── Act 2: each double, and its guard ───────────────────────────────────────────────────────────
Film.scene('bike', (S) => `
  <div class="fill field--bone">
  ${title(S, 'FakeBluetooth · L2-148 AC1', 'A bike that', 'keeps receipts.', 110, 200, 640)}
  ${terminal(S, 'frontend/e2e/harness.spec.ts', [
    code('await bluetooth.offer(echelonBike);'),
    code('await app.pairBike(ECHELON_SERVICE, ECHELON_WRITE, ECHELON_NOTIFY);'),
    code("await app.write('F0 A1 00 91');"),
    code('await bluetooth.notify(ECHELON_NOTIFY, [0xf0, 0xd1, 0x09, 0x00, 0xca]);'),
    [''],
    code('expect(bluetooth.writes()).toEqual(['),
    [`  { characteristic: ECHELON_WRITE, hex: ${ok("'F0 A1 00 91'")}, withResponse: true },`],
    code(']);'),
    [`await expect.poll(() =&gt; app.heard()).toEqual([${ok("'F0 D1 09 00 CA'")}]);`],
  ], onBeat(S, part('bike', 0, 0.1)), `${at(780, 230, 1060)};font-size:20px`, { every: S.BEAT * 0.7 })}
  </div>`, { before: 0.3 });

Film.scene('strict', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'The guard · L2-148 AC1', 'Unexpected?', 'Failed.', 110, 200, 640)}
  ${terminal(S, 'a spec whose page asks for a bike nobody offered', [
    prompt('npx playwright test e2e/harness.spec.ts'),
    ['Error: unexpected page errors, requests or Bluetooth calls', 'terminal__error'],
    [''],
    ['- Expected  - 1'],
    ['+ Received  + 3'],
    [''],
    ['+ Array ['],
    [`+   ${ok('"unexpected Bluetooth call: requestDevice"')},`],
    ['+ ]'],
    ['# so is a service, a characteristic or a member the bike lacks', 'terminal__dim'],
  ], S.beat(2), `${at(800, 210, 1010)};font-size:23px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.6 });

Film.scene('api', (S) => {
  const said = (f) => onBeat(S, part('api', 0, f));
  const missed = (f) => onBeat(S, part('api', 1, f));
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'ApiFixture · L2-148 AC1', 'Asked, and', 'answered.', 110, 200, 660)}
  ${terminal(S, 'the spec declares, the page asks', [
    code("api.answer('GET', '/api/progress', { xp: 1240, level: 4 });"),
    [''],
    code("await app.request('GET', '/api/progress');"),
    [`// ${ok('{ status: 200, body: { xp: 1240, level: 4 } }')}`],
  ], said(0.25), `${at(800, 170, 1010)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${terminal(S, 'and when nobody answered', [
    ['Error: unexpected page errors, requests or Bluetooth calls', 'terminal__error'],
    [`+   ${ok('"unanswered request: GET /api/progress"')},`],
    ['# the page got 501; the spec fails, naming the request', 'terminal__dim'],
  ], missed(0.1), `${at(800, 560, 1010)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`;
}, { before: 0.6 });

Film.scene('hub', (S) => `
  <div class="fill field--gold">
  ${title(S, 'HubFixture · L2-148 AC1', 'SignalR,', 'played back.', 110, 200, 640)}
  ${terminal(S, 'the frames on /hubs/ride, after hub.open()', [
    ['<span class="terminal__dim">page →</span> {"protocol":"json","version":1}␞'],
    [`<span class="terminal__dim">hub  →</span> ${ok('{}␞')}`],
    ['<span class="terminal__dim">page →</span> {"type":1,"target":"ReportProgress",'],
    ['         "arguments":[{"distanceMetres":420}]}␞'],
    [`<span class="terminal__dim">hub  →</span> {"type":1,"target":${ok('"StandingsUpdated"')},`],
    ['         "arguments":[[{"name":"Ada","position":1}]]}␞'],
    [''],
    ['# before open(), negotiation is unanswered and fails the spec', 'terminal__dim'],
  ], onBeat(S, part('hub', 0, 0.12)), `${at(800, 210, 1010)};font-size:22px`, { every: S.BEAT * 0.75 })}
  </div>`);

Film.scene('server', (S) => {
  const said = (f) => onBeat(S, part('server', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Hub tests · L2-148 AC3', 'A real client,', 'in memory.', 110, 200, 660)}
  ${terminal(S, 'backend/tests/Telo.Ride.Api.Tests/RideHubTests.cs', [
    code('new HubConnectionBuilder()'),
    code('    .WithUrl(new Uri(api.Server.BaseAddress, "hubs/ride"), options =>'),
    code('    {'),
    code('        options.HttpMessageHandlerFactory = _ => api.Server.CreateHandler();'),
    code('        options.Transports = HttpTransportType.LongPolling;'),
    code('    })'),
    code('    .Build();'),
  ], said(0.15), `${at(800, 150, 1010)};font-size:20px`, { every: S.BEAT * 0.4 })}
  ${terminal(S, 'RideHubTests, both passing', [
    [`${ok('✓')} A signed-in rider connects with a real SignalR client`],
    [`${ok('✓')} A connection without a session is refused at negotiation: 401`],
  ], said(0.62), `${at(800, 610, 1010)};font-size:22px`, { every: S.BEAT * 0.8 })}
  </div>`;
});

Film.scene('clock', (S) => `
  <div class="fill field--blue" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Fake time · L2-148 AC4', 'Time moves', 'when told.', 110, 200, 660)}
  ${terminal(S, 'backend/tests/Telo.Ride.Api.Tests', [
    ['// TeloRideApiFactory: every fixture, its own clock', 'terminal__dim'],
    code('public FakeTimeProvider Clock { get; } = new(…2026-11-21 07:00 UTC…);'),
    code('services.Replace(ServiceDescriptor.Singleton<TimeProvider>(Clock));'),
    [''],
    ['// EventProbe<T>: await an event; on timeout, name what came', 'terminal__dim'],
    code('throw new TimeoutException('),
    code('    $"No matching event within {timeout}; events that arrived: [{seen}]");'),
    [''],
    [`# ${ok('no Task.Delay, no Thread.Sleep')}`, 'terminal__dim'],
  ], S.beat(2), `${at(800, 190, 1010)};font-size:20px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 3: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Inside', { accent: 'the doubles.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'home-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('12 passed')} (3.4s)`],
    ['  # 3 prove the guard fails a spec', 'terminal__dim'],
    [''],
    prompt('dotnet test --solution Telo.Ride.slnx'),
    ['Test run summary: <span class="terminal__ok">Passed!</span>'],
    ['  total: 18'],
    ['  failed: 0'],
  ], 0.1, `${at(80, 280, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Thirty checks,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'No bike, no backend, no database')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Anything unexpected fails the spec')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 1.3 · Test harness' });

wipeInto('bike');
bug();

Film.start();
