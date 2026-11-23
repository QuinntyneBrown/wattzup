# 0014. A class catalogue in a file, with YouTube thumbnails as covers

- **Status:** Accepted, amended by [0017](0017-browser-edition.md) (the browser edition reads `classes.json` beside `index.html`); amended by [0019](0019-no-backend.md) (no backend: the catalogue is only ever read in the browser); amended by [0028](0028-class-catalogue-shipped-with-the-backend.md) (embedded in the backend, public, cached on the device; no file watch)
- **Date:** 2026-11-17
- **Amends:** [0012](0012-youtube-ride-along.md)

## Context

The 2026-11-17 Magic Patterns frames *Video Library* and *Video Workout* add a library of classes. A
class is a YouTube bike class together with the ride that follows it: its warm-up, intervals or
steady level, cool-down, levels, cadence aims and the point in the video where the ride starts. The
rider picks a class by its video cover and rides it (L1-014, mocks `class-library/*`, `class/*`).

The frames bundle the catalogue in the frontend code. The owner wants classes to be data: added,
changed and removed without rebuilding Wattzup. Classes differ in intervals, intensity and length,
and they are grouped onto shelves that the owner names.

Wattzup is one process next to the bike, with all of its state in memory (ADR 0004). AGENTS.md
asks for an ADR before adding a database. No screen edits a class: the mocks only browse a class
and ride it.

The frames show each video's YouTube thumbnail as its cover. ADR 0012 admitted only the YouTube
player and kept `img-src` same-origin.

## Decision

**The catalogue is a read-only JSON file that the backend reads. Covers are YouTube thumbnails.**

- The backend reads the file named by `Wattzup:Classes:Path` (default `classes.json`). It holds
  `shelves` (id, title, tagline, in display order) and `classes` (id, title, channel, focus,
  description, shelf, plan). A plan is any bike plan of L2-010, with or without a `video`
  (L2-077).
- Every class goes through the plan validation that `POST /api/workout` uses. One class that fails
  is left out with a warning; the rest are served. A file that cannot be read is an empty
  catalogue, and the backend still starts. A ride never depends on the catalogue.
- The file is watched. A saved change is served within 2 s. When a new file is invalid as a whole,
  the last valid catalogue is kept.
- `GET /api/classes` and `GET /api/classes/{id}` serve the catalogue read-only (L2-078). Riding a
  class posts the ordinary `POST /api/workout`, so the state contract and the engine do not change.
  Level changes on the class page apply to that ride only.
- Wattzup ships a default `classes.json` with the six classes of the mocks.
- **Amending ADR 0012:** the CSP gains exactly `img-src https://i.ytimg.com`. The cover URL is
  always `https://i.ytimg.com/vi/<video_id>/mqdefault.jpg`, built from the validated `video_id`. A
  submitted link never reaches it. A class without a video, or whose thumbnail fails to load, shows
  a bundled poster. The backend still never contacts YouTube.

## Consequences

- An owner adds a class by editing one file, with no build and no restart. The file can be kept
  under version control or copied between machines.
- There is no in-app editor. Adding one later means writing to the file. That needs its own mocks
  and requirements, and an ADR if it moves the catalogue into a database.
- One malformed class cannot take the library down, but it can quietly go missing. The warning in
  the log names it.
- The library loads thumbnails from YouTube, so YouTube can see that the library was opened from
  Wattzup's origin, as it can for the player (ADR 0012). Without internet access the cards show
  their posters, and every class still rides.
- Automated tests never load YouTube images. Playwright answers `i.ytimg.com` from a fixture, and
  backend tests read catalogue files from a per-test temporary directory.
