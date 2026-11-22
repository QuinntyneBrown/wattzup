# Transcript: Slice 22.3, Limit abuse

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

A smart bike at home should never be able to flood the service. Telo Ride now limits what one rider, or one connection, can send.

**rides** (5 bars)

Sixty rides an hour is the most one rider records. The sixty-first is refused with 429, and Retry-After says how long to wait.

**counted** (5 bars)

It counts rides recorded, not requests: sending the same ride again still gets its first answer, and costs nothing.

**outbox** (5 bars)

On the device, the ride waits. Results says the XP is on its way, and the outbox sends the ride again once the wait has passed.

**hub** (5 bars)

On the ride hub, two progress messages a second get through. The rest are dropped, and a client over the limit for ten seconds is disconnected.

**gate** (4 bars)

The app itself sends at most one every half second, so a rider never meets the limit.

**widths** (4 bars)

Results, waiting, from a phone to the full screen.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
