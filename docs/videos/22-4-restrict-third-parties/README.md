# Slice 22.4 · Restrict third parties

Telo Ride reaches two third parties: YouTube for video and, with the rider's own key, Google's Map Tiles API. Every
response the API sends, the app's files included, carries the Content Security Policy that says so, with
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `frame-ancestors 'none'`
(L2-131 AC1, AC4). They are now written once, in `security-headers.json`, which the API embeds and the specs' server
sends, so every behaviour spec runs the app under the policy and fails on any refusal. A tracker's script or a call
home is refused before it leaves the page (AC2, AC3). The policy is static, with styles allowed inline, because the
service worker checks the shell by its bytes (ADRs 0018, 0032). A sign-in leaves no email, code, token, body or query
string in any span, metric or log (L2-132 AC3), and the stored code is only its hash (AC4).

- **Film:** [`22-4-restrict-third-parties.mp4`](22-4-restrict-third-parties.mp4), 1920×1080, 30 fps,
  1 min 53 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-131 AC1 to AC4, L2-132 AC3, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home served with its policy, at 1440 px in a browser over the aurora | Two guests, **only.** |
| 0:10 | 5 | `policy` | The built API's headers: the policy, nosniff and Referrer-Policy | A short list **per directive.** |
| 0:23 | 5 | `tracker` | A tracker's script and a call home, refused in the page | Refused before **it leaves.** |
| 0:36 | 5 | `guard` | YouTube taken out of `script-src` for one run, and the class video spec failing on the refusal | Every spec, **under the policy.** |
| 0:49 | 4 | `static` | Why the policy is static and styles may be inline | A static **policy.** |
| 0:59 | 5 | `telemetry` | An email put on a span for one run, and the telemetry test failing on it | Nothing of yours **in telemetry.** |
| 1:12 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | Home, **at every width.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `tracker`, a wipe and a push into `telemetry`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, served with the policy, with no refusal; the fake Bluetooth stack remembers the
  bike. The terminal in `policy` holds the real headers of the built API, run in Development on `localhost:5310`; the
  ones in `tracker`, `guard` and `telemetry` hold the real outputs of `e2e/content-security-policy.spec.ts` and of the
  two mutations that proved the checks, put in by hand for one run and taken out.
- **What this slice adds:** `security-headers.json` and the API reading it; `serve-dist.mjs` sending the same headers;
  `ContentSecurityPolicyFixture` and the shared fixture failing on a refusal; `e2e/content-security-policy.spec.ts`;
  and `PrivateTelemetryTests`. Every check passes.
- Not shown: TLS 1.2 and encryption at rest (L2-132 AC1, AC2), settings of the hosting platform; HTTPS redirection and
  HSTS, built and tested with the backend's hosting.
