// Slice 1.4 · CI and hosting. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The slice adds no screen, so the app pictures are Home from shots.ts; the hosting is shown by a drawn
// diagram and the real output of curl against the API serving the real build, and the pipeline by its
// drawn jobs and the real timings and log lines of its first run on GitHub. Every position is a pure
// function of the scene's time (docs/videos/README.md).
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

// ── Act 1: one origin ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 1.4 · CI and hosting',
  words: 'One origin,',
  accent: 'every push.',
  width: 820,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('origin', (S) => {
  const said = (f) => onBeat(S, part('origin', 0, f));
  const paths = [
    ['node--app', 'wwwroot', 'the ride app · every route', 0.55],
    ['', '/api · /hubs', 'the backend · SignalR', 0.7],
    ['', '/health', 'live · ready', 0.85],
  ];
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Hosting · ADR 0026 · L2-149', 'One site,', 'one origin.', 110, 130, 720)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${paths.map((p, n) => arrow(S, 1230, 540 + (n - 1) * 40, 1420, 245 + n * 295, said(p[3] + 0.04))).join('')}
  </svg>
  ${node(S, '', 'App Service', 'Telo.Ride.Api · HTTPS', 850, 455, 380, 170, said(0.3), 44)}
  ${paths.map(([cls, name, note, f], n) => node(S, cls, name, note, 1440, 160 + n * 295, 420, 170, said(f), 40)).join('')}
  </div>`;
});

// ── Act 2: what the host answers ────────────────────────────────────────────────────────────────
Film.scene('deeplink', (S) => `
  <div class="fill field--bone">
  ${title(S, 'The SPA fallback · L2-149 AC1', 'Every route,', 'served.', 110, 200, 640)}
  ${terminal(S, 'the built API serving the real build, no database running', [
    prompt('curl -i localhost:5310/race'),
    ['HTTP/1.1 200 OK', 'terminal__ok'],
    ['Content-Type: text/html'],
    [`Cache-Control: ${ok('no-cache')}`],
    ['Content-Security-Policy: default-src \'self\';'],
    ['  script-src \'self\' https://www.youtube.com; …'],
    ['  frame-src https://www.youtube-nocookie.com; …'],
    [`  ${ok("frame-ancestors 'none'")}`],
    [`X-Content-Type-Options: ${ok('nosniff')}`],
    [`Referrer-Policy: ${ok('strict-origin-when-cross-origin')}`],
    [''],
    ['&lt;!doctype html&gt; …'],
  ], onBeat(S, part('deeplink', 0, 0.08)), `${at(800, 170, 1010)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.3 });

Film.scene('guarded', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'Backend paths · L2-127', 'The backend’s,', 'not the app’s.', 110, 200, 660)}
  ${terminal(S, 'an unknown address under /api, without a session', [
    prompt('curl -i localhost:5310/api/progress'),
    ['HTTP/1.1 401 Unauthorized', 'terminal__error'],
    ['Content-Type: application/problem+json'],
    [`X-Content-Type-Options: ${ok('nosniff')}`],
    [''],
    ['{ "title": "Sign in to continue.",'],
    ['  "status": 401,'],
    [`  "code": "${ok('unauthenticated')}" }`],
    ['# /hubs and /health too: never index.html', 'terminal__dim'],
  ], S.beat(2), `${at(800, 210, 1010)};font-size:23px`, { every: S.BEAT * 0.65 })}
  </div>`, { after: 0.6 });

// ── Act 3: the pipeline ─────────────────────────────────────────────────────────────────────────
Film.scene('pipeline', (S) => {
  const said = (f) => onBeat(S, part('pipeline', 0, f));
  const jobs = [
    ['Lint', 'Prettier · ESLint · dotnet format', 0.35],
    ['Production builds', 'ride in budget · API, warnings as errors', 0.5],
    ['Critical paths', 'Playwright @critical · backend Critical', 0.65],
  ];
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'GitHub Actions · L2-149 AC3', 'Three jobs,', 'side by side.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${jobs.map((j, n) => arrow(S, 300, 640, 470, 440 + n * 200, said(0.28))).join('')}
    ${jobs.map((j, n) => arrow(S, 1110, 440 + n * 200, 1290, 640, said(0.82))).join('')}
  </svg>
  ${node(S, '', 'Push', 'any branch', 90, 570, 210, 140, said(0.2), 40)}
  ${jobs.map(([name, note, f], n) => node(S, '', name, note, 480, 370 + n * 200, 620, 140, said(f), 36)).join('')}
  ${node(S, 'node--app', 'Deploy', 'main only', 1300, 570, 300, 140, said(0.9), 40)}
  </div>`;
}, { before: 0.6 });

Film.scene('run', (S) => {
  const said = (f) => onBeat(S, part('run', 0, f));
  const bars = [['Lint', 51], ['Production builds', 49], ['Critical paths', 81]];
  const width = (s) => s * 9;
  return `
  <div class="fill field--gold">
  ${title(S, 'The first run · cold caches', 'Green in', '1:24.', 110, 200, 640)}
  <div style="${at(800, 260, 1000)}">
    ${bars.map(([name, seconds], n) => `
    <div style="margin-bottom:56px" ${S.rise(said(0.15 + n * 0.12))}>
      <p class="kicker" style="color:var(--palette-ink)">${esc(name)} · ${seconds} s</p>
      <div style="margin-top:14px;height:44px;background:var(--palette-ink);border-radius:8px;width:${width(seconds)}px;transform-origin:left"
        ${S.ref((el, t) => { el.style.transform = `scaleX(${enter(t, said(0.18 + n * 0.12), 0.6, ease.out)})`; })}></div>
    </div>`).join('')}
    <p class="lede" style="color:var(--palette-ink);font-size:34px" ${S.rise(said(0.62))}>Deploy: skipped until the host exists. Limit: 5 minutes.</p>
  </div>
  </div>`;
});

Film.scene('critical', (S) => {
  const said = (f) => onBeat(S, part('critical', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'One path per feature', 'Critical,', 'not everything.', 110, 200, 660)}
  ${terminal(S, 'Critical acceptance paths · GitHub Actions', [
    prompt('npx playwright test --grep @critical'),
    [`  ${ok('2 passed')} (5.5s)`],
    [`  ${dim('the app shell · the fake bike')}`],
    [''],
    prompt('dotnet test --solution Telo.Ride.slnx --filter-trait "Category=Critical"'),
    ['  total: 5'],
    [`  ${ok('succeeded: 5')}`],
    [`  ${dim('no session, no data · the ride hub · the hosted app')}`],
    [''],
    ['# unit tests: node tools/verify/verify.mjs, on this machine', 'terminal__dim'],
  ], said(0.1), `${at(800, 200, 1010)};font-size:21px`, { every: S.BEAT * 0.55 })}
  </div>`;
});

Film.scene('deploy', (S) => `
  <div class="fill field--blue" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'Deploy · main only', 'Migrate,', 'then ship.', 110, 200, 660)}
  ${terminal(S, '.github/workflows/ci.yml · deploy', [
    [dim('# publish the API with the app inside')],
    ['dotnet publish backend/src/Telo.Ride.Api -c Release -o out'],
    ['cp -R frontend/dist/ride/browser out/wwwroot'],
    [''],
    [dim('# sign in with GitHub\'s OIDC token: no stored credential')],
    ['azure/login@v2'],
    [''],
    [dim('# the schema first, then the new version')],
    [`dotnet out/Telo.Ride.Api.dll ${ok('migrate')}`],
    ['azure/webapps-deploy@v3'],
  ], S.beat(2), `${at(800, 170, 1010)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`, { after: 0.7 });

// ── Act 4: the rider's side, what the tests prove, and the close ──────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Served', { accent: 'as one.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'home-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test --solution Telo.Ride.slnx'),
    ['Test run summary: <span class="terminal__ok">Passed!</span>'],
    ['  total: 26'],
    ['  failed: 0'],
    [''],
    prompt('npx playwright test'),
    [`  ${ok('12 passed')}`],
  ], 0.1, `${at(80, 290, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Thirty-eight,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Deep links answer the app, with its headers')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Backend paths never answer the app')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 1.4 · CI and hosting' });

wipeInto('deeplink');
bug();

Film.start();
