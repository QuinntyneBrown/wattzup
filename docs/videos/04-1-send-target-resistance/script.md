# Transcript: Slice 4.1, Send target resistance

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

The plan sets the hill. Telo Ride now sends each level as the bike's target resistance.

**frame** (4 bars)

For an Echelon, level twelve is F0, B1, 01, 0C, AE, written with a response. Level thirty-two ends in C2.

**clamp** (4 bars)

A target outside one to thirty-two is clamped before it's sent, and a fraction rounds to the nearest level.

**ack** (4 bars)

When the bike acknowledges the write, the time it took is kept with the command, in milliseconds.

**follows** (4 bars)

On the simulated bike, level fourteen goes out, and the very next resistance frame reports fourteen back.

**apart** (4 bars)

The target is the plan's level. The resistance is what the bike reports. Telo Ride keeps them apart.

**away** (4 bars)

If the bike is away, the target is kept, and sent before anything else when it's back.

**refused** (4 bars)

An FTMS bike that refuses control stays read only. Its telemetry goes on, and the controls switch off.

**deferred** (4 bars)

Still to come: raising and lowering by hand in slice 4.2, and the workout engine stepping the plan in 5.1.

**shell** (4 bars)

Home doesn't change yet, at any width. The targets go out from the engine, for the ride screens.

**proof** (4 bars)

What the tests prove: eleven new unit tests, one per row of the requirements, and every spec still green.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
