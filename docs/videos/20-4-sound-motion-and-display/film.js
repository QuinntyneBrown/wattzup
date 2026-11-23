// Slice 20.4 · Sound, motion and display. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are Settings' Sound and Motion and display at 1440 px and three other widths, each section close up,
// Settings in the light theme, and a race on a phone with Standard and with Large ride numbers, from shots.ts. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
/** A close-up keeps its own shape: the region it shows, with its air. */
const REGION = 'height:auto';
/** A phone's window, 390 × 780 CSS pixels. */
const PHONE = 'aspect-ratio:390/780;object-fit:cover;object-position:top';

// ── Act 1: sound ──────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 20.4 · Sound, motion and display',
  words: 'An hour',
  accent: 'in the saddle.',
  width: 900,
  device: (S) => onBrowser(S, 'settings-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('sound', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-163 AC1 · AC3', 'Made as', 'you pedal.', 110, 160, 760)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('sound', 0, 0.3)), 'Chain, freewheel, tyres and wind')}
    ${fact(S, 2, onBeat(S, part('sound', 0, 0.55)), 'Off: no audio context at all')}
  </div>
  ${closeup('sound', `${at(940, 250, 860)};${REGION}`, pop(S, onBeat(S, part('sound', 0, 0.15)), { tilt: -1 }))}
  </div>`);

Film.scene('music', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-163 AC1 · AC2', 'Quiet under', 'the video.', 110, 160, 760)}
  <div style="${at(110, 560, 760)}">
    ${fact(S, 1, onBeat(S, part('music', 0, 0.2)), 'Each world’s own track, under the ride sound')}
    ${fact(S, 2, onBeat(S, part('music', 0, 0.4)), 'Muted while a class video plays')}
    ${fact(S, 3, onBeat(S, part('music', 0, 0.6)), 'A volume change heard within 100 ms')}
  </div>
  ${closeup('settings-l', `${at(960, 200, 820)};aspect-ratio:1024/768;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('music', 0, 0.15)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: motion and display ─────────────────────────────────────────────────────────────────
Film.scene('motion', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-164 AC1 · AC2', 'Still,', 'when you ask.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('motion', 0, 0.3)), 'Match device, On or Off')}
    ${fact(S, 2, onBeat(S, part('motion', 0, 0.55)), 'On: transitions instant, the world still')}
  </div>
  ${closeup('display', `${at(900, 150, 900)};${REGION}`, pop(S, onBeat(S, part('motion', 0, 0.15)), { tilt: -1 }))}
  </div>`, { after: 0.7 });

Film.scene('numbers', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-164 AC4', 'Bigger', 'numbers.', 110, 160, 700)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('numbers', 0, 0.3)), 'Power, the clock and the target')}
    ${fact(S, 2, onBeat(S, part('numbers', 0, 0.5)), 'A quarter larger, no sideways scroll')}
  </div>
  ${closeup('race-standard', `${at(980, 110, 380)};${PHONE}`, pop(S, onBeat(S, part('numbers', 0, 0.1)), { tilt: -1 }))}
  ${closeup('race-large', `${at(1420, 110, 380)};${PHONE}`, pop(S, onBeat(S, part('numbers', 0, 0.35)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/settings-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Sound and display,', { accent: 'at every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${closeup('light-xl', `${at(110, 150, 820)};aspect-ratio:1440/900;object-fit:cover;object-position:top`, pop(S, onBeat(S, part('proof', 0, 0.1)), { tilt: -1 }))}
  ${title(S, 'L2-164 AC3 · AC5 · AC6', 'Your theme,', 'full screen.', 1040, 130, 760)}
  ${terminal(S, 'settings-sound-display.spec.ts', [
    [`  theme    ${ok('light')} ${dim('when the device asks')}`],
    [`  start    ${ok('full screen')} ${dim('on the press')}`],
    [`  sound    ${ok('0 contexts')} ${dim('with ride sound off')}`],
  ], part('proof', 0, 0.4), `${at(1040, 560, 760)};font-size:19px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 20.4 · Sound, motion and display' });

wipeInto('motion');
bug();

Film.start();
