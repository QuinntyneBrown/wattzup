# 0022. Hosted on Azure Static Web Apps, deployed from main

- **Status:** Superseded by [0026](0026-api-serves-the-app.md)
- **Date:** 2026-11-20

## Context

Wattzup is a folder of static files (ADR 0019) that any HTTPS static host can serve. Riders need
one public address, kept current without anyone building or uploading by hand. The host must
answer every path that is not a file with `index.html`, and should send the Content-Security-Policy
as a header too, with `frame-ancestors` (ADR 0018).

## Decision

**The production build is served by Azure Static Web Apps (`swa-wattzup` in resource group
`rg-wattzup`, Free plan) at `https://wattzup.telo.to`, and every push to `main` that passes CI is
deployed.**

- `frontend/public/staticwebapp.config.json` is copied into the build. It rewrites unknown paths to
  `index.html`, sends the policy, `X-Content-Type-Options` and `Referrer-Policy` headers, and stops
  `index.html` and the service worker files from being cached stale. The service worker gets its
  own policy: every request the page makes, the YouTube player script and the class covers on
  `i.ytimg.com` included, is fetched by the worker under the worker's policy, so its
  `connect-src` allows those two origins. With the page's `connect-src 'self'` there, the player
  and the covers fail to load. The deploy job appends the commit to `ngsw-worker.js`: a browser
  reinstalls a worker only when its bytes change, so without the stamp a header change never
  reaches a worker already installed.
- The `deploy` job in `.github/workflows/ci.yml` runs after the Dashboard and behaviour-spec jobs,
  uploads the build the Dashboard job made, and signs in to Azure with GitHub's OIDC token through
  the `gh-wattzup-deploy` app registration (Contributor on the static web app only). Its federated
  credentials trust `refs/heads/main` under both subject forms GitHub may send:
  `repo:QuinntyneBrown/wattzup:ref:refs/heads/main` and the ID-based
  `repo:QuinntyneBrown@1749159/wattzup@1459369072:ref:refs/heads/main`. It reads the deployment token at run time, so the repository stores no
  secret.
- `wattzup.telo.to` is a CNAME to the app's `azurestaticapps.net` host, kept in the `telo.to` zone
  at Namecheap; Azure issues and renews its certificate.

## Consequences

- A merge to `main` is live within minutes, and a failing check stops the deploy.
- Other static hosts still work; the config file is ignored by them.
- Moving the deploy to another branch or a GitHub environment changes the OIDC subject, so the
  federated credential must change with it.
