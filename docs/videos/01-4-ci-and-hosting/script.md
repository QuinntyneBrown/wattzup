# Transcript: Slice 1.4, CI and hosting

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Telo Ride now has a home on the web, and every push is checked before it gets there.

**origin** (4 bars)

One App Service runs the API, and the API serves the app. One site, one origin, so the session cookie is same-site.

**deeplink** (4 bars)

Open any route directly and the app answers, never cached stale, with the security headers riders need.

**guarded** (4 bars)

Addresses under API, hubs and health stay the backend's. Without a session, a 401, never the app.

**pipeline** (4 bars)

On every push, three jobs run side by side: lint, the production builds, and the critical acceptance paths.

**run** (4 bars)

The first run, on cold caches, went green in one minute twenty-four, well inside the five-minute limit.

**critical** (4 bars)

One critical path per feature: two Playwright specs and five backend cases. Unit tests stay on the developer's machine.

**deploy** (4 bars)

On main, the deploy publishes the API with the app inside, migrates the database, and only then ships.

**shell** (4 bars)

Riders get the same app, served by its own backend, on a phone, a tablet, a laptop or a desktop.

**proof** (4 bars)

What the tests prove: twenty-six backend tests, eight of them on hosting, and twelve behaviour specs, all green.

**close** (12 bars)

The picture and the captions quote the purpose in AGENTS.md word for word, as below; the voice
reads the third sentence's parentheses as pauses ("Race, ride a map against your best-time ghost,
bots or people; and Classes, …").

Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval. Two doors: Race (ride a map against your best-time ghost, bots or people) and Classes (ride along to a video, alone or with a group), fed by one progression of XP, rider levels, stars and map unlocks. A custom workout lives under Profile.
