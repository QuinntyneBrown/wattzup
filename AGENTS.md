## Purpose

> Wattzup turns an Echelon bike into a live training display. It connects to the bike over
> Bluetooth, shows its live metrics in real time (cadence, speed and resistance), and runs interval
> workouts that set the bike's resistance for the rider.

Wattzup is an Angular app served as static files. It talks to the bike over Web Bluetooth and
keeps everything in the browser; it needs Chrome or Edge. There is no backend (ADR 0019).

Before adding or changing anything, ask how it serves that purpose; if it does not, do not build
it, and if a request works against it, say so.

The mission, Wattzup's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Where things are

- The working prototype, `echelon_server.py` (Python, aiohttp, bleak) with its single-page UI
  `index.html`, lives outside this repository in `../wattzup-prototype/`. Read it there; do not
  copy it back in. It is the reference for behaviour, not the product: the rewrite is an Angular
  app (`frontend/`), laid out in `docs/detailed-designs/platform/host-and-structure/`. All code
  (the Angular workspace and its Playwright specs) lives under `frontend/`, and nothing but
  guidance, docs and repository tooling sits at the root. Behaviour from the prototype is
  preserved unless a requirement says otherwise.
- Before building a feature, read its requirement (`docs/specs/L1.md`, `L2.md`), its detailed
  design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth for the UI;
  `docs/design-system/` is extracted from them). `docs/detailed-designs/README.md` indexes the
  designs by subsystem.
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture, a
  helper, a folder), the first change that needs it adds it.

### Folder structure

The repository is expected to have the layout below. Some folders do not exist yet; the first
change that needs one creates it in the place shown here. Put a new folder somewhere else only
after updating this tree in the same change.

```
wattzup/
├── AGENTS.md, CLAUDE.md, README.md        # guidance; README documents hosting and the one option
├── frontend/                              # ALL code: one Angular workspace
│   ├── projects/
│   │   ├── api/                           # library @wattzup/api: contracts, types, tokens
│   │   │   └── src/
│   │   │       ├── contract/              # the data types (schema.d.ts), hand-maintained
│   │   │       ├── lib/                   # contracts, tokens, ContractError
│   │   │       └── public-api.ts
│   │   ├── browser/                       # library @wattzup/browser: the in-browser
│   │   │   └── src/                       # implementations of the api contracts (L2-088 to L2-099)
│   │   │       ├── lib/protocol/          # frames, commands, checksum, decoder
│   │   │       ├── lib/bluetooth/         # Web Bluetooth connection, keepalive, recovery, simulated bike
│   │   │       ├── lib/engine/            # workout engine, estimates, session rules
│   │   │       ├── lib/storage/           # IndexedDB sessions, export and import
│   │   │       ├── lib/contracts/         # each api contract implemented in the browser
│   │   │       └── public-api.ts
│   │   ├── components/                    # library @wattzup/components: presentation components
│   │   │   └── src/
│   │   │       ├── lib/                   # one folder per component, named as in the design system
│   │   │       ├── styles/design-system/  # SCSS partials (`@use 'design-system/btn'`)
│   │   │       └── public-api.ts
│   │   └── wattzup/                       # the application
│   │       └── src/app/
│   │           ├── core/                  # services and pure helpers, with unit tests
│   │           ├── dashboard/             # pages, dialogs, orchestrating components
│   │           └── app.config.ts          # the composition root
│   ├── public/                            # fonts, images and classes.json, copied into the build
│   │   └── music/                         # one background track per world, <world id>.ogg (L2-128)
│   ├── e2e/                               # Playwright: fixtures/ (fake navigator.bluetooth), pages/, specs, sweeps/
│   └── scripts/                           # bundle-size check, e2e static server
├── docs/
│   ├── journeys.md                        # the user journeys, by value add
│   ├── world-music.md                     # each world's track: title, artist, Pixabay page
│   ├── videos/                            # a narrated film per journey (docs/videos/README.md)
│   ├── specs/                             # L0.md (mission, when written), L1.md, L2.md
│   ├── detailed-designs/                  # {subsystem}/{feature}/README.md + diagrams/
│   ├── mocks/                             # HTML mocks, UI source of truth
│   ├── design-system/                     # extracted from the mocks
│   ├── screenshots/                       # World Ride captures, one folder per world (never docs/worlds/)
│   ├── adr/                               # architecture decision records
│   └── protocol/                          # Echelon BLE frame reference (echelon-ble-frames.md)
├── tools/                                 # verify (every CI check, locally); video-record, video-audio, video-build (the films)
├── .github/                               # issue and PR templates, CI workflows
└── .agents/skills/, .claude/skills/       # agent skills
```

Run npm commands from `frontend/` (`cd frontend && npm …`). `npm run build` builds the app into
`dist/wattzup/browser`, a folder of static files; `npm start` serves it in development, and
`?simulate` there connects to a simulated bike.
`node tools/verify/verify.mjs` runs every check CI runs (install, format, lint, unit tests, the
production build and the behaviour specs) side by side; run it before pushing.

Use the words the specs use in code, docs and UI; no synonyms. A workout follows a plan (`hiit`,
`intervals` or `flat`; an `intervals` plan is a warm-up, ordered sets and a cool-down) expanded into segments (kind, start, duration, level, cadence aim, round); the bike's reported level is "resistance",
the requested one is "target resistance"; the Bluetooth link state is `ble`. A class is a catalogue entry (ADR 0014): a bike plan with the YouTube video it follows, on a shelf; the rider picks one in the class library (`/classes`) and opens its class page (`/classes/:id`). A session is a saved bike ride (ADR 0015): what was ridden, its totals, its traces and its cadence dips, kept in IndexedDB; the rider reads one on its Session Summary (`/sessions/:id`) and all of them on Progress (`/progress`), with the streak, the weekly goal, personal bests and achievements. Wattzup supports the
bike only (ADR 0016); there is no machine choice. The in-browser implementation of an `api`
contract is called by the contract's name.

## Prefer best practice

Choose the platform's established best practice (Angular, Playwright, WCAG) over the
expedient way. A departure needs an ADR giving its reason. If a rule here or in an ADR conflicts
with best practice, say so and propose the correction; do not work around it silently.

## Rules of the app

- Protocol rules (framing, decoding, checksums, command bytes) live in `@wattzup/browser`'s
  `lib/protocol/` and nowhere else. Business rules (workout stepping, target vs. actual
  resistance, displayed time, sessions and progress) live in `lib/engine/`. A rule with a table of
  cases is proven by a unit test with one case per row.
- Nothing outside `lib/bluetooth/` touches `navigator.bluetooth`. Every feature runs end to end
  against the simulated bike (`?simulate` in a development build).
- `BikeStateStore` is the only writer of the bike state; each change replaces it whole. Workout
  run state is touched only by the engine.
- The state and session shapes keep the prototype's snake_case field names, and nulls are
  written, never omitted, so exported histories keep importing. A change to them changes
  `projects/api/src/contract/schema.d.ts` in the same change.
- A contract refuses with a `ContractError` whose `code` a screen branches on; the rider sees a
  generic message, and the detail goes only to the console.
- Logging goes to the console only (L2-095 AC4); per-packet lines only while Log every packet is
  on. Bluetooth device names and error strings are data, rendered as text, never as HTML.
- A new option is documented in the README in the same change.

## Frontend

`frontend/` is one Angular workspace of four projects under `projects/` (ADR 0013, L2-088): the
`components` library (presentation components, imported as `@wattzup/components`), the `api`
library (the contracts, their types and tokens, `@wattzup/api`), the `browser` library (the
in-browser implementations of those contracts, `@wattzup/browser`) and the `wattzup` application
(everything else). `wattzup` is the only application; a further one needs its own ADR. Its
production build (`dist/wattzup/browser`) is served by any static host over HTTPS.

- **Dependency direction.** `wattzup` → `components`, `api` and `browser`; `components` → `api`
  for types only; `browser` → `api`; `api` → nothing in the workspace. No library imports the app.
  Only the composition root, `app.config.ts`, imports `@wattzup/browser`. ESLint
  (`no-restricted-imports`) enforces it. The libraries are compiled from source through the path
  aliases in `frontend/tsconfig.json`, never built or published on their own.
- **Presentation components live in `components`**, each named as the design-system component it
  renders (a part keeps its own name, filed under its component in the host-and-structure
  design). A presentation component takes inputs and emits outputs and injects no app service,
  API token or router; its parent computes what it shows. A component that orchestrates (pages,
  dialogs that call services, anything that injects a store, a token or the router) stays in the
  app under `src/app/dashboard/`.

- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `ChangeDetectionStrategy.OnPush`
  everywhere, zoneless where supported.
- Selectors are `wz-*` in every project (`prefix: "wz"`); class, file and folder names omit the
  prefix.
- **File per type.** A component is `name.ts` + `name.html` + `name.scss` with
  `templateUrl`/`styleUrl`, never inline `template`/`styles`.
- **One encapsulated BEM stylesheet per component.** Default encapsulation, never
  `ViewEncapsulation.None`. The component is the block, named as in the design system;
  `block__element`, `block--modifier`; a state assistive technology must know is an attribute
  (`aria-current`, `aria-invalid`, `aria-pressed`, `disabled`) and is styled through it. Never
  style another component's block. Keep the mocks' BEM classes: e2e locators depend on them. No
  inline `style` in templates.
- Global styles are foundations only (tokens, `@font-face`, reset, utilities). Read tokens by
  role, never hex. Fonts are bundled and self-hosted, never loaded from a CDN (the CSP allows
  same-origin only, except YouTube: the player for a ride-along video and the thumbnails shown as class covers, ADRs 0012 and 0014).
- **Declare each `ng-content` slot once.** A component rendering `<a>` or `<button>` by
  condition puts its slots in one `<ng-template>` rendered with `ngTemplateOutlet` in both
  branches. A consumer `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011): one `@if`
  per node.
- One injectable service, `LiveStateService`, owns the live state, exposed as a read-only signal,
  read from the in-browser bike connection and workout engine. No component opens its own
  connection, polls, or touches `navigator.bluetooth`; only `lib/bluetooth/` does.
- Logic with many cases (metric history, the countdown and phase, cues, the workout draft) lives
  in a service or pure helper with its unit tests, never in a component: in the app under
  `projects/wattzup/src/app/core/`, or beside the library code it serves. Each project has its own
  `test` target; `npm test` runs them all.
- The data types live in `projects/api/src/contract/schema.d.ts` and are named only through
  `api-types.ts`; never redeclare one elsewhere. Each service has a contract and an injection
  token in `api`; app components depend on the token. The app has one composition root,
  `app.config.ts`, which binds every token to its `@wattzup/browser` implementation.
- Nothing the app does leaves the device except loading YouTube videos and covers (L2-097): no
  analytics, no remote logging, no other origin. Workout time comes from a monotonic clock, never
  from counting ticks, because the browser throttles hidden tabs. Sessions live in IndexedDB in
  the session record's shape, so an exported history imports anywhere.
- **No inline forms.** Button-triggered editing (e.g. the workout editor) opens a CDK Dialog or
  navigates to a screen. Never hand-roll modals.
- World Ride never draws a generic oval shadow: no round, disc or ellipse blob under a figure,
  vehicle or prop, in any world at any tier. A shadow takes the shape of what casts it, or comes
  from the shadow map (#937).
- The animation loop pauses when the tab is hidden and respects `prefers-reduced-motion`. The
  initial bundle stays within the 300 KB gzipped budget.
- Every interaction works by touch on a phone and by keyboard on a desktop; touch targets are at
  least 44 × 44 px; colour is never the only carrier of a state.

## E2E (Playwright)

- **No real bike or Bluetooth.** Specs run against the production build with a fixture
  (`e2e/fixtures/wz-test.ts`) that installs a fake `navigator.bluetooth`: it records every write
  and pushes notifications on demand, and an unexpected Bluetooth call fails the spec. A request
  off localhost fails the spec, and so does an error in the page. Hardware smoke tests are run by
  a person, never by an agent or CI.
- Page Object Model: one page object per screen or dialog owns the selectors. Never put a
  selector in a test. Specs import `test`/`expect` from the shared fixture.
- Only behaviour specs run by default. Visual, responsive and accessibility sweeps are written
  and kept current but run only when a person asks; no agent runs them or updates visual
  baselines unprompted. Update baselines only for intentional design changes, after changing the
  mock first.
- Chromium only; never configure or run another browser.
- In unit tests, time-driven rules (keepalive, init spacing, workout ticks,
  retries) advance a fake clock; never sleep.

## Incremental implementation and ATDD (mandatory)

Every new feature or change to production behaviour needs a requirement, a detailed design and a
mock before implementation. Documentation-, design-system-, mock- and test-only changes are
exempt, and mocks and the design system get no tests.

Before writing any code, invoke and follow the `implementing-incrementally` skill, with ATDD:
plan small slices and finish one at a time. For each, write Given-When-Then criteria, write the
acceptance test (Playwright with page objects), run it to
prove it fails for the expected reason, then implement only that slice, refactor green and run
the regression checks before the next. No bulk implementation, no tests added afterwards, no
weakening tests to pass. Keep requirement, design, mock, tests and code aligned throughout.

Never write architecture tests: no structure, layout, naming, banned-API or spec-traceability
tests. A test suite proves behaviour.
