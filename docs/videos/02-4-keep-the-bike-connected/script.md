# Transcript: Slice 2.4, Keep the bike connected

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

A ride lasts an hour. Telo Ride now keeps the bike talking, brings it back after a drop, and says how it is.

**status** (4 bars)

From a laptop's width up, the header names the bike, and a screen reader hears that it's connected.

**offline** (4 bars)

Until the bike connects, the status turns red, with its own icon and the title Bike not connected.

**keepalive** (4 bars)

Once the bike is paired, Telo Ride writes a keepalive about once a second, timed from the clock, not by counting ticks.

**drop** (4 bars)

If the bike drops, the keepalives stop, and every three seconds Telo Ride tries the same bike again, without the list.

**back** (4 bars)

When the bike comes back, it starts again, and the last target resistance goes before anything else.

**retry** (4 bars)

Reconnect tries at once, and every Bluetooth error goes to the console as its name and message, as plain text.

**radio** (4 bars)

If the computer's Bluetooth is off, Connect Bike says so, and Try again finds it once it's back on.

**deferred** (4 bars)

Still to come: the ride screens bring their Reconnect banners, and a worker ticker keeps the clock true in a hidden tab.

**shell** (4 bars)

The status shows from a laptop's width up. On a phone or a tablet, the header leaves it out.

**proof** (4 bars)

What the tests prove: thirty behaviour specs and ninety-one unit tests, all green.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
