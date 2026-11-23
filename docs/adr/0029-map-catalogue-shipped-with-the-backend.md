# 0029. The map catalogue: a JSON file shipped with the backend, public, cached on the device

- **Status:** Accepted
- **Date:** 2026-11-21
- **Follows:** [0028](0028-class-catalogue-shipped-with-the-backend.md)

## Context

The design *browse maps* made the map catalogue database rows, seeded from data, behind
`MapDefinition`. Since then ADR 0028 settled the same question for the class catalogue: a
read-only list, the same for every rider, changed only by the team, is a file embedded in the
backend, not a table.

The map catalogue is the same kind of data: seven maps (`L2-045` AC1), read-only, the same for
every rider. Nothing writes it at run time. A catalogue change must ship with no change to app
code (`L2-045` AC3). The rider browses maps and races bots before signing in (journey 9 adds
sign-in), and a solo or bots race has to start without a network once the app has been opened
(`L2-135` AC3). The backend's tests read no file (`AGENTS.md`).

## Decision

- **The catalogue is `Catalogue/maps.json`, embedded in `Telo.Ride.Infrastructure`,** in unlock
  order. Each map holds its id, name, route name, place, distance, climbing, rating, world, its
  thumbnail's address in the app, and its unlock rule: open from the start, a top-3 bots finish on
  a map, a number of stars on a map, or a rider level (`L2-040`). It is data, not code. There is
  no table, no seeder and no file watch.
- **`IMapCatalogue`** (`Telo.Ride.Application`) is the port the handler reads;
  **`EmbeddedMapCatalogue`** (`Telo.Ride.Infrastructure`) reads the embedded file once. A test
  replaces the port to serve a catalogue of its own.
- **Each locked map's goal is written by the backend** from its rule (`MapUnlock` in
  `Telo.Ride.Domain`): "Finish top 3 vs Bots on {map}", "Earn {n}★ on {map}" or "Reach rider
  level {n}" (`L2-040` AC6), so every screen shows the same words.
- **`GET /api/maps` is public,** marked `[AllowAnonymous]` on `MapsController`, as the class
  catalogue is.
- **The Ride app caches the last catalogue in `localStorage`** (`telo-ride.map-catalogue`) and
  reads it when the request fails, as it does the class catalogue (ADR 0028).
- **Thumbnails ship with the app** under `frontend/projects/ride/public/maps/`, cropped to 16:9 at
  384 × 216 from the mocks' world photos; the catalogue names each one. A map with a new world
  also needs that world's assets in the app (ADR 0021), so a new thumbnail travels with them.
- **Each map grows the fields its slices need:** the elevation profile and the 30:00 plan of
  intervals (`L2-045` AC2) join the catalogue with Race Setup and the race (slices 7.2 and 7.3),
  which read them.

## Consequences

- The map catalogue needs no migration and no seed, and the backend's tests stay file-free.
- Anyone can read the catalogue without signing in, which exposes nothing personal.
- A changed unlock rule changes the goals on every screen at once, with no app change.
