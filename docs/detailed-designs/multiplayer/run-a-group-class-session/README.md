# Run a group class session

## Overview

A class in Telo Ride is a video with a bike plan that follows it. A rider can ride a class alone
at any time, or join a group session and ride it with other riders on a shared clock, ranked by
output. This feature covers how the multiplayer service schedules group sessions, seats riders,
refuses a full or started session and starts everyone's video and clock together.

**group session** — one live group class run by the multiplayer service, with a fixed start time
and up to 10 seats

**slot** — the start time of one group session; a class has one slot every 15 minutes

**output** — the energy a rider has put into the pedals since the start, in kilojoules (kJ)

Each open class has a group session starting every 15 minutes. A rider can join a session until it
starts, while fewer than 10 riders are seated. A rider who asks for a full session is refused with
`session_full` and offered the next one. When a session starts, bots fill the empty seats up to
10, and every client starts its video and ride clock at the same server time. Class Start
(`docs/detailed-designs/classes/start-a-class`) shows the next session and its seats; the class
ride (`docs/detailed-designs/classes/ride-with-a-group`) shows the board this session feeds.

## Description

**Frontend (Ride app)**

- **`RideHubClient.joinClassSession(classId, sessionId)`** — `api` contract method. The hub
  answers every join with a `JoinClassSessionResult`; the client resolves a seat with a
  `SeatAssignment` (session, start, jersey) and turns a refusal into a `RideHubError` whose
  `code` is `session_full`, `session_started`, `class_locked` or `session_not_found`, carrying
  the next session's id and start time when there is one. A refusal is an answer, not a hub
  error, so its code reaches the app (SignalR hides a server exception's message).
- **`LiveSessionStore`** — joins as the class ride connects, after measuring the clock offset,
  and joins again after every reconnect, keeping the seat (`L2-120` AC3). A refusal sets its
  `refused` code.
- **`ClassRideStore`** — `ride` store. On a refusal it leaves the ride: back to Class Start,
  which reads the sessions again and offers the next one (`L2-086` AC2, AC3), or to the Class
  Library for `class_locked`.
- **`LiveSessionStore`** and **`ServerClock`** — as in `multiplayer/run-a-race-session`. On
  `SessionStarted`, the store hands the local deadline to the `RideClock` and to the video player,
  so the video and the clock start together (`L2-122` AC3).

**Backend**

- **`RideHub.JoinClassSession(classId, sessionId)`** — sends `JoinClassSessionCommand` with the
  signed-in rider's id.
- **`JoinClassSessionCommandHandler`** — `Telo.Ride.Application`. An id that is not one of the
  class's slots (`GroupSessionSchedule.TryParse`), or a slot past the next two, is
  `session_not_found`, so nobody can make sessions far ahead. It reads the rider and refuses one
  below the class's opening level with `class_locked` (`L2-082`). It gets or creates the
  `GroupClassSession` for an upcoming slot (or finds a started one) in `IGroupSessionRegistry`,
  and asks it to seat the rider. The session refuses with `session_started` once its start has
  passed, offering the next session, and with `session_full` when 10 riders are seated, offering
  the one 15 minutes later (`L2-122` AC1, AC2, `L2-086` AC3). Adding the connection to the
  session's group and `SeatsChanged` come with slice 14.4, which is the first to send to it.
- **`GroupSessionSchedule`** — domain service in `Telo.Ride.Domain`. `Next(now, count)` yields
  the next slot start times after now, 15 minutes apart on the quarter hours (UTC), so a slot
  that starts now has started; `SessionId(classId, start)` names a slot's session
  (`hiit-cardio-30@20261121T1945Z`). The mocks' "7:39 PM" and "7:54 PM" are examples of what
  the app shows for the times it is given, not the anchor.
- **`GroupClassSession`** — `Telo.Ride.Domain`, one `ClassId` and slot. Its id is derived from
  the class id and the slot start, so two riders asking for the same slot reach the same
  session. `TrySeat(rider, name, now)` returns a `JoinOutcome` and the seat; a seated rider keeps
  their seat on every later join, even after the start, so a reconnect rejoins with it
  (`L2-120` AC3). Each seat takes the next jersey of a fixed palette of ten design-system jersey
  tokens (`lena`, `marco`, `priya`, `jwatts`, `ollie`, `kenji`, `ana`, `nova`, `rook`, `juno`),
  since a rider has no jersey of their own yet; a rider without a display name is "Rider".
- **`InMemoryGroupSessionRegistry`** — `Telo.Ride.Infrastructure`, behind
  `IGroupSessionRegistry`: the live sessions in the one API instance's memory (ADR 0025). A
  session goes three hours after its start, longer than any class, so the registry holds at most
  each class's next two slots and the sessions still riding.
- **`TickLiveSessionsCommandHandler`** — at a group session's start, calls `FillWithBots`, which
  seats bots up to 10, and sends `SessionStarted` with the start as server time (`L2-122` AC3).
- **`GetClassSessionsQueryHandler`** — serves `GET /api/classes/{classId}/sessions` for Class
  Start; its design belongs to `classes/start-a-class`. It reads the same schedule and seat counts.

**Slices.** Slice 14.2 builds `GroupSessionSchedule` and the two reads of it, `GET
/api/classes/{classId}/sessions` (Class Start) and `GET /api/classes/sessions` (every class's
next session, for the Class Library's chip). Both need a signed-in rider, since a session lists
its riders. Slice 14.3 adds `JoinClassSession`, `GroupClassSession` and the in-memory registry,
whose seats both reads now show; slice 14.4 starts the session, adds the session's hub group and
fills it with bots. A seat is held until the session goes; leaving a session (`L2-124`) frees
it in journey 15.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a
level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-122` (AC1) | `L1-020` | The service shall start a group session of each open class every 15 minutes. A rider shall be able to join until it starts, while fewer than 10 riders are seated. |
| `L2-122` (AC2) | `L1-020` | When a session is full, the service shall refuse a join with `session_full` and shall offer the next session. |
| `L2-122` (AC3) | `L1-020` | When a session starts, bots shall fill seats up to 10, and every client's video and clock shall start at the same server time (`L2-121` AC3). |

## Diagrams

### System context

Riders join a group class in Telo Ride; YouTube serves the class video that each client starts at
the shared time.

![C4 system context for running a group class session](diagrams/c4-context.png)

### Containers

The Ride app joins over the hub connection; the Telo Ride API reads the class catalogue and the
rider's level from the database and keeps the live session in memory.

![C4 container view for running a group class session](diagrams/c4-container.png)

### Components

`RideHub` sends the join to its handler, which uses `GroupSessionSchedule` and
`GroupClassSession`; `SessionTicker` starts the session on time.

![C4 component view for running a group class session](diagrams/c4-component.png)

### Class structure

`GroupClassSession` holds up to ten `SessionSeat`s and returns a `JoinOutcome`;
`GroupSessionSchedule` names and reads its slots; `InMemoryGroupSessionRegistry` keeps the live
sessions.

![Class diagram for running a group class session](diagrams/class-structure.png)

### Behaviour — join a group session

The handler seats the rider or refuses with a code that Class Start branches on (`L2-122` AC1,
AC2).

![Sequence diagram for joining a group session](diagrams/sequence-join-a-group-session.png)

### Behaviour — start the session

At the slot, bots fill the session to 10 and every client starts its video and clock at the same
server time (`L2-122` AC3).

![Sequence diagram for starting a group session](diagrams/sequence-start-the-session.png)
