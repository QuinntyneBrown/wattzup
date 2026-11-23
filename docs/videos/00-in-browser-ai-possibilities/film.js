// 00 · In-Browser AI Possibilities: complete explainer of docs/in-browser-ai-possibilities.md.
// Eighteen scenes on the 92.99 BPM grid of Beautiful Boom Bap (a bar is 2.58 s), built with the
// exact same runtime, kit, brand tokens, Kokoro-82M narration and no-burned-captions pipeline as
// docs/videos/00-meet-telo-ride. Every position is a pure function of scene time.
const { enter, ease, prog, esc } = Film;
const { at, part, onBeat, pop, fact, counter, photo, opening, closing, terminal, wipeInto, bug } = Film.kit;

/** A photograph the design system ships, as a picture of its own. */
const picture = (name, style, attrs) =>
  `<img class="closeup" src="../../design-system/assets/images/${name}.jpg" alt="" style="${style}" ${attrs}>`;
/** The beat at or after the fraction `f` of line `n` of scene `id`. */
const beatOf = (S, id, f, n = 0) => onBeat(S, part(id, n, f));

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:18px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;

const badge = (S, when, label, detail, bg = 'var(--palette-panel)', fg = 'var(--palette-bone)', border = 'var(--palette-line)') => `
  <div style="box-sizing:border-box;padding:24px 30px;border-radius:14px;background:${bg};color:${fg};outline:2px solid ${border};margin-bottom:22px;box-shadow:0 24px 48px -20px rgb(0 0 0 / 0.45)" ${S.rise(when, { y: 40 })}>
    <div style="font:800 32px/1.15 var(--font-family-sans)">${label}</div>
    <div style="margin-top:8px;font:500 24px/1.3 var(--font-family-sans);opacity:0.86">${detail}</div>
  </div>`;

// ── Act 1: The Hook, Why Local AI Fits, Browser Capabilities & HF Models ──────────────────────
opening('hook', {
  kicker: 'Research Explainer · Free Hugging Face AI',
  words: 'Local AI,',
  accent: 'in the browser.',
  width: 960,
  device: (S) => picture('machines/echelon-ex5s', at(1060, 220, 760), pop(S, S.beat(3), { tilt: 2 })),
});

Film.scene('why', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Section 1 · Purpose & Fit', 'Why local AI', 'fits Telo Ride.', 110, 90, 960)}
  ${counter(S, [
    [beatOf(S, 'why', 0.15, 0), '$0'],
    [beatOf(S, 'why', 0.48, 0), '100%'],
    [beatOf(S, 'why', 0.8, 0), 'OPFS'],
    [beatOf(S, 'why', 0.55, 1), '60 FPS'],
  ], `${at(110, 480, 780)};text-align:left;color:var(--palette-signal)`)}
  <p class="lede" style="${at(110, 840, 820)}" ${S.rise(beatOf(S, 'why', 0.55, 1))}>One hard rule: never starve Three.js<br>on an hour-long tablet ride.</p>
  <div style="${at(1000, 170, 810)}">
    ${fact(S, 1, beatOf(S, 'why', 0.15, 0), '$0 per token — thin .NET backend')}
    ${fact(S, 2, beatOf(S, 'why', 0.48, 0), 'L1-021 privacy — same-origin weights')}
    ${fact(S, 3, beatOf(S, 'why', 0.78, 0), 'Offline-first — cached in OPFS')}
    ${fact(S, 4, beatOf(S, 'why', 0.25, 1), 'Chrome & Edge — best web AI stack')}
  </div>
  </div>`);

Film.scene('platform', (S) => `
  <div class="fill field--signal">
  ${title(S, 'Section 2 · Browser Capabilities (2026)', 'Chrome & Edge', 'compute stack.', 110, 72, 1700)}
  <div style="${at(110, 340, 820)}">
    ${badge(S, beatOf(S, 'platform', 0.2, 0), 'WebGPU (navigator.gpu)', '10x–100x faster matrix math; shares GPU with Three.js', 'var(--palette-ink)', 'var(--palette-bone)', 'var(--palette-ink)')}
    ${badge(S, beatOf(S, 'platform', 0.65, 0), 'WebNN (navigator.ml)', 'Offloads models to laptop/tablet NPU — 0% GPU hit', 'var(--palette-ink)', 'var(--palette-bone)', 'var(--palette-ink)')}
    ${badge(S, beatOf(S, 'platform', 0.15, 1), 'OPFS Sync Worker Storage', 'Up to 60% disk quota; instant offline weight loads', 'var(--palette-ink)', 'var(--palette-bone)', 'var(--palette-ink)')}
  </div>
  <div style="${at(980, 340, 830)}">
    ${badge(S, beatOf(S, 'platform', 0.5, 1), 'AudioWorklet + Noise Gate', '16 kHz PCM & fan-hum filter off the main thread', 'var(--palette-white)', 'var(--palette-ink)', 'var(--palette-ink)')}
    ${badge(S, beatOf(S, 'platform', 0.78, 1), 'Compute Pressure API', 'PressureObserver sheds AI cleanly if tablet heats up', 'var(--palette-white)', 'var(--palette-ink)', 'var(--palette-ink)')}
    ${badge(S, beatOf(S, 'platform', 0.2, 2), 'COEP: credentialless + YouTube', 'Unlocks SharedArrayBuffer WASM without breaking iframes', 'var(--palette-white)', 'var(--palette-ink)', 'var(--palette-ink)')}
  </div>
  </div>`, { before: 0.3 });

const MODELS = [
  ['silero-vad', '2 MB', 0.04, 'Mid-ride VAD'],
  ['MoveNet Lightning', '6 MB', 0.08, 'Mid-ride pose'],
  ['bge-micro-v2', '17 MB', 0.15, '8 ms search'],
  ['chronos-bolt-tiny', '20 MB', 0.19, 'Fatigue forecast'],
  ['moonshine-tiny', '30 MB', 0.26, 'Fast local ASR'],
  ['Kokoro-82M ONNX', '85 MB', 0.45, 'Studio TTS'],
  ['SmolLM2-360M Q4', '210 MB', 0.74, 'Pre/post SLM'],
  ['Qwen3-0.6B Q4F16', '330 MB', 1.0, 'JSON workouts'],
];
Film.scene('models', (S) => {
  const from = beatOf(S, 'models', 0.1, 1);
  const rows = MODELS.map(([name, size, frac, role], i) => {
    const start = from + i * S.BEAT * 0.65;
    const color = i < 6 ? 'var(--palette-signal)' : 'var(--palette-gold)';
    return `
      <div style="display:grid;grid-template-columns:360px 1fr 140px 260px;align-items:center;gap:24px;margin-bottom:22px" ${S.rise(start, { y: 18, dur: 0.25 })}>
        <span class="mono" style="font-size:28px;font-weight:700">${esc(name)}</span>
        <div style="height:32px;background:var(--palette-panel);border-radius:8px;overflow:hidden;outline:1px solid var(--palette-line)">
          <div style="height:100%;background:${color};border-radius:8px" ${S.ref((el, t) => {
            el.style.width = `${Math.max(4, frac * 100 * ease.out(prog(t, start, 0.5)))}%`;
          })}></div>
        </div>
        <span class="mono" style="font-size:28px;font-weight:700;text-align:right">${esc(size)}</span>
        <span style="font-size:24px;color:var(--palette-muted)">${esc(role)}</span>
      </div>`;
  }).join('');
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Section 3 · Free Open-Weight Hugging Face Catalog', 'Quantized ONNX,', 'tab-sized.', 110, 64, 1700)}
  <div style="${at(110, 340, 1700)}">${rows}</div>
  <p class="kicker" style="${at(110, 965, 1700)};color:var(--palette-muted)" ${S.rise(beatOf(S, 'models', 0.4, 2))}>Apache 2.0 &amp; MIT weights · Red: mid-ride safe · Gold: inter-ride only</p>
  </div>`;
});

// ── Act 2: The 55 Features Across Domains A–H ──────────────────────────────────────────────────
Film.scene('voice', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Domain A · Features 01–07', 'Hands-free', 'voice cockpit.', 110, 74, 920)}
  <div style="${at(110, 380, 820)}">
    ${fact(S, '01', beatOf(S, 'voice', 0.35, 1), 'Resistance & playback commands')}
    ${fact(S, '02', beatOf(S, 'voice', 0.05, 1), '“Hey Telo” wake word + fan guard')}
    ${fact(S, '03', beatOf(S, 'voice', 0.1, 2), 'Spoken climb & ghost gap queries')}
    ${fact(S, '05', beatOf(S, 'voice', 0.65, 2), 'Voice-dictated bug reports (L1-019)')}
  </div>
  ${terminal(S, 'ai.worker.ts — silero-vad + moonshine-tiny', [
    ['<span class="terminal__dim">[mic 16kHz]</span> fan noise gated (-24 dB)'],
    ['<span class="terminal__ok">[wake]</span>      "Hey Telo" (0.97)'],
    ['<span class="terminal__prompt">&gt;</span> "Resistance up two"'],
    ['<span class="terminal__ok">[ble]</span>       setTargetResistance(18) ✓'],
    [''],
    ['<span class="terminal__prompt">&gt;</span> "How far to the Ibiza summit?"'],
    ['<span class="terminal__ok">[kokoro]</span>    "420 metres — hold 92 rpm"'],
    [''],
    ['<span class="terminal__prompt">&gt;</span> "Race Ibiza against medium bots"'],
    ['<span class="terminal__ok">[router]</span>    /race/ibiza?bots=medium ✓'],
  ], beatOf(S, 'voice', 0.15, 1), `${at(980, 220, 830)}`, { every: S.BEAT * 0.7 })}
  </div>`, { before: 0.3 });

Film.scene('kart', (S) => `
  <div class="fill field--photo" style="${photo('worlds/docklands')}">
  ${title(S, 'Domain B · Features 08–14', 'Kart racing,', 'comes alive.', 110, 80, 1020)}
  <div style="${at(110, 380, 860)}">
    ${fact(S, '08', beatOf(S, 'kart', 0.35, 0), 'Live Kokoro-82M play-by-play announcer')}
    ${fact(S, '09', beatOf(S, 'kart', 0.25, 1), 'Bot personalities & 3D spatial banter')}
    ${fact(S, '10', beatOf(S, 'kart', 0.1, 2), 'Victory & map-unlock fanfare narration')}
    ${fact(S, '11', beatOf(S, 'kart', 0.45, 2), 'Cadence-adaptive music & world crowds')}
  </div>
  <div style="${at(1060, 420, 750)}">
    ${badge(S, beatOf(S, 'kart', 0.55, 1), 'Zero Mid-Ride LLM Cost', 'Bot banter & callouts pre-generated in the Lobby and cached in OPFS.', 'rgb(10 11 13 / 0.88)', 'var(--palette-bone)', 'var(--palette-signal)')}
    ${badge(S, beatOf(S, 'kart', 0.72, 2), 'Ghost Splits & Multilingual', 'French on Alpe d’Huez · Italian on Strade Bianche · Spanish in Havana.', 'rgb(10 11 13 / 0.88)', 'var(--palette-bone)', 'var(--palette-gold)')}
  </div>
  ${S.confetti([beatOf(S, 'kart', 0.12, 2)], { count: 120 })}
  </div>`);

Film.scene('coach', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Domain C · Features 15–22', 'Telemetry,', 'into coaching.', 110, 80, 960)}
  <div style="${at(110, 380, 880)}">
    ${fact(S, '15', beatOf(S, 'coach', 0.4, 0), 'Cadence-lock micro-coach before hills')}
    ${fact(S, '16', beatOf(S, 'coach', 0.15, 1), 'Chronos-Bolt 5-min fatigue forecast (CPU)')}
    ${fact(S, '17', beatOf(S, 'coach', 0.55, 1), 'Resistance nudge & star-unlock strategist')}
    ${fact(S, '21', beatOf(S, 'coach', 0.35, 2), 'HR drift, Rival Pack & post-ride debrief')}
  </div>
  ${counter(S, [
    [beatOf(S, 'coach', 0.4, 0), '92 RPM'],
    [beatOf(S, 'coach', 0.15, 1), '5 MIN'],
    [beatOf(S, 'coach', 0.55, 1), '★★★'],
    [beatOf(S, 'coach', 0.35, 2), '1 HZ'],
  ], `${at(1030, 430, 800)};text-align:center;color:var(--palette-signal);font-size:220px`)}
  <p class="kicker" style="${at(1030, 740, 800)};text-align:center;color:var(--palette-muted)" ${S.rise(beatOf(S, 'coach', 0.2, 1))}>Bounded 600-tick ring buffer · 40 ms CPU inference</p>
  </div>`);

const WORKOUT_BARS = [[2, 0.25], [3, 0.75], [2, 0.3], [3, 0.9], [2, 0.3], [3, 1.0], [2, 0.3], [3, 0.85], [2, 0.25]];
Film.scene('discover', (S) => {
  const from = beatOf(S, 'discover', 0.3, 0);
  const total = WORKOUT_BARS.reduce((sum, [w]) => sum + w, 0);
  let x = 0;
  const bars = WORKOUT_BARS.map(([w, h], i) => {
    const left = (x / total) * 100;
    x += w;
    return `<div style="position:absolute;bottom:0;left:${left}%;width:calc(${(w / total) * 100}% - 10px);border-radius:10px 10px 0 0;background:var(${h > 0.5 ? '--palette-ink' : '--palette-signal-deeper'})" ${S.ref((el, t) => {
      el.style.height = `${h * 100 * ease.out(prog(t, from + i * S.BEAT * 0.4, 0.4))}%`;
    })}></div>`;
  }).join('');
  return `
  <div class="fill field--gold">
  ${title(S, 'Domain D · Features 23–30', '100 worlds.', 'Zero friction.', 110, 70, 960)}
  <div style="${at(110, 360, 860)}">
    ${fact(S, '23', beatOf(S, 'discover', 0.25, 0), 'Natural-language JSON workout builder')}
    ${fact(S, '24', beatOf(S, 'discover', 0.15, 1), '17 MB offline mood search in 8 ms')}
    ${fact(S, '26', beatOf(S, 'discover', 0.65, 1), 'YouTube description → synced plan')}
    ${fact(S, '28', beatOf(S, 'discover', 0.3, 2), 'Home concierge, Course Scout & Q&A')}
  </div>
  <div style="${at(1030, 390, 780)};height:440px;border-bottom:6px solid var(--palette-ink)">${bars}</div>
  <p class="kicker" style="${at(1030, 865, 780)};text-align:center" ${S.rise(beatOf(S, 'discover', 0.4, 0))}>Schema-valid WorkoutPlan JSON · Inter-ride WebGPU</p>
  </div>`;
}, { before: 0.3 });

Film.scene('vision', (S) => `
  <div class="fill field--photo" style="${photo('worlds/dolomites')}">
  ${title(S, 'Domain E · Features 31–37 · Strictly Opt-In', 'Saddle vision.', 'Zero video sent.', 110, 76, 1100)}
  <div style="${at(110, 380, 860)}">
    ${fact(S, '31', beatOf(S, 'vision', 0.15, 1), 'MoveNet standing vs. seated 3D mirror')}
    ${fact(S, '32', beatOf(S, 'vision', 0.65, 1), 'Shoulder-lean kart cornering & draft')}
    ${fact(S, '33', beatOf(S, 'vision', 0.1, 2), 'Silent sweat-free hand gestures')}
    ${fact(S, '34', beatOf(S, 'vision', 0.55, 2), 'Bike-fit snapshot & tension alerts')}
  </div>
  <div style="${at(1050, 420, 760)}">
    ${badge(S, beatOf(S, 'vision', 0.4, 0), '100% On-Device Privacy', 'Frames downscaled to 320×240 @ 5 FPS in a Web Worker, then immediately discarded via VideoFrame.close().', 'rgb(10 11 13 / 0.88)', 'var(--palette-bone)', 'var(--palette-signal)')}
    ${badge(S, beatOf(S, 'vision', 0.78, 2), '6 MB Footprint', 'MoveNet Lightning runs on CPU/WebNN (~5% core) and disables cleanly under reduced motion.', 'rgb(10 11 13 / 0.88)', 'var(--palette-bone)', 'var(--palette-gold)')}
  </div>
  </div>`);

Film.scene('social', (S) => `
  <div class="fill field--blue">
  ${title(S, 'Domain F · Features 38–42', 'Social rides,', 'zero bloat.', 110, 80, 1700)}
  <div style="${at(110, 370, 820)}">
    ${fact(S, '38', beatOf(S, 'social', 0.45, 0), 'Instant local display-name safety check')}
    ${fact(S, '39', beatOf(S, 'social', 0.1, 1), 'Multilingual group-ride quick-chat')}
    ${fact(S, '40', beatOf(S, 'social', 0.55, 1), 'Shareable race highlight story cards')}
  </div>
  <div style="${at(980, 370, 830)}">
    ${fact(S, '41', beatOf(S, 'social', 0.15, 2), 'Lobby countdown hype & matchup intro')}
    ${fact(S, '42', beatOf(S, 'social', 0.6, 2), 'Smart ghost vs. bot rival recommender')}
    ${badge(S, beatOf(S, 'social', 0.7, 1), 'Thin Backend Preserved', 'Client-side polish & translation; backend stays authoritative for multiplayer and safety (L1-020, L1-021).', 'rgb(10 11 13 / 0.35)', 'var(--palette-white)', 'var(--palette-gold)')}
  </div>
  </div>`);

Film.scene('diag', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Domain G · Features 43–49', 'Reliable.', 'Accessible.', 110, 74, 900)}
  <div style="${at(110, 380, 820)}">
    ${fact(S, '43', beatOf(S, 'diag', 0.3, 0), 'On-device BLE packet log troubleshooter')}
    ${fact(S, '44', beatOf(S, 'diag', 0.2, 1), 'Privacy-scrubbed bug report summary')}
    ${fact(S, '45', beatOf(S, 'diag', 0.15, 2), 'Spatial screen-reader race narrator')}
    ${fact(S, '48', beatOf(S, 'diag', 0.65, 2), 'PressureObserver thermal governor')}
  </div>
  ${terminal(S, 'Diagnostics · Local BLE Analyzer (L1-018)', [
    ['<span class="terminal__dim">log:</span> 10,412 GATT frames (kept on device)'],
    ['<span class="terminal__error">warn:</span> 3 keepalive timeouts @ 14:22'],
    ['<span class="terminal__error">warn:</span> target 18 != reported 14 (2.1 s)'],
    [''],
    ['<span class="terminal__ok">Diagnosis (Qwen3-0.6B + protocol RAG):</span>'],
    ['  Another app is polling your EX-5s.'],
    ['  Close the Echelon app on your phone'],
    ['  and tap Reconnect.'],
    [''],
    ['<span class="terminal__ok">PressureObserver:</span> nominal · 60 fps ✓'],
  ], beatOf(S, 'diag', 0.25, 0), `${at(980, 220, 830)}`, { every: S.BEAT * 0.75 })}
  </div>`, { before: 0.3 });

Film.scene('narrative', (S) => `
  <div class="fill field--photo" style="${photo('worlds/coast')}">
  ${title(S, 'Domain H · Features 50–55', 'One unified', 'Race Director.', 110, 76, 1100)}
  <div style="${at(110, 380, 840)}">
    ${fact(S, '50', beatOf(S, 'narrative', 0.25, 0), 'Persistent bot rivalries in IndexedDB')}
    ${fact(S, '51', beatOf(S, 'narrative', 0.15, 1), 'World landmark audio tour guide')}
    ${fact(S, '52', beatOf(S, 'narrative', 0.55, 1), 'Streak-saver & 4-week training blocks')}
    ${fact(S, '55', beatOf(S, 'narrative', 0.25, 2), 'Unified 143 MB Race Director worker')}
  </div>
  <div style="${at(1030, 390, 780)}">
    ${badge(S, beatOf(S, 'narrative', 0.3, 2), 'Feature 55 · Compound Pipeline', 'silero-vad (2 MB) + moonshine-tiny (30 MB) + Kokoro-82M (85 MB) + chronos-bolt (20 MB) + MoveNet (6 MB) = 143 MB total.', 'rgb(10 11 13 / 0.9)', 'var(--palette-bone)', 'var(--palette-signal)')}
    ${badge(S, beatOf(S, 'narrative', 0.65, 2), 'One Priority Queue', 'Deterministic TypeScript coordinates voice, telemetry, forecasting and audio ducking with zero mid-ride LLM bloat.', 'rgb(10 11 13 / 0.9)', 'var(--palette-bone)', 'var(--palette-gold)')}
  </div>
  </div>`);

// ── Act 3: Iterative Audit, Architecture Blueprint & Opt-In Packs ─────────────────────────────
Film.scene('audit', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Section 5 · 5-Pass Iterative Audit', '55 findings.', '5 passes.', 110, 70, 900)}
  <div style="${at(110, 370, 820)}">
    ${fact(S, 1, beatOf(S, 'audit', 0.25, 0), '55 features → 6 shared ONNX models')}
    ${fact(S, 2, beatOf(S, 'audit', 0.65, 0), 'Static embeddings & beats at build time')}
    ${fact(S, 3, beatOf(S, 'audit', 0.25, 1), 'Zero LLMs on WebGPU mid-ride')}
    ${fact(S, 4, beatOf(S, 'audit', 0.7, 1), 'SLMs restricted to pre/post screens')}
  </div>
  ${terminal(S, 'Explicitly Rejected · 5 Anti-Features', [
    ['<span class="terminal__error">✗ 1. Mid-ride free-form LLM chat</span>'],
    ['     unsafe distraction + VRAM starvation'],
    ['<span class="terminal__error">✗ 2. Runtime 3D mesh / texture gen</span>'],
    ['     OOM on tablets; keep Blender courses'],
    ['<span class="terminal__error">✗ 3. Cloud webkitSpeechRecognition</span>'],
    ['     leaks mic audio; violates L1-021'],
    ['<span class="terminal__error">✗ 4. Webcam medical / cardiac diagnosis</span>'],
    ['     unreliable under sweat; use BLE HR'],
    ['<span class="terminal__error">✗ 5. AI weights in initial bundle</span>'],
    ['     breaks lazy-loading budget; opt-in only'],
  ], beatOf(S, 'audit', 0.1, 2), `${at(980, 210, 830)}`, { every: S.BEAT * 0.55 })}
  </div>`, { before: 0.3 });

Film.scene('arch', (S) => {
  const n = (id, label, sub, x, y, w, h, when, app = false) => `
    <div class="node ${app ? 'node--app' : ''}" style="${at(x, y, w)};height:${h}px;font-size:42px;padding:18px" ${S.rise(when, { y: 30 })}>
      <div>${esc(label)}<small>${esc(sub)}</small></div>
    </div>`;
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'Section 6 · Angular Workspace Blueprint', 'Lazy library.', 'Strict isolation.', 110, 62, 1700)}
  ${n('main', 'Main Thread', 'Three.js WebGPU (60 fps) · BLE 1 Hz', 110, 340, 520, 175, beatOf(S, 'arch', 0.1, 1), true)}
  ${n('gov', 'PressureObserver', 'Auto-governor · DestroyRef teardown', 110, 560, 520, 175, beatOf(S, 'arch', 0.65, 1))}
  ${n('worker', 'AI Web Worker', 'frontend/projects/ai/ · ONNX WebNN/WASM', 700, 340, 540, 175, beatOf(S, 'arch', 0.25, 0), true)}
  ${n('audio', 'AudioWorklet', '16 kHz PCM · Fan Noise Gate', 700, 560, 540, 175, beatOf(S, 'arch', 0.5, 1))}
  ${n('opfs', 'OPFS + /models/', 'Same-origin weights · Ride Settings', 1310, 340, 500, 175, beatOf(S, 'arch', 0.15, 2))}
  ${n('test', 'FakeAiWorker + ADRs', 'Zero HF calls in CI · ADRs 0037–0039', 1310, 560, 500, 175, beatOf(S, 'arch', 0.65, 2))}
  <p class="lede" style="${at(110, 815, 1700)};text-align:center" ${S.rise(beatOf(S, 'arch', 0.35, 2))}>ride → ai (dynamic import only) · ai → api tokens only · 0 bytes in initial bundle</p>
  </div>`;
});

Film.scene('packs', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Section 7 · Modular Opt-In AI Packs', 'Pick only', 'what you want.', 110, 68, 1700)}
  <div style="${at(110, 340, 820)}">
    ${badge(S, beatOf(S, 'packs', 0.35, 0), 'Pack 0 · Core Governor — 0 MB', 'PressureObserver + Chrome Built-in AI fast-path (Phase 1)', 'var(--palette-panel)', 'var(--palette-bone)', 'var(--palette-line)')}
    ${badge(S, beatOf(S, 'packs', 0.1, 1), 'Pack 1 · Voice & Announcer — ~117 MB', 'silero-vad + moonshine-tiny + Kokoro-82M (Phase 1)', 'var(--palette-signal)', 'var(--palette-ink)', 'var(--palette-signal)')}
    ${badge(S, beatOf(S, 'packs', 0.55, 1), 'Pack 2 · Discovery & Workouts — ~227 MB', 'bge-micro-v2 (17 MB first slice!) + SmolLM2 / Qwen3 (Phase 2)', 'var(--palette-panel)', 'var(--palette-bone)', 'var(--palette-gold)')}
  </div>
  <div style="${at(980, 340, 830)}">
    ${badge(S, beatOf(S, 'packs', 0.1, 2), 'Pack 3 · Chronos Coach — ~22 MB', 'chronos-bolt-tiny fatigue forecast & Rival Pack (Phase 2)', 'var(--palette-panel)', 'var(--palette-bone)', 'var(--palette-line)')}
    ${badge(S, beatOf(S, 'packs', 0.4, 2), 'Pack 4 · Multilingual & Safety — ~45 MB', 'opus-mt language pairs + local safety pre-check (Phase 3)', 'var(--palette-panel)', 'var(--palette-bone)', 'var(--palette-line)')}
    ${badge(S, beatOf(S, 'packs', 0.65, 2), 'Pack 5 · Opt-In Saddle Vision — ~18 MB', 'MoveNet Lightning + Hand/Face landmarks (Phase 4)', 'var(--palette-panel)', 'var(--palette-bone)', 'var(--palette-line)')}
  </div>
  </div>`);

// ── Act 4: Chrome Canary & Progressive Enhancement Waterfall ──────────────────────────────────
Film.scene('canary', (S) => `
  <div class="fill field--signal">
  ${title(S, 'Section 8 · Bleeding-Edge Chrome Canary', 'Next in Chrome', 'built-in AI.', 110, 68, 960)}
  <div style="${at(110, 360, 840)}">
    ${fact(S, 1, beatOf(S, 'canary', 0.35, 0), 'Multimodal Gemini Nano (0 MB download)')}
    ${fact(S, 2, beatOf(S, 'canary', 0.15, 1), 'Writer, Rewriter, Summarizer & Translator')}
    ${fact(S, 3, beatOf(S, 'canary', 0.6, 1), 'WebMCP navigator.modelContext tools')}
    ${fact(S, 4, beatOf(S, 'canary', 0.2, 2), 'WebNN NPU offload + WebGPU fp16')}
  </div>
  ${terminal(S, 'chrome://flags · Canary Setup (22 GB free)', [
    ['<span class="terminal__ok">#optimization-guide-on-device-model</span>'],
    ['  → Enabled BypassPerfRequirement'],
    ['<span class="terminal__ok">#prompt-api-for-gemini-nano</span>'],
    ['  → Enabled (+ multimodal-input)'],
    ['<span class="terminal__ok">#web-machine-learning-neural-network</span>'],
    ['  → Enabled (NPU offload)'],
    ['<span class="terminal__ok">#enable-experimental-web-platform-features</span>'],
    ['  → Enabled (WebMCP)'],
    [''],
    ['<span class="terminal__dim">Verify:</span> chrome://on-device-internals'],
  ], beatOf(S, 'canary', 0.15, 2), `${at(1000, 210, 810)}`, { every: S.BEAT * 0.45 })}
  </div>`, { before: 0.3 });

Film.scene('waterfall', (S) => `
  <div class="fill field--blue">
  ${title(S, 'Section 8.3 · Progressive Enhancement', 'Three-tier', 'AI waterfall.', 110, 74, 1700)}
  <div style="${at(110, 360, 1700)}">
    ${badge(S, beatOf(S, 'waterfall', 0.1, 1), 'Tier A · Zero-Download Chrome Built-in AI + WebMCP (Canary / Modern Desktop)', 'Routes workouts, debriefs, summaries & translation to bundled Gemini Nano — 0 MB app download.', 'var(--palette-signal)', 'var(--palette-ink)', 'var(--palette-signal)')}
    ${badge(S, beatOf(S, 'waterfall', 0.55, 1), 'Tier B · WebNN / NPU-Accelerated Hugging Face ONNX (Canary / Edge / NPU Laptops)', 'Runs Silero VAD, Moonshine, Kokoro, Chronos & MoveNet on the NPU — 100% GPU reserved for Three.js.', 'var(--palette-white)', 'var(--palette-ink)', 'var(--palette-white)')}
    ${badge(S, beatOf(S, 'waterfall', 0.25, 2), 'Tier C · Portable Hugging Face ONNX over WebGPU / WASM + OPFS (Every Chrome, Edge & Tablet)', 'Guaranteed offline, private baseline on every supported browser and Android tablet.', 'var(--palette-ink)', 'var(--palette-bone)', 'var(--palette-gold)')}
  </div>
  </div>`);

// ── Close: Telo Ride's purpose from AGENTS.md word for word ───────────────────────────────────
closing('close', { kicker: 'Local AI · Zero cloud bills · Your bike, now a game', after: 1 });

wipeInto('platform', 'var(--palette-bone)');
wipeInto('voice', 'var(--palette-signal)');
wipeInto('discover', 'var(--palette-signal)');
wipeInto('diag', 'var(--palette-bone)');
wipeInto('audit', 'var(--palette-signal)');
wipeInto('canary', 'var(--palette-bone)');
bug();

Film.start();
