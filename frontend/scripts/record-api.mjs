// Records real API responses from the backend running with the simulated bike and treadmill into
// e2e/fixtures/recorded/, so the Playwright stubs keep the backend's exact shapes (AGENTS.md, E2E).
// Recording is never part of a test run. Start the backend first, with treadmill support on (L2-075):
//   dotnet run --project backend/src/Wattzup.Api -- --simulate --Wattzup:Treadmill:Enabled=true
// then: npm run record:api [-- http://127.0.0.1:8787]
// The recorder switches the backend to the simulated treadmill and back to the bike before it ends.
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
// The treadmill setup form's default, Minute on (L2-072 AC4).
const treadmillPlan = {
  kind: 'hiit',
  rounds: 6,
  work_seconds: 60,
  rest_seconds: 60,
  work_speed: 13.0,
  rest_speed: 6.0,
  work_incline: 2,
  rest_incline: 1,
  warmup: true,
  cooldown: true,
};
// The Descending recoveries plan (L2-010 criterion 11).
const intervalsPlan = {
  kind: 'intervals',
  warmup: { seconds: 300, level: 8, cadence: 80 },
  sets: [180, 150, 120, 90, 0].map((rest_seconds, i) => ({
    rounds: i === 0 || i === 4 ? 1 : 2,
    work_seconds: 30,
    work_level: 28,
    work_cadence: 100,
    rest_seconds,
    rest_level: 8,
    rest_cadence: 72,
  })),
  cooldown: { seconds: 360, level: 6, cadence: 70 },
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitConnected(machine) {
  for (let i = 0; ; i++) {
    const status = await call('GET', '/api/status').catch(() => null);
    // `ble` turns connected before the start-up commands are written; give them time to finish.
    if (status?.json.ble === 'connected' && status.json.machine === machine) return wait(1500);
    if (i > 30)
      throw new Error(`The backend at ${base} is not connected to the simulated ${machine}.`);
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

await waitConnected('bike');

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
save(
  'problem-machine-workout-active',
  await call('POST', '/api/machine', { machine: 'treadmill' }),
  409,
);
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
save('packets', await call('GET', '/api/diagnostics/packets'), 200);
save('health', await call('GET', '/health'), 200);
save('problem-wrong-machine', await call('POST', '/api/speed', { speed: 7.0 }), 409);
save('problem-invalid-machine', await call('POST', '/api/machine', { machine: 'rower' }), 400);

save('machine-treadmill', await call('POST', '/api/machine', { machine: 'treadmill' }), 200);
await waitConnected('treadmill');
save('status-treadmill-idle', await call('GET', '/api/status'), 200);
save('problem-invalid-speed', await call('POST', '/api/speed', { speed: 19.4 }), 400);
save('problem-invalid-incline', await call('POST', '/api/incline', { incline: 11 }), 400);
save('problem-wrong-machine-resistance', await call('POST', '/api/resistance', { level: 10 }), 409);
save('speed-sent', await call('POST', '/api/speed', { speed: 8.5 }), 200);
save('incline-sent', await call('POST', '/api/incline', { incline: 2 }), 200);
save(
  'problem-invalid-treadmill-workout',
  await call('POST', '/api/workout', { ...treadmillPlan, work_speed: 19.4 }),
  400,
);
save('treadmill-workout-started', await call('POST', '/api/workout', treadmillPlan), 200);
await wait(1200);
save('status-treadmill-countdown', await call('GET', '/api/status'), 200);
await wait(6000);
save('status-treadmill-running', await call('GET', '/api/status'), 200);
save('treadmill-workout-paused', await call('POST', '/api/workout/pause'), 200);
save('treadmill-workout-stopped', await call('POST', '/api/workout/stop'), 200);
save('machine-bike', await call('POST', '/api/machine', { machine: 'bike' }), 200);
await waitConnected('bike');

execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', new URL('.', out).pathname], {
  stdio: 'inherit',
});
