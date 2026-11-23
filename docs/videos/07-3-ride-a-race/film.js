// Slice 7.3 · Ride a race. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a race on Old Town Criterium against medium bots at 5:01 from shots.ts, on the fake Bluetooth.
// Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;

// ── Act 1: the race opens ────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 7.3 · Ride a race',
  words: 'The bike,',
  accent: 'on the course.',
  width: 860,
  device: (S) => onBrowser(S, 'race-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('bar', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-058 AC1 · AC2', 'The top bar,', 'full screen.', 110, 200, 640)}
  <div style="${at(110, 600, 640)}">
    ${fact(S, 1, onBeat(S, part('bar', 0, 0.35)), 'Cathedral Circuit · vs Bots, medium')}
    ${fact(S, 2, onBeat(S, part('bar', 0, 0.62)), 'The clock: 5:01 of 30:00')}
  </div>
  ${onBrowser(S, 'race-xl', 820, 220, 980, onBeat(S, part('bar', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('power', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-059 AC1 to AC3', 'Power first,', 'then the rest.', 110, 200, 640)}
  ${closeup('power', at(900, 160, 820), pop(S, onBeat(S, part('power', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('interval', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-061', 'Work, 1 of 8,', '0:29 left.', 110, 200, 700)}
  ${closeup('interval', at(880, 320, 900), pop(S, onBeat(S, part('interval', 0, 0.15)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('level', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-063 AC2 · L2-027', 'Each segment,', 'its level.', 110, 200, 640)}
  ${terminal(S, 'target resistance written to the bike', [
    [`0:00  warm-up   ${ok('F0 B1 01 08 AA')}  ${dim('level 8')}`],
    [`5:00  work      ${ok('F0 B1 01 18 BA')}  ${dim('level 24')}`],
    [`5:30  recover   ${ok('F0 B1 01 06 A8')}  ${dim('level 6')}`],
  ], S.beat(2), `${at(800, 330, 1040)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`);

// ── Act 2: the road ──────────────────────────────────────────────────────────────────────────
Film.scene('route', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-062 · from main', 'The road,', 'as main draws it.', 110, 160, 700)}
  <div style="${at(110, 520, 680)}">
    ${fact(S, 1, onBeat(S, part('route', 0, 0.3)), '+2.2 % where the first effort climbs')}
    ${fact(S, 2, onBeat(S, part('route', 0, 0.5)), '10 m climbed of a 43 m profile')}
  </div>
  ${closeup('route', at(790, 300, 1080), pop(S, onBeat(S, part('route', 0, 0.1)), { tilt: -1.5 }))}
  </div>`, { before: 0.4 });

Film.scene('speed', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-059 AC3 · L2-062 AC1', 'Power is', 'speed.', 110, 200, 640)}
  ${terminal(S, 'VirtualSpeedModel', [
    [`speed = 10 × ∛(W ÷ 20) km/h`],
    [''],
    [`371 W  ${ok('26.5 km/h')}`],
    [`143 W  ${ok('19.3 km/h')}  ${dim('a minute: 0.32 km')}`],
    [`  0 W  ${dim('stopped, no further')}`],
  ], S.beat(2), `${at(780, 280, 1060)};font-size:22px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('resist', (S) => `
  <div class="fill field--panel" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-063 AC1 · L2-028', 'Your hand', 'on the level.', 110, 200, 640)}
  ${closeup('resist', at(900, 300, 760), pop(S, onBeat(S, part('resist', 0, 0.15)), { tilt: 1.5 }))}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/race-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one race.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'race-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('82 passed')}`],
    prompt('npm test'),
    [`  ${ok('318 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.48 kB')} ${dim('of 288')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Ten behaviour specs, five panels and the layout')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), "main's route profile and the speed, unit tested")}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 7.3 · Ride a race' });

wipeInto('speed');
bug();

Film.start();
