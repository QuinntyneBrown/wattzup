# Transcript: 00 · In-Browser AI Possibilities

The words of [`narration.json`](narration.json), scene by scene. The voice is Kokoro `af_heart`.

**hook**

What happens when you ship Telo Ride with free, open-weight Hugging Face AI models running right inside the browser?

Fifty-five features, zero cloud API bills, and not a single byte of your ride ever leaves the device.

**why**

Local AI fits Telo Ride's architecture like a glove. Zero per-token cost keeps the dot net backend thin. Self-hosted weights keep voice, video and telemetry strictly on-device. Cached models keep working offline.

And because Web Bluetooth already requires Chrome or Edge, every rider lands on the two strongest browser AI runtimes on Earth. The one hard rule: never starve Three J S during an hour-long tablet ride.

**platform**

Modern Chrome and Edge hand us an entire AI compute stack. WebGPU accelerates heavy math up to a hundred times, while WebNN routes models straight onto a laptop's NPU.

The Origin Private File System caches gigabytes of weights for instant offline loads. AudioWorklet filters fan noise off the main thread, and the Compute Pressure API throttles AI if a tablet heats up.

Best of all, cross-origin isolation with credentialless unlocks multi-threaded WebAssembly without breaking YouTube class iframes.

**models**

Every model in this study is free and open-weight from Hugging Face, quantized to four-bit or eight-bit ONNX so it fits inside a browser tab.

Silero voice detection is two megabytes. MoveNet pose is six. Micro embeddings are seventeen. Chronos fatigue forecasting is twenty. Moonshine speech recognition is thirty, and Kokoro studio speech is eighty-five.

Compact language models like SmolLM2 and Qwen3 sit between two hundred and three hundred fifty megabytes, reserved for pre-ride and post-ride screens.

**voice**

Domain A: the hands-free voice cockpit. When you are drenched in sweat at a hundred and five RPM, touching a tablet breaks your rhythm.

A tiny Hey Telo wake word guards against fan hum and heavy breathing. Say resistance up two, match plan, or pause ride, and Moonshine turns speech into Bluetooth commands locally.

Ask how much climb is left, launch a race on Ibiza while clipping in, edit a custom workout aloud, or dictate a mid-ride bug report without losing your place.

**kart**

Domain B brings Telo Ride's kart-racing soul to life. Kokoro eighty-two million powers a live play-by-play announcer calling climbs, overtakes and final sprints.

Bot racers get distinct personalities and playful banter, pre-generated during the lobby countdown and placed in 3D space with Web Audio panners so a passing bot sounds right beside you.

Add victory fanfare on map unlocks, cadence-adaptive music energy, world-matched crowd swells, ghost time-split taunts, and multilingual callouts for Alpe d'Huez or Strade Bianche.

**coach**

Domain C turns raw one-hertz Bluetooth telemetry into personal coaching. A cadence-lock micro-coach spots drift patterns and warns you ten seconds before the next hill.

Chronos-Bolt forecasts your sustainable power and fatigue over the next five minutes on CPU alone. A resistance nudge advisor learns your comfort offset, while the star-unlock strategist budgets your cadence stage by stage.

Pair a heart-rate strap for cardiac drift alerts, race a calibrated Rival Pack for photo finishes, and read a three-bullet coaching debrief on Results.

**discover**

Domain D makes a hundred worlds and custom workouts effortless. Describe a twenty-five-minute Tabata pyramid in plain English, and Qwen3 emits schema-valid workout JSON every single time.

A seventeen-megabyte embedding model powers offline mood search across every class and map in eight milliseconds. Paste a YouTube description to draft a synced workout plan.

Get a personalized Home recommendation, vibe-to-world matching, pre-ride course scout briefings, arcade stage titles, and natural-language search over your ride history.

**vision**

Domain E unlocks optional local camera vision from the handlebar mount. Every frame is processed in a Web Worker and discarded at once—zero video ever leaves your device.

Six-megabyte MoveNet detects standing versus seated climbs and mirrors your posture onto your 3D cyclist. Lean your shoulders to steer into corners and draft.

Use silent hand gestures for pause, kudos or resistance nudges, run a private pre-ride bike-fit check, catch shoulder tension creep, or send lightweight avatar emotes without streaming video.

**social**

Domain F upgrades social and multiplayer rides without bloating the backend. Local moderation pre-checks display names and notes instantly before submission.

Group-ride quick-chat translates across languages on-device. After a race, generate shareable highlight story cards with your elevation profile and stars.

In the lobby, a local announcer turns countdown wait time into hype, while a rival engine recommends whether to chase your ghost or step up to hard bots.

**diag**

Domain G puts local AI to work on hardware reliability and accessibility. On Diagnostics, click explain this Bluetooth log to diagnose Echelon keepalive drops or resistance lag completely on-device.

When reporting a bug, a local summarizer condenses ten thousand packet lines into a clean, privacy-scrubbed incident summary.

For blind and low-vision riders, a spatial race narrator turns corners, gradients and overtakes into calm audio cues—while the Compute Pressure auto-governor protects smooth frames for the whole hour.

**narrative**

Domain H weaves AI into long-term progression. Bots remember past duels across sessions, building arcade rivalries without adding a single backend table.

An optional audio tour guide shares ten-second landmark stories on rides like Caribana Parade, Amsterdam Canals and Havana Malecon. A streak-saver suggests short recovery spins on busy nights, and Profile builds four-week training blocks.

Feature fifty-five ties everything together: one unified Race Director worker—just a hundred forty-three megabytes total—coordinating voice, telemetry, forecasting and optional vision.

**audit**

Next, we stress-tested all fifty-five findings across five iterative passes. The biggest win: collapsing fifty-five features onto just six shared models, and shifting static embeddings, beat grids and class cues to build time.

To protect Three J S on tablets, zero large language models are allowed to run on WebGPU mid-ride. Heavy text generation stays strictly on pre-ride and post-ride screens.

We also explicitly rejected five anti-features: mid-ride chatbot conversations, runtime 3D mesh generation, cloud speech recognition that leaks audio, webcam medical diagnosis, and shipping any AI weight in the initial bundle.

**arch**

In the Angular workspace, everything lives inside one lazy library: frontend projects AI, depending only on the API tokens and dynamically imported only when a rider opts in.

Three J S owns the main thread; ONNX Runtime Web runs in a dedicated AI Web Worker backed by synchronous OPFS storage, an AudioWorklet noise gate, and the Compute Pressure governor.

Model weights are mirrored on Telo Ride's own origin for strict privacy. Ride Settings manages AI packs beside saved worlds with one-click delete, Playwright tests run against a fake worker, and three ADRs gate the rollout.

**packs**

Rather than one giant download, riders choose modular opt-in packs. Pack zero is zero megabytes: the thermal governor and Chrome built-in AI adapter.

Pack one, around a hundred seventeen megabytes, unlocks the full Voice Cockpit, Kart Announcer and spatial accessibility narrator. Pack two adds seventeen-megabyte semantic search and the custom workout generator.

Pack three brings twenty-two-megabyte Chronos coaching, Pack four adds multilingual safety, and Pack five unlocks eighteen-megabyte saddle vision—starting with semantic search as our cleanest first vertical slice.

**canary**

Finally, what is coming next in Chrome and bleeding-edge Chrome Canary? Chrome's Multimodal Prompt API feeds audio, images and JSON schemas directly into bundled Gemini Nano—zero megabytes for Telo Ride to ship.

Built-in Writer, Rewriter, Proofreader, Summarizer and Translator APIs handle recaps, logs and chat natively. WebMCP lets Telo Ride register typed cycling tools so browser agents control rides cleanly.

WebNN NPU offload takes mid-ride AI completely off the GPU, WebGPU fp16 and subgroups double throughput, and developers can test it today in Chrome Canary with four flags and twenty-two gigabytes free.

**waterfall**

Telo Ride never requires Chrome Canary. Behind one AI runtime token, it runs a clean three-tier progressive waterfall.

Tier A uses Chrome's zero-download built-in AI and WebMCP when available. Tier B offloads Hugging Face ONNX models onto an NPU through WebNN.

And Tier C runs portable Hugging Face ONNX over WebGPU or WebAssembly with OPFS—delivering offline, private AI on every Chrome, Edge and Android tablet.

**close**

Telo Ride. Local AI, zero cloud bills, your bike now a game.

Telo Ride, from the Telo family, turns a smart bike at home into a game.

It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.

Two doors: Race, ride a map against your best-time ghost, bots or people; and Classes, ride along to a video, alone or with a group; fed by one progression of XP, rider levels, stars and map unlocks.

A custom workout lives under Profile.
