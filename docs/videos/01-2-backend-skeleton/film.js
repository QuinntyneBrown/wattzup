// Slice 1.2 · Backend skeleton. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The slice adds no screen, so the app pictures are Home from shots.ts, and the backend is
// shown by drawn diagrams and terminals holding the real output of its checks: curl against the
// built API, the ProblemDetails bodies its acceptance tests receive, dotnet ef, the migrate command
// and the test run. Every position is a pure function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];

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

// ── Act 1: four layers, one path ───────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 1.2 · Backend skeleton',
  words: 'A backend,',
  accent: 'kept thin.',
  width: 820,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('layers', (S) => {
  const named = (f) => onBeat(S, part('layers', 0, f));
  const refs = (f) => part('layers', 1, f);
  const layers = [
    ['node--app', 'Telo.Ride.Api', 'controllers, hubs, Program', 0.82],
    ['', 'Infrastructure', 'EF Core, Azure SQL, telemetry', 0.6],
    ['', 'Application', 'MediatR handlers, validators', 0.38],
    ['', 'Domain', 'entities, rules · no references', 0.15],
  ];
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Clean architecture · L2-147', 'Four layers,', 'one direction.', 110, 130, 700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${[0, 1, 2].map((n) => arrow(S, 1400, 252 + n * 240, 1400, 332 + n * 240, refs(0.2 + n * 0.25))).join('')}
  </svg>
  ${layers.map(([cls, name, note, f], n) => node(S, cls, name, note, 1040, 100 + n * 240, 720, 150, named(f), 54)).join('')}
  </div>`;
});

Film.scene('path', (S) => {
  const step = (f) => onBeat(S, part('path', 0, f));
  const stops = [
    ['node--app', 'Controller', 'checks nothing', 0.25],
    ['', 'ISender', 'one request', 0.4],
    ['', 'Validation', 'every validator', 0.55],
    ['', 'Handler', 'the rule', 0.7],
    ['', 'IAppDbContext', 'the database', 0.85],
  ];
  return `
  <div class="fill field--blue">
  ${title(S, 'One path · L2-147', 'One path,', 'every request.', 110, 110, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${[0, 1, 2, 3].map((n) => arrow(S, 390 + n * 360, 640, 442 + n * 360, 640, step(0.32 + n * 0.15))).join('')}
  </svg>
  ${stops.map(([cls, name, note, f], n) => node(S, cls, name, note, 90 + n * 360, 555, 300, 170, step(f), 40)).join('')}
  <p class="lede" style="${at(110, 820, 1600)};font-size:34px" ${S.rise(step(0.9))}>Invalid input never reaches the handler.</p>
  </div>`;
});

// ── Act 2: what it answers ──────────────────────────────────────────────────────────────────────
Film.scene('health', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Health · L2-127', 'Healthy, or', 'it says so.', 110, 200, 640)}
  ${terminal(S, 'backend · the built API, with no database running', [
    prompt('curl -i localhost:5310/health/live'),
    ['HTTP/1.1 200 OK', 'terminal__ok'],
    ['Healthy'],
    [''],
    prompt('curl -i localhost:5310/health/ready'),
    ['HTTP/1.1 503 Service Unavailable', 'terminal__error'],
    ['Unhealthy'],
    [''],
    ['# a status word, nothing else: no check names, timings or errors', 'terminal__dim'],
  ], onBeat(S, part('health', 0, 0.1)), `${at(800, 230, 1010)};font-size:24px`, { every: S.BEAT * 0.8 })}
  </div>`, { before: 0.3 });

Film.scene('auth', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'Authentication · L2-127', 'No session,', 'no data.', 110, 200, 640)}
  ${terminal(S, 'backend · any address but health, without a session', [
    prompt('curl -i localhost:5310/api/progress'),
    ['HTTP/1.1 401 Unauthorized', 'terminal__error'],
    ['Content-Type: application/problem+json'],
    [''],
    ['{ "title": "Sign in to continue.",'],
    ['  "status": 401,'],
    ['  "code": "<span class="terminal__ok">unauthenticated</span>",'],
    ['  "traceId": "00-dce4096fd0f6821aff0bb3bd7c9c4091-…" }'],
    ['# no Location header: an API never redirects to a sign-in page', 'terminal__dim'],
  ], S.beat(2), `${at(800, 230, 1010)};font-size:24px`, { every: S.BEAT * 0.75 })}
  </div>`, { after: 0.6 });

/** One refusal: its status line and the body the acceptance test received, trimmed to its fields. */
const refusal = (S, when, y, status, lines) => terminal(S, status, lines, when, `${at(800, y, 960)};font-size:20px`, { every: S.BEAT * 0.3 });

Film.scene('refusals', (S) => {
  const said = (f) => onBeat(S, part('refusals', 0, f));
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'ProblemDetails · L2-147', 'Every refusal,', 'a code.', 110, 200, 660)}
  ${refusal(S, said(0.32), 90, '400 · invalid input', [
    ['{ "code": "<span class="terminal__ok">validation_failed</span>",'],
    ['  "errors": { "powerWatts": ["The length of \'Power Watts\' must'],
    ['                             be 4 characters or fewer. …"] } }'],
  ])}
  ${refusal(S, said(0.55), 420, '409 · a domain rule', [
    ['{ "title": "This can\'t be done right now.",'],
    ['  "code": "<span class="terminal__ok">session_full</span>" }'],
  ])}
  ${refusal(S, said(0.8), 700, '500 · anything else', [
    ['{ "title": "Something went wrong.",'],
    ['  "code": "<span class="terminal__ok">unexpected</span>",'],
    ['  "traceId": "00-03ab6607cf7d24cbd2fdd55e95b0a7a6-…" }'],
  ])}
  </div>`;
}, { before: 0.6 });

Film.scene('telemetry', (S) => {
  const said = (f) => onBeat(S, part('telemetry', 0, f));
  const span = (f) => onBeat(S, part('telemetry', 1, f));
  return `
  <div class="fill field--gold">
  ${title(S, 'OpenTelemetry · L2-147', 'Measured,', 'never nosy.', 110, 200, 640)}
  ${terminal(S, 'the Telo.Ride meter, after one refusal', [
    ['telo.ride.problems{code="session_full", status=409}   1'],
  ], said(0.35), `${at(800, 170, 1010)};font-size:24px`)}
  ${terminal(S, 'the span of GET /probe/echo?text=rider%40example.com', [
    ['name         GET probe/echo'],
    ['http.route   <span class="terminal__ok">probe/echo</span>'],
    ['status code  200'],
    ['url.query    <span class="terminal__ok">(none)</span>'],
    ['# no tag holds the address in the query string', 'terminal__dim'],
  ], span(0.1), `${at(800, 430, 1010)};font-size:24px`, { every: S.BEAT * 0.6 })}
  </div>`;
});

Film.scene('migrate', (S) => `
  <div class="fill field--blue" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Migrations · L2-147', 'Migrate first,', 'then start.', 110, 200, 660)}
  ${terminal(S, 'backend · the first migration, then the command', [
    prompt('dotnet ef migrations add InitialCreate …'),
    ['Build started...'],
    ['Build succeeded.'],
    ['Done. To undo this action, use \'ef migrations remove\'', 'terminal__ok'],
    [''],
    prompt('dotnet run --project src/Telo.Ride.Api -- migrate'),
    ['<span class="terminal__error">fail</span>: Program[383545648]'],
    ['      The database migration failed.'],
    prompt('echo $?'),
    ['1'],
    ['# no database on this machine: a failed migration stops the release', 'terminal__dim'],
  ], S.beat(2), `${at(800, 170, 1010)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 3: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Rides on', { accent: 'its own.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'home-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'backend · every test', [
    prompt('dotnet test --solution Telo.Ride.slnx'),
    ['Test run summary: <span class="terminal__ok">Passed!</span>'],
    ['  total: 16'],
    ['  failed: 0'],
    ['  succeeded: 16'],
  ], 0.1, `${at(80, 300, 640)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Sixteen tests,', 'all green.', 760, 110, 1100)}
  <div style="${at(760, 470, 1060)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Through the API, on a real host in memory')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'No real database, no file, no sleep')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 1.2 · Backend skeleton' });

wipeInto('health');
bug();

Film.start();
