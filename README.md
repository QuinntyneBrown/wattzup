<p align="center">
  <img src="docs/design-system/assets/logo.svg" alt="Wattzup logo" width="128" height="128">
</p>

# Wattzup

[![CI](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml/badge.svg)](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![.NET 10](https://img.shields.io/badge/.NET-10-512BD4.svg)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031.svg)

Wattzup turns an Echelon bike or treadmill into a live training display. It connects to the machine
over Bluetooth Low Energy, shows its metrics in real time (cadence, speed and resistance on the bike;
speed, incline and distance on the treadmill), and runs interval workouts that set the bike's
resistance or the treadmill's speed and incline for the rider, with a countdown clock and cues at
every step.

Wattzup runs as a single process on the computer next to the bike: an ASP.NET Core backend that
talks to the bike and serves an Angular dashboard from the same origin.

## Contents

- [Features](#features)
- [Project status](#project-status)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Build and test](#build-and-test)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Features

- **Live metrics.** Cadence, speed, resistance and estimated power, updated as each Bluetooth
  notification arrives.
- **Resistance control.** Set the target resistance from the dashboard; the bike's reported
  resistance confirms each change.
- **Interval workouts.** `hiit`, `intervals` and `flat` plans expand into segments that set the
  resistance, with a countdown and audio cues. An `intervals` plan is built from sets, each with its
  own times, levels and cadence aims, plus a warm-up and cool-down of any length. Work efforts aim
  at 100 rpm.
- **Connection status.** Scanning, connecting and reconnecting are shown as they happen, with
  automatic retry after a Bluetooth error.
- **Treadmill** (off by default, see below). Pick the Echelon Stride or the bike on the machine page (`/machine`), which
  lists the machines nearby with their signal. Set speed
  and incline from the dashboard; treadmill workouts set them for each segment. Wattzup starts the
  belt only after a 3-second countdown, stops it when a ride is paused, stopped or ends, and pauses
  the ride when the belt is stopped from the console
  ([ADR 0009](docs/adr/0009-treadmill-as-a-second-machine.md)).
- **Simulated bike and treadmill.** Run every feature end to end without hardware (`--simulate`).
- **Diagnostics.** A rolling raw packet log and a `status.json` snapshot of the live state.
- **Secure by default.** Listens on loopback only; sharing on a network requires an API key.

## Project status

The .NET backend and the Angular dashboard are implemented and run end to end against the
simulated bike.

Bluetooth transports exist for macOS (CoreBluetooth), Linux (BlueZ) and Windows (WinRT). A transport
is not listed as supported until its hardware smoke test (scan, connect, receive cadence, set
resistance; L2-043) has been run by hand with a real bike. CoreBluetooth is the first transport to
be verified ([ADR 0007](docs/adr/0007-corebluetooth-first.md)).

Treadmill support is **off by default** (`Wattzup:Treadmill:Enabled`, [ADR 0011](docs/adr/0011-treadmill-behind-a-flag.md)):
on the first real Stride-8s it accepted Bluetooth writes but reported nothing and did not start its
belt. With the setting on, it runs end to end against the simulated treadmill. Its Bluetooth frames come from a
third-party reference, not from Echelon; the steps a person must confirm on a real treadmill are
listed under "Needs hardware confirmation" in
[`docs/protocol/echelon-treadmill-frames.md`](docs/protocol/echelon-treadmill-frames.md).

The original Python prototype (`echelon_server.py` and `index.html`) is kept outside this
repository, in `../wattzup-prototype/`, as the reference for behaviour.

## How it works

```
Echelon bike ──BLE notify──▶ IBikeConnection ──▶ TelemetryIngestor ──▶ BikeStateStore
                                                       │                    │
                                                 PacketDecoder        StateBroadcaster
                                                 (Wattzup.Protocol)         │
                                                                   GET /api/events (SSE)
                                                                            │
                                                                   LiveStateService (Angular)
```

1. `BikeConnectionService` (a hosted service in `Wattzup.Api`) scans for the bike through the
   platform's `IBikeTransport`, connects and subscribes to the notify characteristic.
2. Each notification arrives as one byte array holding one frame and is passed to
   `TelemetryIngestor.OnNotify` (`Wattzup.Core`). It writes the frame to the raw packet log and
   decodes it with `PacketDecoder` (`Wattzup.Protocol`) into a `ResistanceUpdate` or a
   `CadenceUpdate`.
3. `BikeStateStore`, the only writer of `BikeState`, applies the update and publishes the new state.
4. `StateBroadcaster` pushes each state to every client of the Server-Sent Events stream,
   `GET /api/events` ([ADR 0004](docs/adr/0004-sse-and-single-process-in-memory-state.md)).
5. In the dashboard, `LiveStateService` owns the single `EventSource`, reconnects when the stream
   drops, and exposes the live state as a read-only signal.

Commands go the other way: the API calls a Core service (for example `ResistanceCommander` or
`WorkoutEngine`), which writes command bytes from `Wattzup.Protocol` to the bike.

| Component | Technology | Responsibility |
|---|---|---|
| `Wattzup.Protocol` | .NET class library, no dependencies | Echelon command bytes, checksums, packet decoding, device matching, speed from cadence |
| `Wattzup.Ble.Abstractions` | .NET class library | `IBikeTransport` and `IBikeConnection` |
| `Wattzup.Ble.CoreBluetooth`, `.BlueZ`, `.Windows`, `.Simulated` | .NET class libraries | Bluetooth transports for macOS, Linux and Windows, and the simulated bike |
| `Wattzup.Core` | .NET class library | Live state, broadcaster, telemetry ingestion, workout engine, raw packet log, status snapshot |
| `Wattzup.Api` | ASP.NET Core minimal APIs | HTTP API, event stream, hosted services, security, and the dashboard in `wwwroot` |
| `Wattzup.Mac` | Shell script and `Info.plist` | Builds `Wattzup.app`, a macOS app bundle that can request Bluetooth permission |
| `frontend/` | Angular 22, standalone components, signals | The dashboard |

Dependencies point inward: `Wattzup.Protocol` depends on nothing, the transports depend only on the
Bluetooth abstractions, and `Wattzup.Api` composes everything. The full rules are in
[`AGENTS.md`](AGENTS.md) and the
[host and structure design](docs/detailed-designs/platform/host-and-structure/README.md).

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org) 24 or later, with npm
- To use real hardware: an Echelon bike or Echelon Stride treadmill and a computer with Bluetooth
  Low Energy
  - **macOS:** Bluetooth permission for the app running the server (System Settings → Privacy &
    Security → Bluetooth).
  - **Linux:** BlueZ 5.50 or later, with your user allowed to use it over D-Bus.
  - **Windows:** Windows 10 version 2004 (build 19041) or later, with Bluetooth on.

No bike, Xcode or extra .NET workload is needed to build and run with the simulated bike.

## Getting started

### Run with the simulated bike

```shell
git clone https://github.com/QuinntyneBrown/wattzup.git
cd wattzup
(cd frontend && npm ci && npm run build:api)
dotnet run --project backend/src/Wattzup.Api -- --simulate
```

Open `http://127.0.0.1:8787`. The simulated bike, `ECHSIM-0001`, connects immediately, pedals at a
synthetic cadence and confirms every resistance change. The dashboard shows a **Simulated bike**
banner.

### Run with the simulated treadmill

```shell
dotnet run --project backend/src/Wattzup.Api -- --simulate --machine treadmill --Wattzup:Treadmill:Enabled=true
```

The simulated treadmill, `STRIDE-SIM-0001`, connects immediately, starts its belt when Wattzup asks
and reports every speed and incline it is set to. You can also switch machines on the setup screen
while no ride is active.

### Run with a bike or treadmill

```shell
dotnet run --project backend/src/Wattzup.Api                       # the bike
dotnet run --project backend/src/Wattzup.Api -- --machine treadmill --Wattzup:Treadmill:Enabled=true  # the treadmill
```

The backend selects the transport for your operating system, scans for the chosen machine and
connects. Pedal to wake the bike, or switch the treadmill on; the status line shows **Connected** and
the machine's name. Stand on the treadmill's side rails when a ride starts: the belt starts when the
countdown reaches zero.

### Build the macOS app

```shell
backend/src/Wattzup.Mac/bundle.sh             # on an Intel Mac: bundle.sh osx-x64
open artifacts/Wattzup.app
```

`bundle.sh` builds the dashboard if needed, publishes the backend self-contained into
`artifacts/Wattzup.app` and signs it ad hoc. Because the bundle is not notarized, open it the first
time with right-click → **Open**. macOS asks once for Bluetooth permission. The app has no window:
browse to `http://127.0.0.1:8787`, and quit it with `pkill -f Wattzup.app`. It writes its runtime
output to `~/Library/Application Support/Wattzup/`.

### Develop the dashboard

```shell
dotnet run --project backend/src/Wattzup.Api -- --simulate   # terminal 1
cd frontend && npm ci && npm start                           # terminal 2: http://localhost:4200
```

`npm start` serves the dashboard with live reload and forwards `/api` to `127.0.0.1:8787`. After you
change the API contract, keep the backend running with `--simulate` and run
`npm run generate:api` to regenerate the TypeScript types and `npm run record:api` to re-record the
responses the Playwright stubs use. See [`frontend/README.md`](frontend/README.md) for every script.

### Share on your network

By default the backend listens on loopback only. To reach it from a tablet or phone, set an API key
and a non-loopback address. The backend refuses to start with a non-loopback address and no key.

```shell
dotnet run --project backend/src/Wattzup.Api -- --Wattzup:Urls=http://0.0.0.0:8787 --Wattzup:Security:ApiKey="a long random phrase"
```

The dashboard asks for the key once per browser session, and every `/api` request then requires it.

## Configuration

Settings are read from `backend/src/Wattzup.Api/appsettings.json`, then environment variables
(`:` becomes `__`, for example `WATTZUP__SECURITY__APIKEY`), then the command line
(`--Wattzup:Urls=...`). Durations use the `hh:mm:ss` format.

| Setting | Default | Description |
|---|---|---|
| `--simulate` | Off | Use the simulated bike and treadmill instead of Bluetooth. Same as `Wattzup:Ble:Transport=Simulated`. |
| `Wattzup:Machine` | `bike` | The machine to connect to at start-up: `bike` or `treadmill`. `--machine treadmill` is short for `--Wattzup:Machine=treadmill`. The rider can change it on the setup screen while no ride is active; the change lasts until the process stops. |
| `Wattzup:Urls` | `http://127.0.0.1:8787` | Where the backend listens. A non-loopback address requires `Wattzup:Security:ApiKey`. |
| `Wattzup:Security:ApiKey` | Empty | When set, every `/api` request requires it in `X-Api-Key`; the event stream takes a single-use token from `POST /api/events/token`. |
| `Wattzup:Security:ControlPermits` | `20` | Control requests (resistance, workout, reconnect) allowed per client per window; further requests get `429`. |
| `Wattzup:Security:ControlWindow` | `00:00:01` | The rate-limit window. |
| `Wattzup:Cors:Origins` | Empty (`http://localhost:4200` in Development) | Origins allowed to call the API cross-origin. Set as `Wattzup:Cors:Origins:0`, `:1`, and so on. |
| `Wattzup:Ble:Transport` | By operating system | `CoreBluetooth`, `BlueZ`, `WinRT` or `Simulated`. |
| `Wattzup:Ble:ScanTimeout` | `00:00:20` | How long one scan looks for the bike before trying again. |
| `Wattzup:Ble:InitCommandSpacing` | `00:00:00.300` | The gap between the start-up commands sent after connecting. |
| `Wattzup:Ble:KeepaliveInterval` | `00:00:01` | How often the keepalive command is written while connected. |
| `Wattzup:Ble:ErrorBackoff` | `00:00:03` | The wait before retrying after a Bluetooth error. |
| `Wattzup:Bike:DisplayName` | Empty | A name to show for the bike instead of its advertised name. |
| `Wattzup:Treadmill:Enabled` | `false` | Turns treadmill support on (L2-075). While it is off, the bike is the only machine: the backend refuses to start with `--machine treadmill`, `POST /api/machine` answers 409 `machine_unavailable` for the treadmill, and the machine page and every switch link are hidden. Environment variable `WATTZUP__TREADMILL__ENABLED`. |
| `Wattzup:Treadmill:DisplayName` | `Echelon Stride` | A name to show for the treadmill instead of its advertised name; empty shows the advertised name. |
| `Wattzup:RawPacketLog:Enabled` | `true` | Whether notifications are written to the raw packet log. |
| `Wattzup:RawPacketLog:Path` | `raw_packets.log` | The log file. Relative paths resolve against the content root. |
| `Wattzup:RawPacketLog:MaxBytes` | `10485760` | The size at which the log rotates. |
| `Wattzup:RawPacketLog:RetainedFiles` | `5` | Rotated files kept (`.1` to `.5`). |
| `Wattzup:StatusSnapshot:Enabled` | `true` | Whether the state is mirrored to the status file. |
| `Wattzup:StatusSnapshot:Path` | `status.json` | The status file, written atomically. |
| `Wattzup:Classes:Path` | `classes.json` | The class catalogue (L2-077, ADR 0014): a JSON file of shelves and classes, each class a bike plan with its YouTube video. A relative path resolves against the content root. A class that breaks a rule is left out with a warning; a missing or invalid file is an empty catalogue. A saved change is served within 2 s. A Wattzup update can replace the shipped `classes.json`, so keep an edited catalogue outside the app folder and point this setting at it. Environment variable `WATTZUP__CLASSES__PATH`. |
| `Wattzup:StatusSnapshot:MinInterval` | `00:00:00.500` | The minimum time between two writes; the final state is always written. |

The raw packet log and the status snapshot are written to the content root
(`backend/src/Wattzup.Api/` under `dotnet run`) unless configured otherwise. Both are git-ignored.

## Build and test

| Task | Command | Scope |
|---|---|---|
| Build the backend | `dotnet build backend/Wattzup.sln` | Every project; warnings are errors |
| Test the backend | `dotnet test backend/Wattzup.sln` | xUnit unit tests for protocol and core rules, and acceptance tests through the API with `WebApplicationFactory`, the simulated bike and `FakeTimeProvider` |
| Check formatting and lint | `cd frontend && npm run format:check && npm run lint` | Prettier and angular-eslint |
| Test the dashboard | `cd frontend && npm test` | Unit tests of all three frontend projects (`components`, `api`, `wattzup`) |
| Build the dashboard | `cd frontend && npm run build` | Production build and the 300 KB gzipped initial bundle budget |
| Run the behaviour specs | `cd frontend && npx playwright install chromium && npm run e2e` | Playwright on Chromium, with every `/api` request and the event stream stubbed |

No automated test uses a real bike or Bluetooth. The accessibility, responsive and visual sweeps
(`npm run e2e:sweeps`) are maintained but run only on request.

[Continuous integration](.github/workflows/ci.yml) runs on every pull request. It builds and tests
the backend on Linux, macOS and Windows, runs every dashboard check above, and verifies that the
generated API types match the backend.

## Repository structure

```
wattzup/
├── backend/                         All .NET code
│   ├── Wattzup.sln
│   ├── Directory.Build.props
│   ├── src/
│   │   ├── Wattzup.Protocol/          Commands, checksums, packet decoding (no dependencies)
│   │   ├── Wattzup.Ble.Abstractions/  IBikeTransport, IBikeConnection
│   │   ├── Wattzup.Ble.CoreBluetooth/ macOS transport (Objective-C runtime)
│   │   ├── Wattzup.Ble.BlueZ/         Linux transport (D-Bus)
│   │   ├── Wattzup.Ble.Windows/       Windows transport (WinRT)
│   │   ├── Wattzup.Ble.Simulated/     Simulated bike (--simulate)
│   │   ├── Wattzup.Core/              State, broadcaster, telemetry, workout engine, writers
│   │   ├── Wattzup.Api/               Host, endpoints, event stream, security, wwwroot
│   │   └── Wattzup.Mac/               macOS app bundle (bundle.sh, Info.plist)
│   └── tests/
│       ├── Wattzup.Protocol.Tests/
│       ├── Wattzup.Core.Tests/
│       └── Wattzup.Api.AcceptanceTests/
├── frontend/                        The Angular dashboard and its Playwright specs
├── docs/
│   ├── journeys.md                  The user journeys, by value add
│   ├── videos/                      A narrated film of each journey
│   ├── specs/                       Requirements: L1 (high level), L2 (acceptance criteria)
│   ├── detailed-designs/            One design per feature, grouped by subsystem
│   ├── mocks/                       HTML mocks, the source of truth for the UI
│   ├── design-system/               Tokens and components extracted from the mocks
│   ├── adr/                         Architecture decision records
│   └── protocol/                    Echelon Bluetooth message and frame reference
├── tools/                           The video tools: screenshots, narration and music, the film
└── .github/                         CI workflows, issue and pull request templates
```

## Documentation

| Document | Description |
|---|---|
| [User journeys](docs/journeys.md) | What a rider can do, by value add, each with a [narrated film](docs/videos/README.md) |
| [Requirements](docs/specs/L1.md) | What Wattzup must do (L1), with acceptance criteria in [L2](docs/specs/L2.md) |
| [Detailed designs](docs/detailed-designs/README.md) | One design per feature, with C4, class and sequence diagrams |
| [Architecture decisions](docs/adr/README.md) | Why the architecture is the way it is |
| [Echelon protocol](docs/protocol/echelon-ble-messages.md) | The Bluetooth messages and their [frames](docs/protocol/echelon-ble-frames.md) |
| [Design system](docs/design-system/) | Tokens and components extracted from the [mocks](docs/mocks/) |
| [Frontend](frontend/README.md) | The dashboard's scripts and conventions |
| [AGENTS.md](AGENTS.md) | Repository layout, architecture rules and the required workflow |

## Contributing

Contributions are welcome. Before you open a pull request, read
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow and [`AGENTS.md`](AGENTS.md) for the
architecture rules. In summary:

- Every change to production behaviour needs a requirement, a detailed design and a mock before any
  code is written.
- Work in small slices, and write the failing acceptance test first.
- Keep the requirements, designs, mocks, tests and code consistent with each other.

## Code of conduct

This project has adopted the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are
expected to uphold this code.

## Security

Do not report security vulnerabilities through public GitHub issues. See [`SECURITY.md`](SECURITY.md)
for how to report one privately.

## Support

See [`SUPPORT.md`](SUPPORT.md) for how to ask a question, report a bug or request a feature.

## License

Copyright (c) 2026 Quinntyne Brown. Licensed under the [MIT License](LICENSE).

Wattzup is an independent project and is not affiliated with or endorsed by Echelon Fitness.
