# Leave or end a custom ride

## Overview

A custom ride ends in one of three ways. The rider presses End, which saves and submits the ride
and opens Profile. The plan runs out, which does the same. Or the rider presses "Library", which
pauses the ride and asks "Leave this ride?" with the choice to save it, discard it or keep
riding.

> **ride submission** — record of a finished ride sent to the backend, which records it once per ride id and computes XP and progress from it (`L2-044`)

> **ride outbox** — IndexedDB queue that holds each ride submission until the backend has recorded it (`L2-135`)

> **leave popover** — modal popover (`role="dialog"`, `aria-modal="true"`) opened from "Library" that asks "Leave this ride?"

A ride shorter than one minute is not worth keeping: it is discarded, and Profile says it was too
short to save (`L2-108` AC3). Every saved ride goes through the ride outbox, so a ride ended
without a network is kept and sent when the network returns.

## Description

**Frontend — `ride` application**

- **`CustomRideStore`** (see *ride a custom workout*) — adds `end()`, `openLeave()`, `leave(choice)`
  and `keepRiding()`. `end()` runs on End and when the clock reaches the plan's length, and also
  while the bike is lost, saving the ride as far as it went (`L2-105` AC4). It submits the ride
  when it lasted a minute or more and opens Profile; under a minute it submits nothing and opens
  Profile with the notice.
- **`LeaveRideDialog`** (`wz-leave-ride-dialog`) — opened by the page through CDK `Dialog` with a
  flexible connected position under "Library", so it reads as a popover while keeping the
  dialog's focus trap and `aria-modal="true"`. It reads "Leave this ride?" and "You’re 6:52 in
  with 2.24 km ridden. The ride is paused while you decide.", puts initial focus on "Save ride and
  open library", offers "Discard and open library" and "Keep riding", and closes with a
  `LeaveChoice` (`save`, `discard` or `keep`); Escape and a press outside close it with none,
  which is "Keep riding". On a phone it fits within the side margins, at most 20 rem wide. Its BEM
  block is the mock's `ride-leave`.
- **`ProfilePage`** — reads `rideTooShort` from the navigation's state and shows the notice
  "That ride was under a minute, too short to save." (`role="status"`, the mock
  `profile/ride-too-short`).

**Frontend — `components` library**

- **`RideHeader`** — "Library" carries `aria-haspopup="dialog"` and `aria-expanded="true"` while
  the popover is open, and emits `library`; End emits `ended`.

**Frontend — `domain` and `api` libraries**

- **`RideRecorder`** (`domain/engine`, built for the class ride) — `facts(finishedAt)` gives the
  ride id, its seconds, distance, output, top power and speed, on-target share and speed samples.
  The store submits them with `kind: 'custom'` (`CustomRideFacts` in `api`).
- **`RideOutbox`** / `RIDE_OUTBOX` — `submit(ride)` keeps the ride on the device and sends it
  through `RIDES_API` once for its ride id, retrying offline (`L2-135`).
- **`RidesApi`** / `RIDES_API` / **`HttpRidesApi`** — `POST /api/rides`, owned by the
  progression subsystem.

**Backend** (progression subsystem, *keep progress on the backend*)

- **`RidesController`** → **`SubmitRideCommand`** — accepts `kind: "custom"` (`RideKind.Custom`,
  stored as text, so no migration), records the ride once per ride id, checks its plausibility
  (`L2-125` AC2) and computes XP as for a class: "Finished", on target and streak, with no place
  or podium line (`L2-037` AC6).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-107` | `L1-016` | Pressing "Library" in a running custom ride shall pause the ride and open a popover (`role="dialog"`, `aria-modal="true"`) reading "Leave this ride?" and "You’re 6:52 in with 2.24 km ridden. The ride is paused while you decide.", with "Library" showing `aria-expanded="true"`. Focus shall start on "Save ride and open library"; "Discard and open library" and "Keep riding" shall also be offered, and Escape shall act as "Keep riding". "Save ride and open library" shall save and submit the ride and open the Class Library; "Discard and open library" shall open it without saving; "Keep riding" shall close the popover with the ride still paused. On a phone the popover shall fit within the side margins, at most 20 rem wide. |
| `L2-108` | `L1-016` | Pressing End shall save and submit the ride without a confirmation and open Profile. When the clock reaches the plan's length, the ride shall end as by End. A custom ride under one minute shall be discarded when it ends, and Profile shall say it was too short to save. |

## Diagrams

### System context

The rider ends or leaves a custom ride in Telo Ride, which keeps the ride in the rider's history.

![C4 system context for leaving or ending a custom ride](diagrams/c4-context.png)

### Containers

The Ride app stores each saved ride in browser storage and submits it to the Telo Ride API, which
records it in the database.

![C4 container view for leaving or ending a custom ride](diagrams/c4-container.png)

### Components

`CustomRideStore` decides save, discard or keep riding; `RideRecorder` builds the submission and
`RideOutbox` delivers it through `RIDES_API`.

![C4 component view for leaving or ending a custom ride](diagrams/c4-component.png)

### Class structure

`LeaveRideDialog` returns a `LeaveChoice` to `CustomRideStore`. The store turns the recorder's
totals into a `RideSubmission` for the outbox, or discards them.

![Class diagram for leaving or ending a custom ride](diagrams/class-structure.png)

### Behaviour — leave this ride

"Library" pauses the ride and opens the popover. Each choice saves and leaves, discards and
leaves, or keeps the ride paused (`L2-107`).

![Sequence diagram for leaving a custom ride](diagrams/sequence-leave-this-ride.png)

### Behaviour — end a custom ride

End, or the end of the plan, saves and submits the ride and opens Profile; a ride under one
minute is discarded instead (`L2-108`).

![Sequence diagram for ending a custom ride](diagrams/sequence-end-a-custom-ride.png)

## Open questions

1. **The notice's words.** `L2-108` AC3 gives the meaning; the copy "That ride was under a minute,
   too short to save." and the mock `profile/ride-too-short` settle it.
2. **Leaving a short ride.** "Save ride and open library" on a ride under a minute discards it, as
   End does, and opens the Class Library with no notice; the Library has none to show.
3. **Library before the start.** With no bike and the ride not started there is nothing to save,
   so "Library" opens the Class Library at once, without the popover.
4. **The Class Library** is `/classes`.
5. **End while lost** saves the ride as far as it went and opens Profile, like End (`L2-105`
   AC4); the plan's end does the same.
