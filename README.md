<p align="center">
  <img src="docs/design-system/assets/logo.svg" alt="Telo Ride" width="324" height="80">
</p>

# Telo Ride

[![CI](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml/badge.svg)](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031.svg)
![.NET 10](https://img.shields.io/badge/.NET-10-512BD4.svg)

Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike
over Bluetooth, reads your power and sets resistance for every hill and interval. There are two
doors: **Race** (ride a map against your best-time ghost, bots or people) and **Classes** (ride
along to a video, alone or with a group). Both feed one progression of XP, rider levels, stars and
map unlocks. A custom workout lives under Profile.

The frontend is the product: an Angular app that talks to the bike over Web Bluetooth in Chrome or
Edge, and finishes a ride on the device without a network. A thin .NET backend does only what one
browser cannot do alone: email sign-in, rider progress, live races and group classes over SignalR,
and feedback. It never talks to the bike.

## Contents

- [Project status](#project-status)
- [Supported bikes and browsers](#supported-bikes-and-browsers)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Host it](#host-it)
- [Build and test](#build-and-test)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Project status

Telo Ride replaces Wattzup, this repository's earlier Echelon training display, and is being built
on the `telo-ride` branch one slice at a time. [`docs/journeys.md`](docs/journeys.md) lists the 27
journeys in order of value, with each one's **% complete**;
[`docs/detailed-journeys.md`](docs/detailed-journeys.md) splits them into slices.

Built so far:

- **The scaffold.** The Angular workspace and libraries, the .NET clean architecture, the test
  harness (fake Bluetooth, API and hub fixtures, an in-memory backend test server), CI, and hosting
  on one Azure App Service.
- **Connect a bike.** A simulated bike behind `?simulate`, the browser-support check, and pairing
  a bike through the browser's chooser. Telo Ride remembers the bike and reopens on Home without
  the chooser. It keeps the link alive, reconnects on its own after a drop and shows the `ble`
  status.
- **Most of Read live telemetry.** Echelon and FTMS notifications are decoded into power, cadence,
  speed and resistance; an Echelon's power and speed are estimated from cadence and resistance.
  The readouts update live, with ride totals for time, distance and energy.

Next are heart rate and resistance control, then classes, races, the 3D race world, sign-in and
progression.

## Supported bikes and browsers

- **Bikes:** full support for the Echelon EX-5s, EX-3, EX-8s and Connect Sport. Other bikes that
  speak the Bluetooth Fitness Machine Service (FTMS) are in beta.
- **Browsers:** Chrome or Edge, over HTTPS (or `http://localhost`), on Windows, macOS, Linux,
  ChromeOS or Android. Safari, Firefox and every browser on iOS have no Web Bluetooth. Connect Bike
  says why the bike cannot be reached there, and how to fix it.

## How it works

```
Smart bike ──BLE──▶ domain/bluetooth ──▶ domain/protocol ──▶ domain/engine ──▶ ride (screens)
                    (Web Bluetooth)      (frames, checksums)  (workout, sessions)      │
                                                                                       ▼
                                          backend (.NET) ◀── HTTP and SignalR ── api clients
                                          sign-in, progress, live races, group classes, feedback
```

| Project | Responsibility |
|---|---|
| `frontend/projects/api` (`@telo/api`) | Contracts, types, injection tokens, and the HTTP and SignalR clients for the backend |
| `frontend/projects/domain` (`@telo/domain`) | The bike and its rules: `protocol/`, `bluetooth/`, `engine/`, `storage/` |
| `frontend/projects/components` (`@telo/components`) | Presentation components, named as in the design system |
| `frontend/projects/ride` | The app: pages, dialogs and the composition root |
| `backend/src/Telo.Ride.*` | `Domain` ← `Application` ← `Infrastructure` ← `Api` ([backend README](backend/README.md)) |

Dependencies run one way: `ride` → `components`, `api`, `domain`; `domain` → `api`;
`components` → `api` for types only. ESLint enforces it. Every route is lazy-loaded, and only
`domain/bluetooth/` touches `navigator.bluetooth`. The full rules are in [`AGENTS.md`](AGENTS.md)
and [ADR 0024](docs/adr/0024-telo-ride-workspace.md).

## Prerequisites

- [Node.js](https://nodejs.org) 24 or later, with npm
- The [.NET SDK](https://dotnet.microsoft.com/download) 10, for the backend
- Chrome or Edge
- To ride real hardware: a supported bike, and a computer or phone with Bluetooth Low Energy turned
  on

## Getting started

```shell
git clone https://github.com/QuinntyneBrown/wattzup.git
cd wattzup
git checkout telo-ride
cd frontend
npm ci
npm start                                 # http://localhost:4200
```

Open `http://localhost:4200/?simulate` to ride the simulated bike, an Echelon EX-5s that pairs
without the chooser, pedals and reports back every target resistance. A production build ignores
`?simulate`.

With a real bike, open `http://localhost:4200`, press **Connect bike** and pick the bike in the
browser's list. Telo Ride remembers it and opens on Home next time.

The backend's commands are in [`backend/README.md`](backend/README.md).

## Host it

One Azure App Service runs the API and serves the app's build from its `wwwroot`, as one origin
([ADR 0026](docs/adr/0026-api-serves-the-app.md)). Every push to `main` that passes CI is deployed
by the `deploy` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml): it builds, runs the
`migrate` command, then ships. The job is skipped until the repository variables name the host.

[`docs/deployment.md`](docs/deployment.md) lists every setting, the one-time host set-up and the
release steps. To serve a production build locally as the App Service does:

```shell
cd frontend && npm run build              # static files in dist/ride/browser
cd ../backend
dotnet run --no-launch-profile --project src/Telo.Ride.Api -- --webroot ../frontend/dist/ride/browser
```

## Build and test

| Task | Command | Scope |
|---|---|---|
| Format and lint | `cd frontend && npm run format:check && npm run lint` | Prettier, angular-eslint and its dependency boundaries |
| Unit tests | `cd frontend && npm test` | The unit tests of every frontend project, on a fake clock |
| Build | `cd frontend && npm run build && npm run bundle:size` | The production build in `dist/ride/browser`, within the `angular.json` bundle budgets, and its initial bundle at most 300 KB gzipped |
| Behaviour specs | `cd frontend && npx playwright install chromium && npm run e2e` | Playwright on Chromium, with page objects, against a fake `navigator.bluetooth` and fixture answers for the API and hub |
| Backend | `cd backend && dotnet format Telo.Ride.slnx --verify-no-changes && dotnet test --solution Telo.Ride.slnx` | Format, build and acceptance tests through the API on EF Core InMemory |
| Everything | `node tools/verify/verify.mjs` | All of the above, side by side; run it before you push |
| Performance checks | `cd frontend && npm run perf` | Only when a person asks, on the device measured (headed on the reference laptop): Home's LCP and INP on a mid-range phone over 4G, and a race's frame rate at 1920 × 1080 (L2-136 AC2, AC3) |
| Heap checks | `cd frontend && npm run heap` | Only when a person asks, never in verify or CI: the race with its world and a class ride entered and left six times, and a three-hour class, each reading the heap after a forced garbage collection (L2-138 AC1) |

No automated test uses a real bike, Bluetooth, backend or database. [CI](.github/workflows/ci.yml)
runs lint, the production builds and one critical acceptance path per feature in under 5 minutes.
Unit tests run only locally.

## Repository structure

```
wattzup/
├── frontend/                        The Angular workspace and its Playwright specs
│   ├── projects/api/                  @telo/api: contracts, tokens, HTTP and SignalR clients
│   ├── projects/domain/               @telo/domain: protocol, Bluetooth, engine, storage
│   ├── projects/components/           @telo/components: presentation components
│   ├── projects/ride/                 The app
│   └── e2e/                           Behaviour specs, fixtures and page objects
├── backend/                         The .NET service: Domain, Application, Infrastructure, Api, tests
├── docs/
│   ├── journeys.md                  The journeys, by value added, with % complete
│   ├── detailed-journeys.md         Each journey split into slices
│   ├── lessons-learned.md           What each slice taught
│   ├── specs/                       Requirements: L1 (high level), L2 (acceptance criteria)
│   ├── detailed-designs/            One design per feature, grouped by subsystem
│   ├── mocks/                       HTML mocks, the source of truth for the UI
│   ├── design-system/               Tokens and components extracted from the mocks
│   ├── adr/                         Architecture decision records
│   ├── protocol/                    Echelon Bluetooth message and frame reference
│   ├── prompts/                     One ready-to-run prompt per slice
│   ├── videos/                      A narrated film of each slice
│   └── deployment.md                Settings, host set-up and release steps
├── tools/                           verify, and the video tools: recording, narration and music, the film
└── .github/                         CI workflow, issue and pull request templates
```

## Documentation

| Document | Description |
|---|---|
| [User journeys](docs/journeys.md) | What a rider can do, by value added, with progress; slices in [detailed journeys](docs/detailed-journeys.md) |
| [Requirements](docs/specs/L1.md) | What Telo Ride must do (L1), with acceptance criteria in [L2](docs/specs/L2.md) |
| [Detailed designs](docs/detailed-designs/) | One design per feature, with C4, class and sequence diagrams |
| [Mocks](docs/mocks/) | Every page, dialog and state, the source of truth for the UI |
| [Design system](docs/design-system/) | Tokens and components extracted from the mocks |
| [Architecture decisions](docs/adr/README.md) | Why the architecture is the way it is |
| [Echelon protocol](docs/protocol/echelon-ble-messages.md) | The Bluetooth messages and their [frames](docs/protocol/echelon-ble-frames.md) |
| [Videos](docs/videos/README.md) | A narrated film of each finished slice |
| [Backend](backend/README.md) | The .NET projects and their commands |
| [Deployment](docs/deployment.md) | Settings, hosting and release |
| [AGENTS.md](AGENTS.md) | The purpose, architecture rules and the required workflow |

## Contributing

Contributions are welcome. Before you open a pull request, read
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow and [`AGENTS.md`](AGENTS.md) for the
architecture rules. In summary:

- Every change to product code needs a requirement, a detailed design and a mock before any code
  is written.
- Work in small slices, and write the failing acceptance test first.
- Keep the requirements, designs, mocks, tests and code consistent with each other.
- Lazy loading and memory come first: a change that grows the initial bundle or leaks memory is
  not done.

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

Telo Ride is an independent project and is not affiliated with or endorsed by Echelon Fitness.
