# Transcript: Slice 3.3, Show heart rate

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Heart rate belongs beside power. Telo Ride now reads it, from a strap or from the bike.

**decode** (4 bars)

A heart rate measurement starts with flags. Bit zero clear means one byte of beats per minute; set means two.

**chooser** (4 bars)

Choosing a strap opens the browser's list, filtered to the heart rate service, then subscribes to its measurements.

**remembered** (4 bars)

The strap is remembered. Next time, where the browser allows it, Telo Ride reconnects without the list.

**drop** (4 bars)

If the strap drops, its reading goes blank, and Telo Ride tries it again every three seconds until it's back.

**source** (4 bars)

The strap's reading comes first, then the bike's. With neither, the readout shows a dash and says no heart rate.

**quiet** (4 bars)

A source that's quiet for five seconds stops counting, so a stale heartbeat never stays on screen.

**stats** (4 bars)

Each running second adds to the ride's average and peak heart rate: two numbers and a count, never a trace.

**deferred** (4 bars)

Still to come: Settings connects a strap in slice 20.1, the ride screens show it, and saved rides keep it.

**shell** (4 bars)

Home doesn't change yet, at any width. Heart rate waits in the engine for the ride screens.

**proof** (4 bars)

What the tests prove: twenty-five new unit tests, one per row of the requirements, and every spec still green.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
