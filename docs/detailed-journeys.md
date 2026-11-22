# Detailed journeys

Each journey in [`journeys.md`](journeys.md) split into vertical slices of 4 days or fewer, in the
same order. Estimates are working days for one intermediate developer. **% complete** is 100% once a
slice is merged into `telo-ride`; each slice sets its own row, and the total, when it finishes (see
[`lessons-learned.md`](lessons-learned.md)).

| # | Slice | Description | Days | Journey | % complete |
|---|-------|-------------|------|---------|-----------|
| 1.1 | Frontend workspace | Angular libraries, ride app, lint, boundaries, budgets, tokens and fonts. | 3 | 1. Scaffold the product | 100% |
| 1.2 | Backend skeleton | Clean architecture projects, health endpoint, auth fallback policy, OpenTelemetry. | 3 | 1. Scaffold the product | 100% |
| 1.3 | Test harness | Fake Bluetooth and API fixtures for Playwright; in-memory backend test server. | 2 | 1. Scaffold the product | 100% |
| 1.4 | CI and hosting | GitHub Actions under 5 minutes; the API serves the app on Azure App Service (ADR 0026). | 2 | 1. Scaffold the product | 100% |
| 2.1 | Ride a simulated bike | `?simulate` connects a simulated bike end to end. | 2 | 2. Connect a bike | 100% |
| 2.2 | Check browser support | Needs-Chromium and needs-HTTPS panels when Web Bluetooth is missing. | 2 | 2. Connect a bike | 100% |
| 2.3 | Pair a bike | Browser chooser, connect, Connect Bike screen and its states. | 3 | 2. Connect a bike | 100% |
| 2.4 | Keep the bike connected | Keepalive, automatic reconnect, `ble` status line and banners. | 3 | 2. Connect a bike | 100% |
| 3.1 | Decode bike notifications | Parse power, cadence, speed and resistance frames with checksums. | 2 | 3. Read live telemetry | 100% |
| 3.2 | Show live metrics | Power, cadence, speed and resistance readouts update on every notification, with ride totals for time, distance and energy. | 2 | 3. Read live telemetry | 100% |
| 3.3 | Show heart rate | Connect a Bluetooth heart-rate strap from Profile; heart rate shows beside power during any ride. | 1 | 3. Read live telemetry | 100% |
| 4.1 | Send target resistance | Frame commands; bike follows the target and reports resistance back. | 3 | 4. Control resistance | 100% |
| 4.2 | Take over resistance | Stepper raises or lowers resistance; return to plan. | 2 | 4. Control resistance | 100% |
| 5.1 | Workout engine and ride clock | Plan steps through segments on a true clock and sends each target. | 3 | 5. Ride a solo class | 100% |
| 5.2 | Class ride screen | Header, segment, power, cadence and resistance stepper on the simulated bike. | 3 | 5. Ride a solo class | 100% |
| 5.3 | Sync the class video | YouTube player follows the ride clock; video-unavailable notice. | 3 | 5. Ride a solo class | 100% |
| 5.4 | Pause, leave or finish a class | Pause and resume a solo class, leave with confirmation, or finish at the end and go to results. | 3 | 5. Ride a solo class | 100% |
| 6.1 | Class catalogue API | `GET /api/classes` from the catalogue file; cached on the device. | 2 | 6. Browse and start a class | 100% |
| 6.2 | Class library | Classes listed by length and tier with cover, coach and duration; locked tiers say what opens them. | 3 | 6. Browse and start a class | 100% |
| 6.3 | Class start | Parked video, plan, ride alone; Start class opens the ride. | 3 | 6. Browse and start a class | 100% |
| 7.1 | Browse maps | Map list with distance, climb and stars; locked maps shown. | 3 | 7. Race the ghost and bots | 100% |
| 7.2 | Set up a race | Choose the map and opponents (your best-time ghost and bots), then start the race. | 2 | 7. Race the ghost and bots | 100% |
| 7.3 | Ride a race | Power to speed, distance and position; gradient sets resistance. | 4 | 7. Race the ghost and bots | 100% |
| 7.4 | Ghost and bots | Best-time ghost replay and paced bots on the board. | 3 | 7. Race the ghost and bots | 100% |
| 7.5 | Finish, pause or leave a race | Finish line and placing; pause, leave or lose the bike. | 3 | 7. Race the ghost and bots | 100% |
| 8.1 | Load the world library | Lazy `world` chunk, backend probe, canvas host, dispose on leave. | 3 | 8. See the race world | 100% |
| 8.2 | Draw the route world | Road, terrain and sky for one map; camera follows distance. | 4 | 8. See the race world | 100% |
| 8.3 | Draw riders and ghost | Instanced riders in jersey colours; translucent gold ghost. | 3 | 8. See the race world | 100% |
| 8.4 | Quality levels | Four levels of techniques; WebGL 2 caps at High. | 4 | 8. See the race world | 100% |
| 8.5 | Step down when frames drop | After two 2-second windows in a row with slow frames, the world drops one quality level for the rest of the race. | 2 | 8. See the race world | 100% |
| 8.6 | Panorama and hidden tab | Panorama without 3D; drawing stops while the tab is hidden. | 2 | 8. See the race world | 100% |
| 8.7 | Real-world scenery | Stream Google 3D Tiles with the rider's own key. | 2 | 8. See the race world | 100% |
| 9.1 | Request an email code | Rider enters an email address; the backend sends a one-time code and the screen waits for it. | 3 | 9. Sign in with an email code | 100% |
| 9.2 | Verify and stay signed in | Enter the code, get a session, stay signed in. | 3 | 9. Sign in with an email code | 100% |
| 9.3 | Choose a display name | Prompt after first sign-in; change it from Profile. | 2 | 9. Sign in with an email code | 100% |
| 9.4 | Sign out and delete account | Sign out; delete account and all its data. | 2 | 9. Sign in with an email code | 100% |
| 10.1 | Record a ride | `POST /api/rides`, idempotent by ride id, plausibility check. | 3 | 10. Earn XP, levels and streaks | 100% |
| 10.2 | Earn XP | Each recorded ride earns XP for finishing, its place, a podium and its time on target, calculated on the backend. | 2 | 10. Earn XP, levels and streaks | 100% |
| 10.3 | Rider levels | Levels from XP thresholds; level shown in the header. | 2 | 10. Earn XP, levels and streaks | 100% |
| 10.4 | Keep a streak | Consecutive riding days are counted on the backend and shown on Home, Profile and results. | 3 | 10. Earn XP, levels and streaks | 100% |
| 11.1 | Results screen | Time, power and distance summary after any ride. | 3 | 11. See results | 100% |
| 11.2 | XP, stars and personal best | Results show XP earned, stars and a new personal best. | 3 | 11. See results | 100% |
| 11.3 | Celebrate an unlock | Unlock moment for a new map or tier. | 2 | 11. See results | 100% |
| 12.1 | Earn stars and unlock maps | Race times earn up to three stars per map; enough stars unlock the next maps. | 3 | 12. Unlock maps and class tiers | 100% |
| 12.2 | Open class tiers | Rider levels open longer class tiers (20, 30 and 60 minutes) in the class library. | 2 | 12. Unlock maps and class tiers | 100% |
| 13.1 | App header | Wordmark, navigation, level and full screen on every page. | 2 | 13. Choose the next ride | 100% |
| 13.2 | Home next ride | Home suggests the next race or class from the rider's progress, with both doors one tap away. | 2 | 13. Choose the next ride | 100% |
| 13.3 | Show the profile | Profile shows rider level, XP, streak and the settings rows (bike, ride settings, custom workout). | 1 | 13. Choose the next ride | 100% |
| 14.1 | Connect to the ride hub | SignalR client behind a token: connects only when needed, measures the server clock offset and reconnects after drops. | 3 | 14. Ride a class with a group | 100% |
| 14.2 | Group session schedule | A session every 15 minutes, 10 seats, shown on Class Start. | 3 | 14. Ride a class with a group | 100% |
| 14.3 | Join a group session | Join; full or started sessions offer the next one. | 3 | 14. Ride a class with a group | 100% |
| 14.4 | Start together | Clock and video wait, then start at the session time. | 3 | 14. Ride a class with a group | 100% |
| 14.5 | Live group board | Group class board ranks riders by output and updates every second from the backend. | 3 | 14. Ride a class with a group | 100% |
| 15.1 | Race lobby | Wait for riders, see who's in, leave before the start. | 3 | 15. Race people live | 100% |
| 15.2 | Start a live race | Shared countdown; everyone starts on the same server time. | 3 | 15. Race people live | 100% |
| 15.3 | Live standings | Positions and gaps every second from the backend. | 3 | 15. Race people live | 100% |
| 15.4 | Mark leavers and DNF | Riders who leave or drop out are marked DNF. | 3 | 15. Race people live | 0% |
| 15.5 | Record results nobody can change | The backend computes the final placings and locks them so no client can change them. | 3 | 15. Race people live | 0% |
| 16.1 | Download the world | Load card with progress, saved worlds, resume after failure. | 3 | 16. Ride a world class | 0% |
| 16.2 | Build shaders and warm up | Programs built in batches, warm-up, slow-load and step-down options. | 3 | 16. Ride a world class | 0% |
| 16.3 | Start a solo world class | Start riding when ready and connected; world fades in. | 2 | 16. Ride a world class | 0% |
| 16.4 | Join a group world class | Countdown, start with the group, world fades in when ready. | 2 | 16. Ride a world class | 0% |
| 17.1 | Ride outbox | Finished rides wait on the device and send when online. | 3 | 17. Ride without a network | 0% |
| 17.2 | Cache the app | Service worker caches shell, chunks, worlds and catalogues. | 3 | 17. Ride without a network | 0% |
| 17.3 | Offline choices | Group and live options say why they're unavailable offline. | 2 | 17. Ride without a network | 0% |
| 18.1 | Lose the service mid-ride | Multiplayer drops; the ride carries on and rejoins. | 3 | 18. Ride through a lost service | 0% |
| 18.2 | Keep the ride clock true | Clock stays right through hidden tabs and throttling. | 2 | 18. Ride through a lost service | 0% |
| 19.1 | Bundle budgets | Lazy routes, tight initial budget, gzip check in verify. | 2 | 19. Stay smooth on long rides | 0% |
| 19.2 | Bounded ride buffers | Power and cadence traces, packet logs and leaderboards use fixed-size buffers, so memory stays flat over an hour. | 2 | 19. Stay smooth on long rides | 0% |
| 19.3 | Heap checks | Heap stays stable across repeated enter and leave of the race, class and world screens. | 2 | 19. Stay smooth on long rides | 0% |
| 19.4 | Web vitals and frame budget | Measure LCP, INP and frame times on reference devices. | 2 | 19. Stay smooth on long rides | 0% |
| 20.1 | Settings page and store | `/settings`, sections, apply at once, kept on device, reset. | 3 | 20. Tune ride settings | 0% |
| 20.2 | World quality controls | Quality cards, step-down, frame rate, resolution, graphics API. | 3 | 20. Tune ride settings | 0% |
| 20.3 | Check this device | Off-screen trials find the level the device holds. | 2 | 20. Tune ride settings | 0% |
| 20.4 | Sound, motion and display | Ride sound, music, reduce motion, theme, ride numbers, wake lock. | 2 | 20. Tune ride settings | 0% |
| 20.5 | Manage saved worlds | This device section lists saved worlds and their size, clears them with a toast, and can stop saving. | 2 | 20. Tune ride settings | 0% |
| 21.1 | Set up a custom workout | Build your own workout under Profile: warm-up, ordered interval sets and cool-down. | 3 | 21. Ride a custom workout | 0% |
| 21.2 | Preview a custom workout | Preview the workout's resistance profile, length and expected average power before starting. | 2 | 21. Ride a custom workout | 0% |
| 21.3 | Ride a custom workout | The plan drives target resistance through each interval, with the ride clock and live readouts. | 3 | 21. Ride a custom workout | 0% |
| 21.4 | Pause, leave or end | Pause, lose the bike, leave or end the ride. | 2 | 21. Ride a custom workout | 0% |
| 22.1 | Authenticate every request | Every endpoint and hub needs authentication by default; anonymous endpoints are explicit and listed. | 2 | 22. Stay secure | 0% |
| 22.2 | Validate input and encode output | Validators on every request; device names rendered as text. | 2 | 22. Stay secure | 0% |
| 22.3 | Limit abuse | Rate limits on sign-in codes, ride submissions and feedback, refusing with a code the screen branches on. | 2 | 22. Stay secure | 0% |
| 22.4 | Restrict third parties | Static CSP; rider data seen only by its owner. | 2 | 22. Stay secure | 0% |
| 23.1 | Fit every width | 320 to 2560 px with no sideways scroll. | 3 | 23. Use by touch, keyboard and screen reader | 0% |
| 23.2 | Touch and keyboard | 44 px targets, focus order and visible focus everywhere. | 2 | 23. Use by touch, keyboard and screen reader | 0% |
| 23.3 | Screen readers and motion | Screen readers hear step changes and results; dialogs make the page inert; reduced motion stills animation. | 3 | 23. Use by touch, keyboard and screen reader | 0% |
| 24.1 | Switch theme | Match device, dark or light from role tokens. | 2 | 24. Switch theme and full screen | 0% |
| 24.2 | Full screen | Full screen toggle on every page header, hidden where the browser has no Fullscreen API. | 1 | 24. Switch theme and full screen | 0% |
| 25.1 | Inspect diagnostics | Bike, browser and connection state in a dialog. | 3 | 25. Check diagnostics | 0% |
| 25.2 | Record the packet log | Bounded log of Bluetooth commands, or every message when switched on, downloadable as a file. | 2 | 25. Check diagnostics | 0% |
| 26.1 | Send feedback | Bug, idea or kudos dialog with sending and sent states. | 3 | 26. Send feedback | 0% |
| 26.2 | Receive feedback | Backend stores each feedback item, rate-limited, and the team can read it without seeing contact details in telemetry. | 2 | 26. Send feedback | 0% |
| 27.1 | Installable app | Manifest, icons and install from Chrome or Edge. | 2 | 27. Install the app | 0% |
| 27.2 | Update to a new version | Tell the rider a new version is ready; reload between rides. | 1 | 27. Install the app | 0% |

**Total:** 95 slices, 238 days. **Complete:** 56 slices, 147 days (62%).
