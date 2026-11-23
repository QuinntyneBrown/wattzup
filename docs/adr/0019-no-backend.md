# 0019. No backend: Wattzup runs in the browser only

- **Status:** Superseded by [0025](0025-thin-dotnet-backend.md)
- **Date:** 2026-11-19
- **Supersedes:** [0004](0004-sse-and-single-process-in-memory-state.md), [0007](0007-corebluetooth-first.md), [0008](0008-corebluetooth-through-the-objective-c-runtime.md), [0015](0015-sessions-kept-in-a-file.md), [0017](0017-browser-edition.md)
- **Amends:** [0013](0013-angular-workspace-with-libraries.md), [0014](0014-class-catalogue-as-a-file.md), [0018](0018-static-content-security-policy.md)

## Context

ADR 0017 added a browser edition beside the .NET backend: the same Angular app, built with a
second composition root that binds every `@wattzup/api` contract to an in-browser implementation in
`@wattzup/browser`. It connects to the bike over Web Bluetooth, runs the protocol and workout rules
in the page, keeps sessions in IndexedDB and is served as static files. The backend edition stayed
the reference: every rule lived twice, in C# and in TypeScript, proven by the same table of cases.

With both editions built, the browser edition does everything the rider needs. The backend
edition costs the project far more than it gives:

- Every protocol and workout rule is written, tested and changed twice, and a drift between them is
  a bug.
- The backend needs a computer next to the bike with a working Bluetooth stack for each platform
  (WinRT, BlueZ, CoreBluetooth through the Objective-C runtime), a macOS app bundle, an HTTP API with
  an API key, event tokens, rate limits and security headers, an OpenAPI document and generated
  types, recorded API responses for the end-to-end specs, and a status snapshot and raw packet log
  on disk.
- The app carries an `EDITION` token, two composition roots, an event-stream transport, an API-key
  interceptor and an Unlock page that only one edition uses.

## Decision

**Wattzup is the in-browser app only. The .NET backend and the backend edition are removed.**

- `backend/` is deleted: `Wattzup.Protocol`, `Wattzup.Core`, `Wattzup.Ble.*`, `Wattzup.Api`,
  `Wattzup.Mac` and their tests. There is no REST API, event stream, API key, OpenAPI document,
  status snapshot, raw packet log file or server log (supersedes 0004, 0007, 0008).
- The Angular workspace keeps its four projects (amends 0013). `@wattzup/api` holds the contracts,
  their injection tokens and the state types, now hand-maintained in
  `projects/api/src/contract/schema.d.ts` instead of generated from OpenAPI; it has no HTTP
  implementation. `@wattzup/browser` holds the only implementation of each contract. There is one
  composition root, `app.config.ts`, and no `EDITION` token.
- The protocol and workout rules live in `@wattzup/browser` only (`lib/protocol/`, `lib/engine/`).
  Their own unit tests are the reference; there is no second implementation to keep in step.
- Sessions are kept in IndexedDB, with export and import of the history file (supersedes 0015;
  the session record and the Progress rules of L2-081 and L2-087 are unchanged). The class
  catalogue is `classes.json` beside `index.html` (amends 0014).
- The Content-Security-Policy is the `<meta>` policy of ADR 0018, carried by `index.html`; there is
  no server to send a header or a nonce (amends 0018).
- `npm run build` builds the app into `frontend/dist/wattzup/browser`, a folder of static files for
  any HTTPS host; `npm start` serves it in development, and `?simulate` there connects to a
  simulated bike. The Playwright specs run against a fake `navigator.bluetooth` and make no request
  to a server.
- Wattzup needs Chrome or Edge, over HTTPS or on `localhost`. Elsewhere it says so and keeps the
  class library and past rides readable (L2-089).

## Consequences

- Each rule exists once, in TypeScript. The backend's C# tests are gone, so the browser library's
  unit tests carry every table of cases on their own.
- Riding needs a Chromium browser near the bike. Safari, Firefox and every browser on iOS cannot
  ride; there is no fallback through a computer running Wattzup.
- The rider picks the bike once in the browser's chooser instead of Wattzup scanning in the
  background, and a hidden tab may be throttled; the monotonic workout clock and the wake lock of
  L2-092 cover that.
- History lives in one browser unless the rider exports it. There is no longer a second device
  reading the same history from a server.
- A dashboard on a second device cannot follow a ride on the first; each browser runs its own ride.
- The requirements, designs, mocks and films that described the backend are removed or rewritten:
  the server-offline, scanning, shared-on-network and Unlock states are gone, and the API-key journey
  and its film are deleted.
