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

### Caribana Parade

The catalogue must expose the historical GCN Training class *Intense Interval Blast*. The existing performance fixture instead copies another map and supplies a Caribana ID. Use the class’s 19 stages for the catalogue, setup, HUD and finish distance. Map Select opens the existing lazy world renderer. The Caribana branch loads the Ride One rider and cadence animation, with the existing chase camera, alternating bends and two rolling rises per 360 m. [Original rider and camera work](https://github.com/QuinntyneBrown/wattzup/pull/2060)

Low loads `worlds/caribana/caribana-tablet.glb`. The 24 m blocks share geometry and materials and draw up to 160 m ahead. The Toronto skyline uses its own material for a fixed backdrop. Higher tiers load `world-caribana.ts` and its crowd module. The detailed street already marches at 0.6 m/s. Low’s street clock currently does nothing. Keep kerbs, spectators and skyline fixed while moving selected band members with ride time. Register new GPU resources with the owning street and keep the actor count bounded across laps and screen exits.

| Rider view | Details to check | Reference |
| --- | --- | --- |
| Opening behind the band | Warm hard shadows, road paint, barricades, crowd scale and island flags | Real 01–04, 08–10, 15 and game 01–02 |
| Moving with the mas band | Feathered backpieces, King or Queen above the band, stilt walkers and steel orchestra | Real 05–07, 10–11 and game 03, 05 |
| Busy waterfront stretch | Layered crowds, tree cover and water, Gardiner spans, cream pavilion and stable CN Tower beyond the near band | Real 08–09, 12–14 and game 04–05 |

Use paired normal-HUD shots on a simulated bike. Count actual renderer submissions as well as animation callbacks over two moving samples on the production build, with the original benchmark’s viewport, CPU throttle and warm-up. The original 59.65 FPS callback measurement provides historical context. Compare the retained art against the [Caribana iteration record](../../../screenshots/caribana/README.md) and [source credits](../../../worlds/caribana/SOURCES.md).

### Central Park Loop

The historical *15 Minute Cardio HIIT* supplies 16 stages and a 6.450 km finish. The catalogue currently omits the map. The concept street already provides a trotting carriage, joggers, a winged fountain and skyline, but its roadside objects recycle and towers travel with the camera. Map Select and setup must open a single physical Park Drive lap. Compress the park to the class length. The reservoir and Bethesda Fountain occupy separate bodies of water.

| Station | Rider-height target | Sources |
| --- | --- | --- |
| Southern carriage drive | Red and ivory hansoms beside painted lanes under mature trees. Driver, shafts, harness and spoked wheels read in profile. | Real 01–06, 12–13, 15 and games 01, 05 |
| Bethesda Terrace | Bronze wings above two bowls, brick paving, stair balustrades, nearby park furniture and the Lake behind. | Real 10–11 and games 02, 04 |
| Engineers’ Gate and reservoir | Runners, Citi Bikes and club cyclists pass the black fence and cinder path. The jet and tower reflections break a broad expanse of water. | Real 03, 05, 07–09, 14 and games 01, 03, 05 |
| West Drive and the southern finish | The two San Remo crowns and distinct slender Midtown towers pass behind autumn gold and green canopy in low pink light. | Real 01, 04, 06, 08–09, 12 and games 02, 04 |

Use the scene’s existing carriage proportions, trotting diagonal pairs and seeded runner speeds. The static Blender export owns terrace, fixed skyline, benches, painted lanes, rail and water reflections. Animated figures follow the physical centre line, advance on ride time, and release all meshes and materials on exit. Instance repeated figures and split static meshes into culled sections. Keep the camera at rider height. Compare identical HUD distances on the original street and the revised lap, then count submitted frames on the production tablet build. [Source credits](../../../worlds/centralpark/SOURCES.md)

### Cherry Blossom Festival, D.C.

The concept registers a blue spring sky and a pink haze around a generic street. Its historic class has 59 stages but no public map. Model five physical circuits of the basin in the class distance, using the same shore and fixed monuments each time. Store the original video, timings, cadence and target resistance with the course. Match the public map and rider HUD to that plan.

| Where to look | Rider-height details on Low | Sources |
| --- | --- | --- |
| Yoshino canopy | Low spreading dark limbs frame clusters of white and pale pink flowers. A narrow granite edge separates path and water. | Real 01–05, 11, 13–14 and games 01–02 |
| Jefferson and the water | White ring of Ionic columns, broad shallow dome and front steps on the opposite shore. Rippled reflections below the portico and trees. | Real 03–06, 14 and games 02, 04 |
| Mall lawns | Washington Monument’s tapered shaft and pyramidion extend above festival tents, banners, portrait photographers and families flying kites. | Real 01–02, 07–10, 12–13, 15 and games 03, 05 |
| Boat landing | Blue pedal boats carry passengers in front of the seawall and blossoms. Close visitors move against the fixed horizon. | Real 02–05, 11–14 and games 01, 04 |

Race Setup uses the existing segmented radio group for Daylight and Sunrise on a local ride. Carry the choice on that ride’s route into WorldScene and its renderer options. Store no account preference. The route, static mesh and moving actors are shared by both looks. Batch blossom clusters and visitors, bake distant reflections and animate bounded kite and boat groups on ride time. Compare normal-HUD views and observe real submitted frames on the simulated tablet. [Credited references](../../../worlds/cherryblossom/SOURCES.md)

### Champs-Élysées Finale

The concept street already draws the arc, Haussmann houses, plane trees, barriers, flags and spectators. The bounded street recycles past the rider and the public catalogue omits this class. Open the historical 27-stage sprint session through Race and model three compact laps between Place de la Concorde and Place Charles de Gaulle. Opposing carriageways share the same monument, wide pavement and city block positions throughout. The final gantry lies on the same line on each lap.

| View at rider height | Details to retain in Low | Sources |
| --- | --- | --- |
| Lower avenue | Granite setts, railings, shops and cafés beneath limestone balcony bands and slate mansards. Paired clipped plane rows keep the avenue axis open. | Real 01–06, 10, 13–14 and games 03, 05 |
| Charles de Gaulle turn | Large open main vault, secondary passage, relief panels, frieze, attic and projecting cornice. The bunch rounds the island. | Real 05–07, 10 and games 01–03 |
| Concorde return | Gold-tipped obelisk, bronze and gilt fountains, evening lamp silhouettes and Eiffel lattice crown beyond the Seine. | Real 08–09, 11–12, 15 and games 04–05 |
| Final sprint | Rows of moving tricolores, spectators, grandstands, distance boards and the gantry. The moving bunch broadens across the lane. | Real 01–04, 13–14 and games 01–02, 05 |

Bake surface wear and recesses into the shared street meshes. Use fixed skyline geometry and repeated spectator figures as in Caribana. Bound the moving cyclists and wind-driven cloth and animate both on ride time. Release their shared resources with the course. Photograph the original street and the physical route at equivalent HUD distances, then measure actual scene submissions on the production tablet build. [Credited reference folder](../../../worlds/champs/SOURCES.md)

### Chicago Loop Crit

The original Chicago concept supplies a sky and palette. Build one physical 1.75 km circuit shared by five laps of *20 Minute Crit Sprints*. Preserve the historical GCN video offset, target resistance and cadence for all 14 stages. Use eased quarter-circle kerbs at the square corners and fixed coordinates for both river crossings and every building.

| Location | Details at rider height | Reference material |
| --- | --- | --- |
| Wabash straight and CTA station | Green and weathered ochre I-columns, riveted gussets, paired girders, closely spaced ties and platform stairs. The moving silver train has dark windows, doors, couplings and bogies. Repeated track shadows break across the road. | Real 01–07 and games 01–02 |
| North river crossings | Span hinges, red-brown side trusses and grating over green water. Marina City has paired cylindrical concrete balcony stacks. The Sears/Willis silhouette and antennae remain fixed behind masonry and glass blocks. | Real 03–05, 10, 14 and games 02, 04 |
| State Street return | Chicago Theatre vertical letters and marquee, older stone window bays, modern reflective towers and stoplights. Barrier feet, spectators and sponsor banners delineate corner entry. | Real 07–13, 15 and games 01, 03, 05 |
| Roadside detail | Tyre-worn crosswalks, utility covers, patched pavement, yellow cabs and newspaper boxes. A shared steam sprite rises above selected grates and holds on pause. | Real 01–03, 06–12, 15 and games 01, 04–05 |

Build and batch static geometry in Blender. Animate short train consists and steam on ride time. Synthesize the rail rumble locally with a bounded audio graph, gated by distance, pause, and the rider’s sound preference. Dispose it when the race closes. Ride from the normal map catalogue to record paired shots and moving submitted-frame samples. [Credited sources](../../../worlds/chicago/SOURCES.md)

### Chichén Itzá

The existing class world repeats a 400 m causeway and paints the nine-terrace pyramid in its horizon. Earlier rider evidence records a uniform canopy and hidden lower terraces, then a fix to keep the pyramid upright on bends. Preserve the raised road, textile patterns, visiting families and flying parrots. Give the cenote, temples and plaza separate, fixed places on the 12.7 km route. Preserve *The Full Pyramid*’s 21 stages and its original video.

| Section | What the rider sees | Source references |
| --- | --- | --- |
| Sacbé and shade | Dusty pale road, rubble shoulders, slender trunks and ceiba buttresses at different distances. Hand-painted textiles and visitors stand outside the racing line. | Real 01, 03, 05, 08 and games 01–03 |
| Cenote rim | Irregular sheer walls with recessed bands, hanging roots, reflected foliage and still green water below the road. The rim curves long enough to reveal the depth. | Real 03, 08, 13 and games 03–04 |
| Temple approach | Long staggered rows of stone columns, individual drum seams, terraced Warriors temple with carved uprights, serpent heads and low weathered relief platforms. | Real 04, 09–12, 14–15 and games 01, 05 |
| Plaza finish | Four stairs climb nine stepped terraces to the summit temple. Grey limestone stands in harsh overhead light over grass and pale bare ground beneath towering cumulus. Visitors give the monument scale. | Real 02, 06–07, 09, 14 and games 02, 04–05 |

Use physical centre-line positions for the camera, grade, surfaces and actors. Batch forest cutouts in sections; keep the temples separate from near-road culling. Animate the bounded group of parrots, moving visitors and cloud drift on ride time. Compare normal race entry on the simulated bike with the [earlier scene](../../../screenshots/chichen/README.md) and the [credited sources](../../../worlds/chichen/SOURCES.md).

### Cinque Terre · motion on the SP370

Keep the existing Blender-built corniche, the original 20 class stages and the five village sites. Earlier course passes built the terraced vineyards, capstones, boats on chocks, Doria tower, cafés, balconies, shutters, fishermen’s nets, churches and trail crossings. They also corrected the moving horizon and made the castle visible from the road. Build on those assets. The fishing boats offshore and walkers at the crossings currently stand in baked geometry.

| Sightline | Treatment from the saddle | Credited references |
| --- | --- | --- |
| Corniche and terraced hills | Retain capstones, grade, vines, scrub, olives, agaves and the stone stair. Make walkers with packs and separate trekking poles advance at human pace where the path meets the road. | Real 01–03, 11, 14–15 and games 01, 03, 05 |
| Vernazza | Keep Santa Margherita and the Doria tower fixed over the harbour. Moor original double-ended painted gozzi with a dark gunwale, benches and oars. Animate rocking and nearby broken foam together on ride time. | Real 07–09, 14 and games 02, 04 |
| Manarola, Corniglia and Riomaggiore | Preserve each village’s original geometry. Dark green shutters, terracotta coping and warm façade colours stand against deeper blue-green sea and cooler headlands. The afternoon light warms approaching the finish. | Real 01, 04–06, 09–13 and games 01, 03, 05 |

Determine boat and path positions from the authored centre line; keep the original fixed boats on their chocks. Use bounded shared geometry and materials for walkers, boats and surf. Sample actual submitted frames and capture the existing and revised race at the same chainages. [Earlier course views](../../../screenshots/cinqueterre/README.md) and [reference credits](../../../worlds/cinqueterre/SOURCES.md).

### Cliffside Coast · Headland Road

The catalogue exposes `cliffside-coast` after the Prairie Paceline bot-race unlock. Race Setup passes world `coast` to the course renderer. The existing Blender course already has guardrails, cottages, scattered pines, an offshore rock field and a banded lighthouse. The long folded road doubles back across the same land. The shoreline loses its place on the right, yellow gorse reads as isolated lumps and there are no moving breakers or occupied overlooks.

| From the saddle | Geometry, material and movement | References |
| --- | --- | --- |
| Opening and first surge | Follow the contour with a succession of coves on the right. Keep the stage distances and existing centre-line heights. Model layers of weathered pale cliff over a darker tidal band, with turf overhanging the top. The sun stands low over the sea ahead and to the right. | Real 01–07 and 13, games 01, 02 and 04 |
| Lookout and lantern | Build out the lay-by beyond the running lane with stone coping, a parked car, walkers and a path to the viewpoint. Keep a single tapered white tower on its promontory with windows, a gallery, glazed lantern, roof and finial. | Real 11, 12, 14 and 15, games 02 and 03 |
| Coves and lower headlands | Break foam into separate lines that advance and fade where the water reaches the rocks. Keep the distant surf broad and the closest wash finer. Baked silhouettes and material variation define the windward grass, gorse flowers and heather. | Real 05–10 and 13–15, games 03–05 |

Use Caribana’s separation of near surface detail and fixed skyline. Batch the cliff strata and plants into native course sections. Derive the moving surf and lookout positions from the built coast and animate them on ride time. The world owns and disposes the shared actor meshes. Keep both graphics backends and the existing fallback. Compare matched opening, crest, cove, lookout and lighthouse views through the simulated race. Measure two one-minute runs on Low at 4× CPU throttle. [Visual references](../../../worlds/coast/SOURCES.md).

### Lake Como · the shore road

The original Como class scene built villas, launches, ferries, Bellagio’s point and a wooded far shore. Earlier rider feedback fixed the mountains sliding sideways in bends. The race catalogue lacks a Lake Como entry. Restore the original Seated Surges plan and route `lake-como` through Race Setup to the lazy course renderer and `courses/como` assets (ADR 0034 and ADR 0035). Keep the far shore fixed. The western shore and Bellagio and Varenna sightlines compress real distances into the workout.

| View from the saddle | Construction and motion | References |
| --- | --- | --- |
| Shore and villages | Set a downhill lake edge behind a narrow coping or iron rail. Vary the pastel buildings, shutters and roofs with site-specific church towers. Keep water close to the road through the bends. | Real 01–06, 11–14 and games 01, 04, 05 |
| Villas and galleries | Villa Carlotta stands behind linked garden terraces. Balbianello has two slim towers, a loggia and a rocky wooded point. Give the short gallery actual openings at both ends. Plane crowns and cypresses frame the sightlines. | Real 07–09, 11, 14–15 and games 01–03 |
| Open lake | Use fixed, increasingly pale mountain layers for depth and share materials across landings and vessels. A white two-deck ferry and low hydrofoil follow separate crossings with wakes driven by ride time. | Real 02–04, 06, 09–10, 12–13 and games 02–05 |

Caribana’s foreground, middle distance and fixed skyline inform the rail, moving boats and mountains. Match HUD-visible views to the same chainages before and after. Test pause and resume through Map Select and measure actual Low/WebGL 2 submissions through the promenade and the ferry crossing on the simulated tablet. [Reference credits](../../../worlds/como/SOURCES.md).

### Comuna 13 · the escalator streets

The older class maps `comuna13` to a midday palette and a bending road. It has no dedicated race catalogue entry. Race Setup must pass the restored class stages to the existing engine, with the Blender-built course loaded through the lazy world renderer. Keep the bike on sloping concrete beside the stair and escalator flights. Compress the neighbourhood into a succession of switchback blocks, increasing the rise in the harder stages.

| Section | Construction and movement | Reference IDs |
| --- | --- | --- |
| Entrance and painted lanes | Hang pennants between houses. Place original local-scale portraits, birds and flowers on masonry; bake pigment wear and mortar lines. Reuse the texture across distinct wall panels, leaving clear sightlines through the bends. | Real 03–05, 07, 09, 11, 12, 14; games 01–03 |
| Escalator flights | Place shallow-pitched orange roofs on thin posts and rise from a real lower landing to an upper one. Move riders with the treads. The road and painted stairs keep separate paths. | Real 01, 02, 06, 07, 15; games 02, 04 |
| Dance terrace and market | Dancers alternate a crouch, a turn and floorwork. Place a watching group beyond the riding line and fruit, griddle and crafts beneath awnings. Use bounded repeated figures and cover the closest faces with artwork at rider scale. | Real 02–05, 08–10; games 01, 02, 05 |
| Upper hillside | Layer brick homes, sheet-metal roof ribs, rebar, tropical plants, distant city towers and the opposite mountain ridge. Keep the panorama in world coordinates. | Real 06, 08, 13–15; games 03–05 |

As on Caribana, foreground actors move against a separately drawn fixed skyline. Hold motion on the race clock. Use shared meshes for repeating people and release textures and buffers on exit. Measure submitted world frames in two one-minute Low/WebGL 2 samples and match each HUD screenshot to the existing class view at the same distance. [Reference credits](../../../worlds/comuna13/SOURCES.md).

### Coney Island Boardwalk

The course keeps the original boardwalk from [rider feedback #926](https://github.com/QuinntyneBrown/wattzup/issues/926). The physical course supplies distance and elevation. Its scene reuses the existing ConeyStreet plank texture, ribbons, chalk, beach furniture, façades and ride structures. A single owner releases the street geometries, textures and materials on race exit. The ride clock supplies the wheel angle and train position so a pause holds their pose. The landmarks keep their positions along the boardwalk as the rider passes.

| View | Detail at riding speed | References |
| --- | --- | --- |
| Planks and promenade | Keep the timber colour variation, nail heads and herringbone scale. Green railings separate the walkway from the Atlantic. | Real 01–03, 06–07 and 14, games 01 and 03 |
| Clam bars | Ruby’s and Paul’s Daughter carry individual lettered fascias, service windows, counters, awnings and bunting. | Real 03–05, games 01 and 04 |
| Wonder Wheel | Fixed gondolas stay outside the paired rims. The inner gondolas run on curved tracks and remain upright. | Real 08–09, games 02 and 05 |
| Cyclone and Thunderbolt | The Cyclone train follows its timber-supported track. The Thunderbolt’s steel lift and orange track give the two rides distinct silhouettes. | Real 04, 10–11 and 15, games 02 and 04 |
| Beach and horizon | Beachgoers, towels and umbrellas sit in front of the surf. The pier piles lead toward open water and the red tower rises above the sand. | Real 06–07 and 12–14, games 03 and 05 |

### Copacabana Promenade

The red ciclovia follows the bay from the fort towards Leme. Its course takes distance, target resistance and cadence from the original GCN Training Quick Sprint Session. A fixed landmark group carries the granite domes behind the curved shore. The foreground follows Caribana’s separation of nearby activity from its skyline. Limited groups of figures and breakers advance on the ride clock and release their shared buffers when the rider leaves.

| View | Construction and sightline | References |
| --- | --- | --- |
| Posto 6 and quiosques | Lay Portuguese-stone wave bands in metres alongside the red cycle lane. Build round kiosks with serving windows, canvas shades and yellow chairs. | Real 01–04, games 01–02 |
| Beach courts | Tensioned nets and posts stand perpendicular to the water. Players shift their weight and reach to receive the ball through a repeating rally. | Real 05 and 08–09, games 02 and 04 |
| Avenida Atlântica | Coconut trunks lean toward the water. Broad tropical almond crowns shade the avenue and kiosk tables. Crossings and kerbs separate the cycle lane from traffic. | Real 01–03, 09–10 and 13–14, games 01 and 03 |
| Copacabana Palace | The white central pavilion, projecting wings, upper cornice, balconies and arched windows interrupt the apartment façades. | Real 09–11 and 14, games 01 and 03 |
| Leme and Sugarloaf | Pão de Açúcar has a steep granite face above a green base. Nearer headlands overlap it differently round the bay. | Real 05–07, 12 and 15, games 04–05 |
| Atlantic | Repeated shallow waves fold into strips of foam. Warm sunset reflections stretch toward the beach, opposite the apartment shadows. | Real 05–07, 09, 13–15, games 04–05 |

### Copenhagen Cycle Superhighway

The race follows a condensed Supercykelsti from the commuter avenues to the harbour. The physical route uses the original class stages. Caribana’s fixed skyline and moving parade inform the separation between copper spires, waterfront façades and near-field riders. Repeated bicycle wheels and frames share geometry. The race clock drives pedals, traffic lights and speed markers, including pause and resume.

| View | Construction and riding sightline | References |
| --- | --- | --- |
| Protected track | Granite kerb, blue crossing paint, asphalt wear, orange C signs, counter display, public pump and low footrest. Signals face the bike lane. | Real 01–02, 06–07 and 13–14, games 01 and 03 |
| Commuter rush | High handlebars, coat silhouettes, mudguards and baskets identify upright city bikes. A two-wheeled long-john and three-wheeled front-box cycle have distinct frames, boxes and wheelbases. | Real 01–02 and 06, games 01 and 03–05 |
| Cykelslangen | The orange running surface rises into an S bend above the water on slender piers with closely spaced rail pickets. | Real 03–05 and 12, games 02 and 04 |
| Harbour baths | Timber decks and stairs enclose blue water with swimmers, a lookout and a striped red-and-white marker. | Real 10–11 and 15, games 02 and 05 |
| Nyhavn | Narrow gables, uneven roof heights, windows and awnings rise across a row of wooden vessels. Trees and crowded racks stand in the foreground. | Real 08–09 and 15, games 02 and 03 |
| Inner harbour bridge | Distinct bridge rails and spans open views towards the distant quays and copper spires in low northern light. | Real 05, 11–12 and 15, games 02 and 04 |

### Cornish Harbour

The same 2.4 km circuit returns to the harbour for three passes during Nasty Pasty Sprint Session. The route draws on Padstow, Mousehole, St Ives and Polperro. Its slate sky and wet grey lanes preserve the earlier minimalist direction. Detail is concentrated where the rider can recognise it, with open water and uncluttered approaches between the quay, shops and headland. The fixed lighthouse and receding cottages use Caribana’s separation of foreground activity from a fixed skyline. [Rider feedback #932](https://github.com/QuinntyneBrown/wattzup/issues/932)

| View | Construction and riding sightline | References |
| --- | --- | --- |
| Lane and climb | Pale walls, slate roof pitches, chimneys, granite kerbs and one parked vehicle follow the slope. | Real 03, 06–07, 10, 14–15, games 01 and 03 |
| Harbour boats | Blue, red and off-white fishing hulls carry small wheelhouses, rails and working gear. Boats in deep water bob, grounded boats heel on the sand. | Real 01, 04–05 and 08–11, games 02 and 05 |
| Quay wall | Dark wet lower courses line pale granite coping, iron ladders, bollards and coiled pots. Fishermen and a dog share the quay path. | Real 01–02, 04–05 and 09, games 01 and 04 |
| Shop corner | The pasty shop has a painted fascia and display window, a chalkboard and a hanging basket. Visitors gather in small groups. | Real 03, 06–07 and 13–15, games 01 and 03 |
| Harbour mouth | A lighthouse ends the stone arm. Gulls with dark wingtips pass the green headland. Low light glints on water, wet sand and stone under a broken cloud layer. | Real 08–12, games 02, 04 and 05 |

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

## Cypress Mountain (#2108)

The catalogue records the old version at 35%. Its mountain terrain supplies a climbing gradient and coastal colour. The normal entry needs a dedicated map for the historical class and a course that places each lookout, bridge and ski station at a fixed point. Keep the existing race HUD, the class plan and the foreground cyclists’ scale. L1 Race, the ride-a-map journey, L2-064–066 and L2-159–160 cover this route. ADRs 0021, 0023, 0030, 0034 and 0035 govern loading, rendering and Low. The performance design covers the moving tablet sample.

| Rider view | Local detail | Reference |
| --- | --- | --- |
| Lower forest, 0.08 km | Tall narrow conifers, broken canopy, wet lane and climbing cyclists | Real 09, 10, 13 and 15. Games 01 and 02 |
| Lower switchback, 2.67 km | Broad asphalt return, concrete barriers, chevrons and a cut slope | Real 01 and 09. Games 01 and 05 |
| Highview, 5.65 km | Turnout, viewing plaque, two suspension towers and downtown beyond the inlet | Real 01–04, 08 and 12. Games 02 and 03 |
| Howe Sound, 9.32 km | Forest gives way to blue islands and overlapping coastlines | Real 09, 11 and 14. Games 02 and 05 |
| Upper mountain, 14.54 km | Black Mountain, Strachan and twin Lions with cleared ski runs | Real 07, 11 and 15. Games 01–03 |
| Ski area, 17.94 km | Timber lodge, lift terminal, visible moving chairs and warmer light | Real 05–07. Games 03–05 |

Map Select → Race Setup → Race loads the historical plan, then the world-specific course through the lazy renderer. The road centre line supplies the route panel and the physical camera. Fixed low-poly geography and bounded forest batches keep the horizon steady while near trunks pass the rider, following Caribana’s separation of near and far detail. Low uses the same skyline and chair silhouettes as the higher tiers. Clock-driven cyclists and chairs release their shared meshes and materials on exit. Compare six original and revised rider views, then count submitted frames in the two one-minute samples at 55 m and 5,400 m.

## Yorkshire Dales (#2109)

The class-world inventory rates Yorkshire Dales at 35%. The existing scene sets the moorland palette. The class needs its own catalogue entry and landmarks on a fixed road, with working walls, sheep, barns, exposed moor and a race-day crowd at the crest. Map Select → Race Setup → Race loads the original Race Winning Intervals plan and lazily opens the native Dales course. Its centre line drives the HUD grade, cyclist and camera together. L1 Race, the ride-a-map journey, L2-064–066, L2-159–160 and ADRs 0021, 0023, 0030, 0034 and 0035 apply.

| Rider view | Composition on Low | References |
| --- | --- | --- |
| Hawes, 0.08 km | Rough grey fronts, shop doors, yellow bikes and rose bunting close to the road | Real 06, 07, 13–14 and game 01 |
| Valley barns, 3.26 km | Patchwork fields, limestone joints and detached barns in the middle distance | Real 08–10, 13, 15 and games 01 and 03 |
| Exposed edge, 7.48 km | A narrow lane, thin white posts and an open fall into Swaledale | Real 01–05 and games 02 and 03 |
| Final ramp, 9.12 km | The crowd and waving flags flank the painted lane. Heather covers the crest | Real 02–07 and games 02, 04 and 05 |
| Flock, 14.52 km | White fleeces and black faces at the green verge below the heather | Real 03, 09, 12–13 and games 01 and 03 |
| Muker, 22.88 km | Stone cottages and pubs rise above the valley floor | Real 08–11, 14–15 and games 01 and 04 |

Bake the far fells and field walls in stable coordinates so they stay fixed behind the moving verge, as Caribana’s skyline does behind the parade. Chunk near walls and use shared bounded geometry for sheep, cloth and the crowd. Preserve the gate openings and grazing scale on Low. Release the scene, material and animation state on leaving the race. Compare six matched rider views. Count submitted frames over a minute at Hawes and again with the crowd visible, with the tablet settings in the performance design.

## Daytona Beach Sand (#2110)

The inventory records 74% implementation and a 33/100 visual score. DaytonaStreet already has packed tyre tracks, wet and soft sand ribbons, moving foam, lifeguard towers, umbrellas, strollers, stock cars and a start tree. Its 400 m loop repeats the pier and hotel silhouettes. [Rider feedback #905](https://github.com/QuinntyneBrown/wattzup/issues/905) praises the low-memory ride. Keep its pooled surface and people. Give the stepped Hilton, Bandshell, pier and amusement rides separate positions along Tide Line. Map Select → Race Setup → Race loads the original Drag Race plan and its dedicated course. The same flat physical centre line positions the cyclist, HUD and nearby props.

| Rider view | Composition on Low | Reference |
| --- | --- | --- |
| Start, 0.08 km | Grooves and low reflected sunlight on packed sand | Real 01–04, games 01–02 |
| Beach traffic, 0.71 km | Slow cars on the shore side of the ramp, separated from the tide-line race | Real 01–02 and 06, games 01 and 03 |
| Hilton, 2.33 km | The stepped mass and balcony rows rise landward of umbrellas | Real 04–06, 09–10 and 12, games 03 and 05 |
| Bandshell, 3.48 km | Coquina arch and towers, seating terrace and boardwalk approaches | Real 06, 12–13 and 15, games 03–05 |
| Pier, 3.83 km | Low diagonal pilings and the restaurant cross the surf, backed by the wheel and Sky Coaster | Real 03, 07–08, 11, 13–14 and games 01, 03 and 05 |
| Southern shore, 6.62 km | Lifeguard huts, ramps, loungers and Atlantic breakers continue beyond the pier district | Real 01–04, 09–10 and 12, games 01–02 |

As in Caribana, the foreground follows race time while the skyline remains fixed. Use packed static geometry for the pier and hotels, bounded pools for cars and waves and shared materials for repeating beach furniture. Dispose the loaded assets with the course. L1 Race, the ride-a-map journey, L2-064–066, L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035 apply. Capture the six viewpoints before and after and measure actual moving frames at 45 m and 3,370 m.

## Death Valley (#2111)

Select Death Valley in Map Select, open Race Setup and start Badwater Road. The maps catalogue supplies the Sufferfest plan and the dedicated course supplies the centre line, camera and physical gradient. The inventory records 80% implementation. Earlier iterations added modelled ridges, dunes, parasols, ravens and a roadside crowd (#310, #312, #314 and #315). The existing scene repeats the aid station, sign and thermometer on a short loop. Keep the salt and scrub variation, hot-air shimmer and raven flight. Place the two landmarks at their own distances. Concentrate people at the Badwater trailhead and Furnace Creek so the long stretches between still feel empty.

| Rider view | Composition on Low | References |
| --- | --- | --- |
| 0.08 km | Twin yellow lines cross sun-bleached asphalt beneath the near Black Mountains. | Real 01–02, 09–10 and game 01 |
| 0.89 km | The Badwater elevation sign, timber boardwalk and shallow brine mark the edge of the basin. | Real 03–06 and games 01–02 |
| 2.28 km | Raised polygon rims cross the bright flats below the distant Panamint Range. | Real 04–08, 15 and games 02–03 |
| 4.63 km | Gravel fans spill from banded canyons into low clumps of creosote and desert holly. | Real 09–10, 14–15 and games 01 and 04 |
| 7.74 km | A stepped series of golden Mesquite dune crests rises above the road mirage. | Real 11–13 and games 03–05 |
| 9.07 km | The Furnace Creek thermometer rises beside the shaded race aid stop. | Real 03, 09, 13 and games 02 and 05 |

Use Caribana’s fixed skyline technique to separate the Panamints from the near alluvial fans and roadside salt edges. Bake canyon strata and dune lee slopes into vertex colours. Pool foreground scrub and wildlife, update the mirage and wingbeats on the ride clock, and release geometry, maps and materials when the course closes. The valley landmarks are condensed to the original workout. L1 Race, the ride-a-map journey, L2-064–066 and L2-159–160 trace to the performance budget and ADRs 0021, 0023, 0030, 0034 and 0035. Measure submitted frames beginning at 540 m and 8,560 m and capture six paired rider-height views with the HUD.

## Diwali, Marine Drive (#2112)

The world inventory lists a 35% concept. The original workout exists in the historical class catalogue, while the race has no dedicated Blender course or physical seafront. Map Select → Race Setup → Race must load the 22 stages and the authored centre line together. Use the historical 25:05 workout length and extend the arc of Marine Drive along its 10.163 km ride. A search of the repository’s GitHub feedback for Marine Drive located the feature issue and no separate rider report.

| Rider view | Composition on Low | References |
| --- | --- | --- |
| 0.08 km | Nariman Point towers and the first gold lamps frame the dark bay. | Real 01–04, 07–08 and games 01–02 |
| 1.27 km | Rounded balconies, vertical fins and pastel walls overlook parked black-and-yellow taxis. | Real 04–07, 14 and games 02–04 |
| 2.68 km | Akash kandil lanterns, oil lamps and rangoli cluster outside the apartment entrances. | Real 05–06, 11–13, 15 and games 03 and 05 |
| 4.84 km | The sodium lamps arc around the bay, with visible gaps between them and the far skyline. | Real 01–03, 07–08 and games 01 and 05 |
| 6.46 km | Fireworks rise above the sea wall and colour the water behind families on the promenade. | Real 03–04, 08–12 and games 01, 03–04 |
| 9.21 km | Malabar Hill rises across the water beyond Chowpatty and the last light-wrapped palms. | Real 01–03, 07–08, 11 and games 03 and 05 |

Bake bevels, balcony shadows, tetrapods and the far silhouettes into section geometry. Give the recessed round balcony corners and stepping rooflines the same attention Caribana gives its CN Tower. Reuse static lamp pools and reflections at Low. Bound the festive crowd, firework trails and taxi draws, move them with ride time, and dispose their shared assets with the renderer. Roadside lamp spacing and fixed views across the bay should read at riding speed. Capture the six views before and after and measure submitted frames at 55 m and 6,040 m. Apply L1 Race, the ride-a-map journey, L2-064–066 and L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035.

## Neon Docklands (#2113)

Map Select → Race Setup → Race already loads the native docklands GLB and its course file. The historic class inventory describes one-minute punches. The live map has eight 30-second work intervals within 17 stages and 30:00. Preserve that shipped plan, all resistance and cadence values, the 21.6 km centre line and its 120 m of climbing. The inventory records 85% implementation and 35/100 visual quality. The current generator repeats paired rectangular pylons with fanned stays, boxes for hulls and superstructures, and sheds with few loading-bay details. Keep the existing wet asphalt (#317), drizzle (#68), umbrellas (#76, #285) and neon signage (#47, #212) as visual references.

| Rider view | Composition on Low | References |
| --- | --- | --- |
| 0.08 km | Wet paint and mooring furniture lead away from the port start. | Real 04–05 and games 01–02 |
| 1.32 km | Floodlit brick canal warehouses rise in gabled bays behind waterside cafés. | Real 06–08, 13–15 and games 02–03 |
| 4.05 km | The inclined white cable-stayed pylon rises above the first effort ramp. | Real 01, 09–10 and games 03–04 |
| 6.50 km | Twin illuminated pylons stand above the second effort and its water reflections. | Real 02–05 and games 01 and 04 |
| 8.17 km | A passenger liner, tall-ship rigging and the ferry landing mark the terminal. | Real 05, 11–14 and games 02 and 05 |
| 10.78 km | A series of lit steel arches encloses the effort deck above the black water. | Real 01–04, 10, 14–15 and games 03–05 |

Adapt Caribana’s layered street and skyline by keeping existing towers fixed, placing ship and bridge silhouettes at their real course distances and adding nearby people and wet quay fittings. Share hull, porthole and promenade materials. Batch repetitive handrails, moorings and brick details by section. The ferry and walkers use the ride clock and release their geometry and textures on exit. Measure submitted frames at 60 m and 8,150 m on Low and inspect matched views. Trace to L1 Race, the ride-a-map journey, L2-064–066 and L2-159–160, the performance design and ADRs 0021, 0023, 0030, 0034 and 0035.

## Dolomites (#2114)

Map Select loads the seeded Dolomites map after two stars on Cliffside Coast. Race Setup and Race resolve its native course JSON and GLB through the lazy world library. Preserve its physical centre line, all 17 stages, 30:00 duration and existing grade. The current generator provides a guardrail, generic mountain scenery, conifers and repeated chalets. Distinguish all three massifs, the three village centres, larch fringes and a crossing lift on this same SS242 alignment. The feedback search found the current issue as the only Dolomites-titled issue.

| Rider viewpoint | Low-tier target | Sources |
| --- | --- | --- |
| 0.08 km | Ortisei’s onion dome rises above timber balconies and flower boxes. | Real 01 and 04, game 04 |
| 2.10 km | Mown meadows and hay huts open a view to the pale Sassolungo wall. | Real 02, 03, 05 and 14, games 01 and 05 |
| 8.40 km | Santa Cristina’s white church steps up the hillside above the SS242. | Real 06, 09 and 10, games 02–03 |
| 15.10 km | A gondola crosses the valley above the spruce canopy and lime-green larch. | Real 03, 09, 10 and 14, game 02 |
| 23.50 km | The Geisler needles rise beyond a fenced meadow and a low stone wall. | Real 08, 11, 12 and 15, games 01 and 05 |
| 32.60 km | Behind Selva’s Tyrolean hotels, the plateau of the Sella closes the valley head. | Real 03, 07, 08 and 13, games 03–04 |

Follow Caribana’s separation of foreground batches from fixed skyline geometry. Work in the course coordinate system, build the three village groups at their own chainages, and share repeating balcony, stone-wall and tree materials. Use the existing course cableway and ride clock for a moving cabin. Dispose of scene geometry and textures on leaving the race. Measure real submissions near Ortisei and Santa Cristina with the HUD visible, and compare the matched views against the existing ride. See the performance budget design and ADRs 0021, 0023, 0030, 0034 and 0035.

## Dubai Marina (#2115)

The class uses DubaiStreet with shared Yachts, Crowd and Ribbons, a 75-storey twisting Cayan Tower, UAE flags, window textures and lit water. Feedback #923 ranks its ride alongside Ibiza, Sa Calobra and Amsterdam. Keep the pale promenade, boat silhouettes, terraced podiums, dusk palette and glass reflections. The current race catalogue has no Dubai Marina entry. Add the historical 14-stage GCN Training class Sprint Into the Effort through Map Select and use the source timings to drive the native course. Its 20:00 ride covers 8.600 km and the low approach to the pedestrian bridge adds 3 m.

| Rider viewpoint | Composition on Low | Reference IDs |
| --- | --- | --- |
| 0.08 km | Amber promenade lamps and brushed rails lead into the blue hour. | Real 01–03 and games 01, 05 |
| 0.78 km | Cayan Tower twists through a quarter turn above the far bank. | Real 03, 06, 14–15 and games 01–02 |
| 1.65 km | Stern-to yachts and a timber dhow are moored against the lit pontoons. | Real 04–05, 07 and 13, games 02 and 04 |
| 3.43 km | Palm planters, café terraces and spectators line the sprint barriers. | Real 08–09, 11–12 and games 02 and 05 |
| 5.64 km | A low bridge crosses the canal and its warm underside reflects in the water. | Real 01, 08–10 and game 04 |
| 7.76 km | Ain Dubai’s illuminated rim rises beyond the marina mouth. | Real 03 and 14 for skyline scale, game 03 for the observation wheel |

Place Cayan Tower, pedestrian bridges and Ain Dubai in fixed world coordinates. Group the static pontoons, cafés, balcony bands and palms into visibility sections. Reuse the class’s yacht and figure proportions and wardrobing. Use ride time for the bobbing dhow and rippling reflections. Share their surfaces across both rendering backends, and dispose of geometries, materials and texture maps on exit. Caribana’s tapered landmark and near-to-far parallax inform the tower, the boats alongside and the distant skyline. Consult ADRs 0021, 0023, 0030, 0034, 0035 and the performance budget design. Capture the six matched race views and measure two one-minute Low rides.

## Edinburgh Fringe (#2116)

EdinburghStreet already animates a juggling cascade, with stone façades, crowds and Fringe posters. Rider feedback #911 asks to keep its look and feel. The race catalogue has no Edinburgh entry. Use the original 17 stages of GCN Training’s 20 Minute HIIT to make its 20:00, 8.655 km race accessible from Map Select. The climbing route condenses the lower Canongate, High Street, Lawnmarket and Castlehill into a sequence sized to the workout. Bends and changing rooflines reveal the church spires before the Esplanade opens out.

| Viewpoint | Rider-height target | Sources |
| --- | --- | --- |
| 0.08 km | Granite setts rise between tall stone lands and narrow closes. | Real 01–02, 06 and 15, games 01 and 05 |
| 1.34 km | The Tron Kirk spire marks the entrance to the High Street. | Real 02, 06–07 and 13, games 02 and 03 |
| 2.57 km | A juggler and a fire performer draw separate audience circles on the setts. | Real 01–05 and 12, games 03 and 05 |
| 4.68 km | Four open Gothic ribs support the crown above St Giles’ Cathedral. | Real 08–11, games 02 and 04 |
| 5.41 km | The Heart of Midlothian is picked out in the paving by the west door. | Real 08–11 and game 01 for the scale of the paving |
| 8.39 km | The street opens onto the Esplanade below the Castle on its rock. | Real 13–15, games 04 and 05 |

Give the Castle, St Giles and Tron Kirk separate fixed silhouettes, following Caribana’s landmark parallax. Batch the setts, stone surrounds and street furniture, retain the juggling cascade, and add fire and damp-stone highlights on ride time. Keep temporary stages, flyering queues and the Heritage Heart clear of the racing line. Group spectators and posters by visible section and release every owned texture, material and geometry on exit. Consult the performance budget design and ADRs 0021, 0023, 0030, 0034 and 0035. Measure the opened race with the six matched views and two minute-long tablet runs.

## Engadin Lakes (#2117)

The original class supplies a clear alpine day, gentle bends and the 28 stages of GCN’s 60 Minute Turbo Trainer Class. Its scene is selected in `worlds.ts` and lit in `world-renderer.ts`. The race catalogue has no Engadin entry. Add its 24.625 km lakes road to Map Select with the unchanged 60:00 plan. The route follows the sequence of the real lakes, compressing the distances to the class. A search for Engadin-specific rider feedback found the current issue.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Maloja, 0.08 km | White edge markings, yellow cycle lane, granite kilometre stone and road converging below the peaks. Real 01–03, games 01 and 05. |
| Lej da Segl, 3.14 km | Near shore, reflective water and larch-covered far bank occupy distinct depths. Real 05, 07, 14 and 15, games 02 and 04. |
| Sils, 7.44 km | White houses with painted surrounds, pasture cattle and split-rail fences line the village approach. Real 02, 04 and 14, games 02 and 03. |
| Silvaplana, 12.82 km | Kites and their riders track the lake below Corvatsch. Pines and larches frame the far shore. Real 07 and 09–10 establish the shore, games 01 and 04 the rider scale. |
| Railway, 19.36 km | A red Rhaetian passenger train runs alongside the rider, with overhead wire and station platforms. Real 11–12, game 03. |
| St. Moritz, 23.91 km | The hotels step up the hill toward the characteristic leaning tower and church. Real 06, 08 and 10–13, games 04–05. |

Keep the Corvatsch and Bernina skyline fixed in world space, as Caribana does with the Toronto landmarks. Fence rails, near trees, rocks and villages should pass independently of the mountains. Bake the road and shore profile in Blender under ADRs 0034 and 0035. Load any animated content with the Engadin course in the existing world library under ADR 0030. Advance the kites and the red train on ride time. Use one set of shared materials and window the roadside batches. Dispose of textures, materials, geometry and scene objects on exit. Preserve Chromium WebGL 2 and WebGPU under ADR 0021, and keep the physical course aligned through its bends under ADR 0023. Follow the performance design for a nine-second warm-up and two moving sixty-second samples, with paired rider views at the six chainages.

## Mount Etna (#2118)

The original EtnaStreet sets loose blocks and broom on a cinder verge. It animates summit steam, white off-road buses and crater walkers. Issue #948 reports suspended birches and flow blocks where the ground flattens by the road. Sample the same terrain height for the native road cuts, birch roots and lava footings. Retain the half-buried house, snow pockets, yellow flowers, buses and the windward drift of the existing plume. Map Select currently has no Etna race. Supply a 12.885 km physical climb for the 14 stages of GCN Training’s Go Until You Blow, with 798 m of ascent.

| Rider viewpoint | Composition and source |
| --- | --- |
| Opening, 0.08 km | A dark cone behind the clinker and pale road markings. Real 02–03 and 14, games 01–02. |
| SP92, 2.28 km | Stone-edged hairpins cut through older black flows with birch and broom. Real 01–05, games 03–04. |
| Coastal outlook, 4.76 km | A break in the downhill bank reveals the blue-grey Ionian horizon. Real 01 and 05 establish the slope and haze, game 05 the moving sightline. |
| Silvestri, 8.38 km | Oxidised cinder rims and walkers stand out against black lava and harsh sunlight. Real 07–11 and 15, games 01 and 03. |
| Refuge, 10.74 km | Chalet gables, stone base, shop fronts, parking and white tour buses form the terrace below the cableway. Real 04, 06, 09 and 12, games 03–04. |
| Funivia, 12.18 km | Red gondolas hang from a sloping cable above the ash field under summit cloud. Real 13–14, games 02 and 05. |

Place the summit in world space as Caribana does with the CN Tower. Build the crater rims and switchbacks against the resistance-derived route, and group near-field cuttings in short visible sections. Load plume, walkers and gondolas with the Etna course, reusing the class movement where possible. Freeze each on pause and suppress motion for reduced motion. Dispose of textures, geometry, materials and ride-clock animation state on exit. Follow ADRs 0021, 0023, 0030, 0034 and 0035 for the graphics backends, road geometry, lazy world library and course assets. The performance design measures actual scene submissions after nine seconds of warm-up, on the opening climb and at the refuge.

## Fenland Time Trial (#2119)

The class world defines long straights, two-degree bends and a maximum work grade of 0.5%. The race catalogue lacks a Fenland course. Follow the existing eight-stage, 35:00 Tough Time Trial Efforts ride over 15 km, preserving its target resistance and cadence. Keep the horizon level except for the brief approaches to field crossings and the raised Great Ouse bank. The villages and waterways form a condensed route.

| Rider viewpoint | Composition and source |
| --- | --- |
| Drove, 0.08 km | A single strip of broken asphalt runs straight between ditches and peat fields. Real 01, 03–05 and game 04. |
| Drain, 2.46 km | Reeds and a farm-access bridge trace the Forty Foot Drain beside the lane. Real 02, 06, 09 and 15 and game 05. |
| Harvest, 5.45 km | Wind blows dust across the lane between wheat stubble and ridged dark soil. Real 05, 09, 13–14 and games 01 and 05. |
| Pump, 7.89 km | An old drainage windpump stands by the water, with taller white turbines on the far horizon. Real 10 and 14 and game 03 for landmark scale. |
| Ouse, 10.72 km | The lane climbs the grass bank to cross the Great Ouse above the fields. Real 08, 09 and 15 and games 02 and 04. |
| Ely, 13.94 km | Ely Cathedral’s west tower and crossing lantern rise beyond poplars and an isolated farm. Real 07 and 10–12 and games 02–03. |

Use short merged sections for the lane, sloped banks, crop rows and water. Fixed silhouettes behind the near reeds and poplars give the parallax of Caribana’s parade and CN Tower. Ely has two distinct high points, the west tower and the octagonal crossing lantern. Keep the turbine rotor centres on their towers. Move the blades, roadside dust and cloud shadows on ride time and hold them on pause. The Fenland course loads these resources with its native scene and disposes of their geometry, materials and textures on exit. Follow ADRs 0021, 0023, 0030, 0034 and 0035. Measure submitted frames on the opening straight and at the river crossing after nine seconds of warm-up.

## Fish Hill, Cotswolds (#2120)

The class defines a strong effort grade and tight bends. Its renderer uses amber light, dry ground and a general road palette. There is no Fish Hill race in Map Select. Preserve Leg Burner’s 16 intervals on an 11.6 km course from Broadway to the ridge. Put the steepest rise on the wooded scarp, with short descents on the upper pastures. A damp surface and pale overcast light preserve detail in the limestone.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Broadway, 0.08 km | Honey-coloured shop fronts and broad grass verges frame Broadway High Street. Real 03–04, 07 and 09, games 01 and 05. |
| Cottages, 1.06 km | A red phone box, thatch, wisteria and low garden walls mark the village edge. Real 05–06, 08–09 and 14, games 01 and 05. |
| Cutting, 3.72 km | A red-bordered grade sign and white lines lead into the steep A44 cutting beneath the beeches. Real 01–02 and 15, games 02 and 04. |
| Vale, 6.48 km | The wooded scarp opens to the patchwork fields of the Vale of Evesham. Real 12–14, games 02–03. |
| Pasture, 8.63 km | Sheep graze beyond a rough limestone wall beside the ridge road. Real 10–13, games 01 and 03. |
| Tower, 11.37 km | Three round turrets and a crenellated parapet identify Broadway Tower on the ridge. Real 10–11, game 04 for the approaching sightline. |

Place Broadway Tower at a fixed position, as Caribana does with the CN Tower. Build the turrets and battlements in three dimensions for the final approach. Separate the near wall, wooded scarp and distant patchwork vale. Batch cottages, coping stones, signs, gateposts and garden planting by section. Keep sheep movement and leaf motion deterministic on ride time and hold them on pause or reduced motion. Load the course, materials and moving figures on entry, then release each on exit. Follow ADRs 0021, 0023, 0030, 0034 and 0035. The performance design measures submitted frames on the High Street and in the beech cutting after nine seconds of warm-up.

## Mount Fuji Road (#2121)

The class defines a 3–7% ramp, repeated bends and a cool forest palette. Map Select has no Subaru Line race. Preserve the 11 intervals of 30 Minute HIIT Ramp Session on a 13.25 km course, beginning at 1,450 m and finishing at 2,305 m. Condense the lower approach and place signs at the physical elevations the rider passes. The fifteen photographs, five game views and source credits were recovered from Git history before choosing these compositions.

| Rider viewpoint | Composition and source |
| --- | --- |
| Toll, 0.08 km | The toll canopy spans the broad Subaru Line, with Japanese lane signs and dense forest behind it. Real 01–02 and 14, games 01 and 04. |
| Forest, 2.21 km | Conifers and pale birch trunks crowd the smooth first switchbacks. Real 01 and 04–05, games 04–05. |
| Okuniwa, 5.36 km | Gold larch and dwarf trees reveal the pale summit above rust-red scoria. Real 03–05, 07 and 09, games 01 and 03. |
| Lakes, 7.47 km | An open slope looks down over Lake Kawaguchi and the Yamanashi plain. Real 07–08 and 15, games 02–03. |
| Clouds, 9.84 km | Layered cloud lies below the road, with the summit clear beyond the scoria verge. Real 08–11, games 02–03. |
| Station, 12.91 km | Buses, timber-clad shops, waiting visitors and the red shrine gate mark the fifth station. Real 06, 09 and 12–14, games 01 and 03. |

As with Caribana’s CN Tower, fix Fuji in world coordinates so nearby branches move across its outline on bends. The near forest, far lake basin and cone occupy separate depths. Batch road furniture, birches and larch, swap to lower growth at the scoria shoulder, and keep small details near the bike. Draw a few translucent cloud layers below the overlook and keep the fifth-station shuttle on a short forecourt loop. Advance movement on ride time, freeze it on pause, and suppress motion for reduced motion. Load and dispose of course-specific geometry and textures with the world. Follow ADRs 0021, 0023, 0030, 0034 and 0035. Use the performance design’s nine-second warm-up and sixty-second submitted-frame samples in the forest and on the station approach.

## Furka Pass (#2122)

The class supplies repeated bends, effort grades and crisp alpine light. The catalogue has no Furka Pass race. Lay out a 20.025 km climb that starts at 1,757 m in Gletsch and finishes at 2,429 m. Retain the 15 stages and 45:00 duration of GCN’s 45 Minute VO2 Max Intervals. Place the hotel on the inside of the hairpin and establish the glacier basin on its own downhill terrain.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Gletsch, 0.08 km | Gletsch’s white chapel, stone hotel and road junction frame the valley-floor start. Real 09–11 and 13, games 01 and 04. |
| Pasture, 2.46 km | Cows graze on flowered pasture beside the lower stone kerbs. Real 08–09 and 13, game 04. |
| Hairpins, 6.72 km | Low walls trace the stack of switchbacks below the granite and snowfields. Real 03, 05, 08–10 and 12, games 02–03. |
| Belvedere, 12.28 km | The rounded red gallery of the shuttered Hotel Belvédère stands inside the hairpin. Real 01–02 and 06, games 04–05. |
| Glacier, 14.46 km | The fractured Rhône ice tongue, white protective blankets and meltwater lake lie below the road. Real 04, 06, 11 and 15, games 01–03. |
| Summit, 19.72 km | A yellow pass sign and delineators mark 2,429 m below the bare peaks. Real 05, 07, 12 and 14, games 02 and 05. |

Stage the nearest delineators and coping stones in front of the hotel and glacier basin, with Galenstock and Dammastock in fixed world positions like Caribana’s tower and skyline. Keep the hairpin arms clear of each other’s terrain. Draw the blanket seams, ice tongue and meltwater as separate surfaces so the rider can read their relationships on Low. The yellow postbus follows the actual turning road. Cows graze on the lower slopes and cloud rises from below. Tie motion to ride time, hold it on pause and honour reduced motion. Load and release each course-specific asset with its scene. Follow ADRs 0021, 0023, 0030, 0034 and 0035. Sample submitted frames after nine seconds of warm-up at Gletsch and the Belvédère bend.

## Col du Galibier (#2123)

The existing class repeats 360 metres of snow banks, Tour road paint, fans and flags. It already models the monument and La Meije. Preserve those subjects, the early-summer light and the moving crowd. A single ride from Map Select needs a continuous route, a tunnel branch and a legible summit sign. The 26.05 km route joins sections of both sides of the pass to fit the 60-minute workout. The high road stays open past the tunnel mouth.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Lachat, 0.08 km | Timber chalets and the river mark the Plan Lachat valley approach. Real 09–12 and 14, games 02 and 04. |
| Switchbacks, 6.72 km | White edge dashes, shale, low walls and chevrons lead around the exposed hairpins. Real 02–04, 08 and 11, games 02–03. |
| Tour, 11.52 km | Painted riders’ names lead past flags and fans on a narrow shoulder. Real 02–03 and 08, games 01 and 04. |
| Tunnel, 18.42 km | The stone portal takes the lower branch while the rider climbs between cut snow banks. Real 01 and 06–07, games 03 and 05. |
| Desgrange, 22.36 km | The carved granite memorial stands above the southern approach with La Meije across the valley. Real 05, 10 and 13, games 02 and 04. |
| Summit, 25.82 km | A rough stone plinth carries the altitude and both departmental signs. Real 03, 07, 13 and 15, games 01 and 05. |

The map catalogue supplies the original 20 class stages. CourseRenderer loads the Blender road, elevation samples and tier-appropriate scenery only when the rider enters the course. Use short terrain sections around the summit fork and retaining walls. Give the nearby stone arch and engraved memorial physical depth, with the fixed glaciated skyline beyond the valley. Share repeatable road and slate textures with the class where practical. Use instancing for cycling fans, ride-clock flag movement and clouds. Release their materials, textures and geometry on exit. ADRs 0021, 0023, 0030, 0034 and 0035 govern rendering and quality. Follow the performance design for two headed simulated-tablet rides, measuring actual submissions after nine seconds of warm-up.

## Passo Gardena (#2124)

The class’s 480 m loop already supplies meadows, cows, larches, hikers, gliders, flags and shelters. A full car-free race needs a peloton, distinct opposing mountain faces and a fixed sequence of bends and rifugi. Join the Selva approach to the 2,121 m saddle in 8.975 km, with 506 m of climbing. Keep GCN’s ten progressive efforts and 20:00 duration.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Selva, 0.08 km | Bike Day riders leave the larch-lined approach with Sassolungo behind the return bend. Real 03, 06 and 14, games 01–02. |
| Barns, 1.44 km | Dark timber hay barns overlook flowered pasture and grazing cattle. Real 01, 07, 12 and 14, games 01 and 03. |
| Sella, 3.18 km | A pale sheer Sella wall rises above the larches on the right. Real 02, 04, 09–11 and 15, games 02–03. |
| Hairpins, 5.43 km | Cyclists ahead climb the next hairpin arm across the meadow. Real 03–04, 06 and 08, games 01–02. |
| Cir, 7.13 km | The Cir needles stand apart on the left as the road turns towards the saddle. Real 05–06 and 12–14, games 03–05. |
| Saddle, 8.76 km | The final bend opens onto the pass-top rifugi, parking and trilingual pass sign. Real 01, 08–09 and 13, games 01, 04 and 05. |

The catalogue supplies the class plan and sampled elevation. CourseRenderer loads the Blender road and a lazy Gardena scene. Place Sella, Cir and Sassolungo separately in world coordinates so a return bend changes which face the rider sees. Model the foreground barns and rifugi, batch larches, and use the Ride One cyclist kit for the nearest Bike Day riders. Bound the number of pedalling riders; place riders on the sampled road, cattle and trees on the same meadow surface drawn beneath them. This addresses rider report #948 about floating props. Use ride time for the peloton, grazing and cloud drift. Release all scene-owned geometry, materials and textures on exit. ADRs 0021, 0023, 0030, 0034 and 0035 apply. Measure submitted frames on the lower road and crowded middle hairpins after nine seconds of warm-up.

## Ghent Six-Day (#2125)

The class recreates a straight every 166 m. It already has a textured pine floor, blue apron, spectators, cabins, trusses and a distance-driven board. The race needs a continuous oval with the other straight always across the infield. The ten-minute, 4.575 km race covers 27 complete laps and part of the next. The measurement line is level. Banking changes the cross-slope and rider lean without adding course climbing.

| Rider viewpoint | Composition and reference |
| --- | --- |
| Boards, 0.014 km | Pine boards, the black measurement line and red sprinter’s line lead into the first bend. Real 03–05, 08 and 10, games 01 and 04. |
| Bank, 0.045 km | The rider and chase camera lean into the steep bend above the blue côte d’azur. Real 04–06, 09 and 11, games 02 and 05. |
| Bars, 0.087 km | Bar tables and spectators fill the infield under trusses, with the opposite stand in sight. Real 01–03, 12–13, games 01 and 03. |
| Board, 0.148 km | The illuminated lap board and brass bell face the home straight above the infield rail. Real 01–03 and 07, games 02 and 04. |
| Madison, 0.537 km | A resting rider drops from the banking to meet a teammate for a Madison change. Real 06–11 and 14–15, games 04–05. |
| Night, 4.422 km | Warm floodlights pick out the packed stands and hoardings on a late six-day lap. Real 01–05 and 12–13, games 01–03. |

The catalogue carries the eleven original workout stages. Bake one compact Kuipke bowl, then sample its periodic centre line and bank angle over the full session. Register the course with the lazy renderer. Lift riders in the outside lanes onto the drawn boards and roll the chase camera through the banking. Keep the advertising rail, spectators, stairs, bar counters and roof trusses fixed in the building. Position each Madison pair on the same banked oval as the rider and coordinate their arms, lanes and pace during a change. Update the board only when the lap changes. Use the shared World music player for an original brass-band race arrangement. The existing Ghent class soundtrack has its own credit. Respect the music preference, race status and teardown. Use the nearest tier for the active riders and batches for repeated fans, furniture and lamps. Follow ADRs 0021, 0023, 0030, 0034 and 0035. Measure actual frame submissions after nine seconds of warm-up on both sampled laps.

## Giza Plateau (#2126)

The class scene repeats a 400 m roadside with a moving camel caravan, mastabas and a recurring Sphinx. Its compact geometry drew praise for running well on low-memory devices in #904. The race catalogue needs the original GCN class and a fixed Plateau Road. Keep its ten intervals and fit the road to 9.4 km. The route panel reads the same centre line as the chase camera. Use the normal race loader and the Blender export under ADRs 0021, 0023, 0030, 0034 and 0035.

| Course section | Reference and construction |
| --- | --- |
| Khafre approach | Real 01–04 and games 01–02 establish the bend, casing cap and warm side light. A low kerb separates sand drifts from darker tyre paths. |
| Khufu | Real 06–08 and game 03 establish near masonry scale. Model the outline in stepped courses and bake chipped blocks and mortar joints into the surface. Keep the long shadow fixed on the sand. |
| Queens’ pyramids | Real 03, 12 and 14 and game 05 inform the smaller ruined profiles, mastabas and dry western horizon. |
| Sphinx and valley temple | Real 10–11, 13 and 15 inform the headdress, weathered face, long paws, stone enclosure and causeway. Game 04 informs visibility from the riding line. |
| Panorama turnout | Real 02, 09 and 12 and games 01 and 03 place saddled dromedaries, a harnessed horse and cart, handlers and visitors behind low barriers. |
| Return toward Cairo | Real 04–06 and 15 inform the low sun, successive bands of development and distant minarets. Game 02 informs atmospheric depth. |

Bake the pyramids and Sphinx in world coordinates so the rider sees different faces through the turns. Separate sand, roadside stone and distant city by scale and contrast. Batch repeated tomb blocks and shaded awnings. Use a small number of articulated animals at the turnout with shared materials and deterministic motion on ride time. Release their graphics resources on exit. Measure the opening and turnout through the simulated ride after nine seconds of warm-up. Compare six HUD captures from the same entry and cadence.

## Glasgow World Championships (#2127)

The class already draws wet tarmac, grey air and short sightlines. Its generic bending street has no identifiable City Chambers or fixed sequence of championship corners. The race takes its sixteen stages from GCN Training’s *VO2 Max Race Simulation*. Fit George Square, the Merchant City grid and their approaches to the 13.1 km race. Restore the fifteen photographs, five game views and their credits from repository history. Real 12 depicts Calgary and informs wet-surface response only.

| View | Construction and references |
| --- | --- |
| Square, 0.08 km | The City Chambers clock tower, three-part frontage, raised statue columns and grass islands orient the opening. Real 05–07 and 14, games 01 and 05. |
| Tenements, 1.38 km | Stack bay windows, cornices, chimney pots and ground-floor shops in blond and red sandstone. Real 02 and 08–11, game 03. |
| Merchant City, 3.54 km | Turn between fixed façades over white stop lines and inset iron covers. Keep corner radii rideable and preserve clear sightlines beyond the bike. Real 08–13, games 03–04. |
| Wellington, 6.18 km | Model the mounted figure on its stone plinth outside the gallery, with the orange cone distinct against the portico. Real 07–08 inform street and statue scale. Games 01 and 04 inform recognition from the saddle. |
| Crowds, 9.24 km | Umbrella canopies, rain jackets and rainbow bands line the barriers. Vary spectator pose, fabric and spacing as in Caribana. Real 01–04 and 12, game 02. |
| Finish, 12.98 km | Return to the square and face the City Chambers clock and towers over the finish gantry. Real 05–07 and 14–15, games 01 and 05. |

Register the physical course in the race loader and use the same sampled centre line for route progress, grade and the chase camera. Batch the streets in view, reuse façade materials, and bake recessed-window shading. Use cheap wet reflections, a bounded rain and spray buffer, and shared umbrella geometry on both graphics backends. The ride clock holds animation on pause. Release geometry, materials, textures and listeners on leaving the race. Apply ADRs 0021, 0023, 0030, 0034 and 0035 and measure submitted frames at the opening and busy crowd section after nine seconds of warm-up.

## Glastonbury Fields (#2128)

The original festival world supplies the panel trackway, wet shoulders, tents, flags, stalls, Pyramid Stage, Ribbon Tower and Tor. Give the authored 10.515 km loop a common physical centreline for the rider, elevation, signage and scenery. Bind the original 35-stage Sprint to the Music programme to this map in the catalogue. Use the existing race HUD and progression.

Start on the Pyramid field at 58 m. Follow metal and plastic panels uphill to the 88 m campsite, descend between hedges to West Holts and the Other Stage, pass the Arcadia spider, then climb to 99 m at the Park’s Ribbon Tower. Return through the evening stalls to the original line and the lit Pyramid Stage. Preserve worn joints and drainage between panels. Build the stage silhouette from its triangular roof, open truss and two screens. Keep the Tor and tower fixed behind the fields. Cluster differently coloured dome tents on slopes and alternate food trailers, fence panels, bins and signposts beside the route.

Render nearby flags and spectators from deterministic instance buffers. Use ride time for cloth and crowd motion, including pause and resume. Bake stage trusses, stall fittings and lamp colour into static sections. Use pooled bulbs for evening strings and keep the screens visible on Low. Dispose buffers and materials on exit. Review the six matched normal-entry views and measure rollout and finish crowd at 1024 × 768, DPR 1, 4× CPU throttle.

[pyramid](../../../mocks/pages/race/glastonbury-pyramid.html) · [camp](../../../mocks/pages/race/glastonbury-camp.html) · [west-holts](../../../mocks/pages/race/glastonbury-west-holts.html) · [arcadia](../../../mocks/pages/race/glastonbury-arcadia.html) · [ribbon](../../../mocks/pages/race/glastonbury-ribbon.html) · [lights](../../../mocks/pages/race/glastonbury-lights.html)

## Golden Gate Park (#2129)

JFK Drive starts east at the Conservatory of Flowers. The normal Map Select entry uses the original 17-stage class and existing progress rules. Share the course centreline between the rider, race preview, park grade and camera. Take the promenade west and descend from 72 m to 6 m over 6.375 km. Keep skaters, runners and walkers on their side of the car-free promenade.

The glasshouse has a white ribbed dome and glazed wings behind the palms. Stow Lake has rough stone arches and green water. Spreckels Lake has cypress on the far shore, model sails and ducks. The fenced bison meadow is sandy, with the dark shoulder hump and lowered grazing heads recognisable at road speed. Beyond it the four pale sails of the Dutch Windmill stand above Queen Wilhelmina’s flower beds. The Great Highway marks the final transition to coastal grasses and Pacific breakers. Use real 03 and 06 (Murphy Windmill) for construction details. The required west-end landmark is the Dutch Windmill.

Draw fog between successive wooded layers. Instance hand-shaped cypress and peeling eucalyptus alongside the existing promenade furniture. Keep the bison and boats anchored to their paddock and lake and drive animation from the ride clock. Keep sightlines through the bends on Low. Dispose shared assets and textures on exit. Verify the six rider views, pause/resume, the mapped class and two headed one-minute Low/WebGL 2 tablet runs.

[conservatory](../../../mocks/pages/race/goldengate-conservatory.html) · [stow](../../../mocks/pages/race/goldengate-stow.html) · [spreckels](../../../mocks/pages/race/goldengate-spreckels.html) · [paddock](../../../mocks/pages/race/goldengate-paddock.html) · [mill](../../../mocks/pages/race/goldengate-mill.html) · [beach](../../../mocks/pages/race/goldengate-beach.html)

## Grand Canyon South Rim (#2130)

Map Select binds Desert View Drive to the 32-stage VO2 Max Booster programme. The 13.425 km centreline gives the rider, course panel and chase camera the same physical grade. Ride east through ponderosas and pinyon-juniper. Open the treeline for Grandview, Moran, Lipan and Navajo Points. Place the Watchtower and its round observation building at Desert View, visible before reaching the finish.

Model the rim as a pale overhanging limestone cap, followed by alternating stair-step benches and steep bands with original weathered strata. Cut tributary ravines through these layers. Keep the Colorado River far below in the eastern overlooks. Give individual temples and buttes distinct profiles against successive hazed ridges. Bake light from the west and darker recesses on the eastern faces. Build the mortared terraces, tubular rails, visitor groups and parked cars at the turnouts. Share geometry across the pines and keep the forest on the inland side of each open view.

Move a shuttle and passing cloud shadows from the ride clock. Batch repeated props by course section, retain the distant canyon skyline on Low and release the buffers and materials on exit. Verify six matched rider views, pause and resume, original stage fidelity, and two one-minute headed tablet samples.

[forest](../../../mocks/pages/race/grandcanyon-forest.html) · [grandview](../../../mocks/pages/race/grandcanyon-grandview.html) · [moran](../../../mocks/pages/race/grandcanyon-moran.html) · [lipan](../../../mocks/pages/race/grandcanyon-lipan.html) · [navajo](../../../mocks/pages/race/grandcanyon-navajo.html) · [tower](../../../mocks/pages/race/grandcanyon-tower.html)

## Col du Granit (#2131)

The existing catalogue unlocks Col du Granit after three stars on Dolomites. Keep its existing course key, 16.1 km physical distance, 1,240 m climbing and 17-stage 30:00 race plan. The course file already drives the rider, clock and grade. Preserve its stage boundaries and elevation while shaping the horizontal road into stacked turns.

Build a shadowed granite face with sloping joints and a broken crest. Baked first light picks out the distant ridges. Place short battered stone retaining walls below the upper branches of the road and parapets over the drop. Bornes display sampled altitude and the next kilometre’s grade. Worn rider names, patched tarmac, red-white posts and drainage paths give scale. Replace the lower larches progressively with scree, boulders and isolated late snow. Run shallow meltwater from the gullies and let thin mist drift on the ride clock. The saddle opens to a cairn, refuge and col sign.

Keep distant peaks visible on Low. Batch walls, posts, branches and road lettering by section. Release the course materials and animated water on exit. Verify entry with the earned unlock, six comparable rider views, pause/resume and the two headed tablet samples.

[forest](../../../mocks/pages/race/granite-forest.html) · [hairpins](../../../mocks/pages/race/granite-hairpins.html) · [face](../../../mocks/pages/race/granite-face.html) · [gully](../../../mocks/pages/race/granite-gully.html) · [parapet](../../../mocks/pages/race/granite-parapet.html) · [saddle](../../../mocks/pages/race/granite-saddle.html)

### Great Ocean Road (#2132)

L1 Race, L2-064–066 and L2-159–160 apply to the Map Select → Race Setup → Ride journey. The world brief and reference photographs already exist. The baseline lacks a catalogue entry and an authored ride through the ten landmarks. Restore the 14 stages of *Hold Your Intensity*, including its video offset, before attaching the baked route. The scenic route compresses distances between Eastern View and the Port Campbell coast to 8.45 km. Existing race progress, controls, resistance and HUD remain authoritative.

- At 0.08 km the timber lintel of the Memorial Arch spans both lanes. The cut bank, guardrail and coastal road at 1.67 km follow real 01–05, with close road furniture scaled against game 01. Yellow centrelines follow the issue brief. Apollo Bay signs and settlement proportions use real 11–12.
- At 3.12 km turn inland under Otway eucalypts and broad tree ferns. Use real 03, 13–14 for tree height and wind exposure and game 04 for sightlines through vegetation. On leaving the forest the banksia, tussocks and stunted heath open the sea horizon.
- At 5.05 km look across separated, individually shaped limestone stacks. At 6.55 km a sheltered crescent of sand lies between the gorge walls. At 8.24 km the surviving span of London Bridge stands offshore. Real 06–10 and 15 establish rock proportions, erosion, negative space and the relation of cliff edge to surf. Games 02–03 and 05 establish readable landmarks beside a moving cyclist. The #2132 thread contains no earlier rider comments.
- The catalogue provides the course key to the lazy world renderer. Share materials and merge static clifftop geometry by road section. Give fixed stacks a longer visibility range than roadside scrub. Reuse water and spray geometry, advance crests and cloud light from the ride clock and release owned textures, materials and meshes when the ride ends.
- Capture six matched 1024 × 768 views with the HUD. Measure two headed Chromium low/WebGL2 rides with 4× CPU, DPR 1, 9 s warm-up and 60 s of moving frames on the opening bends and the approach to the stacks. Record distance, frame submission, average FPS, p95, longest frame and peak draw calls beside the Caribana comparison. ADRs 0021, 0023, 0030 and 0034–0035 govern fallback rendering and measurement.

### Haleakalā (#2133)

Map Select and Race Setup already open the baked Haleakalā course. Preserve its eleven stages, 15.75 km centre line, 923 m climb, earned progress, three-second class video offset and existing course key. The road, native beach park, ranch homesteads, jacaranda avenues, silversword colonies, summit shelter, crater cones and Science City buildings already ship. Refine surfaces, motion and distant detail within the lazy renderer. All work traces to L1 Race, L2-064–066 and L2-159–160.

- Pāʻia and Kula use real 07–09 for coastline, canopy, animals and pasture. The camera must show a transition from sea level to planted slope. The ranch fences and vegetation use the actual terrain height; GitHub #948 describes floating vegetation and roadside objects in the older repeating world.
- The cloud belt uses real 03–04, 06 and 15. Distinguish moving low cloud from the fixed island silhouettes. Upper switchbacks follow real 10–12 and game 03, with yellow paint and reflector posts. Preserve the original continuous road.
- Real 01–02 show the difference between the broad basal silversword rosette and its flowering stalk. Real 05–06 establish the white observatory drum, dome openings and solar tower. Real 10 and 12–15 define the broad crater walls, distinct cinder cones and sparse vegetation. Games 01–05 inform silhouette, hazard-free road position and readable depth at riding speed.
- Keep static geometry merged by section. Drive cloud movement and ranch motion from ride time and freeze both on pause. Bound repeated plants and release route-owned buffers, textures and materials on exit. Use the six rider-height mock positions, HUD visible, for a paired comparison with Caribana. Benchmark Pāʻia and the upper silversword section with Chromium low/WebGL2, DPR 1, 1024 × 768, 4× CPU throttle, nine seconds of warm-up and 60 seconds of actual submitted frames as required by ADRs 0021, 0023, 0030 and 0034–0035.

### Han River Parks, Seoul · L2-2134

Model the broad Han as a continuous water surface. Keep the 63 Building’s gold taper, paired red Parc1 frames and the IFC slabs on the far bank. Place N Seoul Tower on a separate Namsan ridge. Real 05 and 12–14 establish their relative silhouettes. Real 04 shows the Hàn River in Vietnam and informs only the light reflected on water. Game 01, 03 and 05 set their riding scale behind the cycleway.

The path dips below the lit concrete bridge deck and passes its fountain face on a bend. Preserve clearance under the deck. Alternate warm pier lights and cool fascia lights, reflected in narrow broken streaks. Model Banpo’s jets as shared curved ribbons with ride-clock colour and flow. Real 02–03 and 08–09 show the arc spacing and the open space between piers. Game 04 guides the approaching sightline.

Use yellow centre lines, worn stencils, path lamps, stepped grass banks, picnickers and green rental frames at the park and promenade. Real 01, 06–07, 10–11 and 15 guide these near-field details. Game 02 informs passing distance. Batch static geometry in road sections. Reuse geometry for evening riders and hold all movement on pause. Dispose textures, materials and moving instances when leaving the race.

Review the Yeouido, park, piers, Banpo, Namsan and promenade mocks in the race mock directory. Capture those positions from the normal saddle camera and measure the park and fountain sections with the low-tier tablet fixture.

### Hardknott Pass · L2-2135

The original World Ride loops its verge every 400 m. Preserve its sign artwork, bracken, scree and fell colour where possible and give the race a continuous 10.3 km centreline. Start on the Eskdale side, climb past Mediobogdum and the upper ramps, then cross the watershed towards the Duddon. Real 01–04, 07 and 11–13 establish the road section, upland contours and valley relationships. Game 02 informs how far the next turn remains visible.

Put the warning signs and cattle grid at the foot. Real 08–09 show the roadside boards in context. Keep grass discontinuous down the centre of the damp, narrow tarmac. Carry dry-stone walls on the bank outside the turn, retaining the existing clear road through sharp hairpins. Real 05–06 and 10 inform these wall and bend profiles. Model the fort as low, rectangular stone enclosures with gate gaps on a fixed spur. A meandering Esk, enclosed fields, scattered farms and the summit ridge give the turns a fixed frame of reference. Real 14 supplies a neighbouring beck and bridge study, real 15 a local rock study.

Give Herdwicks stocky grey bodies, white faces and distinct grazing and walking poses. Apply the ride clock to sheep movement, thin strips of mist and broad breaks in the light. Games 01 and 03 inform silhouette and visibility in mist, game 04 the grass texture scale and game 05 the legibility of grade and road markings. Batch stone courses, grass, sheep and scree. Cull roadside detail by distance. Compare the sign, Eskdale, fort, Herdwick verge, upper hairpin and summit approaches with the six race mocks and measure the two tablet sections.

### Havana Malecón · L2-2136

Map Select supplies the Malecón race and the historic 30 Sec On, 2 Min Off workout. The world library currently loads HavanaStreet through its street registry. Preserve the original class art, including the portales, fishing lines, drivers, finned taxis, El Morro and the shaded balconies documented in the Havana screenshot history. The ride remains usable offline. Release the loaded scenery, shared geometry, maps and animated instances on departure.

For the tablet, adapt Caribana’s batching of street sections and keep fixed landmarks apart from the close traffic and spray. Place Hotel Nacional above Vedado and leave El Morro across the water near the eastern end. Give each its own recognisable outline. Real 04, 07, 09–10 and 15 guide headland scale and positioning. Games 01 and 05 guide their visibility at speed.

Reference photos 01, 03 and 11–14 guide the car profiles, deep arcades, railings and pastel façades. Compress repeated window detail in distant blocks and keep the existing modelled cornices and open colonnades nearby. Real 02, 04–08 and 15 distinguish a rising crest, over-wall spray and water sheeting down to the road. Read the low late light from real 06 and 08. Games 02–04 guide colour, clearance and the approach to the denser façades.

Capture Vedado, Hotel Nacional, the portales, the breakers, the promenade musicians and the harbour mouth from the normal saddle with the race HUD. Measure submitted frames after nine seconds of warm-up with the simulated bike on Low/WebGL 2 at 1024 × 768, DPR 1 and 4× CPU.

Havana’s original 400 m class street remains available on the higher tiers. The Low course follows the complete avenue by distance. Its offline bake renders sixteen original façades orthographically and flattens the existing taxi, rickshaw, street vendor, bus stop, musicians, domino players and fortress models. The fixed hotel has windows on both ends of its towers. The chase camera keeps the original Havana street’s 5.5 m following distance. The two seaward stretches open the view gradually towards the surf and performers.

### Hoover Dam · L2-2137

Map Select currently has no Hoover Dam race entry. The class registry resolves HooverStreet through the world library and draws a short repeating crest. Issue #940 described the earlier generic road. Preserve the subsequent class’s bronze figures, square Deco lamps, intake towers and bridge silhouette. Restore the historical GCN workout with its three-second video cue. Use the catalogue’s elevation profile and the same physical distance in the map, HUD and road. ADRs 0021, 0023, 0030, 0034 and 0035 govern loading, rendering and tier selection.

Place the dam and bypass at fixed positions. The approach road curves towards them from above so that the downstream arch is visible between dark volcanic abutments. The convex side of the dam drops to the Colorado, the concave side holds back Lake Mead. The tower drums, ribs, upper glazing and bridges remain distinct on Low. The plaza’s seated figures, clocks and light standards give a human scale. The long shore road carries the white mineral band continuously around headlands. Keep barriers solid around the drop and vary the rocky verge density on the approaches.

Real 03–06 establish the cut heights and approach signs. Games 01–04 guide their sightlines from rider height. Real 07–10 and 12–14 locate the crest, bypass bridge, downstream river and upstream towers. Use real 11 for the silhouettes only, since the ride takes place in bright daytime. Real 02 and 15 guide the architectural details and plaza. Real 01 is Davis Dam and supplies a comparison for low road furniture only. Real 13 and game 05 guide water-level contrast with the adjoining rock. Retain the credits in the world folder.

Merge static near scenery into track sections; keep the remote bridge, cliffs and towers independent of the foreground visibility window. The tablet shares materials and instances, uses baked occlusion and runs a small heat shimmer on the ride clock. Release each loaded geometry, texture and instance when the rider leaves. Capture the six mock positions from a simulated solo ride and measure both the opening and busiest crest section on Low/WebGL 2 at 1024 × 768, DPR 1, 4× CPU, following the performance budget design.

The authoring file builds a 380 m crest from sections of a 276 m radius arc. Its taper extends down to the powerhouse level. The bypass spans the actual downstream channel and remains visible through the opening in the western shoulder. A generated volcanic breccia texture and a separate generated Boulder Basin panorama are original game art. The mineral strand, road cuts, spandrel supports, tower ribs, clocks and terrace are geometry or original class artwork. The mounted camera uses the desert class’s longer haze range so the pale concrete reads against the dark volcanic abutments.

### Ibiza Sunset Strip · L2-2138

Map Select already lists Ibiza, independent of the class screen. The catalogue resolves `ibiza-sunset-strip` to `ibiza`, which loads the native course, the cyclist kit and CourseRenderer through the world library. Keep the existing ground, track and elevation samples, both roadside signs, palm silhouettes and final approach into the photographed sunset. The earlier captures and the frame-budget history remain under screenshots/courses/ibiza. The rider’s #919 comparison is the baseline.

Retain the shared static batches for distant people, club architecture and boats. Give nearby terrace dancers different joint poses at the same beat with stable phase offsets. Animate anchored hulls, line and bulbs together using bounded meshes and ride time. Keep the DJ beam root at the booth and move its far end. The passing Caló des Moro shore gains rough limestone, shallow surf, a low coping and slate joints in the promenade. Distinct cloth awnings, soft cushions and low terrace furniture break up the backlit white buildings. Release the Ibiza-only geometry, materials and textures on departure under ADRs 0021, 0023, 0030, 0034 and 0035.

Real 01, 04, 09–11 and 15 inform the horizon, Conillera’s low profile and water colour. Real 02–03, 05–07 and 12–14 supply the dimensions, awning shadows, wall heights and crowd placement along the club fronts. Real 08 and 14 guide cove geometry. Games 01–03 guide coastal sightlines; games 04 and 05 guide sign, crowd and beam clearance at speed. The six 1024 × 768 rider captures cover the grid, first letters, cove, DJ, final club strip and Conillera. Compare against the original at identical physical distance. The two moving Low/WebGL 2 rides use 4× CPU, DPR 1 and nine seconds of warm-up.
### Iceland Ring Road · #2139

The world registry describes Route 1 and supplies its original stage grades. The previous renderer gives Iceland a warm horizon and dark earth. Its historical class defines nineteen stages over 30 minutes at 80 rpm. Restore that plan to the race catalogue, keep the video at offset zero, and use an authored course in the lazy world library (ADRs 0021, 0023, 0030, 0034 and 0035). The compact 12 km route follows the landmarks in geographic order.

| Road section | Rider sightline and craft | Reference files |
| --- | --- | --- |
| Western approach and falls | Yellow roadside markers lead to small white farm buildings. Seljalandsfoss has a thin separated jet beneath an overhang. Skógafoss is a broad curtain against a flat basalt lip. Reuse the spray geometry and animate its alpha. | Real 01, 03, 05, 06 and 13. Games 01 and 03. |
| Vík and Eldhraun | Black sand, a narrow white surf line and dark offshore stacks precede irregular moss caps. Break the lava silhouette with low lobes and reserve surface grain for the near road. | Real 07–09 and 14. Games 02 and 05. |
| River and lagoon | An open steel bridge frames the braided channels. Model the glacier tongue between darker valley sides and put its crevasses into baked colour. Nearby stocky horses and sheep graze. Pale blue bergs float in front of the glacier as the low sun casts long shadows. | Real 02, 04, 10–12 and 15. Games 01 and 04. |

As in Caribana, fix the distant landmark in world space and concentrate geometry in the moving foreground. Isolate the water, grazing and iceberg materials to this course. The course owns their disposal with the route. Retain silhouettes on Low and share each motion across batched geometry. Test Map Select → Race Setup → Ride with fixtures, including pause and resume. Photograph the same six chainages before and after. Measure the opening and lagoon per the performance design with two 60-second submitted-frame samples after nine seconds of warm-up.

The baked route ascends 91 m. Each stage contributes its original time and cadence to its road length. A common grade increment per resistance level and a small background rise account for the climbing and the 21 m net elevation gain. The headlands, outlets and water sit at fixed positions. Lake ice floats on the common 45.8 m lagoon surface. The distant ice-cap plate is original generated artwork, with translucent edges fading into the modeled terrain. The terminal tongue, basalt strata, fractured bergs, two waterfall profiles, surf, farm buildings and livestock are original meshes. The basalt-grain and moss channels come from the repeatable bake in `tools/blender/iceland_surface.py`.
### Independence Pass · #2140

Restore the historical 35-minute GCN workout and its ordinary unlock behaviour in the race catalogue. Compile the 15.2 km road and its elevation profile into the native Blender course and load it only for this map (ADRs 0021, 0023, 0030, 0034 and 0035). The west approach climbs from 2,790 m to the 3,687 m divide. Across the eastern sightline Twin Lakes remains below the rider. The course finishes at the sign.

| Section | Low-tier geometry and sightline | References |
| --- | --- | --- |
| Lower Highway 82 and river | Break the crowns into gold and green patches, leaving the dark branch forks and white trunks readable. Frame the river between boulders and open the road edge at the cascade. | Real 02, 09, 13 and 14. Games 03 and 05. |
| Mining meadow and treeline | Cabin wall logs terminate at the corners. Vary collapsed, stripped and roofed structures. Narrow the spruce silhouettes with altitude before the tundra opens. | Real 05, 06, 08, 11 and 14. Games 02 and 04. |
| Exposed summit approach | Smooth descending sightlines across tight folds, galvanised rails, thawing snow and rough scree. Keep the sign’s brown silhouette and pale lower panel legible. Anchor the two blue lakes and snow-streaked Sawatch skyline to the valley. | Real 01, 03–05, 07, 08, 10, 12 and 15. Games 01, 02 and 04. |

Caribana’s fixed skyline and detailed moving foreground guide the distribution of GPU work. The river and near leaves share bounded materials owned by the scene. Keep the summit lettering legible on Low without changing the HUD. Verify six positions through the simulated bike. Compare the opening and busiest summit approach on Low/WebGL2 with nine seconds of warm-up and a moving one-minute sample per section.

The tree atlas and distant Sawatch range use original generated artwork. The native geometry places the trees, boulders, log cabins, guardrail, summit board and two lake surfaces. The summit board has a separately drawn face so its elevation lettering survives tablet scaling. At the overlook the chase camera swings around the cyclist toward the lakes and eases back onto Highway 82.
### Isle of Man Mountain Course · #2141

Trace the existing Isle of Man registry entry into the race catalogue and its lazy native course (ADRs 0021, 0023, 0030, 0034 and 0035). Restore *Full Gas Sprints*, including the three-second video offset. The condensed A18 covers 8.133 km with its stage distances proportional to target cadence and time. The lower lanes climb toward the Bungalow before the descent to Creg-ny-Baa.

| Section | Rider-height treatment | References |
| --- | --- | --- |
| Lower road and Snaefell | Model rough limestone boundaries close to the white-dashed two-lane road. Open the banks to a smooth grassy summit with summit masts. An original heather surface and distant sea occupy separate depth layers. | Real 03, 06, 09–10, 14–15. Games 01, 04 and 05. |
| Bungalow | Thread the rails obliquely through the tarmac. A red and cream electric tram runs along its own track under catenary poles. Keep the two long staircases, black sponsor fascia and open underside of the bridge recognizable at speed. | Real 02, 04–05, 10, 12–13 and 15. Games 02 and 03. |
| Creg-ny-Baa and descent | Put the white hotel and grandstand on the outside of the curve. Alternating kerb blocks, wrapped straw, watching spectators and orange marshals read before the corner. Round shoulders show sheep and a sea horizon under broad moving cloud shadows. | Real 01, 07–09, 11 and 14. Games 01, 03–05. |

Use the fixed skyline and batched crowd approach from Caribana. Keep the rails, stairs, pub windows and marshals legible on Low. Release the textures, shared materials and tram geometry when the course leaves the screen. Test the ordinary rider entry, pause and resume through the fixture bike. Compare matching photos and measure two submitted one-minute samples after nine seconds of warm-up.

The native scene models the slate courses, low hawthorn and ash, sheep, Snaefell summit masts, catenary, railway buildings, stair treads, Creg-ny-Baa windows and spectator stand. The train, marshal flag and illumination follow the ride clock. The changing cloud light uses an original generated Manx panorama. Crossing poles stand clear of the carriageway. White dashes share a continuous surface with the asphalt so depth precision on Low preserves the paint.

### Iten, Kenya · #2142

The existing world registry entry describes the red-dirt training road. Map Select also needs the original GCN workout published in the API catalogue. Its 14 stages of *40 Minute HIIT* cover 17.86 km in 40:00 with a two-second video offset. The Race journey enters a lazy native course through the course registry (ADRs 0021, 0023, 0030, 0034 and 0035). The rider and HUD share the sampled elevation. The off-network world uses local geometry and artwork.

| Rider view | Construction and reference |
| --- | --- |
| Murram and runners | Two worn wheel paths reveal red laterite under the loose surface. Runner groups wear different kit and stride out of phase on the verge. The broken acacia crowns give way to candelabra euphorbia. Real 01–05 and 08, games 01–02 and 04. |
| Farms and Kamariny Stadium | Fence wires follow timber posts between maize, pasture and tea plots. Cattle and goats cluster with their herders. The dirt oval encloses grass, with a simple covered timber stand on the long straight. Real 04, 07–08 and 12–14, games 03 and 04. |
| Town and valley rim | Painted fascias sit under corrugated shop roofs beside a matatu and a moving boda-boda. The road shoulder opens onto successive spurs of the Kerio Valley under equatorial cumulus. Real 06, 09–11 and 15, games 01, 03 and 05. |

As on Caribana, place individual moving figures near the rider and batch distant shapes. Keep the escarpment fixed in world space and the paint and gravel grain at physical scale. Release all course materials, textures and buffers with the scene. Capture six matching views with the same HUD state through the simulated bike. Measure actual submissions on the opening and in town with the procedure in the performance design.

The finished grade rises or falls one percentage point for each resistance level above or below the distance-weighted mean. Over all fourteen stages this gives 378 m of climbing. The compacted laterite, two tree cutouts and distant valley use original generated artwork. Trees and foliage remain in road sections; only the approach to the escarpment reveals the painted valley. The field, dirt oval, covered stand, market, matatu, maize plots, posts and wire are native geometry. Runner packs use bounded instanced joints, and the grazing heads and the boda-boda use the same ride clock. The scene releases each owned texture, instance buffer, geometry and material.

## Holi in Jaipur (#2143)

The legacy race follows the sprint class through the shared road renderer. Preserve its workout and progression while giving the gates, festival and palace a position along the course. Map Select supplies the original GCN plan to Race Setup. The lazy authored-course renderer loads the same-origin Jaipur GLB and its arc-length profile. Race time owns the dancers, throws and traffic on both rendering backends.

| Rider position | Real and game references | What reads at riding speed |
| --- | --- | --- |
| Sanganeri Gate, 0.08 km | Real 01, 05, 11 and game 01 | Recess the arched opening and keep daylight visible through it. Place the first pavement stains and low shop roofs ahead. |
| Johari Bazaar, 1.36 km | Real 03, 10, 12–14 and game 05 | A repeating pink arcade follows the bend. Broken white linework, fabric awnings and goods distinguish shops while their undersides stay in shadow. |
| Hawa Mahal, 2.92 km | Real 06, 12–13 and game 04 | Five narrowing tiers of projecting windows read across the street. Deeper oriels and domes break the silhouette above the roofline. |
| Festival crowd, 4.58 km | Real 02, 04, 07–09, 15 and games 02–03 | Give revellers staggered throws and visible arm movement. Overlapping translucent powder grows above the throw, drifts and clears, leaving the centre line visible. |
| Market traffic, 6.21 km | Real 03, 07, 10, 14 and game 01 | An auto-rickshaw has a small front wheel, open sides and canopy. Keep moving traffic, parked scooters and resting cattle at distinct depths. |
| Chandpole, 8.12 km | Real 01, 05, 11–13 and games 04–05 | Chhatris stand clear of the shop parapets. Behind the second city gate the fort follows a fixed ridge in the spring haze. |

Batch the arcades and road wear by distance and bake shadow into recesses. Use shared actor geometry, a bounded pool of powder puffs and a single race clock. Release the pool, its materials and any generated textures on exit. Match Caribana’s fixed skyline and animate only where the rider can see the result. Compare six HUD-visible views at matched distances. Measure submitted frames, p95, worst interval, peak calls and advancing distance on the opening and the busiest market stretch after nine seconds of warm-up.

## Trinidad J’Ouvert (#2145)

Keep the existing J’Ouvert soundtrack, Frederick Street identity and GCN sprint plan. Map Select supplies the class to Race Setup. The lazy course renderer loads the same-origin GLB and stage-based road profile, and the existing race engine owns resistance, cadence, pause and progression. No additional rider feedback appeared in the issue-title search.

| Rider position | References | How the feature reads on Low |
| --- | --- | --- |
| Frederick Street, 0.08 km | Real 01, 07, 11 and 15, games 02 and 03 | Deep balconies, projecting signs and overhead cables enclose the narrow street. Small pools of lamplight leave the hills dark behind its vanishing point. |
| Blue devils, 1.43 km | Real 02 and 06, games 01 and 05 | Curving horns and loose chains distinguish the blue-painted masqueraders from the mud and paint band. Staggered dancing bodies move towards the verges for each sprint. |
| Soca truck, 2.68 km | Real 04–06, games 02 and 05 | A rolling truck carries banks of speaker cones below a high rail. Coloured light catches powder above the crowd and pools beneath the rear lamps. |
| Pan side, 3.67 km | Real 03 and 08, games 03 and 04 | Players in matching shirts strike shallow metal pans; double pans and deep bass drums sit on wheeled frames. Keep mallets and polished rims visible from rider height. |
| Red House, 4.82 km | Real 09–12 and 14, games 03 and 04 | Model the long red wings, white pilasters and central projecting pavilion beside the square’s fence. Reserve a sightline across the grass between the trees. |
| Dawn, 5.93 km | Real 01, 07, 09–11 and 13–15, games 01 and 03 | Lift the eastern sky to blue while lit signs and lamps remain visible. Royal palms, almond and flamboyant crowns frame flags and splashed plaster above cups, rags and dirty asphalt. |

Use the local Port of Spain photos for buildings and geography. Real 04–06 depict celebrations in Aruba and Jamaica and inform only crowd density, light and paint. Real 03 informs band spacing; the Trinidad pans in real 08 supply the instrument details. Caribana’s speaker silhouettes, bounded crowd batches and fixed skyline provide comparisons for the original models. Keep the truck, dancers, pan players and powder on race time. Reuse the world music player and its volume control. Release shared geometry, textures and materials on exit. Record six matched rider views and report actual submissions, p95, worst interval, draw calls and advancing distance for both tablet runs.

## Joshua Tree (#2144)

The legacy Park Boulevard ride uses a generic class world. Retain its 13-stage ramp session, cadence and target resistance. Map Select and Race Setup open the native course through the lazy race-world renderer, which reads the same-origin GLB and the stage-based centre line. No other Joshua Tree rider feedback appeared in the issue-title search.

| Position | References | Rider view on Low |
| --- | --- | --- |
| Park Boulevard, 0.08 km | Real 03–05, 07, 10–12 and games 02 and 05 | The yellow centre lines sweep between gravel banks. Short broken trunks and forks support uneven shaggy crowns. Sparse creosote and sage leave visible gaps between the trees. |
| Hidden Valley, 4.25 km | Real 02, 08, 13 and games 01 and 03 | Warm light picks out separate weathered blocks and cracks. A climber changes holds above a belayer, with parked cars at the turnout below. |
| Skull Rock, 9.78 km | Real 02, 06 and 13 and game 03 | Deep shadow inside two eye sockets and a nasal opening gives the weathered boulder its silhouette, with other jointed granite behind. |
| Jumbo Rocks, 12.37 km | Real 01, 08 and 13 and games 03–04 | Separate tent pitches, tables and pulled-in cars fill gaps among rounded boulders at the foot of the climbing wall. |
| Cholla Cactus Garden, 17.63 km | Real 09 and 15 and games 02 and 04 | Low branch clusters with pale tips catch the sun against a darker foothill. The gravel between the plants remains visible. |
| Mountain outlook, 22.31 km | Real 04, 05, 10, 14 and 15 and game 05 | The road crosses open scrub beneath a fixed Little San Bernardino skyline. Long warm shadows identify the direction of the low sun throughout the bend. |

Use Caribana’s fixed distant skyline and independently culled near detail. Bake rock seams and ground wear, batch roadside plants, and retain the limbs, spines and rock recesses at low detail. Animate climbers from the ride clock with shared geometry. Stop updating distant actors and release buffers and textures when leaving the race. Compare six matched rider-height views with the HUD visible. Measure actual submissions, p95, longest frame time, draw calls and advancing distance through both moving samples.

## Junkanoo, Nassau (#2146)

Preserve the 22-stage GCN class and the existing world soundtrack. Give the race a physical Bay Street course with original Nassau landmarks. Map Select and Race Setup pass the rider into the lazy course renderer, which loads the same-origin GLB and its arc-length profile. No other Junkanoo issue appeared in the rider-feedback title search.

| Rider view | Real and game references | What remains legible on Low |
| --- | --- | --- |
| Bay Street, 0.08 km | Real 07, 11, 13–14 and games 01 and 04 | A narrow floodlit lane between colonial shop galleries, Bahamian shutters and freestanding barriers, with raised grandstands behind the spectators. |
| Valley Boys, 2.31 km | Real 01–06 and games 02–03 | A giant original crepe-paper lead piece, its cut fringe and high headpiece reflecting the floodlights. The group name is readable over the crowd. |
| Saxons, 4.76 km | Real 03–04, 09–10 and 12 and games 01 and 03 | Shoulder straps hold the goatskin drums. Hands swing cowbells, horn bells point above the players and the Saxons banner identifies the troupe. |
| Rawson and Parliament squares, 7.24 km | Real 07, 13–14 and games 01 and 05 | Leave a sightline past palms to the seated Queen Victoria on her plinth, the pink government buildings, white verandahs and louvred shutters. |
| Roots, 9.48 km | Real 02, 05–06 and 08–09 and games 03 and 05 | A distinct lead silhouette, group banner, fringe, spectators on tiers behind their barriers and black, aquamarine and yellow flags. |
| Prince George Wharf, 12.12 km | Real 01, 13 and 15 and games 02 and 04 | Bands leave paper on the tarmac. A break in the shopfronts reveals water, the cruise-ship decks and a pink sky behind the wharf. |

Real 10 depicts the Harbour Island band and informs drum scale and carriage. Use the Nassau street photographs for local buildings. Compare the distant harbour and moving parade foreground with Caribana’s skyline and bands. Batch the paper, barriers and musicians, animate from race time and release geometry, materials and textures when the rider exits. Match six HUD-visible viewpoints and record submitted FPS, p95, longest interval, peak calls and distance through the two one-minute tablet rides.

## Kīlauea Lava Road (#2147)

The route compresses Crater Rim Drive, the vent fields and Nāhuku into the original class distance. Preserve the six GCN stages and existing soundtrack. A same-origin GLB and arc-length course load through the normal Map Select and Race Setup flow. Keep the existing violet sky, cool moonlight, volcanic haze and sun below the horizon as requested in rider feedback #936. Recoveries can descend while efforts climb. The map preview samples the same physical grade as the race.

| Rider view | Local and game references | What the rider sees on Low |
| --- | --- | --- |
| Lava fields, 0.08 km | Real 01, 05, 07, 11 and 13 and games 01 and 04 | Double yellow markings break where a black flow has cut the old surface. Rounded ropes and crumpled skin contrast with angular clinker. Mauna Loa forms a fixed, gently rising shield behind the flows. |
| Wahinekapu, 1.54 km | Real 06, 08–09 and 14 and games 01 and 04 | Low rails border scrub and open vents. Unequal columns form at the cracks, expand, drift and fade with the race clock. |
| Sulphur Banks, 2.62 km | Real 06, 08–09 and 14 and game 04 | Mineral aprons put pale yellow and ochre edge deposits around the steaming openings. |
| Nāhuku, 3.94 km | Real 02, 12 and 14 and game 05 | Tree fern fronds and red lehua flowers gather above a dark tube mouth recessed into the bank beside the road. |
| Halemaʻumaʻu, 5.68 km | Real 03–04, 10 and 15 and games 01–03 | A near rim drops through broken benches around a broad recessed basin. A glowing, crusted lake sits on the floor and a drifting plume catches light beneath. |
| Dusk, 7.24 km | Real 03–05, 11 and 15 and games 01–03 | The low orange reflection concentrates under the crater cloud. The shield and violet dusk remain visible around it. |

Keep near rock, ferns and fissures anchored to the grade; draw the distant shield once. Adapt Caribana’s bounded foreground batches to steam, tree ferns and clinker. Across the street references, Real 01, 02, 07 and 11 show neighbouring Chain of Craters Road and inform surface and vegetation. Real 12 supplies Crater Rim Drive itself. Use the game images for light contrast and approaching silhouettes. Keep the source photographs in their credited reference directory. Release all textures and instance buffers on exit.

## Knicks Championship Parade (#2148)

Keep the existing championship parade, New York morning light, street banners, moving floats and original soundtrack. The native course anchors the class grade and public landmarks to the race distance. Load Broadway’s existing street model and crowd only when entering this course. The rider advances through the map via Map Select and Race Setup. Sprintavals keeps its eighteen original stages, cadence, resistance and video timing.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Bowling Green, 0.08 km | Real 07, 08, 10 and 13–14 and games 01 and 05 | The bull has a lowered head, curved horns, a humped shoulder and bronze highlights against the park fence. |
| Float, 1.42 km | Real 01–04 and games 02 and 03 | Rails and team figures ride above the flatbed. Orange and blue fans crowd the blue barriers. Paper tumbles past open windows and accumulates on the road. |
| Trinity Church, 2.65 km | Real 05, 09 and 15 and games 01–02 | The narrow Gothic spire, churchyard fence and trees break the wall of commercial buildings. |
| Open bus, 3.88 km | Real 01–06 and 12 and games 03 and 04 | A moving double-decker has an open roof, visible passenger rail and two rows of windows. The lower Broadway street name and signals hang above its lane. |
| St. Paul’s Chapel, 5.27 km | Real 05, 07, 12 and 15 and games 04 and 05 | A columned porch and pale steeple are seen at the churchyard. Bronze route plaques occupy the granite pavement. Tower shadows leave distinct sunlit bands. |
| City Hall, 6.69 km | Real 05, 11–12 and 15 and games 01 and 05 | Terra-cotta setbacks and the green copper crown stay at the far end of Broadway and approach the rider. |

Real 01–04 show the US women’s national soccer team parade and supply proportions of floats, fan barriers and viewing distance. Real 06 shows a transit bus and supplies vehicle scale. All Knicks colours and designs come from original game assets. Feedback #900 requires continuous float, crowd and ticker motion. Keep wrapped objects outside the visible interval, fade a paper fragment at each end and use the ride clock for pause and reduced motion. Use bounded buffers and release all native course textures and batches.

## Kona Ironman (#2149)

Use the course renderer from normal Map Select and Race Setup. The distance-weighted resistance sets each stage’s physical grade; the map panel reads the same sampled elevation. GCN’s High Intensity Race Day Effort has seven stages lasting 25:05, with a three-second offset. Keep the existing world soundtrack. No other Kona issue appeared in the rider-feedback title search.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Queen K, 0.08 km | Real 01–02, 05–08, 11 and 13–14; games 01 and 05 | Double yellow and white markings follow straight, rolling tarmac with a wide paved shoulder. Angular ʻaʻā and smooth pāhoehoe flank the road. Hualālai and the higher Mauna Kea silhouette stay fixed inland. |
| Coral, 1.53 km | Real 02, 05–08 and 13 for the dark verges; games 01 and 03 | Names on the verge are made from separate irregular pale stones. Dry fountain grass bends in the same crosswind across adjacent patches. |
| Aero riders, 3.24 km | Real 03, 04 and 10; games 02 and 05 | Triathletes ride apart on the shoulder, with forearms on the extensions, aero helmets, numbers and dark disc wheels. |
| Aid station, 4.92 km | Real 03–06 and 09–10; games 02 and 04 | Volunteers reach from behind cones and fold-out tables stacked with bottles. Tents and race bunting are visible before the rider reaches the station. Real 09 supplies crowd and banner scale at a Kona event. |
| Coast, 7.30 km | Real 07, 08, 12, 13 and 15; games 03–05 | Pacific blue and wind-driven surf meet black shore shelves. The near road remains sharp and the low heat shimmer stays in the distance. |
| Aliʻi Drive, 9.51 km | Real 09, 12 and 15; games 02–04 | The shoulder becomes a palm-lined seafront street with spectators, race banners and the finish arch. |

Adapt Caribana’s three depths to the foreground cyclists, the mid-distance station or finish and the fixed inland shields and ocean. Batch bike frames, wheel rims, bottles and grass. Wind, distant optical shimmer and the pedalling motion use the race clock. The course owns and releases its instance buffers, original textures and materials. Preserve the full sourced reference folder.

## Koppenberg Cobbles (#2150)

Load the native course from Map Select and Race Setup. Preserve the ten original stages of GCN Training’s Low Cadence Strength Builder and its three-second video offset. Base the long climbs on the hard stages, concentrating their ascent in short, signposted ramps where the terrain reaches 22%. Ease the settling grade between ramps. Sample that same line for the race profile and riders, spectators and cobbles.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Melden farm lanes, 0.08 km | Real 05, 07, 11, 13–14 and game 05 | Brick farmhouses and pollarded poplars flank a patched approach through ploughed fields. |
| Foot of the Koppenberg, 1.06 km | Real 01, 04, 06, 08 and games 01–02 | Concrete gives way to wet, domed setts. Moss collects at the verges and polished crowns pick out the riding line. |
| Steep chute, 2.39 km | Real 01–04, 08, 15 and games 01–03 | A short 22% pitch narrows between undercut grass banks. Only two riders fit abreast. |
| Race crowds, 3.74 km | Real 01–03, 06, 09–10 and games 02–04 | Fans lean over the metal barriers and wave yellow Flemish lion flags. Race signs and a canvas beer tent break up the banks. |
| Wooded crest, 4.90 km | Real 02–03, 08, 11, 14–15 and games 02 and 05 | Bare branches and early leaf buds close above the last wet stones. Spring mist softens the trees across the next field. |
| Melden overlook, 5.32 km | Real 05, 07, 11–14 and games 04–05 | Beyond a row of poplars, Sint-Martinus has a dark rectangular tower, pointed spire and pitched nave above the Scheldt fields. |

Real 01–03 are Koppenberg race views. Real 04–10 show the neighbouring Paterberg and inform barrier scale, cobble patterns and temporary race infrastructure. Real 12–13 establish Melden’s church and the surrounding sightline. Adapt Caribana’s fixed landmark and depth layers to the church, trees and foreground banks. Keep flag deformation, spectator gestures and drifting mist on race time. Batch the crowd and flags, bake stone wear and release all course resources on exit.

## Oude Kwaremont (#2151)

Map Select opens the class-backed solo race. GCN Training’s Cobbled Mayhem has eleven stages over 40:00 with a three-second video offset. The final series of hard intervals carries the 2.2 km cobbled drag from 12.80 to 15.00 km. The village is the steepest part. Use the same physical centre line for the race, camera, gutter stones, crowd rails and elevation profile.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Kluisbergen approach, 0.08 km | Real 09, 14–15 and games 03–05 | Furrows and clipped hedges mark gently sloping fields around a brick farm gateway. Bare trees line the next bend. |
| Foot of the Kwaremont, 12.84 km | Real 03–05, 11–12, 15 and games 01 and 05 | The lane changes from tarmac to crowned, damp setts. The smooth strips narrow beside the muddy verges. |
| Village square, 13.56 km | Real 01–02, 10, 14 and games 01 and 03 | Two-storey brick and rendered cafés face the narrow riding line. Rider names cross the cobbles below a kilometre banner. |
| Beer tents, 14.12 km | Real 06–08, 13 and games 01–02 | White VIP marquees rise in tiers above temporary boardwalks, with speaker stacks, serving counters and spectators several rows deep. |
| Upper drag, 14.65 km | Real 03–06, 11–13 and games 02, 04–05 | Yellow lion flags mix with club banners above the metal rails. Fans lean over the edge of the wet cobbles. |
| Melden and Kluisbergen fields, 15.28 km | Real 07–09, 14–15 and games 03–05 | The crowds thin at the end of the cobbles, revealing muddy field edges, clipped hedges and the village roofs under low April cloud. |

The reference photographs distinguish the deep temporary VIP structures in real 07–08 from the permanent village façades in real 02 and 10. The gate in real 14 belongs to a Kluisbergen farm. Use original lettering and race banners. Adapt Caribana’s close animated participants, middle-distance structures and stable far skyline to the fans, village and fields. Instance animated figures and flags, batch buildings and barriers, and release course-owned textures and geometry at race exit. Rider feedback search found only #2151.

## Kyoto Hanami (#2152)

Use the normal catalogue and solo race entry. The eleven original stages of GCN Training’s Cadence Training to Improve Pedalling run for 25:00 from the beginning of the video. Extend the distinct sections of the Philosopher’s Path to the class-derived 10.400 km course. Keep the canal alongside the path, place bridge abutments on opposite walls and sample the physical grade for the map and HUD.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Nanzen-ji, 0.08 km | Real 13–15 and games 03–04 | The approach passes the timber temple gate, broad tiled eaves and flanking white walls before joining the canal. |
| Lake Biwa canal, 1.54 km | Real 01–04, 10–11 and games 01 and 03 | The water runs below the narrow path between inclined walls of fitted stone. Pale gravel and rectangular edging separate the rider from the canal. |
| Granite bridge, 3.28 km | Real 02–03, 05 and 08–11 and games 01 and 05 | A low granite span crosses the canal to the opposite bank. The shaded opening and its reflection stay visible under the parapet. |
| Hanami walk, 5.42 km | Real 01–03, 06–09 and games 01–03 | Strollers and photographers gather under the pale pink canopy. Clusters of petals drift by and smaller petals float downstream. |
| Tea shops, 7.46 km | Real 03–05, 09–11 and games 04–05 | Low timber shop fronts, lattice screens, indigo curtains and the carved 哲学の道 path marker frame the near bank. |
| Ginkaku-ji approach, 10.04 km | Real 04, 10–11 and 13–15 and games 03–05 | Hedges and tiled timber buildings lead toward the Ginkaku-ji entrance, with green Higashiyama ridges beyond the last bridge. |

Real 12 is the Philosopher’s Walk at Tatsuno in Hyōgo and supplies the stone-marker convention only. Real 13–15 establish Nanzen-ji’s gates. The northern gate is an original interpretation of the Ginkaku-ji approach. Use the daytime photographs for spring light and game 02 for contrast between petals and the riding line. Adapt Caribana’s physical separation of near participants and far skyline to visitors, bridges and green mountain ridges. Batch walkers and small drifting petals, keep the visible canal section bounded, and dispose the course-owned textures, batches and materials on exit. The issue title search found only #2152.

## Chicago Lakefront Trail (#2153)

Use the normal catalogue, race setup and native course renderer. GCN’s 25 Minute Sprint Intervals has sixteen original stages over 25:30 and a three-second video offset. Keep the grades small on the 10.525 km trail. The centre line, lane markings, beach edges, revetment and camera use the same physical coordinates.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Lincoln Park, 0.08 km | Real 01, 05–07 and games 01–02 | Mature park trees cast shade on a wide striped trail. Riders, runners and skaters approach between the inland lawn and the lake. |
| Harbour, 1.78 km | Real 03, 06–07, 10 and games 01 and 03 | Rows of masts and mooring fingers follow the harbour curve, with sailboats moving on the sheltered water. |
| North Avenue Beach, 3.54 km | Real 02, 11 and 13–15 and games 02–03 | The blue and white ship-shaped beach house rises beside umbrellas and a tall lifeguard chair, with lake and sand behind it. |
| Concrete revetment, 5.68 km | Real 02, 08–09, 12 and games 01 and 04 | Low waves break against staggered concrete steps. Lake fog stays low over the water while the paved line stays legible. |
| Oak Street Beach, 7.84 km | Real 02, 07–08 and 12–13 and games 03–05 | People sit on steps and gather around parasols. Blue Divvy bikes, runners and inline skaters pass in marked lanes. |
| Skyline overlook, 9.94 km | Real 01, 07–08, 10–11 and 15 and games 03 and 05 | The dark braced Hancock tower and bundled Willis Tower stand above the shoreline cluster across turquoise water. |

Real 04 depicts a trail at Geneva, New York and informs path scale only. Real 14 shows a smaller North Avenue beach building. Use the ship-shaped main beach house from the issue brief, with the shore and skyline proportions established by real 11 and 15. Caribana’s fixed skyline and detailed moving foreground translate to Chicago’s distinctive towers and the active path users. Batch the masts, beach furniture and wheeled traffic, keep secondary motion on race time and release each course-owned resource on exit. The world-specific feedback title search found only #2153.

Model the North Avenue Beach House with a streamlined blue-and-white hull, portholes and an open upper deck. Its current concrete structure was designed by Wheeler Kearns Architects and opened in 2000. [Chicago Park District, North Avenue Beach](https://www.chicagoparkdistrict.com/parks-facilities/north-avenue-beach)

## Lake Louise (#2154)

The 8 km ride compresses the lakeshore and two nearby mountain roads into thirteen stages of GCN Training’s 20 Min Cardio Spin Bike Workout. Keep the lake at a single elevation. Place Victoria Glacier and the ridges in fixed positions so gaps in the trees reveal the same landmarks from different angles. Bake blue-green reflections beneath the cliffs and leave distant water clear enough to read the red canoe silhouettes.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Château forecourt, 0.08 km | Real 08, 13–14 and game 05 | Arcaded limestone walls and rows of windows rise from the terrace. Hikers cross between the lawn and the low stone parapet. |
| Canoe dock, 1.22 km | Real 04–05, 09–11 and game 03 | Red canoes leave a timber boathouse, their paddles dipping beside the dock against milky turquoise water. |
| Victoria Glacier, 2.68 km | Real 06–07 and games 01 and 04 | The hanging glacier sits in a notch between dark rock faces above its reflection, visible beyond the stone-lined gravel trail. |
| Bow Valley Parkway, 4.14 km | Real 02–03 and 12 and game 02 | Lodgepole pines and spruce close around a narrow asphalt bend. A park sign and timber bench mark a pullout. |
| Fairview shoreline, 5.86 km | Real 06, 10 and 15 and game 04 | The steep grey shoulder of Fairview drops into jade water. Hikers and road cyclists pass on the near side of the lake. |
| Moraine Lake road, 7.52 km | Real 01, 03, 14–15 and games 01 and 05 | The road turns past a signed viewpoint. Mount Temple rises beyond the lower tree-covered slopes. |

Use Caribana’s separate skyline and instanced foreground for the mountain profiles, groups of spruce, visitors and moving boats. The shoreline walls and benches follow the gravel path. Animate canoe paddles, hulls, hikers and cyclists on the race clock. Release the course-owned textures, instance buffers and materials on exit. The Lake Louise issue-title search returned #2154.

## Alto de Letras (#2155)

Use the original twenty-seven stages of GCN Training’s Hank’s Hardest Training Session on a 22.150 km interpretation of Ruta 50. The lower bends cross coffee country before Fresno. Exposed ridges carry wax palms. Padua marks the transition to cloud forest and the final páramo. Model the distant switchbacks in the same elevation system as the rider and keep tall palms, town façades and rising traffic legible from a moving bike.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Coffee slopes, 0.08 km | Real 09–10 and games 01 and 04 | Low rows of glossy coffee bushes and broad plantain leaves climb above the first switchback in warm sunlight. |
| Fresno, 3.62 km | Real 06–08 and game 03 | A painted chiva passes timber balconies, a bakery and a stall selling fruit and arepas. Its roof luggage and open rows of seats stay visible around the bend. |
| Wax palm ridge, 7.68 km | Real 01, 10–12 and games 01 and 05 | Slender wax palms rise above an exposed green ridge. The road folds back below the rider and local cyclists climb alongside. |
| Padua, 11.84 km | Real 04, 06–08 and games 02–03 | A loaded lorry climbs past painted shopfronts and an aguapanela stall as the first cloud crosses the road. |
| Cloud forest, 16.92 km | Real 01, 04–05 and 14–15 and games 02 and 04 | Tree canopies frame switchbacks that disappear into a moving band of mist. Patches of cloud fill the valley beneath the asphalt. |
| Páramo de Letras, 21.49 km | Real 02–03, 05 and 13–14 and games 02 and 05 | Silver-leaved frailejones, ochre tussocks and moss replace forest near the signed 3,679 m summit under cool grey light. |

The Caldas chivas and Murillo façades in the credited photographs supply construction and paint references for the modelled towns. The Cocora photographs establish wax palm proportions. Use the game views for riding-scale framing and contrast in the fog. Adapt Caribana’s moving traffic and layered skyline to the valley switchbacks, use shared assets for plantings and release route-owned buffers on exit. The issue-title search returned #2155.

## Lisbon Tram Hills (#2156)

GCN Training’s 15 Minute Strength Workout supplies sixteen stages and a three-second video offset. The route compresses Alfama’s climb into 6,337.5 m. The rails, cobbles and wire share the centre-line geometry with the tram. Keep the restrained composition requested in rider feedback #931. Use simple planes of sun and shadow through the lanes, then give each terrace a clear view of the river and a distinct landmark.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Tram 28 lane, 0.08 km | Real 01–04, 06 and 12 and games 03 and 05 | A yellow Remodelado takes the bend beneath the contact wire. Twin steel rails follow the polished calçada through the lane. |
| Sé Cathedral, 1.04 km | Real 04, 07 and 10 and games 01 and 04 | The cathedral’s two square towers and recessed rose window close the street. An escadinha branches away from its sunlit forecourt. |
| Alfama beco, 2.18 km | Real 05 and 07–11 and games 03–05 | Blue and green azulejos, iron balconies and hanging laundry frame a stepped side alley. Locals gather beside café tables beneath bougainvillea. |
| Santa Luzia, 3.36 km | Real 03, 08, 11 and 13 and games 01–02 | A blue-tiled parapet and flowering pergola open onto terracotta ridges and the broad Tagus. |
| Portas do Sol, 4.70 km | Real 05, 09 and 13–14 and games 02 and 04 | Low roofs descend from the terrace toward the river. São Vicente’s paired white towers rise above them. |
| Castelo de São Jorge, 6.02 km | Real 13–15 and games 01–02 | Crenellated stone walls climb to a square keep beyond the final bend. A shaded arch opens beneath the battlements. |

Use the real streets and municipal tram photographs for proportions and materials. The reference folder has no direct cathedral portrait. The Sé’s twin fortress towers and rose window and São Vicente’s paired white towers follow the issue brief. Keep these silhouettes fixed above the roofs as in Caribana’s skyline. Batch repeated balconies and roof tiles into the street sections, animate tram travel, laundry and pedestrians on race time, and release course-owned resources on exit.

## Loire Châteaux (#2157)

Use the nineteen stages of GCN Training’s Sweet Spot Endurance Training on a 12.200 km circuit linking compressed interpretations of the Loire and its tributary the Cher. Build four different château silhouettes. Chenonceau’s gallery must cross actual water, leaving sky or the opposite bank visible through all five arches. Chambord has a central lantern and a dense roofline. Chaumont and Amboise occupy separate high terraces.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Loire à Vélo levee, 0.08 km | Real 01–04, 12–13 and games 01 and 03 | Green cycle signs mark the embankment above sandbars and willow islands. Passing touring cyclists and the narrow ground shadows of poplars give scale to the wide Loire. |
| Chambord gardens, 2.12 km | Real 04–05 and games 02 and 04 | Round corner towers and a crowded slate roofline of chimneys, lanterns and turrets rise beyond symmetrical hedges and a still moat. |
| Vouvray vineyards, 4.32 km | Real 03–04, 11–12 and games 01 and 05 | Vine rows converge up the slope. Chalk cave doors punctuate a tuffeau ledge above the lane. |
| Chenonceau on the Cher, 6.58 km | Real 06, 13 and 15 and games 02 and 04 | The château’s long pale gallery lies across five open arches, with a separate tower at the bank. Moving water breaks the reflected arch rhythm. |
| Amboise river town, 8.92 km | Real 02, 08–10 and 14 and games 03–05 | The high terrace and round riding tower overlook a town of slate-roofed limestone houses. A flat-bottomed riverboat passes the quay. |
| Chaumont overlook, 11.60 km | Real 07, 08, 10 and 13–14 and games 02 and 05 | Pointed grey roofs crown the round towers of Chaumont above the slope. The final levee passes willows and low sandbanks in hazy summer light. |

The Saumur photographs (08–10) guide the relationship between cliff, town and river. For Amboise, use the royal château’s documented riding towers and terraced promontory. [Château royal d’Amboise, Les tours cavalières](https://www.chateau-amboise.com/les-tours-cavalieres-du-chateau-royal-damboise/).

Use Caribana’s fixed skyline and bounded moving foreground for the towers, the cyclists and the riverboat. Draw the repeating vine rows and avenues in sections along the lane, with softer detail at the opposite bank. Release course-owned materials, textures and buffers on exit. The Loire issue-title search returned #2157.

## Machu Picchu Road (#2158)

Keep the World Ride bend profile of 60 degrees and 48 m and the existing heading function. Rider feedback #939 explicitly calls out these turns. Transfer the alignment to the native race centreline, sampling heading through each bend. Use the original Step It Up workout clock and distance integration. Compress the real sequence from town to citadel into the ride.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Aguas Calientes bridge, 0.08 km | Real 03, 10 and 12. Games 01 and 02. | The bridge’s cross-bracing frames the town, the railway embankment and the first glimpse of brown water. |
| Urubamba gorge, 1.74 km | Real 03, 10 and 11. Games 01 and 05. | Fast brown water breaks against granite boulders below the outside verge. Overlapping green ridges enclose the gorge. |
| Hiram Bingham switchbacks, 3.88 km | Real 01–05. Games 03–05. | A two-tone shuttle rounds a bend above the exposed retaining wall. The narrow outer verge reveals the next cut in the forest. |
| Cloud forest, 6.22 km | Real 04, 06 and 09. Games 03 and 04. | Ferns and climbing bromeliads frame the patched road as cloud crosses the distant rock faces. |
| Inca agricultural terraces, 8.40 km | Real 07–09 and 13–15. Games 03 and 05. | Grassed terrace tops step down between dry granite retaining walls. Stone stairs cut diagonally across the rider’s view. |
| Citadel saddle, 10.37 km | Real 07–09 and 13–15. Games 02 and 05. | Roofless gabled walls and temple courts sit on the saddle in front of the steep asymmetric peak of Huayna Picchu. |

Use Caribana’s fixed skyline for Huayna Picchu and the outer mountains, with separate nearer rock faces and sectioned terraces. Bake shade beneath granite blocks and across the forest floor. Keep original shuttle art separate from shared bus geometry. Move the buses, broken water and drifting cloud on race time. Dispose of course-owned textures, materials and buffers on exit. The photo and game credits are in docs/worlds/machupicchu/SOURCES.md.

## Marina Bay Night (#2160)

Rider feedback #913 praises the original night world. Its class street module already has a lit skyline, three leaning hotel towers and the SkyPark. Retain that palette and the open view across the water. The race route places its landmarks at fixed positions around the bay. The original seven-stage GCN class is Fast Paced Cadence Variations.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Bayfront promenade, 0.08 km | Real 01, 06, 10 and 14. Games 01 and 02. | Three inclined towers support the cantilevered SkyPark across open water. Lamps and palm trunks pass the rider while the hotel stays fixed on the skyline. |
| Merlion Park, 1.84 km | Real 06, 07 and 11. Games 02 and 05. | The white lion and scaled tail rise on a wave plinth. Its water jet curves into the bay in front of the reflected CBD towers. |
| Esplanade shore, 3.62 km | Real 03, 06, 07 and 12. Games 01 and 04. | Twin spiked theatre domes catch gold light behind the promenade. Strollers and joggers pass the rail by the dark water. The spherical Apple pavilion in real 12 is a separate south-bank landmark. |
| Helix Bridge and lotus, 5.36 km | Real 02, 04, 05 and 14. Games 03–05. | Two illuminated spirals twist over the bridge deck. The ArtScience lotus petals open beyond the structure. |
| Supertree Grove, 7.58 km | Real 08–09. Games 03–05. | Violet and cyan branches spread above a narrow suspended OCBC Skyway. The crowns change colour on the ride clock. |
| Flyer and light show, 10.12 km | Real 01, 03, 10, 13 and 15. Games 01–02 and 04. | Upright white capsules follow the illuminated Singapore Flyer rim. Narrow beams cross the bay above the reflections. |

Use Caribana’s fixed skyline and merged window strips for the CBD, and tint their broken reflections on the water plane. Keep the Helix Bridge spirals and lotus geometry separate from the skyline. Batch railings, palm crowns and garden branches along the route. Animate the wheel, tree light and joggers directly from race time. Release course textures and draw buffers when leaving the route. Image credits are in docs/worlds/marinabay/SOURCES.md.

## Marrakech Medina (#2161)

Use the original Fast Fitness: High Cadence 30 intervals to determine stage length. The race leaves the square for the spice and lantern souks and returns past the ramparts. The existing class registry supplies its warm dusk palette, gentle bends and flat sprint profile. Give the square depth through a fixed Koutoubia silhouette, a nearer tier of roof terraces and the stalls and passersby closest to the rider.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Jemaa el-Fnaa at dusk, 0.08 km | Real 01, 03–06 and 14. Games 01–03. | Koutoubia’s square sandstone minaret rises above the open plaza, beyond grill canopies, palm crowns and glowing café windows. |
| Night grill stalls, 2.16 km | Real 01–06. Games 01 and 03. | Steam and charcoal smoke drift above rows of numbered canvas stalls. Bare bulbs pick out seated diners and cooks. |
| Spice and juice market, 4.32 km | Real 02, 11–12. Games 01 and 04. | Orange pyramids, spice mounds and striped awnings narrow the passage. A donkey cart passes the juice sellers. |
| Souk Semmarine, 6.68 km | Real 07–10 and 15. Games 01 and 05. | Reed screens stripe the lane. Hanging rugs and leather slippers give way to perforated brass lamps. A moped threads between the stalls. |
| Musicians and performers, 9.24 km | Real 01–04 and 09. Games 02–03. | A half-ring of onlookers gathers around a seated pipe player, a rising snake and a percussionist. A clear line through the square stays visible to the rider. |
| Ramparts and café terraces, 12.24 km | Real 04–06 and 13–15. Games 02, 04 and 05. | Crenellated red walls and a passage under a horseshoe arch frame the closing lane. Lit rooftop cafés overlook the square, with the Atlas behind the minaret. |

Adapt Caribana’s baked occlusion and bounded moving foreground. Alternate sun-warmed lime plaster, darker patched areas and small pools of pierced light along the souk passage. Batch reed slats, hanging goods and roof silhouettes. Use a bounded set of smoke planes, a moving scooter and foreground musicians. Course geometry, materials, images and animation buffers follow the renderer lifetime. Reference credits are in docs/worlds/marrakech/SOURCES.md. The issue-title search returned #2161.

## Mardi Gras, New Orleans (#2159)

The original class assignment at commit a881e993d pairs this world with GCN Training’s Ride to the Beat. A later change (480826a71) moved that class to Miami Neon Nights. Restore its original 25-stage plan for the separate New Orleans race and preserve the existing Miami assignment. Carry the World Ride dusk palette and gentle avenue turns into the Garden District and Canal Street. The costume and vehicle designs are original.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| St. Charles streetcar, 0.08 km | Real 05, 09 and 12. Games 03 and 05. | An olive-green Perley Thomas car runs along the grassy neutral ground under overhead wire and arching live oaks. |
| Garden District mansions, 1.56 km | Real 05, 09 and 12. Games 03 and 04. | Painted porch columns, iron fencing and purple, green and gold bunting line the avenue. Bead strings hang from oak branches. |
| School brass band, 3.18 km | Real 03, 08 and 14. Games 01 and 05. | White plumes and bright sousaphone bells rise behind paired snare drummers. The crowd follows the band from ladders behind barricades. |
| Masked krewe float, 4.74 km | Real 01, 02, 06, 07 and 11. Games 01 and 02. | An original painted jester float with a raised deck rolls between spectators. Masked riders reach out and bright throws fall from the deck. |
| Flambeaux procession, 6.24 km | Real 03, 10, 13 and 14. Games 02 and 05. | Torchlight catches the dancers, metallic costume trim and cups and beads on the asphalt as dusk deepens. |
| Canal Street finish, 7.96 km | Real 01, 04, 13 and 15. Games 01, 03 and 04. | Families fill the iron-lace galleries and the street behind the final float. Warm shop windows and street lamps frame the finish. |

Use Caribana’s bounded parade animation and repeated crowd geometry. Place the St. Charles streetcar on a separate grassy track, with a trolley pole and a shared overhead wire. Keep the band’s instrument silhouettes and float deck moving independently, linked to race time. Bake iron gallery shadows and small throws along the kerb. Release course-owned textures, geometry and materials on exit. Reference credits are in docs/worlds/mardigras/SOURCES.md.

## Mauna Kea (#2162)

The original 60 Minutes of Brutal Power intervals set the distance of each stage. Place the Onizuka visitor stop at 2,800 m and the summit at 4,207 m. Use a distance-dependent background grade plus the resistance deviation within each section, preserving both landmarks' elevations. Preserve the 4WD gravel transition and the return to black tarmac near the observatories.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Saddle Road lava fields, 0.08 km | Real 06–07 and 11. Games 01 and 04. | Black lava hummocks and pale grass border the yellow-lined tarmac. Mauna Loa forms a broad, low shoulder behind the saddle. |
| Māmane woodland, 4.42 km | Real 04–07. Games 04–05. | Twisted māmane trunks and sparse grey-green crowns give way to an increasingly open hillside. Cloud drifts across the lower switchbacks. |
| Onizuka visitor station, 8.98 km | Real 04–05. Games 01 and 03. | A stone visitor building, silversword rosettes, cones and a four-wheel-drive sign mark the transition to the unpaved climbing road at 2,800 m. |
| Cinder switchbacks, 14.74 km | Real 03, 09, 13–14. Games 02–03 and 05. | The gravel road cuts into bare red and ochre cones. A service vehicle climbs the next bend, with the low cloud deck visible beyond it. |
| Observatory ridge, 21.96 km | Real 01–02, 08–11. Games 01–03. | Two Keck domes, Subaru’s cylindrical enclosure and Gemini’s silver segmented dome stand on the ridge. Dark access shutters and platforms interrupt the pale metal shells. |
| Summit at sunset, 25.24 km | Real 09–15. Games 01 and 03. | The high paved road passes a summit altitude marker. Orange light crosses the domes and catches the cloud tops below the ridge. |

Keep the observatories at fixed ridge positions like Caribana’s CN Tower. Use stepped volcanic material bands, baked underside shade and a layered cloud horizon. Separate moving enclosures from their fixed telescope buildings. The vehicle, enclosure and cloud drift use race time, and their geometry and materials belong to the course renderer. The photographic and game credits are in docs/worlds/maunakea/SOURCES.md. The issue-title search returned #2162.

## La Mercè, Barcelona (#2163)

The legacy renderer already supplies a violet dusk and a rideable street. The catalogue lacks a native La Mercè race. Restore the original class intervals through the maps API, use the same physical course distance in the HUD and renderer, and lazy-load the native mesh and festival materials on race entry. Preserve the warm violet sky over the stone avenue.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Via Laietana, 0.08 km | Real 01, 05–07. Games 01 and 03. | Rows of five- to seven-storey stone office blocks frame the broad striped avenue. Low sodium pools, striped senyeres and spectators at the barriers guide the riding line. |
| Gegants and capgrossos, 2.24 km | Real 09–12. Games 01 and 04. | A giant in a red barretina and a tall skirted partner turn above their handlers. The big-headed dancers weave below them at the edge of the avenue. |
| Correfoc, 4.58 km | Real 02–04 and 14–15. Games 02 and 05. | Hooded devils flank a blue horned fire beast. Airborne sparks arc through street smoke, lighting the paving and the faces behind the barriers. |
| Plaça Sant Jaume, 6.76 km | Real 08–09. Games 01 and 04. | The castellers form a broad pinya under narrowing rows of red shirts, white trousers and dark waist sashes. The Ajuntament and Palau de la Generalitat face each other across the plaza. |
| Cathedral and Gothic Quarter, 9.32 km | Real 06–07 and 13. Games 02–03. | Narrow limestone lanes open onto the Cathedral’s pointed windows and central spire. Warm light grazes projecting stonework and balconies. |
| Piromusical finale, 12.26 km | Real 02, 05 and 14–15. Games 03 and 05. | Coloured projection light washes across the avenue façades. Fireworks break above the distant Montjuïc ridge behind lit festival bunting. |

Keep the Cathedral, civic buildings and the Montjuïc ridge fixed in course coordinates. Batch the barriers, spectators and balconies into visibility sections. Paint recess shade, joints and worn gutters into the local stone and tarmac. Vary seated children, raised phones, clothing and flag placement along the barriers. Animate the giants and bounded pools of sparks and fireworks on race time. The renderer owns and releases the textures, materials, geometry and buffers. Measure the moving rider after assets load on both stretches recorded above. Credits are in docs/worlds/merce/SOURCES.md. A GitHub title search for La Mercè returned #2163.

## Miami Neon Nights (#2164)

The existing class already rides a wet boulevard, with Atlantic surf on the left, neon hotels on the right and traffic at the kerb. Its repeated street uses invented hotel names. Keep the orientation and Ride to the Beat’s original intervals. Give the race six fixed landmarks through the maps API, native course assets and a route-scoped renderer. Commit 480826a71 records the class assignment. The original class entry and music stay available.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Colony Hotel and Ocean Drive, 0.08 km | Real 01–03 and 06. Games 02–03. | A blue vertical Colony blade rises between two curved neon eyebrows. Pink and cyan pools break over wet asphalt while the Atlantic opens beyond the palms on the other side. |
| Carlyle sidewalk cafés, 1.44 km | Real 04–05, 09–11 and 14. Games 02–03. | Rounded Carlyle corner glazing and horizontal eyebrows overlook umbrella tables, diners and a couple strolling past raised café terraces. |
| Ocean Drive cruisers, 2.88 km | Real 06–08, 11 and 15. Games 02 and 04. | An open convertible passes parked two-tone classics. Red tail lamps and alternating blade signs leave broken streaks in the road. |
| Lummus Park beach, 4.36 km | Real 01, 06 and 13–14. Games 01 and 05. | A raised pastel lifeguard tower, its ladder and wraparound deck stand between coconut palms. White foam catches the moon beyond the sand. |
| Breakwater neon frontage, 6.04 km | Real 01–05, 07–08 and 10. Games 02–03. | The stepped Breakwater crown and vertical sign alternate with blue and pink window bands. A little steam crosses the kerb near the busiest café. |
| Brickell across the bay, 8.06 km | Real 07–08 and 12. Games 01, 03 and 05. | The boulevard opens toward illuminated Brickell and downtown tower silhouettes. Royal palms and streetlight halos frame the rider against the bay. |

Use the Colony’s central blade, Breakwater’s steps and the Carlyle’s curved corner as the foreground equivalents of Caribana’s recognisable skyline. Put separate rows of umbrellas, palm trunks, beach furniture and surf between the rider and the horizon. Tie the wet streaks to their hotel signs and break them up with asphalt grain. Batch static detail into roadside sections, with fixed buildings and bounded moving car, surf and steam geometry. Release all owned geometry, materials and textures on leaving. Measure the submitted frames through Colony and Breakwater after warm-up. Credits are in docs/worlds/miami/SOURCES.md. The Miami title search returned #2164.

## Moab Slickrock (#2165)

The legacy scene supplies fierce sunlight and a winding road. The race catalogue lacks the native map and the six fixed views. Assemble a class-length interpretation of the Highway 128 and Arches landscapes. Keep the original Hurt Locker intervals and bend rhythm. Load the course from the maps API through the native world loader at race entry.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Highway 128 river canyon, 0.08 km | Real 01–02, 04–06 and 10. Games 01 and 03. | The double yellow line follows the Colorado River between dark Wingate walls. A gap in the canyon opens onto the snow-dusted La Sal Mountains. |
| Slickrock trailhead, 2.18 km | Real 03, 10–11 and 13. Games 02 and 05. | Two mountain bikers roll over a rounded Navajo sandstone dome off the tarmac. Twisted juniper, sagebrush and dark soil crust mark the trailhead. |
| Balanced Rock and fins, 4.32 km | Real 08–09 and 13. Games 01 and 03. | Balanced Rock’s large rounded cap meets a narrow pedestal beside the layered Organ fins. Recesses stay dark against the orange sunlit walls. |
| The Windows, 6.52 km | Real 03, 13–15. Games 02, 04 and 05. | The North Window opens through a thick sandstone fin, framing a second pinnacle. Pale cross-bedded rock and a dark arch underside reveal its depth. |
| Delicate Arch bowl, 9.24 km | Real 07, 12 and 14. Games 03–04. | A freestanding asymmetrical arch rises from the curved slickrock bowl. Its broad foot and slender opposite leg frame the sky, with the La Sals behind it. |
| La Sal overlook, 12.28 km | Real 01, 06–08 and 10–12. Games 01, 04 and 05. | The final bends pass low sage and glowing red-orange benches. Snow on distant La Sal summits catches the remaining light beyond the desert. |

Anchor the rock formations in course coordinates and the La Sal skyline in the distance. Give each arch genuine open space under its lintel and asymmetric supports. Separate the bedding and vertical joints in Wingate walls from wind-carved Navajo domes. Bake recess shade into the geometry and use bounded trail riders, river ripples and dust on the race clock. Release all scene resources when the rider leaves. Compare the opening and the busiest landmark against Caribana’s submitted-frame benchmark. Commit a3b75bcdf restored all 15 real photographs, five game views and the credits in docs/worlds/moab/SOURCES.md. The Moab title search returned #2165.

## Monaco Street Circuit (#2166)

The class scene already has a race-weekend harbour and grade-aligned paint, as captured in Monaco iteration 061. The race catalogue lacks this class-length native course. Bind the maps API and the normal race entry to the original Non-Stop Sprinting intervals. Keep the course’s 30-degree bend rhythm and construct each road stripe and kerb against the road samples.

| Rider view | Real and game references | What the rider sees on Low |
| --- | --- | --- |
| Port Hercule quay, 0.08 km | Real 01, 07, 09–10. Games 01–03. | Rows of white stern-to superyachts rise behind Armco on the harbour straight. Dark decks, glazing and masts stand out against Mediterranean blue water. |
| Tabac grandstands, 1.62 km | Real 02, 04 and 08. Games 01–02 and 05. | Steep blue seats step up from the catch fencing, filled with fans. Red and white kerbs round the bend and the grey barriers follow the grade. |
| Casino Square, 3.22 km | Real 10–11, 14–15. Games 02–03. | The casino’s symmetrical towers, clock and copper-green roofline rise over palms and the fountain garden. Pastel balconies climb the hill behind them. |
| Fairmont tunnel, 4.86 km | Real 12 and 14. Games 02 and 04. | Strip lighting picks out the curving tunnel roof, panel joints and sponsor boards. A bright exit reveals the sea beyond the dark racing line. |
| Race-weekend pit lane, 6.54 km | Real 01–06 and 13. Games 01, 02 and 05. | An amber-lit safety car approaches a marshal post beside the pit garages. Road paint and pit markings stay flush to the grade. |
| Monaco-Ville and the Palace, 9.32 km | Real 07, 09–10 and 15. Games 03–05. | The final waterfront bends open a sightline to the Prince’s Palace on the rock. Stern terraces and palm crowns frame the pastel town across the harbour. |

Keep the rock, the pastel hillside and the casino fixed beyond the close racing line. Give the yachts stepped deckhouses, transoms and masts, and give the tunnel true interior space and a visible exit. Use sectioned Armco, batched seating, baked shadow and bounded ride-clock motion for the waterline, fountain and safety car. Release the course resources when the rider leaves. Use the submitted frames at the opening and the pits for the Caribana performance comparison. Credits are in docs/worlds/monaco/SOURCES.md. The Monaco title search returned #2166.

## Montmartre (#2167)

Rider feedback in #917 asks that the existing golden-afternoon look and feel be kept. Iteration 026 corrected paint that sank below the cobbles on steep ramps. The class already has café terraces, easels and domes. Give the race catalogue the same class-length route, carry the paint over the actual road triangles, and model the individual corners from their credited photographs.

| Rider view | References | Design |
| --- | --- | --- |
| Le Consulat corner, 0.08 km | Real 01–02, 08. Games 02–03. | Red café awnings follow the narrow wedge of Le Consulat. Bistro tables, woven chairs and green lamps frame a glimpse of the domes above the cobbles. |
| La Maison Rose, 1.58 km | Real 03–04, 09–10, 13. Games 03 and 05. | Pink stucco, deep green shutters and the sloping rue de l’Abreuvoir identify La Maison Rose. A stone gutter and short bollards turn with the lane. |
| Clos Montmartre and Au Lapin Agile, 2.91 km | Real 05, 09–10, 12. Games 03 and 05. | Terraced vines and ivy rise above the garden wall opposite the cabaret’s green paling and ochre sign. Golden light catches the upper leaves. |
| Place du Tertre, 4.38 km | Real 07–08, 14. Games 01 and 03. | Painters lift their brushes beside tilted canvases and parasols. Red and green terrace awnings lead back into the lane beyond the square. |
| Rue Foyatier, 6.02 km | Real 03, 10–11, 15. Games 02 and 05. | Stone steps and twin iron rails climb beside the steep street. WATTZUP and VAS-Y follow the pavés, with a Wallace fountain and a green Métro entrance at street level. |
| Sacré-Cœur, 7.91 km | Real 01, 06 and 15. Games 01–02 and 04. | The tall central dome and smaller white domes of Sacré-Cœur rise beyond the rooftops. The nearest stone courses and cornices stay warm in the low sun. |

Keep the basilica fixed on the hill with layered drums, domes and lanterns. Model the steps and iron rails against the road grade, and batch granite gutters, vine rows and garden walls in visible sections. Share café furniture and painter geometry. Advance the painters’ brushes, terrace movement and Wallace fountain on the bounded ride clock. Release loaded materials and actor geometry on exit. Compare the lower lanes and the painters’ square to Caribana’s submitted frames. Photo and game credits are in docs/worlds/montmartre/SOURCES.md.

## Montreal Jazz Fest (#2168)

Preserve the festival look praised in #909 and recorded in iteration 001. The class scene already has summer dusk, saxophone banners, festoons and live stages. Its opening capture records a dark street, uniform lit windows and thin rows of people. Keep the street legible, break up lit windows by floor and build pockets of varied spectators around the stage. Expose the original class through the race catalogue.

| Rider view | References | Design |
| --- | --- | --- |
| Rue Sainte-Catherine, 0.08 km | Real 01, 08 and 13. Games 01 and 03. | Historic stone shops and glass offices line a closed street. Terrace tables, food stalls and saxophone banners mark the approach to the festival. |
| Place des Festivals main stage, 1.76 km | Real 03–07 and 10. Games 02–03. | A broad black stage roof, truss legs, stacked speakers and coloured spots frame the live band. Spectators fill the front rail in staggered rows. |
| Place des Arts and fountain court, 3.31 km | Real 01, 04, 09 and 15. Games 02 and 04. | Fountain jets rise from the plaza paving. The sloping theatre roof, tall bent white light masts and red lighting dots identify the Quartier des spectacles. |
| Village pink-ball canopy, 4.89 km | Real 02, 08 and 13. Games 03–04. | Pink strands sag across the narrow street. Shop awnings, warm windows and a bike-share dock give the overhead canopy scale. |
| Food kiosks and summer terrasses, 6.77 km | Real 05–06, 11–12 and 14. Games 02–03. | Festivalgoers move between illuminated food stands, café terraces and a blue Métro entrance. A second set plays beyond the crowd. |
| Mount Royal cross street, 9.12 km | Real 01, 04, 08, 12 and 15. Games 01 and 05. | A cross street opens onto wooded Mount Royal and its cross. Glass towers frame the hill as dusk deepens and the festival lights brighten. |

Use the class’s four-degree bends over 300 m, broad plaza openings and restrained gradients. Separate the fixed Mount Royal silhouette from near shop façades, stage steelwork and overhead strings. Animate band gestures, crowd poses and fountain jets on the ride clock. Batch rows of spectators and pink balls, cull street sections and release textures and instances when the rider leaves. Compare the opening and main-stage sections to Caribana’s tablet measurements. Street geometry and light are based on the credited material in docs/worlds/montreal/SOURCES.md.

## Mont Royal (#2169)

The existing class supplies the workout and forty-degree bends, while the shared street scene provides its surroundings. The race needs an autumn park, identifiable lake and summit, and depth between the terrace and downtown. Fit the existing work and recovery stages to repeated efforts on the mountain rather than stretching a single summit to the full workout length.

| Rider view | References | Design |
| --- | --- | --- |
| Voie Camillien-Houde, 0.08 km | Real 01–05 and 07. Games 02–03. | Club cyclists climb in pairs inside the painted bike lane. Québec park markers and maple crowns frame the road. |
| Camillien-Houde hairpin, 4.42 km | Real 01–04, 06 and 09. Games 01–03. | The sweeping turn cuts through exposed grey stone. Guardrail sections wrap around the outside of the turn and the bike lane holds its width. |
| Olmsted Road, 8.19 km | Real 04, 06, 08–09 and 14. Games 01 and 04. | Runners use a gravel carriage path beside golden birches and deep red maples. Trunks and overhanging branches cast broken patches of shade. |
| Lac aux Castors, 13.03 km | Real 06, 09, 13–14. Games 01 and 05. | The trees open onto Beaver Lake, its curved lawn and a low glass pavilion. Reflections shift on the water while the shore stays fixed. |
| Croix du mont Royal, 18.64 km | Real 06, 09, 12 and 14. Games 01 and 04. | The illuminated lattice cross rises through an opening in the upper forest. Steel bracing and horizontal arms remain legible from the saddle. |
| Belvédère Kondiaronk, 24.56 km | Real 10–11 and 15. Games 02 and 05. | Stone balustrades frame the chalet terrace, the towers of downtown Montréal and the distant St. Lawrence and bridges. |

Construct the hairpin, bike-lane edges, rail posts and rock cuts against the road samples. Use distinct maple, oak and birch silhouettes. Leave openings through the trees at the lake, the steel cross and the lookout. Fix the skyline, river and bridge behind the stone terrace. Club riders, park runners and water movement share the ride clock. Section and reuse foliage and rail geometry, keep the distant skyline inexpensive and dispose of all resources on exit. Compare the club climb and the lookout approach to Caribana. Credits are in docs/worlds/montroyal/SOURCES.md. The Mont Royal title search returned #2169.

## Mount Washington Auto Road (#2170)

The class supplies the original workout, 45-degree bends and resistance-driven climbs. Its shared roadside scene lacks a grade-aligned rack railway and the changes in vegetation and exposure that make this ascent identifiable. Fit the physical climb to the class distance, leaving the outer drops open and steepening the final wall.

| Rider view | References | Design |
| --- | --- | --- |
| Auto Road forest gate, 0.08 km | Real 03–04, 07 and 11. Games 01 and 05. | Mile posts and a timber entrance sign frame a narrow patched road. Autumn hardwoods give way to dense spruce up the climb. |
| Gravel shoulder and krummholz, 3.62 km | Real 03–07. Games 01–02 and 05. | Worn asphalt breaks into gravel along an exposed bend. Wind-stunted firs lean beside the unguarded drop. |
| Great Gulf treeline break, 6.37 km | Real 01, 03–04, 08 and 12. Games 02–04. | Low shrubs give way to lichen-covered talus. The Great Gulf falls away beneath the long silhouettes of Adams and Madison. |
| Cog Railway trestle, 8.49 km | Real 08, 11 and 13–14. Games 03 and 05. | The steam locomotive pushes a red passenger coach up an inclined rack railway. The plume drifts across the timber trestle. |
| Cloud bank above treeline, 10.32 km | Real 02, 08–10, 12 and 15. Games 01 and 04. | Wind drives broken cloud over the road. Roadside cairns and rime pick out the edge at the entrance to the fog. |
| Sherman Adams summit, 12.31 km | Real 01–02 and 08–10. Games 02–05. | Spectators ring cowbells at the final steep wall below the visitor centre. The cylindrical observatory tower and low stone Tip-Top House stand above the boulder field. |

Anchor the Presidential Range behind a steep Great Gulf. Keep the road free of guardrails, weather the shoulder, step from deciduous canopies to spruce to krummholz and end with low talus. Align the cog locomotive, coach and trestle to the same inclined track. Shape the Sherman Adams building, instrument tower and Tip-Top House separately. Bound steam, cloud and spectator motion by visibility and drive it with race time. Section static detail and release course resources on exit. Compare the forest and summit to Caribana. Credits are in docs/worlds/mountwashington/SOURCES.md. The title search returned #2170.

## Día de Muertos Parade (#2171)

The class supplies the original plan and a straight, gently rolling boulevard. Its shared scene lacks the landmark and parade. Place a fixed winged Ángel, Reforma’s towers and layered trees behind the moving foreground. Preserve the original four-degree bends over 300 metres, keeping an open racing lane between the floats and the crowd.

| Rider view | References | Design |
| --- | --- | --- |
| Paseo de la Reforma, 0.08 km | Real 01–02, 12 and 14. Games 01–03. | A broad racing lane runs between marigold beds, mature trees, glass towers and lamps. The gilded Ángel glows above the boulevard. |
| Giant catrinas, 1.44 km | Real 04–09. Games 02–03 and 05. | Tall papier-mâché skeleton puppets in vivid dresses sway above the rail. A painted-face crowd gathers beneath the brim of the Catrina’s hat. |
| Monarch dancers, 2.68 km | Real 03–04, 08 and 13. Games 03–04. | Monarch dancers lift their veined orange wings over the marigold median. The road remains open between fans and performers. |
| Ángel de la Independencia, 3.96 km | Real 01–02, 12 and 14. Games 01, 03 and 05. | A winged gold figure crowns the fluted stone column beyond the flower-filled roundabout. Bronze statuary and the lit steps give its base scale. |
| Alebrije float and lowriders, 5.52 km | Real 06–07, 09–11 and 15. Games 02–04. | An illuminated alebrije floats above a rolling platform, followed by a lowrider. Spectators in calavera make-up fill the pavement. |
| Papel picado at night, 7.47 km | Real 02, 05, 10–11, 13 and 15. Games 01–03. | Cut-paper flags arc across the avenue above lamps and warm float lights. Lit towers stand beyond the darker street trees. |

Use the photographs for costume silhouettes, float proportions, boulevard width and night lighting. Keep the marigold beds and stands tied to the terrain. Advance puppet sway, monarch wings and rolling floats from the race clock. Give the papel picado real cut-outs, share flower and crowd geometry, cull street sections and release all loaded art on exit. Compare the opening and alebrije procession to Caribana. Credits are in docs/worlds/muertos/SOURCES.md. The title search returned #2171.

## Mulholland Drive (#2172)

The original class supplies the resistance and cadence intervals and its rolling 35-degree bends over 70 metres. Its shared street scene does not distinguish the basin from the Valley. Build a physical ridge with houses anchored on its slopes, a fixed skyline on the Los Angeles side and a separate low grid backed by mountains on the Valley side.

| Rider view | References | Design |
| --- | --- | --- |
| Ridge road and chaparral, 0.08 km | Real 01–04 and 10. Games 01, 03 and 05. | Double yellow lines turn around a dry chaparral bank, past chevrons, a timber power pole and the first open view of the ridge. |
| Los Angeles basin, 2.63 km | Real 03, 05, 07 and 13. Games 02–04. | A pull-out opens over the folded Hollywood Hills to the distant downtown towers. Sage and a galvanized rail frame the near edge. |
| Modernist hillside houses, 5.19 km | Real 08–10 and 14. Games 02–04. | White modernist volumes, shaded glass and decks on stilts step down the hillside above gated driveways. Eucalyptus and palms stand on the bends. |
| Hollywood Sign on Mount Lee, 8.27 km | Real 01, 06, 12 and 15. Games 01, 03 and 05. | Separate white letters read HOLLYWOOD across the brush-covered flank of Mount Lee. A slender broadcast mast rises above the sign. |
| San Fernando Valley, 12.06 km | Real 03–05, 07 and 11. Games 02–05. | The northern shoulder opens onto the valley’s straight street grid below the foothills. Golden grass gives way to distant blue-grey mountains. |
| Scenic overlook, 16.42 km | Real 05–07, 10 and 12–14. Games 01–04. | Visitors use a viewing scope beside curved rails on a paved turnout. Palms and poles silhouette against sunset haze over Los Angeles. |

Align the yellow lines, driveways, guardrails and viewing platforms with the changing grade. The Hollywood letters stand separately on Mount Lee below the mast. Use low sun, pale haze and distinct oak, palm and eucalyptus silhouettes. Give a passing roadster, an overlook visitor and a small group of wind-blown plants bounded motion on race time. Share roadside meshes, section the terrain and release loaded art on exit. Compare the ridge opening and the scenic overlook to Caribana. Credits are in docs/worlds/mulholland/SOURCES.md. The title search returned #2172.

## Mur de Huy (#2173)

The 26-minute class returns to the climb over successive efforts. Fit each ascent and recovery to the interval profile. At the steep bend put the spectators behind grade-aligned barriers so the rider can see the pitch against the vertical posts.

| Rider view | References | Design |
| --- | --- | --- |
| Lower town, 0.08 km | Real 06, 09 and 10. Games 02 and 05. | Terraces crowd the foot of the climb. Dark wheel tracks and worn white names lead into the lane. |
| Chemin des Chapelles, 2.34 km | Real 01, 04 and 08. Games 01 and 04. | A white roadside oratory sits inside the chicane. Its pointed roof and recessed niche stand clear of the passing riders. |
| Steepest bend, 4.81 km | Real 02–05, 07 and 13. Games 01 and 05. | The 26% pitch tips the painted tarmac upward between steel crowd barriers. Spectators reach over the outside rail. |
| Meuse valley, 6.53 km | Real 14 and 15. Game 03. | The road shoulder opens above the Meuse and Huy rooftops. The fort rises from its rocky bluff beside the river. |
| Wooded slope, 8.80 km | Real 03, 06, 07 and 12. Games 01 and 04. | Leafy branches arch over the riders while damp patches break up the spring light on the lane. |
| Notre-Dame de la Sarte, 10.82 km | Real 01, 04 and 11. Games 02 and 05. | The summit finish arch frames the lane beside the church. Flags and spectators line the approach. |

Keep the citadel fixed above the river and give nearby chapels dimensional roofs, plinths and niches. Repeat the barrier pickets and share crowd geometry. Drive the cyclists, flags and spectators from elapsed race time. Release all course-owned geometry and materials on exit. Reference credits are in docs/worlds/murdehuy/SOURCES.md.

## Napa Vineyards (#2174)

Rider feedback in #915 singles out the existing world’s look and feel. Keep the low rolling Silverado Trail, warm afternoon and sightline to the winery tower, and capture the original ride at each position before changing it. Preserve the existing 18-degree bends over 130 metres and the cadence and resistance of Easy Riding.

| Rider view | References | Design |
| --- | --- | --- |
| Silverado Trail, 0.08 km | Real 01–03 and 06. Games 02 and 04. | A broad paved shoulder follows the yellow centre lines between the first trellises. Long oak shadows cross the tarmac. |
| Mustard between trellises, 1.46 km | Real 04, 05, 09–11. Games 01–03. | Sunlit mustard and orange poppies edge weathered vineyard posts. Parallel vine rows run across the valley floor to the dry hills. |
| Stone winery terrace, 3.12 km | Real 06, 08, 09 and 14. Games 02 and 03. | A gravel turnoff climbs to the fieldstone cellar. Low walls, shaded tables, wine barrels and parasols line its tasting terrace. |
| Oak-shaded gate, 4.63 km | Real 02, 07, 13 and 15. Games 03 and 05. | A carved winery sign hangs between masonry piers. Iron gate leaves open under a spreading live oak. |
| Vaca and Mayacamas ranges, 6.18 km | Real 01, 03, 06, 10 and 12. Games 01 and 04. | A rise reveals both belts of tawny hills behind the vineyards. A convertible follows the bends and another rider pedals along the shoulder. |
| Mission winery, 7.84 km | Real 07, 08 and 15. Games 02 and 05. | A red-tiled arcade meets the white stucco bell tower. The road rises toward its bell opening and the courtyard beyond. |

Build the arcade, bell opening and stone terrace at rider scale. Vary the vineyard row direction and spacing across fields, retain clear driveway openings and use the distant hills to orient riders. Use repeatable geometry for vines, posts and gates. Share moving actors and release loaded images and meshes on exit. Compare the opening and busy winery approach with Caribana. Credits are in docs/worlds/napa/SOURCES.md.

## North Shore, Oahu (#2175)

Rider feedback in #912 asks to preserve the existing look and feel. Compare six matching positions before and after building the course. Retain the 14-degree bends over 180 metres, gentle rolling grades and original class stages along Kamehameha Highway.

| Rider view | References | Design |
| --- | --- | --- |
| Haleiwa town, 0.08 km | Real 02, 04, 05 and 12. Games 02 and 03. | The painted surfer sign stands beside timber shops and a fruit stall. A double yellow line runs past a parked board-laden truck. |
| Anahulu River, 1.33 km | Real 02, 06 and 10. Games 03 and 04. | Rainbow Bridge spans the river between sandy verges. The concrete arches frame the turquoise inlet and wind-bent palms. |
| Waimea Bay, 2.86 km | Real 01, 08, 10, 11 and 14. Games 01 and 02. | The highway bends above a curved bay. White breakers peel past jumping rock, with the church tower tucked into the green hillside. |
| Banzai Pipeline, 4.49 km | Real 08, 09, 11 and 13. Games 01 and 04. | A surfer carries a board toward the beach. Beyond the palms a winter swell curls over a turquoise face and breaks white. |
| Sunset Beach, 6.56 km | Real 03, 06, 14 and 15. Games 02, 04 and 05. | A truss bridge carries the road beside ironwoods. Trade-wind clouds catch golden light offshore and the Koolau ridges remain inland. |
| Kahuku shrimp trucks, 8.49 km | Real 02, 03, 07 and 12. Games 03 and 05. | Shrimp trucks face a gravel pullout. Written signatures surround the serving hatch, customers queue and picnic benches sit in palm shade. |

Keep the crest of Waimea’s swell below the highway and give Pipeline a curling lip that moves sideways along the breaker. Build the food truck serving opening, palms, picnic tables and shoreline rock at rider scale. Compare the opening street and queue with Caribana. Share roadside materials and release all animated geometry on exit. Reference credits are in docs/worlds/northshore/SOURCES.md.

## Notting Hill Carnival (#2176)

Place the London streetscape around the original ten-degree bends over 150 metres. The avenue’s street trees, stucco bays, railings and concrete flyover establish London before the carnival artists and floats enter view. Preserve the complete GCN Quick HIIT Workout.

| Rider view | References | Design |
| --- | --- | --- |
| Ladbroke Grove, 0.08 km | Real 01, 04, 13 and 15. Games 01, 03 and 04. | Plane trees frame a broad curve between London terraces. Kerbside crowds leave an open riding line through the August street party. |
| Feathered mas band, 1.04 km | Real 02, 05–09. Games 02 and 04. | Red and gold plumes turn beside turquoise and magenta wings. Riders pass between the edge of the band and the crowd barriers. |
| Corner sound system, 2.13 km | Real 01–04, 09 and 10. Games 02 and 05. | A stack of bass bins and horns faces Ladbroke Grove from the corner. Caribbean flags hang from the balconies and spectators film from the kerb. |
| Steel pan float, 3.09 km | Real 03, 09–11. Games 02 and 03. | A flatbed carries polished steel pans on racks, players and overhead bunting through pastel terraces. Confetti and powder mark the road below. |
| Westway flyover, 4.37 km | Real 01, 04, 13 and 15. Games 01 and 05. | The broad concrete deck crosses above the road on paired supports. The riders move from August sun into its shade and back out to the procession. |
| Jerk grills and food stalls, 5.61 km | Real 04, 10–12 and 14. Games 01 and 03. | Thin smoke curls up from a split drum grill. Caribbean flags brighten the stall awnings and whistle-blowing spectators stand beside the serving tables. |

Model the open speaker mouths, band headdresses, steel pan bowls and the underside of the flyover. Reuse crowd geometry and animate the nearest performers, float and grill smoke from elapsed race time. Release scene-owned assets on exit. Compare the opening and pan float with Caribana. The reference credits are in docs/worlds/nottinghill/SOURCES.md.

## Avenida 9 de Julio (#2177)

The 18 km class course adapts the avenue to its 24 stages, with the original two-degree bends over 600 metres. Model the avenue in metres so a line of cars, the bus platform and the 67-metre obelisk give three distinct measures of scale.

| Rider view | References | Design |
| --- | --- | --- |
| Avenida 9 de Julio, 0.08 km | Real 01, 03, 05 and 14. Games 01 and 05. | Seven paved lanes fan out beside the central Metrobus corridor. Long dashed lines, billboard crowns and jacarandas frame the sprint. |
| Metrobus station, 3.21 km | Real 02, 04, 08–11 and 15. Games 03 and 05. | A colectivo runs beside the red-roofed platforms. The boarding islands carry shelter columns, handrails, stop names and waiting passengers. |
| Ministry of Health, 6.74 km | Real 04, 12 and 14. Games 01 and 02. | The steel outline of Eva Perón spans the Ministry’s pale window grid. Passing taxis and palms establish its height above the avenue. |
| Teatro Colón, 9.78 km | Real 03, 06 and 13. Games 01 and 02. | The opera house’s pediment, arched windows, pilasters and stone cornices rise above the planted side plaza. Purple jacarandas shade the pavement. |
| Multi-stage crossing, 13.62 km | Real 02, 04, 06, 08–10. Games 03–05. | Long zebra crossings break at the raised median islands. Pedestrians wait by signal posts as taxis, buses and motorbikes stream past. |
| Plaza de la República, 17.53 km | Real 01, 03, 05–07, 11 and 15. Games 01, 02 and 04. | The four-sided Obelisco rises 67 metres over the plaza, tapering toward the pyramidal tip. Evening lights gather along its base and the surrounding avenues. |

Use a four-sided tapered shaft and distinct cap, the opera house’s architectural bays and the Ministry’s steel portrait. The crossing markings and traffic lanes must meet across each island. Give the colectivo, taxis and waiting or walking pedestrians bounded movement on race time. Share roadside materials and release loaded artwork on exit. Compare the opening and dusk plaza with Caribana. Credits are in docs/worlds/nuevedejulio/SOURCES.md.

## Okinawa Coast Road (#2178)

The island course retains the original twenty-degree bends over 120 metres outside the long Kouri Bridge crossing. Give the narrow road low seawalls so the rider can see the shift from white sand through clear lagoon to dark offshore reef.

| Rider view | References | Design |
| --- | --- | --- |
| Route 58, 0.08 km | Real 01, 05, 06 and 15. Games 01 and 03. | An orange centre line curves between the coral seawall and subtropical greenery. A Japanese route shield stands at the edge of the village. |
| Shisa village, 2.76 km | Real 01, 05 and 06. Games 01–03. | A pair of shisa guard the red-tiled house and coral-stone gate. Pandanus and cycads break up the roofline against Yanbaru’s green hills. |
| Kouri Bridge, 5.47 km | Real 02–04, 07 and 14. Games 01 and 04. | The bridge carries the road on a long low deck above clear shallows. Repeated piers and the distant island reveal the full crossing. |
| Mushroom islets, 8.91 km | Real 09, 12 and 13. Games 02 and 05. | Limestone islets with narrow eroded feet stand in pale aqua water. Dark reef patches remain visible in the lagoon around their bases. |
| Coral beach, 11.83 km | Real 08, 11–13 and 15. Games 03–05. | Fine white sand slopes into the lagoon. Parasols and swimmers sit below the road and the water deepens from pale aqua to blue. |
| Cape Manzamo, 16.19 km | Real 05, 09, 10 and 15. Games 02 and 05. | The grass-covered headland ends in a limestone elephant trunk. Deep water and pale foam show through the opening beneath its arch. |

Build the bridge deck, parapet, pier caps and regularly spaced supports in metres. The two eroded limestone landmarks need distinct silhouettes. Keep the opening in Cape Manzamo’s trunk visible to the riding camera. Give the village greenery, swimming figures and cresting foam bounded movement on race time. Compare the village and bridge with Caribana. Credits are in docs/worlds/okinawa/SOURCES.md.

## Oktoberfest, Munich (#2179)

The course follows the original eight-degree bends over 150 metres. Keep enough clear road between the tents for the rider to overtake the procession. The reference folder includes all 15 photographs, five game views and their credits, restored in a3b75bcdf.

| Rider view | References | Design |
| --- | --- | --- |
| Wiesn main street, 0.08 km | Real 01–03 and 08–09. Games 01 and 03. | The wide festival avenue runs between timber beer halls, their painted gables rising above linked crowds in Dirndls and Lederhosen. |
| Brass procession, 1.86 km | Real 04–07. Games 01 and 02. | Rows of musicians carry brass instruments and drums past the Schottenhamel bandstand. Blue-and-white pennants cross overhead. |
| Brewery dray, 3.41 km | Real 04 and 07. Games 02 and 03. | Draught horses pull a decorated brewery wagon past the Paulaner tower. Harness, wheels, casks and greenery move together along the street. |
| Bavaria and Ruhmeshalle, 5.79 km | Real 02, 11 and 14. Games 04 and 05. | Bavaria raises her wreath on the grassy hill beside the lion. The long Doric colonnade stands behind the bronze statue. |
| Gingerbread market, 7.71 km | Real 01, 03, 08 and 09. Games 01 and 03. | Heart-shaped Lebkuchen, pretzels and roasted almonds line the lit stalls. People gather beneath striped awnings as the sky warms. |
| Fairground at night, 10.19 km | Real 02, 10–13 and 15. Games 03 and 05. | Gondolas hang beneath the turning Ferris wheel. The five Olympia Looping rings and carousel canopy stand above the glowing tent roofs. |

Use the painted entry gables, Bavaria’s raised wreath, the Ferris wheel spokes and the five coloured coaster loops as distinct silhouettes. Keep the horse team and dray together on the changing grade. Anchor crowd feet to the street and share stall geometry and band materials. Use the ride clock for each moving landmark and release all course assets on exit. Compare the crowded avenue and evening fairground to Caribana. Credits are in docs/worlds/oktoberfest/SOURCES.md.

## Old Town Criterium (#2180)

Retain the existing elevation samples, stage distances, advertised climb and starter unlock. Redistribute the heading through the townhouse corner over a 20 m arc, with a straight entry and exit. Open the frontage beside the seventh sprint so the west portal is visible across the square. Model the visible faces of the spire, portal and gables in silhouette, match the size of the setts to the bicycle tyres and keep the street furniture outside the riding line. The bannered rails and the three crowd rows overlap at different depths. Keep objects anchored to the local grade.

| Rider view | References | Design |
| --- | --- | --- |
| Steenstraat, 0.08 km | Real 06–09, 11 and 15. Games 01 and 03. | Shuttered townhouses crowd the narrow street. The changing sun picks out the rounded blue-grey setts and their dark joints. |
| Cathedral kick, 2.53 km | Real 01–05 and 13. Games 01–03. | Bannered steel crowd barriers narrow the uphill sprint. Fans three deep cheer beneath the west tower on the skyline. |
| Townhouse turn, 4.31 km | Real 06–09, 11 and 12. Games 01 and 04. | Bollards draw a line around the kerb of the right-angle corner. Closely spaced shutters, gables and overhead pennants turn with the bunch. |
| Café terraces, 6.98 km | Real 01, 02, 10, 12 and 13. Games 02 and 04. | Striped parasols shade café tables, chairs and shopfronts behind the barriers. Warm plaster faces the hard midday shadows. |
| Cathedral square, 10.45 km | Real 01–05, 13 and 14. Games 01 and 05. | Buttresses, pointed windows and a layered west portal resolve below the distant spire as the rider climbs into the square. |
| Finish straight, 14.05 km | Real 01, 03, 05 and 13. Games 02 and 05. | The truss gantry spans the setts beside the lap board. The bell and waving flags stand against sunlight on the cathedral stone. |

Bake the cathedral stone, window tracery, contact shadows and shop fronts. Share the spectator atlas and street furniture. Give each bounded group of moving supporters a deterministic phase. Use the existing race clock for the bell and pennants. Compare both tablet captures against the submitted-frame and draw-call evidence for Caribana. Original references and licences are in docs/worlds/oldtown/SOURCES.md.

## Oregon Coast (#2181)

Condense the north-to-south Highway 101 landmarks into the historical FTP Builder stages. Keep the ocean on the west side and spruce on the inland slope. Shape the two lighthouse sites separately. Render the tidal channel under the steel bridge and the opening in the Boardman arch from the rider’s side of the guardrail.

| Rider view | References | Design |
| --- | --- | --- |
| Highway 101, 0.08 km | Real 01–05 and 13. Games 01 and 03. | A rain-darkened two-lane highway curves between wind-shaped Sitka spruce, a silver guardrail and weathered shingle buildings. |
| Cannon Beach, 3.18 km | Real 06, 07, 13 and 14. Games 01 and 05. | The broad basalt base and blunt, sloping crown of Haystack Rock rise above the Needles. Bleached logs lie across the grey beach. |
| Yaquina Head, 6.83 km | Real 05, 11 and 15. Games 01 and 04. | The tall white tower and dark lantern stand clear of a low spruce headland. A brown pullout sign and low coastal fog sit nearer the road. |
| Yaquina Bay Bridge, 9.96 km | Real 03, 10 and 11. Games 02 and 04. | Green through-arch ribs, diagonal trusses and slender vertical hangers frame the rider above a tidal channel. |
| Heceta Head, 14.34 km | Real 08, 09, 12 and 15. Games 03 and 04. | A short white lighthouse and red-roofed service buildings overlook surf that wraps around the steep wooded point. |
| Boardman headlands, 18.86 km | Real 02, 05, 12–14. Games 01, 03 and 05. | Water shows through a dark basalt arch. White breakers curl in front of it and wind-shaped spruce bracket the distant stacks. |

Use merged native meshes for the rock, truss, roadway and keeper buildings. Vary the silhouette and spacing of spruce clumps. Place beach logs, pale breakers and distant headlands at different depths. Sample wind, beacon and breaker movement from the ride clock. Compare the submitted frames on the forest and lighthouse stretches to Caribana. Credits are in docs/worlds/oregon/SOURCES.md.

## Outback Highway (#2182)

Condense the Lasseter Highway into the historical Running on Empty stages. Use the driving side of the Australian highway for the rider and keep the road train in the opposite lane. Use separate silhouettes and distances for the long flat table of Mount Conner, rounded Kata Tjuta domes and the grooved west face of Uluru.

| Rider view | References | Design |
| --- | --- | --- |
| Erldunda turnoff, 0.08 km | Real 01, 06–08 and 15. Games 02 and 03. | Green direction boards lead onto straight bitumen. White edge lines separate the riding surface from red wheel ruts and golden spinifex. |
| Road train, 1.71 km | Real 01, 05 and 15. Games 02, 03 and 05. | A long-bonneted prime mover and three articulated trailers pass in the opposing lane. Dust trails off the outer wheels and the apparent wind shifts as the vehicle passes. |
| Curtin Springs, 3.62 km | Real 07, 08, 11 and 14. Games 02 and 03. | Fuel bowsers stand on a red-sand apron below the corrugated roadhouse veranda. The next-fuel sign, desert oaks and timber fencing stand apart from its frontage. |
| Mount Conner lookout, 5.41 km | Real 06, 10, 13 and 14. Games 02 and 05. | The distant mesa has a long level summit and sloping shoulders. A wedge-tailed eagle circles above roadside scrub and the yellow wildlife-warning signs. |
| Kata Tjuta, 7.88 km | Real 03, 04, 09 and 15. Games 02–04. | A cluster of rounded rock domes rises beyond the desert oaks. Sunset begins to catch the shoulders of the domes. |
| Uluru at dusk, 10.21 km | Real 02, 09 and 12. Games 01, 03 and 04. | Uluru rises as a broad single monolith, warm orange-red across a dark spinifex plain. Erosion channels mark its face under a pink and purple sky. |

Grade the red verge down from the seal and stretch the wheel ruts along the road. Build the three trailers, couplings and wheels at their own physical lengths. Dust and eagle flight follow the ride clock. Use a bounded set of native scrub clusters and warm the rock faces as the sky cools near the finish. Compare the busiest passing sequence with the Caribana tablet evidence. Credits are in docs/worlds/outback/SOURCES.md.

## Overseas Highway (#2183)

Fit the Florida Keys crossing to the original Time to Spin Out stages. Keep both bridge decks above open water with the old railway on the Gulf side. Deck joints, piers and the Pigeon Key ramp follow the same physical alignment. The single navigation hump rises above an otherwise low time-trial course.

| Rider view | References | Design |
| --- | --- | --- |
| Marathon approach, 0.08 km | Real 01, 02 and 15. Games 02–03. | A green US 1 sign and mile marker stand beside white edge stripes. Mangroves and wind-bent palms part around the entrance to the bridge. |
| Old railway viaduct, 1.51 km | Real 03, 08, 10 and 11. Games 01 and 04. | Repeated masonry arches carry the historic bridge alongside the modern concrete deck. Their openings frame strips of shallow blue-green water. |
| Pigeon Key, 2.87 km | Real 05–07, 09 and 13. Games 02–04. | Yellow-and-white cottages, palm crowns, the old access ramp and a small timber dock distinguish Pigeon Key from the distant mangrove islands. |
| Navigation channel, 4.42 km | Real 01–06 and 08. Games 01 and 04. | The only sustained climb lifts the rider above the flats. A fishing boat crosses the deep-water channel below the crest. |
| Missing railway span, 6.31 km | Real 04, 08, 10–12 and 14. Games 01, 04 and 05. | Open water separates the ends of the abandoned span. Pelicans and gulls skim the chop beside the surviving piers. |
| Lower Keys landfall, 8.02 km | Real 02, 05, 09, 13–15. Games 02, 03 and 05. | A low key and leaning palms rise ahead of the rails. Sunlit cumulus, dark seagrass patches and white wind chop extend to the horizon. |

Distinguish the old concrete arches from the modern girder deck, and leave the missing span physically open. Use the water depth bands, near rails, island porches and fixed cloud towers for parallax. Animate the fishing launch and birds on the ride clock. Compare opening and Pigeon Key tablet frame submissions with Caribana. Credits are in docs/worlds/overseas/SOURCES.md.

## Torres del Paine (#2184)

Map Select and Race Setup load the original GCN class and its local authored course. Centreline elevations drive the rider and HUD. The Cuernos have a dark sedimentary cap above pale granite, while the slender Torres form a separate skyline farther along the course. Both occupy fixed coordinates. Bake shade into the rocky shore and use the lightest sky values for the snowfields.

| Rider view | References | Design |
| --- | --- | --- |
| Pehoé gravel, 0.08 km | Real 01–02 and 11. Games 02 and 04. | Two wheel ruts and pale loose stone frame wind-bent tussocks on the golden steppe. Low shrubs and a layered lenticular cloud show the direction of the wind. |
| Cuernos shore, 2.24 km | Real 03–05, 10 and 14. Games 01 and 03. | Across a blue-green bay, almost black Cuernos caps top lighter granite buttresses. Glacier ice and windblown snow collect in the cleft. |
| Guanaco grazing ground, 4.57 km | Real 06, 09 and 12. Games 01–02. | Several tawny guanacos graze beside the gravel, one upright with alert ears. Their slender legs and cream undersides stand out above the bent grass. |
| Salto Grande, 7.22 km | Real 07–08 and 15. Games 03–04. | A rocky lip carries turquoise upper water over a broken white curtain into the lower lake. Spray crosses the lip while the road follows the bank. |
| Torres overlook, 9.82 km | Real 04, 11 and 13–14. Games 03 and 05. | Three steep granite towers stand separately above moraine benches. A hanging glacier and snow apron occupy the shaded basin beneath them. |
| Lake Pehoé return, 12.54 km | Real 03, 05, 07, 10 and 15. Games 04–05. | Whitecaps cross turquoise Pehoé in streaks under layered cloud. The long slant of the tussocks and the dark foothill cast shadows across the gravel. |

Merge the gravel, wheel ruts and tussocks into local sections. Keep both lake levels tied to the waterfall lip and banks. Animate the near guanacos, wind and spray from ride time. Dispose of shared geometry, textures and water materials on exit. Use the Caribana submitted-frame measurement in the opening and at Salto Grande. See ADRs 0021, 0023, 0030, 0034 and 0035, the performance-budget design and docs/worlds/paine/SOURCES.md.

## The Palouse (#2185)

Map Select and Race Setup load the historical class into the authored-course renderer. The sampled centreline supplies the elevation for the road, rider and HUD. Carry the crops across every fold of the terrain. The butte stays fixed and rises above the lower fields as the elevation and viewing angle change. All 15 real photos, five game views and accompanying credits are present in docs/worlds/palouse.

| Rider view | References | Design |
| --- | --- | --- |
| Wheat-hill road, 0.08 km | Real 01, 07 and 13. Games 02 and 04. | A narrow striped country road crests between fresh barley and ripe wheat. The next two folds overlap against a broad afternoon sky. |
| Red barn hollow, 2.76 km | Real 02, 05 and 10. Games 01 and 04. | A red gambrel barn with white doors sits below the road with a farm silo, gravel apron and a line of tall poplars. |
| Harvest turn, 5.48 km | Real 03, 09 and 12. Games 01–03. | The gravel section runs beside a weathered hillside combine with a cutting reel. An old grain truck waits at the edge of the stubble. |
| Colfax grain siding, 8.25 km | Real 02, 07, 12 and 13. Games 03 and 04. | White grain elevators tower over the low country buildings. A rail siding, loading spout and grain hoppers distinguish the elevator from the farm silo. |
| Steptoe Butte, 12.32 km | Real 01, 06 and 15. Games 02 and 05. | A single steep rounded butte rises above the softer loess ridges. The road skirts its base between contour-ploughed fields. |
| Golden-hour overlook, 17.62 km | Real 03–04, 06, 11 and 14. Games 01, 03 and 05. | The last crest reveals green lentils, yellow barley and brown stubble in curved strips across the folds. Sunlit shoulders alternate with long blue-brown shadows. |

Give farmstead and railroad buildings separate silhouettes. Alternate crop colours across broad plots and run the finer harvest lines along their contours. Bake relief and long field shadows into vertex colours. Use the ride clock for near-field wheat, the reel and grain hoppers. Bound the active actors by distance and release their shared geometry and textures on exit. Compare submitted frames at the opening and grain siding with Caribana. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/palouse/SOURCES.md.

## San Fermín, Pamplona (#2186)

Map Select and Race Setup bind the original class to the local authored-course renderer. Extend the real encierro sequence to the workout distance. Rebuild Mercaderes as an actual right-angle turn, widen Plaza Consistorial and align the final tunnel with the road. Keep the crowds behind the double barriers and the racing lane open.

| Rider view | References | Design |
| --- | --- | --- |
| Santo Domingo approach, 0.08 km | Real 01, 07–08 and 10. Games 01 and 02. | Double rows of timber barricades enclose the first sprint. Red pañuelos stand out against white shirts behind the rails. A medic and police officer occupy a fence opening. |
| Plaza Consistorial, 1.54 km | Real 05–06 and 09–10. Games 04 and 05. | The narrow approach opens onto the baroque Ayuntamiento. A layered stone pediment, balconies and hanging flags stand above the crowd. |
| Mercaderes turn, 3.16 km | Real 03–04, 07 and 15. Games 02–03. | The marked right-angle turn into Calle Estafeta follows the wall and its two street plaques. Timber barriers protect the outside of the corner. |
| Calle Estafeta, 5.02 km | Real 02–04, 08 and 09. Games 01 and 03. | Four- and five-storey houses close around the wet stone street. Their iron balconies are packed with spectators and red scarves, with warm light reaching only the upper floors. |
| Telefónica barriers, 7.17 km | Real 01, 07–08 and 12. Games 01 and 04. | Sashed runners pass waving spectators at the double fence. Damp setts and scattered fiesta confetti lead toward the bullring. |
| Callejón entrance, 8.92 km | Real 10–11 and 14. Games 02 and 05. | The open entrance tunnel disappears beneath the brick and stone bullring. A glimpse of the ochre arena and the rings of red-and-white spectators draws the rider forward. |

Model the urban canyon, cross-street openings, balconies, town hall and the bullring portal in three dimensions. Bake the contrast between blue street shade and sunlit cornices into the building materials. Render the repeated crowds and timber sections in bounded sections. Update runner, hanging scarf and light confetti from ride time, and dispose of their textures, geometries and materials with the route. Compare the opening and packed street with Caribana. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/pamplona/SOURCES.md.

## Ffordd Pen Llech (#2187)

Keep the famous street short within the longer historical class. Approach across Morfa Harlech and the town, put the measured steep metres and tight hairpin inside the sustained work stage, then finish above the bay. Share the centreline between rider pitch, road, grade and HUD. Keep houses vertical and step their foundations so their sills make the slope legible.

| Rider view | References | Design |
| --- | --- | --- |
| Morfa Harlech approach, 0.08 km | Real 11–15. Games 01 and 04. | The coastal plain leads toward the castle on its rock. A break in the rain lights the dunes while cloud stays on the mountain ridge. |
| Stryd Fawr terraces, 3.42 km | Real 04–10. Games 02 and 05. | Slate-roofed stone terraces, narrow shopfronts, chimneys and bilingual street furniture mark the transition from the plain into Harlech. |
| Ffordd Pen Llech foot, 10.86 km | Real 01–03 and 05–06. Games 02–03. | A Welsh street-name plate and steep-gradient warning guard a narrow wet lane. Mossy walls leave only a single track with no pavement. |
| The steepest metres, 11.12 km | Real 01–04. Games 02–03 and 05. | The 37.45% section pitches the rider upward between level cottage sills and stepped walls. Locals wave from doorways and the wall top. |
| Upper left hairpin, 11.20 km | Real 01–04, 07 and 15. Games 02–03. | A tight left-hand bend interrupts the wall. The blockwork and standing spectators stay vertical while the road changes direction on the grade. |
| Castle and bay overlook, 13.68 km | Real 11–15. Games 01, 04 and 05. | Round towers and curtain walls rise out of the castle rock. Beyond them the coastal fields, Morfa dunes, Tremadog Bay and the mountains recede under broken grey cloud. |

Model the castle gatehouse and towers on a fixed rock and shade the far mountains independently of rain over the lane. Use damp asphalt, mossy drystone and slate throughout the upper streets. Limit drizzle particles and animate the near spectator and flag on ride time. Dispose of those assets on exit. Compare the opening and the sustained climb with Caribana. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/penllech/SOURCES.md.

## Pike Place at Dawn (#2188)

Map Select and Race Setup load the historical workout into the local authored-course renderer. Extend the market street and waterfront approach to the workout distance. The clock, steel sign frame, low stall roofs, downhill sightline and ferries give the rider distinct near, middle and distant landmarks. Retain the actual market sign wording and model its steel supports.

| Rider view | References | Design |
| --- | --- | --- |
| Public Market Center clock, 0.08 km | Real 01, 04, 06–08 and 12. Games 01 and 03. | The red Public Market Center letters and round clock rise on a steel frame above the brick intersection. A crosswalk, parked delivery truck and morning shoppers establish scale. |
| Fish counter, 1.79 km | Real 02, 09 and 13. Games 02 and 04. | Warm pendant lamps light silver salmon on crushed ice, crab and handwritten price cards. A vendor tosses a salmon above the counter. |
| Farmers Market arcade, 3.38 km | Real 01, 05, 07–08 and 15. Games 01 and 03. | Green columns and a striped awning frame produce pyramids and bouquets. Meet the Producer lettering runs above the stalls opposite the Corner Market. |
| Post Alley entrance, 5.22 km | Real 03, 08 and 14. Games 02, 04 and 05. | A narrow brick side lane recedes under the Post Alley sign. Dawn catches steam above the café and vent at the opening. |
| Elliott Bay descent, 7.69 km | Real 03, 10–12. Games 01 and 05. | The downhill street opens onto a white-and-green ferry crossing Elliott Bay. The Great Wheel, piers and Olympic skyline stand beyond the lower market roofs. |
| Downtown dawn, 10.13 km | Real 03, 05 and 10–12. Games 03–05. | An open view frames downtown glass towers, the Space Needle and warm reflections on Elliott Bay. Brick paving and a final arc of market spectators bring the route home. |

Use brick courses and crosswalk paint aligned with the physical road. Open the Post Alley gap between brick buildings. The Seattle skyline, wheel and Olympic ridgeline are fixed in world space, while a bounded fish toss, coffee steam and ferry read the shared ride clock. Merge repeated stalls and curb detail by section. Release textures, geometry and materials on exit. Compare the submitted frames at the clock and the produce arcade with Caribana. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/pikeplace/SOURCES.md.

## Playground Park Loop (#2189)

Five circuits share the same park furniture and terrain. Distance and elapsed time continue across the painted lap line. The route curves round a central pond. Keep the play structures and the water visible through openings in the mature tree canopy.

| Rider view | References | Design |
| --- | --- | --- |
| Tree-lined park gate, 0.08 km | Real 11, 12 and 15. Games 01 and 03. | Worn twin yellow lines lead between mature trees. Gaps in the canopy cast patches of sun across the path beside a wayfinding sign and benches. |
| Climbing fort, 0.43 km | Real 02, 03, 07 and 09. Games 01 and 02. | Two roofed climbing decks flank a rope bridge. Open steps, a curved slide and a bank of suspended swing seats are visible from the path. |
| Splash terrace, 0.89 km | Real 01, 03–06 and 13. Games 02 and 05. | Red and green spray stems stand on blue and ochre wet paving under a triangular shade sail. A child runs between staggered jets. |
| Family promenade, 1.32 km | Real 08–12 and 15. Games 01 and 03. | A parent pushes a hooded stroller along the wide shoulder. A helmeted child on a scooter passes a bench and a double-headed park lamp. |
| Fountain pond, 1.85 km | Real 04, 06 and 14. Games 04 and 05. | A stone lip follows the pond and its central fountain. Water gleams between reeds, with lawns and the city edge behind. |
| Picnic meadow, 2.30 km | Real 07, 10, 11 and 13. Games 02–04. | Families sit on checkered blankets beneath spreading shade trees. A pavilion and distant apartment buildings mark the return toward the playground. |

Model the climbing frames, slides, swings, benches and shaded canopy at rider scale. Use fixed meshes for path paint and shadows, batch repeated furniture, and use the shared ride clock for the swing angle, spray and stroller wheels. Release each course resource on exit. Compare the gate and splash terrace with Caribana’s tablet capture. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035 and docs/worlds/playground/SOURCES.md.

## Prague Old Town (#2191)

The Royal Way follows an extended sequence of central Prague streets for the historical class. The tower gate opens into medieval streets and squares. Charles Bridge spans the Vltava before the climbing streets reach Hradčany.

| Rider view | References | Design |
| --- | --- | --- |
| Powder Tower gateway, 0.08 km | Real 02, 03 and 13. Games 01 and 02. | The granite-sett road enters a pointed Gothic gateway beneath a steep dark roof and corner pinnacles. Pale stucco and mosaic pavements frame the portal. |
| Old Town Square, 3.64 km | Real 04–08, 13 and 14. Games 02 and 03. | The lane opens onto the square. The two many-spired towers of Týn Church rise behind the arcades, the Jan Hus monument anchors the square and soap bubbles drift past sightseers. |
| Astronomical Clock, 6.12 km | Real 04, 06, 13 and 14. Games 01 and 03. | The gold astrolabe and painted calendar dial read as two distinct faces on the Old Town Hall wall. The Gothic chapel window and copper roof rise above a knot of visitors. |
| Charles Bridge, 10.84 km | Real 01, 03, 09–11 and 15. Games 02 and 04. | The bridge crosses the Vltava on stone arches. Paired rows of Baroque figures on plinths frame the Gothic bridge tower. A passenger boat passes a low weir and swans swim beside the bridge. |
| Nerudova climb, 16.48 km | Real 02, 10, 14 and 15. Games 01, 03 and 05. | The road pitches uphill between tight pastel rows. Painted house signs stand over door portals, while a break in the roofline opens onto Malá Strana. |
| Hradčany overlook, 21.18 km | Real 09–12, 14 and 15. Games 02, 04 and 05. | The St Vitus spires and a long palace wing stand above a terrace. Red tile roofs, a verdigris dome and the river remain visible below the final ramp. |

Use a fan-shaped granite sett pattern scaled to the lane and a finer mosaic on each pavement. Keep open arches under the deck, stone plinths between pedestrians and the parapet, and let the rider see the river on both sides. The cathedral is a fixed group of spires and nave, with palace wings and smaller roof rows below. Use ride time for the excursion boat, swan and drifting bubbles. Reuse materials and release all resources on leaving the course. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035 and docs/worlds/prague/SOURCES.md.

## The Poggio (#2190)

Along the opening Aurelia the Ligurian Sea is on the rider’s left. Climb away from it through glasshouses on terraces, crest beside the church, then lose the elevation on a physically winding descent toward the Via Roma straight.

| Rider view | References | Design |
| --- | --- | --- |
| SS1 Aurelia, 0.08 km | Real 03, 04, 08, 10 and 15. Games 02 and 05. | The coast road runs between green-shuttered Riviera houses and a stone seawall. Canary palms and a palm-shadowed zebra crossing break up the seafront. |
| Capo headlands, 1.84 km | Real 05–07, 11 and 14. Games 04 and 05. | The capes overlap over the Ligurian Sea. An arched road tunnel pierces the nearest rocky spur, with moving whitewash at its foot. |
| Flower terraces, 4.82 km | Real 01, 02, 06 and 12. Games 01 and 03. | A blue sign points to Poggio on the narrow climbing road. Switchbacks turn between retaining walls, glasshouses and terraces of carnations. |
| Summit church, 7.15 km | Real 02, 09, 12 and 13. Games 01 and 02. | Pastel walls frame the church front, campanile and clock. Tifosi lean over temporary rails and wave Italian flags at the summit. |
| Walled descent, 8.38 km | Real 01, 05, 11, 12 and 14. Games 03 and 05. | A tight descending bend passes a rough stone wall. Behind the outside rail three coastal ridges fall away toward the water. |
| Via Roma sprint, 11.41 km | Real 03, 08–10 and 15. Games 02–04. | The final straight narrows between barriers and shuttered shops. Dense spectators and flags line the finish gantry, with painted finish markings under the arch. |

Keep the headlands fixed in world space and show gaps between ridges. Break up the glasshouse roofs with repeated ribs and rows of flowers. Use a local mesh for the campanile and individual rows of shops on Via Roma. Animate whitewash, a summit tricolore and finish pennants on the ride clock. Share materials and release the course resources on exit. Compare both sampling locations with Caribana. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/poggio/SOURCES.md.

## Prospect Park (#2193)

Use two laps of the same 6.2 km park drive. One hill rises toward the plaza each lap, with the lake and Lullwater at the low end of the loop. The individual workout stages keep the historical class timing across the lap line. Reuse the autumn scene’s lane paint, runners, green benches and cast-iron lamps as visual cues.

| Rider view | References | Design |
| --- | --- | --- |
| East Drive beneath the canopy, 0.08 km | Real 01–04 and 12. Games 01 and 04. | Lane markings separate runners from the weekend pace line. Trees cast broken shadows across the asphalt. Iron park lamps mark the curve ahead. |
| Long Meadow, 1.24 km | Real 02, 03, 06 and 12. Games 02 and 03. | The near canopy opens onto a broad lawn. A dog chases a ball past picnic blankets while a runner passes the line of green benches. |
| Grand Army Plaza, 2.86 km | Real 01 and 10. Games 01 and 05. | The arch has one deep opening, paired pillars, bronze reliefs and a crowning quadriga. Brownstone stoops and apartment roofs mark the Brooklyn edge. |
| Weekend market, 4.06 km | Real 01, 13 and 14. Games 03 and 05. | People queue between rows of canvas tents and food trucks. The stall counters, hanging signs and stacked crates sit below the riders’ sightline. |
| Prospect Park Lake, 5.13 km | Real 05–07 and 11. Games 02 and 04. | Willows bend over the shore. Swans leave wakes across the lake and the green iron bridge spans the narrow end of the water. |
| Boathouse on the Lullwater, 11.92 km | Real 07–09 and 15. Games 01 and 04. | Two storeys of white terracotta stand above their reflection. A red roof, repeated round arches and the waterside balustrade frame the Audubon Center. |

Place each landmark once in the physical landscape and revisit it on the second lap. Set the Boathouse across the water behind an unbroken band of reflections. Keep brownstone façades at the edge of the canopy. Instance hardwoods and market figures, and drive the runner, dog and swan from ride time. Dispose of their geometry, textures and materials on exit. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035, and docs/worlds/prospect/SOURCES.md.

Rider feedback in [#920](https://github.com/QuinntyneBrown/wattzup/issues/920) praises the existing Prospect Park look and feel. Preserve its early-autumn morning light, marked lanes, Long Meadow weekend activity, quiet lake and brownstone backdrop. The existing scene in `world-prospect.ts` repeats those props every 380 m. The native race needs a full drive where the same arch and Boathouse return at the same place each lap. Keep the separate World Ride scene available to its current callers.

## Prairie Paceline (#2192)

The starter catalogue entry already loads courses/prairie.glb. Keep the measured elevation and every stage boundary from the existing native course. Replace the winding horizontal alignment with the long, straight Route 9 corridor. Retain its warm farmland palette, barns, round bales and roadside fencing.

| Rider view | References | Design |
| --- | --- | --- |
| Route 9 shoulder, 0.08 km | Real 01, 03–05 and 09. Games 01, 03 and 04. | A dashed yellow centre line converges with the gravel shoulders. Wind-tossed wheat, wooden poles and wire fences slide past in the foreground. |
| Wind farm service road, 2.48 km | Real 02, 04–07, 11 and 15. Games 01 and 02. | Several rows of three-blade turbines turn above the ridge. A near tower, fenced service track and distant rows show scale and parallax. |
| Canola quarter section, 5.21 km | Real 05 and 07–10. Games 03 and 04. | Rectangular canola and wheat fields meet along a straight service track. A swath of wind-bent flower stems catches the low sun beside the road. |
| Farmyard and bales, 8.74 km | Real 01, 03, 09 and 10. Games 01 and 03. | A red barn, corrugated grain bins and straw bales sit beside a shelterbelt. Power wires sag from the double crossarms above the fence. |
| Railway grain elevator, 12.61 km | Real 12–14. Games 02, 04 and 05. | The square elevator and its headhouse rise above the track, loading annex and hoppers. Weathered timber, a painted place name and the rails show the scale of the town. |
| Last prairie crest, 17.96 km | Real 04–10 and 15. Games 01, 04 and 05. | A shallow crest reveals turbines behind a second ridge. Cumulus and high cirrus fill the amber sky above fence and field shadows. |

Stage turbine rows at distinct distances along both ridges. Taper each tower and blade. Use one shared rotor geometry, a bounded near-verge cluster and far clouds driven by the ride clock. Bake field rows and the shadow beneath every farm building. Give the roadside elevator a trackside loading wing and grain hoppers. Release geometry, materials and textures on route exit. See the performance-budget design, ADRs 0021, 0023, 0030, 0034 and 0035 and docs/worlds/prairie/SOURCES.md.

## Provence Lavender (#2194)

Map Select restores the historical GCN class. Race Setup passes the same course to the lazy renderer and the HUD. Set the public Blender road on the rolling Valensole plateau, with an open view along the rows from the very first turn.

| Rider view | References | Design |
| --- | --- | --- |
| D8 plateau road, 0.08 km | Real 01–04, 10 and 11. Games 02 and 05. | The narrow patched road runs between gold wheat and violet lavandin. Pale dirt separates the rounded rows. Distant Alpine ridges remain fixed as the rider moves. |
| Stone mas and almond tree, 3.31 km | Real 04–08 and 14. Games 01 and 03. | Blue shutters and a terracotta roof distinguish the pale limestone farmhouse. An isolated broad almond tree breaks the skyline, and a dry stone borie stands by the track. |
| Apiary among the rows, 6.44 km | Real 02, 06, 14 and 15. Games 03 and 05. | Coloured wooden hive boxes, honey supers and flying bees are visible at shoulder height. Bent lavender stems and poppies give the sandy verge a different scale from the planted rows. |
| Mechanical harvest, 9.63 km | Real 02, 12–14. Games 02 and 03. | A yellow tractor tows the blue lavender harvester. The reel turns at the row ends beside cut swaths, a trailer and round straw bales. |
| Valensole market square, 13.72 km | Real 04, 08, 09 and 11. Games 01, 03 and 04. | Overlapping tiled roofs lead to the church tower. Plane trees shade a lavender stall, visitors and a distillery sign beside the road. |
| Puimoisson ridge, 17.96 km | Real 03–07 and 09–11. Games 02, 04 and 05. | Sunflowers and wheat border the final ranks of purple. Puimoisson’s village roofs and steeple sit on the near ridge with blue-grey mountains behind. |

Use raised rounded rows and warm gaps of bare soil close to the rider. Merge them into larger planted blocks over distance. Keep the Verdon edge and Alpine backdrop fixed behind village roofs and isolated tree silhouettes. Instance verge flowers, bees and harvest reel parts, animate them on ride time, and dispose of textures and geometry on exit. Verify the submitted frames on the plateau and through the busiest market approach. See ADRs 0021, 0023, 0030, 0034 and 0035, the performance-budget design and docs/worlds/provence/SOURCES.md.

## Andalusian White Villages (#2195)

Use one Blender course for the opening olive road, the lake descent, the limestone climb and the bridge deck. Map Select restores the historical class and the HUD draws its profile from the exported road samples. The villages are a compressed riding itinerary across Andalusia.

| Rider view | References | Design |
| --- | --- | --- |
| Olive road, 0.08 km | Real 01, 04, 14 and 15. Games 01 and 02. | Silver olive rows follow the ochre contours beside narrow edge-painted asphalt. The stone wall curves past a break in the orchard, framing distant white houses. |
| Zahara de la Sierra, 3.42 km | Real 02, 03, 08 and 09. Games 01 and 04. | A square Moorish keep crowns a jagged rock above stacked white roofs, while the road stays low enough to read the castle against the sky. |
| Zahara-El Gastor reservoir, 6.21 km | Real 03, 08 and 09. Games 01 and 05. | The verge drops away to uneven turquoise coves. A small boat crosses the water below olive terraces, and the distant shoreline stays fixed behind it. |
| Grazalema pass, 10.66 km | Real 01, 04, 10 and 15. Games 01 and 03. | Oak and pinsapo forest frame the mountain bend. The village appears as a band of white walls against the tilted limestone layers of the sierra. |
| Puente Nuevo and El Tajo, 15.47 km | Real 11–14. Games 03 and 04. | Before the crossing the rider sees the tall central arch of Puente Nuevo and its upper openings between sheer cliffs. Houses line the rim, with the river far below the bridge deck. |
| Olvera white streets, 20.91 km | Real 02, 05–08, 12 and 15. Games 02–05. | Iron grilles, hanging geraniums and terracotta pots border a tight whitewashed lane. Beyond it the bell tower, red tile roofs and ruined keep share the hilltop skyline. |

Keep the masonry bridge fixed in the gorge, visible from its approach before the rider crosses the same deck. Place the castle above the roofs and give the white walls hard shade beneath every ledge and balcony. Reuse the silhouettes of the near olive trees on the distant terraces. Drive the boat, bird and bell from ride time. Bound the moving actors and release all course geometry, materials and textures on exit. See ADRs 0021, 0023, 0030, 0034 and 0035, the performance-budget design and docs/worlds/pueblos/SOURCES.md.

## Old Québec (#2196)

Set the lower town at the foot of a fixed château cliff. Two circuits climb to the stone ramparts and return to the same cobbled square. The catalogue holds the historical class and shares the road elevation with the HUD.

| Rider view | References | Design |
| --- | --- | --- |
| Place Royale, 0.08 km | Real 01, 12, 13 and 15. Games 01 and 04. | Fieldstone houses with steep dormered roofs frame the cobbled square. A clear gap above the eaves places the copper-roofed château on the cliff. |
| Petit-Champlain and the steps, 1.08 km | Real 04–07 and 12. Games 01, 02 and 04. | Shop signs, iron globe lamps, flower boxes and café tables line the tight lane. The Escalier Casse-Cou climbs between the façades beside the rider. |
| Côte de la Montagne, 2.26 km | Real 01, 02, 04, 08 and 14. Games 02 and 03. | The twisting cobbled road climbs sharply between the stone wall and houses. Château Frontenac shows its brick wings, tall central tower and oxidized copper roofs above the bend. |
| Porte Saint-Louis, 3.39 km | Real 03, 04 and 09. Games 02 and 04. | The road passes beneath the grey limestone gate. A round turret, crenellations and the grass-topped wall read against autumn maples. |
| Terrasse Dufferin, 4.63 km | Real 08, 10, 11, 14 and 15. Games 03 and 05. | The iron rail and boardwalk run above the St. Lawrence. Green-and-white gazebos, globe lamps, flags and a moving ferry share the view with the far shore. |
| Porte Kent and the ramparts, 12.17 km | Real 03, 08, 09 and 15. Games 01, 04 and 05. | A second castellated opening and the long grassy glacis carry the penultimate descent. Historic cannon carriages sit along the wall under red and gold maples. |

Frame the single central tower from each bend with low roofs and clearings in the maples. Make the gate openings and boardwalk plane actual geometry. Place the ferry below the terrace on the river. Merge distant stone frontages, limit moving flags and signs to their local groups and release their resources when leaving the race. See ADRs 0021, 0023, 0030, 0034 and 0035, the performance-budget design and docs/worlds/quebec/SOURCES.md.

## La Redoute (#2197)

Restore the historical GCN class through Map Select. Preserve the existing World Ride scene’s painted names, campervans, forest, frites stall and concrete viaduct in the native race. The full timed itinerary traverses the valley before the short, steep climb above Remouchamps. Sample the same road for the rider, camera and HUD profile.

| Rider view | References | Design |
| --- | --- | --- |
| Remouchamps church, 0.08 km | Real 06, 07 and 13–15. Games 02 and 04. | Slate roofs and pale stone houses cluster below the church spire. The old rail arches frame the exit from the village beside the Amblève. |
| Amblève pastures, 5.43 km | Real 08, 10–12, 14 and 15. Games 01 and 03. | Wire fences, cattle and spring hedges follow the wet road. The river turns beneath wooded valley slopes beyond the pasture. |
| Campervan approach, 11.64 km | Real 01–05 and 11. Games 02 and 05. | The first motorhomes and a frites stall frame the narrowing lane. Belgian flags rise above spectators behind the barriers. |
| Painted wall, 12.57 km | Real 01–05, 08 and 09. Games 01–03. | Large hand-painted PHIL names and tricolours run across damp asphalt. The straightest part pitches into double digits between a dense crowd and the hedgerow. |
| E25 crossing, 13.39 km | Real 01, 06, 08, 11 and 13. Games 01, 04 and 05. | The concrete motorway deck crosses the rider’s road on tall piers near the upper slope. Beech and spruce crowd the verges and a team car passes above. |
| Redoute summit stone, 15.56 km | Real 08–10, 12, 14 and 15. Games 03–05. | A La Redoute stone stands at the summit turnout. Beyond the wire fence, the wooded Amblève valley and the river are visible beneath an overcast spring sky. |

Use pale local stone and slate for the village and an overcast sky above fresh beech and spruce. The old masonry rail arches belong in the valley; the later motorway deck is concrete on tall piers. Bake wet grit beneath hand-painted lettering, retain an open view down the valley from the crest, and merge the crowd into bounded groups. Drive the flags, grazing cattle and moving car from ride time. Release all owned buffers, materials and textures on exit. See ADRs 0021, 0023, 0030, 0034 and 0035, the performance-budget design and docs/worlds/redoute/SOURCES.md.

## Rome Colosseum Loop (#2198)

Lay the avenue and Palatine return as one closed course under three circuits of the historical class. The start faces the marble monument before turning onto Via dei Fori Imperiali. Place the amphitheatre in fixed world space at the far end, so approaching, passing and looking back reveal different faces of the same structure.

| Rider view | References | Design |
| --- | --- | --- |
| Piazza Venezia, 0.08 km | Real 01, 02 and 13. Games 01 and 04. | The avenue opens beside the Vittoriano. Wide marble steps ascend to its deep colonnade and the two bronze quadrigas on its roof. |
| Trajan’s Market, 0.52 km | Real 01, 02, 11 and 12. Games 01 and 02. | A low parapet opens onto the excavated brick hemicycle, ranks of columns and the rectangular tower above the market. Tour groups move along the pavement. |
| Via dei Fori Imperiali, 0.91 km | Real 01–05 and 08. Games 02 and 03. | The worn basalt fans of the wide straight lead towards the elliptical Colosseum. Deep arcades, broken upper walls and warm arch bays stand clear of the pines. |
| Arch of Constantine, 1.37 km | Real 08–11 and 15. Games 03 and 04. | Beside the amphitheatre stands the marble arch with a high central opening, two lower passages, relief panels and a projecting attic. A guide raises an umbrella. |
| Via di San Gregorio, 2.21 km | Real 04–07 and 14. Games 02 and 05. | Flat pine crowns rise above the Palatine brick ruins. A red Vespa and white taxi drive along the roadside with a clear lane for the rider. |
| Piazza del Colosseo, 11.15 km | Real 03, 08–10 and 15. Games 01, 03 and 05. | On the third circuit the rider passes the same travertine piers, stacked arches and irregular rim at close range. Tourists and street sellers give the building scale. |

Model the amphitheatre openings through the masonry and vary the surviving outer rim by sector. Bake travertine shadow, brick runoff and fan-pattern basalt at physical scale. The fixed skyline and middle-distance Forum terrace stay visible through turns. Batch pines, architectural repeats and pedestrians by local visibility. Advance the guide, Vespa and taxi on ride time and release their owned resources on exit. See ADRs 0021, 0023, 0030, 0034 and 0035 and the performance-budget design.

## Route 66 Desert (#2199)

Set the Arizona towns in east-to-west order on a condensed 8 km course. The Painted Desert opening runs straight before the later bends of the Black Mountains. Keep the existing highway shields, rhyme boards, two-tone cars, diner neon, poles and tumbleweed in the native race. Align each stage to the original class and sample the road elevation for the HUD.

| Rider view | References | Design |
| --- | --- | --- |
| Painted Desert highway, 0.08 km | Real 01, 02, 04 and 06. Games 01, 04 and 05. | A chipped black-and-white shield and yellow centre line stretch towards banded mesas beneath a wide blue sky. Power poles diminish along the red gravel shoulder. |
| Holbrook Wigwam Motel, 1.16 km | Real 02, 10 and 11. Games 01 and 05. | White concrete wigwams with red trim stand in a staggered row. Turquoise station wagons and finned coupes sit by their low rectangular doors. |
| Seligman boardwalk, 2.64 km | Real 06 and 11–14. Games 02 and 03. | Bright western false-fronts and a timber boardwalk frame a pastel pickup and a string of original short rhyme boards. |
| Hackberry General Store, 3.86 km | Real 06, 09 and 12. Games 02 and 04. | A steel awning shades weathered fuel pumps and vintage signs. A red roadside Pegasus and worn storefront stand above rusting car parts. |
| Kingman chrome diner, 5.13 km | Real 07, 08 and 11. Games 01, 04 and 05. | A roadside diner has chrome bands, pink and turquoise panels, luminous roof trim and a glass-fronted counter with red stools. A classic car passes outside. |
| Oatman and Sitgreaves Pass, 7.26 km | Real 03, 05 and 13–15. Games 02, 03 and 05. | A burro walks beside timber boardwalks and rough wooden storefronts below the broken skyline of the Black Mountains. The climbing road turns towards Sitgreaves Pass. |

Keep mesas fixed in world space. Use physical ledges and sediment bands, baked sun and shade, fine cracked asphalt and dusty shoulders. Model the white motel cones, cars, pump globes, diner counter and false-front boardwalks. Batch roadside plants in sections and move the car, tumbleweed and burro on ride time. Release their owned resources on exit. See ADRs 0021, 0023, 0030, 0034 and 0035 and the performance-budget design.

## Saguaro Desert (#2200)

Set Cactus Forest Drive on a closed physical route under the full historical workout. Keep the park sign, roadrunner, distant hot-air balloon, many-armed saguaros and ocotillo from the existing ride. Use the same continuous elevation for the road, rider and HUD.

| Rider view | References | Design |
| --- | --- | --- |
| Cactus Forest Drive entrance, 0.08 km | Real 01–03 and 06. Games 01–03. | A brown park sign marks the entrance to the narrow one-way loop. Ribbed saguaros stand above loose red gravel with the Rincon ridgeline beyond. |
| Dawn cactus stand, 1.21 km | Real 07–09, 11 and 14–15. Games 03 and 04. | Several differently branched saguaros break the orange-pink horizon. Long shadows cross the pavement, a hawk perches on one arm and a balloon drifts beyond the ridge. |
| Sandy wash crossing, 2.68 km | Real 01, 03–05 and 13. Games 02 and 05. | The undulating drive descends into a sandy arroyo. A dip warning and low masonry culvert announce the crossing; a roadrunner moves near the shoulder. |
| Cactus forest rollers, 4.81 km | Real 03, 10–13 and 15. Games 02–05. | Tall green saguaros with crooked arms and deep ribs surround the bend. Prickly pear pads, cholla and red-tipped ocotillo grow under palo verde between rocky rollers. |
| Stone picnic ramada, 7.32 km | Real 02, 04–05, 10 and 13. Games 01 and 05. | At the bollarded gravel pullout a low stone ramada shelters a picnic table. A pair of quail walks across the foreground beneath the palo verde canopy. |
| Rincon overlook, 9.74 km | Real 03–05, 08–10 and 14–15. Games 02–04. | A sweeping descent turns towards successive blue-grey ridges. Side-lit saguaros and ocotillo frame the valley from the pullout before the return to the entrance. |

Separate the near ribbed trunks and crooked arms from the distant silhouette belt. Shape continuous sandy arroyo banks below the culvert, bake long morning shadows onto the rocky ground and keep the roadway clear. Grade the sky from warm horizon to clear blue and place fixed rugged mountain ridges on both sides of the basin. Batch local vegetation, animate the birds on ride time and dispose of owned resources when leaving the course. See ADRs 0021, 0023, 0030, 0034 and 0035 and the performance-budget design.

## Rio Sambadrome (#2201)

Place one fixed 700 m avenue between the stands. Three complete laps of 1,866⅔ m return around the outside of the parade; the final straight completes the 6.3 km class at the white arch. Align every pass, stage and movement to the same rider distance.

| Rider view | References | Design |
| --- | --- | --- |
| Marquês de Sapucaí, 0.08 km | Real 02, 07, 11 and 13–15. Games 01 and 03. | Floodlights and crowded stepped stands converge on the single concrete runway. The white Apoteose arch marks the far end and the rider lane remains clear. |
| Feathered alas, 0.21 km | Real 01, 07–11. Games 02 and 04. | Coordinated wings of turquoise, green and pink feathered dancers fill the flanks. Bare concrete, paint joints, cast light and scattered confetti remain visible beneath them. |
| Carros alegóricos, 0.34 km | Real 01–06 and 12. Games 03–05. | Tall original floats stack moving performers, sculpted tropical birds, gold foliage and luminous blue scrolls. Nearby figures give their three-dimensional decks scale. |
| Bateria, 2.34 km | Real 07–09 and 11. Games 01, 02 and 04. | Uniformed musicians stand in deep staggered ranks with surdos, raised mallets and tamborims. The foreground drumline performs beneath the stadium lights. |
| Mestre-sala and porta-bandeira, 4.29 km | Real 03, 05 and 07–11. Games 02–04. | A flag-bearer in a wide embroidered skirt turns an original blue-and-gold school banner beside her partner, with spectators, phones and waving flags on the terraces. |
| Praça da Apoteose, 6.25 km | Real 01, 02 and 12–15. Games 01, 03 and 05. | The runway opens out beneath Niemeyer’s white arch, with its central suspended sweep and two wide legs. The finish crosses the arch axis against layered Rio hills and favela windows. |

Model Niemeyer’s arch as a continuous sculptural span with clear air under its two openings. Build original carros alegóricos with stepped decks, large figures and lamps. Use batched crowd bands along the stepped stands and animate individual foreground performers, surdo mallets and the couple’s actual cloth banner on ride time. Bake pools of coloured light and bound the confetti particles. Keep the Rio ridge and hillside windows fixed beyond the outer streets. Dispose of owned GPU resources on exit. See ADRs 0021, 0023, 0030, 0034 and 0035, Caribana’s screenshots and performance-budget design.

## Santa Monica Pier (#2202)

The 8.85 km beach course follows an undulating concrete ribbon north to one fixed pier. Preserve the previous ride’s turquoise lifeguard towers, wheel, coaster, Pacific surf on the left and palms and hotels on the right. The bike path stays at beach level beneath the elevated access to the pier. The HUD samples the same road elevation.

| Rider view | References | Design |
| --- | --- | --- |
| Marvin Braude beach path, 0.08 km | Real 01, 02, 11 and 12. Games 01 and 04. | A dashed yellow stripe follows a narrow concrete ribbon through windblown sand. Thin fan palms, beach hotels and the Santa Monica Mountains stand inland. |
| Lifeguard tower, 1.86 km | Real 03, 04, 09 and 11. Games 01 and 02. | A turquoise lifeguard hut stands on legs. Its long wooden access ramp, white safety rails, observation windows, number and flag read above the sand. |
| Pacific breakers, 3.21 km | Real 06, 08, 10 and 11. Games 01 and 02. | A bend reveals parallel foamy breakers, wet sand and a surfer waiting beyond the break. A low western sun casts a warm reflection on the water. |
| Palisades palms, 5.06 km | Real 01, 02, 11, 12 and 14. Games 03 and 04. | Slender fan palms line the bluff beyond raised beach houses. A skater and a cruiser travel along the path edge while shadows stretch across the concrete. |
| Pacific Park, 8.49 km | Real 05–08 and 15. Games 03–05. | The pier crosses the shore on dark timber piles. The turning Pacific Wheel has open spokes and upright passenger cars; the coaster runs over its red-and-yellow track. |
| Yacht Harbor and Route 66, 8.80 km | Real 05–08, 13 and 15. Games 03–05. | The last sprint reaches the timber pier and its elevated approach with the blue-and-gold Yacht Harbor arch, End of the Trail shield, deck rail and shadow beneath the pilings. |

Build the timber deck, cross-braces and piles in place. Mount the rotating wheel on its axle with gravity-upright cars. Drive the coaster train along the actual fixed track and animate the skater, cruiser and surf from ride time. Bake plank wear, salt residue and sand drifts. Batch palms and beachgoers by distance, keep a bounded surf band, and release owned geometry and materials on exit. See ADRs 0021, 0023, 0030, 0034 and 0035 and the performance-budget design.

## Sea Point, Cape Town (#2203)

Issue #908 praised the previous scene. Preserve its breaking Atlantic surf, Lion’s Head, Table Mountain, green seafront lawns and square diagonally striped lighthouse. The catalogue selects the native course from Map Select. Each 4.225 km circuit shares fixed scenery, a northbound seaside leg and a southbound inland return. Use sampled physical elevation throughout the race and HUD.

| Rider view | References | Design |
| --- | --- | --- |
| Sea Point Promenade, 0.08 km | Real 01, 05, 09 and 14. Games 01 and 03. | Beach Road runs beside a green lawn, broad concrete footway and metal seawall rail. Walkers, runners and a dog share the promenade. |
| Atlantic rock pools, 0.69 km | Real 03, 04, 10 and 11. Games 01 and 04. | Atlantic breakers fold over exposed dark rock shelves. Green kelp fringes sheltered blue tidal pools below the rail. |
| Sea Point Pavilion, 1.13 km | Real 05, 06, 09 and 14. Games 02 and 04. | The outdoor seawater pool sits between the promenade and the ocean, with swimming lanes, railings and a stepped spectator terrace. |
| Mouille Point lighthouse, 1.94 km | Real 07, 08 and 14. Games 02 and 05. | The square Green Point lighthouse has diagonal red stripes, a projecting white gallery and a glazed red lantern. Short buildings cluster around its base. |
| Lion’s Head and Signal Hill, 3.02 km | Real 02–04, 08, 14 and 15. Games 01–03. | The inland return looks up past palm trunks and the projecting balconies of white flats. A pointed granite cap rises above the long green shoulder of Signal Hill. |
| Table Mountain, 7.87 km | Real 01, 08 and 15. Games 02, 03 and 05. | The flat summit and near-vertical sandstone faces of Table Mountain show past a gap in the apartment rows. A low tablecloth cloud spills over the ledge. |

Build the fixed peaks as layered, faceted terrain with a broad Atlantic horizon. Model the lighthouse balcony and lantern, individual rock ledges, pool coping and balcony recesses. Use instancing and shared meshes for the moving surf, runners and swimmers. Advance secondary movement on the ride clock and dispose all allocated meshes and textures on exit. Reference real-13 is from Hawaii and informs only the shape of a low breaker. Benchmark the loaded opening and busiest stretch as described in meet-performance-budgets. See ADRs 0021, 0023, 0030, 0034 and 0035.

## Passo Sella (#2204)

The catalogue selects the single Passo Sella climb, 11.6375 km, independently of the four-pass Sella Ronda course. The previous generic scene supplied alpine colours and roadside posts. Use the architectural proportions and cliff layering of the repository’s Sellaronda models. Build both fixed massifs around this particular climbing road and set their scree feet into its terrain.

| Rider view | References | Design |
| --- | --- | --- |
| Larch wood, 0.08 km | Real 02, 12 and 15. Game 03. | Warm larches and darker spruce enclose the lower SS242. A white edge line and delineator posts follow the road into a sunlit opening. |
| Numbered tornante, 2.46 km | Real 01, 02 and 04. Games 02 and 04. | Look across the inside of a numbered hairpin toward the next stretch of smooth road. A motorbike leans on the far arm and climbs away. |
| Hay barn and pasture, 4.92 km | Real 04, 12, 14 and 15. Games 01 and 03. | A dark larch hay barn sits on a stone foot in a sloping meadow. Cattle lower their heads among patches of alpine flowers. |
| Sassolungo walls, 7.29 km | Real 01, 07–09 and 11. Games 01, 02 and 05. | Three distinct pale towers stand over a continuous scree apron. Their deep clefts and sunlit facets clear the treeline above the cyclist group. |
| Città dei Sassi, 9.74 km | Real 10–13. Games 04 and 05. | Angular limestone blocks rise alongside the road between dwarf pines. Across the saddle the Sella group has a tiered table-like rim. |
| Passo Sella summit, 11.58 km | Real 05–07 and 14. Games 01 and 02. | A summit sign reads Passo Sella / Sellajoch 2244 m beside the rifugio. Timber balconies, the gravel forecourt and white road edge remain visible against the mountains. |

Reference signs show 2240 m and several historical names. Use the issue’s required bilingual 2244 m label with the proportions and painted finish of real-05 and real-06. Real-03 and real-09 inform regional road and stone character. Sample the same centre-line elevation in the HUD. Merge fixed scenery by distance, keep distant cliffs visible on Low and advance nearby road traffic and grazing poses on the ride clock. Release scene assets on exit. Measure opening and upper samples as specified in meet-performance-budgets. See ADRs 0021, 0023, 0030, 0034 and 0035.

## Sella Ronda (#2205)

The existing native Sella Ronda is the baseline. Retain its class, sampled centre line, four distinct cols, sculpted limestone massif, regional villages, cableways and paraglider orbits. The API currently describes 11.7 km and 357 m, while the native course measures 11.65 km and 364 m. Align catalogue and HUD elevation to the measured course.

| Rider view | References | Design |
| --- | --- | --- |
| Corvara approach, 0.20 km | Real 03, 11 and 13. Games 02 and 05. | The road approaches Corvara’s church and timber balconies beneath the massif. A group of cyclists leaves the village ahead of the rider. |
| Passo Campolongo, 2.06 km | Real 03, 04, 06 and 07. Games 02 and 03. | The first col has a signed roadside refuge, a mown pasture and a ski-lift line rising clear of the roofs. |
| Arabba valley, 3.08 km | Real 03, 13 and 15. Games 02 and 05. | The plunge into Arabba ends at village windows and a church tower. The next ribbon of climbing tarmac can be traced against the meadow. |
| Passo Pordoi, 4.90 km | Real 09, 10, 12 and 15. Games 01 and 04. | The numbered Pordoi switchbacks climb to the pass refuge. Sass Pordoi and the snow streaks of Marmolada rise on opposite horizons. |
| Passo Sella approach, 7.44 km | Real 01, 06, 08, 11 and 12. Games 02 and 04. | Sassolungo rises ahead on the open approach. The road then bends past the touring motorbike and the summit sign at the col. |
| Passo Gardena, 10.10 km | Real 05–09 and 14. Games 03 and 05. | The last refuge and signed col lie among summer meadows above Selva. A banner moves in the wind beside the chapel and a chairlift traverses the slope. |

Preserve the geometry in sellaronda_kit, including the fixed central rock faces. Add local road wear and stone detail, readable pass faces, articulated cyclists and a banking motorcycle moving along the sampled road. Run the cloth and riders on the same clock as the lifts, with bounded batches and owned geometry disposal. Use real-02 only for hairpin sightlines because its source identifies Mallorca. Maintain the existing best-time ghost, class timing, controls and finish. Measure foreground bunch and high-pass traffic independently on the simulated tablet. See ADRs 0021, 0023, 0030, 0034 and 0035.

## Serpentine, Hyde Park (#2206)

The existing SerpentineStreet repeats a 500 m section. Preserve its lakeside railing, jetty, lamps, swans and bridge. The catalogue entry for GCN Training’s 15 Minute HIIT Cardio selects a measured two-lap native scene with one bridge, one Lido and a physical shore. Long views across the water reveal the far bank and establish where the rider is on the second lap.

| Rider view | References | Design |
| --- | --- | --- |
| Boathouse jetty, 0.08 km | Real 05, 06 and 13. Games 01 and 03. | The timber boating pavilion and stacked blue-and-white pedalos sit beside the north-bank road. The first band of trees leaves a clear view across open water. |
| Deckchair lawn, 0.62 km | Real 03, 07, 11, 12 and 15. Games 02 and 03. | Mottled plane trunks and dappled tarmac frame striped folding chairs. A jogger moves along the separate lawn path between strolling families. |
| Bridge approach, 1.29 km | Real 01, 02, 04 and 10. Games 02 and 04. | Five pale stone arches meet the water on tapered piers. The near abutment grows beside the approaching rider while a far tower stays steady above the trees. |
| South-bank Lido, 2.13 km | Real 05, 09 and 13. Games 03 and 05. | A low lakeside café, west-facing terrace and marked bathing water distinguish the Lido. London plane crowns frame the boathouse on the opposite shore. |
| Reed-edge birds, 3.04 km | Real 01, 06, 08 and 14. Games 01 and 03. | Curved mute-swan necks, darker geese and small ducks stand out along the near waterline. V-shaped wakes trail the swimming birds. |
| Long Water vista, 4.51 km | Real 02, 04, 09 and 10. Games 04 and 05. | A moving rowboat crosses a gap in the nearer tree cover. The five-arch bridge and slim Knightsbridge tower overlap at different distances. |

Build the bridge from arch rings, spandrels, a parapet and cutwaters. Use a dark underside and a baked reflection at water level. Near the shore, articulated oars and swimming birds expose their actual pose to the simulated ride. Merge static deckchair frames and benches by section, instance original plane crowns, and keep the most distant skyline in one fixed mesh. Original artwork uses the reference folder for scale and light. Load course data on selection, dispose textures and geometry on exit and measure actual submitted frames for the opening and second bridge approach. ADRs 0021, 0023, 0030, 0034 and 0035 and the performance design govern those checks.

## Seven Sisters Cliffs (#2207)

The previous world used rolling road defaults. Restore the historical GCN class to the catalogue. Two sets of seven efforts ride east along the chalk and return on a parallel downland lane after Belle Tout. Both look out on one fixed coast. Each summit opens a different view of the next chalk face.

| Rider view | References | Design |
| --- | --- | --- |
| Coastguard Cottages, 0.10 km | Real 03, 08, 13 and 15. Games 02 and 04. | White cottages with dark pitched roofs and paired chimneys overlook the haven. Their foreground roofs sit below a receding sequence of chalk headlands. |
| Cuckmere valley, 0.93 km | Real 05, 07 and 10. Games 01 and 03. | The road looks down across a looping tidal river, grazing sheep and a timber field gate. Flint walls flank the chalk lane. |
| Chalk brows, 2.55 km | Real 03, 09, 12, 13 and 15. Games 02 and 04. | Deep green-swarded saddles separate the white cliff brows. A gull banks above a cliff edge and the grey-blue Channel extends beyond it. |
| Birling Gap, 5.45 km | Real 09, 11 and 12. Games 01 and 04. | The road rises above a grey flint beach. A low line of whitewater reaches the shingle and recedes beneath the worn chalk faces. |
| Belle Tout, 6.29 km | Real 02, 04, 06 and 14. Games 02 and 05. | The squat white tower, black-glazed lantern and attached keeper’s house mark the eastward turn. The chalk track curves up to the lighthouse. |
| Return over the downs, 9.61 km | Real 01, 05, 06 and 07. Games 01 and 03. | The white-edged road pitches over open sheep-grazed downs. Flowering gorse, a National Trust waymarker and split timber fences frame the next crest. |

Cut flutes into the chalk, tint flint bands in the surface and round the turf over the lip. A stepped shingle beach takes the tide beneath the brows. Use foreground gates and hedges for parallax and draw the distant profile as a continuous silhouette on Low. The lighthouse is the squat clifftop Belle Tout shown in real-04, 06 and 14. Cuckmere is a river with cut-off oxbows in a flat floodplain. Drive near sheep necks, gull wings and breakers from ride time. Dispose geometry, textures and buffers on exit. Measure the two busiest moving sections as in the performance design and ADRs 0021, 0023, 0030, 0034 and 0035.

## San Francisco Hills (#2208)

The earlier procedural world combines generic city props and a rolling road. Restore the GCN class to the catalogue and use one measured centre line for the camera, grade, vehicles and intersection flats. The 120 m Filbert pitch gains 37.8 m between 2.740 and 2.860 km. Keep railway tracks off the crooked, brick-paved Lombard block.

| Rider view | References | Design |
| --- | --- | --- |
| Russian Hill row houses, 0.10 km | Real 01, 03, 04, 10 and 13. Games 02 and 03. | Stepped, painted bay windows and raised stoops mark each lot. Overhead wires, ficus crowns, a flat zebra crossing and a cast manhole mark the first block. |
| Powell–Hyde line, 1.38 km | Real 02, 07 and 08. Games 02 and 04. | A red-and-cream cable car moves along the steel running rails and central grip slot. Its clerestory and open riding platform remain distinct at rider height. |
| Filbert wall, 2.82 km | Real 01, 11, 12 and 13. Games 02 and 05. | A 31.5 percent concrete pitch rises between stepped sidewalks. Parked cars lean with the road, with their wheels turned toward the curb. A level landing breaks the steep block. |
| Telegraph Hill crest, 4.22 km | Real 03, 04, 09 and 14. Games 01 and 04. | Coit Tower’s pale fluted shaft and arched crown rise above Telegraph Hill. Alcatraz and the Bay Bridge appear beyond the sudden drop in the street. |
| Lombard switchbacks, 6.72 km | Real 05 and 06. Games 03 and 04. | Eight tight bends wind down a continuous red-brick street. Hydrangea beds fill the inside of each turn. A local car threads the bends below the rider. |
| Bay overlook, 8.36 km | Real 02, 07, 11 and 15. Games 01 and 05. | A fog bank slides over the water beyond the foreground wires. The island and bridge stay fixed while warm light picks out projecting bay windows on the last descent. |

Model the bays, dentilled cornices, cable-car roof and Coit Tower’s top openings in silhouette. Reuse original facade elevations over stepped geometry and batch wires and window frames by block. Keep Alcatraz, the bridge and Telegraph Hill fixed across the route; a translucent marine layer moves independently of the landmarks. Measure submitted frames with the whole HUD and loaded meshes, and dispose textures, geometry and scene-local actors on exit. See the performance design and ADRs 0021, 0023, 0030, 0034 and 0035.

## Shibuya Crossing (#2209)

The race catalogue selects an 8.15 km course comprising two 4.075 km laps. Use one fixed station, crossing and 109 fork. The geometry determines the grade on Dogenzaka and the HUD elevation. Original nighttime signage uses invented shop names and artwork.

| Rider view | References | Design |
| --- | --- | --- |
| Hachikō station plaza, 0.12 km | Real 02, 11, 13 and 15. Games 03 and 05. | The bronze dog stands on its stone plinth outside the station. Elevated JR tracks cross behind it, below the lit profiles of Hikarie and Scramble Square. |
| Scramble crossing, 0.72 km | Real 02, 03, 08, 13 and 15. Games 01 and 04. | Diagonal and straight zebra stripes meet across one broad junction. Umbrella groups wait together at the curb and then walk several crossings at once. |
| QFRONT screens, 0.81 km | Real 01, 04, 06, 07 and 08. Games 01 and 03. | The curved screen frontage rises above the crossing. Original moving graphics change colour on the panel and glimmer on wet tarmac below. |
| 109 fork, 1.48 km | Real 05, 09, 10 and 12. Games 02 and 03. | The silver cylindrical Shibuya 109 facade stands between the two streets. A taxi passes beneath the green signals and turns onto the climbing road. |
| Dogenzaka climb, 2.65 km | Real 03, 09, 10 and 12. Games 01, 02 and 05. | Vertical karaoke and hotel signs stack above narrow shopfronts. Clear umbrellas catch the colour of individual signs as riders climb Dogenzaka. |
| Station return, 4.79 km | Real 04, 06, 07, 11 and 14. Games 03 and 04. | A second pass brings the screen, waiting pedestrians and elevated train into a single street-level view. The tower lights remain visible above the train. |

Bake window and shop lighting into shared facade atlases. Draw the near wet-asphalt reflection in the same colours as the screen above it. One pedestrian cycle holds the umbrella groups on both corners and starts the diagonal and straight crossings together. Keep the rider lane clear. The train follows the viaduct, and the taxi follows the road. Batch repeated street and window geometry by block and retain the distinctive silhouettes on Low. Dispose the scene and its materials on exit. Use the performance design and ADRs 0021, 0023, 0030, 0034 and 0035 for the submitted-frame checks.

## Silverstone Track Day (#2210)

The existing silverstone world palette supplies soft cloud and damp pavement. The race catalogue loads a fixed native course through the course registry. Compress the circuit to two equal 5.544 km laps to retain the 11.0875 km class progression. Orient the projecting roof, garage apron and stands beside the racing surface, with painted kerbs following the actual apex and gravel outside each turn. The original photographs and game references are present with their credits in docs/worlds/silverstone on the default branch.

| Rider view | References | Design |
| --- | --- | --- |
| Hamilton Straight and the Wing, 0.10 km | Real 01–03 and 09. Games 02 and 04. | The silver folded roof kicks up over the pit exit. Level garage doors, the fenced pit wall and an empty grandstand frame the timing line. |
| BRDC clubhouse, 1.42 km | Real 04, 06 and 07. Games 01 and 03. | White canopy peaks and a glass front stand beyond the catch fence. A pit crew member rolls a trolley along the service apron. |
| Maggotts and Becketts, 3.18 km | Real 05, 07, 08 and 13. Games 03 and 05. | Red-and-white inner kerbs alternate through the esses. The racing line switches sides below the long empty roof of the Becketts stand. |
| Hangar Straight, 4.15 km | Real 08, 11 and 13. Games 01 and 02. | The uninterrupted straight rises gently toward Stowe. Paired distance boards and a sparse line of hedges recede into a grey horizon. |
| Stowe gravel trap, 4.85 km | Real 10–15. Games 03 and 05. | A track-day sports car steers around the right apex. The grey gravel fan, alternating tyre stacks and orange marshal post follow the outside of the bend. |
| Club and the pit entrance, 5.48 km | Real 01, 04, 07 and 09. Games 02 and 04. | The white pit-entry divider leads back to the Wing. A marshal waves beside the orange shelter while the second lap begins beneath the start gantry. |

The asphalt carries the worn rubber line and edge paint. Batch fence posts, seat rows and garage doors into local native sections. Draw the Wing’s folded roof and long grandstand silhouettes from further away than the gravel and wire mesh. Sample track-day car, trolley and marshal poses on ride time and release the geometry and materials on route exit. Verify Low/WebGL 2 from map selection, followed by separate 60-second performance samples through Hamilton Straight and the esses (ADRs 0021, 0023, 0030, 0034 and 0035).

## Isle of Skye Fog (#2211)

Retain the muted light and moist single-track road of the existing world palette. The rider enters via the catalogue and the course registry loads the original 12.725 km course with the GCN class. Use distinct relief for the dark gabbro ridge and the rounded rusty hills. Ground the pools, bridges, houses and animals against the measured road.

| Rider view | References | Design |
| --- | --- | --- |
| Carbost crofts, 0.10 km | Real 02, 03 and 14. Games 01 and 02. | White harled houses, a chapel bellcote and dark slate roofs step down to Loch Harport. A white diamond marks a passing place on the narrow damp road. |
| Loch Harport, 1.78 km | Real 03, 12 and 14. Games 01 and 05. | Grey water and a handful of moorings lie below the grassy bank. The road leaves the coastal strip for rough heather, with rounded red granite ahead. |
| Red Cuillin shoulder, 3.98 km | Real 06, 11 and 15. Games 03 and 05. | The Red Cuillin rises in smooth russet screes. A horned Highland cow turns its head beside the passing bay while sheep crop the unfenced verge. |
| Fairy Pools burn, 6.32 km | Real 04, 05 and 07. Games 03 and 04. | Under the footbridge a short white cascade drops into a clear blue-green rock pool. The dark gabbro skyline rises behind the boulders. |
| Black Cuillin mist, 8.84 km | Real 01, 05, 08, 09 and 13. Games 02 and 04. | A ragged gabbro ridge appears through moving low cloud. The white passing-place diamond and near sheep stay readable against the heather. |
| Glen Brittle shore, 12.14 km | Real 01, 04, 10 and 11. Games 01 and 05. | The glen opens onto grey sea water below the crofts. A shaft of light touches the last grassy shoulder; the dark ridge stays fixed on the horizon. |

The ridge is fixed beyond the travelling bike. Place low moving fog in the glen between rider and peaks, keeping nearby signs and the HUD clear. A separate water surface carries the falls over the lip of the rock cut. Keep the two lochs in their own valleys. Batch bracken, stones and roadside clumps, use one reusable rig for grazing cattle, and release the glen materials and moving groups on exit. Use the budgets and backends in ADRs 0021, 0023, 0030, 0034 and 0035.

## Songkran, Bangkok (#2212)

The four-lap race uses one original 2.9375 km district loop to cover the full 11.75 km GCN class. Retain the original street palette and soaked surface. The catalogue and course registry load the scene only on entering the race. The existing credited photographs and game plates are complete in docs/worlds/songkran on the default branch. Silom crowd photos establish density and Chiang Mai photos inform the bucket and water-toy poses. The Thai temple photograph informs roof materials and decoration.

| Rider view | References | Design |
| --- | --- | --- |
| Khao San shopfronts, 0.10 km | Real 05, 07, 08 and 10. Games 01 and 05. | Hostel balconies, projecting guesthouse signs and awnings squeeze the view down the wet street. The rider has a clear lane between the two lines of revellers. |
| Songkran water fight, 0.48 km | Real 01–04, 06, 11 and 13. Games 01 and 04. | Festivalgoers in floral shirts lean from the kerbs. A bucket tips, a hose arcs and bright water toys send streams into the wet street. Chalk paste is visible on cheeks. |
| Pad thai and fruit carts, 0.96 km | Real 07–10 and 14. Games 02 and 03. | Stainless carts with woks, fruit trays, umbrella shades and warm bulbs stand against the shopfronts. Puddle reflections break around tyre marks. |
| Tuk-tuk rank, 1.42 km | Real 02, 08, 10 and 14. Games 03 and 05. | A three-wheel taxi with a curved blue canopy and chrome passenger rails noses forward from the kerb. Parked tuk-tuks and overhead shop signs mark the rank. |
| Wat Chana Songkhram approach, 2.34 km | Real 07–10 and 15. Games 02 and 04. | Layered red temple roofs with golden chofa finials rise past a pale gate at the end of the street. The surrounding shophouses stay below the roofline. |
| Evening on Khao San, 9.31 km | Real 05, 06, 09, 11–13. Games 01 and 05. | On the final lap, neon Thai signs and warm stall lamps reflect on the tarmac. Overhead bulbs trace the narrow street above the water fight. |

Use original daylit shophouse fronts and transparent festival portraits alongside fixed roof and cart geometry. Keep riders clear of the kerb activities. One clock drives the falling water and tuk-tuk. The evening transition uses course progression to strengthen emissive signs and reflections. Batch repeating facades and people by street block. Dispose the course materials, vehicles and water meshes on exit, following ADRs 0021, 0023, 0030, 0034 and 0035.

## South Beach Sunrise (#2213)

The current Race selector maps South Beach to the Vice City GLB because Vice City shares its World Ride palette. Distinguish the requested catalogue world when selecting a native asset, keeping Vice City’s independent race and class preparation intact. South Beach loads its own 7.025 km Ocean Drive. Keep the pastel hotels, Caribbean colours, open Atlantic, painted road writing and closing deco tower praised in rider feedback #898 and documented in the earlier bend captures. The course derives the grade of each stage from its resistance.

| Rider view | References | Design |
| --- | --- | --- |
| Colony Hotel, 0.10 km | Real 01, 04, 07 and 09. Games 01 and 03. | The vertical COLONY fin glows blue above white horizontal eyebrows. The first palms cast long shadows across the café frontage and painted race lane. |
| Carlyle café terrace, 1.34 km | Real 02, 03 and 08. Games 01 and 02. | The Carlyle’s stepped mint frontage rises behind striped umbrellas, menu stands and a parked two-tone convertible. A cleaner sweeps the sidewalk. |
| Breakwater neon fin, 2.64 km | Real 04, 06, 07 and 09. Games 02 and 03. | The central stepped fin reads BREAKWATER above the coral and cream wings. Its neon fades as the sun climbs; the original sprint paint follows the uphill grade. |
| Lummus Park beachwalk, 4.01 km | Real 05, 10, 14 and 15. Games 01, 04 and 05. | A rollerblader and a dog walker pass under slender royal palms beside the paved beachwalk. Sea oats and the Atlantic show through the gaps. |
| Lifeguard stand at sunrise, 5.15 km | Real 11–15. Games 03–05. | A turquoise and pink raised tower, stairs and railings stand on the open sand. The low orange sun and a narrow band of reflected light sit over the sea. |
| Ocean Drive finish tower, 6.82 km | Real 01–03, 06 and 09. Games 01 and 03. | The stepped art deco crown stands on the final sightline. A long boulevard of pastel hotels, café terraces and palms leads to the finish. |

Model the projecting brows, stepped hotel fins and station platforms. Bake palm shadows along the actual grade. Use original hotel elevations and a common foliage atlas, separate the beachwalk from the road, and keep the sea visible on Low. Animate neon, cleaner and rollerblader on ride time. Release their geometry, textures and lighting when leaving the race. Use ADRs 0021, 0023, 0030, 0034 and 0035 and the performance design for the two one-minute measurements.

## Calgary Stampede (#2214)

Keep the thirteen-stage GCN class and use its resistance changes for the grade. Calgary Tower and the Rockies are fixed distant landmarks. Split the street, oval and park scenery into distance-culled sections. The game references guide the view over the cyclist and the photos guide the proportions, colours and spacing.

| Rider view | References | Design |
| --- | --- | --- |
| Downtown parade, 0.12 km | Real 01–05 and 15. Games 01 and 03. | The red observation deck of Calgary Tower rises above sandstone façades and a kerb packed with white cowboy hats. Brass players march past bunting and a mounted parade rider. |
| Western parade float, 2.23 km | Real 01–05 and 10. Games 01 and 02. | A decorated flatbed rolls past the crowd. Straw bales and split rails separate the riders from plaid shirts, boots and Smithbilt hats. |
| Chuckwagon track, 4.54 km | Real 06, 07 and 13. Games 02 and 05. | Four horses in two pairs pull a canvas-topped wagon around a packed ochre oval. A low timber rail keeps the team outside the race lane. |
| Grandstand and chutes, 6.91 km | Real 08, 09, 13 and 14. Games 01 and 04. | The long canopy shades two tiers of spectators; white numbered bucking chutes face the dusty infield. The tower and pale Rockies remain on the horizon. |
| Elbow River Camp, 9.12 km | Real 02, 04 and 12. Games 03 and 05. | Tipis stand in a grassy clearing by the river. Participants and visitors gather along the footpath; the downtown towers remain visible beyond the trees. |
| Stampede Park midway, 12.65 km | Real 10–13 and 15. Games 01 and 04. | A Ferris wheel turns over striped food booths and flags. The high prairie sun casts short shadows across the closing straight. |

Batch distant hats, railings and canopy supports; keep the four articulated horses and their wagon near the rider. Advance their legs, the float axle and the wheel on ride time. Bake dirt ruts, storefront wear and recessed shadows into the low-tier surfaces. Release section buffers, atlas textures and moving assemblies on exit. Compare six matching rider captures and measure one minute at each tablet station. See ADRs 0021, 0023, 0030, 0034 and 0035.
