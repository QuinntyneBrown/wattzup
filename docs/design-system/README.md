# Telo Ride design system

Extracted from [docs/mocks](../mocks/README.md) on 21 November 2026. Open [index.html](index.html) locally (from disk; no server needed). Press `t` on any page to switch between dark and light, or add `?theme=light`.

Telo Ride is dark first: every product page ships `<html data-theme="dark">`, and light is an addition the Magic Patterns design never drew. The system has 12 foundation pages, 59 component pages and 9 pattern pages; the mocks in `docs/mocks` now load its tokens and components.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ink, panel, raised; volt for you, gold for earned. Both themes and every checked pair. |
| [Typography](foundations/typography.html) | Inter Tight for the UI, Barlow Condensed for numerals and the wide italic. |
| [Spacing](foundations/spacing.html) | Tailwind's 4px scale with the design's half steps for tight insides. |
| [Layout](foundations/layout.html) | Breakpoints, columns, gutters, margins, containers and the app shell. |
| [Elevation](foundations/elevation.html) | Surfaces that lighten as they rise, four shadows, HUD glass and z-order. |
| [Shape](foundations/shape.html) | Six radii from chart marks to cards, and two border widths. |
| [Motion](foundations/motion.html) | Four durations, four easings, one unlock moment, reduced motion. |
| [Iconography](foundations/iconography.html) | Lucide on a 24-unit grid, 2px stroke, every icon the product uses. |
| [Theming](foundations/theming.html) | Dark first, light as an addition, two names for one decision. |
| [Responsive](foundations/responsive.html) | Mobile first at 640 and 1024, ride targets, the test matrix. |
| [Accessibility](foundations/accessibility.html) | The WCAG 2.2 AA commitments and how the system meets them. |
| [Content](foundations/content.html) | Voice, verbs, units, numbers and the microcopy library. |

## Components

Variants and states are the rows and columns of each page's state matrix; every page also shows both themes, the responsive rules, the keyboard map and the token table. Components with no source mocks belong to the core set every product needs and are designed in the Telo idiom from the tokens.

| Component | Family | Variants | States | Source mocks |
|---|---|---|---|---|
| [Button](components/button.html) | Actions | Primary, Light, Gold, Raised, Outline (+3) | Default, Hover, Focus, Active, Disabled, Loading | [race-setup](../mocks/pages/race-setup/default.html), [home](../mocks/pages/home/default.html), [connect-bike](../mocks/pages/connect-bike/pairing.html) (+4) |
| [Button group](components/button-group.html) | Actions | Default, Raised + strong, Toolbar button | Default, Hover, Focus, Active, Selected, Disabled | [class-library](../mocks/pages/class-library/default.html), [race-setup](../mocks/pages/race-setup/default.html), [dialog feedback](../mocks/dialogs/feedback/default.html) (+1) |
| [Link](components/link.html) | Actions | More link, Back link, Inline, Inline quiet | Default, Hover, Focus, Active, Visited, Current | [home](../mocks/pages/home/default.html), [race-setup](../mocks/pages/race-setup/default.html), [connect-bike](../mocks/pages/connect-bike/paired.html) (+1) |
| [Menu](components/menu.html) | Actions | Item, Danger item, Trigger, Text trigger | Default, Hover, Focus, Active, Disabled, Checked | [custom-ride](../mocks/pages/custom-ride/default.html), [dialog end-ride](../mocks/dialogs/end-ride/default.html), [home](../mocks/pages/home/default.html) (+1) |
| [Form field](components/form-field.html) | Inputs | Field | Default, Hover, Focus, Disabled, Read-only, Invalid | [dialog feedback](../mocks/dialogs/feedback/default.html), [custom-setup](../mocks/pages/custom-setup/default.html) |
| [Text field](components/text-field.html) | Inputs | Empty, Filled, With addon | Default, Hover, Focus, Disabled, Read-only, Invalid | [custom-setup](../mocks/pages/custom-setup/default.html) |
| [Textarea](components/textarea.html) | Inputs | Textarea, Counter | Default, Hover, Focus, Disabled, Read-only, Invalid | [dialog feedback](../mocks/dialogs/feedback/default.html) |
| [Select](components/select.html) | Inputs | Select, Raised | Default, Hover, Focus, Disabled, Placeholder, Invalid | [class-start](../mocks/pages/class-start/default.html), [connect-bike](../mocks/pages/connect-bike/default.html), [race-setup](../mocks/pages/race-setup/default.html) |
| [Checkbox](components/checkbox.html) | Inputs | Unchecked, Checked, Indeterminate | Default, Hover, Focus, Active, Disabled, Invalid | [dialog feedback](../mocks/dialogs/feedback/default.html) |
| [Radio group](components/radio-group.html) | Inputs | Mode option, Training mode, Plain radio | Default, Hover, Focus, Checked, Disabled, Invalid | [race-setup](../mocks/pages/race-setup/default.html), [custom-setup](../mocks/pages/custom-setup/default.html), [class-start](../mocks/pages/class-start/default.html) |
| [Switch](components/switch.html) | Inputs | Off, On | Default, Hover, Focus, Active, Disabled | [custom-setup](../mocks/pages/custom-setup/default.html), [dialog diagnostics](../mocks/dialogs/diagnostics/default.html), [profile](../mocks/pages/profile/default.html) |
| [Slider](components/slider.html) | Inputs | Work, Recover, Step button | Default, Hover, Focus, Active, Disabled | [custom-setup](../mocks/pages/custom-setup/default.html) |
| [Number stepper](components/number-stepper.html) | Inputs | Mini, Default, Ride | Default, Hover, Focus, Active, Disabled, At limit | [custom-setup](../mocks/pages/custom-setup/default.html) |
| [Form layout](components/form-layout.html) | Inputs | Summary link, Field, Submit | Default, Hover, Focus, Disabled, Invalid, Loading | [custom-setup](../mocks/pages/custom-setup/default.html), [dialog feedback](../mocks/dialogs/feedback/default.html), [dialog end-ride](../mocks/dialogs/end-ride/default.html) |
| [App header](components/app-header.html) | Navigation | Nav link, Level link, Full screen, Back link, Leave (lobby) (+2) | Default, Hover, Focus, Active, Current / pressed, Disabled | [home](../mocks/pages/home/default.html), [map-select](../mocks/pages/map-select/default.html), [class-library](../mocks/pages/class-library/default.html) (+10) |
| [Sidebar navigation](components/sidebar-nav.html) | Navigation | Link, Group heading | Default, Hover, Focus, Active, Current, Disabled | [home](../mocks/pages/home/default.html), [profile](../mocks/pages/profile/default.html), [race-setup](../mocks/pages/race-setup/default.html) |
| [Tabs](components/tabs.html) | Navigation | Pill, Underline | Default, Hover, Focus, Active, Selected, Disabled | [class-library](../mocks/pages/class-library/default.html) |
| [Breadcrumb](components/breadcrumb.html) | Navigation | Link, Ellipsis | Default, Hover, Focus, Active, Current, Disabled | [race-setup](../mocks/pages/race-setup/default.html), [class-start](../mocks/pages/class-start/default.html), [home](../mocks/pages/home/default.html) |
| [Pagination](components/pagination.html) | Navigation | Page, Step | Default, Hover, Focus, Active, Current, Disabled | [profile](../mocks/pages/profile/veteran.html), [class-library](../mocks/pages/class-library/default.html) |
| [Skip link](components/skip-link.html) | Navigation | Skip link | Default (hidden), Focus, Hover (while focused), Active, Disabled | [home](../mocks/pages/home/default.html), [race](../mocks/pages/race/default.html), [custom-ride](../mocks/pages/custom-ride/default.html) (+2) |
| [Container and grid](components/container.html) | Containers and overlays | Columns, Gutter, Margin, Page padding, Split (+1) | Base (0–639), sm (640), md (768), lg (1024+) | [home](../mocks/pages/home/default.html), [class-library](../mocks/pages/class-library/default.html), [profile](../mocks/pages/profile/default.html) (+4) |
| [Card](components/card.html) | Containers and overlays | Interactive, Selectable | Default, Hover, Focus, Active, Selected, Disabled | [connect-bike](../mocks/pages/connect-bike/paired.html), [home](../mocks/pages/home/default.html), [dialog diagnostics](../mocks/dialogs/diagnostics/packets.html) (+4) |
| [Dialog](components/dialog.html) | Containers and overlays | Close, Kind | Default, Hover, Focus, Active, Selected, Disabled | [dialog diagnostics](../mocks/dialogs/diagnostics/default.html), [dialog feedback](../mocks/dialogs/feedback/default.html), [dialog end-ride](../mocks/dialogs/end-ride/default.html) |
| [Popover](components/popover.html) | Containers and overlays | Library | Default, Hover, Focus, Active, Open, Disabled | [dialog end-ride](../mocks/dialogs/end-ride/default.html), [dialog feedback](../mocks/dialogs/feedback/default.html), [custom-ride](../mocks/pages/custom-ride/default.html) |
| [Tooltip](components/tooltip.html) | Containers and overlays | Icon button | Default, Hover (after 300ms), Focus (after 300ms), Active, Dismissed (Esc), Disabled | [custom-ride](../mocks/pages/custom-ride/default.html), [class-ride](../mocks/pages/class-ride/default.html), [dialog end-ride](../mocks/dialogs/end-ride/default.html) |
| [Divider](components/divider.html) | Containers and overlays | — | — | [home](../mocks/pages/home/default.html), [class-library](../mocks/pages/class-library/default.html), [profile](../mocks/pages/profile/default.html) (+6) |
| [Table](components/table.html) | Data display | Row, Old Town Criterium | Default, Hover, Focus, Active, Disabled, Current / sorted, Loading | [profile](../mocks/pages/profile/default.html), [map-select](../mocks/pages/map-select/default.html), [results](../mocks/pages/results/default.html) |
| [List](components/list.html) | Data display | .list__action, .map-row | Default, Hover, Focus, Active, Disabled, Current | [profile](../mocks/pages/profile/default.html), [map-select](../mocks/pages/map-select/default.html), [race-lobby](../mocks/pages/race-lobby/default.html) |
| [Description list](components/description-list.html) | Data display | Text value, Value with a link | Default, Hover, Focus, Active, Disabled, Tone, Loading | [race-setup](../mocks/pages/race-setup/default.html), [results](../mocks/pages/results/default.html), [dialog diagnostics](../mocks/dialogs/diagnostics/default.html) (+1) |
| [Avatar](components/avatar.html) | Data display | Avatar, Avatar as link, Dot | Default, Hover, Focus, Active, Disabled, You / current, Loading | [race-lobby](../mocks/pages/race-lobby/default.html), [race-setup](../mocks/pages/race-setup/peers.html), [class-start](../mocks/pages/class-start/default.html) (+2) |
| [Badge](components/badge.html) | Data display | Neutral, Gold, Volt, Heart, Rest (+2) | Default (on panel), With dot, On raised, On ink, In a disabled card | [connect-bike](../mocks/pages/connect-bike/default.html), [results](../mocks/pages/results/default.html), [dialog diagnostics](../mocks/dialogs/diagnostics/packets.html) |
| [Chip](components/chip.html) | Data display | .preset-chip, .preset-chip (pressed), .chip__remove | Default, Hover, Focus, Active, Disabled, Pressed | [custom-setup](../mocks/pages/custom-setup/default.html), [class-library](../mocks/pages/class-library/default.html) |
| [Stat](components/stat.html) | Data display | .stat--panel, .class-stat | Default, Hover, Focus, Active, Disabled, On target, Loading | [class-ride](../mocks/pages/class-ride/default.html), [race-setup](../mocks/pages/race-setup/default.html), [profile](../mocks/pages/profile/default.html) (+1) |
| [Code block](components/code-block.html) | Data display | Copy button, Code area | Default, Hover, Focus, Active, Disabled, Copied | [dialog diagnostics](../mocks/dialogs/diagnostics/packets.html), [custom-ride](../mocks/pages/custom-ride/needs-chromium.html) |
| [Toast](components/toast.html) | Feedback | Dismiss, Toast | Default, Hover, Focus, Active, Leaving, Disabled | [dialog end-ride](../mocks/dialogs/end-ride/default.html), [dialog diagnostics](../mocks/dialogs/diagnostics/default.html), [class-start](../mocks/pages/class-start/needs-chromium.html) (+1) |
| [Alert and banner](components/alert.html) | Feedback | Copy link, Dismiss | Default, Hover, Focus, Active, Done, Disabled | [home](../mocks/pages/home/unlocked.html), [class-start](../mocks/pages/class-start/needs-chromium.html), [custom-setup](../mocks/pages/custom-setup/needs-chromium.html) (+3) |
| [Inline message](components/inline-message.html) | Feedback | Field message | Default, Hover, Focus, Active, Disabled, Invalid, Success | [race-setup](../mocks/pages/race-setup/default.html), [race-lobby](../mocks/pages/race-lobby/someone-left.html), [custom-setup](../mocks/pages/custom-setup/needs-https.html) (+1) |
| [Progress bar](components/progress-bar.html) | Feedback | .progress, .xp-bar | Default, Hover, Focus, Active, Disabled, Loading, Complete (+1) | [home](../mocks/pages/home/default.html), [profile](../mocks/pages/profile/default.html), [custom-ride](../mocks/pages/custom-ride/default.html) (+1) |
| [Spinner](components/spinner.html) | Feedback | Button, Row | Default, Hover, Focus, Active, Disabled, Loading | [connect-bike](../mocks/pages/connect-bike/searching.html) |
| [Skeleton](components/skeleton.html) | Feedback | Class card, Recent row | Loading, Loaded, Reduced motion, Empty, Error | [class-library](../mocks/pages/class-library/default.html), [profile](../mocks/pages/profile/default.html) |
| [Empty state](components/empty-state.html) | Feedback | — | — | [custom-ride](../mocks/pages/custom-ride/no-bike.html), [profile](../mocks/pages/profile/new-rider.html), [class-library](../mocks/pages/class-library/new-rider.html) (+2) |
| [Error page](components/error-page.html) | Feedback | Back to Home, Copy link | Default, Hover, Focus, Active, Disabled, Done | [not-found](../mocks/pages/not-found/default.html), [custom-ride](../mocks/pages/custom-ride/needs-chromium.html), [connect-bike](../mocks/pages/connect-bike/unsupported-browser.html) (+1) |
| [Logo lockup](components/lockup.html) | Brand and progress | Home link, Static | Default, Hover, Focus, Active, Disabled | [home](../mocks/pages/home/default.html), [race-setup](../mocks/pages/race-setup/default.html), [race-lobby](../mocks/pages/race-lobby/default.html) (+4) |
| [Level badge](components/level-badge.html) | Brand and progress | Header link, Profile badge | Default, Hover, Focus, Active, Disabled | [home](../mocks/pages/home/default.html), [profile](../mocks/pages/profile/default.html), [results](../mocks/pages/results/default.html) |
| [Stars](components/stars.html) | Brand and progress | Default, md, lg | 0 of 3, 1 of 3, 2 of 3, 3 of 3 | [home](../mocks/pages/home/default.html), [map-select](../mocks/pages/map-select/default.html), [race-setup](../mocks/pages/race-setup/default.html) (+2) |
| [Photo tag](components/photo-tag.html) | Brand and progress | Label, Time | Bright photo, Dark photo, Locked photo, Default / hover / focus / active / disabled | [home](../mocks/pages/home/default.html), [class-library](../mocks/pages/class-library/default.html), [class-ride](../mocks/pages/class-ride/default.html) |
| [Section head](components/section-head.html) | Brand and progress | More link | Default, Hover, Focus, Active, Disabled | [home](../mocks/pages/home/default.html), [profile](../mocks/pages/profile/default.html) |
| [Map card](components/map-card.html) | Ride | Map tile, Map row, open, Map row, next, Map row, locked | Default, Hover, Focus, Active, Locked | [home](../mocks/pages/home/default.html), [map-select](../mocks/pages/map-select/default.html) |
| [Class card](components/class-card.html) | Ride | Class card, Locked card | Default, Hover, Focus, Active, Locked | [class-library](../mocks/pages/class-library/default.html), [home](../mocks/pages/home/default.html) |
| [Next ride](components/next-ride.html) | Ride | Call to action, Ride it (banner) | Default, Hover, Focus, Active, Disabled | [home](../mocks/pages/home/default.html), [results](../mocks/pages/results/default.html) |
| [Leaderboard](components/leaderboard.html) | Ride | Start grid, Race board, Class board, Standings | Row, You row, Bot, Open / ready | [race-lobby](../mocks/pages/race-lobby/default.html), [race](../mocks/pages/race/default.html), [class-ride](../mocks/pages/class-ride/default.html) (+1) |
| [Device list](components/device-list.html) | Ride | — | — | [connect-bike](../mocks/pages/connect-bike/default.html) |
| [Video](components/video.html) | Ride | Class Ride, Class Start | Loading (cover), Playing, Paused, Unavailable | [class-start](../mocks/pages/class-start/default.html), [class-ride](../mocks/pages/class-ride/default.html), [custom-ride](../mocks/pages/custom-ride/default.html) (+1) |
| [Plan chart](components/plan-chart.html) | Ride | Profile, Table disclosure, Warm-up, Work 1, Recover 1 (+14) | Default, Hover, Focus, Active, Disabled, Current | [class-start](../mocks/pages/class-start/default.html), [class-ride](../mocks/pages/class-ride/default.html), [class-library](../mocks/pages/class-library/default.html) (+2) |
| [Route profile](components/route-profile.html) | Ride | Bar button, Bar quiet (Leave), Bike, Profile | Default, Hover, Focus, Active, Disabled, Current | [race](../mocks/pages/race/default.html) |
| [Ride readout](components/ride-readout.html) | Ride | Dashboard power, Race delta, Class hint, Metric | Default, Hover, Focus, Active, Disabled (no data), On target, Under (+1) | [race](../mocks/pages/race/default.html), [custom-ride](../mocks/pages/custom-ride/default.html), [class-ride](../mocks/pages/class-ride/default.html) (+1) |
| [HUD panel](components/hud-panel.html) | Ride | Glass step, Class step, Dashboard step, Level bar, Sync toggle (+2) | Default, Hover, Focus, Active, Disabled, Current / open | [race](../mocks/pages/race/default.html), [class-ride](../mocks/pages/class-ride/default.html), [class-start](../mocks/pages/class-start/default.html) (+1) |
| [Countdown](components/countdown.html) | Ride | Ready toggle, Lobby clock, 3-2-1 step, Join button | Default, Hover, Focus, Active, Disabled, Pressed / current | [race-lobby](../mocks/pages/race-lobby/default.html), [class-start](../mocks/pages/class-start/default.html) |
| [Ride trace](components/ride-trace.html) | Ride | View tab | Default, Hover, Focus, Active, Disabled, Selected | [custom-ride](../mocks/pages/custom-ride/default.html) |

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | Layout, validation timing, error summary, sending and sent. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Which feedback for which action; spinner, skeleton or progress. |
| [Empty and error states](patterns/empty-and-error-states.html) | Copy formulas for Bluetooth, browsers, no bike and 404. |
| [Navigation and page structure](patterns/navigation.html) | The shell, the header and the three ride flows. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | Dialog, sheet, popover or page: and how they stack. |
| [Data tables and lists](patterns/data-tables-and-lists.html) | Density, sorting and responsive tables and lists. |
| [Notifications](patterns/notifications.html) | Toast, banner or inline; priority and dismissal. |
| [Content and tone](patterns/content-and-tone.html) | Applying the voice in real compositions. |
| [Live ride](patterns/live-ride.html) | Composing a ride: world, HUD, readouts, board and controls. |

## Tokens

- [`tokens/tokens.css`](tokens/tokens.css) — the source of truth: fonts, primitives (`--palette-*`), the light theme on `:root, [data-theme="light"]`, the dark theme on `[data-theme="dark"]` and its `prefers-color-scheme` twin (keep the two identical), role aliases on `:root, [data-theme]` so nested theme wrappers re-resolve, then reduced motion, `prefers-contrast` and `forced-colors`.
- [`tokens/tokens.json`](tokens/tokens.json) — W3C DTCG export generated from `tokens.css` (`$type`, `$value`, aliases as `{group.token}`, theme overrides under `$extensions`). Regenerate it after every token change.
- [`tokens/contrast-pairs.json`](tokens/contrast-pairs.json) — every foreground/background pairing the components rely on, checked in both themes.
- [`assets/components.css`](assets/components.css) — the component stylesheet: core kit, the components added during extraction, then one block per product area. Component tokens (`--btn-*`, `--field-*`, `--dialog-*`, `--toast-*`, `--banner-*`, `--menu-*`…) alias semantic tokens.
- [`assets/ds.css`](assets/ds.css) and [`assets/ds.js`](assets/ds.js) — documentation chrome only (navigation, swatches, live token values and contrast ratios, theme toggle).

Two names for one decision: the design's own theme names (`--color-ink`, `--color-panel`, `--color-raised`, `--color-line`, `--color-fg`, `--color-muted`, `--color-faint`, `--color-volt`, `--color-gold`, `--color-heart`, `--color-rest`, `--color-warn`, `--color-ok`, the `-fg` text variants) are the canonical semantic tokens, matching the Tailwind theme in Magic Patterns (`bg-ink`, `text-volt`). The role names (`--color-bg-canvas`, `--color-fg-muted`, `--color-danger-bg`, `--color-accent`…) alias them. See [Theming](foundations/theming.html).

## Drift found in the mocks

Every value in the system traces to a mock or to one of these corrections. "Fixed in the system" means `tokens.css` or `components.css` changed, so the mocks pick the fix up now that they load the system. "Rule for the product" means the mocks still show the old behaviour; the component or pattern page states the rule to build.

### Fixed in the system

| Mock | Issue | Resolution |
|---|---|---|
| all pages (`--color-faint`) | Tertiary text #636873 read 3.2:1 on panels (dark); #7d828c read 3.5:1 on paper (light) | Raised to #878d97 (dark) and #63686f (light); the old dark value is now `--color-line-strong` / `--color-disabled` |
| all pages (`--color-heart-fg`) | Error and heart-rate text #e5194b read 3.9:1 on panels in dark | Text uses #ff5a78 (`--palette-red-light`); the fill stays #e5194b |
| inputs, Feedback textarea, Custom Setup fields | Borders in `--color-line` read 1.3:1 (fails 1.4.11) | `--field-border: var(--color-line-strong)` (3.2:1 on panels); `.feedback__message` too |
| kit `.switch`, `.setup-toggle` | Off track read 1.2–1.3:1 against its surface | Off switch gets a `--color-line-strong` edge |
| `.banner--*`, `.browser-notice` | Hand-mixed 7–10% tints, unchecked | Status tokens `--color-{info,success,warning,danger}-{bg,border,fg}` and `--color-gold-subtle/-border`, all in `contrast-pairs.json` |
| `.pill--*` | 15% tints: volt 4.47:1 and rest 4.41:1 on panels in dark, four tones fail on raised in light | Pills read the checked status pairs (`--color-accent-subtle` + `--color-fg-accent`, `--color-info-*`…) |
| `.btn--danger` | Label used the primitive `--palette-white` | `--color-fg-on-danger`, with a checked `--color-danger-solid-hover` |
| Diagnostics, Feedback | Popover shadow 0 24px 60px -12px beside shadow-2xl 0 25px 50px -12px | Folded into `--shadow-4`: four shadows |
| light theme | Signal orange focus ring read 2.7:1 on paper-raised | `--color-focus-ring` is `--palette-signal-deep` in light |
| custom-ride/default | Lit level bars 2.8:1 on the light panel; log "ack" text 3.1:1 in dark | `--color-volt-fg` and `--color-muted` |
| progress fills (light) | Volt and green fills 2.8:1 and 1.6:1 against the track | Fills use the `-fg` tokens (≥ 3:1 both themes) |
| race/* | Light-theme terrain fill only applied at the page root | Follows any light-theme container |
| race/*, class-ride/* | Mid-ride buttons 36–40px (mocks open question 9) | 48px (`--target-ride`) under 640px; `.race-bar__btn` gains a press state |
| race-lobby/countdown | 3-2-1 words sat in an `aria-label` over a hidden numeral; the step entrance existed only as a note | Words inside the live region; the entrance animation is in `components.css` |
| components.css | Blanket `* { transition-duration: 0.01ms !important }` under reduced motion overrode the tokens, including the 1 s countdown timer | Reduced motion lives in the tokens (`--duration-fast/base/slow/loop/pulse` → 0); `--duration-deliberate` keeps the timer |
| components.css | Raw sizes (96px, 176px, 280px, 420px, 9px, 3px, 1.75rem; spinner 1s; skeleton 1.6s) | Space tokens, `--maps-aside-width`, `--setup-preview-width`, `--duration-loop`, `--duration-pulse` |
| all pages (logo) | Logo colours fixed, so the lockup could not sit on a photo; small lockup built from a `width` attribute; the wordmark hidden with `display: none` under 384px | Lockup tokens, `.lockup--sm`, `.lockup--on-photo`, `.lockup--mark` (keeps the name for screen readers) |
| home/*, map-select/* (light) | Locked tile name full colour while a locked row is muted; lock icon disappears on a greyed photo | `.map-tile--locked`; the lock sits on a glass disc |
| kit | Three hand-made segmented controls (`tier-tabs`, `pack__options`, `feedback__kinds`); three copies of a quiet danger button | `.segmented` with modifiers; `.btn--quiet-danger` |
| app-header (light) | XP bar fill `--color-gold` on `--color-raised` read 1.3:1 | Fill is `--color-gold-fg` (4.5:1 light, 9.4:1 dark) |
| class-library | `.tier-tabs` had no disabled or overflow behaviour | `aria-disabled`, horizontal scroll, state hooks |
| home (Next ride card) | The card's text column overflowed its grid track at 360px | `minmax(0, …)` columns; layout primitives `.grid`, `.stack`, `.cluster`, `.split` replace five hand-written aside grids |
| race-setup, custom-setup | `.mode-option` and `.ride-option` were two copies of one selectable card; the map, class and tile hover was written three times | `.card--select` with a real radio; `.card--interactive` |
| end-ride, feedback, diagnostics | Three panel shells, each with its own shadow; close buttons re-drew `.icon-btn` | One `.dialog` / `.popover` shell on `--shadow-4`; close is `.icon-btn` |
| dialogs/end-ride | `.ride-leave` sat on `--z-sticky`, its layer implied by the header | `--z-popover` |
| profile, home (rules) | Hand-mixed 60% row rules and duplicated 1px vertical rules | `.divider--subtle`, `.divider--vertical` |
| race-lobby | `.race-lobby__notice` and four "Lost the bike" / "Bluetooth is off" shells were hand-made | Banner tones (`.banner--rest`, `.banner--danger`) |
| components.css | Raw sizes left in area rules (28rem, 36rem, 42rem, 32rem, 24rem leads and cards; 16.25rem, 10rem, 13.75rem, 5.5rem on the dashboard) | Text-width scale `--layout-text-sm…2xl` (Tailwind max-w) and `--dashboard-*` area tokens |
| tooltip delay | 300ms delay was `--duration-fast × 2`, so reduced motion removed the wait | `--duration-delay-tooltip`, kept under reduced motion |
| docs chrome | `ds.css` restyled `.skip-link` and underlined every bare link, including specimens | The docs use `.ds-skip`; underlines are for prose only |
| race/*, class-ride/* (360) | Seen after the mocks were pointed at the system: the page moves down 12px | Expected: mid-ride header buttons are 48px under 640px |
| pages/not-found | The mocks' `ui.css` imported the area partials before the core kit, so `.container` silently overrode `.not-found`'s 36rem; in the system's order the 36rem won and centred the page | `.not-found` limits its children's measure (`--layout-text-xl`), keeping the page aligned with the header as the mock drew it |
| connect-bike/searching, pairing | The busy button faded to 40% like a disabled one | Busy buttons stay at full opacity: they are working, not off |
| dialogs/feedback/sending | Busy send repainted in `--color-volt-dim`: the label read under 4.5:1 | Keeps its volt fill |
| stars (light) | Earned stars in `--color-gold` read 1.6:1 on paper | `--color-gold-fg` (the deep gold on paper, unchanged in dark) |

### Rule for the product (mocks unchanged)

| Mock | Issue | Resolution |
|---|---|---|
| pages/*/* (lockup) | `aria-label` on a plain `<span>` | Standalone lockups get `role="img"`; inside the Home link the lockup is hidden and the link is named "Home" |
| map-select/*, class-library/* | Locked rows and cards are `<button disabled>`, so the unlock goal cannot be reached by keyboard | `aria-disabled="true"` with the goal in the accessible name |
| class-library | Tier filter is links with `role="tab"` | Buttons with `aria-pressed` ([Button group](components/button-group.html)) |
| class-start | `<a role="radio">` that navigates | A radio plus a separate start button |
| race-setup, custom-setup, feedback | Radio groups without roving tabindex; lowercase options capitalised by CSS | Roving tabindex; sentence-case copy |
| custom-ride | Library and Feedback triggers are links with `aria-haspopup` | Buttons |
| diagnostics | `<a role="switch">` | A button with `role="switch"` |
| feedback | Checkbox is a hidden input with a drawn box | Native `.checkbox` |
| custom-setup | Sliders can only be dragged (2.5.7) and have no value text; stepper values are silent spans, buttons named "Less Warm-up" | Step buttons and `aria-valuetext`; `<output aria-live>`, sentence-case names |
| custom-setup | YouTube field swaps the focus ring for a 1px border; offset input has no border | Shared focus ring; a labelled `.input` |
| custom-setup, feedback | Neither is a real `<form>` | `.form` ([Form layout](components/form-layout.html)) |
| dialogs/feedback/sending, connect-bike/pairing | Busy button uses `disabled` and drops focus; Feedback repaints it dim | `aria-disabled` + `aria-busy`; label "Sending…", opacity kept |
| dialogs/feedback/* | No failure state; the bug text stays under the kudos label | Danger banner and "Try again"; the field empties to the kind's placeholder |
| race/disconnected | Reconnect has no busy state; Lost the bike moves no focus and leaves the HUD usable | "Reconnecting…"; HUD `inert`, focus on Reconnect |
| race/*, class-ride/* | Leave exits mid-ride without asking; "Finish (prototype only)" in the header | Confirm first, as "Leave this ride?" does; Finish is not product |
| race/*, class-ride/* | No Diagnostics entry point in the ride headers (only Custom Ride has one) | Recorded on [Accessibility](foundations/accessibility.html) (consistent help) |
| end-ride, feedback | Popover placed with an invisible copy of the header; Close is an `<a>` | Anchor to the real trigger; Close is a `<button>` |
| custom-ride/no-bike, bluetooth-off | Overlay cards have no role; no-bike has no icon | Bluetooth off is `role="alert"`; the empty-state formula adds the bike icon |
| custom-ride/bluetooth-off vs connect-bike/bluetooth-off | Different title and verb | "Bluetooth is off" / "Try again" |
| connect-bike/unsupported-browser | "Try again" cannot fix a browser without Bluetooth | "Copy link" |
| connect-bike/paired | Pairing succeeds silently | `role="status"`: "Echelon EX-5s paired." |
| class-start/needs-chromium, needs-https | Join disabled with no reason | Reason linked with `aria-describedby` |
| custom-ride/needs-* | Panel buttons carry the banner class `.browser-notice__action` | Plain `.btn` |
| race/default, class-ride/default | No rule for what live boards announce | One throttled `role="status"` for your place; boards are never live regions; readouts never announced |
| race-lobby/countdown | `role="timer" aria-live="assertive"` changes only `aria-label` | Step text inside the live region |
| race-lobby/default | Your own seat has no Ready tick | Tick appears after "I'm ready" |
| race-lobby/someone-left | Notice names MarcoVelo, but Ollie R. leaves the grid | Notice and grid read the same event |
| results/class-group | Riders ranked above you have less output; 10 seats where Class Ride shows 9 | Boards sort by the value they show; one seat count per session |
| results/* | No state shows a ride crossing into a new level | `.level-up` ([Level badge](components/level-badge.html)) |
| profile/default | `.map-table` has no accessible name; hidden header cells have no `scope` | `aria-labelledby`; `scope="col"` |
| profile/default, custom-ride/default | XP bar and ride progress are `role="img"` | `role="progressbar"` with value text |
| profile/new-rider | "0-day streak"; "Nothing yet." has no action | Leave out zero facts; the first race is the action |
| map-select/default | "1 of 1 stars" | "1 star", "2 stars", "3 stars" |
| class-ride/*, class-start/* | No state for a video that fails to load | Keep the cover, add an inline warning |
| class-ride/paused | Overlay is ink at 70%, between the two scrim tokens | Kept; scrim tokens to review |
| dialogs/diagnostics/* | `dd[data-tone="ok"]` unstyled; packet file dated 2024-06-14 | Styled in `.dl`; examples use 2026 dates |
| race/default | Muted text on 70% glass drops to 2.9:1 over a bright patch of photo | Anything a rider must read on glass is `--color-fg`; `--color-glass` (ink 80%) documented on [Elevation](foundations/elevation.html) |
| race-setup, race-lobby, custom-setup, connect-bike | Straight apostrophes where the rest use ’ | Curly apostrophes ([Content](foundations/content.html)) |
| race/*, custom-ride/* | Watt gaps use a hyphen ("-47 W"); no-bike shows a delta against no reading | True minus (U+2212); show only the target until a reading arrives |
| class-ride vs custom-ride | "Aim 72" vs "Aim for 72" | "Aim for 72" |
| results/default, race-lobby/countdown | Notes say "opacity only" under reduced motion, but the tokens zero the fade | Documented as an instant cut on [Motion](foundations/motion.html) |
| class-library/default | Tempo Paceline shows 36:00 in the 30 min tier | Kept as data; flagged for the class catalogue |
| app-header streak (home, map-select, class-library, profile) | `aria-label` on a plain span is never read | Visually hidden text beside the flame |
| app-header and task headers | Four copies of one header rule set | Noted: candidate for one base header class |
| all ride headers | 34 Full screen buttons, 20 bike-status links and the bike-off icon rely on `title` | `.tooltip` on hover and focus ([Tooltip](components/tooltip.html)) |
| dialogs/* | Dialog titles are `h1` | `h2`; the page keeps its `h1` |
| home (unlock banner) | Carries a layout margin and has no dismiss | Spacing from the parent stack; `.banner__dismiss` |

### Deliberate deviations from the skill's defaults

| Area | Default | Telo Ride | Why |
|---|---|---|---|
| Radii | At most 5 + full | 6 + full (`xs` 2px … `2xl` 16px) | The design's Tailwind scale; `xs` is for chart marks only |
| Spacing | 4px grid | 4px grid plus half steps (`0-5`, `1-5`, `2-5`, `3-5`) | The design's tight insides (gap-1.5, py-2.5); inside components only |
| Theme default | Light on `:root`, OS preference | Dark on every product page | The design is dark; light is an addition |
| Type | Nothing below 12px | 11px (`--font-size-2xs`) for the XP label and HUD captions | The design's `text-[11px]`, never for body copy |
| Controls | sm 32 / md 40 / lg 48 | sm 36 / md 40 / lg 48 / xl 56 | The design's h-9 … h-14 |

## Verification

Run on 21 November 2026 from the repository root.

| Check | Command | Result |
|---|---|---|
| Structure | `python .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system` | 81 pages (12 foundations, 59 components, 9 patterns, index), 0 errors, 0 warnings |
| Contrast | `python .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css` | 102 pairs, 201 checks across both themes (three gold-fill pairs are dark-only; light uses `--color-gold-fg`): 201 passed, 0 failed |
| DTCG export | `python .claude/skills/extracting-design-systems/scripts/tokens_to_json.py docs/design-system/tokens/tokens.css` | `tokens.json`, 395 entries |
| Token coverage | every custom property in `tokens.css` has a `data-token` cell | 310 tokens, each on exactly one foundation page |
| Live ratios and overflow | every page at 360 px in both themes (Playwright, Chromium) | no horizontal page scroll; no `data-contrast` pair below its minimum |
| Mocks | `python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write` | 17 screens, 83 mocks, 0 errors, 0 warnings, all linking `../design-system/tokens/tokens.css` and `assets/components.css` |

**Screenshots reviewed** (Playwright CLI, full page, 360 and 1280 px, dark and light): `index.html`, `foundations/color.html`, `components/button.html`, `components/hud-panel.html`, `components/tabs.html`, plus every page by the agent that wrote it. Fixed from the review: the docs' prose-link rule outranked the nav brand link; ramp labels were unreadable on mid-tone chips (now a label chip); earned stars failed on paper.

**Mocks before and after the switch** (all 83 at 1280 dark and 360 light, pixel-diffed): 129 of 166 captures changed by more than 0.05 %, none by more than 1.1 % except the ride screens at 360 px (the 48 px header buttons push the page down 12 px). The changes reviewed are the logged fixes: tertiary text, field and switch edges, banner and pill tints, the light XP bar and stars, the lock disc on locked tiles, busy buttons at full opacity. One regression was found and fixed (Not found, see the drift log). The mocks' own `ui.css`, `ui/` partials and `fonts/` are removed; `assets/tokens.css` is a shim for the gallery.

Re-run the commands above after any change; the screenshot sweep is `python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/design-system --out docs/design-system/.cache/shots`.
