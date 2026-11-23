# Architecture decision records

| ADR | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-finite-plans-replace-step-cycles.md) | Finite plans replace endless step cycles | Accepted |
| [0003](0003-estimated-power-and-no-heart-rate.md) | Estimated power, and no heart-rate sensor | Accepted |
| [0004](0004-sse-and-single-process-in-memory-state.md) | Server-Sent Events and single-process in-memory state | Superseded by 0019 |
| [0005](0005-bundled-self-hosted-fonts.md) | Bundled, self-hosted fonts | Accepted |
| [0006](0006-webgl-trace-with-canvas-fallback.md) | WebGL power trace with a Canvas 2D fallback | Accepted |
| [0007](0007-corebluetooth-first.md) | CoreBluetooth is the first real transport | Superseded by 0019 |
| [0008](0008-corebluetooth-through-the-objective-c-runtime.md) | CoreBluetooth through the Objective-C runtime, in a plain app bundle | Superseded by 0019 |
| [0009](0009-treadmill-as-a-second-machine.md) | The treadmill as a second machine | Superseded by 0016 |
| [0010](0010-treadmill-run-design.md) | The treadmill follows the Run design: the Stride's limits, estimates, and a machine page | Superseded by 0016 |
| [0011](0011-treadmill-behind-a-flag.md) | Treadmill support behind a flag | Superseded by 0016 |
| [0012](0012-youtube-ride-along.md) | Ride along to a YouTube video | Accepted, amended by 0014 |
| [0013](0013-angular-workspace-with-libraries.md) | An Angular workspace with `components`, `api` and `wattzup` projects | Accepted, amended by 0016, 0017, 0019 and 0024 |
| [0014](0014-class-catalogue-as-a-file.md) | A class catalogue in a file, with YouTube thumbnails as covers | Accepted, amended by 0017, 0019 and 0028 |
| [0015](0015-sessions-kept-in-a-file.md) | Sessions kept in a file, computed in Core | Superseded by 0019 |
| [0016](0016-bike-only.md) | Wattzup supports the bike only | Accepted |
| [0017](0017-browser-edition.md) | A browser edition with no backend | Superseded by 0019 |
| [0018](0018-static-content-security-policy.md) | A static Content-Security-Policy for the browser edition | Accepted, amended by 0019 |
| [0019](0019-no-backend.md) | No backend: Wattzup runs in the browser only | Superseded by 0025 |
| [0020](0020-three-js-for-world-ride.md) | Three.js draws the World Ride scene, in its own lazy chunk | Accepted, amended by 0021 and 0030 |
| [0021](0021-webgpu-renderer-with-webgl2-fallback.md) | World Ride draws with Three.js's WebGPU renderer, falling back to WebGL2 | Accepted, amended by 0023 and 0030 |
| [0022](0022-hosted-on-azure-static-web-apps.md) | Hosted on Azure Static Web Apps, deployed from main | Superseded by 0026 |
| [0023](0023-bend-the-road-in-the-vertex-stage.md) | World Ride bends the road in the vertex stage | Accepted |
| [0024](0024-telo-ride-workspace.md) | The Telo Ride workspace: `api`, `domain`, `components` and `ride` | Accepted |
| [0025](0025-thin-dotnet-backend.md) | A thin .NET backend for what one browser cannot do alone | Accepted |
| [0026](0026-api-serves-the-app.md) | One App Service: the Telo Ride API serves the app and its backend as one origin | Accepted |
| [0027](0027-marketing-site.md) | The marketing site: a `marketing` application with the pitch film | Accepted |
| [0028](0028-class-catalogue-shipped-with-the-backend.md) | The class catalogue: a JSON file shipped with the backend, public, cached on the device | Accepted |
| [0029](0029-map-catalogue-shipped-with-the-backend.md) | The map catalogue: a JSON file shipped with the backend, public, cached on the device | Accepted |
| [0030](0030-world-library-carried-from-main.md) | World Ride's rendering is carried from `main` into a lazy `world` library | Accepted |
| [0031](0031-sign-in-code-email-over-smtp.md) | Sign-in codes are emailed over SMTP with MailKit | Accepted |
| [0032](0032-register-the-service-worker-from-the-first-screen.md) | The service worker is registered from the first screen's lazy chunk | Accepted |
| [0033](0033-same-origin-proof-instead-of-anti-forgery-tokens.md) | A same-origin proof, not anti-forgery tokens, guards every change | Accepted |
| [0034](0034-maps-built-in-blender.md) | Maps are built in Blender from the class they are modelled after, and ridden by the clock | Proposed |
| [0035](0035-every-map-a-course.md) | Every map in the catalogue is a course, built to its listed distance and climbing | Proposed |
| [0036](0036-the-courses-rider-built-in-blender.md) | The course's rider is one mesh built in Blender, rigged, and its pedalling baked | Proposed |
| [0037](0037-opt-in-ai-library-for-race-announcer.md) | An opt-in `ai` library runs on-device race commentary in a Web Worker | Accepted |
