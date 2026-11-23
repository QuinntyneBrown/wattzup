# 0026. One App Service: the Telo Ride API serves the app and its backend as one origin

- **Status:** Accepted
- **Date:** 2026-11-21
- **Supersedes:** [0022](0022-hosted-on-azure-static-web-apps.md)

## Context

The app and its backend have to be one HTTPS site, so the session cookie is same-site and the app
calls `/api`, `/hubs` and `/health` on its own origin (L2-149, ADR 0025). Live races and group classes
run over SignalR, which needs WebSockets to stay smooth for an hour.

ADR 0022 serves the static build from Azure Static Web Apps. Its linked backends proxy only `/api/*`,
not `/hubs/*` or `/health/*`, and do not carry WebSockets, so SignalR would fall back to long polling
through a proxy with a request timeout. A reverse proxy in front of both (Azure Front Door) would
route every path and carry WebSockets, but adds a second paid service and a second configuration of
headers and routes. Hosting the app's build from the ASP.NET Core service is the platform's own
practice for a single-page app with an ASP.NET Core backend (the Angular template publishes the
build to `wwwroot`).

## Decision

**`Telo.Ride.Api` serves the production build of `ride` from its `wwwroot`, on one Azure App
Service (Linux, .NET 10, B1, WebSockets on), deployed from `main` after CI passes.**

- **Static files.** `UseStaticFiles` serves `wwwroot` without a session, before authentication.
  Every address that is not a file and not under `/api`, `/hubs` or `/health` answers `index.html`
  (the SPA fallback), so the app's routes load directly. `index.html` is never cached
  (`Cache-Control: no-cache`); the hashed bundles keep the default validators.
- **Backend paths stay the backend's.** An unknown address under `/api`, `/hubs` or `/health` never
  answers the app: without a session it is 401 ProblemDetails, as every endpoint (ADR 0025).
- **Headers.** Every response carries the headers of L2-131: the Content Security Policy (with
  `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff` and
  `Referrer-Policy: strict-origin-when-cross-origin`. They are set once, in
  `Telo.Ride.Api/Hosting/SecurityHeaders.cs`. The policy keeps `style-src 'unsafe-inline'` for
  Angular's component styles until slice 22.4 replaces it with a nonce.
- **Deploy.** The `deploy` job of `.github/workflows/ci.yml` runs on `main` after `lint`, `build` and
  `acceptance` pass. It publishes the API, copies `frontend/dist/ride/browser/` into its `wwwroot`,
  signs in to Azure with GitHub's OIDC token, runs the `migrate` command against the database, and
  only then deploys the package. Azure names come from repository variables (`docs/deployment.md`);
  the job is skipped until they are set, so CI stays green before the resources exist.
- **E2E is unchanged.** The behaviour specs still serve the build with `frontend/scripts/serve-dist.mjs`
  and answer the backend from fixtures (AGENTS.md); the API's own acceptance tests prove the hosting.

## Consequences

- One origin: the cookie is same-site and the app's requests need no CORS. One certificate, one
  custom domain, one service to secure.
- The app's shell is served by the API, so a deploy of either ships both, and an API that is down
  cannot serve a first visit; once loaded, a ride never waits for it (slice 17.2 caches the app).
- `wattzup.telo.to` on Static Web Apps is no longer deployed. The App Service, its custom domain and
  the database are provisioned by a person, as `docs/deployment.md` lists; this ADR provisions
  nothing.
