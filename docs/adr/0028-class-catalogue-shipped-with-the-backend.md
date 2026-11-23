# 0028. The class catalogue: a JSON file shipped with the backend, public, cached on the device

- **Status:** Accepted
- **Date:** 2026-11-21
- **Amends:** [0014](0014-class-catalogue-as-a-file.md)

## Context

ADR 0014 made the class catalogue a JSON file the backend reads, watched for changes, before Telo
Ride had a database. ADR 0019 then removed the backend, and ADR 0025 brought a thin one back with
a database for rider progress. The design *browse the class library* left open whether the
catalogue becomes database rows seeded from a file or stays a file (`<TO SUPPLY>`).

The catalogue is seven classes (`L2-080` AC1), read-only, the same for every rider, and changed
only by the team. Nothing writes it at run time. A database table would add an entity, a
migration, a seeder and a second copy of the same data, and every backend test would have to seed
it. The backend's tests read no file (`AGENTS.md`).

The rider browses classes and starts a solo class before signing in (journey 9 adds sign-in), and
a solo class has to start without a network once the app has been opened (`L2-135` AC3).

Of the seven classes, only 30 Minute HIIT Cardio has a published video (GCN Training,
`QUoToFsMNig`). The six Telo Ride Studio and Telo Ride Scenic classes have none yet.

## Decision

- **The catalogue is `Catalogue/classes.json`, embedded in `Telo.Ride.Infrastructure`.** It holds
  the shelves (id, title, tagline, in display order) and the classes (id, title, channel, focus,
  length, opens-at level, shelf, summary, world, video id, sync offset and plan), in catalogue
  order. It is data, not code: a change to it ships with the next deployment and changes no code.
  There is no table, no seeder and no file watch.
- **`IClassCatalogue`** (`Telo.Ride.Application`) is the port the handlers read;
  **`EmbeddedClassCatalogue`** (`Telo.Ride.Infrastructure`) reads the embedded file once. A test
  replaces the port to serve a catalogue of its own, so no test reads a file.
- **Every class is validated when it is served,** by `ClassPlanRules` (`Telo.Ride.Domain`): a
  YouTube video id of 11 characters from `A–Z a–z 0–9 _ -`, a sync offset of 0 or more, segment
  levels 1 to 32, durations above 0, and a plan total equal to the class length (`L2-080` AC4). A
  class that fails is left out and logged by id; the rest are served. The cover URL is still built
  from the validated video id only (ADR 0014).
- **`GET /api/classes` and `GET /api/classes/{id}` are public,** marked `[AllowAnonymous]` on
  `ClassesController`; every other endpoint keeps the authenticated fallback policy. An unknown or
  invalid class is 404 with the code `class_not_found`.
- **The Ride app caches the last catalogue in `localStorage`** (`telo-ride.class-catalogue`) and
  reads it when the request fails, so the library and a solo class read without a network. The
  catalogue is a few kilobytes and read once, as the remembered bike is; IndexedDB stays for what
  grows, such as rides waiting to be sent (`L2-135` AC1).
- **The six classes without a published video carry stand-ins:** GCN Training ride-alongs of the
  same focus from `main`'s catalogue, with their sync offsets there. Their plans follow the
  resistance profiles the mocks draw. The owner replaces each `videoId` and `syncOffsetSeconds`
  in `classes.json` when the class's own video is published.

## Consequences

- The catalogue needs no migration and no seed, and the backend's tests stay file-free.
- A catalogue change needs a deployment, not a restart only as ADR 0014 had; with one App Service
  (ADR 0026) a deployment is the way anything ships.
- Anyone can read the catalogue without signing in, which exposes nothing personal.
- Until the six videos are published, those classes play a GCN Training video whose efforts do
  not line up with their plans.
