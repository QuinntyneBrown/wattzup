# Transcript: Slice 1.2, Backend skeleton

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Telo Ride gets a backend, kept thin: only what one browser cannot do alone. It never talks to the bike.

**layers** (4 bars)

Four projects: domain, application, infrastructure and the API. Each references only the layer before it, so the compiler holds the direction.

**path** (4 bars)

Every request takes one path. A controller checks nothing: it sends one MediatR request, its validators run, then its handler.

**health** (4 bars)

Two health endpoints answer without a session. Live says the API responds. Ready says Unhealthy, with a 503, while the database cannot be reached.

**auth** (4 bars)

Every other address needs a signed-in rider. Without a session, the answer is 401, as ProblemDetails, never a redirect.

**refusals** (4 bars)

Every refusal carries a code a screen can branch on: validation failed, a domain rule like session full, or unexpected, which reveals nothing.

**telemetry** (4 bars)

Telemetry is OpenTelemetry, with Telo Ride's own counter on the Telo Ride meter. A span names its route by template, never the query string.

**migrate** (4 bars)

The schema changes only through migrations, applied by the migrate command before a new version starts. The API never migrates on start-up.

**shell** (4 bars)

Riders see nothing new yet. The app still rides on its own, on a phone, a tablet, a laptop or a desktop.

**proof** (4 bars)

What the tests prove: sixteen acceptance tests through the API, on a real host in memory, with no real database, no file and no sleep.

**close** (12 bars)

The picture and the captions quote the purpose in AGENTS.md word for word, as below; the voice
reads the third sentence's parentheses as pauses ("Race, ride a map against your best-time ghost,
bots or people; and Classes, …").

Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval. Two doors: Race (ride a map against your best-time ghost, bots or people) and Classes (ride along to a video, alone or with a group), fed by one progression of XP, rider levels, stars and map unlocks. A custom workout lives under Profile.
