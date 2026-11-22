// Slice 16.4 · Join a group world class. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are World loading for 30 Minute HIIT Cardio's 7:39 PM session counting down at 1440 px and three other
// widths, the class ride starting with the group on the panorama, the world faded in once ready, and the class ride
// starting with the lost-bike alert, from shots.ts. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: the countdown, the start, the world ────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 16.4 · Join a group world class',
  words: 'Everyone starts together,',
  accent: 'the world follows.',
  width: 900,
  device: (S) => onBrowser(S, 'faded-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('countdown', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-154 AC1, AC2', 'The group starts', 'in 9:00.', 110, 160, 800)}
  ${terminal(S, 'World loading, as the spec saw it', [
    [`  facts   ${ok('Group · 7:39 PM · 6 of 10')}`],
    [`  timer   ${ok('9:00')} → ${ok('8:00')} ${dim('a minute later')}`],
    [`  action  ${ok('Starts with the group at 7:39 PM')} ${dim('disabled')}`],
    [`  hint    ${ok('Pedal easy: everyone’s warm-up starts together.')}`],
  ], 0.2, `${at(110, 580, 840)};font-size:20px`, { every: S.BEAT * 0.6 })}
  ${closeup('countdown-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('countdown', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('start', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-154 AC3', 'At the start,', 'everyone rides.', 110, 160, 820)}
  <div style="${at(110, 580, 780)}">
    ${fact(S, 1, onBeat(S, part('start', 0, 0.2)), 'The session’s start, on the server’s clock')}
    ${fact(S, 2, onBeat(S, part('start', 0, 0.4)), 'The class ride opens, ready or not')}
    ${fact(S, 3, onBeat(S, part('start', 0, 0.6)), 'The panorama while the world loads')}
  </div>
  ${closeup('started-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('start', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('fade', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-154 AC4', 'Ready later?', 'It fades in.', 110, 160, 800)}
  ${terminal(S, 'the late world, as the spec saw it', [
    prompt('the world is ready'),
    [`  canvas  ${ok('opacity 0 → 1')} ${dim('over the panorama')}`],
    [`  clock   ${ok('carries on')}`],
    [`  first command  ${ok('sent once')}`],
  ], 0.2, `${at(110, 600, 840)};font-size:21px`, { every: S.BEAT * 0.6 })}
  ${closeup('faded-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('fade', 0, 0.1)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('nobike', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-157 AC4, L2-092 AC1', 'No bike?', 'The class keeps going.', 110, 160, 860)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('nobike', 0, 0.25)), 'No bike on the card, the countdown runs')}
    ${fact(S, 2, onBeat(S, part('nobike', 0, 0.45)), 'Lost the bike, with Reconnect')}
    ${fact(S, 3, onBeat(S, part('nobike', 0, 0.65)), 'The clock moves on with the group')}
  </div>
  ${closeup('nobike-xl', `${at(1000, 200, 820)};${PAGE}`, pop(S, onBeat(S, part('nobike', 0, 0.1)), { tilt: 1 }))}
  ${closeup('lost-xl', `${at(1080, 540, 700)};${PAGE}`, pop(S, onBeat(S, part('nobike', 0, 0.55)), { tilt: -2 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/countdown-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The countdown,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('455 passed')} ${dim('unchanged')}`],
    prompt('npx playwright test'),
    [`  ${ok('263 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1557 passed')} ${dim('1 new')}`],
    prompt('ng build ride'),
    [`  main  ${ok('277.40 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Together,', 'ready or not.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'The countdown, with the action off')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'The start with everyone, the world later')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'No bike: Lost the bike, the class goes on')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 16.4 · Join a group world class' });

wipeInto('fade');
bug();

Film.start();
