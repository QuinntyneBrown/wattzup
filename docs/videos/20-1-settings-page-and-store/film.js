// Slice 20.1 · Settings page and store. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Settings at 1440 px and three other widths, Profile's Ride settings row, Keep the screen awake off
// and back on after Reset to recommended, and the warning when the browser keeps nothing, from shots.ts. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the page ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 20.1 · Settings page and store',
  words: 'Tuned on this device,',
  accent: 'applied at once.',
  width: 900,
  device: (S) => onBrowser(S, 'settings-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('measure', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-112 AC1 · L2-158 AC1', 'From Profile,', 'to Settings.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('measure', 0, 0.3)), 'Ride settings: quality, sound and display')}
    ${fact(S, 2, onBeat(S, part('measure', 0, 0.55)), 'Profile stays current in the header')}
  </div>
  ${closeup('profile-rows', `${at(1000, 200, 720)};${REGION}`, pop(S, onBeat(S, part('measure', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('budget', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-158 AC2', 'Five sections,', 'one nav.', 110, 160, 760)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('budget', 0, 0.2)), 'World, Sound, Motion and display, Bike, This device')}
    ${fact(S, 2, onBeat(S, part('budget', 0, 0.4)), 'Each a landmark named by its heading')}
    ${fact(S, 3, onBeat(S, part('budget', 0, 0.6)), 'A column beside them from 1024 px')}
  </div>
  ${closeup('settings-l', `${at(960, 200, 860)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('budget', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('world', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-158 AC3 · L2-164 AC5', 'No Save.', 'It just applies.', 110, 160, 760)}
  ${closeup('keep-awake-off', `${at(940, 150, 860)};${REGION}`, pop(S, onBeat(S, part('world', 0, 0.1)), { tilt: -1 }))}
  ${terminal(S, 'this browser, after the switch', [
    [`  localStorage  ${ok('telo-ride.settings.v1')}`],
    [`  value         ${ok('{"keepAwake":false}')}`],
    [`  wake locks    ${ok('[]')} ${dim('through a class ride')}`],
  ], part('world', 0, 0.45), `${at(110, 560, 760)};font-size:21px`, { every: S.BEAT * 0.6 })}
  </div>`, { after: 0.7 });

// ── Act 2: every width, and the proof ─────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/settings-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One page,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${closeup('refused-l', `${at(80, 150, 820)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('proof', 0, 0.1)), { tilt: -1 }))}
  ${title(S, 'L2-158 AC6 · AC7', 'Reset, or', 'keep it for the tab.', 990, 110, 860)}
  <div style="${at(990, 470, 860)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Reset to recommended puts every setting back')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'Rides and progress stay')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Storage refused: a warning, and every control still works')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 20.1 · Settings page and store' });

wipeInto('world');
bug();

Film.start();
