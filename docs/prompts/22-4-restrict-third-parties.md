# Journey slice 22.4: Restrict third parties

## Goal

Static CSP; rider data seen only by its owner.

This is slice 22.4 of journey 22, **Stay secure** (Authenticated requests, rate limits, CSP, validated input, protected rider data.), in
`docs/detailed-journeys.md`. It is estimated at 2 days for an intermediate developer. Build only this
slice, end to end and visible in the running app (or, for platform slices, provable by its checks), against the
simulated bike.

Slices run in the order of `docs/prompts/README.md`. The slice before this one is 22.3 Limit abuse; build on what earlier slices left on `telo-ride`. If something an earlier slice should have built is missing, build the minimum this slice needs and say so in the summary. The earlier Wattzup implementation on `main` may be read for reference (for example the protocol and
World Ride code); never copy it without matching the Telo Ride specs, designs and mocks.

Three outcomes, all required:

1. The slice is implemented, test-first, and every check passes.
2. A narrated video of the slice is made to the standard of `docs/videos/README.md`.
3. **The work is merged directly into `telo-ride` and pushed to `origin`.** No pull request.

## Finish the whole slice in one run. Do not stop. (CRITICAL)

- You are authorised to take this slice all the way: requirement, design and mock alignment, test-first
  implementation, the narrated video, green checks, and a direct merge into `telo-ride` pushed to `origin`. Go
  through every phase in one continuous run. Do not pause between phases to report, ask for approval, or wait
  for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask" (including "commit or push only when asked"), treat this
  prompt as the confirmation in advance for everything in scope here, including committing, merging into
  `telo-ride` and pushing it. Choose the simplest option that fits the existing architecture, record it (an ADR
  or the design's open questions), and keep going.
- If a shared library, component or design asset lacks something, that is not a reason to stop. Update it
  first, as the repo's rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside
  this repo that can't be undone, such as production deploys or data changes. If that happens, finish
  everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - Requirement, detailed design and mock come before product code; build with ATDD in thin slices
    (`implementing-incrementally`).
  - Frontend: standalone components, signals, `OnPush`, zoneless; `wz-*` selectors; file per type; one
    encapsulated BEM stylesheet per component, keeping the mocks' classes; presentation in `components`
    injects nothing; every service has a contract and token in `api`; CDK Dialog, never hand-rolled modals;
    dependency direction enforced by ESLint.
  - Lazy loading and memory come first: `loadComponent`/`loadChildren`, `@defer`, dynamic imports for large
    libraries; release every subscription, timer, listener, observer, `AbortController` and Three.js resource;
    bounded buffers; route-scoped state.
  - Backend (when touched): clean architecture, one MediatR request per controller or hub method,
    ProblemDetails with `code`, authentication by default, no contact detail or token in telemetry.
  - Tests: Playwright with page objects and the shared fixture (fake Bluetooth, answered API and hub, no real
    bike or backend), Chromium only; backend on EF Core InMemory; never sleep, use fake clocks; no
    architecture tests. Visual, responsive, accessibility and heap sweeps are not run unless a person asks.
  - CI stays green and under 5 minutes; unit tests run locally. Run `node tools/verify/verify.mjs` before
    pushing.
  - Use the words of `docs/specs/` in code, docs, UI and narration.
  - Every interaction works by touch and keyboard, targets are at least 44 × 44 px, colour never carries a
    state alone.
- ADR 0018 (static content security policy) covers the CSP.
- Work through the phases below **in order**, using the repo skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Sources for this slice

- Requirements (`docs/specs/L2.md`, tracing to `docs/specs/L1.md`): `L2-131`, `L2-132`. This slice covers the part of
  them its description names; the rest belongs to the deferred slices below.
- Detailed design:
  - `docs/detailed-designs/security/restrict-third-parties/README.md` and its `diagrams/`
  - `docs/detailed-designs/security/protect-rider-data/README.md` and its `diagrams/`
- Mocks (the source of truth for the UI; `docs/design-system/` is extracted from them):
  - None: this slice has no screen of its own in `docs/mocks/manifest.json`. If it turns out to show something new to the rider, write its mock first (Phase 1).

## Before you start: apply earlier lessons

- Read `docs/lessons-learned.md`: its standing lessons and the latest log entries. Put the lessons
  that fit this slice in your todo list and apply them as you go; Phase 4 reports how each one worked.

## Phase 1: Align requirement, design and mock

- Read the requirements, design and mocks above, `docs/journeys.md` and the relevant ADRs in `docs/adr/`.
- If the slice's behaviour is missing or wrong in the specs, fix it with `engineering-requirements`. If the
  design is silent or wrong, fix it with `writing-software-design-documents` (re-render its diagrams). If a
  state the slice shows has no mock (check "Mock gaps" in `docs/specs/L2.md`), write it with
  `writing-html-mocks` and carry any new component into `docs/design-system/` with
  `extracting-design-systems`. Skip this phase's edits if all three already agree.

## Phase 2: Incremental implementation (`implementing-incrementally`, test-first)

- Plan thin vertical steps inside this slice, for example one per acceptance criterion it covers.
- For each step:
  - Write the Given-When-Then criteria.
  - Write the acceptance test: Playwright spec with page objects under `frontend/e2e/` for the frontend,
    through the API for the backend.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks (`node tools/verify/verify.mjs`), then commit on `journey/22-4-restrict-third-parties`.
- When all steps are green, keep the requirement, design and mock aligned with what was built.

## Phase 3: Narrated video (`creating-videos`, with `docs/videos/README.md` winning)

- Make one film of this slice in `docs/videos/22-4-restrict-third-parties/`, named `22-4-restrict-third-parties.mp4` and `22-4-restrict-third-parties.mp3`, with the files the
  standard lists: `narration.json`, `film.js`, `slides.html`, `shots.ts`, `README.md`, `script.md`, `shots/`,
  `timing.js`, `captions.vtt`.
- Follow the structure, motion and multi-form-factor demos of popkin's films exactly: read
  `/Users/quinntynebrown/projects/popkin/docs/videos/README.md` and at least one of its journey folders (`film.js`, `slides.html`, `shots.ts`,
  `narration.json`) and `/Users/quinntynebrown/projects/popkin/docs/videos/assets/` before writing. Copy their designed act transitions (wipes, pushes,
  zooms through a screenshot, a phone growing into a desktop window), beat-cut scenes on the music's bar grid,
  close-ups of the region each line is about, the phone overlapping a browser window, and one scene of the same
  screen growing from 390 px through 768 and 1024 to 1440 px.
- Every slide uses the **Telo Ride design system**: the tokens of `docs/design-system/tokens/tokens.css`, the
  TELO Ride lockup and logo mark, and the bundled fonts in `docs/design-system/assets/fonts/`. No Wattzup or
  popkin brand appears. If `docs/videos/README.md` or `docs/videos/assets/` still carry the Wattzup brand,
  rebrand them to Telo Ride first.
- Screenshots come from the running app through the e2e fixtures and page objects, at 390, 768, 1024 and 1440
  px at double density, never from the mocks. A platform slice with little UI films what it made visible (the
  app shell at each width, the checks it added running) and still keeps the standard's shape.
- Narration with Kokoro (`af_heart`), a beautiful boom bap instrumental from Pixabay Music (search "boom
  bap"; cut the scenes to its tempo) credited in
  `docs/videos/assets/music/CREDITS.md` (or "Music: pending" if Pixabay cannot be reached), no burned-in
  captions, 60 to 150 seconds, 1920×1080, 30 fps, H.264 and AAC, under about 15 MB. The close quotes the
  purpose in `AGENTS.md` word for word.
- Commands, from the repository root:
  - `node tools/video-record/record.mjs docs/videos/22-4-restrict-third-parties`
  - `.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/22-4-restrict-third-parties`
  - `node tools/video-build/build.mjs docs/videos/22-4-restrict-third-parties`
- Check with `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height
  docs/videos/22-4-restrict-third-parties/22-4-restrict-third-parties.mp4`, save one frame per scene with `--frame` and look at each, and add the film's
  row to the table at the top of `docs/videos/README.md`. Never commit `narration.wav` or `.cache/`.

## Phase 4: Record lessons learned and progress

- Add slice 22.4's entry at the top of the log in `docs/lessons-learned.md`, in that file's shape:
  - *Applied from earlier:* each earlier lesson this slice applied and its result (saved time, no
    effect, did not apply, or made it worse), with a sentence on why.
  - *What slowed it down:* the few things that cost the most time.
  - *New lessons:* what happened and what to do next time, concrete enough to follow.
  Then update its standing lessons table (new lessons, *Applied in* and *Result*, retired lessons).
- Set slice 22.4's **% complete** to 100% in `docs/detailed-journeys.md` and update its total. In
  `docs/journeys.md`, set journey 22's **% complete** (the days of its finished slices over its days)
  and update its total.
- Commit both on `journey/22-4-restrict-third-parties`, so the merge carries them.

## Phase 5: Merge directly into `telo-ride` and push to `origin` (CRITICAL)

- Work on `journey/22-4-restrict-third-parties`, cut from the latest `origin/telo-ride`.
- When Phases 1 to 4 are committed and `node tools/verify/verify.mjs` passes:
  1. `git fetch origin`
  2. `git rebase origin/telo-ride` on `journey/22-4-restrict-third-parties`, resolve any conflict, and run
     `node tools/verify/verify.mjs` again.
  3. `git switch telo-ride`, then `git pull --ff-only origin telo-ride`.
  4. `git merge --no-ff journey/22-4-restrict-third-parties`
  5. `git push origin telo-ride`
- If the push is rejected because another session pushed first, repeat from step 1. Never force-push
  `telo-ride`, and do not open a pull request.
- Delete `journey/22-4-restrict-third-parties` locally once `origin/telo-ride` contains the merge.

## Deferred

- 22.1 Authenticate every request: Every endpoint and hub needs authentication by default; anonymous endpoints are explicit and listed. (its own prompt, `docs/prompts/22-1-authenticate-every-request.md`)
- 22.2 Validate input and encode output: Validators on every request; device names rendered as text. (its own prompt, `docs/prompts/22-2-validate-input-and-encode-output.md`)
- 22.3 Limit abuse: Rate limits on sign-in codes, ride submissions and feedback, refusing with a code the screen branches on. (its own prompt, `docs/prompts/22-3-limit-abuse.md`)
- Any later journey in `docs/journeys.md`.

## Done means

- Static CSP; rider data seen only by its owner.
- The acceptance tests for this slice and all the existing tests pass (`node tools/verify/verify.mjs`).
- Requirements, design, mocks and code agree.
- `docs/videos/22-4-restrict-third-parties/22-4-restrict-third-parties.mp4` exists, meets `docs/videos/README.md`, uses the Telo Ride design system, and is listed in
  its table.
- `docs/lessons-learned.md` has slice 22.4's entry, saying how each earlier lesson it applied
  worked, and its standing lessons are current.
- `docs/detailed-journeys.md` shows slice 22.4 at 100% and `docs/journeys.md` shows journey 22's
  new **% complete**, with both totals updated.
- The work is merged into `telo-ride` and `origin/telo-ride` contains it (`git log origin/telo-ride -1` shows the
  merge).
- Only then end the run, with a short summary of what was built, the decisions made along the way, and
  anything deferred.
