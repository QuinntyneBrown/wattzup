// Slice 24.1 · Switch theme. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are the running app from shots.ts; the terminals hold the real outputs of e2e/theme.spec.ts before the fix and after
// it. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc, ease, prog } = Film;
const { at, part, onBeat, onPhone, onBrowser, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;

// ── Act 1: the device's theme ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 24.1 · Switch theme',
  words: 'Dark beside the bike,',
  accent: 'light when asked.',
  width: 860,
  device: (S) => `${onPhone(S, 'home-dark-xs', 1170, 170, 340, S.beat(3), -4)}${onPhone(S, 'home-light-xs', 1500, 120, 340, S.beat(5), 4)}`,
});

Film.scene('first', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-143 AC2 · the first paint', 'Light from', 'the first paint.', 110, 140, 1250)}
  ${terminal(S, 'frontend · before the fix', [
    prompt('npx playwright test e2e/theme.spec.ts'),
    ['✘ A device that asks for light gets the light theme from the first paint', 'terminal__error'],
    ['    Expected: "rgb(246, 244, 239)"'],
    ['    Received: "rgb(10, 11, 13)"', 'terminal__error'],
    [''],
    [esc('# index.html: <html lang="en" data-theme="dark">  →  <html lang="en">'), 'terminal__dim'],
  ], onBeat(S, part('first', 0, 0.2)), `${at(110, 430, 1150)};font-size:22px`, { every: S.BEAT * 0.55 })}
  ${onPhone(S, 'home-light-xs', 1420, 110, 380, onBeat(S, part('first', 0, 0.55)), 3)}
  </div>`);

Film.scene('contrast', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-141 AC5 · every text role, every surface', '4.5 : 1,', 'both themes.', 110, 140, 1100)}
  ${terminal(S, 'frontend · before the fix', [
    ['✘ In the dark theme every text role reads at 4.5:1 on every surface', 'terminal__error'],
    ['    "--color-volt-fg on --color-raised: 4.48"', 'terminal__error'],
    ['✘ In the light theme every text role reads at 4.5:1 on every surface', 'terminal__error'],
    ['    "--color-ok-fg on --color-raised: 4.48"', 'terminal__error'],
    ['    "--color-success-fg on --color-raised: 4.48"', 'terminal__error'],
  ], onBeat(S, part('contrast', 0, 0.15)), `${at(110, 430, 1100)};font-size:21px`, { every: S.BEAT * 0.45 })}
  ${terminal(S, 'tokens.css · after', [
    ['dark  --color-volt-fg  #ff4521 → #ff5233   4.76'],
    ['light green-deep       #047857 → #04704f   5.00'],
    [`${ok('every pair ≥ 4.5')}`],
  ], onBeat(S, part('contrast', 0, 0.55)), `${at(1000, 760, 820)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

// ── Act 2: the rider's choice, the ride ───────────────────────────────────────────────────────
Film.scene('choice', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-164 AC3 · Settings', 'Match device,', 'Dark or Light.', 110, 160, 760)}
  ${onPhone(S, 'settings-theme-light-xs', 1300, 90, 400, onBeat(S, part('choice', 0, 0.15)), -3)}
  </div>`, { before: 0.4 });

Film.scene('ride', (S) => `
  <div class="fill field--blue">
  ${title(S, 'L2-143 AC3 · role tokens', 'A ride,', 'in light.', 110, 140, 620)}
  ${onBrowser(S, 'custom-ride-light-xl', 700, 170, 1120, onBeat(S, part('ride', 0, 0.1)), { ratio: 1440 / 900, tilt: -2 })}
  ${onPhone(S, 'home-dark-xs', 150, 430, 320, onBeat(S, part('ride', 0, 0.4)), 4)}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-light-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--ink" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Home in light,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 24.1 · Switch theme' });

wipeInto('choice');
bug();

Film.start();
