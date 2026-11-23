# Transcript: Slice 2.1, Ride a simulated bike

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook** (4 bars)

No bike beside the desk? Telo Ride can now ride a simulated one, so every feature can be built and tested without hardware.

**nobike** (4 bars)

Open a development build with simulate, press Pair, and an Echelon EX-5s pairs at once, with no browser chooser.

**states** (4 bars)

Connect Bike searches from the rider's click, pairs, shows a check, and moves on to Home half a second later.

**frames** (4 bars)

Once connected, the simulator sends a workout frame and a resistance frame every second, encoded exactly as a real bike's.

**resist** (4 bars)

A new target resistance is parsed back and reported by the next frame. Above thirty-two, it clamps, as the bike would.

**production** (4 bars)

In a production build, the simulator provider is swapped for an empty one at build time, so simulate is simply ignored.

**chooser** (4 bars)

Not one byte of the simulator reaches riders. Pairing goes through Web Bluetooth, and the card shows the bike the browser offered.

**bundle** (4 bars)

The bike link loads with the first screen, not the first download, so the initial bundle stays at two hundred and sixty kilobytes.

**shell** (4 bars)

Connect Bike fits a phone, a tablet, a laptop or a desktop, with the bike's photo beside the pair button.

**proof** (4 bars)

What the tests prove: seventeen unit tests on the frames and resistance, and fourteen behaviour specs, all green.

**close** (12 bars)

The picture and the captions quote the purpose in AGENTS.md word for word, as below; the voice
reads the third sentence's parentheses as pauses ("Race, ride a map against your best-time ghost,
bots or people; and Classes, …").

Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval. Two doors: Race (ride a map against your best-time ghost, bots or people) and Classes (ride along to a video, alone or with a group), fed by one progression of XP, rider levels, stars and map unlocks. A custom workout lives under Profile.
