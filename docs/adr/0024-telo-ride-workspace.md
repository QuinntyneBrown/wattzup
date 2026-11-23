# 0024. The Telo Ride workspace: `api`, `domain`, `components` and `ride`

- **Status:** Accepted
- **Date:** 2026-11-21
- **Amends:** [0013](0013-angular-workspace-with-libraries.md)

## Context

Telo Ride replaces the Wattzup frontend. ADR 0013 set up an Angular workspace of three projects,
`components`, `api` and the `wattzup` app, and ADRs 0017 and 0019 added a `browser` library and
a single composition root. L2-146 asks for one workspace with the libraries `api`, `domain` and
`components` and the application `ride`, with the bike's protocol, Bluetooth link, workout
engine and storage in `domain`, and `AGENTS.md` lets a concern earn its own library later.

Two questions came up when the workspace was rebuilt in slice 1.1. Where the code the old
`browser` library held goes, and how a presentation component in `components`, which may not
import the router, can be a router link (the app header's items, a "Back to Home" button).

## Decision

**Four projects, the same mechanics as ADR 0013, and attribute components for anything the app
links.**

- **Projects.** `frontend/projects/api`, `domain`, `components` and `ride`. The libraries compile
  from source through the path aliases `@telo/api`, `@telo/domain` and `@telo/components`; each
  keeps a private `package.json` with `"sideEffects": false` and no build target, as ADR 0013
  decided. The `browser` library is not carried over: browser-only implementations of the bike
  live in `domain/src/bluetooth/` and `domain/src/storage/`, and a `browser` project returns only
  when a concern earns one.
- **Dependency direction.** `ride` → `components`, `api`, `domain`; `domain` → `api`;
  `components` → `api` for types only; `api` → nothing. `frontend/eslint.config.js` enforces it
  with `@typescript-eslint/no-restricted-imports` per project folder, and keeps
  `navigator.bluetooth` inside `domain/src/bluetooth/` with `no-restricted-properties`. It is
  lint, not a test.
- **Attribute components.** A presentation component that must be a native element the app
  controls is an attribute component on that element, as Angular Material writes `a[mat-button]`:
  `a[wz-button]`, `button[wz-button]`, `a[wz-app-header-brand]`, `a[wz-app-header-link]`. It
  sets the mock's BEM class on its host and styles it through `:host`, so the element keeps its
  own role, focus and keyboard behaviour. The app adds `routerLink`, and `routerLinkActive` with
  `ariaCurrentWhenActive="page"` marks the current item; the component styles
  `:host([aria-current='page'])`. The ESLint selector rule accepts kebab-case attributes with the
  `wz` prefix for this.
- **Layout through slots.** A presentation block that holds router links, such as the app
  header, takes them as projected content (`slot="brand"`, `slot="nav"`, `slot="end"`) instead
  of inputs naming routes.

## Consequences

- `components` never imports `@angular/router`, and no presentation component reimplements
  `RouterLink` (modifier clicks, `href`, active state) behind an output.
- The current navigation item follows the router directly; no shell computes it, and an address
  that matches no screen marks none.
- A block's elements can be separate components (`app-header__nav-link` is `AppHeaderLink`).
  They belong to the block they are named for, so "never style another component's block"
  still holds.
- ADR 0013's `wattzup` and `browser` projects, its `@wattzup/*` aliases and its second
  composition root no longer exist; the rest of 0013 stands.
