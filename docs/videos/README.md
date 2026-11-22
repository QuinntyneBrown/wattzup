# Telo Ride videos

One folder per video, one video per slice of [`docs/detailed-journeys.md`](../detailed-journeys.md),
made by the slice's prompt in [`docs/prompts/`](../prompts/README.md). The text files are the
source; the media is generated from them. Where this page differs from the defaults of the
`creating-videos` skill (edge-tts, burned-in captions, a slide per cue), this page wins: the films
follow the standard of the owner's sibling repository `popkin` (its `docs/videos/README.md`), with
the same tools, effects, transitions and motion, in Telo Ride's own brand.

| Slice | Video | Runtime | What it is |
|-------|-------|---------|------------|
| — | [Meet Telo Ride](00-meet-telo-ride/README.md) | 2:19 | The pitch, in the arc of popkin's *Meet Popkin*: another evening staring at the wall; meet Telo Ride; one press pairs the bike, and it is remembered; Chrome or Edge from 390 to 1440 px; then what comes next, drawn over the design system's photographs: Race against your ghost, bots or people, Classes alone or together, one progression of XP, levels, stars and unlocks, and a custom workout under Profile; the purpose
| 1.1 | [Frontend workspace](01-1-frontend-workspace/README.md) | 2:14 | One Angular workspace with `api`, `domain`, `components` and `ride` depending one way; lint failing on a wrong import and on Web Bluetooth outside `domain/src/bluetooth/`; Home in the app shell with the TELO Ride lockup and Home current; the design system's tokens and the bundled Barlow Condensed, Inter Tight and JetBrains Mono; Page not found with no current item and Back to Home; Skip to content; the shell from 390 to 1440 px; lazy chunks inside the bundle budget; six behaviour specs on the production build |
| 1.2 | [Backend skeleton](01-2-backend-skeleton/README.md) | 2:14 | Four .NET projects referencing only the layer before them; one MediatR request per action; liveness and readiness answering without a session, 503 while the database cannot be reached; 401 ProblemDetails for every other address without a session; 400 `validation_failed`, a domain rule's own code and 500 `unexpected`; OpenTelemetry on the `Telo.Ride` meter with no query string on a span; the `migrate` command; the app still riding on its own from 390 to 1440 px; sixteen acceptance tests through the API |
| 1.3 | [Test harness](01-3-test-harness/README.md) | 2:14 | The shared Playwright fixture: a fake `navigator.bluetooth` that records every write and pushes notifications, answers for the API, and a ride hub speaking SignalR's JSON protocol, each failing the spec on anything unexpected; `RideHub` with a real SignalR client against the API hosted in memory, refused without a session; a fake clock in every backend fixture and an event probe that never sleeps; Home inside the doubles from 390 to 1440 px; thirty checks |
| 1.4 | [CI and hosting](01-4-ci-and-hosting/README.md) | 2:14 | The API serving the app's build as one origin: a deep link answering the app with the L2-131 headers and `no-cache`, an unknown `/api` address answering 401 ProblemDetails, never the app; GitHub Actions running lint, the production builds and the critical paths in three parallel jobs, green in 1:24; the deploy that migrates before it ships; Home served as one from 390 to 1440 px; thirty-eight checks |
| 2.1 | [Ride a simulated bike](02-1-ride-a-simulated-bike/README.md) | 2:14 | Connect Bike in a development build opened with `?simulate`: an Echelon EX-5s paired with no chooser, then Home; the real `D1` and `D2` frames of the simulated rider's first seconds and a target resistance reported back and clamped; the production build swapping the simulator out, pairing through Web Bluetooth, and its initial bundle at 260.02 kB; Connect Bike from 390 to 1440 px; thirty-one checks |
| 2.2 | [Check browser support](02-2-check-browser-support/README.md) | 2:25 | Connect Bike's Works with list; its alert in a browser without Web Bluetooth, with Try again bringing the pair button back; the secure context checked first and the alert offering the same page over HTTPS; the API in production redirecting plain http with 308 and sending a year of HSTS; Connect Bike from 390 to 1440 px; forty-five checks |
| 2.3 | [Pair a bike](02-3-pair-a-bike/README.md) | 2:25 | One press opening the browser's list for the Echelon service or FTMS, with the hint about the Echelon app; a blocked list named with Try again; the card's name and identifier from what the bike advertises; the subscription and three initialisation writes in order; Pairing… then Paired; an FTMS bike asked for control; the bike remembered, reopening on Home without the list; Connect Bike from 390 to 1440 px; eighty-seven checks |
| 2.4 | [Keep the bike connected](02-4-keep-the-bike-connected/README.md) | 2:25 | The header's bike status from lg, connected and not; the keepalive once a second by the clock; a dropped bike tried every 3 seconds without the list, back with the target first; Reconnect and errors as text; Connect Bike with Bluetooth off; Home from 390 to 1440 px; a hundred and twenty-one checks |
| 3.1 | [Decode bike notifications](03-1-decode-bike-notifications/README.md) | 2:25 | An Echelon's D2 as resistance and D1 as cadence, byte by byte; the frames ignored; FTMS fields read by their flags; speed and power estimated, reported values used as they are; five quiet seconds blank cadence and power; Home from 390 to 1440 px; forty-five new unit tests |
| 3.2 | [Show live metrics](03-2-show-live-metrics/README.md) | 2:25 | Distance, output and energy from each running second, held while paused; unknown values as a dash and distance as 2.24 km; one source for three readout families; a minute on the simulated bike; Home from 390 to 1440 px; twenty new unit tests |
| 3.3 | [Show heart rate](03-3-show-heart-rate/README.md) | 2:25 | Heart Rate Measurement by its flags; a strap chosen by the Heart Rate service, remembered, and retried every 3 seconds after a drop; the strap first, then the bike, else a dash; five quiet seconds; average and peak; Home from 390 to 1440 px; twenty-five new unit tests |
| 4.1 | [Send target resistance](04-1-send-target-resistance/README.md) | 2:25 | The B1 frame; targets clamped to 1 to 32; the acknowledgement timed; the simulated bike reporting the target back; target and resistance kept apart; a level asked for during a drop sent first; an FTMS refusal; Home from 390 to 1440 px; eleven new unit tests |
| 4.2 | [Take over resistance](04-2-take-over-resistance/README.md) | 2:25 | Raise and lower one level, clamped; a nudge from the bike's resistance; a picked level; the plan again at the next segment; nothing by hand with the bike away; the last command's source; Home from 390 to 1440 px; seven new unit tests |
| 5.1 | [Workout engine and ride clock](05-1-workout-engine-and-ride-clock/README.md) | 2:25 | The monotonic ride clock; one tick a second; the plan's segments and state; each level sent at its boundary; nothing while paused; a hidden tab caught up; Home from 390 to 1440 px; twenty-four new unit tests |
| 5.2 | [Class ride screen](05-2-class-ride-screen/README.md) | 2:25 | The class ride at 7:00; the header and its clock; the segment card at 0:00 and 7:00; Power on and under target, Cadence; the stepper before and after the bike reports; the B1 writes; the class request; the bundle budget; 390 to 1440 px; four new specs |
| 5.3 | [Sync the class video](05-3-sync-the-class-video/README.md) | 2:25 | The class ride at 7:00 with its video; the clock leading the video by the offset; the player's options; the drift table; YouTube blocked, the notice and the ride carrying on; the lazy video library; the bundle; the fake player; 390 to 1440 px; four new specs |
| 5.4 | [Pause, leave or finish a class](05-4-pause-leave-or-finish-a-class/README.md) | 2:25 | The class ride paused at 7:00; the clock, the video and the stepper held; Resume from the same second; the bike lost and the alert with Reconnect; the bike back and the level sent again; the app's second beat; Leave to Class Start with no confirmation; the finish at 30:00 and Results; the wake lock and the leave guard; 390 to 1440 px; six new specs |
| 6.1 | [Class catalogue API](06-1-class-catalogue-api/README.md) | 2:25 | The class ride opened from the kept catalogue; the seven classes `GET /api/classes` lists; every class's video, offset, summary, world and plan; the plan rules; one class by its id and `class_not_found`; the public catalogue; the embedded file; the catalogue kept on the device; the ride with the backend answering 503; 390 to 1440 px; eight API tests |
| 6.2 | [Class library](06-2-class-library/README.md) | 2:25 | The Class Library at 1440 px; its head and three shelves; an open card's cover, length, profile and link; the Class length tabs by pointer and arrow key; the new rider's locked cards and their levels; a locked card that stays focusable; no catalogue and Try again; 390 to 1440 px; five behaviour specs |
| 6.3 | [Class Start](06-3-class-start/README.md) | 2:25 | 30 Minute HIIT Cardio's Class Start at 1440 px; its facts and ← Classes; what the bike will do and its weighted ~154 W; the video parked at 0:12; the video link and sync; Ride alone chosen and the group option that says why not; Start class into the ride; a locked address back to the library; 390 to 1440 px; seven behaviour specs |
| 7.1 | [Browse maps](07-1-browse-maps/README.md) | 2:25 | Map Select at 1440 px; the new rider's two open maps; the seven maps the backend serves; an open map's row; the next unlock ringed gold; locked maps and their goals; what a screen reader hears; the star rules; no catalogue and Try again; 390 to 1440 px; seven behaviour specs |
| 7.2 | [Set up a race](07-2-set-up-a-race/README.md) | 2:25 | Race Setup at 1440 px; the map's facts; the stars here; the goal line in gold; the three race modes; the arrow keys; pack strength; the two starts; a locked map's address; 390 to 1440 px; nine behaviour specs |
| 7.3 | [Ride a race](07-3-ride-a-race/README.md) | 2:14 | The race at 1440 px; the top bar; power against target; the interval and each segment's level; main's route profile; the virtual speed; Lower and Raise; 390 to 1440 px; ten behaviour specs |
| 7.4 | [Ghost and bots](07-4-ghost-and-bots/README.md) | 2:14 | Nine bots and the ghost; the pack's seeded pace; the standings board; 5th of 10 with the gaps either side; the rows' slide; You vs your best, Ahead or Behind; a race without a network; the board from a tablet up; seven behaviour specs |
| 7.5 | [Finish, pause or leave a race](07-5-finish-pause-or-leave-a-race/README.md) | 2:14 | Leave and End; Pause, held still; Resume or the pedals; a lost bike's coast, its DNF and a parked solo race; the finish line and the place; 390 to 1440 px; eleven behaviour specs |
| 8.1 | [Load the world library](08-1-load-the-world-library/README.md) | 1:54 | The world library in its own chunk; WebGPU or WebGL 2 and the bar's tag; the panorama where neither draws; leaving releases it; copied from main; 390 to 1440 px; three behaviour specs |
| 8.2 | [Draw the route world](08-2-draw-the-route-world/README.md) | 1:43 | main's scene behind the race: road, terrain and sky; the camera moves with the rider and holds when paused; five maps' worlds; copied from main; 390 to 1440 px; two behaviour specs |
| 8.3 | [Draw riders and ghost](08-3-draw-riders-and-ghost/README.md) | 1:43 | The race's riders in its world: nine bots in their jerseys, the ghost in translucent gold, a line each; main's cyclist kit; 390 to 1440 px; two behaviour specs |
| 8.4 | [Quality levels](08-4-quality-levels/README.md) | 1:43 | The race's world at Low, Medium and High; Ultra with WebGL 2 drawn at High; every race opens at Low, as main's does; 390 to 1440 px; three behaviour specs |
| 8.5 | [Step down when frames drop](08-5-step-down-when-frames-drop/README.md) | 1:43 | The frame period measured; two slow 2-second windows drop a level, very slow frames straight to Low, never raised; main's frame budget; 390 to 1440 px; two behaviour specs |
| 8.6 | [Panorama and hidden tab](08-6-panorama-and-hidden-tab/README.md) | 1:43 | The panorama where nothing can draw; a hidden tab draws no frame while the race runs on, a fix to main's scene; drawing again on return; 390 to 1440 px; two behaviour specs |
| 8.7 | [Real-world scenery](08-7-real-world-scenery/README.md) | 1:43 | The real Bruges offered while the world draws; the key to Google and this device only; refused, the world stays; streaming credits Google; 390 to 1440 px; six behaviour specs |
| 9.1 | [Request an email code](09-1-request-an-email-code/README.md) | 1:54 | Sign-in sends a code and the code screen counts down; a bad address sends nothing; a failed send keeps the email; 5 an hour per address, 20 per network; 202 for everyone; 390 to 1440 px; seven backend and seven behaviour specs |
| 9.2 | [Verify and stay signed in](09-2-verify-and-stay-signed-in/README.md) | 2:04 | Six digits confirm at once, typed or pasted; wrong, expired and locked codes refused; a year-long sliding session in an HttpOnly cookie; every screen sends a visitor to sign-in and back; an unreachable backend never blocks; seven backend and nine behaviour specs |
| 9.3 | [Choose a display name](09-3-choose-a-display-name/README.md) | 1:54 | A new account is asked for a display name before going on; 2 to 24 characters, said plainly; one rule kept by the backend; Profile's headline and a Settings dialog that changes it; backend tests and nine behaviour specs |
| 9.4 | [Sign out and delete account](09-4-sign-out-and-delete-account/README.md) | 1:54 | Sign out ends this device's session at once, or says it couldn't; Delete my account waits for "delete", ends every session, frees the email and is erased within a day; sign-in says so; seven backend and six behaviour specs |
| 10.1 | [Record a ride](10-1-record-a-ride/README.md) | 1:43 | A finished race or class submits its facts as it ends; the backend records each ride id once, answers a repeat with the first answer, and refuses a ride no one could ride with 422; 42 backend cases and three behaviour specs |
| 10.2 | [Earn XP](10-2-earn-xp/README.md) | 1:33 | The ride sends its share of seconds on target; the backend gives L2-037's XP lines, adds them to the rider's total once per ride id, and keeps them with the ride; 26 backend cases and one behaviour spec |
| 10.3 | [Rider levels](10-3-rider-levels/README.md) | 1:30 | The total XP makes a level from 1 to 30 by LevelTable; the ride answers the level and whether it went up; GET /api/progress feeds the header's level link and Profile; 40 backend cases and one behaviour spec |
| 10.4 | [Keep a streak](10-4-keep-a-streak/README.md) | 1:30 | Each ride records its calendar day in its time zone on the rider's streak; the XP line, the header's flame and Profile's line give one number; 0 after a missed day; 16 backend cases and one behaviour spec |
| 11.1 | [Results screen](11-1-results-screen/README.md) | 1:56 | Results opens when a race or class ends, from the result it hands over: the place in volt on the podium or how far off it, the final standings with the rider current and bots marked, a solo race's time, a class's kJ and share on target; Done, Race it again with its mode and pack, Ride it again |
| 11.2 | [XP, stars and personal best](11-2-xp-stars-and-personal-best/README.md) | 2:00 | Results shows the backend's answer: XP earned line by line after a waiting state, the stars held on the map and new ones, a solo race's new personal best or best; offline it says XP comes back online, and a refused ride earned none; MapProgress and StarRules on the backend |
| 11.3 | [Celebrate an unlock](11-3-celebrate-an-unlock/README.md) | 1:58 | The backend names the map a ride opened (top 3 vs bots, stars, level 10) once; Results shows a gold card, Neon Docklands is open, that fades in, grows and brings its photo into colour, or only fades with reduced motion; no card when nothing opened |
| 12.1 | [Earn stars and unlock maps](12-1-earn-stars-and-unlock-maps/README.md) | 1:55 | GET /api/progress answers the open maps, next unlock, stars and bests; Map Select and Race Setup read them in place of the new-rider stand-in: the mid rider's Neon Docklands next, the veteran's Col du Granit, a map a ride opened ready in Race Setup, bests in minutes |
| 12.2 | [Open class tiers](12-2-open-class-tiers/README.md) | 1:52 | The backend leaves out a class whose tier is not 1, 5, 10 or 20; the Class Library and Class Start read the rider's level from GET /api/progress: three classes open at level 1, Tempo Paceline at level 7, all but the level-20 class at level 18 |
| 13.1 | [App header](13-1-app-header/README.md) | 1:50 | Full screen at the end of the app header, Exit full screen while in it, absent without the Fullscreen API; each shell page marks its own item; the phone's own row of navigation |
| 13.2 | [Choose the next ride](13-2-home-next-ride/README.md) | 2:06 | Home's greeting by the time of day or a new rider's welcome; the Next ride card for the mid rider, a new rider, a level goal and every map open; the Race door's counts and tiles; the Classes door's featured class with Ride alone; the gold banner shown once |
| 13.3 | [Show the profile](13-3-show-the-profile/README.md) | 1:51 | Profile's headline with the level, an XP bar named by the XP, the rides, kilometres and streak, for the mid rider and a new rider; Settings with the bike and its state, Ride settings and Custom workout before the account rows; No bike yet to Connect Bike |
| 14.1 | [Connect to the ride hub](14-1-connect-to-the-ride-hub/README.md) | 1:53 | A group class ride holding one connection to the ride hub with the session cookie; the clock offset from five ServerTime calls; reconnecting at once after a drop and measuring again; a solo ride and Home holding none |
| 14.2 | [Group session schedule](14-2-group-session-schedule/README.md) | 1:54 | Group sessions every 15 minutes on the quarter hours, ten seats each; Class Start offering the next with its riders and Join, the full and starting sessions; the Class Library's group chips; all read every 30 seconds |
| 14.3 | [Join a group session](14-3-join-a-group-session/README.md) | 1:54 | Join opening the group ride, which takes a seat through the ride hub with its jersey; a full or started session sending the rider back to Class Start with the next one offered; a reconnect keeping the same seat |
| 14.4 | [Start together](14-4-start-together/README.md) | 1:41 | A group ride holding at 0:00 with its video parked under "Starts in 9:00"; the clock and the video starting together at the session's server time; a late rider riding from the session's time |
| 14.5 | [Live group board](14-5-live-group-board/README.md) | 1:54 | The group ride with its live output board: every rider ranked by output, the rider's place and own row, the board sliding the rider up after the next standings, beside the video or below it |
| 15.1 | [Race lobby](15-1-race-lobby/README.md) | 1:56 | Race Setup counting the riders queuing, and the riders-online lobby: seated by the service, You first, counting down to the session's start, a rider leaving with a notice, and bots filling the grid at 0:10, beside the clock or below it |
| 15.2 | [Start a live race](15-2-start-a-live-race/README.md) | 1:43 | The lobby's countdown, 3, 2, 1 and Go over the inert lobby at every width, and the race in its session, its clock on the session's server-time start however late it opened |
| 15.3 | [Live standings](15-3-live-standings/README.md) | 1:43 | A riders-online race's board from the service's standings, the rider 5th then 4th, each gap to the rider, the race reporting its distance, and the board at every width |
| 15.4 | [Mark leavers and DNF](15-4-mark-leavers-and-dnf/README.md) | 1:43 | A riders-online race's leaver marked DNF in last place on every board at once, silent and lost riders caught, and the board at every width |
| 15.5 | [Record results nobody can change](15-5-record-results-nobody-can-change/README.md) | 1:43 | A riders-online race's places, times and output recorded by the service and taken by every submitted ride, Results waiting while the result is pending, at every width |
| 16.1 | [Download the world](16-1-download-the-world/README.md) | 1:56 | World loading before a solo class: the world downloaded with its bytes, saved on the device, resumed after a stop, built by `main`'s renderer, or ready as a panorama without 3D, at every width |
| 16.2 | [Build shaders and warm up](16-2-build-shaders-and-warm-up/README.md) | 1:56 | World loading's programs built in batches and counted, the warm-up's frame rate at Low, and after 20 seconds the warning with Start at Low quality and Ride with the panorama, at every width |
| 16.3 | [Start a solo world class](16-3-start-a-solo-world-class/README.md) | 1:56 | World loading waiting for the bike with Connect bike, Start riding once the world and the bike are ready, and the class ride in its world, faded in, with the video in the corner, at every width |
| 16.4 | [Join a group world class](16-4-join-a-group-world-class/README.md) | 1:56 | World loading counting down to the group's start with the action off, the class ride starting with everyone on the panorama, the world fading in when ready, and the lost-bike alert when there is no bike, at every width |
| 17.1 | [Ride outbox](17-1-ride-outbox/README.md) | 1:56 | Results with the XP pending for a ride finished without a network, the ride kept on the device, sent oldest first and tried again after 30 seconds then a minute, and recorded, at every width |
| 17.2 | [Cache the app](17-2-cache-the-app/README.md) | 1:56 | A solo race started with no network once the app had been opened, the service worker's caches, Map Select's covers offline and the registration kept out of the first bundle, at every width |
| 17.3 | [Offline choices](17-3-offline-choices/README.md) | 1:56 | Riders online and group classes closed with their reason the moment the browser goes offline, Bots or Ride alone chosen in their place, and both open again online, at every width |
| 18.1 | [Lose the service mid-ride](18-1-lose-the-service-mid-ride/README.md) | 1:56 | A riders-online race and a group class riding on through a lost service with their last standings and a notice, rejoining, and the service's standings arriving at once, at every width |
| 18.2 | [Keep the ride clock true](18-2-keep-the-ride-clock-true/README.md) | 1:56 | A race and a class ride shown again after ten throttled minutes in a hidden tab with the clock, segment and distance of a visible tab, and a running race asking before the tab closes, at every width |
| 19.1 | [Bundle budgets](19-1-bundle-budgets/README.md) | 1:41 | Home's first load measured gzipped at 89.77 kB after every build, a tight raw budget, and the 3D world's code arriving only with a race, at every width |
| 19.2 | [Bounded ride buffers](19-2-bounded-ride-buffers/README.md) | 1:41 | A three-hour class ridden to its end, its ride submitted with one speed sample a second from a buffer set aside once, at every width |
| 19.3 | [Heap checks](19-3-heap-checks/README.md) | 1:41 | The heap checks a person runs: the race with its world and a class ride entered and left six times, and a three-hour class, at every width |
| 19.4 | [Web vitals and frame budget](19-4-web-vitals-and-frame-budget/README.md) | 1:41 | The performance checks a person runs on the device measured: Home's LCP and INP on a phone profile over 4G, and the race's frame rate at 1920 × 1080, at every width |
| 20.1 | [Settings page and store](20-1-settings-page-and-store/README.md) | 1:41 | Settings at `/settings` from Profile: five sections and their nav, a change applied at once and kept on this device, Reset to recommended, the warning under refused storage, at every width |
| 20.2 | [World quality controls](20-2-world-quality-controls/README.md) | 1:41 | Settings' World section: Quality cards with Auto first, step-down, frame rate, resolution and graphics API, the no-WebGPU and no-3D states, and a race opened at Medium, at every width |
| 20.3 | [Check this device](20-3-check-this-device/README.md) | 1:41 | Check this device on Settings: trials off screen from the top level down, the level found kept on this device and where Auto then starts, stopped or hidden keeping nothing, at every width |
| 20.4 | [Sound, motion and display](20-4-sound-motion-and-display/README.md) | 1:56 | Settings' Sound and Motion and display: ride sound from the pedalling with no audio while off, world music, quiet under a class video, reduce motion, the theme, Large ride numbers on a race and full screen on start, at every width |
| 20.5 | [Manage saved worlds](20-5-manage-saved-worlds/README.md) | 1:43 | Settings' This device: the saved worlds' number, size and names, Clear saved worlds with its toast, Keep worlds after a ride, and an evicted world downloading again, at every width |
| 21.1 | [Set up a custom workout](21-1-set-up-a-custom-workout/README.md) | 1:41 | Custom workout under Profile: the training mode, GCN 30-min HIIT and four other plans, the ladder's rounds stepped, added, removed and made the same, the levels, warm-up and cool-down, and flat resistance, at every width |
| 21.2 | [Preview a custom workout](21-2-preview-a-custom-workout/README.md) | 1:54 | Your ride beside Custom workout: the total, the resistance profile and the facts for GCN 30-min HIIT and flat resistance, following every change, and Ride along to a video synced from the preview player, at every width |
| 21.3 | [Ride a custom workout](21-3-ride-a-custom-workout/README.md) | 2:06 | The custom ride: the plan sets the bike's level every interval, with the interval card, Power vs. plan, the video in sync, the bike control and Sent to bike, flat resistance, the workout saved for next time and a refused plan, at every width |
| 21.4 | [Pause, leave or end](21-4-pause-leave-or-end/README.md) | 1:56 | The custom ride stops when the rider does: Pause and Resume, a lost bike, waiting for a bike, Bluetooth off, Leave this ride? under Library, End and a ride too short to save, at every width |
| 22.1 | [Authenticate every request](22-1-authenticate-every-request/README.md) | 2:03 | Every endpoint and the ride hub need a session unless listed: sign-in and sign-out, the public catalogues, health and the app; 401 for the rest, proved by asking every endpoint; a change or hub connection from another origin refused with 403 `cross_origin`; sign-in from 390 to 1440 px; 488 backend tests |
| 22.2 | [Validate input and encode output](22-2-validate-input-and-encode-output/README.md) | 1:53 | A validator on every request with input; 400 `validation_failed` naming the field for a broken rule or a wrong type, with no type name; the ride hub refusing the same way; a bike named with markup shown as text on Connect Bike and in the header; lint refusing `[innerHTML]` and sanitiser bypasses; 390 to 1440 px |
| 22.3 | [Limit abuse](22-3-limit-abuse/README.md) | 1:53 | The 61st ride in an hour refused with 429 and `Retry-After`, rides counted not requests; the outbox sending the ride again when the wait has passed; two progress messages a second on the hub, the rest dropped and a client over for 10 s disconnected; 390 to 1440 px |
| 22.4 | [Restrict third parties](22-4-restrict-third-parties/README.md) | 1:53 | The built API's policy and headers, written once; a tracker's script and call home refused in the page; every spec run under the policy, failing on a refusal; a static policy; a sign-in leaving nothing of the rider's in telemetry; 390 to 1440 px |
| 23.1 | [Fit every width](23-1-fit-every-width/README.md) | 1:53 | Fifteen screens fitting 320 and 2560 px; the custom ride's clock and buttons wrapping at 320 px; page margins of 16, 24 and 32 px and an 80 rem container; the responsive sweep a person runs; 390 to 1440 px |
| 23.2 | [Touch and keyboard](23-2-touch-and-keyboard/README.md) | 1:56 | 44 px tap areas drawn over Settings at 390 px; the 34 controls the first run missed; the class ride's 48 px header and the custom ride's 48 px squares; the focus ring on Home and a class card at 1440 px; the focus style taken out for one run; Settings from 390 to 1440 px |
| 23.3 | [Screen readers and motion](23-3-screen-readers-and-motion/README.md) | 1:56 | What a screen reader hears as the custom ride's first work starts and as Results opens; the leave dialog keeping the focus with the app inert; the interval bar stilled under reduced motion; Results from 390 to 1440 px |
| 24.1 | [Switch theme](24-1-switch-theme/README.md) | 1:40 | Home on dark and light phones; the light device's dark first paint failing and fixed; three 4.48:1 text pairs brought past 4.5; Settings' Theme; a ride in light; Home in light from 390 to 1440 px |
| 24.2 | [Full screen](24-2-full-screen/README.md) | 1:40 | The race bar's Full screen and Exit full screen; a class ride, Results, Connect Bike and Class Start with it; the spec's failures without the API; Race Setup from 390 to 1440 px |

## What every video is

- **Narrated.** A warm voice explains what is on screen. The voice is Kokoro-82M from Hugging Face
  (`onnx-community/Kokoro-82M-v1.0-ONNX`), run locally with `kokoro-onnx`: free, no key, read from
  the Hugging Face cache or downloaded once into `.cache/kokoro`. The voice is `af_heart`;
  `"voice"` in `narration.json` picks another. No paid or hosted speech service.
- **Set to boom bap.** A beautiful boom bap instrumental from Pixabay Music plays from the first
  frame to the last, turned down under the voice and up between lines. See [Music](#music).
- **No captions by default.** Nothing is burned into the picture. `captions.vtt` is written beside
  the MP4, so a player can show captions to someone who needs them; `--captions` burns them in when
  a video asks for it.
- **Branded.** Every frame is a Telo Ride frame: the tokens of
  `docs/design-system/tokens/tokens.css` (ink and signal, with panel, bone, blue and gold as the
  app uses them), the TELO Ride lockup and logo mark of the app header, Barlow Condensed for
  headlines and numbers (the wordmark's wide italic) and Inter Tight for words, with JetBrains Mono
  for code, all read from the bundled fonts in `docs/design-system/assets/fonts/` through
  `tokens.css`. The mark sits in the corner of every scene between the opening and the close. No
  other brand's colours, faces or marks appear.
- **Picture-led.** Screenshots of the running app carry the film. A scene holds a headline of two
  to six words with one in the accent colour, a number or a label; it never transcribes the
  narration. A screenshot takes at least 60 % of the width, over a field of a brand colour or a
  photograph of the bike, never a small picture on an empty background.
- **Moving.** Scenes change with designed transitions, on the beat of the music.
- **True.** It shows and says only what the branch does, in the words of `docs/specs/`. The close
  quotes Telo Ride's purpose from `AGENTS.md` word for word, on screen and in the voice.

Format: 1920×1080, 30 fps, H.264 with AAC audio, 60 to 150 seconds, under about 15 MB.

## Folder

```
docs/videos/S-s-slice-name/
  narration.json     the lines, their scenes and the voice                     (written)
  film.js            the scenes: markup and the functions that move it         (written)
  slides.html        the page that plays the film                              (written)
  shots.ts           which states of the app to open and what to save          (written)
  README.md          what the video shows, its run sheet, what it proves       (written)
  script.md          the transcript                                            (written)
  shots/             the screenshots, PNG at double density                    (generated, committed)
  timing.js          the scene grid and the lines in film time, read by the deck (generated, committed)
  captions.vtt       captions in film time, a sidecar file                     (generated, committed)
  S-s-slice-name.mp3   voice and ducked music                                  (generated, committed)
  S-s-slice-name.mp4   the film                                                (generated, committed)
```

A Telo Ride folder is named as the slice's prompt is: `S-s` is the slice's number in
`docs/detailed-journeys.md`, the journey's two digits and the slice's (slice 1.1 is `01-1`), and
`slice-name` the slice's title in lower case with hyphens. Slice 1.1, Frontend workspace, is
`docs/videos/01-1-frontend-workspace/`, with `01-1-frontend-workspace.mp4` and
`01-1-frontend-workspace.mp3`, the same name as `docs/prompts/01-1-frontend-workspace.md`.
`narration.wav` and anything under `.cache/` are never committed.

Shared by every film, in `docs/videos/assets/`:

| File | What it is |
|------|------------|
| `film.css` | The stage: the brand's fields, type, device frames, close-ups and cards. |
| `film-runtime.js` | The clock: scenes on the bar grid, `seek(seconds)`, word rises, wipes, the growing screen, the WebGL aurora and confetti. |
| `film-kit.js` | The moves every film makes: devices arriving, close-ups popping in, counters, fact cards, a terminal for checks no screen shows, the opening and the close with the purpose, the act transitions (a wipe, a push, a zoom through a screenshot) and the brand mark in the corner. |
| `music/` | The tracks and their [credits](assets/music/CREDITS.md). |

## Tools

| Tool | What it does |
|------|--------------|
| [`tools/video-record/`](../../tools/video-record/README.md) | Opens the app in Chromium and runs a folder's `shots.ts`, saving `shots/`. |
| [`tools/video-audio/`](../../tools/video-audio/README.md) | Speaks `narration.json` with Kokoro, fits each line to its scene, mixes the music under it, writes the MP3, `captions.vtt` and the timing the film reads. |
| [`tools/video-build/`](../../tools/video-build/README.md) | Opens `slides.html`, seeks it frame by frame, and encodes the MP4 with ffmpeg. `--check` prints the schedule, `--frame <seconds> <png>` saves one frame, `--captions` burns captions in. |

They need Node with the Playwright copy in `frontend/node_modules` (`cd frontend && npm ci`),
Python 3.10 or later with `kokoro-onnx` and `numpy`, and ffmpeg with libx264 (`FFMPEG_PATH`
overrides). Set up once, from the repository root:

```shell
python3 -m venv .cache/video-venv
.cache/video-venv/bin/pip install kokoro-onnx numpy
```

Then, for a folder:

```shell
node tools/video-record/record.mjs docs/videos/S-s-slice-name
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/S-s-slice-name
node tools/video-build/build.mjs docs/videos/S-s-slice-name
```

None of them is part of a test run, and CI never runs them.

## Screenshots

- **From the running app, never from the mocks.** `shots.ts` uses the fixtures and page objects of
  `frontend/e2e/`: it imports `test` from the shared fixture in `frontend/e2e/fixtures/`, opens
  screens through the page objects and drives the bike through the fake `navigator.bluetooth`, as
  in every spec; no real Bluetooth adapter and no bike are involved.
- **It is not a test and not a sweep.** `tools/video-record/` only borrows Playwright to drive
  Chromium on its own port (4310). It compares nothing and is not run by `npm run e2e` or CI.
- **Every form factor the journey changes on.** Take each key state at 390 px (XS), 768 px (M),
  1024 px (L) and 1440 px (XL), at double density, in the dark theme the app opens in, and one
  state in the light theme where the journey is about it.
- **Close-ups.** Small text is unreadable at 1080p. Save a `detail` (or `detailAll`) shot of the
  region the line is about and enlarge that, instead of zooming a full-page screenshot.
- **Vary the layout.** No two scenes in a row share a layout or a field: headline left and screen
  right, then a full-width browser window, then a phone over a field of signal, then a close-up alone.
  Acts change colour.

## Slides and motion

- **Every pixel is a pure function of film time.** `slides.html` plays live against the MP3 and
  exposes `seek(seconds)`; the builder seeks it frame by frame. Nothing uses CSS animation, CSS
  transition, `setTimeout` or `Math.random()` without a seed.
- **Cut to the music.** The film's grid is the track's tempo, measured with
  `tools/video-audio/tempo.py` (boom bap sits around 85 to 95 BPM, a bar of about 2.5 to 2.8 s). A
  scene is a whole number of bars; cuts, word rises and transitions start on a beat, often on the
  snare.
- **Transitions are designed, and few.** A change of act gets a transition from `film-kit.js`: a
  wipe in a brand colour, a push, or a zoom through a screenshot into the next screen; a phone
  growing into a desktop window is the form-factor scene's own. Inside an act the cuts are hard.
  One flourish a scene is enough.
- **Show the form factors moving.** One scene shows the same screen growing from the phone to the
  desktop.
- **The aurora opens and closes the film** behind the lockup, in ink, signal, blue and gold. It is
  the only shader.

## Narration

- Two sentences a scene is plenty; leave a beat of music between lines. Second person, warm,
  concrete. No filler, no marketing tone. It must make sense with eyes closed.
- The shape: a hook in the first six seconds; the slice on screen (most of the film); the form
  factors; one card for what the tests prove that no screen shows; the close, with the lockup and
  the purpose. A platform slice with little UI films what it made visible: the app shell at each
  width, and the checks it added running, drawn as a terminal of their real output.

## Music

- **Source.** Pixabay Music, search "boom bap": a beautiful, mellow instrumental with a steady
  head-nod beat (dusty drums, warm keys or strings, no vocals), clear enough to be heard quietly.
- **Keep it in the repository.** Save it as `docs/videos/assets/music/<slug>.mp3` and add a row to
  [`CREDITS.md`](assets/music/CREDITS.md): title, artist, the track's Pixabay URL, the date it was
  downloaded and "Pixabay Content License".
- **Mix.** One bar of music alone before the first word, the music about 16 dB under the voice and
  back up between lines, three seconds of music alone at the end, faded out; about −16 LUFS.
- **If Pixabay cannot be reached,** do not synthesise a substitute and do not use a track of
  unknown licence. Build the film with the voice alone and write "Music: pending" at the top of the
  video's `README.md`.

## Check before committing

- `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height <mp4>` gives
  1920×1080, `h264` and `aac`, and a duration that matches the MP3.
- Save one frame per scene with `--frame` and look at each: nothing clipped, small text readable,
  no blank frame, the brand on every frame.
- Add the video's row to the table at the top of this page.
