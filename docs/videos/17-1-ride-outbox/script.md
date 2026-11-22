# Transcript: Slice 17.1, Ride outbox

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

A finished ride now waits on the device until the backend has it, network or not.

**pending** (5 bars)

Without a network, Results shows the ride with its XP pending, and the ride is kept in IndexedDB.

**order** (5 bars)

When the app is next open online, waiting rides are sent one at a time, the oldest first.

**retry** (5 bars)

While the backend stays out of reach, the ride is tried again after thirty seconds, then a minute, up to an hour.

**recorded** (5 bars)

Once the backend records it, the XP fills in and the ride is removed from the device.

**widths** (5 bars)

The pending ride, from a phone to the full screen.

**proof** (4 bars)

What the tests prove: kept on the device, sent oldest first, retried with growing delays, and removed.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
