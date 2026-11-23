# Transcript: Slice 3.1, Decode bike notifications

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Every number on a ride starts as a few bytes from the bike. Telo Ride now reads them.

**resistance** (4 bars)

A D2 frame carries the resistance. F0, D2, 01, 0C, CF is level twelve.

**cadence** (4 bars)

A D1 frame carries cadence, big-endian in bytes nine and ten. Zero, fifty hex is eighty rpm.

**ignored** (4 bars)

A frame that's too short, doesn't start with F0, is of an unknown type, or is a D0, is ignored, never an error.

**ftms** (4 bars)

An FTMS bike's flags say which fields follow. Speed, cadence, power and heart rate are read; the rest are skipped by size.

**estimate** (4 bars)

An Echelon reports no speed or power, so they're estimated. Eighty rpm is thirty kilometres an hour.

**reported** (4 bars)

An FTMS bike's own power and speed are used as they are. A field it leaves out falls back to the estimate, or a dash.

**stale** (4 bars)

If cadence stops for five seconds, cadence and power go blank, rather than show a number that's no longer true.

**deferred** (4 bars)

Still to come: slice 3.2 puts these numbers on screen, with distance and energy, and proves them end to end.

**shell** (4 bars)

Home doesn't change yet, at any width. The numbers wait in the engine for the ride screens.

**proof** (4 bars)

What the tests prove: forty-five new unit tests, one per row of the requirements, and every spec still green.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
