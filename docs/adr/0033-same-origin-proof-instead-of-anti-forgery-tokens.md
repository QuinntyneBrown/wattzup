# 0033. A same-origin proof, not anti-forgery tokens, guards every change

- **Status:** Accepted
- **Date:** 2026-11-22
- **Follows:** [0026](0026-api-serves-the-app.md), [0032](0032-register-the-service-worker-from-the-first-screen.md)

## Context

A request that changes data must prove it came from the Ride app and not from another site (L2-127
AC2). The design *authenticate every request* planned ASP.NET Core's `IAntiforgery`: a token issued
in a script-readable `XSRF-TOKEN` cookie that Angular's `HttpClient` copies into an `X-XSRF-TOKEN`
header, checked on every `POST`, `PUT`, `PATCH` and `DELETE`, and a separate origin check for the
ride hub, which carries no header.

An anti-forgery token is bound to the signed-in identity and to a cookie token, so the server has
to issue a fresh pair with the app's shell, again after sign-in and again after sign-out. Since
ADR 0032 the service worker serves the shell from its cache, so the server is not asked for it;
after the browser restarts, the session cookie survives but the token's session cookie does not,
and the first change the rider makes would be refused. Keeping the pair alive would need a token
endpoint, a retry in every client and a rule for the outbox's requests that run before any read.

Since ADR 0026 the app and the API share one origin. Telo Ride runs only in Chrome and Edge
(L2-030), which send `Sec-Fetch-Site` on every request and `Origin` on every unsafe one and on a
WebSocket upgrade; a page cannot set or remove either header. The session cookie is already
`SameSite=Lax` and `__Host-` prefixed.

## Decision

A `SameOriginRequests` middleware in `Telo.Ride.Api` refuses, before authentication, every unsafe
request (any method but `GET`, `HEAD`, `OPTIONS` and `TRACE`) and every WebSocket upgrade that a
browser marks as coming from elsewhere:

- `Sec-Fetch-Site` is `same-origin` or `none`: allowed; any other value (`same-site`, `cross-site`):
  refused.
- No `Sec-Fetch-Site`, but an `Origin`: allowed only when it is the request's own scheme and host.
- Neither header: allowed. Only a client that is not a browser sends neither, and it cannot carry
  a rider's cookie without having it already.

A refusal is 403 with a ProblemDetails body and code `cross_origin`. The same rule covers the REST
API, sign-in included, and the ride hub's negotiation and upgrade, so there is one check rather
than two. This is the Fetch Metadata defence of the OWASP Cross-Site Request Forgery cheat sheet,
with the `Origin` check it names as the fallback.

## Consequences

- Nothing to issue, store, refresh or copy: the Ride app sends no extra header, and a shell served
  from the service worker's cache keeps working.
- The check needs a browser that sends Fetch Metadata. Telo Ride already requires Chrome or Edge;
  another browser that sends only `Origin` is still checked through it.
- A separate API origin would need this rule widened to that origin's app, with CORS; ADR 0026
  rules that out today.
- The design's `IAntiforgery`, `XSRF-TOKEN` cookie, `X-XSRF-TOKEN` header, `antiforgery_failed`
  code and `SameOriginHubFilter` are replaced by this middleware and the code `cross_origin`.
