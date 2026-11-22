# Transcript: Slice 22.1, Authenticate every request

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Every request to Telo Ride needs a signed-in rider, unless it is on a short, written list.

**list** (5 bars)

The list: sign-in and sign-out, the public class and map catalogues, the health checks, and the app itself. Each is marked anonymous where it is mapped.

**refused** (4 bars)

Everything else answers 401 without a session, as ProblemDetails, never a redirect.

**every** (5 bars)

A new test asks every endpoint the API maps, the ride hub included. Mark rides anonymous by mistake, and it fails.

**origin** (5 bars)

A change must also come from Telo Ride itself. The browser marks where each request came from, and a page cannot change that mark.

**forged** (5 bars)

A change from another site is refused with 403, cross origin, before it reaches the rider's data. So is a hub connection.

**widths** (4 bars)

Riders see nothing new: sign-in still opens, from a phone to the full screen.

**proof** (4 bars)

Four hundred and eighty-eight backend tests pass, on a host in memory, with no real database.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
