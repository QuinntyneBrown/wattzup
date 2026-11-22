// Slice 23.2 · Touch and keyboard. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are the running app from shots.ts: Settings and the custom ride at 390 px with the square each control's tap
// is checked across drawn over them, the class ride's header, the focus ring at 1440 px, and Settings across the
// widths. The terminals hold the real outputs of the spec before the fix and of the focus-style mutation. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const REGION = 'height:auto';

// ── Act 1: touch ──────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 23.2 · Touch and keyboard',
  words: 'Tap.',
  accent: 'Tab.',
  width: 820,
  device: (S) => `
    ${onBrowser(S, 'home-focus-xl', 940, 300, 900, S.beat(3), { tilt: 3 })}
    ${onPhone(S, 'settings-display-xs', 1500, 420, 300, S.beat(4), -4)}`,
});

Film.scene('taps', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-140 AC2 · 390 px', 'A thumb,', 'not a pixel.', 110, 160, 760)}
  ${onPhone(S, 'settings-display-xs', 900, 90, 380, onBeat(S, part('taps', 0, 0.1)), -3)}
  ${onPhone(S, 'settings-taps-xs', 1360, 90, 380, onBeat(S, part('taps', 0, 0.4)), 3)}
  </div>`);

Film.scene('found', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'e2e/touch-and-keyboard.spec.ts', 'Thirty-four', 'misses.', 110, 140, 760)}
  ${terminal(S, 'frontend · before the fix', [
    prompt('npx playwright test e2e/touch-and-keyboard.spec.ts'),
    ['✘ a tap within 44 px reaches every control of Settings', 'terminal__error'],
    ['    a.side-nav__link "World" 88×24   button.switch "Ride sound" 44×24 …'],
    ['✘ … of the Class Library   button.tier-tabs__tab "All" 43×44', 'terminal__error'],
    ['✘ … of the custom workout  input.range 350×24', 'terminal__error'],
    ['✘ a tap within 48 px … of a class ride   button.btn "Pause" 48×36', 'terminal__error'],
    ['✘ … of a custom ride   button.ride-view__tab "Power vs. plan" 96×24', 'terminal__error'],
  ], S.beat(2), `${at(110, 470, 1300)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('ride', (S) => `
  <div class="fill field--bone">
  ${title(S, 'Mid-ride · below 640 px', 'Forty-eight', 'pixels.', 110, 160, 700)}
  ${onPhone(S, 'class-ride-xs', 820, 90, 380, onBeat(S, part('ride', 0, 0.12)), -2)}
  ${onPhone(S, 'custom-ride-taps-xs', 1300, 90, 380, onBeat(S, part('ride', 0, 0.3)), 3)}
  ${closeup('class-ride-header-taps', `${at(110, 560, 520)};${REGION}`, pop(S, onBeat(S, part('ride', 0, 0.55)), { tilt: -2 }))}
  </div>`);

// ── Act 2: keyboard ───────────────────────────────────────────────────────────────────────────
Film.scene('focus', (S) => `
  <div class="fill field--blue" ${push(S)}>
  ${title(S, 'L2-140 AC1 · 1280 px', 'Every stop,', 'a ring.', 110, 140, 700)}
  ${onBrowser(S, 'home-focus-xl', 760, 160, 1060, onBeat(S, part('focus', 0, 0.1)), { tilt: -2 })}
  ${closeup('home-focus-detail', `${at(110, 520, 560)};${REGION}`, pop(S, onBeat(S, part('focus', 0, 0.4)), { tilt: 2 }))}
  ${closeup('class-card-focus', `${at(1380, 640, 420)};${REGION}`, pop(S, onBeat(S, part('focus', 0, 0.65)), { tilt: -3 }))}
  </div>`, { before: 0.4 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/fixtures/screens.ts', 'Tapped and', 'tabbed.', 110, 160, 640)}
  ${terminal(S, 'frontend · the focus style taken out, for one run', [
    ['# styles.scss without its :focus-visible outline', 'terminal__dim'],
    prompt('npx playwright test e2e/touch-and-keyboard.spec.ts -g "Tab reaches"'),
    ['✘ Tab reaches every control of Home, each with a focus ring', 'terminal__error'],
    ['  15 failed: every screen, "ring": false', 'terminal__error'],
    [''],
    ['# put back', 'terminal__dim'],
    prompt('npx playwright test e2e/touch-and-keyboard.spec.ts'),
    [`  ${ok('30 passed')}   15 screens × a tap at 390 px and Tab at 1280 px`],
  ], onBeat(S, part('proof', 0, 0.2)), `${at(780, 220, 1040)};font-size:23px`, { every: S.BEAT * 0.55 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/settings-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Settings,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 23.2 · Touch and keyboard' });

wipeInto('focus');
bug();

Film.start();
