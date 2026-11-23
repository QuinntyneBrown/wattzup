# 0027. The marketing site: a `marketing` application with the pitch film

- **Status:** Accepted
- **Date:** 2026-11-21
- **Amends:** [0024](0024-telo-ride-workspace.md)

## Context

Telo Ride has a pitch film, "Meet Telo Ride" (`docs/videos/00-meet-telo-ride/`), written to make
someone who has never heard of Telo Ride want to ride with it. It has nowhere to be watched. The
`ride` app is the wrong home: it opens on Home or Connect Bike, its first screen pairs a bike, and
a page that is shared and linked from elsewhere gains nothing from its shell, its tokens bound to
the bike or its budgets. `AGENTS.md` says a further application needs its own ADR, and exempts a
marketing site from the requirement, design, mock and test rules. The owner's sibling repository
`popkin` made the same choice in its ADR 0017 and its `frontend/projects/marketing`, which this
follows.

## Decision

- **A further application, `marketing`,** at `frontend/projects/marketing`, a single page with no
  router, no session, no HTTP client and no request to the backend. Its root composes `wz-*`
  blocks; its fixed copy is in `content.ts`, in the words of the purpose in `AGENTS.md` and the
  film's script.
- **Its presentation lives in `components`,** as every presentation does: `wz-site-nav`,
  `wz-hero`, `wz-band`, `wz-film`, `wz-features` and `wz-site-footer`, beside the existing
  `wz-lockup` and `wz-button`. They take inputs and slots and inject nothing.
- **Dependency direction.** `marketing` → `components`, `api` (types only, through
  `components`). No library imports it, and it imports neither `domain` nor `video`: it never
  talks to the bike. ESLint enforces it as it does for `ride`.
- **The film** plays from the site's own origin, never a CDN or YouTube. Until the visitor presses
  play or picks a chapter the player shows a still over a `<video preload="none">`, so nothing
  heavy is fetched for a visitor who only reads. The narration is not in the picture, so the
  player carries `captions.vtt` as an English caption track.
- **Media.** `npm run media:sync` copies the film, its captions and the design system's
  photographs into `projects/marketing/public` before the site is served or built; the copies are
  ignored by git. The fonts and tokens are the `ride` app's, read from `projects/ride` so there is
  one copy of each.
- **Links to the app** are built from one `APP_URL` token. In development it is
  `http://localhost:4200`; a production build takes it from `--define TELO_RIDE_APP_URL=...`, and
  without it links are relative to the site's own origin.
- `npm run start:marketing` serves it on port 4201 and `npm run build:marketing` builds it to
  `dist/marketing`. CI builds it within its budgets beside the `ride` app.

## Consequences

- The marketing page can change without touching the app; the `ride` bundle is unaffected, since
  the new blocks are tree-shaken out of it.
- As a marketing site it has no requirement, mock or behaviour spec (`AGENTS.md`). The film's
  copy and the page's copy say the same things; a change to the purpose changes both.
- Where the site is hosted is not decided here. Until it is, it is a static build that any host can
  serve; `docs/deployment.md` names its build and its one build-time setting.
