// Slice 22.4 · Restrict third parties. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Home served with the policy, from shots.ts; the terminals hold the real headers of the built API
// (curl on localhost:5310), the real refusals of the Playwright spec, and the real outputs of the two mutations that
// proved the checks. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;

// ── Act 1: the policy ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 22.4 · Restrict third parties',
  words: 'Two guests,',
  accent: 'only.',
  width: 860,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('policy', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-131 AC1, AC4 · security-headers.json', 'A short list', 'per directive.', 110, 160, 620)}
  ${terminal(S, 'backend · the built API', [
    prompt('curl -sI localhost:5310/health/live'),
    ['Content-Security-Policy:'],
    [`  default-src 'self'; script-src 'self' ${ok('https://www.youtube.com')} 'wasm-unsafe-eval';`],
    [`  img-src 'self' ${ok('https://i.ytimg.com https://tile.googleapis.com')} blob:;`],
    [`  connect-src 'self' ${ok('https://tile.googleapis.com')} blob:;`],
    [`  frame-src ${ok('https://www.youtube-nocookie.com')}; font-src 'self';`],
    [`  object-src 'none'; frame-ancestors ${ok("'none'")}`],
    ['X-Content-Type-Options: nosniff'],
    ['Referrer-Policy: strict-origin-when-cross-origin'],
  ], onBeat(S, part('policy', 0, 0.2)), `${at(740, 200, 1120)};font-size:19px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('tracker', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-131 AC2, AC3', 'Refused before', 'it leaves.', 110, 200, 640)}
  ${terminal(S, 'frontend · e2e/content-security-policy.spec.ts', [
    ['# a tracker\'s script and a call home, put in the page', 'terminal__dim'],
    [esc('<script src="https://tracker.example.com/collect.js">')],
    ['fetch("https://tracker.example.com/collect")'],
    [''],
    ['{ script: "refused", fetch: "refused" }', 'terminal__error'],
    [`script-src-elem blocked https://tracker.example.com/collect.js`],
    [`connect-src blocked https://tracker.example.com/collect`],
    [`# no request left the page   ${ok('2 passed')}`],
  ], S.beat(2), `${at(780, 200, 1060)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('guard', (S) => `
  <div class="fill field--bone">
  ${title(S, 'ContentSecurityPolicyFixture', 'Every spec,', 'under the policy.', 110, 160, 900)}
  ${terminal(S, 'frontend · YouTube taken out of script-src, by hand, for one run', [
    prompt('npx playwright test e2e/class-video.spec.ts'),
    ['Error: unexpected page errors, requests, policy refusals or Bluetooth calls', 'terminal__error'],
    ['+ "policy refusal: script-src-elem blocked https://www.youtube.com/iframe_api"'],
    ['  4 failed', 'terminal__error'],
    [''],
    [`# with the policy as it is: ${ok('355 passed')}, no refusal`],
  ], onBeat(S, part('guard', 0, 0.3)), `${at(110, 480, 1700)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('static', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0018 · ADR 0032', 'A static', 'policy.', 110, 200, 700)}
  <div style="${at(880, 260, 900)}">
    ${fact(S, 1, onBeat(S, part('static', 0, 0.2)), 'The offline shell is checked by the hash of its bytes')}
    ${fact(S, 2, onBeat(S, part('static', 0, 0.4)), 'So no nonce per response: styles may be inline')}
    ${fact(S, 3, onBeat(S, part('static', 0, 0.6)), 'Scripts, frames, connections, fonts: never')}
  </div>
  </div>`);

// ── Act 2: what the backend writes ────────────────────────────────────────────────────────────
Film.scene('telemetry', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-132 AC3 · PrivateTelemetryTests', 'Nothing of yours', 'in telemetry.', 110, 160, 820)}
  ${terminal(S, 'backend · an email put on a span, by hand, for one run', [
    ['# sign in, name yourself, read progress?whisper=hush-hush, sign out', 'terminal__dim'],
    ['failed A_sign_in_leaves_no_contact_detail_code_token_body_or_query_in_telemetry', 'terminal__error'],
    ['  [ "url.path=/api/auth/code", "enduser.email=sam.secret@example.com",'],
    ['    "http.route=api/auth/code", "http.response.status_code=202" ]'],
    [''],
    [`# as built: spans by route template, no email, code, token, body or query   ${ok('passed')}`],
  ], onBeat(S, part('telemetry', 0, 0.3)), `${at(110, 500, 1700)};font-size:22px`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Home,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 22.4 · Restrict third parties' });

wipeInto('telemetry');
bug();

Film.start();
