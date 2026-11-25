# Render the race world

## Overview

Every map is a route through a 3D world. During a race the world fills the screen behind the
HUD and moves with the rider: the camera sits at the rider's place on the route and travels
forward at the rider's virtual speed. Other riders appear at their places in their jersey
colours; the ghost appears translucent gold.

> **world** — lit, textured 3D scene of one map's route, drawn behind the race HUD

> **renderer tag** — label in the race top bar naming the GPU API that draws the world, "WebGPU" or "WebGL 2"

> **panorama** — still photograph of a map's world, shown when the browser can draw neither WebGPU nor WebGL 2

> **real-world scenery** — optional photorealistic 3D Tiles of a real place, streamed from Google Maps Platform with the rider's own key

The world is the heaviest part of the app. It loads only when a race opens, in its own lazy
chunk, and releases every GPU resource when the race ends. It draws with WebGPU where the
browser grants an adapter and with WebGL 2 otherwise, through one Three.js `WebGPURenderer`
(ADR 0020, ADR 0021). It stops drawing while the tab is hidden; the race clock and telemetry
carry on regardless (L2-133). Its detail is scaled to the device, cheap forms of each technique
first (AGENTS.md, Low-power rendering).

Some maps follow a real place. On those maps a scenery panel offers to stream the real place as
photorealistic 3D Tiles with a Google Maps Platform key the rider pastes. The key stays in the
browser and goes only to Google's Map Tiles API. If Google refuses the key, the built-in world
stays.

### Adelaide Hills on the Willunga road

Use the standard course gearing for a listed distance of 17.11 km. This places the final two work stages across the full 3 km Old Willunga climb. Their original durations and cadence targets also determine the road lengths of all other stages at that gearing. The summit marks the start of the GCN cool-down.

The Adelaide world already specifies summer lighting, heat haze, grade and bends. Before this course was added, the Adelaide map fell through to the generic road. The catalogue now resolves its world to the authored Willunga course and opening panorama. The original class is *HIIT Fat Burn With Mitchelton-Scott*, preserved in `frontend/public/classes.json` at commit `a9be36f6a`. Its warm-up, each work and recovery, cool-down, cadence aims and target resistance supply the course stages.

The Race catalogue names the map. `MapRenderer` resolves its world through `course-worlds.ts` and loads the Blender GLB and centre line through `CourseRenderer` (ADRs 0034–0035). The existing renderer owns scene disposal and stage alignment. Low keeps the outlines of each landmark. The scene groups repeating vine faces and pale posts in spatial chunks with vertex-colour shade at the bases. The distant gulf is visible through gaps on the high ground.

| Rider view | Visible cues and art direction | Reference files in docs/worlds/adelaide |
| --- | --- | --- |
| Opening through the village | Sandstone church, verandahs and pale-trunked gums frame the vanishing point. Keep the spire visible above the HUD. | real-01, 02, 07–10, 13–15 and game-01, 04 |
| Moving between vineyards | Rows converge over the rise. Alternate leaf and post silhouettes against sun-dried grass. White edge lines and a gravel shoulder keep bends readable. A blue gulf sits behind the distant fields in midday haze. | real-03–06, 14 and game-02, 04–05 |
| Hill crowd and expo | The tall inflatable cycle and broad orange canopy rise above the barrier. Separate hat brims, camper vans and coolers by silhouette. Leave a clear racing line. | real-11–12 and game-01–03 |

Compare rider-height captures with `docs/screenshots/caribana/README.md` iterations 007 (landmark silhouette), 025 (sun and haze), 070–072 (vertex occlusion) and 098 (surface wear). Measure the busiest climb separately if the opening 60 s cannot reach it. L2-064 AC6–7 apply to the built-in course; optional streamed scenery remains governed by L2-066.

### Aguascalientes Velodrome

The original world supplied a light preset and training terrain. Map Select now includes the pursuit race. The course registry resolves it to the authored oval and the starting-straight capture supplies its panorama. The original GCN *Olympic Pursuit Efforts* is recorded in `frontend/public/classes.json` at commit `a9be36f6a`. The catalogue uses its recorded time, cadence and target resistance for each stage. On the velodrome, banking runs across the timber surface. The course follows the measurement line around the oval and the rider sees the other straight across the infield.

In a solo pursuit the ghost starts 125 m round the oval from the rider. The replay distance drives its position from that start line on every lap. The board and HUD use the race clock, including after a pause. Two suspended timing faces share one texture updated when the displayed second or lap changes. The official’s bell is mounted beside the home straight.

One authored arena serves every lap. The course centre line repeats for the distance prescribed by the class. Split the track into straights, entry transitions and banked bends. Reuse the same spatial geometry and materials on every lap, and dispose of them with the course. The dark rail and bright apron frame the near edge, officials and team bikes occupy the middle ground, and far seats sit under the continuous open-span roof. Vertex colour under the track rail, seat risers and roof trusses provides shade without an extra shadow pass.

| View from the saddle | Reference intent |
| --- | --- |
| Starting straight | Real 01, 04, 10, 11 and 15 show the low pursuit riding position and plank seams. Games 03–05 show where text and coloured boards remain visible around a rider HUD. |
| Banked turn | Real 02, 03, 05–07 and 12–14 show apron width, stripe separation, turn profile, fencing and the bowl in wide view. Games 01–03 inform legibility at speed. |
| Opposite straight | Real 01, 08, 09 and 12–14 distinguish the building setting, infield access, pit barriers and overhead fixtures. Keep a lap counter, timing display and spectators visible beyond the apron. |

The [world brief](../../../worlds/aguascalientes/README.md) identifies the local details. The indoor references include comparable venues. Preserve the Aguascalientes setting when interpreting them. Compare the actual race with Caribana’s depth layering, surface wear, colour-baked occlusion and geometry batching on the same low-tier tablet profile (L2-064, L2-065, L2-159 and L2-160).

### Algarve Cliffs

The existing Algarve light preset and grade profile establish late afternoon and rolling terrain. The map lacks a catalogue entry, an authored course and a fallback panorama. Restore the schedule from *Get Fit in 40* in the class catalogue at `a9be36f6a`. Map Select opens the race with that plan. The renderer resolves the map’s world to the Blender course, loads the road mesh and centre line on entry, and uses the captured starting road as the fallback. L2-064–066 and L2-159–160 apply.

| View | What the rider sees | References |
| --- | --- | --- |
| Opening above Carvoeiro | Blue-trimmed white houses and terracotta roofs step uphill above the beach. The road turns past umbrella pines and an ochre dirt path. | Real 05–07, 09–11 and 14. Game 01 and 02 show road-edge separation and silhouette scale. |
| Ponta da Piedade and Praia da Marinha | A low wall opens onto a pale beach. Eroded sandstone pillars have dark recesses under pale horizontal beds. The rider can see water through the arch, with small painted boats offshore. | Real 01–03, 08, 12 and 13. Game 03–04 inform framing beside a large moving rider. |
| Benagil and the cape | The course rounds the cave’s open crown. A red lantern above a white lighthouse carries the eye toward the headland while blue water and a distant coast remain below. | Real 04 and 15. Game 05 informs the readable outline against the horizon. |

Use original silhouettes, merged static materials and seeded scrub. Bake shallow ledge shade into rock vertices. Hold the offshore stacks and lighthouse visible beyond the roadside detail window. The boat movement should follow ride time and freeze on pause. Fit the sea, cliff and road heights to the same centre line so an effort adds climbing without letting the road leave its headland. Keep landforms recognizable at Low. Measure submitted frames as well as display callbacks during a moving sample across the cove. Dispose through the course renderer on exit. The route compresses several Algarve landmarks into one ride.

### Alpe d’Huez

The existing world profile sets the light and a generic repeating bend. The actual race needs a catalogue entry, distinct switchbacks along the length of the course and a panorama. Map Select loads the race for the GCN *Elevate Your Climbing Power* class, recovered from `a9be36f6a`. The class clock preserves its stages. Power moves the race rider up the road. The final cool-down continues through the resort.

| Rider viewpoint | Course design | Evidence |
| --- | --- | --- |
| Valley and the first ramp | Bourg-d’Oisans on the valley floor, lower trees and campers beside the first wall, pale kerb and a readable sign for bend 21. Paint follows the tarmac. | Real 01, 02, 10 and 14. Games 01–03 inform corner markings and approach scale. |
| Bend 7 | A wall on the outside of the bend, motorhomes and flags above it. Orange-clad spectators line the inside by Saint-Ferréol. Leave the church visible through the moving smoke. | Real 03–09 show crowd spacing, writing and flags. Real 11 informs the church silhouette. |
| Resort approach | Changing elevation reveals lower stretches of road and the Oisans valley. Distant snow-streaked ridges remain in view behind timber chalets and the lift. | Real 12–15 and games 04–05 show the contrast and depth between green foreground and distant snow. |

One centre line carries the 21 bends. Give each sign and its hairpin the same course distance in the source so they stay aligned through a layout change. Use the original winners attached to the bends. The official tourism records identify the stage winners and the church at bend 7. [Alpe d’Huez stage winners](https://www.alpedhuez.com/fr/activites/activites-ete/velo/les-vainqueurs-du-tour-a-lalpe-dhuez/) · [Oz-en-Oisans route guide](https://www.oz-en-oisans.com/summer/discover/our-must-haves/the-21-bends-of-alpe-dhuez/)

Batch roadside spectators by location. Keep the snowy ridge separate so it stays visible across the valley. The opening, Dutch Corner and upper resort views retain the existing race HUD. Compare the low-detail profile against Caribana’s near crowds and separate skyline. Time the moving world around Dutch Corner and release the models with the course.

### Amsterdam Canals

The existing AmsterdamStreet scene contains the Westertoren, the three gable profiles, an angler, cyclists, planted arks and moving tour boats. Riders praised its look and the way it rides in [#903](https://github.com/QuinntyneBrown/wattzup/issues/903). The backend catalogue lacks an Amsterdam race. Use the existing views in [the rendering history](../../../screenshots/amsterdam/README.md) as the baseline. Map Select opens Herengracht. The course loader requests the Blender model and centre line on entry (ADRs 0030, 0034 and 0035). The nine stages recovered from catalogue revision `a9be36f6a` supply 20 minutes and 8 km of riding. Keep the canal level across bridge approaches by shaping the raised pavement independently.

| View from the saddle | Proportions and detail to retain | References |
| --- | --- | --- |
| Opening quay | Show water between the bike rail and opposite houses. Let the elm canopy frame the cornices. Each frontage is only a few sash windows wide. | Real 01, 03, 05–07, 09 and 10. Game 01 for the opening across water, games 02 and 04 for house height behind the rider. |
| Moving along the moorings | Low, planted ark roofs leave the opposite shore visible. An open launch and a glass tour boat clear the arches. Dapple the red path and preserve the dark three-cross bollards. | Real 10–13. Games 03 and 05 for contrast around a moving cyclist. |
| Bridge approach | Separate the brick arch, its reflection, the iron rail and the moving everyday cyclists. Keep whole bicycle silhouettes at the nearest railing and simplify the distant rows. | Real 02, 04, 08, 13–15. Games 01, 03 and 04 for the approach sightline. |

As at Caribana, bake static wear, contact shadows and far façades into batched geometry. Keep the skyline separate. Time resident traffic from the ride clock, freeze secondary motion for reduced motion, and release the scene with the race. Measure the opening and a moving bridge sample on Low/WebGL 2 with the standard 4× CPU throttle, 9-second warm-up and 60-second ride. Record actual rendering, intervals, draw calls, moving distance and device alongside paired HUD captures.

### Els Àngels, Girona

The existing class scene recycles a wooded climb past a masia. Earlier rider views show the town nearly hidden by trees, and document a fix that held the Pyrenees still as the road turned. Preserve the stripped cork trunks, white bend posts and fixed horizon. Give the start its own riverfront and bring the sanctuary up to rider scale at the finish. [Earlier views](../../../screenshots/angels/README.md)

Map Select takes the rider through Race Start into the lazy course renderer. The backend catalogue and Blender input share the 22 archived stages of GCN’s *Drop Ollie at All Costs*, video `yOJ56kSnsQw`, with a three-second offset. The 40-minute course covers 17.05 km at the prescribed cadences. Sample the same centre line for the road, roadside walls, training groups and camera so all four follow the grade through a bend.

| Rider viewpoint | Source and art direction |
| --- | --- |
| Onyar riverfront | Real 13–14 show coloured, closely packed homes reflected beneath the cathedral. Separate the water, stepped roofline and tower in depth. Game 02 uses a lit road edge to reveal the exit of a bend. |
| Masies and forest | Real 01–03 and 05 give the scale and spacing of groups. Real 09–12 distinguish bare cork trunks, rounded oaks, umbrella pines and ochre farm walls. Game 01, 03 and 05 show how to frame a rider against trees without obscuring the road. |
| Open bends | Real 07–08 layer the Gavarres beyond the sunlit shoulder. Keep the Pyrenees on a fixed background mesh. Use metre stones and hand-painted names to mark progress. Game 04 keeps the horizon readable above the riders. |
| Sanctuary | Real 04 shows a pale, plain gable, round opening and framed portal beside a long building. Real 06 supplies the shaded terrace. Open the trees to a view of the coastal plain using real 15. |

Bake original vertex-coloured masonry, canopy shadows and distant hills. Merge static objects by material and section. Keep a bounded training group, updated from elapsed ride time and removed with its geometry on exit. On Low retain the cathedral, sanctuary, group, road paint and open views. Take paired rider screenshots at town, forest and summit. Measure submitted and display frames through separate 60-second samples at the town and training group on Low, recording p95, longest interval and draw calls. [Reference credits](../../../worlds/angels/SOURCES.md)

### Angkor Temples

The earlier World Ride scene has tiered towers, lotus flowers, monks, tuk-tuks and tall dipterocarps. Its first pass obscured the temple in fog. Keep the taller trees riders singled out, with the broad crown above long, exposed trunks, and preserve an opening across the water. [Rider feedback #929](https://github.com/QuinntyneBrown/wattzup/issues/929) · [Earlier rider view](../../../screenshots/angkor/README.md)

Map Select serves Temple Road from the catalogue. Race Start loads the world library, which loads the Blender centre line and mesh only when the race opens. The archive at `a9be36f6a` records 17 stages for *60 Minute Reverse Pyramid* (`7gxwfezzqdQ`, three-second sync offset). Its stages total **59:00** at the recorded durations and 25.15 km at their target cadences. Retain the published class title. Preserve the actual stages.

| View | Geometry and lighting at rider height | References |
| --- | --- | --- |
| Moat and Angkor Wat | Offset the five tapered towers so the side pairs read separately against the opening sky. Mirror their dark bases below a level waterline and keep mist close to the surface. | Real 04, 05 and 07. Game 01 demonstrates the clearance around a landmark behind a cyclist. |
| Jungle road | Alternate tall trunks and dense understory along narrow tarmac. Leave red dust at both shoulders. Reveal monks, small stalls and moving road users between trees. | Real 02, 03 and 15. Games 02, 04 and 05 show road width and openings under dense canopy. |
| South Gate and Bayon | Frame the opening with two guardian rows and naga rails. Model the brow, eyelids, projecting nose and mouth as broad planes that catch the dawn light. | Real 01, 06, 08–11 and 14. Games 01 and 03 show the sightline with a cyclist in the foreground. |
| Ta Prohm | Carry pale flaring roots over stone lintels and down the broken sandstone coursing. | Real 12–13. Game 05 shows how intersecting trunk silhouettes read in motion. |

Keep campus landmarks fixed in the middle distance. Bake distant silhouettes, stone recesses and reflections. Bound the number of moving road users, share the static materials, and release GPU resources when the rider leaves the race. Compare HUD-visible opening, moving and gate views with the earlier ride. The benchmark uses separate one-minute moving samples after a nine-second warm-up with CPU throttled 4× at 1024 × 768, DPR 1, Low/WebGL 2. Record submitted frame intervals independently of display callbacks. [Reference credits](../../../worlds/angkor/SOURCES.md)

### Angliru

The class scene already has grooved slabs, painted words, fans, flags, livestock, a hórreo and drifting mist. Its visual history records an earlier correction from flat slabs of fog to soft cloud. Keep the cloud soft and the pasture open. The race needs a continuous, measurable ramp, identifiable camper vans, kilometre signs and a summit distinct from the earlier looping corridor. [Earlier rider view](../../../screenshots/angliru/README.md)

Map Select opens the Angliru race and loads the centre line and model with the lazy course renderer. The 21 archived stages of GCN’s *5 Gruelling Minutes* (video `vNcY0mcq4PU`) last 40:00. Their target cadences determine a 17.625 km course. Reserve the 23.5% pitch for a hard work stage near the summit, smooth both transitions and sample that pitch from the baked centre line. Publish uniformly spaced heights from the same bake in the catalogue, so the route panel can show grade and climbing by ridden distance even when the panorama replaces the 3D view. Place painted slogans, runners and flags against the same road tangent as the cyclist. Keep local scene elevation relative to the course and identify the real summit elevation on its sign.

| Section | Rider-height art direction | References |
| --- | --- | --- |
| Lower woods | Shade the narrow tarmac with beech and chestnut crowns. White paint shows the way through darker sections. | Real 01–03 and 07. Games 03 and 05 show canopy height and rider contrast. |
| Open pasture | Stone walls separate the road from brown cattle, black and white horses, a barn and its raised grain store. Keep a clear view past the nearest field to the pale crags. | Real 04, 08–15. Game 04 puts the climbing group in silhouette against a brighter valley. |
| Cueña les Cabres | Expose grooves, wet patches, painted names and the 23.5% sign from the saddle. Leave the riding line clear between fans, cross flags and vans. | Real 01–03 and 05. Games 01 and 02 show the scale of painted letters and the readability of a rider in mist. |
| Summit | The road emerges into bare pasture and limestone under moving low cloud. The metre and elevation markers sit inside the rider’s view. | Real 04–06 and 10–15, with game 04 for sightlines over the shoulder. |

Batch static scenery and reuse a bounded set of animated spectators. Bake the concrete and stone detail, keep the distant ridge fixed and release scene-owned resources on departure. Match opening, pasture, crux and summit rider views. Measure actual frame submissions separately from display callbacks across the lower road and busiest crowd for one minute after nine seconds of warm-up at 1024 × 768, DPR 1, 4× CPU throttle and Low/WebGL 2. [Reference credits](../../../worlds/angliru/SOURCES.md)

### Antwerp Port Sprint

Map Select opens Scheldt Quays. The race requests the Antwerp centre line and GLB through the lazy course renderer. GCN’s *Lead Out Efforts Into Full Sprints* lasts 50 minutes over 17 stages (video `vZ-7ciRpO5s`, sync offset 3 seconds). The class determines 20.9 km at target cadence. Retain the working port, moored shipping, red kite, skyline and moving finish scene that the rider praised in [issue 928](https://github.com/QuinntyneBrown/wattzup/issues/928).

| Rider view | Original models and reference details | Game reference |
| --- | --- | --- |
| Scheldt approach | Place Het Steen’s pointed roofs, crenellations and round towers beside the quay. Bollards, a wide river, embedded rails and the open steel hangar reveal depth. Real 02, 03, 05–08. | Game 05 shows the sightline past a moving rider. |
| Willemdok | Open a basin between the camera and the winding bands of the MAS. Change the orientation of each sandstone storey around a strip of green-grey glass. Beyond the marina, retain the irregular brick bays of the Red Star Line sheds. Real 04, 09, 10, 13, 15. | Games 01 and 02 give the scale and lateral separation of the riders. |
| Lock and Port House | A single triangulated blue-glass volume projects past the old fire station on its inclined support. The lock railing, barriers and bridge pivot pass close in front. Real 01 and 14 give its side and end elevations. | Game 03 gives the relative size of a gate above the HUD. |
| Port sprint | Keep cranes, gantry trolleys and containers at several distances across the open docks. Buses and fans behind barriers lead towards the kite. Flags and an echelon follow ride time. Real 03, 08, 11–13. | Game 04 gives the bunch-sprint framing. |

Keep the cathedral and far port fixed as in Caribana’s skyline. Batch repeated rails, container corrugations and quay furniture by road section. Share moving riders and flag resources, release them on leaving and retain the echelon on Low. Capture matched views on the quay, by the MAS, at the bridge and in the sprint. Measure 60 seconds of submitted frames after nine seconds of warm-up at the opening and in the sprint on 1024 × 768, DPR 1, Low/WebGL 2 and 4× CPU throttle. [Credited references](../../../worlds/antwerp/SOURCES.md)

### Arenberg Forest

Map Select opens Trouée d’Arenberg. Fetch the map’s own centre line and Blender scene only after race entry. The archived GCN class *Don’t Get Dropped* begins three seconds into `CXuq9avimC4`, lasts 25 minutes and has 22 stages. Its target cadences place the finish at 10.725 km. The 2.4 km sector occupies part of the class route. Give it a single straight heading, an approach at Wallers, and a distinct exit back to tarmac.

| View | Fixed geometry and moving action | Reference cues |
| --- | --- | --- |
| Mine approach | The brick works, two sheaves and slanted steel legs of the winding tower stand above the approach. Keep their silhouette distinct from the railway bridge and its parapet. | Real 02, 03, 10 and 11. Game 03 frames the bridge above the rider. |
| Entrance | A sign marks the sector name and five-star rating. Metal barriers carry banners with crowds immediately behind. A commissaire moto travels along the road before a team car. | Real 01, 05–09. Games 01 and 05 show the relative scale of riders, barriers and overhead signage. |
| Forest | Crown the road towards its centre. Give the stones chipped shoulders, irregular widths and dark wet joints. Muddy tracks run outside the pavé. Alternate mature oak and birch crowns so nearer trees cross the distant trunks. | Real 04, 12–15. Game 02 shows riding through airborne grit. Game 04 shows how the foliage frames the road. |

Caribana separates its fixed skyline from moving street subjects. The mine and bridge stay fixed. Keep the two convoy vehicles bounded and time their translation to the ride clock. Batch tree sections, use a repeatable original stone texture at physical scale and release all owned geometry and textures on leaving. Capture matching approach, entrance, forest and exit views. Measure a minute at the entrance and in the forest after nine seconds of warm-up on 1024 × 768, DPR 1, 4× CPU throttle and Low/WebGL 2. [Reference credits](../../../worlds/arenberg/SOURCES.md)

### Philadelphia Art Museum Steps

Map Select opens Benjamin Franklin Parkway. The race lazy-loads the museum course and the class centre line from the same origin as the ride app. GCN’s archived *HIIT Leg Buster* (`fEKKHAEg_B8`) has 16 stages and lasts 19:40. At each target cadence the seven work stages end on the museum terrace. Sample the baked centre line every five metres for the route panel. Set the museum, statue, fountain and skyline once in world coordinates. Vary the length of the park circuits to preserve the original stage distances.

| Rider view | Physical arrangement | Source evidence |
| --- | --- | --- |
| Parkway and Logan Circle | Plane trees, grass medians and national flags narrow in perspective. Swann Fountain’s bronze figures sit below separate upright and arcing jets. | Real 01, 03–05, 15. Game 03 gives the travelling group’s scale. |
| Eakins Oval | The equestrian Washington Monument stands on a tiered plinth, below the limestone museum and above the broad lawn. Keep a clear frontal view into the steps. | Real 02, 06–09 and 13. Games 01–02 show a landmark’s scale against the rider. |
| The steps | Model all 72 granite risers, the landings, shaded column recesses and symmetrical wings. The rider follows a smooth surface through the stair centre. Runners use the adjacent flights, with a raised-arm bronze figure on a plinth at the foot. | Real 07–12. Games 01 and 05 keep a near human subject readable in a low-angle landmark view. |
| Return circuit | Show City Hall with William Penn, the tower crowns and the boulevard behind the museum-bound rider when the route turns back. Share the same portico and flagpoles on each approach. | Real 03, 05 and 14. Game 04 gives skyline separation. |

Use Caribana’s fixed skyline and batched street furniture. Separate the bronze and sandstone silhouettes using baked shading, keep flags and a bounded group of runners on the ride clock and dispose of their shared resources on exit. Match the opening, fountain, monument, steps and return views with the HUD visible. Measure moving world submissions on the Parkway and museum approach for a minute after nine seconds of warm-up at 1024 × 768, DPR 1, 4× CPU throttle, Low/WebGL 2. [Reference credits](../../../worlds/artmuseum/SOURCES.md)

### Atacama Desert

The existing street repeats the shore, birds, boardwalk and truck every 360 metres. Preserve the fixed silhouette of Licancabur from the earlier ride. Give Chaxa, the eroded valley and Miscanti separate locations. The race catalogue resolves the GCN class to its own course GLB and centre line under `courses/atacama`. [Earlier rider views](https://github.com/QuinntyneBrown/wattzup/pull/765)

| Viewpoint | Rider-height landmarks | Reference decisions |
| --- | --- | --- |
| Open salar | A narrow ribbon of charcoal tarmac with broken edge paint divides an open crust. The cone stands clear of the distant range. | Real 01–06, 12 and 14 give salt colours, road proportions and volcano taper. Games 01, 02 and 05 separate the road from distant relief. |
| Chaxa | Distinct pink waders feed along the irregular wet margin of a shallow blue lagoon. | Real 07–09 and 15 show pale flanks, black wing tips and salt banks. Game 04 gives legibility against a rider. |
| Valle de la Luna | Scalloped strata, short shadowed gullies and wind-cut dunes break the ochre and violet middle ground. | Real 10–11 and game 03 establish the layered relief. |
| Miscanti | A second broad blue lagoon below the peaks. Sparse yellow grass and grazing vicuñas occupy the dry bank. | Real 02 and 13–15. Game 05 keeps mountains visible above the rider. |

Bake chunked local landforms, using original salt and rock colours. Keep the distant Andes fixed like Caribana’s skyline. Animate a bounded group of feeding birds on the ride clock, hold their pose on pause, honour reduced motion and dispose of geometry and materials on exit. Measure actual render submissions over the open salar and at Chaxa for 60 moving seconds after 9 seconds of warm-up on Low/WebGL2, 1024 × 768 and 4× CPU throttle. [Credits](../../../worlds/atacama/SOURCES.md)

### Atlantic Ocean Road

The initial world has its own sky and terrain settings. The shared street supplies roadside posts and the race catalogue has no Atlantic Ocean Road entry. Restore GCN Training’s nine-stage class and make Map Select start the lazy `atlanticroad` course. Place bridge supports and deck rails from the same sampled centre line as the wheels. Build the open map from the archived video timing.

| View | Shape, lighting and reference decisions |
| --- | --- |
| Low approach | Run a low fill embankment across the water, with irregular rock and steel posts close enough to read at speed. Real 05, 10, 11 and 14 give the height of the road above the sea. Games 02 and 05 show the contrast between deck and water. |
| Storseisundet | Use a rising reverse curve, deeper concrete haunches over the middle piers, a thinner centre span and a descending roadway hidden behind the crest. Real 01–04 and 06–09 define the approach silhouette. Game 01 keeps open sky behind a bridge. |
| Fishing spans | Raise a pedestrian walkway outside the road rail with several anglers looking down at the sea. Paint red timber cabins and white trim on the islands. Real 12–15 and games 03–04 establish the scale of skerries, figures and shoreline. |
| Changing weather | Separate the near foam and spray from low islands and fixed grey mainland peaks, following Caribana’s foreground and skyline. Real 05, 08, 10, 13–15 show the open water and horizon. |

Bake the embankment, cut rock and original bridge components in course chunks. Use shared bounded spray geometry on the race clock, with reduced-motion and pause handling. Capture matched rider positions on the causeway, below the cantilever, at its crest and on the fishing walkways. Measure real draws through the opening and busy bridge after nine seconds of warm-up for sixty moving seconds each on the simulated tablet. [Reference credits](../../../worlds/atlanticroad/SOURCES.md)

### Col d’Aubisque

The original shared street sets the Pyrenean palette but lacks a physical balcony, a summit and a race catalogue entry. Map Select loads `courses/aubisque.glb` and its own centre line through the lazy race world. Use GCN’s original 37 stages. The title says 35 minutes and the stage durations total 33. The neighbouring passes and the finish stay fixed in the world.

| From the saddle | Original reference decisions |
| --- | --- |
| Col du Soulor | Timber chalet, direction signs and open green slopes. Real 05, 07, 09, 11, 12 and 15 give the pasture and slate roofs. Games 03 and 05 give the scale of a cyclist beside the pass. |
| Cirque du Litor | Follow the cliff on one side, with low irregular stone blocks and a deep view into the Ouzom valley on the other. Two rough-hewn rock portals interrupt the balcony. Real 01, 12, 14 and 15 inform the skyline, road width and continuous cliff strata. Games 01 and 02 show the rock edge from riding height. |
| Livestock and weather | Horses hold a long neck above the rider, cattle have a lower, broad silhouette and sheep stay small in the pasture. Follow the placement of road users and animals in real 02, 04, 10 and 11. Use low cloud at different depths and preserve a clear travel line. |
| Summit | The col sign, café, parking area and visitors sit under the high ridge. The three giant bikes have open wheels and recognisable yellow, green and dotted frames. Real 03, 06, 08 and 13 and game 04 set relative scale. |

Use an independent fixed skyline and a bounded animated foreground, as Caribana does. Bake rock and road into chunks, share materials across livestock and reuse cloud sprites on ride time. Hold motion when paused, support reduced motion and release every GPU resource on exit. Capture matched race views through Soulor, the cliff, a tunnel, livestock and the summit. Measure submitted frames on Low/WebGL2, 1024 × 768, DPR 1 and 4× CPU throttle, with a nine-second warm-up and two moving sixty-second samples. [Reference credits](../../../worlds/aubisque/SOURCES.md)

### Sixth Street, Austin

Map Select loads the closed street through the lazy race world. The original GCN Training class supplies all 39 stages. Race distance fixes the position of each intersection. Reserve the centre of the street for racing and use the old buildings to frame the Driskill, the Ritz and the distant glass crown.

| From the rider’s saddle | Local appearance and motion |
| --- | --- |
| Brazos Street | Model the Driskill corner in pale stone with curved window heads, heavy cornices and balustrades. Set the Frost Bank crown behind the blocks. Real 03, 07, 10 and 11 establish scale. Games 01 and 03 show the viewing angle between buildings. |
| The Ritz and clubs | Use a projecting red vertical RITZ sign, parallel warm bulbs and recessed stage doors. A guitarist strums and a drummer lifts the sticks on ride time. Real 01, 02, 08 and 13 and games 02 and 04 guide sign legibility. |
| Barricaded festival blocks | Follow real 04, 05, 06 and 14 for star-and-wire spans, pools of lamplight and cross-street streaks. Batch revellers behind metal barriers and near open stage windows. Place food trucks, pedicabs and festival banners along the curb. |
| East Sixth | Vary painted brick bays, low cornices, mural walls and neon accents with architecture from real 09, 12 and 15. Game 05 shows how tall illuminated signs frame a travelling cyclist. |

Bake static surfaces in distance chunks with vertex shade beneath awnings. Keep the skyline in a separate fixed mesh. Share geometries for the active band and crowd, update their poses from ride time, respect reduced motion and dispose the batch when leaving. Compare matched rider views and measure two moving 60-second samples on Low/WebGL2 at 1024 × 768 with 4× CPU throttling. [Reference credits](../../../worlds/austin/SOURCES.md)

### Bathsheba, Barbados

The race follows the East Coast Road, with the Atlantic on one side and the eroded hills on the other. Map Select uses a baked centre line derived from the nine stages of GCN Training’s *Take It Easy*. Fix rocks, boats, houses and the inland ridges in world space. The changing sightline reveals the bay as the coast road rounds the headland.

| Place | Original visual decisions |
| --- | --- |
| Coast road and village | Roads in real 02, 03 and 12 have narrow shoulders, little paint and palms at different inclinations. Real 06, 11 and 14 inform the rum shop lettering, shutter colours and veranda proportions. Games 01 and 03 show the clear riding corridor. |
| Soup Bowl | Real 04 and 05 show rough pale caps over darker stems, softened by erosion at the waterline. Real 08, 09 and game 05 give the open sightline over the surf. Place the largest rock ahead of the near sea wall, with lower rocks farther offshore. |
| Beach and reef | Real 07, 08 and 13 and game 02 give the white-gold sand and contrast between the reef pools and deeper Atlantic. Shoreward breakers curl around exposed rock and fade toward the beach. Set painted fishing boats above the wash. |
| East coast hills | Real 01, 10 and 15 give receding headlands and broken green slopes. Keep the inland ridge fixed and haze distant coastal spurs. Game 04 separates close palm fronds from the clear blue sky. |

Bake houses, trees, shore walls and the distant landscape. Use bounded shared geometry for foam and trade-wind spray, running on ride time. Hold motion on pause, respect reduced motion and release render resources on exit. Compare matched views through the rider HUD and sample two moving minutes on Low/WebGL2 at 1024 × 768, DPR 1 and 4× CPU throttle. [Reference credits](../../../worlds/bathsheba/SOURCES.md)

### Bay of Islands Group Ride

The course links riding views of Paihia, Waitangi and Russell in an original composite route. Map Select launches the normal solo or bunch race. Use GCN’s original 23 stages and stage durations. Place native trees close enough for their branch structure to pass overhead. Keep Russell’s white houses, Paihia’s wharf and the offshore rock islands fixed as the rider travels along the bays.

| Rider view | Shape, materials and light |
| --- | --- |
| Paihia waterfront | Real 01, 02, 05 and 07 give low commercial façades, piles, rails and the wharf roof. Game 02 sets the rider-height view of the pier. A passenger ferry crosses offshore with a wake. |
| Sheltered bays | Use the exposed rocky base, irregular bush crown and cove colours from real 08–10 and 14. Games 03 and 04 establish sky visibility and the distance between the nearest boats and the hills. |
| Waitangi | Real 11–13 give the carved red gable, open flagstaff lawn, simple bridge deck and moored tall ship. Preserve an unobstructed view towards the lawn. Game 05 gives the space occupied by a passing bunch. |
| Russell | Real 03, 04 and 06 set the broad overhanging trees, white weatherboard fronts and waterfront proportions. Real 15 guides sunset over the water framed by dark pohutukawa branches. Game 01 keeps the street legible from the saddle. |

Use a separate hazed island silhouette, chunked road furniture, shared yacht geometry and a bounded ferry drawn by the lazy world renderer. Stop vessel motion on pause and honour reduced motion. Dispose of the vessel batch, materials, wake texture and light state on exit. Compare matched locations and measure two moving one-minute samples after nine seconds of warm-up at Low/WebGL2, 1024 × 768, DPR 1 and 4× CPU throttling. [Reference credits](../../../worlds/bayofislands/SOURCES.md)

### Beach Road, Melbourne

Ride the sweeping bayside road from the St Kilda pier past Brighton’s bathing boxes and the sandstone reef at Beaumaris. The GCN class supplies all 48 stage timings and targets. The map’s physical centre line anchors bike-lane paint, the foreshore route and the club bunch. A rider can follow the normal solo, bot or live entry.

| From the road | References and original geometry |
| --- | --- |
| St Kilda | Real 05, 06 and 10 show the long piled deck, rail height, curved lamps and pavilion. Game 05 provides the approaching pier sightline. Warm the sky at the final pier using real 14. |
| Brighton | Real 03, 04 and 07 give the peaked roofs, narrow timber façades, coloured stripes and hut spacing. Put the boxes on the sand below the road. Game 02 establishes scale at riding speed. |
| Bunch and clifftop path | Use real 01, 02, 11, 13 and 15 for the bay curve, shared path, scrub and tall Norfolk pines. Game 01 shows spacing between working cyclists. |
| Ricketts Point | Real 08 and 12 show the low rock shelves and shallow pools; real 09 sets the shape of the distant city. Games 03 and 04 place the rider against the horizon under changing light. |

Keep the CBD fixed beyond the water. Bake the repeated boards, gables, pier and lamps in chunks. Use the existing course cyclist kit for the club bunch, share its geometry, keep rider count bounded and update turns and pedalling on ride time. Release resources when leaving. Compare matched captures and record actual draws at Low/WebGL2 with a 1024 × 768 tablet, DPR 1, CPU at 4× throttle and two moving sixty-second samples. [Reference credits](../../../worlds/beachroad/SOURCES.md)

## Description

**`world` library (`frontend/projects/world`, new)** — the boundary for Three.js, copied from
`main` (ADR 0030). It is imported only by dynamic `import()`, so neither Three.js nor the scene
enters the initial bundle. Adding it adds `ride → world` and `world → api` to the dependency rule
in `AGENTS.md` and to the ESLint boundaries in the same change.

- **`WorldRenderer`** (contract and `WORLD_RENDERER` token in `api`, `main`'s
  `world-renderer-port.ts`) — `start(canvas, world, nextFrame, segments)` resolves false when
  neither WebGPU nor WebGL 2 starts; `resize(width, height, pixelRatio)`, `draw(frame)`,
  `setFramePeriod(ms)`, `pauseBudget()` and `dispose()`. Telo Ride adds `backend`, the GPU API
  drawing the world, for the tag. `ThreeWorldRenderer` implements it with one `WebGPURenderer`,
  which takes a WebGPU adapter when the browser grants one and runs its own WebGL 2 backend
  otherwise (`forceWebGL` only for the performance sweep's test hook); it is the only type that
  names a Three.js type, and `dispose()` releases every GPU resource and the renderer
  (L2-065 AC1, AC2). The loader (`loadWorldRenderer`) imports it, and Three.js with it, on demand.
- **`WorldScene`** (block `world-scene`) — `main`'s canvas host: it loads the renderer after its
  view is in place, measures the display's frame period through `FrameScheduler` (the only
  `requestAnimationFrame` caller), starts the renderer, resizes it on a `ResizeObserver`, draws one
  frame per tick through `SceneDriver` while the race runs, and on destroy stops the loop,
  disconnects the observer, removes its listeners and disposes the renderer. It emits `started`
  with the backend, or `unavailable` once. Its canvas is hidden from assistive technology: the race
  scene around it is the one image.
- **`RenderQuality`** — `main`'s `render-quality.ts`, the pure table of four quality levels
  (ADR 0021): `techniquesAt(tier, backend, reducedMotion)` gives the techniques a level draws,
  those of its level and the levels below, the drawn look's only at `low`; with WebGL 2 it caps
  at `high`, so `ultra` is WebGPU only and a world asked for at `ultra` draws at `high`.
  `startTier()` opens the world at `low` on both backends (L2-065 AC4, AC5). The renderer reads
  the table and holds no rule about which level is in force.
- **`RaceWorldScene`** — `main`'s scene: the road, terrain, sky and props of the map's world,
  each world's scene module (`world-<id>.ts`) built on the shared kit and street table, with the
  panoramas of the worlds that have one served from the app's own origin
  (`projects/ride/public/worlds/<worldId>/`, ADR 0021). The road bends in the vertex stage (ADR
  0023). `SceneDriver` moves the camera along the route at the race's virtual speed each frame,
  and holds it while the race is paused. In a portrait viewport the camera keeps its vertical
  field of view and narrows its aspect, so the world fills the screen without stretching
  (L2-064 AC5).
- **`RiderFigures`** — the race's other riders in view, each one of `main`'s cyclist kit
  (`world-cyclist.ts`) in its jersey colour (`--jersey-<jersey>`), at its place on the route
  and on a line of its own across the road (`ridersOnRoad`); the ghost is the kit's rider in
  one translucent gold material, made with the scene so it compiles while the world loads
  (L2-064 AC3). The race hands the scene its field each second as `SceneFrame.riders`, metres
  from the rider; without them, as in a class, `main`'s simulated pacers ride instead.
- **`PhotorealTilesLayer`** — loads Google's photorealistic 3D Tiles for the map's real place
  through the Map Tiles API with the rider's key, and reports `refused` when Google rejects it.
  It is `3d-tiles-renderer` 0.5.4 (ADR 0021's amendment): a `TilesRenderer` with
  `GoogleCloudAuthPlugin` (the key on every request to `tile.googleapis.com` and nowhere else),
  `GLTFExtensionsPlugin` with Three.js's `DRACOLoader` (its decoder served from `/draco/`) and
  `ReorientationPlugin`, which puts the place's latitude and longitude at the scene's origin,
  up the scene's Y axis. The renderer imports the layer only on `stream`, adds its group to the
  scene, updates it with the camera each frame and disposes it with the scene. It reports
  `refused` when the root tileset fails or holds no root, and `streaming` with Google's
  attribution for the tiles in view each time it changes.

**Ride app**

- **`RaceWorld`** (`ride`, a directive in the race scene) — imports the `world` library when the
  race opens and creates its `WorldScene` in place, handing it the map's world, plan, the race
  clock, the virtual speed and whether the race runs. The scene goes with the race view when the
  rider leaves. `RaceStore` keeps `backend` for the tag and `worldUnavailable`, which removes the
  scene and leaves the map's photo. The race route binds `WORLD_RENDERER`.
- **Race scene** (block `race-scene` of the race page) — one image (`role="img"`) labelled with
  the map's world description ("The Old Town Criterium world: a cobbled old town under a blue sky,
  its cathedral spire on the horizon"). The map's photo (`race-scene__photo`) lies under the
  world's canvas and stays alone as the panorama when neither backend starts (L2-065 AC2).
- **Renderer tag** (element of `RaceBar`) — "WebGPU" or "WebGL 2", title "The GPU API drawing
  this world".
- **`RaceScenery`** (`components`, block `race-scenery`) — rendered only on a map with a real
  place while the world draws (not over the panorama, L2-066 AC9). It reads "Ride the real Bruges · Steenstraat to the Markt" and "Paste a Google Maps
  Platform key to stream it as photorealistic 3D Tiles. It stays on this device.", with a key
  field (placeholder "AIza…") and "Stream it", disabled while the field is empty. It emits
  `streamKey(key)`. Told `refused`, it marks the field invalid and reads "Google refused that key.
  The built-in world stays." (`role="alert"`); told `streaming`, it reads "Streaming the real
  Bruges · Steenstraat to the Markt" over Google's attribution (L2-066 AC4, AC7). From 640 px to
  1023 px no HUD panel covers it (L2-066 AC6).
- **`MapsKeyStore`** (`domain/storage`, the `MapsKey` contract and `MAPS_KEY` token in `api`, bound by the race route) — keeps the Maps
  key in this browser's localStorage only; the next race's panel holds it, and nothing streams
  until "Stream it" (L2-066 AC3, AC8). The key is never sent to Telo Ride's backend.
- **`MapDto.realPlace`** (`api`, served by the catalogue) — the real place's `name` ("Bruges"),
  `route` ("Steenstraat to the Markt"), `latitude` and `longitude`, or `null` for a map with no
  real place (L2-066 AC5). The race page hands it and the key to `RaceWorld`, which hands them
  to `WorldScene` and on to `WorldRenderer.stream(place, key, report)`.

The Content Security Policy that admits the Map Tiles API origin is designed by
security/restrict-third-parties.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a
level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-064` | `L1-012` | During a race the map's 3D world shall be drawn from the rider's place on the route, with the camera moving forward at the rider's virtual speed, computed by a documented power-to-speed model whose constants are an open question. Other riders within view shall be drawn in their jersey colours at their places on the route, the ghost translucent gold. Assistive technology shall read the world as one image with a description ("The Old Town Criterium world: a cobbled old town under a blue sky, its cathedral spire on the horizon"). In a portrait viewport the world shall be reframed to fill the screen without stretching. |
| `L2-065` | `L1-012` | With WebGPU the world shall be drawn with WebGPU and the tag shall read "WebGPU"; otherwise with WebGL 2 and the tag "WebGL 2". The tag's title shall be "The GPU API drawing this world". With neither, the world shall be replaced by the map's panorama and the race shall still run. While the tab is hidden the world shall stop drawing and the race clock and telemetry shall carry on (L2-133). |
| `L2-066` | `L1-012` | On Old Town Criterium the scenery panel shall read "Ride the real Bruges · Steenstraat to the Markt" and "Paste a Google Maps Platform key to stream it as photorealistic 3D Tiles. It stays on this device.", with a key field (placeholder "AIza…") and "Stream it", disabled while the field is empty. An entered key shall be stored only in this browser and sent only to Google's Map Tiles API, never to Telo Ride's backend. When Google refuses the key, the built-in world shall stay and the panel shall read "Google refused that key. The built-in world stays." with the field marked invalid. A map with no real place, or a race on its panorama, shall have no scenery panel. From 640 to 1023 px no HUD panel shall cover the panel. While the tiles stream the panel shall read "Streaming the real Bruges · Steenstraat to the Markt" with Google's attribution. A stored key shall fill the field on a later race, and nothing shall stream until "Stream it". |

## Diagrams

### System context

Telo Ride draws the world itself. Google Maps Platform takes part only when the rider streams
real-world scenery with their own key.

![C4 system context for rendering the race world](diagrams/c4-context.png)

### Containers

The Ride app loads world assets from its own origin, keeps the Maps key in browser storage, and
calls Google's Map Tiles API directly. The Telo Ride API takes no part in drawing.

![C4 container view for rendering the race world](diagrams/c4-container.png)

### Components

`RaceWorld` imports the lazy `world` library and creates `WorldScene`, which loads and drives
`WorldRenderer`; the renderer chooses its backend and composes the quality table, scene, rider
figures and the optional tiles layer.

![C4 component view for rendering the race world](diagrams/c4-component.png)

### Class structure

`ThreeWorldRenderer` owns the scene, the figures and the tiles layer and disposes them together.
`WorldScene` holds the renderer; `RaceStore` keeps the backend it reports.

![Class diagram for rendering the race world](diagrams/class-structure.png)

### Behaviour — start, draw and dispose the world

`RaceWorld` loads the chunk, and `WorldScene` starts the renderer, which draws with WebGPU or
WebGL 2 or reports that neither starts, leaving the panorama. No frame is drawn while the tab is
hidden, and leaving the race disposes every resource.

![Sequence diagram for starting, drawing and disposing the world](diagrams/sequence-start-draw-and-dispose.png)

### Behaviour — stream real-world scenery

The key goes to browser storage and to Google's Map Tiles API only. A refused key leaves the
built-in world in place and the panel says so.

![Sequence diagram for streaming real-world scenery](diagrams/sequence-stream-real-scenery.png)

## Open questions

- **Slice 8.1 follows `main`'s rendering (ADR 0030).** This design first named a separate
  `RendererBackendProbe`, `start(canvas, map, quality)`, `setVisible` and a `RaceWorldStore` with a
  `RaceScene` component. `main` has none of them: `WebGPURenderer` chooses its backend itself, the
  canvas host is `main`'s `WorldScene` with `FrameScheduler`, and the hidden tab is handled by the
  scheduler requesting no frame. The design now describes `main`'s shape; `main` wins on rendering.
- **The renderer arrives in two slices.** Slice 8.1 carries `main`'s `world-renderer.ts` as far as
  starting, sizing, the frame budget and disposing; slice 8.2 brings the rest of the file, which
  builds and draws the scene, so the canvas stays clear over the map's photo until then.
- **Slice 8.2 draws `main`'s scene as it is.** The camera keeps `main`'s fixed vertical field of
  view in a portrait viewport rather than widening it, which still fills the screen without
  stretching. `main`'s scene reads each segment's start second, which `WorldScene` adds to the
  plan's segments (`timedSegments`). Until slice 8.3 places the race's own riders, the scene
  draws `main`'s six simulated pacers around the rider, as `main` does.
- **Slice 8.3 draws the riders with `main`'s cyclist kit.** This design first named one
  instanced mesh for the riders; `main` draws each rider as a group of the kit's shared
  geometries, and `main` wins on rendering, so a race rider is one of those groups, made the
  first time it rides into view and dressed for the tier (toon twins and warmer ink at low, the
  road's bend). The rider wears the race board's You jersey (`--jersey-you`) rather than
  `main`'s `--color-rider-4`, which Telo Ride's tokens do not have. The race's field moves once
  a second, as the standings do, so a rider's gap changes in whole-second steps.
- **Slice 8.4: the world opens at Low.** `main` opens World Ride at `low`, the drawn look, on
  both backends and never raises the level during a ride (its L2-111 AC3, amended on
  2026-11-21: opening at `ultra` or `high` lowered the tier while the rider watched). `main`
  wins on rendering, so L2-065 AC5 says the same, and L2-159's Auto, L2-152's examples and the
  Settings and World loading mocks follow: Auto starts at Low, or at the level the device check
  found. A chosen level (slice 20.2) and the device check (20.3) are how a rider sees the levels
  above; until then only `main`'s test-only probe pins one.
- **Slice 8.6: a hidden tab draws nothing at all.** `main`'s frame scheduler stops requesting
  frames while the tab is hidden, but `WorldScene` also draws one frame whenever an input
  changes, and the race clock's second is an input, so `main` drew a frame each second in a
  hidden tab. The smallest change to the copied code: `WorldScene` keeps a `visible` signal from
  `visibilitychange`, and its input-driven frame waits for it (L2-065 AC3). The panorama
  (L2-065 AC2) has stood since slice 8.1.
- **Slice 8.7: real-world scenery is built new on `main`'s renderer.** `main` has no 3D Tiles,
  so the tiles layer is new, in `main`'s style, and changes no copied scene: the built-in world
  stays drawn and the tiles join it around the place's origin. Lining the tiles' streets up with
  the built-in road (and hiding the built-in buildings they overlap) is left open. The design
  first named `SettingsStore` and a `RaceWorldStore`; the key has its own `MapsKeyStore` until
  Settings (journey 20) gathers the stored settings, and the race page holds the panel's state.
  A tile's embedded textures and the Draco decoder's worker need `blob:` and
  `'wasm-unsafe-eval'` in the Content Security Policy (L2-131 AC1).
- **Vice City has no world on `main`.** Its race draws South Beach Sunrise, whose terrain its
  catalogue entry already takes (slice 7.3), until a Vice City world is built.

## Bealach na Bà (#2080)

Model the road as a single continuous ribbon shared by rider physics, mesh and elevation readout. Begin beside Loch Kishorn and widen one verge into signed passing places. Near the headwall, measure grade against horizontal distance and ease the steering into reversing switchbacks. Keep the warning panel, cattle-grid bars and wall capstones in the foreground. The pen floats and mooring cages belong to the loch in world coordinates. Separate the headwall from the farther island ridges so both retain their position as a rider turns.

| Rider view | Real references | Game references | Low-tier treatment |
| --- | --- | --- | --- |
| Foot and lower moor | 05, 08, 11, 15 | 01, 03 | Original warning lettering, broken tarmac, grazed verge and blue passing-place plates. Batch the drystone walls, fences and grid rails. |
| Loch Kishorn | 04, 07, 09, 14 | 02 | Dark water, circular cage rims and anchored barges. Retain a clear sightline from the turning road. |
| Corrie headwall | 01, 02, 03, 10 | 03, 04 | Expose the grade on the narrow switchbacks. Merge layered sandstone, talus, heather and bracken into distance sections. |
| Summit and Inner Sound | 12, 13, 14 | 02, 05 | Keep Raasay low in front of the sharper Cuillin. Drift low cloud and light through the corrie on ride time. |

The workout selects the archived stage sequence. The profile panel samples course geometry. Update approaching sheep, distant deer and bounded drizzle with the same elapsed time, and release their scene resources on exit. Measure the lower road and upper hairpins with the simulated bike in headed Chromium on Low/WebGL 2. [Reference credits](../../../worlds/bealach/SOURCES.md)

## Big Sur (#2081)

Lay the road around both mouths of Bixby Canyon so the rider approaching on the northern slope can see the outer bridge face. Keep the deck level across the gorge, and build the arch under the same metre-indexed centre line. Rocky Creek has a shorter arch, more closely spaced piers and a tree-framed approach. The coastal bends use worn double yellow lines and low rails interrupted at gravel turnouts. The inland slope changes from golden grass and chaparral to darker redwood crowns. Only the course's original geometry and textures ship.

| View from the road | Real references | Game references | Implementation |
| --- | --- | --- | --- |
| Bixby Creek Bridge | 05, 06 and 10 | 03 and 04 | Construct the pale concrete arch ribs, spandrel columns and parapet slots separately. Cast dark baked shading under the deck and keep both anchorages visible over the canyon. |
| Highway 1 and Rocky Creek | 01–04, 07, 08 and 11 | 01 and 05 | Carve the two lanes into the hillside, with short passing turnouts, low scrub, cypress silhouettes and a redwood-filled creek valley. |
| McWay Cove and Pacific | 09 and 13–15 | 02 and 04 | Recess the pocket beach into a headland. Drop fresh water from the cliff to sand, with spray below. Offshore breakers wrap around dark stacks at different phases. |
| Marine layer | 10–12 | 02 and 05 | Drift a few translucent banks across the hills on ride time. Keep the nearest edge line and both bridge decks visible under low detail. |

Use the physical rider distance for the HUD and the grade. Bake static detail into shared route chunks, draw moving spray in bounded batches, and release geometry and materials on leaving the course. Preserve the archived GCN stage sequence. Compare six rider views to the baseline and time two moving one-minute samples in headed Chromium. [Credited references](../../../worlds/bigsur/SOURCES.md)

## Blackpool Illuminations (#2082)

The existing scene establishes the switch-on, coloured arches, trams and the illuminated tower. Bring those details to the full 5.63 km course and place the rails on the seaward side of the road as in the reference photos. Give the Tower a fixed lattice silhouette above the arcade roofs. The geometry and catalogue share one course centre line. Keep shop signs, wet rails and the ends of piers readable across all nine stages.

| Location | Real photographs | Game views | Low-tier construction |
| --- | --- | --- | --- |
| Tower and Comedy Carpet | 01, 02, 06, 09–11, 14 | 01, 04 | Four tapering lattice legs support galleries, a lit crown and flagstaff. The foreshore has original embedded lettering and a cluster of spectators. |
| Golden Mile, Central Pier | 01, 05, 08, 12, 13 | 02, 05 | Bays of lit arcade and chip-shop windows, stepped seawall, Victorian piles and the Central Pier wheel separate the three planes of the view. |
| Heritage and Flexity trams | 03, 04, 07, 08, 15 | 03 | Different body lengths, liveries, lit upper saloon and articulation. A continuous dwell-and-depart cycle follows the rails, with bounded moving batches on the ride clock. |
| North Pier and Gynn Square | 02, 05, 06, 12 | 02, 04, 05 | Grade the sky from autumn blue to charcoal. Individual festoon bulbs, shaped illuminated figures and their wet-surface reflections lead towards the pier lights and northern displays. |

Load the course assets when the race is entered. Bake repeated frontage, railings, lights and spectators into shared material groups. Reserve runtime motion for trams, the wheel and the illumination sequence, and dispose of scene resources on exit. Measure at the Golden Mile and Tower through the simulated bike with the same tablet settings used for Caribana. [Credited references](../../../worlds/blackpool/SOURCES.md)

## Blue Mountains, Jamaica (#2083)

The baseline race has the rider, HUD, resistance and cadence but no place-specific course in the map catalogue. Restore the archived stage sequence in the catalogue. Load the authored model at race entry through the course renderer. Its physical centre line supplies the stage distances, reversing bends and physical elevation. Follow L2-064–066 and L2-159–160 for the rider view, local scene and submitted-frame budget.

| Rider viewpoint | Real references | Game references | Low-tier treatment |
| --- | --- | --- | --- |
| Mavis Bank coffee works and planted terraces | 04, 06–08, 12, 13 | 01 and 02 | Tin sheds, gate, coffee drying beds and actually stepped soil. Merge coffee crowns, bright leaf highlights and clusters of red cherries into nearby groups. |
| Sound-system yards | 10, 14, 15 | 02 and 04 | Original speaker cabinets, recessed cones, painted shutters and open shop counters. Drive the cones and people beside the decks from elapsed ride time. Follow the rider’s sound settings for any audible cue. |
| Switchbacks and Hagley Gap | 04, 05, 09, 12, 13 | 01, 03, 05 | Alternate the direction of travel on real turns. Cut local gullies and broken shoulders into the lane. Place a church and village homes behind banana stands and tree ferns. |
| Blue Mountain Peak and lower Yallahs valley | 01–03, 05–08, 11 | 03, 04, 05 | Fix the layered ridges and low Kingston silhouette in world coordinates. Move soft mist across nearby tree trunks, with gaps that reveal slope and distance. |

The race condenses several villages into one workout. Use low-cost silhouettes for distant neighbourhoods and keep individual cherries and speaker detail close to the road. Compare matched rider views to the generic race and measure two moving 60-second tablet samples. Release every scene allocation on exit. [Credited references](../../../worlds/bluemountains/SOURCES.md)

## Blue Ridge Parkway (#2084)

The historical world preset supplies autumn light. The current map catalogue and list of Blender courses omit this ride. Restore the 13-stage class and enter through Map Select, Race Setup and Race. The course renderer loads `courses/blueridge.course.json` and `courses/blueridge.glb` on either graphics backend. Use physical road distance for the scene, standings and profile. The 24.25 km workout condenses locations along the Parkway into a single ride.

| Rider view | Real photos | Game views | Geometry and light |
| --- | --- | --- | --- |
| Meadows and the canopy on the two-lane approach | 01, 04, 07–09 | 01–03 | Hardwoods overhang the bends. Give maples irregular red crowns, hickories gold leaflets, oaks deeper orange and mountain laurel a low evergreen silhouette. Use split-rail fences on open farmland. |
| Memphis Ridge and Grandview overlooks | 05, 10–12, 14 | 02, 04 | A paved pull-off has a low wall of individually coloured fieldstones and a named timber sign. Cooler fixed ridgelines overlap into the distance. Thin banks of morning fog drift below the road. |
| Linn Cove, the stone arch and the rock tunnel | 02, 03, 06, 15 | 04, 05 | Expose the curved segmented concrete deck, tapered piers and open gap below from the preceding bend. Model the masonry arch and dark tunnel bore separately, using inset joints and road-aligned abutments. |
| Mabry Mill | 09, 13, 14 | 01, 03 | Timber siding, pitched metal roofs, pond and the open wooden wheel form one silhouette. Turn the paddles on ride time, with a soft reflection under the far bank. |

Follow ADRs 0021, 0023, 0030, 0034 and 0035. Keep the skyline fixed like Caribana’s Toronto skyline. Merge static colour and wear into the local meshes and bound the dynamic fog and wheel geometry. Stop animation when paused and dispose of scene-owned assets when the rider exits. Capture rider-height views with the HUD before and after. Run two moving 60-second low/WebGL2 samples with fourfold CPU throttling and record submitted frames and draws. The restored photos and game images stay in the reference folder. [Credits](../../../worlds/blueridge/SOURCES.md)

## Bondi to Bronte (#2085)

The old Bondi preset provides daylight and a rider. Map Select currently lacks the class and the renderer lacks an authored coastal course. Restore the archived workout and draw `courses/bondi.glb` using `courses/bondi.course.json` for the centre line, timed stages and camera. The 6.15 km course brings the cemetery overlook into a headland loop before returning to finish alongside Bronte Baths.

| Rider view | Real references | Game references | Scene on the tablet |
| --- | --- | --- | --- |
| Promenade and Icebergs | 01–03, 11–13 | 01, 02 | Curve the beach and shoreline around Bondi Bay. Set the big lap pool and smaller pool inside white seawalls, retain lane marks below the water, and step the club building up the headland. Show surfers outside the swimming area. |
| Sandstone, Tamarama and its surf club | 04, 09, 15 | 01, 03, 04 | Shape exposed sandstone beds, dark recesses and rounded shelves. Break swell against the shelf toe, with surfers farther out. Keep the ochre surf club and its blue lettering in the small cove. |
| Waverley boardwalk | 05 and 06 | 03–05 | Timber decking and a seaward metal rail round the cliffs below stepped rows of white headstones. Stairs connect pedestrian landings without breaking the rider’s centre line. Walkers and runners keep to the verge. |
| Bronte beach and baths | 07, 08, 10 and 14 | 02, 04, 05 | A distinct beach and park precede the rock bath at the southern end. Norfolk pine tiers and coastal scrub identify the skyline. Use a hard sun, blue water and sunlit trim on wave crests. |

Apply the fixed depth layers, baked wear and shared moving geometry used by Caribana. The ride clock drives whitewater, surfers and path users. Merge static landmarks into cullable route sections. Dispose of scene geometry, textures and moving buffers on exit. Measure the 4× CPU low/WebGL2 ride at the pools and Waverley boardwalk after the warm-up, including submitted frames. Preserve both graphics backends under ADRs 0021, 0023, 0030, 0034 and 0035. [Credited references](../../../worlds/bondi/SOURCES.md)

## Bonneville Salt Flats (#2086)

Rider feedback specifically praises the original World Ride road. Keep its seeded packed-salt texture, dark parallel tyre scoring, narrow black guide line, open white shoulders, flags, crew colours and mountain horizon. The original `BonnevilleStreet` assembles the pits, timing equipment and a moving streamliner on a short recycling street. Race currently has no authored catalogue course for the 20-stage class. Load an 8.25 km level course with physical mile markers through Map Select and Race Setup. Share the existing road texture with the lazy course renderer. [Rider feedback #918](https://github.com/QuinntyneBrown/wattzup/issues/918)

| View from the saddle | Real references | Game views | Treatment |
| --- | --- | --- | --- |
| Start and the black line | 01–05, 12 and 15 | 01, 03 | Broad pale flats, a packed strip with tyre scoring, one black line and a timing gantry. Local polygonal crust and windblown ridges give way to a continuous white silhouette. |
| Speed Week staging | 06–11 | 02, 04, 05 | Vary motorhome bodies, enclosed haulers, canopies and team markings. Give streamliners long tapered noses and tiny cockpits, hot rods exposed wheels, and the push truck a low bumper. Animate the staged vehicle and crew together. |
| Mile boards and the Silver Island Mountains | 01, 04, 05, 12–15 | 01 and 03 | Number boards at actual miles. Fix the low irregular range to the northwest. Place an inverted silhouette and a moving shimmer beneath it; use the photos of wet salt for the far reflection. |
| I-80 and the viewing area | 03, 12 and 15 | 01, 03, 04 | A low, separate divided highway and stationary rest-area shelter sit across the southern plain. Moving highway traffic and intermittent puddles distinguish the scales. |

Follow L2-064–066 and L2-159–160, ADRs 0021, 0023, 0030, 0034 and 0035, and the performance design. Like Caribana’s skyline, the ridge keeps its position while near crews and vehicles move on the ride clock. Chunk the static pits and timing equipment, instance the moving detail and release it on exit. Preserve the original visual identity on both graphics backends. Measure two submitted-frame samples of 60 moving seconds on the simulated tablet. [Reference credits](../../../worlds/bonneville/SOURCES.md)

## Indianapolis Brickyard (#2087)

Map Select currently lacks a race catalogue entry for *90-Second Extended Accelerations*. The original class renderer’s 400 m repeating straight includes brickwork, pit crews, a waving starter and a fixed Pagoda. Its two existing rider captures document a correction that keeps the tower upright in bends. Preserve these features on the 12.00 km class course. No separate issue with Brickyard rider feedback appeared in the title search. [Original captures](../../../screenshots/brickyard/README.md)

Use one physical 4.00 km oval for three laps. The 19 effort stages retain their original timestamps and targets. In the course file, distance increases through the repeated coordinates. Model the trackside structures once so each lap sees identical sightlines and the final brick strip is the starting strip. Four constant-radius left turns link the front and back straights to two short chutes. Crossfall increases smoothly to nine degrees in each turn. The riding line stays level, with zero climbing across the class.

| View from the saddle | Real references | Game views | What the rider sees |
| --- | --- | --- | --- |
| Yard of Bricks and Pagoda | 01–03, 10–11, 13 | 01, 05 | A single yard of staggered reddish bricks crosses rubbered grey asphalt. Stepped glass bands and projecting steel decks silhouette the Pagoda to the left. |
| Pit exit and Turn One | 04–09, 12 | 02, 03 | A continuous white wall and catch fence follow the banking. Distinguishable stand tiers, roof trusses, crowd patches and pit-lane paint show the scale of the front straight. |
| Short chute and infield | 06–09, 15 | 02, 04 | Open fairways, sand bunkers, groves and a low museum sit inside the oval. They reveal the long sightline across the infield and summer cloud against a flat horizon. |
| Turn Four and finish | 01–05, 12–14 | 01, 03, 05 | A numbered, narrow scoring pylon precedes the fixed Pagoda. The flag stand, airborne balloons and roof flags move on the ride clock; the distant stands stay still. |

Use Caribana’s layered grandstand and fixed skyline as the reference for crowd scale and depth. Merge the stand fascia, benches, pit boxes and spectators into spatial chunks, and keep the distant tower silhouette whole. Batch repeated moving details into bounded buffers owned by the course scene and release them when the rider leaves. Compare six matched Low/WebGL 2 rider views and take separate 60-second samples on the front straight and the Turn Four approach, including actual submitted frames, p95 and longest interval and peak draw calls. Follow journey 8, L2-064–066 and L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035. [Credited references](../../../worlds/brickyard/SOURCES.md)

## Brighton Pride (#2088)

Brighton has a class-world colour preset and a gentle cadence-driven bend. Map Select has no authored course for the 13 stages of *Emily’s Short Mix*. Restore the credited reference set, then load a Blender course lazily from the race catalogue. Three circuits join the lower westbound Madeira Drive to a slightly higher eastbound Marine Parade. Their combined 13.075 km follows the original class timestamps. Scale the linking ramps to the class and keep the pier, i360, lift and railway in fixed positions. No earlier Brighton issue appeared in the title search.

| Position | Real / game references | Rider-visible geometry and motion |
| --- | --- | --- |
| Madeira Drive and colour guard | Real 01–06, 07; games 01–03 | The road runs beside the cliff, with barriers between riders and performers. Alternate original rainbow and Progress Pride banners, dancers, colour guard, a decorated float and an open-top parade bus. Vary faces, sleeves, skin tones and costumes. |
| Cast-iron terraces and railway | Real 07–09, 13; games 02 and 04 | Green arches with spandrels, slender columns, upper balustrade and lift roof frame the inland side. Sleepers and twin narrow rails run above the shingle. A small electric carriage passes independently. |
| Pier and Channel | Real 10–13, 15; games 01 and 05 | Repeated dark piles support a long white pavilion with distinct domes, lights and the silhouette of a ride near its seaward end. Pebbles and timber groynes separate the promenade from grey-green water. The observation pod appears on its slender western mast. |
| Marine Parade return and spectators | Real 01–06, 12 and 14; games 03–05 | Cream stucco terraces, bow fronts, balconies and cornices stand above the cliff. The elevation exposes the beach and lower procession from a second angle. |

Follow the Caribana separation of close performers, a recognisable middle-distance landmark and fixed horizon. Batch the static crowd and ironwork, share flags and vehicle materials, move the parade using ride time and release all geometry and textures when leaving. The supplied images guide proportions and remain reference-only. Compare rider views against the existing race and take two 60-second moving samples at 1024 × 768, DPR 1, 4× CPU throttle on Low/WebGL 2, reporting submitted FPS, intervals and draw calls. See journey 8, L2-064–066 and L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035. [Reference credits](../../../worlds/brighton/SOURCES.md)

## Brooklyn Bridge Commute (#2089)

The class renderer has a Brooklyn colour preset. Its music is *Beautiful Boom Bap* by Music_Unlimited, specifically praised as the rider’s third favourite. Keep the existing music assignment. Map Select lacks the 22-stage class course. Bring *Get to Work on Your Cycling Fitness* to Race as a 10.70 km morning ride. Take the raised promenade across the East River, turn through connected city streets, return to Brooklyn and cross once more to finish in Manhattan. The eastbound view looks back toward Brooklyn; the skyline stays fixed. [Rider feedback #938](https://github.com/QuinntyneBrown/wattzup/issues/938)

| Rider viewpoint | Real and game references | Treatment |
| --- | --- | --- |
| DUMBO to the rising deck | Real 04, 10–11, 15; games 01, 05 | Bonded red brick, industrial window bays, cobbled joints and the Manhattan Bridge down a side street introduce the ascent. |
| Near granite tower | Real 01–04, 12, 14; games 01–03 | Give each opening a pointed spring and deep stone reveal. A central pier and two buttressed outer piers meet a stepped crown. Baked stone courses and recess shadows read at Low. |
| Timber promenade and midspan | Real 01, 05, 08, 12–14; games 01, 03–04 | Worn transverse planks, a painted line, iron rails and vintage lamps place the rider above the traffic decks. Main cables sag between the towers; the diagonal stays fan to the edge and the suspenders run vertically. |
| Manhattan landing | Real 05–09, 11, 14; games 02, 04–05 | Set the faceted spire of One World Trade Center among several distinct Financial District silhouettes. Directional morning light picks out their east elevations. A ferry crosses the moving river below the neighbouring bridge. |

Use Caribana’s fixed skyline and staged levels of street detail. Merge static cables and lamps into local spatial chunks. Share bounded instance buffers for commuters, yellow cabs and cars; animate them on the ride clock without moving the deck beneath the rider. Release every buffer and material on exit. Supply paired Low/WebGL 2 views and separate tower and midspan moving measurements with 4× CPU throttle. Trace to journey 8, L2-064–066 and L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035. [Reference credits](../../../worlds/brooklyn/SOURCES.md)

## The Bund, Shanghai (#2090)

The class world has a Bund palette. Race lacks a physical course for *30 Minute High Cadence HIIT*. Its 23 intervals total 1,803 seconds. Run three flat laps along a raised promenade beside the Huangpu, with a northern turn near Suzhou Creek and a return along Zhongshan Road. Use that curve to frame the landmark group across the river from rider height, keeping all four towers on the same bank. Catalogue, timing and progression use the original class. No separate rider-feedback issue appeared in the title search.

| Viewpoint | Photographs and games | Geometry and light on Low |
| --- | --- | --- |
| Golden Bund facades and Peace Hotel | Real 01–04, 07, 13–15; games 03–05 | Floodlight the ashlar pilasters and cornices, colonnaded dome, Customs House clock tower and green pyramidal hotel roof. Keep the raised paving and rail distinct from the broad boulevard. |
| Pudong bend | Real 05–06, 11–12; games 01–03 | Model the Oriental Pearl’s splayed legs, two spheres and antenna, Jin Mao’s stepped tiers, the Financial Center’s trapezoidal opening and Shanghai Tower’s twisting taper. The dark water carries broken reflections between a barge and lit cruise vessel. |
| Huangpu Park | Real 02, 07–09, 12; games 01–02 | Low tree canopies frame the three rising blades of the People’s Heroes monument. Tourist pairs and groups gather at the rail, leaving the race lane clear. |
| Waibaidu crossing | Real 08–10; games 03–05 | Fixed steel through-truss portals, overhead bracing, riveted lower chords and a green wash form a short enclosed sightline before the southern return. |

Use Caribana’s fixed skyline and foreground crowd depth. Bake facade uplights and major LED lines into the geometry, batch the moving people and traffic and animate the water and boat on race time. The waterfront remains legible on Low without screen-space reflections. Release all dynamic buffers and materials on leaving. Compare matched rider views and sample a full minute on the promenade and bridge approach with 4× CPU throttling. Trace journey 8 and L2-064–066, L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035. [Reference credits](../../../worlds/bund/SOURCES.md)

## Sa Calobra, Mallorca (#2092)

The existing GCN *Aerobic Cadence Workout With Team Sky* already has a purpose-built world. Its class uses four stages (300, 1,180, 20 and 330 seconds). The race catalogue must expose the same class progression. In #921 the rider singled out the concept, camera and movement alongside Ibiza. Keep the existing hot spring light, fluted limestone, seeded goats, team car with roof-mounted bikes and unlined ribbon of asphalt. Capture the current chase camera and bend entry before altering the view. Use a continuous ride clock for moving vehicles and riders, including after pause.

Map Select → Race Setup → Race → the lazy world renderer → the Sa Calobra scene. The current scene already builds the cove, rock fins, vegetation, parapets and mountain backdrop. Its mountain carries twelve disconnected legs, and its knot consists of a torus and solid block. Build a continuous 26-bend route and a real open passage under the knot. Align the bridge soffit, road grade and retaining wall so the approach, underpass and upper deck read as views of the same structure. Preserve the chase camera’s height above the road, the bend-following look-ahead and smooth frame-to-frame placement that earned the earlier feedback.

| Rider view | References | Visible detail |
| --- | --- | --- |
| Port and gorge | Real 04, 12–15 and games 01, 04 | Small working waterfront, dark blue cove, rough shaded limestone fissure, trees breaking into the bright sun. |
| Stacked mountain road | Real 03, 05–08 and 15, games 01–03 | Low stone walls on the drop, grey cut faces on the inside. Separate the near road, opposing legs and distant Puig Major through parallax and haze. |
| Nus de sa Corbata | Real 01–02, 06, 09 and 11, games 02–03 | Distinct approach under the stone deck, 270-degree turn back onto it, parapet coping and arch shadow. |
| Coll dels Reis | Real 03, 08 and 10, games 01, 04–05 | Brown pass sign, stone café and parked bikes beside regrouping riders. A coach negotiates a bend clear of the rider lane. |

Reuse shared materials and bounded rider and vehicle parts on both rendering backends. Keep distant legs and peaks cheap on Low, with individual masonry, worn asphalt and shadows nearest the rider. Dispose all owned textures, meshes and shared buffers on exit. Compare matched views against the old class and the 20 credited images. Measure actual draws during two moving minute-long Low/WebGL2 samples, including the busiest knot approach, on the same throttled tablet settings as Caribana. Record p95, longest interval, peak calls and both HUD distances.

## Passo Campolongo (#2093)

Journey 7 reaches a class scene with a recycled forest road, chairlift, sign and rifugio. Keep the summer light, lift movement and the two distinct mountain silhouettes. Map Select must offer the eleven stages of GCN’s *Intense Climb: Passo Campolongo*, lasting 21:50 over 8.235 km. The independent race climbs from Corvara at 1,568 m to the 1,875 m sign. A title search found no separate rider-feedback issue.

| View from the saddle | Reference decisions |
| --- | --- |
| Corvara | Real 03, 07–08, 10, 12 and 14 establish white plaster, dark timber balconies, church scale and the position of Sassongher behind the village. Retain multilingual place names. Game 04 places the next turn above the rider’s shoulder. |
| Lower bends | Real 01–05 and games 02, 03 and 05 guide tree spacing, guardrails, smooth asphalt and chevrons. Model the opposing return leg on the same slope. |
| Ski crossing and meadow | Real 05, 06, 11 and 13 show clear pistes through the forest, suspended cabins and brown-and-white cattle. Game 01 guides the open sightline between cyclists and meadow. |
| Saddle | Real 06, 09, 11 and 15 guide the wide pasture, pale stratified Sella wall and surviving snow. The rifugio, signed altitude and Piz Boè complete the climb. |

Use the existing Sella Ronda Blender kit’s Corvara buildings and hotel details where their proportions match the reference images. Keep a single fixed Sassongher horn above the village and a separate flat-topped Sella massif and Piz Boè. Place the near forest, middle-distance pasture and distant cliff tiers at different physical depths. Merge static parts by visible road section. The lift follows fixed support towers and gently sagging spans. A bounded set of chairs and cattle update on race time and release their materials and geometry when the scene closes.

Trace Map Select through Race Setup to the lazy course renderer, the same-origin GLB, physical elevation and original interval plan. Preserve the two rendering backends and the existing HUD. Compare rider-height captures with the original course at matched distances. Count submitted frames, draw calls, p95 and longest frame through two moving Low/WebGL2 samples. Keep these captures and benchmarks opt-in.

## Cabot Trail (#2091)

Journey 7 currently reaches a generic rolling Cabot class world with its own bend, grade and clear morning lighting. Give Map Select a physical route for GCN’s 60 Minute Endurance Intervals. Retain all seven original stages, cadence, target resistance and 60:00 duration. Compress the geography to 25.075 km. No other Cabot Trail rider-feedback issue appeared in the title search.

| Rider viewpoint | References | Geometry on Low |
| --- | --- | --- |
| Chéticamp harbour | Real 10–12 and 14, games 02 and 05 | A timber wharf on piles and moored fishing boats sit below clapboard houses. Saint-Pierre’s square tower and silver spire rise above the roofs against the hills. |
| French Mountain | Real 01–06, 08 and 13, game 04 | Switchbacks follow a rock cut on one side and gravel shoulders, guardrail and Gulf on the other. The next section of road remains visible across the slope. |
| Highland plateau | Real 07, 09, 12 and 15, games 01 and 03 | Break the spruce canopy around bog pools. A yellow diamond with a dark moose silhouette stands before a grazing animal. Rust and gold maples cluster on the slopes below the spruce. |
| MacKenzie lookout | Real 03, 05–08, 13 and 15, games 02 and 04 | A gravel pullout overlooks successively paler headlands, the river valley and the descending road. The sea keeps a single elevation through the switchbacks. |
| Pleasant Bay | Real 10–11 and 14, game 05 | The road drops into the village. The fishing boat’s high bow, wheelhouse, working deck and trailing dinghy distinguish it from the wharf. |

Use the existing catalogue and Race Setup path into the lazy authored-course renderer. Read the arc-length course JSON and GLB from the ride's same-origin course assets. Bake cliff strata, roadside wear and canopy shade into shared geometry. Keep the far headlands in fixed coordinates like Caribana’s Toronto skyline. Merge local details into distance-culled sections. Use shared geometry for boat and animal parts on both backends, seed variation at construction, update from race time and dispose on departure. Keep class progression and HUD on the existing race engine.

Measure two sixty-second samples from the normal race entry with the simulated bike, nine seconds of warm-up, Low/WebGL2 and fourfold CPU throttle. Capture matched rider views before and after and record actual submissions, display callbacks, p95, longest interval, peak draw calls and advancing HUD distance. The performance and capture suites stay opt-in.
### Iceland Ring Road · #2139

The world registry describes Route 1 and supplies its original stage grades. The previous renderer gives Iceland a warm horizon and dark earth. Its historical class defines nineteen stages over 30 minutes at 80 rpm. Restore that plan to the race catalogue, keep the video at offset zero, and use an authored course in the lazy world library (ADRs 0021, 0023, 0030, 0034 and 0035). The compact 12 km route follows the landmarks in geographic order.

| Road section | Rider sightline and craft | Reference files |
| --- | --- | --- |
| Western approach and falls | Yellow roadside markers lead to small white farm buildings. Seljalandsfoss has a thin separated jet beneath an overhang. Skógafoss is a broad curtain against a flat basalt lip. Reuse the spray geometry and animate its alpha. | Real 01, 03, 05, 06 and 13. Games 01 and 03. |
| Vík and Eldhraun | Black sand, a narrow white surf line and dark offshore stacks precede irregular moss caps. Break the lava silhouette with low lobes and reserve surface grain for the near road. | Real 07–09 and 14. Games 02 and 05. |
| River and lagoon | An open steel bridge frames the braided channels. Model the glacier tongue between darker valley sides and put its crevasses into baked colour. Nearby stocky horses and sheep graze. Pale blue bergs float in front of the glacier as the low sun casts long shadows. | Real 02, 04, 10–12 and 15. Games 01 and 04. |

As in Caribana, fix the distant landmark in world space and concentrate geometry in the moving foreground. Isolate the water, grazing and iceberg materials to this course. The course owns their disposal with the route. Retain silhouettes on Low and share each motion across batched geometry. Test Map Select → Race Setup → Ride with fixtures, including pause and resume. Photograph the same six chainages before and after. Measure the opening and lagoon per the performance design with two 60-second submitted-frame samples after nine seconds of warm-up.

The baked route ascends 91 m. Each stage contributes its original time and cadence to its road length. A common grade increment per resistance level and a small background rise account for the climbing and the 21 m net elevation gain. The headlands, outlets and water sit at fixed positions. Lake ice floats on the common 45.8 m lagoon surface. The distant ice-cap plate is original generated artwork, with translucent edges fading into the modeled terrain. The terminal tongue, basalt strata, fractured bergs, two waterfall profiles, surf, farm buildings and livestock are original meshes. The basalt-grain and moss channels come from the repeatable bake in `tools/blender/iceland_surface.py`.
