<p align="center">
  <img src="docs/design-system/assets/logo.svg" alt="Wattzup logo" width="128" height="128">
</p>

# Wattzup

[![CI](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml/badge.svg)](https://github.com/QuinntyneBrown/wattzup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Angular 22](https://img.shields.io/badge/Angular-22-DD0031.svg)

Wattzup turns an Echelon bike into a live training display. It connects to the bike over Bluetooth
Low Energy, shows its metrics in real time (cadence, speed and resistance), and runs interval
workouts that set the bike's resistance for the rider, with a countdown clock and cues at every
step.

Wattzup is an Angular app served as static files. It talks to the bike over Web Bluetooth and
keeps everything in the browser; there is nothing to install next to the bike. It needs Chrome or
Edge.

## Contents

- [Features](#features)
- [Project status](#project-status)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Host it](#host-it)
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
- **Classes.** A library of classes, each a plan with the YouTube video it follows.
- **Ride sound.** An optional chain, freewheel, wind and tyre sound generated in the browser from
  the live cadence, resistance and speed. It is off on every page load; turn it on, and set its
  volume (kept in this browser, 60 % at first), from the `Ride sound` button in the app bar.
  In World Ride, worlds by the sea, in the mountains, in a city or in a park add a quiet
  generated ambience under it.
- **World Ride music.** Each world plays its own royalty-free Pixabay track while you ride, with a
  `Music` toggle that is remembered ([the list](docs/world-music.md)).
- **Ride history.** Rides are kept in the browser (IndexedDB), with a summary of each, progress,
  streaks and personal bests, and export and import of the history.
- **Connection status.** Connecting and reconnecting are shown as they happen, with automatic
  recovery when the link drops.
- **Simulated bike.** Run every feature end to end without hardware (`?simulate` in a development
  build).
- **Diagnostics.** What the browser knows, and a packet log you can download.
- **Installable and offline.** A service worker keeps the app, so it opens and rides without a
  connection.

## Project status

The app is implemented and runs end to end against the simulated bike. Wattzup supports the
Echelon bike only ([ADR 0016](docs/adr/0016-bike-only.md)).

The original Python prototype (`echelon_server.py` and `index.html`) is kept outside this
repository, in `../wattzup-prototype/`, as the reference for behaviour.

## How it works

```
Echelon bike ──BLE notify──▶ BikeLink (Web Bluetooth) ──▶ TelemetryIngestor ──▶ BikeStateStore
                                                                │                    │
                                                          packet decoder     LiveStateService
                                                          (lib/protocol)     (read-only signal)
```

1. **Connect bike** opens the browser's device chooser; `BikeLink` (`@wattzup/browser`) connects,
   subscribes to the notify characteristic, keeps the link alive and recovers it.
2. Each notification is one frame. `TelemetryIngestor` adds it to the packet log and decodes it
   into a resistance or cadence update.
3. `BikeStateStore`, the only writer of the bike state, applies the update and publishes the new
   state, which `LiveStateService` exposes to every screen as a read-only signal.
4. Commands go the other way: the dashboard calls a contract from `@wattzup/api` (for example
   `BIKE_API` or `WORKOUT_API`), and its in-browser implementation writes command bytes to the bike.

| Project | Responsibility |
|---|---|
| `frontend/projects/api` (`@wattzup/api`) | The contracts: data types, injection tokens, errors |
| `frontend/projects/browser` (`@wattzup/browser`) | Their in-browser implementations: protocol, Web Bluetooth, workout engine, IndexedDB storage |
| `frontend/projects/components` (`@wattzup/components`) | Presentation components, named as in the design system |
| `frontend/projects/wattzup` | The app: pages, dialogs, services and the composition root |

The full rules are in [`AGENTS.md`](AGENTS.md) and the
[host and structure design](docs/detailed-designs/platform/host-and-structure/README.md).

## Prerequisites

- [Node.js](https://nodejs.org) 24 or later, with npm
- Chrome or Edge on Windows, macOS, Linux, ChromeOS or Android
- To use real hardware: an Echelon bike and a computer or phone with Bluetooth Low Energy turned on

Safari, Firefox and every browser on iOS have no Web Bluetooth; the dashboard says so instead of
offering **Connect bike**.

## Getting started

```shell
git clone https://github.com/QuinntyneBrown/wattzup.git
cd wattzup/frontend
npm ci
npm start                                 # http://localhost:4200
```

Open `http://localhost:4200/?simulate` to ride the simulated bike, `ECHSIM-0001`, which connects
immediately, pedals at a synthetic cadence and confirms every resistance change. The dashboard
shows a **Simulated bike** banner. A production build ignores `?simulate`.

With a real bike, open `http://localhost:4200`, press **Connect bike** and pick the bike in the
browser's device list. The browser remembers it, and where it can, Wattzup reconnects to it on the
next visit once the bike wakes.

The class catalogue is `frontend/public/classes.json`, shipped beside `index.html`; edit it before
building to change the classes. Rides are kept in this browser only. **Export history** on Progress
saves them to a file that **Import history** reads back. **Download packet log** in Diagnostics
saves the packets in the format of `raw_packets.log`.

## Host it

```shell
cd frontend && npm run build              # static files in dist/wattzup/browser
```

Wattzup is live at **https://wattzup.telo.to**. Every push to `main` that passes CI is deployed
there by the `deploy` job in `.github/workflows/ci.yml` to Azure Static Web Apps, which reads
`frontend/public/staticwebapp.config.json` for the fallback and headers
([ADR 0022](docs/adr/0022-hosted-on-azure-static-web-apps.md)). Its plan takes at most 250 MB of
app content, so `npm run build` fails when `dist/wattzup/browser` grows past that.

To host it elsewhere, serve `dist/wattzup/browser` from any static host over HTTPS (Web Bluetooth needs HTTPS, or
`http://localhost`). The host must answer every path that is not a file with `index.html`, so
links such as `/sessions/<id>` open. The page carries its Content-Security-Policy in a `<meta>`
element; where the host can set headers, send it too, with the three that have no `<meta>` form
([ADR 0018](docs/adr/0018-static-content-security-policy.md)). For example, on Netlify:

```text
# _redirects
/*  /index.html  200

# _headers
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://www.youtube.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data: https://i.ytimg.com; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
```

With nginx, `try_files $uri $uri/ /index.html;` does the fallback, and `add_header` sends the
same headers. Do not send that policy on `ngsw-worker.js`: the service worker fetches the YouTube
player and the class covers for the page, so it needs `connect-src 'self' https://www.youtube.com
https://i.ytimg.com` instead (see `frontend/public/staticwebapp.config.json`).

Once loaded, a service worker keeps the app, so it opens and rides without a connection; class
videos and covers need one. A new version is fetched in the background and used from the next
load, never in the middle of a ride. The browser can install Wattzup as an app.

## Configuration

Wattzup has no settings file. Its one option is `?simulate` in the page address, which a
development build (`npm start`) honours by connecting to the simulated bike; a production build
ignores it. `?simulate=locked` makes the simulated bike start locked, as newer Echelon firmware
does, so the unlock handshake runs end to end. The classes come from `frontend/public/classes.json`.

## Build and test

| Task | Command | Scope |
|---|---|---|
| Check formatting and lint | `cd frontend && npm run format:check && npm run lint` | Prettier and angular-eslint |
| Unit tests | `cd frontend && npm test` | Unit tests of the `components`, `browser` and `wattzup` projects |
| Build | `cd frontend && npm run build` | Production build in `dist/wattzup/browser` and the 300 KB gzipped initial bundle budget |
| Behaviour specs | `cd frontend && npx playwright install chromium && npm run e2e` | Playwright on Chromium against a fake `navigator.bluetooth` |
| Everything CI runs | `node tools/verify/verify.mjs` | All of the above, side by side |

No automated test uses a real bike or Bluetooth. The accessibility, responsive and performance
sweeps (`npm run e2e:sweeps`) are maintained but run only on request.

The performance sweep records World Ride frame times per scene and quality tier on your
machine; it judges no number, so it is for comparing two runs on the same machine. Run it with
one worker, headed so Chromium draws on the GPU, narrowed with `WZ_SCENES` and `WZ_TIERS` if you
like:

```bash
cd frontend
WZ_SCENES=docklands,galibier WZ_TIERS=low,high npm run e2e:sweeps -- performance --workers=1 --headed
node scripts/compare-performance.mjs performance-reports/<before>.json performance-reports/<after>.json
```

Each run writes `performance-reports/<timestamp>.json` and a Markdown table beside it (not
committed). Each row also counts the shader programs compiled once the scene had loaded
and the frames over 50 ms in the first 5 s. The compare prints the median and p95 deltas per scene and tier and marks every one
more than 10 % slower as a regression.

[Continuous integration](.github/workflows/ci.yml) runs every check above on every pull request.

## Repository structure

```
wattzup/
├── frontend/                        The Angular workspace and its Playwright specs
│   ├── projects/api/                  @wattzup/api: contracts, types, tokens
│   ├── projects/browser/              @wattzup/browser: protocol, Web Bluetooth, engine, storage
│   ├── projects/components/           @wattzup/components: presentation components
│   ├── projects/wattzup/              The app
│   ├── public/                        Fonts, images and classes.json
│   └── e2e/                           Playwright behaviour specs, fixtures and page objects
├── docs/
│   ├── journeys.md                  The user journeys, by value add
│   ├── videos/                      A narrated film of each journey
│   ├── specs/                       Requirements: L1 (high level), L2 (acceptance criteria)
│   ├── detailed-designs/            One design per feature, grouped by subsystem
│   ├── mocks/                       HTML mocks, the source of truth for the UI
│   ├── design-system/               Tokens and components extracted from the mocks
│   ├── adr/                         Architecture decision records
│   └── protocol/                    Echelon Bluetooth message and frame reference
├── tools/                           verify, and the video tools: screenshots, narration and music, the film
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
| [Frontend](frontend/README.md) | The app's scripts and conventions |
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
