# Transcript: Slice 5.1, Workout engine and ride clock

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

A class is a plan on a clock. Telo Ride now steps through the plan, and sends each segment's level to the bike.

**clock** (4 bars)

The ride clock is performance dot now since the start, less the time paused. It never counts timer ticks.

**ticker** (4 bars)

A ticker wakes at each whole second of that clock, and publishes it once. Every countdown moves together.

**plan** (4 bars)

The plan is a list of segments: warm-up, work, recover. Each has a duration, a level and a cadence aim.

**state** (4 bars)

At any moment of the clock, the plan says where it stands: the segment, its time left, and its target power.

**boundary** (4 bars)

When a segment starts, its level goes to the bike as the target resistance, within half a second.

**paused** (4 bars)

While the ride is paused, the clock stands still. No segment changes, and nothing is sent.

**hidden** (4 bars)

Hide the tab for ten minutes, and the browser slows its timers. On return, the ticker catches up at once.

**deferred** (4 bars)

Still to come: the class ride screen in 5.2, the video in 5.3, and pause, leave or finish in 5.4.

**shell** (4 bars)

Home doesn't change yet, at any width. The engine waits for the class ride screen.

**proof** (4 bars)

What the tests prove: twenty-four new unit tests, one per row of the requirements, and every spec still green.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
