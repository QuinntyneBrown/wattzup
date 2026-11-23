# 0032. The service worker is registered from the first screen's lazy chunk

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

L2-135 AC3 asks that, once the app has been opened, it starts without a network. Angular's own
service worker does that: the production build writes `ngsw-worker.js` and `ngsw.json` from
`ngsw-config.json`, and the worker answers the app's files from its caches.

Angular registers that worker through `provideServiceWorker` in `app.config.ts`. Its providers
bring `SwPush`, `SwUpdate`, the channel they talk through and their RxJS operators with them, and
in this workspace they add 6.3 kB to the initial chunk (main 277.41 kB to 283.72 kB, the initial
total past its 304 kB warning). Nothing in the app uses `SwPush` or `SwUpdate` yet, and AGENTS.md
puts the initial bundle above convenience. Its registration cannot move to the screens' lazy
parent route either: it runs as an app initializer, which only the root injector runs.

## Decision

- The worker, its configuration and the build step are Angular's, used as they are.
- The app registers it itself: `provideAppCache`, an environment initializer on the screens' lazy
  parent route (`ride.routes.ts`), loaded with the first screen and out of the initial chunk. It
  does what `provideServiceWorker` does with `registerWhenStable:30000`: it calls
  `navigator.serviceWorker.register('ngsw-worker.js')` once the app is stable, or after 30
  seconds, and posts `{ action: 'INITIALIZE' }` to a worker that takes control. A development
  build and a browser without service workers register nothing.
- When a slice needs `SwUpdate` (the update prompt of `platform/install-the-app`), it binds it on
  the same lazy route.

## Consequences

- Main grows by 40 bytes, the Angular core exports the lazy chunk now shares, instead of 6.3 kB.
- The registration repeats a few lines of Angular's, including the `INITIALIZE` message its worker
  listens for. An Angular upgrade that changes that message is caught by the app cache's
  acceptance test, which opens the app offline through the real worker.
- The behaviour specs block service workers, which would answer the page's requests before the
  fixtures could; only the app cache's spec allows them.
