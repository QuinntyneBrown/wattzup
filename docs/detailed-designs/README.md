# Wattzup detailed designs

This tree holds the detailed designs for Wattzup: an Angular app that runs entirely in the rider's browser, talks to the bike over Web Bluetooth and keeps its history in IndexedDB, with no Wattzup server (ADR 0019). Each feature is a vertical slice with its own `README.md` and rendered diagrams, and traces to the level-2 requirements in [`docs/specs/L2.md`](../specs/L2.md).

| Subsystem | Feature | L2 requirements |
|---|---|---|
| bike-connectivity | [Connect the bike](bike-connectivity/connect-the-bike/README.md) | `L2-001`, `L2-002`, `L2-003`, `L2-004`, `L2-090`, `L2-091` |
|  | [Check browser support](bike-connectivity/check-browser-support/README.md) | `L2-089` |
|  | [Simulate the bike](bike-connectivity/simulate-the-bike/README.md) | `L2-099` |
| telemetry | [Decode bike telemetry](telemetry/decode-bike-telemetry/README.md) | `L2-005`, `L2-006`, `L2-007` |
|  | [Estimate power and ride totals](telemetry/estimate-power-and-totals/README.md) | `L2-049` |
| resistance-control | [Set resistance](resistance-control/set-resistance/README.md) | `L2-008`, `L2-009`, `L2-016`, `L2-020`, `L2-047` |
|  | [Show resistance](resistance-control/show-resistance/README.md) | `L2-019` |
|  | [Log resistance commands](resistance-control/log-resistance-commands/README.md) | `L2-048` |
| workouts | [Start and stop a workout](workouts/start-and-stop-workout/README.md) | `L2-010`, `L2-017`, `L2-046` |
|  | [Run an interval workout](workouts/run-interval-workout/README.md) | `L2-011`, `L2-012`, `L2-013`, `L2-045`, `L2-060` |
|  | [Set up a ride](workouts/set-up-ride/README.md) | `L2-010`, `L2-029`, `L2-052`, `L2-059`, `L2-080` |
|  | [Show the workout countdown](workouts/show-workout-countdown/README.md) | `L2-024`, `L2-025` |
|  | [Play workout cues](workouts/play-workout-cues/README.md) | `L2-027` |
|  | [Play ride sound](workouts/play-ride-sound/README.md) | `L2-129` |
|  | [Ride along to a video](workouts/ride-along-video/README.md) | `L2-076`, `L2-010`, `L2-014`, `L2-029`, `L2-059`, `L2-097` |
| live-state | [Run rides](live-state/run-rides/README.md) | `L2-014`, `L2-038`, `L2-050`, `L2-092`, `L2-093` |
| dashboard | [Show connection status](dashboard/show-connection-status/README.md) | `L2-018`, `L2-054`, `L2-058` |
|  | [Show live metrics](dashboard/show-live-metrics/README.md) | `L2-021`, `L2-022`, `L2-026`, `L2-028`, `L2-076` |
|  | [Responsive and accessible layout](dashboard/responsive-accessible-layout/README.md) | `L2-040`, `L2-041`, `L2-061` |
|  | [Dialogs and notifications](dashboard/dialogs-and-notifications/README.md) | `L2-023`, `L2-051`, `L2-053` |
|  | [Not-found page](dashboard/not-found-page/README.md) | `L2-056` |
| classes | [Load the class catalogue](classes/load-class-catalogue/README.md) | `L2-077`, `L2-096` |
|  | [Browse the class library](classes/browse-classes/README.md) | `L2-077`, `L2-078`, `L2-079`, `L2-097` |
|  | [Ride a class](classes/ride-a-class/README.md) | `L2-080`, `L2-078`, `L2-010`, `L2-029`, `L2-052`, `L2-059`, `L2-076` |
| world-ride | [Assign a class scene](world-ride/assign-class-scene/README.md) | `L2-100`, `L2-102`, `L2-077`, `L2-078`, `L2-014` |
|  | [Ride in a world](world-ride/ride-in-a-world/README.md) | `L2-102`, `L2-103`, `L2-104`, `L2-105`, `L2-108`, `L2-109`, `L2-080`, `L2-051`, `L2-046`, `L2-047` |
|  | [Draw the class scene](world-ride/draw-class-scene/README.md) | `L2-101`, `L2-106`, `L2-110`, `L2-049`, `L2-102` |
|  | [Show simulated pacers](world-ride/show-simulated-pacers/README.md) | `L2-107` |
|  | [Render the scene at a quality tier](world-ride/render-scene-quality/README.md) | `L2-111`, `L2-110`, `L2-101` |
|  | [Play world music](world-ride/play-world-music/README.md) | `L2-128`, `L2-103`, `L2-101` |
| history | [Record a session](history/record-session/README.md) | `L2-081`, `L2-014`, `L2-051` |
|  | [Keep sessions](history/keep-sessions/README.md) | `L2-082`, `L2-094` |
|  | [Review a session](history/review-session/README.md) | `L2-083`, `L2-084`, `L2-085`, `L2-087`, `L2-051`, `L2-058` |
|  | [Track progress](history/track-progress/README.md) | `L2-086`, `L2-087`, `L2-083`, `L2-079` |
| platform | [Workspace structure](platform/host-and-structure/README.md) | `L2-044` |
|  | [Build and host Wattzup](platform/build-and-host/README.md) | `L2-088`, `L2-097`, `L2-098` |
|  | [Diagnostics](platform/diagnostics/README.md) | `L2-023`, `L2-095` |

The treadmill subsystem and the nearby-machines feature were removed when Wattzup became bike only ([ADR 0016](../adr/0016-bike-only.md)). The designs of the former .NET server (Bluetooth platform transports, the event stream, the status snapshot, the raw packet log file, API security, observability, the served power trace and the Unlock page) were removed with it ([ADR 0019](../adr/0019-no-backend.md)); the designs of the former browser edition now sit in the subsystems above.
