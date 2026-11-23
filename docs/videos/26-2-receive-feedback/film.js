// Slice 26.2 · Receive feedback. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app from shots.ts, its API fixture answering as this slice's backend does; the terminals hold
// real outputs: the acceptance tests' names, the feedback command's report from a test run, trimmed with "…", and the
// test runs before the change and after. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const line = (text) => [`<span style="color:var(--color-muted)">${esc(text)}</span>`];
const REGION = 'height:auto';

const TESTS = [
  'FeedbackTests.cs:59:    A_bug_report_is_stored_with_its_context_diagnostics_rider_and_time_and_the_team_reads_it',
  'FeedbackTests.cs:83:    Kudos_carry_no_diagnostics_and_the_message_and_context_are_kept_as_data',
  'FeedbackTests.cs:107:   Feedback_without_a_session_is_refused_with_401',
  'FeedbackTests.cs:118:   The_11th_report_in_an_hour_is_refused_until_the_hours_first_falls_out_of_it',
  'FeedbackTests.cs:158:   A_report_that_is_not_feedback_is_refused_naming_its_field',
];
const REPORT = [
  "{\"id\":\"3dc6b0a4-a333-4de8-82c1-3ca1da54598f\",",
  "  \"riderId\":\"7fccd9fb-bc7d-46f1-a030-a77809e2feca\",\"kind\":\"bug\",",
  "  \"message\":\"Resistance stayed at L8.\",",
  "  \"context\":[{\"term\":\"Workout\",\"value\":\"HIIT · 8 × 0:30\"}, …],",
  "  \"appVersion\":\"2.0.0 · client a1b2c3d\",",
  "  \"packetLog\":\"{\\u0022time\\u0022:…}\\n\",",
  "  \"receivedAt\":\"2026-11-21T09:00:00+00:00\"}"
];
const KUDOS = "{\"kind\":\"kudos\",\"message\":\"\\u003Cb\\u003EGreat\\u003C/b\\u003E \\u003Cscript\\u003Ealert(\\u0027hi\\u0027)\\u003C/script\\u003E …\"}";

// ── Act 1: stored ─────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 26.2 · Receive feedback',
  words: 'Every note,',
  accent: 'received.',
  width: 700,
  device: (S) => onBrowser(S, 'ride-sent-xl', 980, 300, 860, S.beat(3), { ratio: 1440 / 900, tilt: 3 }),
});

Film.scene('stored', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-119 AC1, AC2 · POST /api/feedback', 'Stored,', 'with 201.', 110, 140, 700)}
  ${terminal(S, 'backend/tests/Telo.Ride.Api.Tests', [
    prompt('grep -n "public async Task" FeedbackTests.cs'),
    ...TESTS.map(line),
  ], onBeat(S, part('stored', 0, 0.2)), `${at(110, 470, 1700)};font-size:21px`, { every: S.BEAT * 0.45 })}
  </div>`);

Film.scene('limit', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-119 AC3 · 429 rate_limited', 'Ten', 'an hour.', 110, 140, 640)}
  ${closeup('form-bug', `${at(780, 210, 500)};${REGION}`, pop(S, onBeat(S, part('limit', 0, 0.15)), { tilt: -2 }))}
  ${closeup('form-limited', `${at(1330, 300, 500)};${REGION}`, pop(S, onBeat(S, part('limit', 0, 0.45)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: read ───────────────────────────────────────────────────────────────────────────────
Film.scene('read', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-119 AC4 · dotnet Telo.Ride.Api.dll feedback', 'Read as data,', 'never as HTML.', 110, 120, 1300)}
  ${terminal(S, 'what the feedback command wrote, in a test run', [
    prompt('dotnet Telo.Ride.Api.dll feedback'),
    ...REPORT.map(line),
    line(KUDOS),
  ], onBeat(S, part('read', 0, 0.2)), `${at(110, 400, 1700)};font-size:20px`, { every: S.BEAT * 0.4 })}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--blue">
  ${title(S, 'FeedbackTests.cs · FeedbackTelemetryTests.cs', 'Failing first,', 'passing now.', 110, 140, 1100)}
  ${terminal(S, 'backend · before, then after', [
    prompt('dotnet test --solution Telo.Ride.slnx -- --filter-class "*FeedbackTests"'),
    ['failed A_bug_report_is_stored_with_its_context_diagnostics_rider_and_time_and_the_team_reads_it', 'terminal__error'],
    ['  Actual:   NotFound', 'terminal__error'],
    prompt('dotnet test --solution Telo.Ride.slnx -- --filter-class "*FeedbackTests" --filter-class "*FeedbackTelemetryTests"'),
    [`  total: 14   failed: 0   ${ok('succeeded: 14')}`],
    prompt('dotnet test --solution Telo.Ride.slnx'),
    [`  total: 534   failed: 0   ${ok('succeeded: 534')}`],
  ], onBeat(S, part('proof', 0, 0.2)), `${at(110, 450, 1700)};font-size:20px`, { every: S.BEAT * 0.45 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/sent-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The thanks,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 26.2 · Receive feedback' });

wipeInto('read');
bug();

Film.start();
