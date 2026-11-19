// Records real API responses from the backend running with the simulated bike into
// e2e/fixtures/recorded/, so the Playwright stubs keep the backend's exact shapes (AGENTS.md, E2E).
// Recording is never part of a test run. Start the backend first, with an empty sessions file of
// its own, so the session recordings start from no history (L2-082):
//   dotnet run --project backend/src/Wattzup.Api -- --simulate \
//     --Wattzup:Sessions:Path=/tmp/wattzup-record/sessions.json
// then: npm run record:api [-- http://127.0.0.1:8787]
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = process.argv[2] ?? 'http://127.0.0.1:8787';
const out = new URL('../e2e/fixtures/recorded/', import.meta.url);
mkdirSync(out, { recursive: true });

const plan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
};
// The Descending recoveries plan (L2-010 criterion 11).
const intervalsPlan = {
  kind: 'intervals',
  warmup: { seconds: 300, level: 14, cadence: 80 },
  sets: [180, 150, 120, 90, 0].map((rest_seconds, i) => ({
    rounds: i === 0 || i === 4 ? 1 : 2,
    work_seconds: 30,
    work_level: 24,
    work_cadence: 100,
    rest_seconds,
    rest_level: 8,
    rest_cadence: 72,
  })),
  cooldown: { seconds: 360, level: 6, cadence: 70 },
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitConnected() {
  for (let i = 0; ; i++) {
    const status = await call('GET', '/api/status').catch(() => null);
    // `ble` turns connected before the start-up commands are written; give them time to finish.
    if (status?.json.ble === 'connected') return wait(1500);
    if (i > 30) throw new Error(`The backend at ${base} is not connected to the simulated bike.`);
    await wait(1000);
  }
}

async function call(method, path, body, contentType = 'application/json') {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

function save(name, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${name}: expected ${expectedStatus}, got ${response.status} ${JSON.stringify(response.json)}`,
    );
  }
  writeFileSync(new URL(`${name}.json`, out), JSON.stringify(response.json, null, 2) + '\n');
  console.log(`recorded ${name} (${response.status})`);
}

await waitConnected();

// The class catalogue: the default classes.json (L2-077, L2-078).
save('classes', await call('GET', '/api/classes'), 200);
save('class-30-minute-hiit-cardio', await call('GET', '/api/classes/30-minute-hiit-cardio'), 200);
save(
  'class-60-min-dolomites-endurance',
  await call('GET', '/api/classes/60-min-dolomites-endurance'),
  200,
);
save('problem-class-not-found', await call('GET', '/api/classes/no-such-class'), 404);

await call('POST', '/api/workout/stop');
save('status-free-ride', await call('GET', '/api/status'), 200);
save('problem-no-active-workout', await call('POST', '/api/workout/pause'), 409);
save(
  'problem-invalid-workout',
  await call('POST', '/api/workout', { ...plan, work_seconds: 3601 }),
  400,
);
save('problem-invalid-json', await call('POST', '/api/workout', '{"kind":'), 400);
save('problem-invalid-level', await call('POST', '/api/resistance', { level: 33 }), 400);
save(
  'problem-unsupported-media-type',
  await call('POST', '/api/resistance', 'level=12', 'text/plain'),
  415,
);
save('problem-already-connected', await call('POST', '/api/bike/reconnect'), 409);
save('problem-not-found', await call('GET', '/api/nope'), 404);
save('resistance-sent', await call('POST', '/api/resistance', { level: 10 }), 200);
save('workout-started', await call('POST', '/api/workout', plan), 200);
await wait(3500);
save('status-running', await call('GET', '/api/status'), 200);
save('trace', await call('GET', '/api/workout/trace'), 200);
save('workout-paused', await call('POST', '/api/workout/pause'), 200);
save('workout-resumed', await call('POST', '/api/workout/resume'), 200);
save('workout-stopped', await call('POST', '/api/workout/stop'), 200);
save(
  'problem-invalid-intervals',
  await call('POST', '/api/workout', {
    ...intervalsPlan,
    sets: [{ ...intervalsPlan.sets[0], rest_seconds: 3 }],
  }),
  400,
);
save('intervals-workout-started', await call('POST', '/api/workout', intervalsPlan), 200);
save('intervals-workout-stopped', await call('POST', '/api/workout/stop'), 200);
save(
  'video-workout-started',
  await call('POST', '/api/workout', {
    ...plan,
    video: { url: 'https://www.youtube.com/watch?v=QUoToFsMNig', start_seconds: 12 },
  }),
  200,
);
await call('POST', '/api/workout/stop');

// Ride history (L2-081, L2-083): no sessions yet, then a class ride of a minute, saved when it stops.
save('sessions-empty', await call('GET', '/api/sessions'), 200);
save('progress-empty', await call('GET', '/api/progress'), 200);
save(
  'problem-invalid-class-id',
  await call('POST', '/api/workout', { ...plan, class_id: 'no-such-class' }),
  400,
);
const hiitClass = (await call('GET', '/api/classes/30-minute-hiit-cardio')).json;
const { video, ...classPlan } = hiitClass.plan;
const classStart = await call('POST', '/api/workout', {
  ...classPlan,
  video: {
    url: `https://www.youtube.com/watch?v=${video.video_id}`,
    start_seconds: video.start_seconds,
  },
  class_id: hiitClass.id,
});
if (classStart.status !== 200) throw new Error(`class start: ${JSON.stringify(classStart.json)}`);
await wait(62_000);
const stopped = await call('POST', '/api/workout/stop');
save('workout-stopped-session', stopped, 200);
save('status-stopped-session', await call('GET', '/api/status'), 200);
save('sessions', await call('GET', '/api/sessions'), 200);
save('session', await call('GET', `/api/sessions/${stopped.json.session_id}`), 200);
save('progress', await call('GET', '/api/progress'), 200);
save('problem-session-not-found', await call('GET', '/api/sessions/000000000000'), 404);
save('packets', await call('GET', '/api/diagnostics/packets'), 200);
save('health', await call('GET', '/health'), 200);

execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', new URL('.', out).pathname], {
  stdio: 'inherit',
});
