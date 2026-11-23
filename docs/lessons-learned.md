# Lessons learned

What each slice of [`detailed-journeys.md`](detailed-journeys.md) taught about building Telo Ride
faster, so the next slice starts where the last one finished. It is a working tool, not a diary: a
lesson earns its place only if it saves time or prevents a mistake in a later slice.

## How to use it

1. **Before a slice:** read the standing lessons and the latest log entry. Put the lessons that fit
   the slice in its todo list, and apply them as you go.
2. **After a slice, before it merges:** add its entry at the top of the log, in the shape below.
   - *Applied from earlier:* each earlier lesson you applied and its result: **saved time**, **no
     effect**, **did not apply**, or **made it worse**, with a sentence on why.
   - *What slowed it down:* the few things that cost the most time, plainly.
   - *New lessons:* each one as what happened, then what to do next time, concrete enough to follow
     (a command, a file, a value).
3. **Keep the standing lessons current:** add each new lesson to the table, fill in *Applied in*
   and *Result* for the ones you used, and remove a lesson that twice had no effect or that the
   code, a tool or `AGENTS.md` now makes automatic.

The same step updates **% complete** in [`detailed-journeys.md`](detailed-journeys.md) and
[`journeys.md`](journeys.md).

## Standing lessons

| # | Lesson | From | Applied in | Result |
|---|--------|------|------------|--------|
| L1 | Work the slice in its own worktree, cut from `origin/telo-ride`, with its own `npm ci` in `frontend/` (never a `node_modules` symlink) and `.cache` symlinked before anything writes there; stage named paths only; in zsh, write paths out rather than in one `$VAR`. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.3, 16.4, 17.1, 17.2, 18.2, 19.1, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.3, 24.1, 24.2, 25.1 | Saved time in 17.2; saved time in 18.2; saved time in 19.1; saved time in 19.2; saved time in 19.3; saved time in 19.4; saved time in 20.1; saved time in 20.2; saved time in 20.3; saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1; saved time in 22.2; saved time in 22.3; saved time in 22.4; saved time in 23.1; saved time in 23.2; saved time in 23.3; saved time in 24.1; saved time in 24.2; saved time in 25.1 |
| L2 | Run specs and verify with `E2E_PORT=4310` (or another free port); never kill whatever holds 4300. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.3, 16.4, 17.1, 17.2, 18.2, 19.1, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.3, 24.1, 24.2, 25.1 | Saved time in 17.2; saved time in 18.2; saved time in 19.1; saved time in 19.2; saved time in 19.3; saved time in 19.4; saved time in 20.1; saved time in 20.2; saved time in 20.3; saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1; saved time in 22.2; saved time in 22.3; saved time in 22.4; saved time in 23.1; saved time in 23.2; saved time in 23.3; saved time in 24.1; saved time in 24.2; saved time in 25.1 |
| L3 | Run `npm run format` and `npx eslint --fix` (frontend) or `dotnet format` (backend) before the first verify after any CLI or config edit. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.3, 16.4, 17.1, 17.2, 18.2, 19.1, 19.2, 19.3, 19.4 | Saved time in 17.2; saved time in 18.2; saved time in 19.1; saved time in 19.2; saved time in 19.3; made it worse in 19.4: Prettier padded a design table (L198) |
| L4 | A link or button in `components` is an attribute component (`a[wz-…]`, `button[wz-…]`); the app adds `routerLink` and `routerLinkActive` (ADR 0024). | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time: `raised` joined `wz-button` |
| L5 | Read the initial chunk in the build output after every route or import change; the baseline is 260.26 kB raw against a 264 kB warning. To see what grew it, `npx ng build ride --stats-json` and read `outputs[main-*.js].inputs` in `dist/ride/browser-stats.json` (delete it after). | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 18.2, 19.1 | Saved time in 17.2; no effect in 18.2; saved time in 19.1 |
| L6 | Reuse the measured boom bap track in `docs/videos/assets/music/`; if a new one is needed, download it through headed Chromium. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2 | Saved time |
| L7 | Review every scene with `--frame` on one contact sheet before the full encode, and open any headline or terminal edge at full size; encode in the background with `--crf 23` for films over 2 minutes. Use `headline--md` for scene titles: `--lg` clips italic overhang. | 1.1 | 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3 | Saved time: the full-size frames found two terminals that rendered their tags as HTML (L56) |
| L8 | Backend packages: EF Core on 10.0.x (11 needs .NET 11), MediatR 12.5 (last Apache 2.0), xUnit v3 on Microsoft Testing Platform (`backend/global.json`); probe a new package in a scratch project before an ADR names it; pin a vulnerable transitive package in `Directory.Packages.props`. | 1.2 | 1.3, 1.4, 6.1 | Saved time: `Microsoft.Extensions.Logging.Abstractions` joined at 10.0.13 beside EF Core |
| L9 | A backend acceptance test is a fixture subclassing `TeloRideApiFactory` (`ConfigureServices` injects the fault); `ProbeController` and `SignedInProbeApi` stand in for endpoints and sign-in until features add theirs; await with `EventProbe<T>` (spans and hub events), never sleep; a hub test connects `HubConnectionBuilder` through `Server.CreateHandler()`; prove a guard by removing it once. | 1.2 | 1.3, 1.4, 2.2, 6.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4 | Saved time: `SessionTests` drove a real cookie through `HandleCookies` on the `SignInApi` fixture |
| L10 | A film scene's id is its element's DOM id: never name a scene `errors`, `captions`, `play`, `frame` or `stage`, which `film.css` and the runtime already use. | 1.2 | 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2 | Saved time |
| L11 | Prove a test double from the outside: a spec drives the browser API through a helper (`AppCalls`) until the app's own client exists; prove its guard with `test.fail()`, and run once without it to read the failure's reason. | 1.3 | 1.4 | Saved time |
| L12 | In zsh and BSD tools: quote globs in arguments (`--include='*.cs'`), and replace whole words with `perl -pi -e 's/\bOld\b/New/g'`; BSD `sed` has no `\b`. | 1.3 | 1.4, 2.1, 2.2, 2.3 | Skipped once: an unquoted glob cost a command |
| L13 | Never symlink `node_modules` into a worktree: when verify's stamp (`node_modules/.verify-lock-hash`) does not match, its `npm ci` empties the linked main checkout's `node_modules` and installs into the worktree. After `npm ci` in a checkout by hand, write the stamp so verify skips the reinstall. | 1.3 | 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.2 | Saved time |
| L14 | For a production-like local run, `dotnet run --no-launch-profile` (`launchSettings.json` otherwise overrides `ASPNETCORE_URLS` and the environment), and `-- --webroot ../frontend/dist/ride/browser` to serve a build without copying it. | 1.4 | 2.2 | Saved time |
| L15 | Prove a workflow change on GitHub before merging: push the slice's branch (CI runs on every push), `gh run watch <id> --exit-status`, read the job times, then delete the remote branch after the merge. | 1.4 | | |
| L16 | A hosting test's web root is an in-memory `IFileProvider` set with `PostConfigure<StaticFileOptions>` (`HostedAppApi`), so it reads no file. | 1.4 | | |
| L17 | Judge verify by its exit status: `if E2E_PORT=4310 node tools/verify/verify.mjs > log 2>&1; then git commit …; fi`. Piping it to `grep` succeeds whatever verify did, and once committed a failing build. | 2.1 | 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1 | Saved time |
| L18 | Bind an app-wide service the first screen needs (the bike connection, the ticker) in the providers of the lazy parent route in `ride.routes.ts`, not in `app.config.ts`: one instance serves every screen and its code leaves the initial chunk. | 2.1 | 2.2, 2.3, 2.4, 17.2, 25.1 | Saved time in 17.2; made it worse in 25.1 when skipped: `BUILD_INFO` bound in `app.config.ts` broke the initial budget by 3.85 kB until it moved to the parent route |
| L19 | What only a development build does gets a `*.development.spec.ts`, run by Playwright's `development` project against the development build on the next port; the `chromium` project proves the production build does not. | 2.1 | | |
| L20 | Web Bluetooth in `domain`: start the file with `/// <reference types="web-bluetooth" />` (the app's tsconfig loads no ambient types), and type byte encoders `Uint8Array<ArrayBuffer>` so they pass as a `BufferSource`. | 2.1 | 2.3, 2.4 | Saved time |
| L21 | `WebApplicationFactory.CreateClient(new() { … })` takes its base address from that options object (`http://localhost`), not from `ClientOptions`: set `BaseAddress` in it. `UseHsts` leaves `localhost` out, so an HSTS test runs at another host in the Production environment (`ProductionApi`). | 2.2 | | |
| L22 | A scripted multi-file edit stops the step on its first miss: end the heredoc with `&&` before the next command (or `set -e`). A failed `assert` in `python3 - <<'EOF'` does not stop the lines after it, and a commit went out without its template change. | 2.2 | 2.3, 5.4 | Made it worse once: a heredoc's failed assert, then a newline, and the commit and push still ran (L49) |
| L23 | The browser's own states come from the fake Bluetooth: `bluetooth.remove()` (Safari, Firefox), `servePlainHttp()` (no secure context, no Bluetooth) and `restore()` on the current page; no other browser and no http host. | 2.2 | 2.3, 2.4 | Saved time: adapter, drop and power joined it |
| L24 | A film diagram's `.node` name is set in capitals: put code identifiers (`isSecureContext`) in its small note, and plain words in its name. | 2.2 | 2.3, 2.4 | Saved time |
| L25 | Make a scripted multi-file edit all or nothing: collect `(path, old, new)`, assert each `old` occurs once in its file's text, and write the files only after every assert passed. An assert that fails midway leaves the earlier files edited. | 2.3 | 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 9.1, 9.2, 9.3, 9.4 | Made it worse twice in 9.2 (asserted per file, not across files); saved time twice in 9.3; made it worse once in 9.4 (a write emptied a file before it was read, L103) |
| L26 | A guard on a screen changes every spec that opens it: give those specs their premise through the fixture (`bluetooth.remember()`), and run the whole Playwright suite after adding a guard or a redirect. | 2.3 | 2.4, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time: the full suite ran before the film |
| L27 | Push a fake bike's notification only after the writes the app makes before it listens (`expect.poll(() => bluetooth.writes().length)`): a frame sent before initialisation finishes is not the first one after it, as a real bike streams only after its start command. | 2.3 | 2.4 | Saved time |
| L28 | Keep a heredoc that writes files in a command of its own: a command blocked or failing earlier in the same `&&` chain drops it silently (a blocked `rm $VAR/*.png` cost `film.js`). Write frames to a new folder instead of clearing one. | 2.3 | 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5 | Saved time |
| L29 | A periodic write (a keepalive) joins every write log a spec compares: start it at the moment its requirement names (connected, after pairing), and filter it out or count from a known point in specs that compare exact logs. | 2.4 | | |
| L30 | Time-driven behaviour in a spec (keepalives, retries): `page.clock.install()` before the page loads, then `page.clock.runFor(ms)`; time still flows between, so binding round trips and short gaps go on as usual. Nothing sleeps. | 2.4 | 5.4 | Saved time |
| L31 | A slice whose behaviour no screen shows yet (decoders before their readouts) is proved by the requirement's tables at the domain boundary, fed the bytes a bike sends, plus one run on the simulated bike; write a stub first so each table fails on its assertions, and say in the design which later slice brings the Playwright proof. | 3.1 | 3.2, 3.3, 4.1, 4.2, 5.1, 6.1 | Saved time: a stub `ClassPlanRules` made the table fail on its assertions, not the build |
| L32 | A film's `arrow()` lines are light: put a diagram of `node()`s and arrows on a dark field (`field--ink`, `field--panel`), never on `field--bone`. | 3.1 | 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7 | Saved time |
| L33 | Before a slice builds UI, find the screen that hosts it in `docs/detailed-journeys.md`: when that screen's slice comes later, build only what every host shares (state, models, formatting) and move the markup to the hosting slices in the design, rather than build a screen early. | 3.2 | 3.3, 4.1, 4.2, 5.1, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time |
| L34 | Render every diagram a slice touches (`plantuml -tpng` on each `.puml`) and read its exit status: an escaped quote (`\"—\"`) inside a C4 macro's label breaks it, and a committed PNG can be older than its source. Write "a dash" instead. | 3.3 | 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 8.4, 8.5, 8.6, 8.7, 9.1, 10.3, 11.3, 12.1, 12.2, 13.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 18.2, 19.2, 19.3 | Saved time in 17.2; saved time in 18.2; saved time in 19.2; saved time in 19.3 |
| L35 | Before writing a slice's code, check what earlier slices already built for its requirements (`git log --oneline --grep L2-0NN`, the specs' traces): record a behaviour that already holds with one test that names its criterion, and keep the slice to what is left. | 4.1 | 4.2, 5.1, 5.2, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time: no progress contract existed, so the slice added the smallest one |
| L36 | While a film encodes, draft the next slice's stubs and acceptance tables in the scratchpad; copy them into the new worktree once the merge lands, then run them to see them fail. | 5.1 | 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1 | Saved time: 6.1's prompt, requirement and ADR were read during the 5.4 encode |
| L37 | To test time across a hidden tab, bind `MONOTONIC_TIME` to `Date.now()` under `vi.useFakeTimers()`: `vi.setSystemTime` moves the clock without firing timers, as a throttled tab does, and a `visibilitychange` with a stubbed `visibilityState` shows it again. | 5.1 | 5.2 | Saved time: the same idea, with Playwright's clock |
| L38 | To drive a ride screen in Playwright, `page.clock.install()`, hold the API answer that starts the ride, `pauseAt` a known time, release it, wait for the ride's first command, then `runFor` a few ms to render; `fastForward` moves it like a hidden tab. Screenshots on a paused clock need its frames stepped with real-time pacing. | 5.2 | 5.3, 5.4, 7.3, 7.4, 7.5 | Saved time: the shared startClassRide helper now holds it |
| L39 | macOS has no `timeout`; never wrap a command in it. Piped through `grep`, the "command not found" vanished and looked like a hang. | 5.2 | | |
| L40 | The first use of an Angular entry point (`@angular/common/http`) can land in `main` wherever it is provided, because the framework's own packages import it. Build and read the initial total right after adding one. | 5.2 | 5.3 | Saved time: the same check caught L42 |
| L41 | Write each step's spec and see it fail before writing that step's code, even when the components seem obvious; a spec written after the code cannot show it failed for the right reason. | 5.2 | 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 18.2 | Partly in 17.2: the registration was spiked before its unit spec; saved time in 18.2 |
| L42 | The first use of a core API (`effect`, `viewChild`) puts its runtime in `main`, since `@angular/core` is in the initial chunk: `effect` cost 2 kB raw and `viewChild` 1 kB. Read the initial total after each new framework API, and prefer an output, a lifecycle hook or the host element the app already pays for. | 5.3 | 5.4, 6.3 | Saved time: no new core API; the initial total rose 0.06 kB |
| L43 | On Playwright's paused clock, everything on a timer waits, including a fake's ready callback and zoneless change detection. Step it a frame at a time until the locator shows: `expect(async () => { await page.clock.runFor(16); await expect(l).toBeVisible({ timeout: 50 }); }).toPass()`. | 5.3 | 5.4, 6.3, 7.3, 7.4, 7.5, 8.1 | Saved time: the lazy Page not found and the reconnect on the paused clock |
| L44 | Fake a third-party script at its URL in the shared fixture (a route, and the guard's catch-all calling `route.fallback()` for it), not by rebinding a token, which a browser test cannot do: the real adapter runs, and blocking the route tests the failure. | 5.3 | 5.4 | Saved time: the Screen Wake Lock API is faked the same way |
| L45 | When the main checkout holds another session's uncommitted change to a file the slice also changes, merge in the slice's worktree on a detached `origin/telo-ride` and push `HEAD:telo-ride`; never stash or overwrite their change. | 5.3 | 5.4 | Saved time: AGENTS.md is still uncommitted in the main checkout |
| L46 | A held ride stops `RideTicker`'s ticks, which publish only a new whole second of the ride clock: whatever must notice the hold ending (a lost bike back) watches the app's `TICKER`, which beats every second regardless. | 5.4 | | |
| L47 | e2e and its fixtures never read a file outside `frontend/`: CI's sparse checkout has only `frontend` and `backend`, and a fixture reading `docs/mocks` passed locally and failed every class spec in CI. Copy the file beside the fixture. | 5.4 | 6.1, 6.2, 6.3 | Saved time: the covers were copied beside the fixture, not read from docs/ |
| L48 | Prove a `beforeunload` prompt in Playwright: click something on the page first (Chromium asks only after a user activation), start `page.waitForEvent('dialog')`, `page.close({ runBeforeUnload: true })`, then check `dialog.type()` is `beforeunload` and accept it. | 5.4 | | |
| L49 | Never put a commit or a push in the same command as an edit script: after `python3 - <<'EOF' … EOF && echo ok`, a newline runs the next line whatever the assert did, and the fix pushed only a picture while the fixture still read the old path. Edit, check the file, then commit in a new command. | 5.4 | 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1 | Saved time: no commit shared a command with an edit script |
| L50 | With two applications in the workspace (`ride`, `marketing`), every `ng serve` and `ng build` names its project: a bare one fails "Cannot determine project for command". | 6.1 | 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5 | Saved time: every build named `ride` |
| L51 | Make test data meant to break a rule break it by construction: `not-a-video` is 11 allowed characters, a well-formed YouTube id. Use a character the rule forbids (a space), and read the failing row before trusting the rule. | 6.1 | | |
| L52 | When a slice needs data the specs name but nobody supplied (six classes' videos), seed honest stand-ins, record them in an ADR and the design's open questions, and say so in the summary, rather than stop or invent. | 6.1 | 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time: `NewRiderProgress` stands in for the level, recorded in the design |
| L53 | When another session's push breaks CI on `telo-ride`, check `git log origin/telo-ride` for a fix in flight, then make the smallest fix in that code's own style, prove it with the folder gone as CI has it, and push it before the slice merges. | 6.1 | | |
| L54 | The bundle budget is a warning, so verify passes over it: read "Initial total" after any step that adds a route or a new Angular API. Angular's core is bundled into the main chunk, so a core API used only in a lazy screen (`rxResource`, `resource`, `viewChildren`) still grows the initial bundle; prefer signals fed by a subscription there. | 6.2 | 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4 | Saved time: it caught `HttpClient` entering the initial chunk with the guard (9.2) |
| L55 | Playwright's `click()` waits for an `aria-disabled` element to be enabled and times out with no step named. Test a focusable disabled control as its users reach it: `focus()`, `toBeFocused()`, then a key. | 6.2 | | |
| L56 | In a film terminal, write a tag as `&lt;a …&gt;`: raw, it renders as HTML, the row goes blank and the rows after it become links. Look at each terminal's frame at full size. | 6.2 | 7.1 | Saved time |
| L57 | Route `providers` live as long as the route's injector, past the visit. A screen's store goes in its page component's `providers`, so its state and requests go when the rider leaves; the route binds only stateless clients. | 6.2 | 6.3, 7.1, 7.2, 7.3, 7.4, 7.5 | Saved time: Class Start's store and player go with the page |
| L58 | Check a number a spec quotes (~154 W) by running the real helper over the real data before changing the data: a hand search read two cadence aims the wrong way round, and the catalogue needed a second correction once `PlanSummary`'s unit test ran. | 6.3 | | |
| L59 | Start every edit script with an absolute `cd` (`cd /Users/…/wattzup-<slug>/frontend/projects && python3 - …`): a relative `cd ../..` landed one level short, and only L25's asserts kept it from writing half a step. | 6.3 | 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6 | Saved time |
| L60 | A plain `input(false)` given as a bare attribute (`block`) receives `''`, which is falsy: bind it (`[block]="true"`), or give the input `transform: booleanAttribute` when it is meant to be set as an attribute. | 6.3 | | |
| L61 | To park a YouTube video at a time without playing it, open the player with `playerVars.start` and call nothing on ready: `seekTo` from the cued state starts playback. `PlayerOptions.autoplay` is the switch. | 6.3 | | |
| L62 | An input on an attribute component must not share a name with an input of a directive the page puts on the same host: `MapRow`'s `state` collided with `RouterLink`'s `state` (TS2322). Name it for the spec's word apart from it (`status`). | 7.1 | | |
| L63 | An attribute link or button component takes its name as projected text (lint's `elements-content` wants content in the element); keep it tight with `<!-- prettier-ignore -->`, since whitespace around it joins the accessible name, and match it in specs with `toContainText`. | 7.1 | 7.2 | Saved time |
| L64 | After `prettier --write`, re-read a file before an edit script matches its lines: prettier had wrapped `provide-maps.ts`'s array, and only L25's assert kept the script from writing half its edits. | 7.1 | 7.2, 7.3, 7.4, 7.5 | Saved time |
| L65 | Shoot a film close-up of a list row at 390 px (`detail(…, 12)`), where the row fills the width; a 1440 px row's close-up is too thin to read at film size. | 7.1 | 7.2, 7.3, 7.4 | Saved time |
| L66 | Playwright treats an `aria-disabled` control as disabled and waits for it to be enabled; to prove a click on it changes nothing, `click({ force: true })` with a comment saying why. | 7.2 | | |
| L67 | Angular drops whitespace between sibling elements, so `<span>14.2</span> <span>km</span>` reads "14.2km"; bind the space (`{{ ' ' + unit }}`) where a reader must hear two words. In a flex row the leading space shows nothing. | 7.2 | 7.5 | Saved time |
| L68 | When a requirement's next screen is built in a later slice than the one after it (the lobby, 15.1, after the race, 7.3), route to the screen that keeps the journey ridable, and say so in the design's open questions, its sequence diagram and the code's comment. | 7.2 | | |
| L69 | A spec that passes on its first run (a layout built with its panels) has not been seen failing: remove the rule it guards, watch it fail for that reason, and restore it. ATDD's red stays honest without re-ordering the work. | 7.3 | 7.4, 7.5 | Saved time |
| L70 | When copying a module from `main`, port `main`'s own spec with it, on `main`'s data: it pins the numbers the mocks were drawn from (the race plan's cool-down at 70 rpm, not 68, gave the mock's 43 m) before any acceptance test is written. | 7.3 | 8.1, 8.2, 8.3, 8.4, 8.5 | Saved time |
| L71 | A view a domain helper computes and a presentation component draws (`RouteProfileView`) has its type in `api`: domain returns it, components take it, and neither imports the other. | 7.3 | 7.4, 7.5, 8.1, 8.2, 8.3 | Saved time |
| L72 | Angular's render hooks (`afterRenderEffect`, `afterNextRender`) live in `@angular/core`, which is in the initial chunk: one use in a lazy component added 4.7 kB to `main`. Measure the DOM in `ngAfterViewChecked` instead, and read the initial total after every slice. To find what grew, diff `--stats-json` builds of the two commits, removing the files the later one added before building the earlier. | 7.4 | 7.5, 8.1 | Saved time |
| L73 | A template's text on its own line inside an element keeps the line break as a leading space (" Ahead +1:25"), which a whole-text locator sees; keep the text and its inline children on one line, with `<!-- prettier-ignore -->` so the formatter leaves it. | 7.4 | | |
| L74 | A presentation component may not import `@angular/router`, nor name an output after a DOM event (`pause`). For a control that is a link in one place and a button in another, make an attribute component (`a[wz-race-bar-button], button[wz-race-bar-button]`) that styles its host, and let the page put `routerLink` on it, as `map-row` does. | 7.5 | | |
| L75 | `page.clock.fastForward` fires each timer at most once, as a hidden tab catches up: a jump across a plan's boundary skips what the boundary sends. Fast-forward into the segment you need, then `runFor` across the boundary. | 7.5 | 8.5 | Saved time |
| L76 | Before writing a spec's expected value, work it from the fixture's numbers (who crosses 0.5 km first at 190 W and at 661 W), not from the rule's usual case; a wrong expectation costs a red that is not the code's. | 7.5 | | |
| L77 | Any part of `@angular/core` a lazy library first uses lands in the initial chunk: `@defer` added about 6 kB, `createComponent` bindings (`inputBinding`, `outputBinding`) about 6 kB and `afterNextRender` 2.5 kB. Load a lazy library's component with `import()` and `ViewContainerRef.createComponent`, hand it its inputs with `setInput` in an effect and subscribe to its outputs, start it in `ngAfterViewInit`, and diff the `--stats-json` builds' `main` chunk against the base commit's. | 8.1 | 8.2 | Saved time |
| L78 | `toPass`'s default intervals (100, 250, 500, 1000 ms, then 1000) step the paused clock about once a second: a world that needs 31 frames to start takes half a minute. Retry at once with `toPass({ intervals: [0] })`. | 8.1 | 8.2, 8.3 | Saved time |
| L79 | A class binding for a loading state (`world-scene--busy`) is absent until a created component's first change detection, so `not.toHaveClass` passes before the load has begun; wait on what the start reports (the bar's tag). | 8.1 | 8.2, 8.3 | Saved time |
| L80 | A WebGL scene drawn in software slows every step of a spec: race specs draw no world unless they ask for it (`startRace(…, { world: true })`), and a scene spec pins `main`'s low tier through the `worldRide` probe and rides only as long as it must. | 8.2 | 8.3, 8.4, 8.5 | Saved time |
| L81 | A screenshot of a canvas takes in whatever is drawn over it; hide the HUD's panels before comparing two pictures of the world, or the clock and watts make them differ. | 8.2 | | |
| L82 | The film rides only maps the new rider's progress opens; to show a locked map's world, serve that map in an open map's place, with the open map's plan the race fixture expects. | 8.2 | 8.3 | Saved time |
| L83 | `main`'s renderer dresses its scene (toon twins and warm ink at low, the road's bend) only when a tier is applied, over every object then in the scene. Make what must be there from the start with the scene (the ghost, so its material compiles in the warm-up); dress anything made later by applying the same three passes to its group alone, never by re-applying the tier, which re-uploads every texture. | 8.3 | | |
| L84 | A `stepUntil` (`toPass` with `intervals: [0]`) has no timeout of its own and runs to the test's: when running a world spec to see it fail, pass `--timeout 60000` or give `toPass` a `timeout`, or the red run costs minutes. | 8.3 | 8.4, 8.7 | Saved time |
| L85 | A scene spec that checks only what should be drawn misses what should not: `main`'s pacers rode a race until the film's first shot showed them. Look at the first shot of a world slice before recording the rest, and add a check for what must be absent (the probe's `pacers: 0`). | 8.3 | | |
| L86 | When an earlier slice copied `main`'s code whole, a later slice's behaviour may already be there and its new spec passes at once. Break the rule it proves on purpose (one line, in the working tree only), see the spec fail for that reason, restore with `git checkout --`, and say so in the commit. | 8.4 | | |
| L87 | `main`'s L2 carries amendments dated in its criteria (L2-111 AC3: World Ride opens at Low). Read `main`'s requirement for a world slice, not only its code, and bring Telo Ride's requirement, designs and mocks in line with it in the same change. | 8.4 | 8.5 | Saved time |
| L88 | A world spec's cost is its frames times the level's cost in software: High costs several times Low. Count the frames a spec draws (seconds ÷ frame time), open at the lowest level that still proves the rule, and run it inside the full verify, whose default timeout is 90 seconds, before committing; give a spec that needs more an explicit `test.setTimeout` with its reason. | 8.5 | 8.6, 8.7 | Saved time |
| L89 | The race bar hides `.race-bar__where`, the GPU tag inside it, below 48 rem (768 px), so a world spec that waits for the tag to be visible never finishes in a smaller viewport. To cheapen frames, keep the viewport at least 768 px wide, or wait on the tag's count rather than its visibility. | 8.5 | 8.6, 8.7 | Saved time |
| L90 | A canvas that draws on a change of input as well as on its loop still draws in a hidden tab whenever an input changes, and a race's clock changes every second. To prove a hidden tab draws nothing, hide it with `document.hidden` set by hand and `visibilitychange` sent (headless Chromium never hides its page), ride on, and count the renderer's frames through the test hook. | 8.6 | | |
| L91 | A race's fixture pauses the page clock, so a film shot's `pictures()` and `shot()` wait forever unless `still()` steps the clock while they run, with or without a world. Wrap every picture call in a race shot in `still()`, and record one size with `-g` before the rest. | 8.6 | 8.7 | Saved time |
| L92 | The verify script reinstalls `node_modules` when `package-lock.json` changes, so reverting a freshly installed dependency's `package.json` (to commit docs first) removes the package on the next verify. Install a new dependency in the step that first imports it, commit `package.json` and the lock with that step, and stamp the lock hash after each install. | 8.7 | | |
| L93 | A race spec runs on a paused clock, and the zoneless app renders on the scheduler the clock holds, so a value typed with `fill` shows only once the clock steps. Wait on what the typing changes with `stepUntil(page, () => expect(…).toBeEnabled({ timeout: 50 }))`, never a bare `expect`. | 8.7 | | |
| L94 | A backend test class shares one in-memory store and one `FakeTimeProvider` across its tests, which run in any order, so a limit counted from stored rows over a window (5 codes an hour per address, 20 per network) carries from one test into the next. Start each such test by advancing the clock past the window, and give a test that fills one partition (every request from the same unknown network) a fixture class of its own. | 9.1 | 9.2, 9.4 | Saved time |
| L95 | A normalisation rule is narrower than it sounds: L2-001 AC6 lower-cases an email's domain only, so `Busy@` and `busy@` are two addresses. Before a test leans on normalisation to make two inputs one, read the requirement's exact words, and vary only what the rule changes. | 9.1 | | |
| L96 | A guard in front of every screen fails every existing spec unless the shared fixture answers it. Give the fixture a default that passes the guard (`GET /api/riders/me` answers a signed-in rider) and a switch for the specs that need the other case (`api.signedOut()`), so the old specs run unchanged and only the new ones opt out. | 9.2 | 9.3, 9.4, 10.1 | Saved time |
| L97 | Prettier rewraps lines on the first format, so an edit script whose old text comes from memory of the file as written (a one-line providers array, an import) misses. After any format, take each old string from the file as it now is (`sed -n`), and assert across every file before writing any. | 9.2 | 9.3, 9.4, 10.1, 10.2, 13.3, 14.1 | Saved time; made it worse once in 10.2 (a wrapped call, caught by L103); made it worse once in 13.3 (a reflowed stub, caught by its assert); no effect in 14.1 |
| L98 | Over its error budget the Angular build writes neither the bundle nor `--stats-json`, so the cause of growth stays hidden. Raise `maximumError` in `angular.json` for one build (copy the file aside and restore it), build with and without the suspect import, and diff the inputs of `main-*.js` in the two stats files: 9.3's CDK Dialog had moved 7.7 kB of core and RxJS (`auditTime`, the async scheduler) into the initial chunk. | 9.3 | | |
| L99 | `components` may take only types from `api` (lint), so a presentation form cannot run a rule's check. Keep the check in the app's store and pass the form a count of refusals, not a boolean: a count shows a second refusal of the same name again after the rider edits, where a boolean that stays `true` would not. | 9.3 | | |
| L100 | `eslint --fix projects e2e` fixes every file it finds, including ones the slice never touched (a `type` became an `interface` in the Bluetooth fixture). Fix only the slice's files (`git diff --name-only` plus new files), or check `git status` for files outside the slice before committing. | 9.3 | 9.4, 10.1 | Saved time |
| L101 | `ng test ride` ran only the libraries' specs: its `include` (`../../*/src/**/*.spec.ts`) never reached `projects/ride/src/app`, so the app's store specs from 9.2 on never ran. After adding a unit spec, check that the unit count rose by its tests; if it did not, the spec is not in the run. The include is now `["**/*.spec.ts", "../../*/src/**/*.spec.ts"]`. | 9.4 | 10.1, 10.2, 10.3, 10.4 | Saved time |
| L102 | A `BackgroundService` on the injected `TimeProvider` ticks whenever any test advances the shared `FakeTimeProvider`, and would act mid-test in every host. Leave it out of the shared test host (`RunsAccountErasure`), run it in a host of its own, and await its run through a MediatR pipeline behaviour that records into an `EventProbe`. | 9.4 | | |
| L103 | In Python, `open(f, 'w').write(change(f))` opens, and so empties, the file before `change` reads it. Stage every output in a dict (`put`/`get`), assert everything, then write all files at the end. | 9.4 | 10.1, 10.2, 10.3, 10.4 | Saved time; made it worse once in 10.4 (a regex pass wrote before an assertion, L115) |
| L104 | A CDK Dialog's `closeOnNavigation` closes it on history changes (back, forward) only, not on `router.navigateByUrl`, so a dialog left open stays over the next screen. Close it with its `DialogRef` first, then navigate. | 9.4 | | |
| L105 | EF Core InMemory throws its own exception for a duplicate key, not the `DbUpdateException` SQL Server's key raises, so a catch for it is never reached in a test. Inject the real fault through `IAppDbContext`: do what the other party would have done, then throw `DbUpdateException` as the database would. | 10.1 | | |
| L106 | To see a test fail with a branch turned off, guard it with a condition that is always false, such as `DateTime.MinValue.Year > 1`. `Environment.TickCount` is an `int` that goes negative after 24.9 days of uptime, so `TickCount < 0` can be true. | 10.1 | | |
| L107 | In `Telo.Ride.*`, a type named `Ride` is not found: name lookup reaches the namespace `Telo.Ride` before any `using`. Name the type for what it is (`RecordedRide`) and say why in its comment. | 10.1 | | |
| L108 | A pattern over a body's keys matches more than meant (`/xp/i` matches `maxPowerWatts`). To prove a body carries nothing else, assert its exact sorted keys. | 10.1 | 10.2 | Saved time |
| L109 | A migration that adds a non-null column gives existing rows EF's default for the type, `""` for a string. For a column read as JSON (a value conversion), set the default to what reads back as empty, such as `"[]"`, or the first read of an old row throws. | 10.2 | | |
| L110 | A slice's line in `docs/detailed-journeys.md` is a summary and can disagree with its requirement (10.2 said XP comes from output and time; L2-037 says finishing, place, podium, time on target and streak). Read the requirement first; it wins, and the plan's line is corrected in phase 1. | 10.2 | 10.3, 10.4 | Saved time |
| L111 | An acceptance test that passes before the code proves nothing until you know why. In 10.3 the "no link when progress fails" spec answered `{ status: 503 }` as a plain object, which the fixture serves as a 200 body; only the implementation exposed it. Fixture failures are handlers: `() => ({ status: 503 })`. | 10.3 | 10.4 | Saved time |
| L112 | When the shared fixture gains a default answer for a path, grep the specs for that path: the harness spec used `GET /api/progress` as its unanswered example and began to pass its `test.fail`. Move such examples to a path the app never calls (`/api/harness-probe`). | 10.3 | | |
| L113 | `@angular-eslint/template/elements-content` refuses an empty `<a>` whose name comes from an attribute component's host binding. Bind `[attr.aria-label]` on the `<a>` in the app's template, as the brand link does, and keep the component's content `aria-hidden`. | 10.3 | | |
| L114 | Work out an `object-view-box` crop from the shot in CSS pixels (1440 × 900), not from a scaled contact sheet; a sheet stacked to one height scales each shot differently, and the guess cropped Settings instead of the headline. | 10.3 | 10.4 | Saved time |
| L115 | An edit script must assert every old string before it writes any file, including the files a regex pass rewrites, and the commit that follows it is chained with `&&`, so a failed script commits nothing. In 10.4 a mock pass wrote, an assertion then failed, and the next line committed the half. | 10.4 | 11.1, 11.2, 11.3 | Saved time |
| L116 | In a command that changes directory more than once, `cd` to absolute paths: a relative `cd ../..` from `components/src/app-header` landed in `components`, not `projects`, and every path after it missed. | 10.4 | 11.1, 11.2 | Made it worse once |
| L117 | The backend's analysers run on tests and stubs: parse dates in a test with `CultureInfo.InvariantCulture` (CA1305), and give a stub member something of the instance to read (CA1822), or the build fails before any test runs. | 10.4 | | |
| L118 | When a slice builds a screen, search the specs for the placeholder that stood in for it ("until slice 11.1", Page not found) and move them to the new page object in the same commit; three specs waited on `/results` showing Page not found. | 11.1 | | |
| L119 | A test written after the code it covers is not yet proof: put the old code back, see the test fail for the reason named, then restore. Race Setup's preselection test was written after the store change and failed on "hard" unchecked once the change was out. | 11.1 | 11.2 | Saved time |
| L120 | A screen reached by a click on a spec's paused clock loads lazily only as the clock steps: wait with `stepUntil`, not a bare `expect`. And take a radio's name from an existing spec: pack strengths are named "medium", not "Medium". | 11.1 | 11.2 | Saved time |
| L121 | Before writing a film, check its prompt's film rules against the last film rather than copying it: 10.1, 10.4 and 11.1 had dropped the shots at 768 and 1024 px and the scene growing from 390 to 1440, and 11.1's film was redone. | 11.2 | 11.3, 12.1, 12.2, 13.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 18.2, 19.1, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.3, 24.1, 24.2, 25.1 | Saved time in 17.2; saved time in 18.2; saved time in 19.1; saved time in 19.2; saved time in 19.3; saved time in 19.4; saved time in 20.1; saved time in 20.2; saved time in 20.3; saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1; saved time in 22.2; saved time in 22.3; saved time in 22.4; saved time in 23.1; saved time in 23.2; saved time in 23.3; saved time in 24.1; saved time in 24.2; saved time in 25.1 |
| L122 | A test that proved a rule by an absence ("the answer has no `stars`") must be restated, not deleted, when a slice adds that field: assert the value is the backend's own, which is what it was proving. | 11.2 | 11.3 | Saved time |
| L123 | `api.answer(method, path, handler)` types its reply as `Handler \| unknown`, so a handler's `request` parameter is untyped: annotate it `(request: Request)`. Playwright runs the spec anyway; only verify's type check fails. | 11.2 | | |
| L124 | To film an entrance, undo what keeps the recorder's pictures still: it emulates reduced motion and `shot()` disables animations, and a finished CSS animation is gone from `getAnimations()`. Turn reduced motion off, restart the animation (`animation-name: none`, a reflow, then back), pause it at a time and take the screenshot with `page.screenshot`. | 11.3 | | |
| L125 | A new Angular API can grow the main chunk though only a lazy page uses it, because `@angular/core` ships in main: `rxResource` added 6.75 kB and `toObservable` with `switchMap` 0.94 kB. Compare main's raw size with the base before committing, and prefer what the app already uses (here an `effect` that releases its subscription). | 11.3 | 12.1 | Saved time |
| L126 | A link to a guarded screen is proved by where the guard lets it go, not by its `href`: Race Setup's guard reads the `NewRiderProgress` stand-in, so a map just opened still sends the rider to Map Select. Find this before the spec, and record the gap in the design's open questions. | 11.3 | | |
| L127 | Await every fixture call that works in the page (`await bluetooth.remember(...)`): left unawaited, it races the next navigation and fails with "Execution context was destroyed", which is not the reason the spec should fail. Rerun the spec against the old code after fixing it. | 12.1 | 13.1 | Saved time |
| L128 | Fixtures built from every state's mock find what the stand-in hid: the veteran's 4,280 s best read 1:11:20 where the mocks write 71:20. When a stand-in gives way to real data, check its screens against the richest mock, not only the default. | 12.1 | 12.2, 13.1 | Saved time |
| L129 | A screen inside the app shell scrolls its own container, so `window.scrollTo` (`bringToTop`) does nothing; bring a row into a film's picture with `locator.scrollIntoViewIfNeeded()`. | 12.1 | 12.2 | Saved time |
| L130 | When a slice binds the last route to the real client, delete the stand-in in the same change: grep its name across `projects` and `e2e`, and remove the file and its export, so no later slice binds it by mistake. | 12.2 | | |
| L131 | Put a new refusal in the rule check every handler already runs (`ClassPlanRules.BrokenRule`) and add one class to the stub catalogue: the existing "only the valid are listed" test then covers it as well, and the new acceptance test only adds the 404. | 12.2 | | |
| L132 | angular-eslint's `no-output-native` refuses an output named for a DOM event (`toggle`, `change`, `close`, `select`): name it in the past tense (`toggled`) before the template binds it, and say so in the design. | 13.1 | | |
| L133 | The unit tests' DOM has no Fullscreen API (as it has no Wake Lock); `vi.spyOn` on a getter it lacks throws "The property is not defined". Install the browser's API in the spec with `Object.defineProperty(..., { configurable: true })` and delete it after each test. | 13.1 | | |
| L134 | When a state a requirement names has no mock (Exit full screen), add it before the code: the page, `index.html`, `manifest.json` and the coverage matrix in `docs/mocks/README.md`. | 13.1 | | |
| L135 | A child route that only provides a page's services (`loadChildren` with a routes file) added 0.26 kB to main for its loader. Provide page-scoped services on the routed component's own `providers` (helpers returning `Provider[]`, as `provideMaps()` and `provideClasses()` now do): they load with the page's chunk and go when the rider leaves. | 13.2 | 13.3, 14.1 | Saved time |
| L136 | `page.clock.setFixedTime(new Date('…T19:30:00'))` is read in Node's time zone, but the browser runs in UTC (`timezoneId` in `playwright.config.ts`): write e2e times with `Z`, or the greeting reads "Morning". | 13.2 | | |
| L137 | When a page starts reading a new endpoint and many specs pass through it (Home), answer it by default in `e2e/fixtures/api.ts` beside `/api/progress`; otherwise unrelated specs fail with "unanswered request". Grep for specs that open the page before running the suite. | 13.2 | 13.3, 14.2, 14.3 | Saved time |
| L138 | Angular drops whitespace-only text between elements: two spans in one sentence need `&ngsp;` between them, or a screen reader reads "open.A". `toHaveText` on a row of separate elements (body and button) has no space either; assert each part. | 13.2 | | |
| L139 | When the UI needs a number the catalogue only gives in words (a level goal's level), serve it as its own field (`unlockLevel`) with an API test, rather than parsing the words in the app. | 13.2 | | |
| L140 | Profile does not connect the remembered bike; Home does (L2-015). A spec or shot that needs the bike connected on another screen opens Home, waits for the three writes, pushes a frame, then follows the header to that screen. | 13.3 | | |
| L141 | When a design names one helper for a whole list (`settingRows()`) but only one row's words change, keep the fixed rows in the template as links and buttons and extract just the changing one (`bikeRow()`) with its unit spec; then bring the design and its class diagram in line. | 13.3 | | |
| L142 | A library imported dynamically whose ESM build calls `require` on Node-only paths (`@microsoft/signalr`) made esbuild put its `__require` shim in main (+0.73 kB). Compare main's inputs in `dist/ride/browser-stats.json` (`ng build ride --stats-json`) before and after: identical inputs with more bytes means a runtime helper; `"define": { "require": "undefined" }` in the `ride` build drops it. | 14.1 | 14.2 | Saved time: main grew 14 bytes with identical inputs, two more export names to a lazy chunk; no code to move |
| L143 | Under Playwright's paused clock a SignalR connection does not finish opening (it waits on timers). A shot or spec that pauses the clock lets the hub connect and answer first: poll `hub.invocations(...)` before `page.clock.pauseAt`. | 14.1 | 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4 | Held in 15.4 |
| L144 | A store that starts async work from a callback (`onReconnected`) is unit-tested with a fake that awaits what the handlers return (`await Promise.all([...handlers].map((h) => h() as unknown))`), not with `vi.waitFor`, which polls in real time. | 14.1 | | |
| L145 | To build the previous version for a comparison, stash only frontend paths (`git stash push -u -- projects e2e package.json package-lock.json`), so the `.cache` link stays, and check `git stash list` before building; a failed step in an `&&` chain otherwise skips the stash and the pop finds nothing. | 14.1 | 14.2 | Saved time |
| L146 | Playwright's `clock.runFor` over several ticks of an RxJS `timer` polled through `switchMap` fires them back to back, and each tick cancels the read before it, often before the route sees it. A polling spec steps the clock one interval at a time and waits for each read (`expect.poll`) before the next. | 14.2 | 14.3 | Saved time |
| L147 | Content projected into a slot that a wide layout pushes to the foot (`margin-top: auto`) goes there too. Compare the first XL shot with the mock before writing the film; when the mock puts new content elsewhere in a component, add a named slot in the mock's order. | 14.2 | 14.3, 14.4, 14.5 | Saved time: 14.5's contact sheet matched the mock at every width on the first record |
| L148 | When a new screen request is per id (`GET /api/classes/{id}/sessions`) and many specs pass through the screen, give the API fixture one default for the path pattern, not an answer per id; it answers as the screen's honest fallback (unreachable), and a spec that needs data serves its own. | 14.2 | 14.3, 15.1 | Saved time in 15.1: the race queue defaults to unreachable |
| L149 | When two screens are sibling routes, a connection opened on the first cannot carry into the second; check the route tree before deciding which screen holds a connection or a session, and put the action on the screen that holds it (the class ride joins, not Class Start). | 14.3 | 15.1, 15.2 | Saved time in 15.2: the race joins with `JoinRace` |
| L150 | A backend refusal that a client branches on goes back over SignalR as an answer with a `code`, not a thrown exception: SignalR hides a server exception's message, so the code would never arrive. The client turns the answer into a typed error. | 14.3 | | |
| L151 | A backend acceptance test that needs several distinct riders signs each in through the real code flow and passes the `__Host-telo-session` cookie to the SignalR client in `options.Headers`, advancing the fake clock between sign-ins; no auth stub is needed. | 14.3 | | |
| L152 | A new call in a shared flow (the ride's join) makes every spec through that flow meet an unanswered hub invocation; grep the specs and film shots that open the flow (`openGroup`, `?session=`) and answer the call in each in the same change. | 14.3 | 14.4, 14.5, 15.1 | Saved time in 15.1 |
| L153 | A fake hub's answer runs in Node, so `Date.now()` there is the real clock, not the page's installed one; a spec that compares the server's time with the page's answers `ServerTime` from the page (`() => page.evaluate(() => Date.now())`). The fixture awaits answers and drops one that settles after the page closed. | 14.4 | 14.5, 15.1, 15.2, 15.3, 15.4 | Held in 15.4 |
| L154 | `page.clock.pauseAt` jumps without firing each second's timers in order, and a measured clock offset is a few milliseconds off. Pause just short and `runFor` the last second, and stand half a second past a whole second, so no display reads a second off. | 14.4 | 14.5, 15.1, 15.2, 15.3, 15.4 | Held in 15.4 |
| L155 | A countdown to a fixed moment wakes on the whole seconds before that moment (`(at - now) % 1000`), not on a free-running ticker, which shows a second too many for up to a second. | 14.4 | 15.1, 15.2 | Held in 15.2 |
| L156 | A state that holds before the work starts (a ride waiting for its start) still draws what the mock shows around it; derive that view from the plan at 0:00, not from the engine's live state, which does not exist yet. | 14.4 | | |
| L157 | Under a paused Playwright clock a zoneless Angular app draws nothing new: its change detection waits on a timer or frame the paused clock never fires. After a fixture pushes data (a hub event, a notification) into a page whose clock is paused, `runFor` a frame (100 ms) before asserting what it draws. | 14.5 | 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.4, 18.1, 18.2 | Saved time in 16.4; applied late in 18.1; saved time in 18.2 |
| L158 | A rule the backend and the app both compute (a seeded pace model) is proven the same by one table of cases written out in both suites, each row an exact value to six places; the backend's tests read no file, so the table is inline in each, never a shared fixture file. | 14.5 | | |
| L159 | Spec and film data meant to reorder a ranking leaves a clear gap at the precision the screen shows (whole kJ): a tie keeps the stable order and leaves the rider one place lower than the data was written to show. | 14.5 | | |
| L160 | `toObservable` from `@angular/core/rxjs-interop` brings `ReplaySubject` into the initial chunk, since `takeUntilDestroyed` already puts that module there. Drive a poll from the source observable (`level().pipe(tap(set), …)`) instead of turning a signal back into one. To find what grew main, compare the property names of the two builds, not a diff, which minified renames swamp. | 15.1 | 15.2, 15.3 | Held in 15.3 |
| L161 | A navigation started under a paused Playwright clock never lands: the next screen's loads and change detection wait on timers. After a click that leaves the screen, `clock.resume()` before asserting the new URL. | 15.1 | 15.2, 15.4, 23.3, 24.2, 25.1 | Saved time in 15.4: resume after Leave; saved time in 23.3: the announcer's 100 ms beat needed the clock run; saved time in 24.2: resumed the clock so a zoneless ride re-renders; saved time in 25.1: resumed before opening the lazily loaded dialog on the custom ride |
| L162 | A clock started from a past moment (a late rider in a live session) is read on a schedule by others: `RideTicker` published only at the next whole second, so the race showed 0:00 for up to a second. When a start moves into the past, check each scheduled reader shows the moment at once, and tick on start. | 15.2 | | |
| L163 | An overlay that makes a screen inert can block a control a requirement still names, and a second element with the same role makes a page object's `getByRole` match both. Before adding `inert` or a role, grep the specs that press controls or read that role in the window, scope the locator to the block's BEM class, and settle the clash in the design. | 15.2 | | |
| L164 | A periodic ticker on `FakeTimeProvider` fires once for one large `Advance`, at its end, skipping every threshold in between (a bot fill at 0:10 before a start at 0:30). Advance to each threshold, await its event, then go on. | 15.2 | 15.3, 15.4, 15.5 | Saved time in 15.5: the race tests step 10 seconds at a time, each awaited |
| L165 | A spec that answers a hub with a time read from the page when it answers (`Date.now() + 23_500`) and pauses at another read later lets the page's load time leak into the paused moment: CI's slower load put the lobby at 0:23, not 0:24. Fix the session's start and the paused moment on the installed clock (`STARTS_AT`, `pauseAt(STARTS_AT - 23_500)`), with a few seconds of slack before the pause for the page to open. | 15.2 (CI) | 15.3, 15.4, 15.5 | Saved time in 15.5: the result spec reuses `openRace` |
| L166 | A store that draws only on a ticker's beat shows nothing under a paused clock until the first beat, and `RaceStore` subscribes to `ticks` after `ticker.start()`, so the tick published on start (L162) goes unheard. When a race gains a new field, draw it once as the field starts, as the bots race does, rather than waiting for a beat. | 15.3 | | |
| L167 | xUnit's `Assert.Equal(double, double, int precision)` rounds both values before comparing, so a table shared with Jest's `toBeCloseTo(x, 2)` failed at 27.545 km/h. Give the C# copy the same tolerance (`Assert.Equal(expected, actual, 0.005)`), so the two suites check one rule. | 15.3 | | |
| L168 | The backend's session ticker also ticks in real time while `FakeTimeProvider` stands still, so a hub test that reports twice and then waits for "any standings with the first report" can catch a tick between the two reports. A wait must name every report its assertions read. | 15.4 | 15.5 | Saved time in 15.5: each step awaits the standings that carry every report |
| L169 | A component that maps a value to a class from a fixed list (`race-board__dot--{jersey}`) draws nothing for a value it lacks: the race board had no dots for riders online in 15.3, unseen until 15.4's shots. When a new source feeds a component, list the values it can send and look for each in the shots. | 15.4 | 15.5 | Saved time in 15.5: the shots showed Results lacked the same dots |
| L170 | A page's retry timer starts when the page handles the refusal, not when the spec sees the waiting state, so `runFor(interval)` straight after can run before the timer exists. Await the refused response, then step the clock until the next state shows. | 15.5 | | |
| L171 | When a slice makes valid a value an older malformed-input theory row used as its invalid example, give the row another invalid value and the new rule a row of its own. Read the theory's column order first: this one names the error's field before the fact it changes. | 15.5 | | |
| L172 | `FakeTimeProvider.Advance` fires a periodic timer once for every period it passes, so a test host with the once-a-second `SessionTicker` that moves the clock a year runs 31 million timer callbacks. A fixture that jumps days leaves the ticker out; a slow suite is profiled by class from a TRX report (`--report-xunit-trx`) before guessing. | 15.5 | | |
| L173 | A template reference on an element that carries an attribute component (`<button wz-button #start>`) is the component, not the element: `viewChild('start')` gives a `Button` with no `nativeElement`, and nothing fails. Read the element with `viewChild('start', { read: ElementRef })`. | 16.1 | | |
| L174 | Playwright's `route.fulfill` sends its body whole whatever `Content-Length` says, so a download cut off part way is a body shorter than the header; the client treats a short body as stopped, which a real truncated download needs too. An `<img>` of the same URL is its own request: a fixture that counts or holds downloads filters on `resourceType() === 'fetch'`. | 16.1 | | |
| L175 | The unit tests' jsdom `Blob` does not read typed arrays from the test's realm (it stores `"[object Uint8Array]"`): join chunks into one `Uint8Array` and hand it to `Response`, and read sizes with `arrayBuffer()`, rather than building a `Blob`. | 16.1 | | |
| L176 | To bring the copied world library up to `main`, merge each file three ways (`git merge-file`): the base is the `main` commit it was copied from (the commit whose file differs least from telo-ride's), with `@wattzup/` read as `@telo/` on both sides, so telo-ride's adaptations survive; where telo-ride only split type imports, take `main`'s file whole. Then typecheck, bring `main`'s specs for files that now have none, and run the world specs. | 16.1 | 16.2 | Saved time in 16.2 |
| L177 | The Echelon connection is `connected` only after the bike's first notification following its initialisation: a spec or shot that needs the bike connected (a fact reading its name) pushes a frame after `ECHELON_INITIALISED`. | 16.1 | 16.2, 16.3 | Saved time in 16.3 |
| L178 | Before claiming a cache or a reuse in a design ("the warm-up builds nothing twice"), measure it once with a throwaway probe (log `renderer.info.memory.programs` before and after each step, run one spec, then restore the file): 16.2's batched build compiled 68 programs and the warm-up 4 more, which confirmed the claim, and showed that three's 143 "items" are not 143 programs. | 16.2 | | |
| L179 | A screen that names the graphics API before the renderer has started guesses from `navigator.gpu`, and headless Chromium offers WebGPU and then draws with WebGL 2. Take the API from the renderer once it has started, and read the film's shots for such contradictions: the building shot said "programs for WebGPU" beside a ready shot saying "WebGL 2". | 16.2 | | |
| L180 | Playwright's `clock.install()` lets time flow, so a zoneless page keeps rendering (unlike `pauseAt`, L157), and `clock.fastForward(20_000)` fires each due timer once: a timer that counts its ticks sees one, so count elapsed time from `Date.now()` differences instead. | 16.2 | | |
| L181 | A gate added in front of an action every spec already takes (Start riding waits for the bike) breaks each of those specs at once. Before writing the gate, list the action's callers (`grep -ln startRiding e2e`) and give them one shared helper; wait for the bike's latest initialisation as the log's tail, so a spec that reloads waits for the second one. | 16.3 | 16.4 | Saved time in 16.4 |
| L182 | A component created from a lazy library on a route must find every token it injects bound on that route, even one its path never calls (`WorldScene` injects `WORLD_RENDERER` though a prepared renderer never loads one). Unbound, `createComponent` throws inside the import's promise and the spec only sees a missing element: bind the token on the route that creates it. | 16.3 | | |
| L183 | `main`'s `WorldScene` measures 30 frames of the display before it draws, which takes seconds with four workers rendering WebGL at once: an assertion on the world appearing takes the world's own 30-second timeout, as World loading's ready state does. Read the film's shots for contrast too: a notice laid over a picture needs a surface of its own. | 16.3 | 16.4 | Saved time in 16.4 |
| L184 | When a lifetime moves earlier (a group's hub join from the class ride to World loading), provide its store on the parent both screens share (the page) and make the action return one promise to every caller (`this.joining ??= this.connect(ref)`), so the later screen finds the seat the earlier one took. Then list every spec that awaited the later screen at once (`grep -ln openGroup e2e`) and send it through the earlier one first (`groupTimer.or(ride.name)`). | 16.4 | | |
| L185 | A page that goes silent for seconds in a trace (routed requests with no answer, cached dynamic imports resolving late) while the same spec passes alone and throttled 10× is waiting on the browser, not running code. Read the network timeline for what was asked just as it woke (`music/oldtown.ogg`): a media element made on every ride for music that was not playing was the cost. Make such resources only when first wanted, and split the spec's one wait into named stages (seated, then the clock) so a stall says where. | 16.4 | 17.1 | Saved time in 17.1 |
| L186 | A spec that finishes a ride and navigates on at once can leave before the app's IndexedDB write commits, so the ride is never kept: wait for what the device holds (`expect.poll(() => ridesWaiting(page))`) before the next navigation, and read the store from the page only after `indexedDB.databases()` shows it, since opening a missing database makes it empty before the app can. Await a write's transaction `oncomplete`, not the request's `onsuccess`. | 17.1 | | |
| L187 | Once a service worker controls the page, `page.route` sees none of the requests it makes: they reach the static server, which answers `/api/*` with `index.html` and 200, silently. Block service workers in the config (`serviceWorkers: 'block'`) and allow them only in the spec about the cache, and route the API fixture on the context (`page.context().route`), which does see the worker's requests. | 17.2 | | |
| L188 | An offline spec that answers the backend from fixtures can hide what the device does not keep: the race's offline specs answered `/api/progress`, so nobody saw that the open-map check needed the network. For a without-a-network criterion, fail every request as a lost connection (`api.offline()` with `context.setOffline(true)`) and see what still opens. | 17.2 | 17.3 | Saved time in 17.3 |
| L189 | Measure the initial chunk before taking a framework's convenience provider: `provideServiceWorker` brought `SwPush` and `SwUpdate` into main (+6.3 kB, past the warning) though nothing used them; registering from the lazy parent route cost 40 bytes, with an ADR for the departure. | 17.2 | 17.3 | Saved time in 17.3 |
| L190 | A helper that two lazy chunks share is hoisted into the initial chunk: `toObservable` from `@angular/core/rxjs-interop`, used by Race Setup's store and Class Start's, added 0.9 kB to main though neither screen is in it. React to a signal with `effect((onCleanup) => …)`, already in core, unsubscribing in `onCleanup`, and read main after every new import. | 17.3 | 18.1, 18.2 | No effect in 18.1: main unchanged; no effect in 18.2 |
| L191 | A spec that says the ride "carries on with the bike" must give the fake bike its telemetry and assert no lost-bike alert: the class spec sent none, so its bike would have dropped on its own, and only the film's frame showed "Lost the bike". Read each film frame as a check of what the spec does not assert. | 18.1, 18.2 | Saved time in 18.2 |
| L192 | To hold the SignalR client in `reconnecting`, refuse its negotiation (`route.abort('connectionrefused')`, the hub fixture's `lose()` and `restore()`): `drop()` alone reconnects at once, since the first retry waits 0 ms. Under the paused clock, run past a retry (2, 5, 10 s) after `restore()`, then run a frame for the page to draw the rejoin (L157). | 18.1 | | |
| L193 | A test that passes on its first run proves nothing until a mutation makes it fail: the two hidden-tab tests passed against the ticker earlier slices built, so the ticker's visibility tick was removed and they failed with the clocks at 10:00 and 9:59, then it was restored. To play Chrome's intensive throttling, wrap the page's `setTimeout` so each timer waits for the next whole minute of `performance.now()` while the fake bike keeps notifying (`hideTab(page, { throttled: true })`); `setSystemTime` moves neither the monotonic clock nor a timer. | 18.2, 19.1, 19.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.3, 24.1, 24.2 | Saved time in 19.1; saved time in 19.2; saved time in 20.3; saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1; saved time in 22.2; saved time in 22.3; saved time in 22.4; saved time in 23.1; saved time in 23.2; saved time in 23.3; saved time in 24.1; saved time in 24.2 |
| L194 | Read an expected value off the app in a visible tab rather than working it out by hand: the interval left and the distance at 10:10 were both guessed wrong, then measured with a throwaway probe of the same ride without hiding. For a `beforeunload` spec under the paused clock, give the page its user activation by clicking a static element (the clock): a disabled control's click never lands and the test times out instead of failing on the missing dialog. | 18.2 | | |
| L195 | A mutation that grows the initial bundle is refused by the raw budget before any spec runs, so to see a bundle spec fail, lift `maximumError` in `angular.json` for the experiment alone and restore both files from copies afterwards. Rebuild before measuring anything else: the experiment's `dist/` stays behind (the first `bundle:size` run read 256 kB from it). A script that CI must run lives under `frontend/`, since CI checks out only `frontend/` and `backend/`. | 19.1 | | |
| L196 | Before building a slice's parts, trace what the app holds today along the path the requirement names: 19.2's design planned chunks in IndexedDB for a trace the recorder already kept in one 115 kB buffer, and two of its three buffers belong to screens later slices build. Grep for growth (`.push(`, `new Map`, `update(… => [...`) in the stores the ride runs, read each hit, then prove the real bound with a spec and a mutation, and move each unbuilt part to the slice that brings its consumer. `page.clock.fastForward` takes `hh:mm:ss` with two-digit hours. | 19.2, 19.3 | Saved time in 19.3 |
| L197 | A check no agent may run (a heap, visual or accessibility sweep) is built only from flows a behaviour spec already proves, and its flow is filmed through the same page objects before it merges: the film's run is the agent's only execution of it. Filming 19.3's race round caught that a solo race's leave link is End ride (`race.end`), not Leave race, which would have failed the person's first heap run. Give each sweep its own Playwright config whose `testMatch` (`*.heap.ts`) the default `*.spec.ts` never matches, and check the default `--list` count is unchanged. | 19.3, 19.4 | Saved time in 19.4 |
| L198 | Run Prettier on the files under `frontend/` only, never on `docs/`: it pads a design's requirements table, as it does `class-worlds.md`, which the docs never use. Read `git show --stat` after a commit that touched docs; a docs edit of one phrase must show one line changed. A check of real frame times must not install Playwright's clock, which stands in for `requestAnimationFrame`: open the screen without `startRace`. | 19.4, 20.1, 20.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4, 22.2, 22.3, 22.4, 23.1, 23.2 | Saved time in 20.1; saved time in 20.2; saved time in 20.3; saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.2; saved time in 22.3; saved time in 22.4; saved time in 23.1; made it worse in 23.2: a shot waited on `requestAnimationFrame` under the paused clock |
| L199 | An init-script fixture that seeds storage once (guarded by a sessionStorage flag) must key its guard by what it seeds: a single flag makes a second call in the same test do nothing, and the step it was meant to prove passes vacuously. Read each green step of a new acceptance test and ask what would make it fail. A film shot under Playwright's paused clock needs a frame-stepping helper, so record only the shots the film uses. | 20.1, 20.2, 20.3, 20.4 | Saved time in 20.2; Made it worse in 20.3; partly helped in 20.4 |
| L200 | A test that renders an `@if (x; as y)` wrapping several `[slot=…]` nodes renders none of them (NG8011): give each slotted node its own `@if`. A signal input bound from a `computed` that returns a fresh object on every read (`worldQuality(settings())` in a template tick) fires every effect that reads it; bind one `computed` value, and inside the consumer track the primitives (`computed(() => q().scale)`) and act only on a real change from the last applied value, so a rebind restarts nothing. A mutation that leaves a test green can mean the test is right and the code has a second path to the same result: find it before trusting either. | 20.2, 20.3, 20.4 | Saved time in 20.3; saved time in 20.4 |
| L201 | Read the build's budget warning, not only its exit code: a warning passes verify and CI, and slice 20.1 sat 1.6 kB over the initial budget for two slices unseen. When the initial bundle grows, diff `main`'s inputs against the last good merge (`ng build --stats-json`, then `outputs[main].inputs[*].bytesInOutput`): a library used only in a lazy chunk still grows `main` when it pulls in more of Angular itself (CDK's `LiveAnnouncer` injects `DomSanitizer`, bringing the HTML sanitizer). Under Playwright's paused clock, `runFor(ms)` fires every 16 ms frame within `ms`; to space frames, step with `fastForward(ms)`. Never `git checkout -- <file>` to undo an experiment in a file the slice has already changed: copy it aside first. In a film recording, a shot that leaves a check drawing in software breaks the shot after it, so it goes last. | 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4 | saved time in 20.4; saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4 |
| L202 | A `@critical` spec has to be cheap on CI's shared runners, where the world draws in software: each world build there takes 25 to 30 seconds, and two at once can push a world spec past the default 30-second timeout. Time a new critical spec that draws a world (`gh run view --log`, or its trace's step times), give world specs a timeout for a software build, and keep a spec that builds the world twice out of CI's critical paths. Release what a ride holds in the call that ends it, not in an effect: under Playwright's paused clock an effect waits for a frame that never comes. Compare a design token's duration as a number: the production build writes `200ms` as `.2s`. Chromium reports no `no-preference` colour scheme, so a spec cannot emulate a device with no preference. | 20.4, 20.5, 21.1, 21.2, 21.3, 21.4 | saved time in 20.5; saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4 |
| L203 | Before writing a slice's contract, find what an earlier slice already keeps for it (`grep` the cache name, the storage key, the token): 16.1 already kept worlds in `telo-worlds`, so 20.5 read that cache instead of the design's new `telo-ride-worlds-v1`, and the design moved to match. Record what a list needs (a name, a size) on the stored item when it is written, so listing reads no file and loads no library. A library's unit specs run under `ng test ride` with `--include='../../*/src/**/x.spec.ts'`; the app's own with `--include='**/x.spec.ts'`. | 20.5 | 21.1, 21.2, 21.3, 21.4, 22.1 | saved time in 21.1; saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1 |
| L204 | Read a token's value, not its name: `--target-min` is 24 px (WCAG 2.5.8's minimum), and the 44 px touch size AGENTS.md sets is `--target-comfortable`. Run `ng lint` on each project the slice touched before the full verify, which stops at the first lint error after a minute (`interface` over `type`, type-only imports, an `<a>` with content), and run verify from the repo root, not `frontend/`. Edit a file Prettier has formatted with a pattern, not the one-line form it was written in. | 21.1 | 21.2, 21.3, 21.4, 22.1, 22.2 | saved time in 21.2; saved time in 21.3; saved time in 21.4; saved time in 22.1; saved time in 22.2 |
| L205 | When a requirement gives numbers its inputs do not settle (L2-099's ~154 W and ~276 kcal with the work and cool-down cadence aims open), search the open inputs for the values that give those numbers before choosing any: a short loop over 5 rpm steps found the one plausible pair (90 and 85 rpm), where `main`'s 100 and 70 rpm read ~155 W. Record the pair and how it was found in the spec's open question. When a slice defers a requirement, check that a later slice's prompt lists it; one that none lists comes back to the next slice that needs it. | 21.2 | 21.3 | saved time in 21.3 |
| L206 | A paused Playwright clock holds change detection, so step it (`runFor(100)`) after every click that renders, a navigation included; CSS transitions still run on real time. Five seconds without cadence blank power (L2-020 AC5): a spec that reads power over time pedals each second. An `effect` on a "last" signal sees only the last of several writes in one pass: log events where they happen (the service that sends), not by watching. `no-inline-styles` bans `[style.x]` in templates: set custom properties by host binding, place ticks with SVG `x="%"`, size a fixed series with SCSS `@for` and `:nth-child`. | 21.3, 21.4 | |; saved time in 21.4 |
| L207 | A lazily loaded page is built after its navigation has finished, so `router.currentNavigation()` is `null` there: read a navigation's state from `currentNavigation() ?? lastSuccessfulNavigation()`. A CDK `Dialog` sets `aria-modal="true"` only with `ariaModal: true`; while a modal is open the page behind leaves the accessibility tree, so a page object's locators for what stays visible behind it (a header's button, its timer) take `includeHidden: true`. Chain a commit on the specs' result (`… \| grep -q ' passed' && git commit`), not on the command before them. | 21.4 | | |
| L208 | zsh does not split an unquoted `$VAR` into words, so `dotnet test $F` with `F="--filter-method …"` passes one argument, runs no test and still exits 0: write the filter inline and read `total:` before trusting a pass. TestServer supplies the WebSocket feature itself, so `context.WebSockets.IsWebSocketRequest` is true in a test but false under Kestrel in middleware ahead of SignalR, which adds `UseWebSockets` inside its own endpoint: recognise an upgrade by its `Upgrade` header. | 22.1, 22.2, 22.3, 22.4 | |; saved time in 22.2; saved time in 22.3; saved time in 22.4 |
| L209 | SignalR sends a `HubException`'s message after its own words ("An unexpected error occurred invoking 'X' on the server. HubException: …"), so a test checks the end of the message; to see what a hub method really threw, turn on `EnableDetailedErrors` for one run and take it off again. A refusal written by hand (`new ValidationProblemDetails`) has no `type` or `traceId` and is not counted: build it with `ProblemDetailsFactory`, and curl the built API to see the body a client gets. | 22.2, 22.3 | |; saved time in 22.3 |
| L210 | Playwright's `page.clock.runFor` fires the timers in one jump, but the app's answers to the requests they send arrive in real time afterwards, so a timer the answer would set lands after the jump, and the absence of a request inside the window cannot be checked. Prove a timing rule positively: pick a value that makes the right code act before the wrong code would (a `Retry-After` shorter than the backoff), and leave the not-before cases to the unit spec with fake timers. | 22.3, 22.4 | |; saved time in 22.4 |
| L211 | A mutation proves a test only when it removes what the test relies on: clearing `url.query` by hand changed nothing, because the instrumentation already redacts query values, so the test still passed. When a mutation leaves a test green, find what really holds the behaviour before trusting the test, then mutate that (or add the leak the test looks for). Separately, a film terminal's lines are HTML: escape any markup shown in one, or the slide's DOM breaks with "Cannot read properties of null". | 22.4, 23.1, 23.2 | |; saved time in 23.1; saved time in 23.2 |
| L212 | Before writing a check that spans every screen, survey first: a throwaway spec (never committed) that opens each screen at the extreme widths and prints `scrollWidth` and the elements past the edge finds the real failures in one run, and tells an in-page scroller (`overflow-x: auto`) or a cropped cover image from a real overflow. Then put the screens in one shared table that the behaviour spec, the sweep and the film all import. | 23.1, 23.2, 23.3, 24.1, 24.2 | |; saved time in 23.2; saved time in 23.3; saved time in 24.1: every screen in light, one throwaway run; saved time in 24.2: one count of Full screen buttons per screen found the six missing |
| L213 | Measure a touch target by where a tap lands, not by the box: a control drawn small often takes touches across an overhanging `::after`. Tap with `document.elementFromPoint` at each edge of the target square and count only the control itself (or an input's label), never an ancestor. The overhang is lost in two ways the box never shows: a scroller (`overflow-x: auto`) clips it, so pad the scroller or wrap instead, and a later positioned sibling (a chart) paints over it, so give the overhang `z-index: 1`. | 23.2 | | |
| L214 | Marking the app `inert` behind a CDK dialog breaks the CDK's focus restore: it focuses the opener inside `overlayRef.dispose()`, before `closed` emits, while the app is still inert, and the browser refuses. Note `document.activeElement` on `afterOpened` (the focus has not moved yet), and on the last `closed` clear `inert` and focus the opener if the focus was lost. Inject `Dialog` only in the routes whose pages open one, never the parent route, or the overlay code loads on the first screen; and read a design's open questions before reaching for a CDK service (its `LiveAnnouncer` pulls the sanitizer into the initial bundle). | 23.3, 25.1 | |; saved time in 25.1: `provideInertBehindDialogs()` on the Settings route gave Diagnostics its focus restore unchanged |
| L215 | Chromium reports a device with no colour-scheme preference as light: `emulateMedia({ colorScheme: 'no-preference' })` gives light, so a requirement written for "no preference" cannot be tested; reword it to what the browser can report. To see a first paint, hold every script with `page.route` (`AppDocument.firstPaint`), read the page once the stylesheet applies, then release them. Check contrast on every surface a text role can sit on, raised included: the design system's own table listed only ink and panel and missed three 4.48:1 pairs. And grep the tests for a token's old hex before changing it. | 24.1 | | |
| L216 | A spec driven by the shared screens table can call `page.clock.resume()` on every screen: it is harmless where no fake clock is installed, and on a ride it lets a zoneless app re-render after a browser event (`fullscreenchange` left the custom ride's button reading "Full screen" in full screen). And run AC2 over every screen, not one: the AC2 test on Home alone had hidden two headers that drew the toggle unconditionally. | 24.2, 25.1 | |; saved time in 25.1 |
| L217 | When a slice changes which element a control is by state (a link that becomes a button once a bike is paired), grep `frontend/e2e/pages` for every locator of that control: Settings' `getByRole('link')` failed only in the full run. Locate such a control by `locator('a, button')`. | 25.1 | | |
| L218 | A build-time value goes through angular.json's `define` with a default (`"TELO_COMMIT": "'dev'"`), read behind `declare const TELO_COMMIT: string \| undefined` and a `typeof` guard so unit tests run without it; the deploy overrides it with `npm run build -- --define "TELO_COMMIT='${GITHUB_SHA::7}'"`. | 25.1 | | |

## Log

### 25.1 Inspect diagnostics (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L214 inert behind dialogs — saved time:** adding `provideInertBehindDialogs()` to the Settings route gave
  Diagnostics the app's inert background and its focus restore with no new code.
- **L161 and L216 the paused clock — saved time:** the custom ride's test resumed the clock before opening the lazily
  loaded dialog, which otherwise never rendered.
- **L18 bind on the parent route — made it worse when skipped:** `BUILD_INFO` bound in `app.config.ts` pulled the
  `@telo/api` barrel into the initial chunk and broke its budget by 3.85 kB; on the parent route it costs nothing there.
- **L121 film rules — saved time.**

**What slowed it down**

- The Settings page object located the bike row as a link; it failed only in the full run, once the row became a
  button.
- The initial budget, until `BUILD_INFO` moved off `app.config.ts`.
- One verify started from `frontend/`, where `tools/verify/verify.mjs` does not exist.

**New lessons:** L217, L218.

### 24.2 Full screen (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L212 survey first — saved time:** one throwaway count of Full screen buttons on every screen named the six headers
  without it before the spec was written.
- **L193 seen failing — saved time:** 9 failures, each for its reason, including two headers that showed the toggle
  without the API.
- **L161 the paused clock — saved time:** resuming the clock let the custom ride re-render its label in full screen.
- **L121 film rules — saved time:** the contact sheet caught the close-ups running off the frame.

**What slowed it down**

- The missing-button tests each waited the 30 s test timeout on their click; a red run took longer than the green one.

**New lessons:** L216.

### 24.1 Switch theme (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L212 survey first — saved time:** one throwaway run shot every screen in light, which showed the theme already
  worked and left only the first paint and contrast to check.
- **L193 seen failing — saved time:** the first-paint and contrast tests failed for their reasons, and the "no
  preference" test showed Chromium reports it as light.
- **L121 film rules — saved time:** the contact sheet caught phones over the hook's headline.

**What slowed it down**

- The app-shell spec pinned the wordmark's product name to #ff4521, so the token change failed one verify; the
  lockup reads `--color-volt-fg` by design, and the expectation moved with it.

**New lessons:** L215.

### 23.3 Screen readers and motion (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L212 survey first — saved time:** one throwaway run of every screen under reduced motion found the single bar
  still sliding before the spec was written.
- **L193 seen failing — saved time:** the step, result, dialog and motion tests each failed for their reason first.
- **L161 resume or run the paused clock — saved time:** the custom ride's announcement waits 100 ms, so the step test
  runs the clock a second after the step.
- **L121 film rules — saved time:** a terminal line with `<wz-root>` was escaped once the contact sheet showed it gone.

**What slowed it down**

- Inert behind the dialog left the focus nowhere on close; the CDK's own restore runs before `closed`.
- The first announcer and inert initializer used CDK services in the parent route; the design's open question named
  the cost, and both moved.

**New lessons:** L214.

### 23.2 Touch and keyboard (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L212 survey first — saved time:** one throwaway run listed every small control and every Tab stop without a ring,
  across all fifteen screens, before the spec was written.
- **L193 seen failing — saved time:** the tap spec failed on five screens for the expected reason; the focus check,
  green from the start, failed on all fifteen screens with the global `:focus-visible` outline taken out.
- **L211 mutate what holds the behaviour — saved time:** the mutation removed the one rule that draws every ring.
- **L198 the Playwright clock stands in for `requestAnimationFrame` — made it worse:** a class ride shot waited two
  minutes on `settle()`, which needs a frame, until the clock was resumed.
- **L121 film rules — saved time.**

**What slowed it down**

- The first tap check counted a hit on an ancestor as a hit, so a 36 px button passed at 48 px; only a stricter check
  showed the real misses.
- The survey's box sizes overstated the misses: most small controls already took touches across 44 px.

**New lessons:** L213.

### 23.1 Fit every width (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 seen failing — saved time:** the width spec failed on the custom ride at 320 px for the expected reason; the
  margin tests, green from the start, were proved by setting the sm margin to 20 px for one run.
- **L211 mutate what holds the behaviour — saved time:** the mutation changed the token every page reads, not a copy.
- **L198 Prettier on `frontend/` only; L121 film rules — saved time:** a terminal that first said "33 passed" was
  corrected to the run that was really seen.

**What slowed it down**

- Two ride page objects have no heading; the spec waits on their clocks instead.

**New lessons:** L212.

### 22.4 Restrict third parties (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 seen failing — saved time:** the policy spec failed for want of the header and for the tracker requests
  leaving the page; the guard was proved by taking YouTube out of `script-src` (4 class video specs failed on the
  refusal), and the telemetry test, green from the start, by putting the email on a span and by logging requests.
- **L210 positive timing — not needed here;** nothing in this slice is timed.
- **L198 Prettier on `frontend/` only; L208 zsh filters inline; L121 film rules — saved time:** a contact sheet caught
  a hook headline under the browser, a clipped terminal line and a headline touching the bug.

**What slowed it down**

- The designs described a static web host, a `ThirdPartyOrigins` list, a scrubbing processor and log redaction, none
  of which the code has since ADR 0026. They now describe what holds the behaviour, and the decisions are recorded.
- The first telemetry mutation proved nothing (L211), and an unescaped `<script>` in a film terminal broke the build
  (L211).

**New lessons:** L211.

### 22.3 Limit abuse (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until it is seen failing — saved time:** the first outbox case passed on
  unchanged code, which showed it was checking nothing (L210).
- **L198 Prettier on `frontend/` only; L208 zsh filters inline — saved time.**
- **L209 SignalR's own words around a hub error — saved time:** the gate drops a message without an error, so the
  test waits for the connection's `Closed` event instead of reading a message.
- **L121 film rules — saved time:** the hook's headline was checked on a frame and shortened where it ran under the
  browser.

**What slowed it down**

- The first outbox case, a `Retry-After` of 120 s, passed before the change: the 30-second retry's answer came after
  the clock's jump, so its next timer fell outside the window (L210).
- The design put the ride limit in the rate-limiting middleware; it would have counted repeats of a ride id and the
  5-second retries of a pending race result against the rider's hour. The handler counts recorded rides instead, as the
  sign-in limits do, and the design records the decision.

**New lessons:** L210.

### 22.2 Validate input and encode output (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.** The worktree's install was forgotten once, and the first
  spec run said only that `@playwright/test` was missing.
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the untrusted-text spec passed on
  the existing interpolation, so `[innerHTML]` was put on Connect Bike's name for one run, and it failed; each lint
  rule was proved the same way.
- **L198 Prettier on `frontend/` only — saved time:** Prettier caught `eslint.config.js` before verify.
- **L204 lint before verify — saved time:** the whole workspace was linted under the new rules before verify, and
  nothing in it binds markup.
- **L208 zsh filters inline, read `total:` — saved time:** every `dotnet test` filter was written inline.
- **L121 film rules — saved time:** curl of the built API showed the wrong-type refusal lacked its trace id, which a
  test now checks.

**What slowed it down**

- The hub filter looked as if it did nothing: SignalR wraps a `HubException`'s message in its own words (L209).
- An existing join test sent a malformed session id and expected `session_not_found`; the case moved to the
  validation test, which now refuses it as `validation_failed`.

**New lessons:** L209.

### 22.1 Authenticate every request (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L203 find what an earlier slice already keeps — saved time:** the fallback policy, the health checks and the
  refusal of a signed-out session (slices 1.2 and 9.4) already met L2-127 AC1, AC3 and AC4 for the endpoints they
  tested; the slice added the test that asks every endpoint, and AC2.
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the every-endpoint test passed at
  once on the existing code, so it was proved by two mutations (rides marked anonymous, the map catalogue unmarked),
  and the WebSocket test by dropping the upgrade guard; each failed for the expected reason.
- **L204 lint before verify — saved time:** `dotnet format` ran before verify, which passed first time.
- **L121 film rules — saved time:** the terminals hold the built API's real answers, captured with curl after verify
  had finished with the backend's `bin`.

**What slowed it down**

- The design's `IAntiforgery` plan could not survive the service worker's cached shell (ADR 0032); weighing it
  against a same-origin proof and writing ADR 0033 took longer than the code.
- A filter in a zsh variable ran no test and reported success (L208).
- The first WebSocket guard passed its test only because TestServer supplies the WebSocket feature (L208).

**New lessons:** L208.

### 21.4 Pause, leave or end (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the backend test and each of the
  five specs failed first for the expected reason (kind refused; no Pause, alert, End, Library or Start).
- **L198 Prettier on `frontend/` only — saved time:** the designs and the Profile mock were edited by script, and the
  mocks' matrix regenerated with the mocks skill's checker.
- **L201 read the build's budget line — saved time:** the initial bundle stayed at 297.45 kB; the overlay, the popover
  and its dialog load with the ride.
- **L202 keep `@critical` cheap on CI — saved time:** End's spec runs on CI; it draws no world.
- **L203 find what an earlier slice already keeps — saved time:** `RideRecorder`, `RIDE_OUTBOX`, the class ride's
  pause and lost-bike rules and the fake bike's drop and switch-off carried the slice; the backend needed one kind.
- **L204 lint before verify — saved time:** lint caught an output named `ended`, a DOM event, before verify.
- **L206 a paused clock holds change detection — saved time:** the Profile notice's spec saw nothing until the clock
  stepped while Profile's chunk loaded, as the lesson warns.
- **L121 film rules — saved time.**

**What slowed it down**

- Profile's notice read `router.currentNavigation()`, which is already `null` when a lazily loaded page is built
  (L207).
- With "Leave this ride?" open the page behind left the accessibility tree, so the page object lost Library and the
  clock; and the CDK left `aria-modal` off until `ariaModal: true` (L207).
- One regression run failed once and passed 224 times after; a commit chained on lint went in before it was looked at
  (L207).

**New lessons:** L207.

### 21.3 Ride a custom workout (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** each of the six specs and the backend
  acceptance test failed first for the expected reason (no Start ride, no main view, no video tab, no aside, no route).
- **L198 Prettier on `frontend/` only — saved time:** the spec, mocks and designs were edited by script.
- **L201 read the build's budget line — saved time:** the initial bundle stayed at 297.45 kB; the ride, its eleven
  components and the save client load with `/profile/custom`.
- **L202 keep `@critical` cheap on CI — saved time:** one critical spec (Start ride to the first command) and one
  backend critical test.
- **L203 find what an earlier slice already keeps — saved time:** the class ride's engine (`RideClock`,
  `RideTicker`, `WorkoutEngine`, `ResistanceController`, `BikeTelemetry`, `VideoClockSync`), `RideTotals` (built in
  slice 5, never used until now), `bikeStatus` and the YouTube fake carried the ride; the slice added the views.
- **L204 lint before verify, edit formatted files by pattern — saved time:** lint caught a style binding and two type
  imports before verify; one edit by Prettier's old one-line import missed, as the lesson warns.
- **L205 numbers the inputs do not settle — saved time:** L2-102's 107 W at 73 rpm on level 6 is 108 W by the formula;
  72 rpm gives 107 W, so the spec and three mocks now read 72. "Sent to bike" (L2-029), slice 4.2's and never built,
  came back to this slice, which needed it.
- **L121 film rules — saved time.**

**What slowed it down**

- A spec clicked the workout link on the paused clock and saw a half-drawn page; another read power after 20 s of
  silence and saw "—" (L206).
- The log first watched `ResistanceController.last` with an effect and lost two of three commands sent in one pass;
  the controller now keeps the log itself, stamped with the ride clock (L206).

**New lessons:** L206.

### 21.2 Preview a custom workout (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** each spec failed first against no
  preview and no switch; the player-release spec also failed with the release effect taken out.
- **L198 Prettier on `frontend/` only — saved time:** the spec, mocks and designs were edited by script.
- **L201 read the build's budget line — saved time:** the initial bundle stayed at 297.45 kB; the player's code loads
  only when the preview asks for it.
- **L202 keep `@critical` cheap on CI — saved time:** no new critical spec; 21.1's opens the page.
- **L203 find what an earlier slice already keeps — saved time:** `PlanSummary` (structure, average power),
  `EnergyModel`, `planStateAt`, `ClassProfile` and the video player factory were all there; the slice added only the
  expansion, the validation and the facts' list.
- **L204 tokens by value, lint before verify, edit formatted files by pattern — saved time:** lint caught an empty
  switch before verify; one edit by a stale comment string failed its assertion, as the lesson warns.
- **L121 film rules — saved time.**

**What slowed it down**

- L2-099's 154 W and 276 kcal rest on the work and cool-down cadence aims, which no spec gave; a search over the
  aims found 90 and 85 rpm, where `main`'s 100 and 70 read 155 W (L205).
- The video section (L2-098) was 21.1's, deferred, and no later prompt listed it; the preview's Video fact needed it,
  so this slice built it, with two new mock states for its words (L205).

**New lessons:** L205.

### 21.1 Set up a custom workout (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the five specs ran first against no
  page and failed for that reason; the rules' 19 unit tests came with the rules.
- **L198 Prettier on `frontend/` only — saved time:** the spec, mock and design were edited by script.
- **L201 read the build's budget line — saved time:** the initial bundle stayed at 297.45 kB; the page, its store and
  its seven components load with `/profile/custom`.
- **L202 keep `@critical` cheap on CI — saved time:** the critical spec opens the page from Profile and draws nothing.
- **L203 find what an earlier slice already keeps — saved time:** no custom workout code existed yet; `formatClock`,
  the lockup and the full screen toggle were reused.
- **L121 film rules — saved time.**

**What slowed it down**

- The spec left four of the five plans undefined; the slice settled their rounds in L2-095 AC7, and added an `edited`
  mock state for the chip's mark.
- `--target-min` reads like the touch minimum but is 24 px; the components first took it for 44 px (L204).
- Verify was started from `frontend/` once, then stopped at lint twice: a `type` alias, a type-only import, and an
  empty `<a>` (L204).

**New lessons:** L204.

### 20.5 Manage saved worlds (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the downloader ignoring Keep worlds
  and the toast with no timer each failed their acceptance test. The eviction test passed before any change, since
  16.1's downloader already downloads what the cache lacks; it guards that behaviour now.
- **L198 Prettier on `frontend/` only — saved time.**
- **L201 read the build's budget line — saved time:** the initial bundle stayed at 297.45 kB; This device, the toast
  and the saved worlds service load with Settings.
- **L202 keep `@critical` cheap on CI — saved time:** the critical spec opens Settings with saved worlds and draws no
  world; the class specs ride the panorama with WebGL off.
- **L121 film rules — saved time.**

**What slowed it down**

- The design named a new cache and a `WorldCache` with `get` and `put` beside 16.1's downloader, which already kept
  worlds in `telo-worlds`; the slice read that cache instead and changed the design (L203).
- Names for the list: the world names live in the lazy world library. The downloader now writes each world's name and
  size on the saved file, which changed its signature and its 11 unit calls (L203).
- A panorama-only load never says "saved on this device", so the Keep worlds off wording of World loading is proven by
  its view's unit test, not in the browser.

**New lessons:** L203.

### 20.4 Sound, motion and display (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** three specs assert an absence (no
  audio context with ride sound off, no track with World music off, no full screen with it off); one build with all
  three mutations failed each, as did one mutation of the world scene's new input in its unit test.
- **L198 Prettier on `frontend/` only — saved time:** the mocks, design system and design were edited by script.
- **L199 paused-clock captures — partly helped:** no film shot used the paused clock; but the ride sound spec met the
  same trap in another form, a release waiting on an effect (L202).
- **L200 one `@if` per slotted node, stable inputs — saved time:** the two new sections bind one settings signal.
- **L201 read the build's budget line — saved time:** the initial bundle moved from 297.21 to 297.45 kB, seen in the
  first build; `FULLSCREEN` moved to the parent route, whose code was already initial.
- **L121 film rules — saved time.**

**What slowed it down**

- 20.3's merge turned CI red: its long device-check spec took CI four minutes, built the test world twice in
  software and timed out, aborting its reload. Its fix put the cheap Auto spec on the critical path, whose world
  build beside the race world spec's pushed that one past its 30 seconds (L202).
- The ride sound spec saw the audio context made but never closed: `stop()` released it through an effect, which
  the paused clock never ran (L202).
- The theme spec emulated `no-preference`, which Chromium reads as light; the motion spec compared `200ms` with the
  build's `.2s` (L202).
- Two class rides in one page do not start: the second bike initialisation differs. The full-screen spec split in
  two.

**New lessons:** L202.

### 20.3 Check this device (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L193 a passing test proves nothing until a mutation fails it — saved time:** the fixed-level race test passed
  before any code existed; a mutation letting the check override a fixed level failed it, as did one ignoring a
  hidden tab.
- **L198 Prettier on `frontend/` only — saved time:** the design README and diagrams were rewritten by script.
- **L199 paused-clock shots — made it worse:** the film's running-check shot timed out in the capture's two-frame
  settle, and once fixed, the shot recorded after it failed; neither was foreseen (L201).
- **L200 one `@if` per slotted node, rebinds restart nothing — saved time:** the device check sits outside the slots,
  and the page binds one `computed` view.
- **L121 film rules — saved time:** the widths scene and the four widths were checked against 20.2's film.

**What slowed it down**

- The initial bundle had been 1.6 kB over its budget since 20.1, a warning nobody read. Moving Settings' providers
  behind `loadChildren` changed nothing; diffing `main`'s inputs against 19.4's showed Angular's HTML sanitizer,
  brought in by CDK's `LiveAnnouncer`. Settings' own status region took it out: 297 kB (L201).
- The first e2e run stepped High's frames with `runFor(30)`, which fired a frame every 16 ms, so High held (L201).
- Undoing an experiment with `git checkout --` threw away the slice's edits to the same file; they were re-applied
  from the transcript (L201).
- The film's running-check shot needed frames stepped during its capture, and broke the next shot until it was moved
  last (L201).

**New lessons:** L201.

### 20.2 World quality controls (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L198 Prettier on `frontend/` only — saved time:** the design README and its diagrams were rewritten by script and
  never formatted.
- **L199 read each green step — saved time:** both race checks passed first time, so each was proven by a mutation;
  the step-down mutation stayed green, which found a real bug (below).
- **L121 film rules — saved time:** the widths scene and the 768 and 1024 px shots were checked against 20.1's film.

**What slowed it down**

- The World section's pill and notice did not render: one `@if (graphicsApi(); as api)` wrapped every slotted node, so
  none was projected (NG8011, as `AGENTS.md` warns). One `@if` per node fixed it (L200).
- Removing the step-down pin left the race at Medium: the race bound a new quality object every second, and the scene
  re-applied the frame period on each, which restarted the budget's windows, so no window was ever judged. The race now
  binds one `computed`, and the scene acts only on a new scale or cap (L200).
- That fix's first form also set the period on the scene's first frame, failing three of `main`'s unit specs; it now
  remembers the last applied values and does nothing until one changes.

**New lessons:** L200.

### 20.1 Settings page and store (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L198 Prettier on `frontend/` only — saved time:** the design README and its tables were edited by script and
  never formatted.
- **L121 film rules — saved time:** the contact sheet showed a fact orphaning "px", joined before encoding.

**What slowed it down**

- The malformed-storage test's second half passed for the wrong reason: the seeding fixture's one flag stopped the
  second value being stored. Found by reading the green test, not by a failure (L199).
- A class-ride shot timed out under the paused clock; the film did not need it, so it was dropped (L199).
- `::ng-deep` would have styled the section's projected rows; a `Setting` component that draws its own hairline keeps
  each stylesheet to its block.

**New lessons:** L199.

### 19.4 Web vitals and frame budget (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L3 format first — made it worse:** formatting the design README with the e2e files padded its requirements
  table; the table was restored from the commit before (L198).
- **L197 film an unrun check's flow — saved time:** the film's Home flow failed where the check would have, a Tab
  after a tap never reaching the skip link; the check now takes the Tab first.
- **L121 film rules — saved time:** the contact sheet showed a label orphaning its unit, shortened before encoding.

**What slowed it down**

- The frame check needed the real clock: `startRace` installs Playwright's, whose `requestAnimationFrame` follows the
  fake time, so the check opens the race itself (L198).

**New lessons:** L198.

### 19.3 Heap checks (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L196 trace what exists before building — saved time:** no sweep existed, so the heap checks got their own config
  and npm script rather than a project in the behaviour config.
- **L34 diagrams; L121 film rules — saved time:** the heap-check diagram re-rendered with exit status 0; the film's
  failed race shot exposed the wrong leave link before the merge (L197).

**What slowed it down**

- AGENTS.md lets no agent run a heap check, so the checks could only be type-checked, linted and listed; the race
  round's leave link was wrong until the film ran the same flow (L197).

**New lessons:** L197.

### 19.2 Bounded ride buffers (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L193 prove a test that passes at once by mutation — saved time:** the long-ride spec passed against slice 10.1's
  recorder; a two-hour buffer made it fail at 7200 samples.
- **L34 diagrams; L121 film rules — saved time:** four diagrams re-rendered with exit status 0; the contact sheet
  showed a thin profile close-up and an empty Results crop, both replaced before encoding.

**What slowed it down**

- The design and the slice's description named buffers for a trace chart and a packet log that no screen has yet;
  finding what the ride really holds took a survey of every store (L196).

**New lessons:** L196.

### 19.1 Bundle budgets (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L5 read the initial chunk — saved time:** the build output gave the 300.26 kB the tightened budget sits above.
- **L193 prove a test that passes at once by mutation — saved time:** the world was already lazy, so Three.js was
  imported into `main`; the raw budget refused the build, and with it lifted the Home spec failed on the world's code.
- **L121 film rules — saved time:** the contact sheet read clean at the first pass.

**What slowed it down**

- The first mutation run stopped at the budget, not the spec, and its `dist/` misled the first size reading (L195).

**New lessons:** L195.

### 18.2 Keep the ride clock true (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the race's leave-guard test failed waiting for the dialog before the
  guard was written; the hidden-tab tests passed at once, so a mutation proved them (L193).
- **L157 run a frame under the paused clock — saved time:** one 16 ms frame after showing the tab drew the caught-up
  clock.
- **L191 feed the fake bike — saved time:** both hidden-tab tests notify a workout frame every second, so no lost-bike
  alert hid the readouts.
- **L5 initial chunk; L190 read main after new imports — no effect:** main stayed at 277.44 kB.
- **L34 diagrams; L121 film rules — saved time:** four diagrams re-rendered with exit status 0; the contact sheet read
  clean at the first pass.

**What slowed it down**

- Two expected values were worked out by hand and wrong (L194).
- The leave-guard test first clicked the Raise button, disabled under the paused clock, and timed out (L194).

**New lessons:** L193, L194.

### 18.1 Lose the service mid-ride (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend tests failed with nothing heard on the rejoin, and the specs
  on the missing status region, before any code was written.
- **L157 run a frame under the paused clock — applied late:** the first green run of the class spec failed on the
  notice still drawn after the rejoin; a frame after the rejoin fixed it (L192).
- **L5 initial chunk; L190 read main after new imports — no effect:** main stayed at 277.44 kB.
- **L34 diagrams; L121 film rules — saved time:** four diagrams re-rendered with exit status 0; the contact sheet
  showed the class's bike dropping and an overlong board close-up, both fixed before encoding.

**What slowed it down**

- The fake hub's `drop()` reconnects at once, so the reconnecting state needed a way to refuse negotiation (L192).
- The class spec never fed the bike; the film's frame caught what the spec did not assert (L191).

**New lessons:** L191, L192.

### 17.3 Offline choices (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** both acceptance tests failed on the missing words, and both unit specs on
  the missing modules, before any code was written.
- **L188 take the browser offline in the spec — saved time:** `context.setOffline` fires the window's real events, so
  the words were proven against what the browser does, not a stubbed status.
- **L5 initial chunk; L189 measure before taking a convenience — saved time:** the build output showed main 0.9 kB
  larger at once, and the cause was found before the commit (L190).
- **L34 diagrams; L121 film rules — saved time:** three diagrams re-rendered with exit status 0; the first contact
  sheet showed the race-mode close-ups overlapping, fixed by placing them side by side.

**What slowed it down**

- `toObservable` in two lazy stores was hoisted into main (L190); the stores now react through `effect`.
- The film's close-up showed the app drawing a lock on the closed mode that the new mock had left out; the mock gained
  it.

**New lessons:** L190.

### 17.2 Cache the app (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L5 initial chunk; L18 bind on the lazy parent route — saved time:** the build output showed Angular's provider
  adding 6.3 kB to main, and the registration moved to the screens' lazy parent route for 40 bytes (L189).
- **L41 spec each step first — partly:** both acceptance tests, the hosting tests and the downloader's case failed first;
  the registration's unit spec was written after the spike that proved the worker could be routed, and passed at once.
- **L34 diagrams; L121 film rules — saved time:** two diagrams re-rendered with exit status 0; the film reused the race
  films' frame stepping for shots under a paused clock.

**What slowed it down**

- The worker answered the page's API requests past the fixture, and the static server answered them with `index.html`
  (L187).
- Real offline showed the race needed the rider's progress from the network, which every earlier offline spec had
  answered (L188); the `progress` data group now keeps its last answer.
- The film recorder serves a development build, which registers no worker, so the shots needed a production build
  served on its port first.

**New lessons:** L187, L188, L189.

### 17.1 Ride outbox (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the three tests failed on nothing kept on the device and on a 503 read
  as not recorded, before any storage code was written.
- **L185 make resources only when wanted, name the stages — saved time:** the device's database opens with the outbox
  on the first screen, and the specs wait on what the device holds, then on what was sent.
- **L5 initial chunk; L34 diagrams; L121 film rules — saved time:** main grew by 9 bytes, the export of an Angular
  function already in it, and the commit says why; four diagrams re-rendered with exit status 0; the film kept the last
  one's shape, with close-ups made by `detail()`.

**What slowed it down**

- The oldest-first spec lost its first ride every time: it navigated on before the IndexedDB write committed (L186).
- The XP close-ups were first drawn with the page shots' fixed 1440 × 900 shape and came out cropped; they keep their
  own shape now.
- The design named a sync service the code did not need: the outbox the app already had took the sending, and the
  diagrams were brought in line.

**New lessons:** L186.

### 16.4 Join a group world class (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the four tests failed on the missing timer, eyebrow and Connect bike's
  single line, and the film's shots then caught the eyebrow, which got its assertion before its fix.
- **L157 paused clock draws nothing — saved time:** the group start and the video are stepped a tenth of a second at a
  time (`untilShown`).
- **L181 list the callers — saved time:** the five group specs that opened the class ride at once were found and sent
  through World loading together (L184).
- **L183 the world's 30-second timeout — saved time:** the late fade takes it too.
- **L5 initial chunk; L34 diagrams; L121 film rules — saved time:** main stayed at 277,405 bytes, the as-built sequence
  rendered with exit status 0, and the film kept the last one's shape.

**What slowed it down**

- Two full verify runs failed on the group board's first test: the page went silent for 8 to 11 seconds just after the
  class ride appeared, under four workers only, never alone or throttled. The trace showed the world's track being
  asked for as it woke; making the music player only when the music is wanted ended it (L185).
- Five group specs waited for the class ride at once and had to wait for World loading first (L184).
- A locator for the group notice matched the WebGL notice too; it now filters on the timer.

**New lessons:** L184, L185.

### 16.3 Start a solo world class (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the four tests failed on the missing alert, canvas and track.
- **L177 connect after initialisation — saved time:** it became the shared `connectBike` helper the gated specs use
  (L181).
- **L5 initial chunk; L34 diagrams; L121 film rules — saved time:** main stayed at 277,405 bytes with the world music
  and the class's world in their lazy chunks, the as-built sequence rendered with exit status 0, and the film kept the
  last one's shape.

**What slowed it down**

- Thirteen specs that pressed Start riding without a connected bike failed at once on the new gate, and one that
  reloads needed the helper to wait for the second initialisation (L181).
- The handed-over world never appeared until the class ride's route bound `WORLD_RENDERER` (L182), and the fade then
  outran the default timeout on a busy machine (L183).
- The film's shots showed the video's notice unreadable over the panorama under the inset; it now has the panel's
  surface.
- Verify was first started from `frontend/`; it runs from the repository root.

**New lessons:** L181, L182, L183.

### 16.2 Build shaders and warm up (2026-11-22)

**Applied from earlier**

- **L41 spec each step first — saved time:** the three tests failed on the missing quality fact and warning.
- **L157 paused clock draws nothing — saved time:** the slow tests install the clock and let it flow, then jump it
  (L180).
- **L176 world sync — saved time:** the world library was already level with `main`, so there was nothing to merge.
- **L177 connect after initialisation — saved time:** the shots push a frame before reading the bike's name.
- **L5 initial chunk; L34 diagrams; L121 film rules — saved time:** main stayed at 277,405 bytes, the new
  sequence diagram rendered with exit status 0, and the film kept the last one's shape.

**What slowed it down**

- Working out what to count: three's `compileAsync` reports items, not programs, and compiles for whatever target and
  MRT are bound, so it had to compile into the scene pass's own target to match the warm-up's cache key (L178).
- The film's shots caught the card naming WebGPU while it built for WebGL 2 (L179).
- A first probe that never opened World loading, because it did not remember a bike as the specs do.
- A heredoc script that failed still let the next line commit: chain a script and its commit with `&&` on one line.

**New lessons:** L178, L179, L180.

### 16.1 Download the world (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the five World loading tests failed on the missing screen, and the
  downloader's unit tests on a jsdom `Blob` and an abort that came before the request.
- **L5 read the initial chunk — saved time:** main stayed at 277,405 bytes with the world loaded in its own chunk.
- **L34 render every diagram — saved time:** the as-built sequence rendered with exit status 0 and was read.
- **L121 film rules first — saved time:** the film kept the last one's shape with the widths scene.
- **L157 paused clock draws nothing — not applied up front, cost a debugging round:** the class ride fixture
  answered the catalogue under the paused clock, and World loading never rendered; it now loads on the running
  clock and pauses before Start riding.

**What slowed it down**

- Bringing the world library up to `main` first: 33 files had moved, and the race riders and ghost had to follow
  `main`'s new painted-geometry cyclist (L176).
- Every solo class spec went through the shared fixture, which met World loading under a paused clock (L157).
- Simulating a stopped download: Playwright sends a short body as a whole response, and the panorama's `<img>`
  took the fixture's held and cut-off answers (L174). Start riding's focus read the `Button`, not its element
  (L173).

**New lessons:** L173, L174, L175, L176, L177.

### 15.5 Record results nobody can change (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's result tests failed with no `SessionEnded` and `mode:
  online` refused; the race spec with the ride not recorded after the 409, and with "vs Bots" where "Live race" was due.
- **L164 advance to each threshold; L168 wait for every report — saved time:** the race tests step 10 seconds at a
  time and await the standings carrying each rider's report, so the end falls on an exact second.
- **L165 fixed moments — saved time:** the result spec reuses `openRace`.
- **L169 look for every value in the shots — saved time:** Results' standings lacked the online riders' dots too.
- **L5 read the initial chunk — saved time:** main stayed at 277,405 bytes.
- **L121 film rules first; L34 render every diagram — saved time:** the result sequence re-rendered with exit status 0.

**What slowed it down**

- The backend step of verify took 480 s. A TRX profile put 425 s in one session test that moves the clock a year;
  the ticker's timer fired every second of it (L172).
- The first result spec stepped the clock 5 seconds before the page had the 409, and passed by luck (L170); the
  film's shots failed on it at once.
- An older validator row used `online` as its invalid mode (L171).

**New lessons:** L170, L171, L172.

### 15.4 Mark leavers and DNF (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's DNF tests failed with no status, no refusal and no DNF;
  the race specs with "−0:05" where "DNF" was due and no `LeaveRace`.
- **L143, L153, L154 pausing the clock; L157 a frame after a push — held.**
- **L161 resume after leaving — saved time:** the Leave spec resumes the clock before it reads Race Setup.
- **L164 advance to each threshold — saved time:** the silence and removal tests step one second at a time, each
  awaited.
- **L165 fixed moments — saved time:** both DNF specs reuse `openRace`.
- **L5 read the initial chunk — saved time:** main stayed at 277,405 bytes.
- **L121 film rules first; L34 render every diagram — saved time:** the leave sequence re-rendered with exit status 0.

**What slowed it down**

- A 14.5 group standings test failed once in the full backend run: a real-time tick landed between two reports (L168).
- No mock showed another rider marked DNF, so the race mock gained a `someone-left` state before any code.
- The 15.3 board drew no jersey dots for riders online (L169).

**New lessons:** L168, L169.

### 15.3 Live standings (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's standings tests failed with no `RaceStandingsUpdated`
  ("events that arrived: []"), the speed table on a missing `VirtualSpeedModel`, and the race specs with no board and
  no `ReportRaceProgress`.
- **L143 let the hub connect before pausing; L153 `ServerTime` from the page; L154 stand half a second — held.**
- **L157 run a frame after a push — held:** the board reorders on the race's next second, so each push is followed by
  `runFor(1000)`.
- **L164 advance to each threshold — saved time:** the standings tests advance to the bot fill, await it, then to one
  second after the start.
- **L165 fixed moments on the installed clock — saved time:** CI failed the 15.2 merge on a lobby read 0:23 instead
  of 0:24; anchoring the start and the pause fixed it, and the race specs now share one `openRace` in
  `fixtures/live-race.ts`.
- **L160 no `toObservable` in a store — held; L5 read the initial chunk — saved time:** main stayed at 277,405 bytes.
- **L121 film rules first; L34 render every diagram — saved time:** two sequence diagrams re-rendered with exit status
  0.

**What slowed it down**

- The 15.2 merge's CI run failed on the online lobby's critical spec, which read the start and the pause from the page
  at different moments (L165).
- The online board stayed empty under the paused clock until a beat that never came (L166).
- The shared speed table failed in xUnit at 27.545, which Jest passes (L167).

**New lessons:** L165, L166, L167.

### 15.2 Start a live race (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the countdown specs failed with no overlay, the backend's `JoinRace` tests
  with "Method does not exist", the race specs with no `JoinRace`, and the ticker's unit case on 0 where 4 was due.
- **L143 let the hub connect before pausing; L153 `ServerTime` from the page; L154 stand half a second — held:** the
  race opened 4.5 s late reads 0:04, then 0:05, every time.
- **L157 run a frame after a push; L161 resume after leaving — saved time:** each spec reads "Go" under the paused
  clock, then resumes to see the race open.
- **L149 check the route tree before placing a connection — saved time:** the lobby and the race are siblings, so the
  race joins its session again with `JoinRace` rather than carrying the lobby's connection.
- **L155 wake on the whole seconds before the moment — held:** the lobby's online clock flips to 3, 2, 1 and Go on
  each `runFor(1000)`.
- **L160 no `toObservable` in a store — held; L5 read the initial chunk — saved time:** main stayed at 277,405 bytes.
- **L121 film rules first; L34 render every diagram — saved time:** nine diagrams re-rendered with exit status 0.

**What slowed it down**

- The race opened late showed 0:00 for half a second: the ticker waited for the next whole second (L162).
- The countdown's timer took over the page object's `getByRole('timer')`, and made the lobby inert just when a spec
  pressed "You're ready" again (L163).
- The `JoinRace` test's single 30-second advance skipped the bot fill at 0:10 (L164).

**New lessons:** L162, L163, L164.

### 15.1 Race lobby (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the bots specs failed on a missing route, the backend's lobby tests with
  no `FindRace`, and the online specs with the bots grid ("10 / 10") where six seats were expected.
- **L143 let the hub connect before pausing the clock; L153 `ServerTime` from the page; L154 pause short — held:** each
  spec waits for the grid's "6 / 10", then pauses, and the clock stands at 0:24 every time.
- **L155 wake on the whole seconds before the moment — held:** the online clock counts to the session's `startsAt`
  by the measured offset and flips from 0:24 to 0:23 on one `runFor(1000)`.
- **L157 run a frame after a push — saved time:** every `SeatsChanged` goes through a `change()` helper that sends and
  runs 100 ms; the bots lobby's I'm ready through `press()`. Leaving needed more (L161).
- **L148 one default per path pattern; L152 grep every flow that meets the change — saved time:** the queue request
  defaults to unreachable, so the Race Setup specs at level 7 kept their "can't be reached" line untouched.
- **L149 check the route tree before placing a connection — saved time:** Race Setup and the lobby are siblings, so
  the lobby asks for the seat and Race Setup reads the queue over HTTP.
- **L5 read the initial chunk — missed at first:** `toObservable` added 0.9 kB to main (L160); main is back at
  277.40 kB, 9 bytes over for one more shared export.
- **L121 film rules first; L34 render every diagram — saved time:** fifteen diagrams re-rendered with exit status 0.

**What slowed it down**

- The lobby page drew blank while the clock was paused before it loaded, and the leave spec's Race Setup never
  arrived under the paused clock (L157, L161).
- Main grew 0.9 kB from one `toObservable`, and a minified diff of the two builds showed only renames (L160).
- A Python replace inside a helper made it call itself; the edit scripts now count each match.

**New lessons:** L160, L161.

### 14.5 Live group board (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the board specs failed with no board and no reports, the backend's
  standings tests with no `StandingsUpdated`, and the pace table's rows before the C# port existed.
- **L143 let the hub connect before pausing the clock; L153 `ServerTime` from the page; L154 pause short and run the
  last second — held:** the ride stood at exactly 7:00 in every spec and shot.
- **L147 compare the first shots with the mock — saved time:** the board's column, rows and own row matched at every
  width on the first record.
- **L152 grep every flow that meets the change — held:** reports go by `send`, so no spec through the ride met an
  unanswered invocation.
- **L5 read the initial chunk — saved time:** main stayed at 277.40 kB; the board ships in the class ride's chunk.
- **L121 film rules first; L34 render every diagram — saved time:** seven diagrams re-rendered with exit status 0.

**What slowed it down**

- The board drew in a debug run with the clock running but not in the spec, whose clock was paused: zoneless change
  detection never ran after the hub's push (L157).
- Porting the seeded pace model to C# bit for bit took a shared table of exact values to trust (L158).
- The film's reorder put the rider third, not second: the data tied the rider with a bot at 69 kJ (L159).

**New lessons:** L157, L158, L159.

### 14.4 Start together (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the three start specs failed with the header reading "Solo" and no
  countdown, the `RideClock` unit spec on a compile error, and the warm-up panel's check before its fix.
- **L143 let the hub connect before pausing the clock — missed at first:** the spec paused the clock before the seat
  arrived and the join never settled; it now waits for the wait or a started clock first (L154).
- **L147 compare the first shots with the mock — saved time:** the contact sheet showed the waiting ride without its
  bike panel, which the mock draws (L156).
- **L152 grep every flow that meets the change — saved time:** the seated specs moved to the page's clock, and
  ride-hub's seat moved ten minutes ahead, in the same change.
- **L5 read the initial chunk — saved time:** main stayed at 277.40 kB.
- **L121 film rules first; L34 render every diagram — saved time:** four diagrams re-rendered with exit status 0.

**What slowed it down**

- The fake hub answered `ServerTime` from Node's real clock, a day ahead of the page's, so every seated ride started
  at once (L153).
- Exact times under a paused clock: the jump skipped the second timers, and the offset's few milliseconds tipped a
  whole second (L154).
- The countdown first rode the free-running ticker and read a second high (L155).

**New lessons:** L153, L154, L155, L156.

### 14.3 Join a group session (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time, with one miss:** the hub tests failed on "Method does not exist", the rule
  tests on stubs (11), the join spec's four on no `JoinClassSession` call, and the unit specs on stubs; the
  `class_locked` e2e test was written after its code and never seen failing.
- **L137, L148 answer by default — saved time:** no default was needed for the join, since only group rides make it,
  and the specs that open one answer it (L152).
- **L143 let the hub connect before pausing the clock — saved time:** the film's ride shots wait for the seat before
  `pauseAt`.
- **L146 step polling clocks; L147 compare the first XL shot with the mock — saved time:** nothing polled here, and the
  first contact sheet matched the mocks.
- **L5 read the initial chunk — saved time:** main stayed at 277.40 kB.
- **L121 film rules first; L34 render every diagram — saved time:** four diagrams re-rendered with exit status 0.

**What slowed it down**

- Deciding where the join happens: Class Start and the class ride are sibling routes, so the connection could not be
  shared (L149).
- SignalR hides a server exception's message, so refusals became answers with a code (L150).
- The 14.1 hub specs and Class Start's Join spec met an unanswered `JoinClassSession` (L152).
- The analysers (CA1822) rejected stubs that touched no instance data; the stub needed a field.

**New lessons:** L149, L150, L151, L152.

### 14.2 Group session schedule (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's acceptance tests failed on a stub (11 as expected), Class
  Start's four specs on "Group sessions can’t be reached right now.", the library's two on a missing chip, and
  `groupSessionView()`'s and `groupChip()`'s unit specs on stubs.
- **L137 answer new fields by default — saved time, once widened:** a default for HIIT's sessions alone left
  `class-tiers.spec.ts` with an unanswered request for another class; a default for the path pattern fixed it (L148).
- **L5 read the initial chunk; L142 compare stats; L145 path-limited stash — saved time:** main grew 14 bytes; the
  stats showed identical inputs and two more export names to the lazy Class Start chunk, so nothing had to move.
- **L121 film rules first; L34 render every diagram — saved time:** five diagrams re-rendered with exit status 0.

**What slowed it down**

- The polling spec counted reads after `runFor(60_000)` and failed one run in five: the skipped tick's read was
  cancelled (L146).
- The film's first XL shot showed the roster pushed to the foot of the ride choice, under a wide gap (L147).
- `class-tiers.spec.ts` met an unanswered sessions request for another class (L148).

**New lessons:** L146, L147, L148.

### 14.1 Connect to the ride hub (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the hub's `ServerTime` test failed on "Method does not exist", the two
  group-ride specs on no `ServerTime` call, and the retry policy's, offset's and store's unit specs on stubs.
- **L5 read the initial chunk — saved time:** it caught SignalR's `require` shim adding 0.73 kB to main (L142).
- **L135 page-scoped services — saved time:** the hub client is bound on the class ride's route and
  `LiveSessionStore` on its page, so neither reaches main and the store goes with the ride.
- **L97 take old strings after a format — no effect:** every edit script this slice matched files read after their
  last format.
- **L121 film rules first; L34 render every diagram — saved time:** three diagrams re-rendered with exit status 0.

**What slowed it down**

- Main grew by 0.73 kB with identical inputs; finding the esbuild `require` shim took a stats comparison (L142), and
  the first attempt at building the old version never stashed (L145).
- The film's shots waited for `ServerTime` on a paused clock, where SignalR does not finish connecting (L143).
- The store's reconnect test first polled with `vi.waitFor` (L144).

**New lessons:** L142, L143, L144, L145.

### 13.3 Show the profile (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's two acceptance tests, then the headline spec (3 tests,
  with `streak.spec.ts`'s line) and the settings spec (2 tests) failed on the old Profile, and the line's, the XP
  bar name's and the bike row's unit specs on stubs.
- **L137 answer new fields by default — saved time:** `rideCount` and `distanceKm` went into the shared fixtures'
  progress, so no spec that passes through Profile or the header failed for them.
- **L135 page-scoped services; L5 read the initial chunk — saved time:** Profile injects only tokens the app already
  binds, and main stayed at 277.38 kB.
- **L97 take old strings after a format — made it worse once:** an edit script matched the `bikeRow` stub as written,
  but prettier had reflowed it; the assert stopped it before it wrote anything, and the file was rewritten whole.
- **L121 film rules first; L34 render every diagram — saved time:** two diagrams re-rendered with exit status 0.

**What slowed it down**

- The settings spec waited on Profile to connect the remembered bike, which only Home does (L140).
- The design's `settingRows()`, `SettingKind` and `choose(kind)` did not fit rows that are links and buttons; only the
  bike row varies (L141).
- The settings scene's close-up first cut off the third row; the crop was widened after rendering the frame.

**New lessons:** L140, L141.

### 13.2 Home next ride (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's five acceptance tests and seven rule rows, then each of the
  four Home specs (15 tests) failed on an empty Home before its step, and each helper's unit spec on a stub.
- **L5 read the initial chunk — saved time:** it caught the 0.26 kB a Home routes file added to main (L135).
- **L127 await fixture calls; L128 the richest mock's fixtures — saved time:** the mid rider, veteran and the new
  `docklandsUnseenProgress`, `levelGoalProgress` and `allOpenProgress` carry the mocks' maps, stars and bests.
- **L129 scroll a row into the picture — did not apply:** `detail()` scrolls each door into view itself.
- **L121 film rules first; L34 render every diagram — saved time:** five diagrams re-rendered with exit status 0.

**What slowed it down**

- Home reads two catalogues, so every spec that passes through Home needed `/api/maps` and `/api/classes` answered
  (L137).
- The e2e clock and the browser disagreed on the time zone (L136), and two spans lost the space between them (L138).
- The card first parsed "Reach rider level 10" for its number; the catalogue now serves `unlockLevel` (L139).
- The design's single `HomeView` became one signal per part, each from its own helper; the design and its class
  diagram were redrawn at the end, once the shape was settled.

**New lessons:** L135, L136, L137, L138, L139.

### 13.1 App header (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the two Full screen specs failed on a missing button, and three of
  `BrowserFullscreen`'s five unit cases on a stub. The refusal and teardown cases, the no-API spec and the phone layout
  (built by earlier slices) passed from the start and guard what follows.
- **L127 await fixture calls — saved time:** `await bluetooth.remember(...)` in the spec's `beforeEach`.
- **L128 the richest mock's fixtures — saved time:** the film showed a header with no streak, and the Home mocks give
  the mid rider 4 days and the veteran 21; the fixtures now carry both.
- **L121 film rules first; L34 render every diagram — saved time:** eight diagrams re-rendered with exit status 0.

**What slowed it down**

- Full screen belongs to slice 24.2 by its design and to 13.1 by its goal; 13.1 puts it in the app header, and 24.2
  carries it to the other page headers.
- An output named `toggle` (L132), a test DOM without the Fullscreen API (L133), and no mock of the in-full-screen state
  (L134).
- Home's body is still empty (slice 13.2), so the widths scene grows Map Select.

**New lessons:** L132, L133, L134.

### 12.2 Open class tiers (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's 20 new failures (18 levels that are not tiers, the listing
  and the 404) and the two specs' (a level-5 card still a button) were seen before the code.
- **L128 the richest mock's fixtures — saved time:** 12.1's mid rider and veteran showed the tiers opening at levels 7
  and 18 with no new fixture.
- **L129 scroll a row into the picture — saved time:** the film's shelves are scrolled into view by their title.
- **L121 film rules first; L34 render every diagram — saved time:** five diagrams re-rendered with exit status 0.

**What slowed it down**

- The design had the backend mark each class open for the rider (`isOpen`, a `ClassDefinitionValidator`); the code
  keeps the catalogue the same for every rider so it can stay on the device, and opens a class against the backend's
  level. The design was brought in line before the tests.

**New lessons:** L130, L131.

### 12.1 Earn stars and unlock maps (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L41 spec each step first — saved time:** the backend's 11 new tests failed on an empty answer and a stub rule, the
  three specs on the stand-in's maps (one, after L127, on landing on Map Select), and `formatBest`'s six cases on a stub.
- **L125 compare main's size — saved time:** `shareReplay` grew main by 1.56 kB; a cached promise shares the one
  request at no cost.
- **L126 the guard, not the href — saved time:** 11.3's open question is closed by this slice's spec clicking through
  the unlock card to Race Setup.
- **L121 film rules first — saved time.**
- **L34 render every diagram — saved time:** four diagrams re-rendered with exit status 0.

**What slowed it down**

- The design named types the code never had (`UnlockGoal` subtypes, a `NextUnlock` value object, `Award`); it was
  brought in line with slices 11.2 and 11.3 first.
- Adding the maps to the header's `ProgressDto` broke unit specs that build it; the client reads
  `ProgressDto & MapProgressDto` instead.
- An unawaited fixture call (L127), a best-time format the stand-in hid (L128) and a film shot that would not scroll
  (L129).

**New lessons:** L127, L128, L129.

### 11.3 Celebrate an unlock (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** verify passed first time.
- **L41 spec each step first — saved time:** the 13 rule rows and two acceptance tests failed on a stub rule, the two
  card specs on a missing card and the three helper cases on compiling, before the code.
- **L121 check the film rules first — saved time:** the widths scene and XS, M, L and XL shots were planned from the
  start.
- **L122 restate, don't delete — saved time:** the two tests comparing the whole view now expect `unlock: null`.
- **L54 and L5 read "Initial total" — saved time:** it caught `rxResource` growing main by 6.75 kB (L125).
- **L34 render every diagram — saved time:** the three changed diagrams rendered with exit status 0.
- **L115 assert before writing — saved time:** a blank line in the design stopped one script, which wrote nothing.

**What slowed it down**

- Reading the catalogue with `rxResource`, then `toObservable`, grew the main chunk; an `effect` kept it at 277.36 kB
  (L125).
- The link to Race Setup bounced to Map Select through the guard's stand-in progress; the spec asserts the link, and the
  gap is in the design's open questions until 12.1 (L126).
- The film's entrance frames came out finished three times before the recorder's reduced motion was found (L124).

**New lessons:** L124, L125, L126.

### 11.2 XP, stars and personal best (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** each verify ran clean but for one type
  error (L123).
- **L41 spec each step first — saved time:** the backend's 15 new tests failed on a missing `stars` and on stubs, the
  seven Results specs on missing panels, and the outbox's seven unit tests on a stub, before the code.
- **L110 check the plan against the requirement — saved time:** stars are computed in slice 12.1's design; the slice
  built that design's `MapProgress` and `StarRules` and left the unlocks to 12.1, instead of faking stars.
- **L119 a test written after its code — saved time:** putting the old `resultsView()` back showed the new cases fail
  (on compiling, the signature having changed).
- **L120 step a paused clock — saved time:** the critical spec's answer, released after Results opened on the race's
  paused clock, rendered once the clock was stepped.
- **L115 assert before writing — saved time:** two edit scripts stopped on text Prettier had wrapped and wrote nothing.
- **L116 absolute paths — made it worse once:** a relative `cd ../..` from `domain/src/storage` missed `public-api.ts`.
- **L114 measure a crop in CSS pixels — partly:** the first panel crops started on the panel's edge and cut its text;
  12 px of margin fixed them.
- **L54 and L5 read "Initial total" — saved time:** it stayed 300.17 kB; Results grew to a 7.6 kB lazy chunk.

**What slowed it down**

- 11.1's film had dropped the four widths the film rules ask for, found while reading this prompt; it was redone first
  (L121).
- The ride-claims test asserted the answer had no `stars`; it now asserts the backend's own stars (L122).
- In a short earned column the actions touched the stars panel; the design system and the page now keep 32 px.

**New lessons:** L121, L122, L123.

### 11.1 Results screen (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L41 spec each step first — saved time:** the five Results specs failed on a missing lead and an unbuilt redirect,
  and `resultsView()` and `finalStandings()` on stubs, before the code.
- **L101 check the unit count — saved time:** it rose from 1311 to 1318.
- **L110 check the plan against the requirement — saved time:** the plan's "time, power and distance summary" is
  L2-073, L2-078 and L2-079: place, standings, a class's kJ and share on target, and the actions; the design was aligned
  to those, with the outbox, personal best and group class left to their slices.
- **L111 a test green before the code is suspect — saved time:** it caught the preselection test, written after the
  store change, and led to L119.
- **L114 measure a crop in CSS pixels — saved time:** the result, top-three and actions crops were right first time.
- **L115 assert before writing; L116 absolute paths — saved time:** a progress script stopped on an ambiguous row and
  wrote nothing; every command used absolute paths.
- **L54 and L5 read "Initial total" — saved time:** it stayed 300.17 kB; Results is a 6.5 kB lazy chunk.

**What slowed it down**

- Three older specs waited for Page not found at `/results` and had to move to the Results page object (L118).
- The Race Setup check after "Race it again" ran on the paused clock before the page loaded, and named a pack "Medium"
  where the radio says "medium" (L120).
- The first film data left the pacers behind the rider unshifted, so one shared the rider's time; the mocks' times
  replaced it.

**New lessons:** L118, L119, L120.

### 10.4 Keep a streak (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L9 backend fixtures — saved time:** `StreakTests` reused `SignInApi` and moved its `FakeTimeProvider` across
  midnight instead of sleeping.
- **L41 spec each step first — saved time:** 23 backend tests failed on missing streak lines and stubs, the streak spec
  on a missing flame and meta line, and `profileMeta` on a stub, before the code.
- **L101 check the unit count — saved time:** it rose from 1307 to 1311.
- **L103 stage writes, then write — made it worse once:** a script that rewrote the mocks wrote its first files before
  an assertion failed, and the commit on the next line took them alone (L115).
- **L110 check the plan against the requirement — saved time:** 10.4's "shown on Home, Profile and results" matched
  L2-042 AC4; Results waits for journey 11.
- **L111 a test green before the code is suspect — saved time:** every new streak test failed first, for the reason
  named.
- **L112 a new default can silence an example — did not apply:** the progress answer already existed; only the mid
  rider's fixture gained its 4-day streak.
- **L114 measure a crop on the shot's scale — saved time:** both crops were right first time from CSS pixels.
- **L54 and L5 read "Initial total" — saved time:** it stayed 300.17 kB.

**What slowed it down**

- The streak, 0 until this slice, made every first ride earn "1-day streak" +10, so 10.2's and 10.3's expected totals
  moved; they changed in the same commit as the rule.
- A `cd ../..` from a component folder landed one level short and the edit script found no files (L116).
- The analysers refused a stub (CA1822) and culture-sensitive parsing in a test (CA1305) (L117).

**New lessons**

- **L115 Chain the commit to the edit script, and write nothing before the last assertion.**
- **L116 Use absolute paths in a compound command.**
- **L117 Test code answers to the analysers too.**

### 10.3 Rider levels (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the backend and the level spec ran
  first time.
- **L9 backend fixtures — saved time:** `ProgressTests` reused `SignInApi` and set a rider's XP through
  `IAppDbContext`.
- **L34 render every diagram — saved time:** the three header diagrams the contract rename touched rendered with exit 0.
- **L41 spec each step first — saved time:** the progress tests failed on 404 and the header spec on a missing link
  before the code; `toLevelView` and the store failed on stubs.
- **L101 check the unit count — saved time:** it rose from 1300 to 1307.
- **L103 stage writes, then write — saved time:** no script wrote half its edits.
- **L110 check the plan against the requirement — saved time:** 10.3's line matched L2-038 and L2-032, but the
  requirement left 27 thresholds open, which I settled within the mocks' riders and recorded as provisional.
- **L54 and L5 read "Initial total" — saved time:** it rose 0.05 kB, the store and its tokens on the lazy route.
- **L7 contact sheet before the encode — saved time:** it caught a Profile crop on Settings, twice (L114).

**What slowed it down**

- The "no level link" spec passed before the code, because a plain object answer is a 200 body (L111).
- Answering `GET /api/progress` by default turned the harness spec's "unanswered request" example green (L112).
- angular-eslint refused the empty level `<a>`; its name moved from the component's host to the app's template (L113).

**New lessons**

- **L111 A test green before the code is suspect.**
- **L112 A new default answer can silence a harness example.**
- **L113 Name an empty link where the template writes it.**
- **L114 Measure a crop on the shot's own scale.**

### 10.2 Earn XP (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L9 backend fixtures — saved time:** `XpTests` reused `SignInApi`, and the ride bodies moved into `RideBodies` for
  both ride test classes.
- **L41 spec each step first — saved time:** the XP tests failed on an answer with no lines, and the share spec on a
  ride with no share, before the code.
- **L108 assert the exact keys — saved time:** the spec listing a ride's keys failed until `onTargetShare` joined it,
  which proved the new fact is sent and nothing else.
- **L101 check the unit count — saved time:** it rose from 1298 to 1300, the recorder's two new tests.
- **L103 stage writes, then write — saved time:** two edit scripts stopped on an old string that did not match, and
  wrote nothing.
- **L97 old text after Prettier — made it worse once:** the class store's call had been wrapped by Prettier since I
  wrote it; the script stopped (L103) and I took the text from the file.
- **L54 and L5 read "Initial total" — saved time:** it stayed 300.12 kB.
- **L7 contact sheet before the encode — saved time:** it found a crop of the resistance card where power was meant,
  and a headline that broke mid-number.
- **L105, L106, L107 — did not apply:** no new fault path or type name.

**What slowed it down**

- The plan's line for 10.2 said XP comes from output and time, which L2-037 does not say (L110).
- The migration gave existing rides an empty string for their XP lines, which does not read as JSON (L109).

**New lessons**

- **L109 Give a new JSON column a default that reads back.**
- **L110 Check a slice's line in the plan against its requirement.**

### 10.1 Record a ride (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L9 backend fixtures — saved time:** `RideTests` reused `SignInApi`; `ConcurrentRideApi` added only the database it
  needed on top of it.
- **L41 spec each step first — saved time:** the backend tests failed with 404, the specs on no ride sent, and the
  recorder spec on a missing module, each before the code; the concurrency test was also seen failing with its catch
  turned off (L105, L106).
- **L96 a fixture default — saved time:** the shared fixture now records every finished ride, so no existing spec that
  finishes a race or class had to answer `POST /api/rides`.
- **L101 check the unit count — saved time:** it rose from 1291 to 1298, the recorder's seven tests.
- **L103 stage writes, then write — saved time:** every edit script asserted all its old strings before writing.
- **L97 old text after Prettier; L100 fix only the slice's files — saved time:** nothing outside the slice changed.
- **L54 and L5 read "Initial total" — saved time:** the client and the recorder load with the race and the class, and
  the initial total stayed 300.12 kB.
- **L7 contact sheet before the encode — saved time:** the shots and the scenes needed no second take.
- **L25, L98, L99, L102, L104 — did not apply:** no budget, form, hosted service or dialog changed.

**What slowed it down**

- The concurrency test passed with the catch turned off, twice for different reasons: EF Core InMemory does not raise
  SQL Server's `DbUpdateException` for a duplicate key (L105), and `Environment.TickCount < 0`, meant as always false,
  is true after 25 days of uptime (L106).
- An entity named `Ride` does not compile in `Telo.Ride.*`: the name finds the namespace first (L107).
- A spec's pattern for XP keys matched `maxPowerWatts` (L108).

**New lessons**

- **L105 Inject the database's own fault through `IAppDbContext`; EF Core InMemory does not raise it.**
- **L106 To see a test fail without a branch, guard it with a condition that is always false.**
- **L107 Do not name a backend type `Ride`.**
- **L108 Assert the exact keys a body carries, not a pattern over them.**

### 9.4 Sign out and delete account (2026-11-22)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L9 backend fixtures — saved time:** `AccountTests` reused `SignInApi` and its mailbox, and replayed a device's
  session cookie by hand to prove the backend refuses it after sign-out, not only that the browser dropped it.
- **L94 the shared clock — saved time, and led to L102:** the daily erasure service ticks on the clock every test
  advances, so it runs only in its own test host.
- **L41 spec each step first — saved time:** the backend tests failed with 404 and the six specs on missing rows,
  each before the code.
- **L96 a fixture default — saved time:** the shared fixture's signed-in rider opened Profile with no setup.
- **L97 old text after Prettier — saved time:** every edit took its old text from the files as they were.
- **L100 fix only the slice's files — saved time:** only Prettier ran over the tree; nothing outside the slice changed.
- **L54 and L5 read "Initial total" — saved time:** the account's store and sign-in's client went into a lazy
  `profile.routes.ts`, and the initial total fell from 300.31 kB to 300.12 kB.
- **L7 contact sheet before the encode — saved time:** it found a hover colour left on a clicked row, a close-up that
  cut off the message it was about, and a five-line headline.
- **L25 all-or-nothing edits — made it worse once:** a mock script ran `open(f, 'w').write(add_rows(f))`, which
  empties the file before `add_rows` reads it; the assert failed on the empty text and the file was restored from
  git (L103).
- **L98, L99 — did not apply:** the budget held, and the delete form takes no refusal.

**What slowed it down**

- The new store spec did not raise the unit count: `ng test ride` had never run the app's own specs (L101).
- The design's open points (the message, the case of "delete", the erasure schedule, an anti-forgery header, the
  outbox) each needed a decision before the mocks could be drawn.

**New lessons**

- **L101 After adding a unit spec, check the unit count rose by its tests.**
- **L102 Run a hosted service that ticks on the shared clock only in a test host of its own.**
- **L103 Stage a script's writes in memory and write them all at the end.**
- **L104 Close a CDK Dialog yourself before a router navigation.**

### 9.3 Choose a display name (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time.**
- **L9 backend fixtures — saved time:** `DisplayNameTests` reused `SignInApi`, signing in through the code and its
  fake mailbox, so each test held a real session cookie.
- **L41 spec each step first — saved time:** the backend tests failed with 404 and the nine specs on a missing
  screen or field, each before the code.
- **L96 a fixture default for a guard — saved time:** the shared fixture's rider already had a name, so the new
  check in the guard left all 137 earlier specs green; only 9.2's spec, which answered a new account, needed one.
- **L54 and L5 read "Initial total" — saved time, after a detour:** the build failed the 300 kB error budget and
  then wrote no stats.
- **L25 all-or-nothing edits — saved time twice:** a design edit keyed on the wrong text, and a script with a stray
  line, both stopped before writing anything.
- **L97 old text after Prettier — saved time:** every edit after the first format took its old text from the files.
- **L7 contact sheet before the encode — saved time:** it found the backend terminal drawing `<b>Sam</b>` as bold.
  It also led to a needless probe of a dialog that was in fact centred.
- **Every other lesson — did not apply:** no world, no race clock.

**What slowed it down**

- The CDK Dialog moved 7.7 kB of Angular's core and RxJS into the shared initial chunk. Over the error budget the
  build writes no stats, so finding it took a throwaway budget and two builds to compare.
- The form first checked the rule itself with `isDisplayName` from `api`; lint allows `components` types only, so
  the check moved to the store, and the form learned of refusals through a count.
- `eslint --fix` over `e2e/` rewrote a fixture the slice never touched, and it reached the commit.

**New lessons**

- **L98 When the build fails its bundle budget, raise the error for one throwaway build and diff `main`'s inputs.**
- **L99 Pass a refusal to a presentation component as a count, and keep the rule in the store.**
- **L100 Run `eslint --fix` on the files the slice changed, not on a whole folder.**

### 9.2 Verify and stay signed in (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L3 format first — saved time:** the first full verify passed.
- **L9 backend fixtures — saved time:** `SessionTests` reused `SignInApi` and its fake mailbox, and drove a real
  cookie through an HTTPS client with `HandleCookies`, so the session's 365 days were proved by moving the
  `FakeTimeProvider`, never by waiting.
- **L94 move the shared clock past a window — saved time:** each session test starts by moving the clock past the
  hour, so the 9.1 limits never refused a code another test had asked for.
- **L41 spec each step first — saved time:** the backend tests failed with 401 and the nine specs with the wrong URL
  or a missing field, each before the code.
- **L54 and L5 read "Initial total" — saved time:** the build's warning showed the guard had brought `HttpClient`
  into the initial chunk (288.47 kB to 292.60 kB); the budget rose to 296 kB with its reason in the design.
- **L25 all-or-nothing edits — made it worse twice:** two edit scripts asserted file by file rather than across
  files, so files earlier in the script were written before a later assert failed.
- **L7 contact sheet before the encode — saved time:** it found the guard scene's headline touching a browser and
  its URL line wrapping.
- **Every other lesson — did not apply:** no world, no race clock, no new dependency.

**What slowed it down**

- Edit scripts keyed on text as it was before Prettier rewrapped it (a providers array split over lines, a long
  import list) missed, twice.
- A guard on every screen could have broken every existing spec; giving the shared fixture a signed-in default kept
  all 128 green unchanged.

**New lessons**

- **L96 Gate every screen behind a default the shared fixture answers.**
- **L97 Take an edit's old text from the file after Prettier, not from memory.**

### 9.1 Request an email code (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status — saved time:** `dotnet format` fixed the one import order before
  the first verify, which passed at once.
- **L25 all-or-nothing edits — saved time, and made it worse once without it:** every asserted edit landed, but the
  one edit that replaced a computed span (from a bullet to the next blank line) took the following bullet with it
  and had to be put back.
- **L34 render every diagram — saved time:** the class and send-code diagrams re-rendered with exit 0.
- **L41 spec each step first — saved time:** the backend tests failed with 401 (no endpoint, so the fallback policy
  refused) and the seven sign-in specs with Page not found, each before the code.
- **L36 draft during the encode — saved time:** the film's README, the transcript and this entry were written while
  the film encoded.
- **Every other lesson — did not apply:** no world, no race clock, no new npm dependency.

**What slowed it down**

- The per-address limit test sent `Busy@EXAMPLE.com` to prove normalisation, but only the domain is lower-cased
  (L2-001 AC6), so it was another address and the sixth code was accepted.
- One backend fixture serves every test in its class, in any order, with one clock: a window counted from stored
  rows (the 20 codes per network) carried from one test into the next until each test moved the clock past the hour.
- Python refuses a backslash inside an f-string expression, so the first mock generator failed before writing.

**New lessons**

- **L94 Move a shared fixture's clock past a counted window at the start of each test.**
- **L95 Test a normalisation rule with the exact words of its requirement.**

### 8.7 Real-world scenery (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L34 render every diagram — saved time.**
- **L41 spec each step first — saved time:** the catalogue test, the panel spec, the three streaming specs and the
  CSP test each failed for the expected reason before the code.
- **L84 `toPass` has no timeout — made it worse once:** the three failing-first streaming specs ran 1.5 minutes
  each to the test timeout; a `--timeout 120000` run bounded them.
- **L88 count a world spec's frames; L89 keep the bar's width — saved time:** every scenery spec pins Low at the
  default viewport, 3 to 36 seconds each.
- **L91 step the clock around pictures — saved time:** every shot wrapped its pictures in `still()` and one size was
  recorded with `-g` first, which caught a fixture-destructuring error in seconds.
- **L36 draft during the recording; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Reverting `package.json` to commit the docs first let the next verify's install drop `3d-tiles-renderer`, so
  the package was installed twice (L92).
- A field typed into while the race's clock is paused does not re-render until the clock steps, so the first panel
  spec failed on a disabled button that was in fact enabled.
- The library's own names fought the repo's lint twice: an output named `stream` is a native DOM event to
  angular-eslint, and an inline `import()` type is forbidden, where a top-level `import type` keeps the chunk lazy.

**New lessons**

- **L92 Commit a new dependency with the code that first imports it, never revert its install mid-slice.**
- **L93 After typing in a race spec, step the clock before reading the page.**

### 8.6 Panorama and hidden tab (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L59 absolute `cd` — saved time.**
- **L34 render every diagram — saved time:** the sequence re-rendered with exit 0.
- **L41 spec each step first — saved time, and found a bug in `main`:** the hidden-tab spec failed with 5 frames
  drawn in 5 hidden seconds, one per tick of the race clock, though `main`'s scheduler stops its loop.
- **L88 count a world spec's frames — saved time:** the hidden-tab specs pin Low and ride seconds, not minutes;
  they take 12 and 24 seconds.
- **L89 wait on the tag the bar shows — saved time:** the specs keep the default 1280 px viewport.
- **L36 draft during the recording; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Half the slice (the panorama, L2-065 AC2) had been proven since 8.1, and the other half was a three-line fix
  once the spec named it.
- The film's four panorama shots hung for two minutes each: `pictures()` and `shot()` wait on the page, and the
  race fixture's clock is paused, so they need `still()` stepping it even where no world draws (L91).

**New lessons**

- **L90 Count the frames a hidden tab draws, not only its loop.**
- **L91 Step the paused clock around every picture in a race shot.**

### 8.5 Step down when frames drop (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L59 absolute `cd` — saved time.**
- **L25 all-or-nothing edits — saved time:** the design, its three diagrams and L2-159 changed in one asserted
  script.
- **L34 render every diagram — saved time:** three diagrams re-rendered with exit 0, and the sequence was read.
- **L75 `fastForward` fires each timer once — saved time, turned to use:** each `fastForward(ms)` fires the next
  animation frame once, `ms` after the last, which is exactly a slow frame.
- **L70 port `main`'s spec — saved time:** `main`'s FrameBudget cases (periods and medians) already held the rule's
  table, so the behaviour specs need only one path each.
- **L87 read `main`'s amended criteria — saved time:** `main`'s L2-111 AC4 named the straight drop to Low (#896)
  that the Telo requirement lacked.
- **L41 spec each step first — saved time:** both specs failed while the hook pinned the level.
- **L80 draw only where needed — made it worse once:** a spec drawing about 400 frames at High in software passed
  alone with a long timeout and timed out under the verify run's 90 seconds (L88).
- **L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- The first spec drew High for two windows and the levels below for two more: two minutes alone, past the default
  timeout in the full run. Opening the one-level case at Medium, keeping High only for the straight drop, and
  shortening the fast stretch to one window fit it (L88).
- A smaller viewport to cheapen the frames hid the bar's GPU tag the spec waits on, and the wait never ended (L89).

**New lessons**

- **L88 Count a world spec's frames before its timeout.**
- **L89 Never shrink a world spec's viewport below the race bar's full width.**

### 8.4 Quality levels (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L59 absolute `cd` — saved time.**
- **L25 all-or-nothing edits — saved time:** the requirement, design and mock edits each asserted their old text;
  the twenty mocks were edited by counting what each replaced.
- **L34 render every diagram a slice touches — saved time:** the one sequence diagram re-rendered with exit 0.
- **L70 port `main`'s spec with the module — saved time:** `main`'s render-quality spec already proves the table,
  the WebGL 2 cap and the opening level.
- **L80 draw only where needed, at the pinned tier — saved time:** each level's spec takes 13 to 39 seconds.
- **L84 bound the red run — saved time:** every run used `--timeout 180000`.
- **L41 spec each step first — did not apply as written:** the levels came with the renderer in 8.2, so the spec
  passed at once; breaking the cap on purpose turned it red (L86).
- **L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Finding that Telo Ride's requirement disagreed with `main`: `main` opens World Ride at Low and never raises the
  level, while L2-159 said Auto starts at Ultra or High. The rule that `main` wins on rendering settled it, and the
  text spread over L2-152, L2-159, two designs, a diagram and fourteen mocks.

**New lessons**

- **L86 When a copied slice already holds a behaviour, prove its spec with a mutation.**
- **L87 Read `main`'s amended criteria before a world slice.**

### 8.3 Draw riders and ghost (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L59 absolute `cd` — saved time.**
- **L25 all-or-nothing edits — saved time:** each scripted edit asserted its old text once; one `cd` into the wrong
  folder stopped the type-check, not an edit.
- **L70 port `main`'s spec with the module — saved time:** `main`'s probe spec pinned the report's whole shape and
  named the new `riders` field at once.
- **L71 share a type through `api` — saved time:** `SceneRider` joined `api`, so the race store, the directive and
  the scene name one type.
- **L80 draw the world only where needed, at low — saved time:** both rider specs pin low and ride one second, about
  25 seconds each.
- **L82 serve a locked map in an open place — saved time:** the film rode Neon Docklands on the first try.
- **L78, L79 step at once and wait on the tag — saved time.**
- **L41 spec each step first — saved time, with a cost:** both specs failed for no riders drawn, but `toPass` has
  no timeout of its own, so each ran to the test's timeout, six minutes (L84).
- **L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Finding where a rider added after the scene starts gets its look: `main` swaps in toon twins, warm ink and the
  road's bend only when a tier is applied, over the whole scene (L83).
- The first, failing run of the rider specs took twelve minutes (L84).
- The film's first shots showed four of `main`'s pacers riding a race: the start's rehearsal frame, which has no
  riders, placed them, and the race's frames never hid them. The specs had checked only the riders that should be
  drawn; a check that none of the pacers are drawn was seen failing, then the fix, and the shots were taken again
  (L85).

**New lessons**

- **L83 Dress what joins `main`'s scene late as the tier dresses the scene.**
- **L84 Bound `toPass` when a spec is run to see it fail.**
- **L85 Look at the first shot as a review, and spec what must not be drawn.**

### 8.2 Draw the route world (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L59 absolute `cd` — saved time.**
- **L25 all-or-nothing edits — saved time:** every scripted replacement asserted its old text first; two misses
  (a helper prettier had rewrapped) stopped the script before it wrote anything.
- **L70 port `main`'s spec with the module — saved time:** the road, kit, materials, pacers and worlds specs came
  with the 105 copied files and found the segment shape and the grade keys that differ from `main`.
- **L71 share a type through `api` — saved time:** `TimedSegment` and `WorldRidePacer` joined `api`, so the copied
  modules changed only an import.
- **L77 lazy library by dynamic import — saved time:** the whole scene joined the world chunk (2.68 MB) and the
  initial bundle moved 0.1 kB.
- **L78 step with `intervals: [0]`; L79 wait on what the start reports — saved time:** `stepUntil` moved into the
  race fixture and both new specs wait on the bar's tag.
- **L41 spec each step first — saved time:** with the copy stashed, moving failed (the 8.1 renderer drew nothing)
  and holding passed, as it must.
- **L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- The first run of the scene specs took 1.5 minutes each and timed out: the world drew every tier's techniques in
  software. Pinning `main`'s low tier through its probe fixture and riding one second brought them to 30 seconds
  (L80).
- The paused-race picture first differed though the world held: the screenshot took in the HUD over the canvas,
  whose numbers move on their own (L81).
- The film's locked maps never opened: a new rider's progress opens two, and the guard sent the race to Map Select
  (L82).

**New lessons**

- **L80 Draw the world only in the specs that need it, at its cheapest tier.**
- **L81 Hide what overlays a canvas before comparing pictures of it.**
- **L82 To film a locked map, serve it in an open map's place.**

### 8.1 Load the world library (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd` — saved time.**
- **L25 all-or-nothing edits — relearned:** a `sed` had already rewritten `@wattzup/api` to `@telo/api`, so the
  Python replacement keyed on the old import missed in silence and the build found it; an `assert old in s` before
  each replacement would have said so at once.
- **L70 port `main`'s spec with the module — saved time:** `main`'s specs for the frame period and scheduler, the
  render quality, the probe, the scene driver, the worlds and the canvas host came over first and pinned the copy.
- **L71 share a type through `api` — saved time:** the renderer contract, `World`, `WorldId` and `Backend` live in
  `api`, so `ride` names them without importing the world library.
- **L72 render hooks — saved time, and extended:** the copied host's `afterNextRender` put 2.5 kB into `main`, and
  `@defer` and creation bindings each about 6 kB more; the stats diff found each (L77).
- **L43 step the paused clock — relearned:** the world needs 31 frames to start, and `toPass`'s default backoff
  stepped about one a second, so the spec timed out; `intervals: [0]` steps at once (L78).
- **L41 spec each step first — saved time:** the tag and leaving failed first for the missing tag.
- **L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- The initial bundle grew 11.4 kB with the world loaded through `@defer`; bringing it to 3.6 kB took four builds and
  stats diffs (L77). The rest, signal view queries and untracked reads, raised the warning budget to 292 kB.
- The film's shots waited for the canvas to lose its busy modifier, which it never had before its first change
  detection, and photographed a world not yet started (L79).

**New lessons**

- **L77 Load a lazy library's component by dynamic import and `setInput`.**
- **L78 Step the paused clock with `toPass({ intervals: [0] })` when a start takes dozens of frames.**
- **L79 Wait on what a start reports, not on a modifier's absence.**

### 7.5 Finish, pause or leave a race (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd` — saved time.**
- **L25 all-or-nothing edits; L64 re-read after prettier — relearned:** one script wrote each edit as it matched, and
  when prettier's rewrapped `subscribe` failed the fifth, the first four were already on disk; reading the file and
  finishing with a collect-then-write script cost a round trip.
- **L38 drive a ride screen — saved time:** `startRace` took a `catalogue`, so the finish specs ride a 0.5 km Old
  Town Criterium.
- **L43 step the paused clock — saved time:** Race Setup and Page not found load lazily after Leave, End, the DNF's
  link and the finish; each spec steps the clock a frame at a time until they show.
- **L41 spec each step first — saved time:** Leave and End, Pause, the lost bike and the finish each failed first
  for the missing control, alert or navigation.
- **L69 prove a first-run pass — saved time:** the bar's 48 px check passed first and failed at 40 px under its
  mutation.
- **L67 whitespace between siblings — saved time:** the paused card's two lines read joined; the spec checks each
  line.
- **L71 share a type through `api` — saved time:** `RaceResult`, which the race hands Results (11.1), lives in `api`.
- **L72 render hooks; L5, L54 bundle — saved time:** nothing new reached `main` (284.50 kB).
- **L33 find the hosting slice; L35 check what was built; L52 honest stand-ins — saved time:** submission (10.1) and
  Results (11.1) wait for their slices, so the finish opens `/results` with the result in the navigation's state.
- **L4 attribute components; L57 store on the page; L26 the whole suite; L36 draft during the encode; L6, L7, L10,
  L32 film — saved time.**
- **L65 close-ups at 390 px — did not apply:** the bar's labels hide on a phone, so its close-ups were shot at 768 px.
- **Every other lesson — did not apply.**

**What slowed it down**

- ESLint refused `@angular/router` and outputs named `pause` and `resume` in `RaceBar`; the way out became the page's
  link on an attribute component (L74).
- The plan-runs-out spec fast-forwarded past 30:00 from the warm-up, so the cool-down's level was never sent (L75).
- The solo finish expected 1st; the ghost at 190 W crosses 0.5 km in 85 s, so the rider was 2nd (L76).

**New lessons**

- **L74 Let the page own a control's routing.**
- **L75 Fast-forward into a segment, then step across its boundary.**
- **L76 Work a spec's expected numbers from the fixture's data.**

### 7.4 Ghost and bots (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd`; L25 all-or-nothing edits; L64 re-read after prettier — saved time:** prettier had rewrapped the
  power panel's spans and the script's assert stopped it; re-read, the edit went in whole.
- **L38 drive a ride screen — saved time:** `startRace` took an `offline` option (the catalogue answered 503) and
  served the bots, ghost and offline specs unchanged otherwise.
- **L43 step the paused clock — saved time:** every spec stepped the clock in 4-second strides inside cadence's
  5-second timeout, and the film used 5.3's `still()` from the start.
- **L41 spec each step first — saved time:** the bots spec failed first for the missing board; the ghost, the slide
  and the offline race were built with it, so L69 proved them.
- **L69 prove a first-run pass — saved time:** four specs passed on their first run; each failed under its mutation
  (the solo rank always Ahead, the slide at 300 ms and under reduced motion, the board shown on a phone, no kept
  catalogue) and was restored.
- **L71 share a view type through `api` — saved time:** `GhostTrace` and `GHOST_API` live in `api`; `domain`'s
  `GhostReplay` and `NoBestRides` take them and `components` never sees them.
- **L33 find the hosting slice; L35 check what was built; L52 honest stand-ins — saved time:** no ride is recorded
  until 10.1 and no best's trace kept until 11.2, so `GHOST_API` is bound to `NoBestRides` and the ghost rides the
  medium pace, as L2-050 AC4 asks of a missing best.
- **L4 attribute components; L5, L54 bundle; L57 store on the page — saved time:** checking the initial total after
  the last step caught it at 288.66 kB, over its 288 kB warning (L72).
- **L26 the whole suite — saved time:** the power panel's "1st / 1" became the race's real "10th / 10", and the whole
  suite named the one spec to change.
- **L65 close-ups at 390 px; L36 draft during the encode; L6, L7, L10, L32 film — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- `afterRenderEffect` in the board, a lazy component, put 4.7 kB of Angular's render hooks into `main`; finding it
  took a baseline build of 7.3's sources, which first failed because the new files were still on disk (L72).
- The gap row's text, on its own line in the template, read " Ahead +1:25" with a leading space (L73).
- `[...].map(() => regex).concat('You')` does not type-check as `(string | RegExp)[]`; spread the two instead.

**New lessons**

- **L72 A render hook in lazy code grows the initial bundle.**
- **L73 Keep matched text on one template line.**

### 7.3 Ride a race (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd`; L25 all-or-nothing edits; L64 re-read after prettier — saved time:** one script's assert caught an
  anchor that was not there, and nothing was half written.
- **L38 drive a ride screen — saved time:** `startRace` is the class ride's fixture for a map: hold the catalogue,
  pause the clock, release it and wait for the warm-up's level.
- **L43 step the paused clock — relearned:** "connected" did not show after the bike's first notification, and the
  film's first shots timed out, both because the paused clock held the render; `runFor(100)` after a notification
  and 5.3's `still()` for the shots fixed them.
- **L41 spec each step first — saved time:** the top bar, the interval, the power panel, the route panel and the
  resistance panel each failed first for the expected reason; the layout, built with its panels, was proved by L69.
- **L33 find the hosting slice; L35 check what was built; L52 honest stand-ins — saved time:** the opponents and
  gaps (7.4), Leave, Pause and the finish (7.5), the world (journey 8) and the strap wait for their slices, and the
  design says so.
- **L4 attribute components; L5, L54 bundle; L57 store on the page — saved time:** the race is its own 6.15 kB
  chunk and the initial total did not move (284.48 kB).
- **L26 the whole suite — saved time:** the race route's guard broke two Race Setup specs that opened a route that
  did not exist yet; the whole suite caught them before the commit.
- **L65 close-ups at 390 px; L36 draft during the encode; L6, L7, L10, L32 film — saved time:** the route panel,
  hidden on a phone, was shot at 1440 px and widened in the film instead.
- **Every other lesson — did not apply.**

**What slowed it down**

- The paused clock held change detection and the screenshots' animation frames (L43).
- Two Race Setup specs went to the race's address before it existed; the new route's bike guard turned them away,
  so they now remember the bike and check the race opens.
- The race plan's cool-down at 68 rpm gave a 44 m profile; `main`'s own spec, copied with its code, showed the mock
  is drawn from 70 rpm (L70).

**New lessons**

- **L69 Prove a test that passes on its first run.**
- **L70 Copy `main`'s spec with its code.**
- **L71 Share a view type through `api`.**

### 7.2 Set up a race (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd` — saved time.**
- **L25 all-or-nothing edits; L64 re-read after prettier — saved time:** every edit script matched first time,
  because each file prettier had touched was read again before the script matched its lines.
- **L33 find the hosting slice; L35 check what was built; L52 honest stand-ins — saved time:** the lobby is 15.1
  and live races journey 15, so Bots opens the race at once and Riders online stays locked; the design's open
  questions say so.
- **L41 spec each step first — saved time:** the facts, the goal line, the guard, the modes, the arrow keys, the
  pack and both starts each failed first for the expected reason; the planner's table and `radioStep` failed on
  stubs.
- **L4 attribute components; L5, L54 bundle; L57 store on the page — saved time:** the store goes with the page,
  and the initial total moved 0.04 kB (284.48 kB).
- **L63 keep a projected accessible name tight — saved time:** the start button and the pack's options keep their
  label as their whole text.
- **L26 the whole suite — saved time:** all 72 behaviour specs ran green before the merge.
- **L65 close-ups at 390 px; L36 draft during the encode; L6, L7, L10, L32 film — saved time:** every close-up read
  on the first contact sheet.
- **Every other lesson — did not apply.**

**What slowed it down**

- A click on the aria-disabled Riders online timed out: Playwright waits for it to be enabled (L66).
- "14.2 km" read as "14.2km": Angular drops the whitespace between the number's and the unit's spans (L67).
- The lobby comes after the race in the slice order, so Bots' start had to be chosen and recorded (L68).

**New lessons**

- **L66 Force the click that proves a disabled control does nothing.**
- **L67 Bind the space between two spans a reader must hear apart.**
- **L68 Route to the screen that keeps the journey ridable.**

### 7.1 Browse maps (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script; L59
  absolute `cd` — saved time.**
- **L25 all-or-nothing edits — saved time:** prettier had rewrapped `provide-maps.ts`, the script's assert
  failed and nothing was half written (L64).
- **L33 find the hosting slice; L35 check what was built; L52 honest stand-ins — saved time:** no progress
  backend exists yet, so `NewRiderProgress` answers `maps()` until journey 10, and the design says so.
- **L41 spec each step first — saved time:** the list, the open rows, the next unlock, the locks, the aside, the
  unavailable state and the kept catalogue each failed first for the expected reason; the cache's unit specs
  failed on stubs.
- **L4 attribute components; L5, L54 bundle; L57 store on the page — saved time:** the row is `a[wz-map-row]` or
  `button[wz-map-row]`, the store goes with the page, and the initial total did not move (284.44 kB).
- **L26 the whole suite — saved time:** all 63 behaviour specs ran green before the merge.
- **L36 draft during the encode; L56 escaped tags in terminals; L6, L7, L10, L32 film — saved time:** the
  contact sheet showed the 1440 px row close-ups too thin to read, and they were re-shot at 390 px (L65).
- **Every other lesson — did not apply.**

**What slowed it down**

- `MapRow`'s `state` input collided with `RouterLink`'s `state` on the same `<a>` (TS2322); it became `status`
  (L62).
- The row's name had to be projected text for lint's `elements-content`, and prettier's whitespace around it
  joined the accessible name (L63).
- An edit script matched a line prettier had since wrapped (L64), and the row close-ups needed a second shoot
  (L65).

**New lessons**

- **L62 Name an input apart from the directives on its host.**
- **L63 Keep a projected accessible name tight.**
- **L64 Re-read after prettier.**
- **L65 Shoot a row's close-up at 390 px.**

### 6.3 Class start (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script — saved
  time.**
- **L25 all-or-nothing edits — saved time:** a script run from the wrong folder failed its first assert and
  wrote nothing (L59).
- **L33 find the hosting slice; L35 check what was built — saved time:** Full screen has its own slice (24.2,
  every page header at once), and the `VideoPlayer` contract only needed an `autoplay` option.
- **L41 spec each step first — saved time:** the facts, the plan, the parked video, the disclosure, the ride
  choice and the guard each failed first for the expected reason; `PlanSummary`'s table failed on a stub.
- **L5, L54 bundle; L42 core APIs; L57 store on the page — saved time:** the radio group finds its options from
  the host rather than with `viewChildren`, the store and its player go with the page, and the initial total
  moved 0.02 kB.
- **L26 the whole suite; L43 step the paused clock — saved time:** the Leave test, which expected Page not found
  at Class Start's address, now steps the clock until Class Start shows.
- **L52 honest stand-ins — saved time:** no spec names the HIIT cool-down's cadence aim; 68 rpm gives the
  ~154 W the spec reads, and the design's open questions say so.
- **L36 draft during the encode; L47 nothing outside `frontend/`; L6, L7, L10, L32 film — saved time:** the
  contact sheet showed the sync close-up too small to read, and it was enlarged before the encode.
- **Every other lesson — did not apply.**

**What slowed it down**

- The ~154 W of L2-084 AC2 did not come out of the catalogue: the step-0 search had swapped the recover and
  cool-down cadences, so the work level alone was not enough (L58).
- A parked player that seeks on ready plays the video; the contract gained `autoplay` and parks with
  `playerVars.start` (L61).
- `wz-button`'s `block` took a bare attribute as `''` and drew a narrow button (L60).

**New lessons**

- **L58 Run the real helper before changing data a spec quotes.**
- **L59 Absolute `cd` in edit scripts.**
- **L60 Bind a boolean input, or give it `booleanAttribute`.**
- **L61 Park a YouTube video with `playerVars.start`.**

### 6.2 Class library (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310; L50 name the project — saved time.**
- **L3 format first; L17 verify by exit status; L28 heredocs alone; L49 never commit with an edit script — saved
  time.**
- **L25 all-or-nothing edits — made it worse once:** one script wrote each file as it went and stopped at the
  page template, leaving half a step on disk; the next script collected its edits and wrote them at the end.
- **L35 check what was built — saved time:** no progress contract or rider level existed, so the slice added
  `PROGRESS_API` with `NewRiderProgress` (L52), and left the Class Start guard to 6.3, which builds its route.
- **L36 draft during the encode — saved time:** 6.2's prompt, requirements and mocks were read while 6.1's
  CI ran.
- **L41 spec each step first — saved time:** the shelves, the tabs, the locks and the unavailable state each
  failed first for the expected reason.
- **L5 bundle — saved time:** it caught 10 kB in the initial chunk that verify passed (L54).
- **L47 nothing outside `frontend/` in e2e — saved time:** the covers were copied beside the fixture.
- **L26 the whole suite; L6, L7, L10, L32, L34 film — saved time:** the full-size frames found two terminals
  whose tags rendered as HTML (L56).
- **Every other lesson — did not apply.**

**What slowed it down**

- The prompt asks for locks that the design left to journey 12, with no rider level anywhere yet; a new-rider
  `PROGRESS_API` made them buildable now without inventing progress.
- `rxResource` and `viewChildren` put 10 kB of Angular core into the initial chunk; finding which inputs grew
  it took a stats build and a script over `browser-stats.json` (L54).
- The locked-card spec timed out with no step named, because `click()` waits for `aria-disabled` to clear (L55).

**New lessons**

- **L54 Read the initial total yourself; core APIs land in main.**
- **L55 Reach a focusable disabled control by keyboard in a spec.**
- **L56 Escape tags in film terminals.**
- **L57 Provide a screen's store on its page, not its route.**

### 6.1 Class catalogue API (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone; L49 never commit
  with an edit script — saved time.** One verify failed on a type-only import that `eslint --fix` mended.
- **L8 central packages; L9 a fixture per fault — saved time:** `StubCatalogueApi` replaces `IClassCatalogue`
  as `UnreachableDatabaseApi` replaces the database, so no test reads the catalogue file.
- **L31 stub first — saved time:** the rule table failed on its twelve assertions before the rules existed.
- **L35 check what was built — saved time:** the backend had no class code, and the class ride already read
  `CLASSES_API`, so binding it to `CachedClassesApi` was the whole frontend change.
- **L36 draft during the encode — saved time:** 6.1's prompt, requirement and ADR 0014 were read while 5.4 encoded.
- **L41 spec each step first — saved time:** steps 1, 3, 4 and 5 failed for the expected reason first; step 2
  recorded what step 1's data already served, and was proved by blanking the summary and the world.
- **L47 nothing outside `frontend/` in CI — saved time:** it named the marketing build's failure at once (L53).
- **L5 bundle — saved time:** 284.08 kB, 0.06 kB up. **L26 the whole suite; L6, L7, L10, L32, L34 film and
  diagrams — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- The catalogue's home: the design left file or database open; ADR 0028 settled on an embedded file behind a
  port, with no table, seed or watch.
- Six of the seven classes have no published video and the mocks give their plans only as profiles; the
  plans were read from the mocks and the videos are stand-ins (L52).
- Another session's marketing site broke CI on `telo-ride` before this slice began (L53), and its second
  application broke the film recorder's `ng serve` (L50).

**New lessons**

- **L50 Name the project in every `ng` command.**
- **L51 Invalid test data is invalid by construction.**
- **L52 Seed honest stand-ins for data nobody supplied.**
- **L53 Fix another session's red CI in its own style.**

### 5.4 Pause, leave or finish a class (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
  Three edit scripts missed lines Prettier had wrapped, or table rows with empty cells, and wrote nothing.
- **L22 stop on a miss — made it worse once:** the CI fix for 5.3 ran its verify, commit and push after a
  failed assert, so the push carried only the copied picture; a second commit fixed the path (L49).
- **L5 bundle; L42 core APIs — saved time:** no new core API, and the initial total rose 0.06 kB.
- **L6, L10, L32, L34 film and diagrams — saved time.** **L7 contact sheet — saved time:** the header
  close-up was a thin strip again and was replaced by the paused video frame.
- **L26 run the whole suite — saved time:** run before the film, it gave the count the film shows.
- **L30, L38, L43 the paused clock — saved time:** initialising after Reconnect and the lazy Page not
  found each needed the clock stepped until they showed.
- **L35 check what was built — saved time:** `reconnectNow()` and the 3 s retry were there from 2.4.
- **L41 spec each step first — saved time:** all six steps failed for the expected reason before their code.
- **L44 fake at the browser API — saved time:** the Screen Wake Lock API is faked the same way.
- **L45 merge around another session's change — saved time:** AGENTS.md is still uncommitted in main.
- **L36 draft during the encode — no effect:** there was no earlier encode to draft during.
- **Every other lesson — did not apply.**

**What slowed it down**

- 5.3's merge failed CI: a fixture read the class cover from `docs/mocks`, which CI's checkout leaves
  out (L47), and the first fix pushed without its path change (L49).
- The lost-bike resume never came: the store watched the bike on the ride clock's ticks, which stop
  while the ride is held (L46).
- The prompt's "leave with confirmation" conflicts with L2-093 AC1 and the design; the spec won and the
  design notes it.

**New lessons**

- **L46 Watch for the end of a hold on the app's beat.**
- **L47 e2e reads nothing outside `frontend/`.**
- **L48 Prove a `beforeunload` prompt.**
- **L49 Never commit in the same command as an edit script.**

### 5.3 Sync the class video (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules`; L2 port 4310 — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
  One edit script stopped on a comment that wrapped differently from what it assumed, and wrote nothing.
- **L5 bundle and L40 entry points — saved time:** the build showed `main` 3 kB up with the video library
  already lazy; the cause was the app's first `effect` and `viewChild` (L42).
- **L6, L10, L32, L34 film and diagrams — saved time.** **L7 contact sheet — saved time:** the hook's accent
  ran under the browser window and the notice close-up was a thin strip.
- **L36 draft during the encode — saved time:** 5.3's requirement, ADR and design were read while 5.2 encoded.
- **L38 drive a ride on Playwright's clock — saved time:** it moved into a shared `startClassRide` helper.
- **L41 spec each step first — mostly:** steps 1 and 2 failed for the expected reasons before their code;
  step 3's behaviour (the notice) was written with step 1, so its specs were proved by switching it off.
- **Every other lesson — did not apply.**

**What slowed it down**

- The paused clock holding back the fake player's ready and the zoneless render (L43).
- Finding why `main` grew with the video library already lazy (L42).
- The design said tests bind a fake player to the token, which a browser test cannot do (L44).
- AGENTS.md gained a section on World rendering, uncommitted in the main checkout, while this slice
  also edits AGENTS.md (L45).

**New lessons**

- **L42 A first core API lands in `main`.**
- **L43 Step the paused clock until it renders.**
- **L44 Fake a third-party script at its URL.**
- **L45 Merge around another session's uncommitted change.**

### 5.2 Class ride screen (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L13 no linked `node_modules` — saved time.**
- **L2 port 4310 — saved time:** another checkout held 4300 again.
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — made it worse once, then caught:** the build failed its budget at +23.5 kB raw; the cause was
  `HttpClient` (L40), and the budget rose to 288/300 kB with the reason in the budgets design.
- **L6 track, L10 scene ids, L32 diagrams on a dark field, L34 render every diagram — saved time.**
- **L7 contact sheet — saved time:** it showed the header close-up as a thin strip, split into name and clock.
- **L35 check what earlier slices built — saved time:** the reconnect (2.4), the nudge (4.2) and the engine
  (5.1) were there; the screen only wires them.
- **L36 draft during the encode — saved time:** the mock's styles and the catalogue design were read while
  5.1 encoded.
- **L37 fake a hidden tab — saved time:** the same idea with Playwright's clock (L38).
- **Every other lesson — did not apply.**

**What slowed it down**

- Paused fake time: the ride needs a known start, but rendering and screenshots need frames (L38).
- The budget failure and finding why `HttpClient` lands in `main` (L40).
- A pre-existing flaky spec: the skip link could be pressed before Home's chunk rendered; it now waits.
- Steps 2 to 4 were specified after the components were written, so only step 1 was seen failing first
  (L41).

**New lessons**

- **L38 Drive a ride screen on Playwright's clock.**
- **L39 No `timeout` on macOS.**
- **L40 A new Angular entry point can land in `main`.**
- **L41 Spec each step before its code.**

### 5.1 Workout engine and ride clock (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; nothing in the app imports the engine yet.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** it showed the opening kicker running under the browser window.
- **L31 screenless slice, L33 hosting screen — saved time:** the wake lock, the leave guard and the
  `MONOTONIC_TIME` binding went to 5.2 with the route that needs them.
- **L34 render every diagram — saved time:** seven diagrams in three designs, all rendered.
- **L35 check what earlier slices built — saved time:** `RideTotals` (3.2) already counts distance per
  running second, so `DistanceIntegrator` was not built.
- **Every other lesson — did not apply.**

**What slowed it down**

- Two designs described the engine differently (`stateAt` against `follow(plan, clock)`); they now share
  `planStateAt` and `WorkoutEngine.follow`, and three designs' diagrams still named `sendTarget`.
- Committing the clock and the engine as separate steps needed the public API files split by hand.

**New lessons**

- **L36 Draft the next slice during the encode.**
- **L37 Fake a hidden tab with `setSystemTime`.**

### 4.2 Take over resistance (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB.
- **L6 track, L7 contact sheet, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L31 screenless slice, L33 hosting screen — saved time.**
- **L35 check what earlier slices built — saved time:** 4.1's controller already clamped and sent, so
  the slice was two methods and their table.
- **Every other lesson — did not apply.**

**What slowed it down**

- "Return to plan" in the slice's description has no control in any mock: L2-028 AC3 makes the next
  segment's plan level apply again, so that is the return.
- A nudge before any target had no rule; it starts from the bike's reported resistance, and the design
  says so.

**New lessons**

- None.

### 4.1 Send target resistance (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits — saved time.**
- **L5 bundle — checked:** +0 kB.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** the sheet passed, and recomputing the frames' checksums caught a
  wrong `D2` byte before the encode.
- **L28 heredocs alone — skipped once:** a design edit went out with an empty heredoc and changed
  nothing; the render after it showed the diagrams unchanged.
- **L31 screenless slice, L33 hosting screen, L34 render every diagram — saved time.**
- **Every other lesson — did not apply.**

**What slowed it down**

- Most of L2-025 was built in slice 2.3 (the frame, the clamp, the FTMS mapping, the acknowledgement time)
  and L2-027 AC4 in 2.4 (the connection resends its last target). The design's `resend()` would have
  duplicated it; the slice was left with the controller's plan path (L35).
- `SentToBikeLog` rows carry the ride time, which needs slice 5.1's clock, and only Custom ride shows the
  log, so it moved to 21.3.

**New lessons**

- **L35 Check what earlier slices built** for the requirements before writing code.

### 3.3 Show heart rate (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; no screen imports the strap yet.
- **L6 track, L10 scene ids, L32 diagrams on a dark field — saved time.**
- **L7 contact sheet — saved time:** it caught two wrapped kickers and a `quiet` timeline whose times
  did not add up, fixed before the encode.
- **L31 screenless slice at the domain boundary — saved time:** a fake strap behind `navigator.bluetooth`
  proved the chooser's filter, the subscription, the reconnect and the retries.
- **L33 find the hosting screen — saved time:** connecting a strap needs Settings (20.1), so the action,
  its mock and the Playwright proof go there.
- **Every other lesson — did not apply.**

**What slowed it down**

- The heart-rate component diagram had not rendered since it was written: an escaped quote in a C4 label
  broke the macro (L34). The 3.2 design change met the same error.
- The design kept the strap in IndexedDB; the remembered bike already uses one localStorage record read
  at start-up, so the strap does the same and the design says so.

**New lessons**

- **L34 Render every diagram you touch**, and keep escaped quotes out of C4 labels.

### 3.2 Show live metrics (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L5 bundle — checked:** +0 kB; nothing a screen imports changed.
- **L6 track, L7 contact sheet, L10 scene ids, L32 diagrams on a dark field — saved time.** The sheet
  needed no fix.
- **L31 prove a screenless slice at the domain boundary — saved time:** stubs first, one case per row,
  and one run on the simulated bike.
- **Every other lesson — did not apply.**

**What slowed it down**

- The slice names readouts, but the three screens that host them (5.2, 7.3, 21.3) and the ride clock that
  ticks the totals (5.1) come later, and each family of readout carries its plan's target. Reading the
  design system's `ride-readout` page settled it: 3.2 builds what they share, and the design moves the
  markup to the screens (L33).
- Two designs disagreed on distance (per running second here, over notification timestamps in the ride
  clock's `DistanceIntegrator`); the requirement's per-second rule stands, and the design names the
  refinement.

**New lessons**

- **L33 Find the hosting screen before building UI**, and build only what every host shares when it
  comes later.

### 3.1 Decode bike notifications (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — saved time:** Prettier ran before every verify, and none failed on format.
- **L5 bundle — checked:** 260.46 kB (+0 kB); the decoders and `BikeTelemetry` are not imported by any
  screen yet.
- **L6 track, L7 contact sheet — saved time.** The sheet showed a diagram's arrows invisible on a light
  field (L32), fixed before the one encode.
- **L10 scene ids; L17 verify by exit status; L25 all-or-nothing edits; L28 heredocs alone — saved time.**
- **L4, L8, L9, L11, L12, L14 to L16, L18 to L24, L26, L27, L29, L30 — did not apply.** Time-driven
  rules ran on Vitest's fake clock in unit tests, not Playwright's.

**What slowed it down**

- No screen shows telemetry before 3.2, so the slice had no Playwright path: its acceptance tests are the
  requirement tables at the domain boundary (L31), and the design now says 3.2 brings the end-to-end proof.
- A relative `cd ../../..` from a deep folder landed one level short, and Prettier found no files; `cd`
  by absolute path.

**New lessons**

- **L31 Prove a screenless slice at the domain boundary**, stub first, and name the slice that brings
  the Playwright proof.
- **L32 Diagrams on a dark field.**

### 2.4 Keep the bike connected (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — saved time:** Prettier ran before every verify, and none failed on format.
- **L5 bundle — checked:** 260.46 kB (+0 kB); the status, the reconnector and the keepalive ride in
  the lazy route's chunks.
- **L6 track, L7 contact sheet — saved time.** The sheet showed one scene blank (L10), fixed before the
  one encode.
- **L10 scene ids — skipped once:** a scene named `errors` rendered nothing; renamed `retry`.
- **L17 verify by exit status; L18 bind on the lazy route; L20 Web Bluetooth types; L24 diagram names
  — saved time.**
- **L23 fake the browser — saved time.** The fake gained `getAvailability()`, `adapterOff()`,
  `drop()` and `switchOff()`/`switchOn()`.
- **L25 all-or-nothing edits — saved time.** Two scripts missed an anchor and wrote nothing.
- **L26 run the suite after a guard — saved time.** It caught the keepalive in the remembered bike's
  exact write log (L29).
- **L27 notify after the writes; L28 heredocs alone — saved time.**
- **L4, L8, L9, L11, L12, L14 to L16, L19, L21, L22 — did not apply.**

**What slowed it down**

- The design leaned on pieces later slices own: the worker ticker (18.2), the resistance controller
  (journey 4), the logger (25.2), the ride screens' banners and Custom ride's panel (5.x, 7.x, 21.3).
  The connection now keeps the last target itself and logs to the console, and the design says what
  arrives where.
- The keepalive first started at the end of initialisation, before pairing finished, which raced the
  specs that count exactly three init writes; it now starts once the bike is connected.

**New lessons**

- **L29 A periodic write joins every write log:** start it when its requirement says; filter it out.
- **L30 Move time with Playwright's clock** for keepalives and retries.

### 2.3 Pair a bike (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — skipped once:** a verify failed on format after a card edit; one rerun.
- **L5 bundle — checked:** 260.46 kB (+0.2 kB); the guard and the remembered bike ride in the lazy
  route's chunk.
- **L6 track, L7 contact sheet — saved time.** Mid-scene frames hid late cards, so a second sheet of
  late frames was checked before the one encode.
- **L10 scene ids, L24 diagram names — saved time.** The identity diagram names its boxes in words and
  puts `ECH-EX5S-141844` in the notes.
- **L12 zsh — skipped once:** an unquoted `--include=*.md` matched nothing and cost a command.
- **L17 verify by exit status — saved time.** It caught verify run from `frontend/`, where the script
  does not exist, before a commit.
- **L18 bind on the lazy route — saved time.** `REMEMBERED_BIKE` is bound beside the bike connection.
- **L20 Web Bluetooth types — saved time** for the two links and the write queue.
- **L22 stop on the first miss — partly.** Twice a Python edit script stopped on a missed anchor
  after writing the files before it; tests caught both before a commit (L25).
- **L23 fake the browser — saved time.** The fake gained chooser modes, `readValue`,
  `getPrimaryServices` and an ordered log of subscriptions, reads and writes.
- **L4, L9, L11, L14 to L16, L19, L21 — did not apply.**

**What slowed it down**

- The design paired in two presses (search, then pair), but the browser opens its chooser only for a
  user gesture and connects to what the rider picks, so the found step went and pairing is one press.
- The identifier rule was `<TO SUPPLY>` and the mocks showed a signal line no browser gives without a
  flag; the rule was settled from Echelon's advertised names and the mocks now show the identifier.
- The docs did not fix Set Target Resistance Level's byte layout; it follows the range's encoding
  (sint16 in 0.1) and the design records it.
- Home's new guard sent the app-shell and Back-to-Home specs to Connect Bike (L26).

**New lessons**

- **L25 All-or-nothing edit scripts:** assert every anchor, then write.
- **L26 A guard changes every spec that opens its screen:** give them their premise; run the suite.
- **L27 Notify after the app's writes,** not before initialisation has finished.
- **L28 Heredocs that write files go in a command of their own.**

### 2.2 Check browser support (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310; L13 no linked `node_modules` — saved time.**
- **L3 format first — little effect.**
- **L4 attribute components — saved time.** Connect Bike's Try again needed the design system's
  `btn--raised`, added as a `raised` variant of `wz-button`.
- **L5 bundle — checked:** 260.26 kB (+0.24 kB); the support check rides in the lazy route's chunk.
- **L6 track, L7 contact sheet — saved time.** The sheet caught capitalised code names in a diagram
  (L24), and the audio log a hook line read at 1.25×; both were fixed before the one encode.
- **L9 backend fixtures; L14 production-like runs — saved time.** `ProductionApi` is one
  `ConfigureWebHost` override; `dotnet run --no-launch-profile` in Production gave the film's curl.
- **L10 scene ids, L12 zsh — saved time.**
- **L17 verify by exit status — saved time,** but a Python edit that missed in the same command let a
  commit go without its template change (L22); it was amended.
- **L18 bind on the lazy route — saved time.** `BLUETOOTH_SUPPORT` sits beside the bike connection.
- **L11, L15, L16, L19, L20 — did not apply.**

**What slowed it down**

- Class Start, Custom workout and Custom ride, which L2-008 to L2-010 name, do not exist yet; their
  notices were left to the slices that build those pages, and the design says so.
- Chromium hides `navigator.bluetooth` on plain http, so the design's two checks had to be ordered
  (secure context first) and Connect Bike needed a `needs-https` state, its requirement and its mock.
- The HSTS test failed twice for reasons in the test: the client options reset the address to
  `localhost`, which HSTS leaves out (L21).

**New lessons**

- **L21 Test clients and HSTS:** set `BaseAddress` in the options passed to `CreateClient`; test HSTS
  at another host in Production.
- **L22 Stop a scripted edit on its first miss** before anything commits.
- **L23 Fake the browser's states** with `remove()`, `servePlainHttp()` and `restore()`.
- **L24 Code names go in a diagram node's note,** not its capitalised name.

### 2.1 Ride a simulated bike (2026-11-21)

**Applied from earlier**

- **L1 own worktree and install; L2 port 4310 — saved time.** The worktree's own `npm ci` took
  seconds, and the main checkout was left alone.
- **L3 format first — little effect.** Prettier rewrote new files; nothing failed on it.
- **L4 attribute components — saved time.** The pair button is `button[wz-button]` with a new
  `size="xl"` and `block`, not a new component.
- **L5 bundle — saved time.** The first build read 263.05 kB against a 257.46 kB baseline; the
  stats file showed the bike connection and its ticker in the main chunk, and binding them on a lazy
  parent route (L18) brought it to 260.02 kB.
- **L6 track, L7 contact sheet, L10 scene ids, L12 zsh — saved time.** One encode; the sheet caught a
  near-empty phone picture before it.
- **L11 prove a double from the outside — did not apply.** The fake Bluetooth was already proven; the
  production spec used it as it is.
- **L13 never link `node_modules` — saved time.** No reinstall touched the main checkout.
- **L14 to L16 — did not apply.** No backend change.

**What slowed it down**

- Verify's output was piped to `grep`, so a failing production build (library specs compiled into
  the app) still reached a commit; it was amended after the fix.
- The app's `tsconfig.app.json` excluded `**/*.spec.ts` relative to `projects/ride`, which never
  reached the libraries' specs; the first library unit test broke the build until the exclude named
  `../*/src/**/*.spec.ts`.
- Web Bluetooth types needed a reference in the one file that uses them, and the newer
  `Uint8Array<ArrayBufferLike>` would not pass as a `BufferSource`.
- `AGENTS.md` says the composition root binds every token, and lazy loading outranks that: the
  bike connection moved to the lazy parent route, and the design records why.

**New lessons**

- **L17 Judge verify by its exit status,** never by a `grep` of its output.
- **L18 App-wide services the first screen needs bind on the lazy parent route** in `ride.routes.ts`.
- **L19 Development-only behaviour gets a `*.development.spec.ts`** on Playwright's `development` project.
- **L20 Web Bluetooth types in `domain`:** a triple-slash reference, and `Uint8Array<ArrayBuffer>` encoders.

### 1.4 CI and hosting (2026-11-21)

**Applied from earlier**

- **L1 own worktree, links first; L2 port 4310 — saved time.** No nested link, no stale server.
- **L3 format first — little effect.** Prettier and `dotnet format` never failed.
- **L4 attribute components — did not apply.** **L5 bundle — checked: unchanged** at 257.46 kB, read
  from the CI log as well as locally.
- **L6 reuse the track — saved time. L7 contact sheet — partly.** The sheet's small tiles hid a
  clipped headline that a full-size frame of the encode showed, so the film was encoded twice.
- **L8 backend packages — saved time.** No package was needed: static files, fallbacks and headers are
  all in ASP.NET Core.
- **L9 backend fixtures — saved time.** `HostedAppApi` is one `ConfigureServices` override.
- **L10 scene ids, L12 zsh — saved time.** No blank scene and no shell trap.
- **L11 prove a double from the outside — saved time.** The in-memory web root was proven through the
  API, failing first with 401 for the right reason.
- **L13 lockfile — did not apply.** No package changed; the lesson itself was corrected at the start
  of this slice.

**What slowed it down**

- The host was open: Static Web Apps' linked backends route only `/api` and carry no WebSockets, which
  had to be confirmed before ADR 0026 could choose the API as the host.
- `dotnet run` took the launch profile's port and Development environment until
  `--no-launch-profile`.
- The tests' "no file" rule needed an in-memory `IFileProvider` for the web root.
- The pipeline could be proven only on GitHub: the branch was pushed to run it before the merge.
- A `headline--lg` title clipped its last letter's italic overhang inside the word reveal's mask;
  `headline--md`, as every other scene uses, does not.

**New lessons**

- **L14 Production-like local runs.** `dotnet run --no-launch-profile … -- --webroot <build>`.
- **L15 Prove a workflow on GitHub before merging.** Push the slice's branch, `gh run watch`, then
  delete the remote branch after the merge.
- **L16 In-memory web root.** `PostConfigure<StaticFileOptions>` with `InMemoryWebRoot`.

### 1.3 Test harness (2026-11-21)

**Applied from earlier**

- **L1 own worktree, links first — saved time.** Both links were made before anything ran, so nothing
  nested; the other session's checkout stayed untouched. Its one surprise is now L13.
- **L2 port 4310 — saved time.** No stale server.
- **L3 format first — little effect.** `prettier --write e2e` ran before every verify and the format
  check never failed; the one lint failure was missing types, which formatting cannot catch.
- **L4 attribute components, L5 bundle — did not apply.** No component and no app code changed.
- **L6 reuse the track, L7 contact sheet — saved time.** The sheet showed a clipped terminal line
  before the one encode.
- **L8 backend packages — saved time.** SignalR.Client 10.0.13 and TimeProvider.Testing 10.0.0 were
  chosen on the 10.x line and restored first time.
- **L9 backend fixtures — saved time.** The hub tests reused `SignedInProbeApi`; the span recorder
  became `EventProbe<T>` in one move, with every test green.
- **L10 scene ids — saved time.** Scenes were named for what they show (`strict`, `api`); none
  rendered blank.

**What slowed it down**

- zsh again: an unquoted `--include=*.cs` was globbed, and BSD `sed` ignored `\b`, so a rename did
  nothing until it was redone with perl.
- The e2e type check had no Web Bluetooth types; `@types/web-bluetooth` was added, and the lockfile
  change made verify install `node_modules` afresh in the worktree, in place of the link.
- With no app code calling Bluetooth, HTTP or the hub yet, each double needed an in-page driver
  (`AppCalls`) before its spec could fail for the right reason, and each guard needed `test.fail()`
  plus one run without it.

**New lessons**

- **L11 Prove a double from the outside.** Drive the browser API from the page through a helper until
  the app's client exists, prove each guard with `test.fail()`, and read the reason once without it.
- **L12 zsh and BSD tools.** Quote globs in arguments, and use `perl -pi -e` with `\b` for whole-word
  renames.
- **L13 A lockfile change gives the worktree its own install.** Verify's `npm ci` replaced the
  `node_modules` link with a fresh install in the worktree; the main checkout's copy was untouched.
  (First written as the reverse; corrected in 1.4 when `git worktree remove` met a real folder.
  Corrected again after 1.4: there, `npm ci` emptied the main checkout's `node_modules` through the
  link. Worktrees now get their own install; see L1 and L13.)

### 1.2 Backend skeleton (2026-11-21)

**Applied from earlier**

- **L1 own worktree — saved time.** The slice ran in
  `../wattzup-01-2-backend-skeleton` while another session kept editing the main checkout; nothing of
  theirs was staged, and verify ran there with `frontend/node_modules` symlinked. It cost two
  failed commands (zsh keeps `$VAR` as one word) and one nested link (the recorder had made `.cache/`
  before it was linked), so the lesson now says both.
- **L2 port 4310 — saved time.** No spec run met a stale server.
- **L3 format first — no effect.** `dotnet format` passed every time and the frontend did not change;
  kept for slices that edit configs.
- **L4 attribute components, L5 bundle — did not apply.** No component and no frontend import; the
  initial chunk stayed at 257.46 kB.
- **L6 reuse the track — saved time.** No search and no download.
- **L7 contact sheet, one encode — saved time.** The sheet showed a blank scene before any full
  encode, so the film was encoded once, at CRF 23.

**What slowed it down**

- .NET 10 tooling: EF Core 11 refuses .NET 10, xUnit v3 needs the Microsoft Testing Platform opt-in,
  `dotnet new` has no `-q`, and SqlClient's vulnerable `System.Security.Cryptography.Pkcs` failed
  the warnings-as-errors build.
- With no production endpoint behind authentication yet, the acceptance tests needed a test-only
  controller, a signed-in scheme and in-memory telemetry exporters before they could fail for the
  right reason.
- A scene named `errors` rendered blank: it collided with `#errors` in `film.css`.

**New lessons**

- **L8 Backend packages.** Pin EF Core to 10.0.x (`dotnet-ef` is 10.0.13), keep MediatR on 12.5.0,
  run tests with `dotnet test --solution Telo.Ride.slnx` (xUnit v3 needs the `test.runner` of
  `backend/global.json`), and add `System.Security.Cryptography.Pkcs`-style pins to
  `Directory.Packages.props` (transitive pinning is on). Try a package in a scratch class library
  before an ADR names it. Mark generated code (`Migrations/`) as `generated_code` in
  `backend/.editorconfig`.
- **L9 Backend acceptance tests.** One fixture per fault: subclass `TeloRideApi` and override
  `ConfigureServices` (for example `UnreachableDatabaseApi` replaces `IAppDbContext`). Until a
  feature brings its own endpoints and sign-in, `ProbeController` and `SignedInProbeApi` stand in.
  Await telemetry with `SpanRecorder.Await`, and check a guard is real by removing it once (without
  the `url.query` enrich the span held `?text=Redacted`). Capture a real response body for a film
  with a throwaway test, then delete it.
- **L10 Scene ids.** A scene's id becomes its DOM id, and `film.css` styles `#errors`, `#captions`,
  `#play`, `#frame` and `#stage`; name scenes for what they show (`refusals`, not `errors`).

### 1.1 Frontend workspace (2026-11-21)

**Applied from earlier:** none; this was the first slice.

**What slowed it down**

- Another session shared the checkout: it held port 4300, and its unstaged changes made
  `git rebase` refuse, so the rebase had to be redone in a separate worktree after the merge.
- The film took longer than the slice's code: finding and downloading a track behind Pixabay's
  bot check, two full encodes (the first, at CRF 21, came out at 16.6 MB, over the limit), and a
  round of frame fixes found only after rendering.
- Small check failures, each a separate verify run: Prettier on `angular.json`, `tsconfig.json` and
  `serve-dist.mjs`, `consistent-type-imports`, the component-selector rule, and the unit-test
  builder's "No tests found".

**New lessons**

- **L1 Shared checkout.** Other sessions edit the same working tree, push to the same branches and
  serve on the same ports. Next time, start in a worktree of your own:
  `git worktree add ../wattzup-<slice> -b journey/<slice> origin/telo-ride`, then
  `ln -s <repo>/frontend/node_modules ../wattzup-<slice>/frontend/node_modules`. Verify passes there
  as it does in the main checkout. Stage named paths (`git add <paths>`), never `git add -A`, and if
  the rebase meets someone else's changes, use a clean worktree rather than stashing their work.
- **L2 Ports.** `serve-dist` from another session often holds 4300, and Playwright reuses whatever
  answers there. Set `E2E_PORT=4310` for every spec and verify run from the start.
- **L3 Format first.** Angular CLI edits and hand edits to JSON configs fail Prettier, and new
  imports of types fail `consistent-type-imports`. Run `npm run format` and `npx eslint --fix` from
  `frontend/` before the first verify; each saves a whole verify cycle.
- **L4 Routing in presentation components.** `components` never imports the router, so the header's
  brand, its nav links and the button are attribute components: the host keeps the mock's BEM class
  (`app-header__nav-link`, `btn`), and the app adds `routerLink`, `routerLinkActive` and
  `ariaCurrentWhenActive="page"`. The ESLint selector rule accepts kebab-case `wz-` attributes. Reuse
  this for every link-like component instead of designing a new pattern. A 44 px hit area is a
  `::after` with `inset-block: min(0px, calc((100% - var(--target-comfortable)) / 2))`.
- **L5 Bundle.** Zoneless Angular with the router and the shell is already 257 kB raw (about 68 kB
  transferred) of a 264 kB warning and a 280 kB error. Anything a later slice adds goes in a lazy
  chunk; check `Initial total` in `npm run build` before committing a new import.
- **L6 Music.** Pixabay answers scripted downloads with 403. A headed Chromium opened through
  Playwright passes the check, and the file comes from `cdn.pixabay.com`. *Beautiful Boom Bap* by
  Music_Unlimited is already in `docs/videos/assets/music/` and credited, measured at 92.99 BPM (a
  bar is 2.581 s, offset 0.009 s); reusing it saves the search.
- **L7 Film review.** One `--frame` render takes seconds and a full encode takes several minutes.
  Render one frame per scene and per act transition first, tile them into one sheet
  (`ffmpeg -i a.png -i b.png … -filter_complex hstack` or `tile`), fix, then encode once in the
  background with `--crf 23` while writing `README.md` and `script.md`. Known traps: on signal and
  bone fields `film.css` recolours the lockup, so do not put a lockup inside an ink card there; give
  `opening()` a `width` so the headline clears the device; the voice reads the purpose's
  parentheses as pauses while the picture and captions quote it exactly (`closing()` already does
  this).
