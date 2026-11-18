# Wattzup mocks

Static HTML mocks of every Wattzup screen, dialog and notification in every state. They are the
source of truth for the UI (see `AGENTS.md`). The look, layout and copy come from the Magic Patterns
OS design *Wattzup* (`vnjsCrjBAfcZGnW9rHMoch`, prototype `f5zb7cLTQFMdzC5JcFyupj`: frames *Ride
Dashboard*, *Training Setup*, *Choose Machine* (`masjUNhEVdxXudyJsSX9GW`), *Run Setup*
(`3exZTV1GoJjHpTtShFsmsf`) and *Run Dashboard* (`sGuCezQfiSSnFCVAmbH2Ae`)). The treadmill mocks follow
the three treadmill frames, and L2-062…L2-074 were rewritten to match them on 2026-11-16 (ADR 0010). The mocks also add the pieces the specs require and that design
does not have. Every place where the design and `docs/specs/` disagree is listed under
[Open questions](#open-questions). None of them was settled quietly.

## How to open

- Open `index.html` from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom with its sibling states, a theme toggle and a × that hides
  the mock chrome.
- Query parameters: `?theme=light` or `?theme=dark` (dark is the main theme), and `?chrome=0` to
  hide the mock bar and the notes.
- Yellow `.mock-note` callouts mark intent a static page cannot show: timers, tones, auto-dismiss
  and the WebGL trace.

## Cast and catalog

Every mock uses this cast.

- **Rider:** one person on their own bike, at home. Wattzup is single-user and local.
- **Bike:** *Echelon EX-5s*. Its BLE name is `ECHEX-3-141844` and the connection id is `0bf669f1`.
  The edge state uses *Echelon Connect Sport EX-8s Pro (Basement)*.
- **Today:** 2026-11-15, about 7:10 PM.
- **Sample ride** (the ride the mid-ride mocks show): HIIT 8 × 0:40 / 0:20, work level 18, recover
  level 6, 3 min warm-up, 2 min cool-down, 12:40 in total. The setup form's default plan is
  different: 18 × 0:40 / 0:20, work level 26, recover level 18, 22:40 in total (L2-029).
  - The default mid-ride moment is 7:07, *Work, round 5 of 8*, with 0:33 left.
  - Readouts: 317 W against a 327 W target, 95 rpm (aim 98), heart rate 156 bpm, avg power 208 W,
    25.1 km/h, 2.53 km, 89 kcal.
- **Flat ride:** level 12 for 30 min with an 85 rpm cadence goal, shown at 14:22.
- **Edge ride:** 12 × 4:00 / 2:00 at level 32 / 10, 1:03:20 of 1:15:00, work round 11 of 12, 1,034 W, 1,284 kcal,
  38.42 km.
- **Presets:** Tabata 8 × 0:20 / 0:10, 40 / 20 (8 × 0:40 / 0:20), Minute on 10 × 1:00 / 1:00, Long
  climbs 4 × 4:00 / 2:00.
- **Treadmill** (*Choose Machine*, *Run Setup*, *Run Dashboard* frames): *Echelon Stride*, serial
  `STRIDE-8s22-000766`, signal 4 of 4, last session *Hill walk 30 min · 4 days ago*; the bike's card shows
  its advertised name `ECHEX-3-141844`, signal 3 of 4, last session *HIIT 8 × 40s · yesterday*, and is the last used
  machine. The header reads *2 machines nearby*. Limits are the frame's: 0.8–19.3 km/h, incline 0–10 %.
  - **Sample run** (the frame's `DEFAULT_RUN`, the *Minute on* preset): HIIT 6 × 1:00 / 1:00, work
    13.0 km/h at 2 %, recover 6.0 km/h at 1 %, 3 min warm-up at 7.0 km/h and 1 %, 2 min cool-down at
    6.0 km/h and 0 %, 16:00 in total (`HIIT · 6 × 1:00 / 1:00`). The mid-run moment is 9:33, *Work, round
    4 of 6*, 0:27 left: 13.0 km/h (4:37 /km), incline 2 %, heart rate 164, avg pace 6:47 /km, 1.41 km,
    22 m climbed, 116 kcal. These numbers come from the frame's `useRun` simulation.
  - **Steady run** (*Hill walk*): 6.5 km/h at 8 % for 30 min, shown at 14:22.
  - **Presets:** Sprints 30/30, Minute on, Hill repeats, Norwegian 4×4; Steady: Hill walk, Easy run,
    Tempo. Quick speeds on the dashboard: 5, 8, 10, 12, 14, 16 km/h.
- **Video ride-along** (*Training Setup* and *Ride Dashboard* frames, 2026-11-17): the Intervals plan
  *Descending recoveries* (30:00, 8 efforts at level 28 and 100 rpm) with the video *GCN Training ·
  30 Minute HIIT Cardio* (`https://www.youtube.com/watch?v=QUoToFsMNig`), its ride 0:00 lined up with
  0:12.0 of the video. The mid-ride moment is 11:42, *Work, round 3 of 8*, 0:18 left: 472 W against
  489 W, 97 rpm (aim 100), heart rate 162, avg power 172 W, 30.4 km/h, 4.61 km, 120 kcal. The invalid
  link is `https://vimeo.com/76979871`.
- **Class library** (*Video Library* and *Video Workout* frames, 2026-11-17): six classes on three
  shelves, as the default `classes.json` ships them (L2-077). Lengths, peaks and expected power are computed from each plan as the frames compute them.
  - *20 min* (“Short and sharp — fits a lunch break.”): *20 Minute Power Intervals* (Wattzup Studio,
    VO₂ max, 6 × 1:00 / 1:00 at 22 / 7, 20:00, ~207 W) and *20 Min Threshold Builder* (Wattzup Studio,
    Threshold, 4 × 2:00 / 1:00 at 19 / 10, 20:00, ~230 W).
  - *30 min* (“Structured intervals with a proper warm-up.”): *30 Minute HIIT Cardio* (GCN Training,
    HIIT, 8 × 0:30 · 3:00 → 1:30 recover at 24 / 6, 30:00, ~154 W, the only one with a link, cued at
    0:12.0) and *30 Min Tempo Paceline* (Wattzup Studio, Tempo, 4 × 6:00 / 2:00 at 17 / 11, 36:00).
  - *60 min endurance* (“Long aerobic rides. Steady legs, steady heart.”): *60 Min Dolomites
    Endurance* (Wattzup Scenic, Zone 2, Steady at level 12 for 1:00:00, 85 rpm) and *60 Min Coastal
    Endurance + Surges* (Wattzup Scenic, Endurance, 5 × 6:00 / 5:00 at 15 / 11, 1:00:00).
  - Covers are YouTube thumbnails (ADR 0014): the GCN card shows `i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg`;
    the five classes without a link show the poster. The frames' generated images stay in
    `assets/classes/` for the design-system examples only. The edited plan raises work to 26 and
    recover to 8 (~169 W, the estimate of ADR 0003). The ride started from the library is `ride/class-workout`: 11:42,
    work round 3 of 8, 409 W against 418 W, 98 rpm aim, at the library's levels.
- **Network-exposed server:** `192.168.1.20:8787`, with its API key set in
  `Wattzup:Security:ApiKey`.

Estimates follow the design's `estimateWatts`: watts = round(cadence × (0.55 + level × 0.155)).

## What is covered, and why it is about 50 files

Wattzup has three core screens: the machine picker, ride setup and the ride dashboard. Around them sit
an API-key unlock page, a 404 page, three dialogs and three notification families. That makes 11
screens and 71 mock files, 25 of them for the treadmill and the machine picker. This is below the 120–250 typical of a mid-sized product, because the product is small.

Some screens that most products have are deliberately left out:

- Sign up, sign in, password reset, account, billing and team screens: Wattzup is a single-user app
  on the rider's own machine with no accounts. Its only gate is the optional API-key unlock
  (L2-035).
- Notification centre and history: no requirement keeps notifications past the ride.
- 403 and 500 pages: an API failure is shown in place on the screen that made the request (ride
  `error`, setup `error`). A 401 sends the rider to `unlock`.
- Ride history: not in the specs. The 404 mock uses `/workouts/history` as its example of an
  unknown route.

## Open questions

Each item is a conflict between the Magic Patterns design and `docs/specs/`. The mocks follow the
design and add whatever the specs require. Each item needs a decision, and that decision updates the
specs, the detailed design or the mock.

1. **Power, heart rate, distance and energy are not in the specs.** The bike reports only cadence
   and resistance, plus speed derived from cadence (L2-005…L2-008). Power would be an estimate from
   `estimateWatts`, and heart rate needs a sensor Wattzup does not read. Either add requirements,
   label the figures as estimates, or drop them.
2. **Workout model.** The design has finite plans: an optional warm-up, rounds of work and recover,
   an optional cool-down, or one flat block. The specs define a list of steps (resistance level,
   duration) that repeats in cycles until it is stopped (L2-010, L2-011). The mocks show a finite
   plan with a total time.
3. **Pause and Resume** are in the design and not in the specs.
4. **Effort or recovery phase.** The design decides it by step kind (work or recover). The specs
   decide it by level: 20 and above is effort (L2-025). The default plan's work level is 18, which
   the specs would call recovery.
5. **The countdown.** The design shows the time left as numerals with a thin progress bar. The specs
   call for a large countdown ring drawn with WebGPU, falling back to WebGL2 and then Canvas 2D
   (L2-024, L2-028).
6. **The "Sent to bike" log** shows each resistance command with its source (plan or manual) and its
   ack latency. That needs backend events the state contract does not have (L2-014).
7. **Units.** The design leads with km/h and the specs lead with mph (L2-007). The mocks show km/h
   with mph beside it.
8. **History.** The full-ride "Power vs. plan" trace replaces the specs' 150-sample sparklines of
   resistance, speed and cadence (L2-022).
9. **Flat duration.** The design allows up to 180 min in one flat block, but the specs cap a step at
   3600 s (L2-010).
10. **Fonts.** The design uses Inter, Archivo (condensed, `wdth 72`) and JetBrains Mono. The CSP
    allows same-origin only, so the product must bundle them. The mocks use local fallback stacks
    and load no fonts.
11. **Contrast.** The design's faint text colour `#5b616a` fails WCAG AA on the dark panels. The
    mocks lift it to `#80868f`. In the light theme, volt text becomes olive `#4f6800`, while volt
    fills keep ink text.
12. **Added from the specs**, with no Magic Patterns frame, so their look was derived from the
    design:
    - the beeps toggle and the step-change banner (L2-027)
    - the scanning, Bluetooth-off and server-offline states (L2-001, L2-018, L2-039)
    - the ride-ended state (L2-013)
    - the diagnostics dialog (L2-023, L2-033)
    - the resistance toasts (L2-019, L2-020)
    - the API-key unlock page (L2-035)
    - the 404 page (L2-044)
    - the confirmations for ending and for replacing a ride (L2-013, L2-017)

13. **Treadmill frames, settled.** The treadmill mocks follow the frames *Choose Machine*, *Run Setup*
    and *Run Dashboard*. On 2026-11-16, L1-002, L1-013 and L2-062…L2-074 were rewritten to match them
    (ADR 0010), as were the protocol reference's limits and AGENTS.md's vocabulary. Two decisions changed
    the mocks rather than the specs:
    - The frame's *Safety key pulled* state is `ride/treadmill-belt-stopped`, worded so that it is
      true for both causes, because a pulled key and the console's stop button both report speed 0.
    - The bike's card shows its advertised name, not a made-up serial.

    Still open:
    - The *Lost the Stride* copy assumes the treadmill stops its own belt when the link drops. A person
      must confirm this on hardware before release (L2-043 criterion 5, ADR 0010).
    - Heart rate shows a value in the mocks, but `heart_rate` is always `null` (open question 1,
      ADR 0003).
    - The treadmill detailed designs, the backend and the frontend still follow the earlier specs and
      will be updated slice by slice.

14. **Video ride-along, settled 2026-11-17.** Mocks `setup/video`, `setup/video-invalid`, `ride/video`
    and `ride/video-blocked`; components `video-frame`, `video-sync` and `view-switch`, and the
    `--color-video-*` tokens. Specified in L2-010 criteria 14–17 (the plan's `video`), L2-014
    (`plan.video` is `{video_id, start_seconds}`), L2-029 criteria 17–21 (setup), L2-059 criterion 6,
    L2-036 criterion 4 (the CSP exception) and the new L2-076 (dashboard playback). ADR 0012 records
    the decisions:
    - The video belongs to the plan, so every open dashboard plays it and a reload keeps it.
    - The only third-party origin is `youtube-nocookie.com`.
    - The ride clock leads.
    The detailed design is still to be written.
15. **The frames' interval editor, settled in favour of the specs.** The 2026-11-17 *Training Setup*
    frame edits the GCN plan as a per-round ladder inside HIIT. L2-010 and L2-029 (already built) keep a
    separate **Intervals** mode with sets, which can build every plan the ladder can. The
    `setup/intervals*` mocks and the edit-set and edit-stretch dialogs are unchanged. The frame's preset
    name *GCN 30-min HIIT* is *Descending recoveries*.
16. **Treadmill support off, settled in favour of the specs.** The frames grey out the Stride card on
    *Choose Machine*. L2-073 criterion 11 redirects `/machine` to `/setup` instead, so no page shows that
    card. The Switch links are hidden in both. The video mocks show the support-off header and aside;
    the older bike mocks show the Switch links, which is the support-on look.

17. **Class library, settled 2026-11-17.** Mocks `class-library/*`, `class/*` and
    `ride/class-workout`; components `shelf`, `class-card`, `level-row` and the class-page layout in
    `docs/design-system/assets/components.css`. Requirements L1-014 and L2-077 to L2-080, ADR 0014.
    The bike lands on the library after Choose machine, End ride returns to it, and *Build your own
    ride* opens Set up your ride. The open questions were settled:
    - **Where the catalogue lives:** a JSON file the backend reads and serves read-only at
      `GET /api/classes` and `GET /api/classes/{id}` (L2-077, L2-078, ADR 0014). So
      `class-library/loading` and `error` do occur.
    - **Covers:** the YouTube thumbnail, built from the video id. The CSP admits exactly
      `img-src https://i.ytimg.com` (ADR 0014 amending 0012). A class without a link shows the
      poster.
    - **Shelves:** defined in the catalogue (id, title, tagline, order); each class names its shelf.
      *30 Min Tempo Paceline* stays on the 30 min shelf at 36:00, because the shelf is the owner's
      choice, not a length bucket.
    - **Start point:** steps by 0.5 s on the class page, as on setup (`Half a second earlier` /
      `later`).
    - **Invalid link:** Start ride stays enabled and rides without a video, as on setup (L2-029).
    - **The word:** a library entry is a *class*: `Ride a class`, `All classes`, `Reset to class`,
      routes `/classes` and `/classes/:id`. “Video” is only the YouTube video itself.

    Built on 2026-11-18 (`feat/class-library`): the catalogue file and its endpoints, the library at
    `/classes`, the class page at `/classes/:id`, and the bike landing on the library.

## Re-checking and re-screenshotting

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```

Screenshots go to `docs/mocks/.cache/`. That folder is ignored and is never committed.

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | paused | disconnected | scanning | bluetooth-off | offline | ended | flat | manual | edge | video | video-blocked | class-workout | treadmill | treadmill-paused | treadmill-flat | treadmill-manual | treadmill-countdown | treadmill-belt-stopped | treadmill-disconnected | treadmill-scanning | connecting | not-found | not-found-bike | filtered | no-link | invalid-link | edited | submitting | intervals | intervals-invalid | video-invalid | invalid | treadmill-invalid | treadmill-submitting | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ride dashboard (`ride`) | [✅](pages/ride/default.html) | [✅](pages/ride/loading.html) | [✅](pages/ride/empty.html) | [✅](pages/ride/error.html) | [✅](pages/ride/paused.html) | [✅](pages/ride/disconnected.html) | [✅](pages/ride/scanning.html) | [✅](pages/ride/bluetooth-off.html) | [✅](pages/ride/offline.html) | [✅](pages/ride/ended.html) | [✅](pages/ride/flat.html) | [✅](pages/ride/manual.html) | [✅](pages/ride/edge.html) | [✅](pages/ride/video.html) | [✅](pages/ride/video-blocked.html) | [✅](pages/ride/class-workout.html) | [✅](pages/ride/treadmill.html) | [✅](pages/ride/treadmill-paused.html) | [✅](pages/ride/treadmill-flat.html) | [✅](pages/ride/treadmill-manual.html) | [✅](pages/ride/treadmill-countdown.html) | [✅](pages/ride/treadmill-belt-stopped.html) | [✅](pages/ride/treadmill-disconnected.html) | [✅](pages/ride/treadmill-scanning.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-023`, `L2-024`, `L2-025`, `L2-026`, `L2-027`, `L2-040`, `L2-041`, `L2-001`, `L2-013`, `L2-039`, `L2-064`, `L2-066`, `L2-068`, `L2-071`, `L2-076` |
| Choose your machine (`choose-machine`) | [✅](pages/choose-machine/default.html) | [✅](pages/choose-machine/loading.html) | [✅](pages/choose-machine/empty.html) | [✅](pages/choose-machine/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/choose-machine/connecting.html) | [✅](pages/choose-machine/not-found.html) | [✅](pages/choose-machine/not-found-bike.html) |  |  |  |  |  |  |  |  |  |  |  | `L2-062`, `L2-063`, `L2-072`, `L2-073`, `L2-074` |
| Class library (`class-library`) | [✅](pages/class-library/default.html) | [✅](pages/class-library/loading.html) | [✅](pages/class-library/empty.html) | [✅](pages/class-library/error.html) |  | [✅](pages/class-library/disconnected.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-library/filtered.html) |  |  |  |  |  |  |  |  |  |  | `L2-077`, `L2-078`, `L2-079`, `L2-040`, `L2-041` |
| Class page (`class`) | [✅](pages/class/default.html) | [✅](pages/class/loading.html) | ➖ | [✅](pages/class/error.html) |  |  |  |  |  |  | [✅](pages/class/flat.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class/not-found.html) |  |  | [✅](pages/class/no-link.html) | [✅](pages/class/invalid-link.html) | [✅](pages/class/edited.html) | [✅](pages/class/submitting.html) |  |  |  |  |  |  | `L2-010`, `L2-029`, `L2-076`, `L2-078`, `L2-080`, `L2-040`, `L2-041` |
| Set up your ride (`setup`) | [✅](pages/setup/default.html) | [✅](pages/setup/loading.html) | ➖ | [✅](pages/setup/error.html) |  |  |  |  |  |  | [✅](pages/setup/flat.html) |  |  | [✅](pages/setup/video.html) |  |  | [✅](pages/setup/treadmill.html) |  | [✅](pages/setup/treadmill-flat.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/setup/submitting.html) | [✅](pages/setup/intervals.html) | [✅](pages/setup/intervals-invalid.html) | [✅](pages/setup/video-invalid.html) | [✅](pages/setup/invalid.html) | [✅](pages/setup/treadmill-invalid.html) | [✅](pages/setup/treadmill-submitting.html) | `L2-010`, `L2-029`, `L2-040`, `L2-041`, `L2-045`, `L2-059`, `L2-060`, `L2-062`, `L2-067`, `L2-072`, `L2-075`, `L2-076` |
| Unlock Wattzup (`unlock`) | [✅](pages/unlock/default.html) | ➖ | ➖ | [✅](pages/unlock/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/unlock/submitting.html) |  |  |  | [✅](pages/unlock/invalid.html) |  |  | `L2-035`, `L2-036` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-044` |

### Dialogs

| Screen | default | busy | invalid | failed | treadmill | scroll | Requirements |
|---|---|---|---|---|---|---|---|
| End ride (`end-ride`) | [✅](dialogs/end-ride/default.html) | [✅](dialogs/end-ride/busy.html) | ➖ | [✅](dialogs/end-ride/failed.html) | [✅](dialogs/end-ride/treadmill.html) |  | `L2-017`, `L2-066`, `L2-071` |
| Replace ride in progress (`replace-ride`) | [✅](dialogs/replace-ride/default.html) | [✅](dialogs/replace-ride/busy.html) | ➖ | [✅](dialogs/replace-ride/failed.html) | [✅](dialogs/replace-ride/treadmill.html) |  | `L2-013`, `L2-017`, `L2-066`, `L2-071`, `L2-072` |
| Edit set (`edit-set`) | [✅](dialogs/edit-set/default.html) | ➖ | [✅](dialogs/edit-set/invalid.html) | ➖ |  |  | `L2-010`, `L2-029` |
| Warm-up and cool-down (`edit-stretch`) | [✅](dialogs/edit-stretch/default.html) | ➖ | [✅](dialogs/edit-stretch/invalid.html) | ➖ |  |  | `L2-010`, `L2-029` |
| Diagnostics (`diagnostics`) | [✅](dialogs/diagnostics/default.html) | ➖ | ➖ |  |  | [✅](dialogs/diagnostics/scroll.html) | `L2-023`, `L2-033` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | treadmill-danger | effort | recover | countdown | treadmill | persistent | treadmill-info | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ride toast (`ride-toast`) | [✅](notifications/ride-toast/info.html) | [✅](notifications/ride-toast/success.html) | [✅](notifications/ride-toast/warning.html) | [✅](notifications/ride-toast/danger.html) | [✅](notifications/ride-toast/with-action.html) | [✅](notifications/ride-toast/stacked.html) | [✅](notifications/ride-toast/treadmill-danger.html) |  |  |  |  |  |  | `L2-016`, `L2-020`, `L2-027`, `L2-069`, `L2-071` |
| Step-change banner (`phase-banner`) | ➖ | ➖ | ➖ | ➖ |  |  |  | [✅](notifications/phase-banner/effort.html) | [✅](notifications/phase-banner/recover.html) | [✅](notifications/phase-banner/countdown.html) | [✅](notifications/phase-banner/treadmill.html) |  |  | `L2-027`, `L2-041`, `L2-071` |
| Connection banner (`connection-banner`) | [✅](notifications/connection-banner/info.html) | [✅](notifications/connection-banner/success.html) | [✅](notifications/connection-banner/warning.html) | [✅](notifications/connection-banner/danger.html) |  |  | [✅](notifications/connection-banner/treadmill-danger.html) |  |  |  |  | [✅](notifications/connection-banner/persistent.html) | [✅](notifications/connection-banner/treadmill-info.html) | `L2-018`, `L2-034`, `L2-039`, `L2-043`, `L2-066`, `L2-071` |

<!-- coverage:end -->
