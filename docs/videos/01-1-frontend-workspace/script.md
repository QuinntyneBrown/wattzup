# Transcript: Slice 1.1, Frontend workspace

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

Telo Ride starts here: one Angular workspace, and the ride app it builds.

**workspace** (4 bars)

The frontend holds three libraries, api, domain and components, and one application, ride. Ride
uses all three. Domain uses api. Api uses nothing.

**lint** (4 bars)

Import against that direction and lint fails. And only domain's bluetooth folder may touch
navigator dot bluetooth.

**home** (4 bars)

Start the app and Home opens in the app shell. The Telo Ride lockup links home, and the main
navigation marks Home as the current page.

**tokens** (4 bars)

Every colour is a token from the design system. Barlow Condensed, Inter Tight and JetBrains Mono
ship with the app, never from a CDN.

**notfound** (4 bars)

An address that matches no screen says so, with no current item in the header. Back to Home opens
Home.

**keyboard** (4 bars)

On a keyboard, the first Tab reaches Skip to content, and Enter moves focus straight to the page.

**sizes** (4 bars)

The same shell fits a phone, a tablet, a laptop and a desktop. On a phone, the navigation takes
its own row.

**budget** (4 bars)

Every screen is its own chunk, loaded on demand, and the build fails if the first download
outgrows its budget.

**proof** (4 bars)

What the tests prove: six behaviour specs run against the production build, and any page error,
or any request off this machine, fails them.

**close** (12 bars)

The picture and the captions quote the purpose in AGENTS.md word for word, as below; the voice
reads the third sentence's parentheses as pauses ("Race, ride a map against your best-time ghost,
bots or people; and Classes, …").

Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike
over Bluetooth, reads your power and sets resistance for every hill and interval. Two doors: Race
(ride a map against your best-time ghost, bots or people) and Classes (ride along to a video,
alone or with a group), fed by one progression of XP, rider levels, stars and map unlocks. A
custom workout lives under Profile.
