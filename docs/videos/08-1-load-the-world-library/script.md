# Transcript: Slice 8.1, Load the world library

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Every map is a route through a world. This slice loads that world behind the race.

**chunk** (4 bars)

The world is the heaviest part of the app, so it loads in its own chunk, only once a race opens. Three.js never joins the first download.

**tag** (4 bars)

Three.js draws with WebGPU where the browser grants an adapter, and WebGL 2 otherwise. A tag in the bar names the GPU API drawing this world.

**panorama** (4 bars)

With neither, the map's panorama stays, and the race still runs on the numbers.

**leave** (4 bars)

Leave, and the world goes with the race: the frame loop stops, its observer and listeners go, and the renderer is released.

**main** (4 bars)

Its code is copied straight from main: the renderer's contract, the frame scheduler, the canvas host, and their unit tests.

**shell** (4 bars)

From a phone to a desktop, the race keeps its world behind the panels.

**proof** (4 bars)

What the tests prove: three new behaviour specs, main's unit tests running here, all green, and the first download still small.

**close** (12 bars)

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
