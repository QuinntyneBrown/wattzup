// Slice 7.5 · Finish, pause or leave a race. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are races on Old Town Criterium from shots.ts, on the fake Bluetooth: paused, lost, a DNF, parked
// and nearing the line. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the ways out ──────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 7.5 · Finish, pause or leave',
  words: 'Go to the line,',
  accent: 'or not.',
  width: 860,
  device: (S) => onBrowser(S, 'paused-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('bar', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-069 AC1 · AC2 · L2-068 AC3', 'Leave or End,', 'no questions.', 110, 160, 700)}
  <div style="${at(110, 560, 680)}">
    ${fact(S, 1, onBeat(S, part('bar', 0, 0.35)), 'Bots: Leave, and no Pause')}
    ${fact(S, 2, onBeat(S, part('bar', 0, 0.62)), 'Solo: Pause and End; both open Race Setup')}
  </div>
  ${closeup('bar-bots', at(900, 300, 700), pop(S, onBeat(S, part('bar', 0, 0.12)), { tilt: -1.5 }))}
  ${closeup('bar-solo', at(1000, 560, 840), pop(S, onBeat(S, part('bar', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('pause', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-068 AC1', 'Paused,', 'held still.', 110, 200, 640)}
  ${onBrowser(S, 'paused-xl', 820, 220, 980, onBeat(S, part('pause', 0, 0.1)), { tilt: 1.5 })}
  </div>`, { before: 0.4 });

Film.scene('pedal', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-068 AC2', 'Resume,', 'or just pedal.', 110, 200, 700)}
  ${terminal(S, 'a paused solo race, once a second', [
    [`press Pause at 90 rpm   ${dim('still paused')}`],
    [`90 rpm                  ${dim('still paused: the same stroke')}`],
    [`0 rpm                   ${dim('stopped')}`],
    [`85 rpm                  ${ok('carries on within a second')}`],
  ], S.beat(2), `${at(800, 330, 1040)};font-size:22px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

// ── Act 2: the bike goes away ────────────────────────────────────────────────────────────────
Film.scene('lost', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-070 AC1 · AC2', 'Lost the bike,', 'coasting.', 110, 160, 700)}
  <div style="${at(110, 520, 680)}">
    ${fact(S, 1, onBeat(S, part('lost', 0, 0.3)), '32.1 km/h falls to a stop over 15 s')}
    ${fact(S, 2, onBeat(S, part('lost', 0, 0.5)), 'Raise and Lower off; Reconnect at hand')}
  </div>
  ${onBrowser(S, 'lost-xl', 820, 220, 980, onBeat(S, part('lost', 0, 0.1)), { tilt: -1.5 })}
  </div>`);

Film.scene('dnf', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-070 AC3 · AC4', 'Fifteen seconds,', 'then a DNF.', 110, 200, 600)}
  ${onBrowser(S, 'dnf-xl', 820, 220, 980, onBeat(S, part('dnf', 0, 0.1)), { tilt: 1.5 })}
  </div>`);

Film.scene('parked', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-070 AC5', 'Solo,', 'parked.', 110, 200, 640)}
  ${onBrowser(S, 'parked-xl', 820, 220, 980, onBeat(S, part('parked', 0, 0.1)), { tilt: -1.5 })}
  </div>`, { before: 0.4 });

Film.scene('finish', (S) => `
  <div class="fill field--ink" ${zoomOut(S, 1300, 560)}><div class="grid-lines"></div>
  ${title(S, 'L2-071 AC1 · AC2', 'The line,', 'and your place.', 110, 160, 700)}
  <div style="${at(110, 520, 680)}">
    ${fact(S, 1, onBeat(S, part('finish', 0, 0.3)), 'Finish time: the race clock, 0:57')}
    ${fact(S, 2, onBeat(S, part('finish', 0, 0.5)), '1st of 10; bots that crossed first, ahead')}
  </div>
  ${onBrowser(S, 'line-xl', 820, 220, 980, onBeat(S, part('finish', 0, 0.1)), { tilt: 1.5 })}
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/paused-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'one pause.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'paused-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('58 passed')}`],
    prompt('npx playwright test'),
    [`  ${ok('100 passed')}`],
    prompt('npm test'),
    [`  ${ok('374 passed')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('284.50 kB')} ${dim('of 288')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the page,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Eleven specs: leave, pause, lost bike, finish')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'The coast and the finish line, unit tested')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 7.5 · Finish, pause or leave' });

wipeInto('dnf');
bug();

Film.start();
