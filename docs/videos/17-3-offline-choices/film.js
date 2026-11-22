// Slice 17.3 · Offline choices. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are Race Setup on Old Town Criterium online and then offline, at 1440 px and three other widths, with its
// race modes close up, and Class Start for 30 Minute HIIT Cardio online and then offline, from shots.ts. Every position
// is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The pages at 1440 px, in CSS pixels, from shots/.
const PAGE = 'aspect-ratio:1440/900;object-fit:cover;object-position:top';
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';

// ── Act 1: the reason, on both screens, and back online ───────────────────────────────────────
opening('hook', {
  kicker: 'Slice 17.3 · Offline choices',
  words: 'Offline?',
  accent: 'Say why.',
  width: 900,
  device: (S) => onBrowser(S, 'setup-offline-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('race', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC4 · Race Setup', 'Riders online,', 'closed offline.', 110, 160, 860)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('race', 0, 0.2)), 'You’re offline. Riders online needs a network.')}
    ${fact(S, 2, onBeat(S, part('race', 0, 0.45)), 'Bots, the default, is chosen in its place')}
  </div>
  ${closeup('modes-online', `${at(960, 230, 450)};${REGION}`, pop(S, onBeat(S, part('race', 0, 0.1)), { tilt: -1 }))}
  ${closeup('modes-offline', `${at(1430, 290, 450)};${REGION}`, pop(S, onBeat(S, part('race', 0, 0.35)), { tilt: 2 }))}
  </div>`);

Film.scene('class', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-135 AC4 · Class Start', 'Group closed,', 'ride alone.', 110, 160, 820)}
  <div style="${at(110, 560, 780)}">
    ${fact(S, 1, onBeat(S, part('class', 0, 0.2)), 'You’re offline. Group classes need a network.')}
    ${fact(S, 2, onBeat(S, part('class', 0, 0.45)), 'Ride alone is chosen: Start class')}
  </div>
  ${closeup('class-offline-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('class', 0, 0.1)), { tilt: -1 }))}
  ${closeup('choice-offline', `${at(1160, 560, 620)};${REGION}`, pop(S, onBeat(S, part('class', 0, 0.4)), { tilt: 2 }))}
  </div>`, { before: 0.4 });

Film.scene('back', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-135 AC4', 'Back online,', 'open again.', 110, 160, 860)}
  ${terminal(S, 'Race Setup, as the spec saw it', [
    [`  online    ${ok('3 riders queuing now')}  ${dim('GET …/queue')}`],
    [`  offline   ${ok('You’re offline')}        ${dim('nothing asked')}`],
    [`  online    ${ok('3 riders queuing now')}  ${dim('asked again at once')}`],
  ], 0.2, `${at(110, 580, 1100)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('setup-online-xl', `${at(1100, 140, 700)};${PAGE}`, pop(S, onBeat(S, part('back', 0, 0.6)), { tilt: 1 }))}
  </div>`, { after: 0.7 });

Film.scene('words', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'multiplayerAvailability', 'One rule,', 'said in words.', 110, 160, 900)}
  <div style="${at(110, 560, 820)}">
    ${fact(S, 1, onBeat(S, part('words', 0, 0.2)), 'Offline first, whatever the last read said')}
    ${fact(S, 2, onBeat(S, part('words', 0, 0.4)), 'Online but no answer: can’t be reached')}
    ${fact(S, 3, onBeat(S, part('words', 0, 0.6)), 'Online and answered: open')}
  </div>
  ${terminal(S, 'BrowserNetworkStatus', [
    [`  navigator.onLine  ${dim('to start')}`],
    [`  window offline    ${ok('online() false')}`],
    [`  window online     ${ok('online() true')}`],
  ], 0.3, `${at(1000, 330, 800)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/setup-offline-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Offline,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('457 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('270 passed')} ${dim('2 new')}`],
    prompt('npm test'),
    [`  ${ok('1585 passed')} ${dim('7 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.44 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Closed offline,', 'saying why.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The reason shows the moment it’s offline')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Bots or Ride alone takes the choice')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Back online, asked again at once')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 17.3 · Offline choices' });

wipeInto('back');
bug();

Film.start();
