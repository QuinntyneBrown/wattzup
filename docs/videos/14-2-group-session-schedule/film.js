// Slice 14.2 · Group session schedule. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Class Start of 30 Minute HIIT Cardio at 7:30 PM offering its next group session, at 1440 px and
// three other widths, its ride choice when the session is full and when it is starting, and the Class Library's group
// chips, from shots.ts. The schedule is shown as the terminal lines of what the API answers. Every position is a pure
// function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
// The close-ups' sizes in CSS pixels, from shots/: the ride choice cropped to its options and session.
const CHOICE = 'aspect-ratio:452/330;object-fit:cover;object-position:top';
const CHIP = 'aspect-ratio:424/338;object-fit:cover';
const PAGE = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: every fifteen minutes ──────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 14.2 · Group session schedule',
  words: 'A group ride,',
  accent: 'every fifteen minutes.',
  width: 900,
  device: (S) => onBrowser(S, 'start-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('schedule', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-083 AC1, L2-122 AC1', 'On the quarter hours,', 'ten seats each.', 110, 130, 1700)}
  ${terminal(S, 'at 7:30 PM, what the API answers', [
    prompt('GET /api/classes/hiit-cardio-30/sessions'),
    [`  ${ok('7:45 PM')}  0 of 10  ${dim('hiit-cardio-30@…T1945Z')}`],
    [`  ${ok('8:00 PM')}  0 of 10  ${dim('hiit-cardio-30@…T2000Z')}`],
    [`  ${dim('asked again every 30 s · signed in only')}`],
  ], 0.2, `${at(110, 470, 900)};font-size:24px`, { every: S.BEAT * 0.6 })}
  <div style="${at(1100, 470, 720)}">
    ${fact(S, 1, onBeat(S, part('schedule', 0, 0.3)), 'One session every 15 minutes')}
    ${fact(S, 2, onBeat(S, part('schedule', 0, 0.5)), 'Ten seats in each')}
    ${fact(S, 3, onBeat(S, part('schedule', 0, 0.7)), 'The next two, read every 30 s')}
  </div>
  </div>`);

Film.scene('roster', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-085 AC1–AC3', 'The next session,', 'and who rides it.', 110, 160, 760)}
  ${closeup('group-choice', `${at(980, 140, 820)};${CHOICE}`, pop(S, onBeat(S, part('roster', 0, 0.15)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: full, starting, the library, every width ───────────────────────────────────────────
Film.scene('full', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-086 AC1, AC2', 'Full or starting,', 'Join says so.', 110, 110, 1700)}
  ${closeup('full-choice', `${at(110, 400, 820)};${CHOICE}`, pop(S, onBeat(S, part('full', 0, 0.2)), { tilt: 1 }))}
  ${closeup('soon-choice', `${at(990, 400, 820)};${CHOICE}`, pop(S, onBeat(S, part('full', 0, 0.55)), { tilt: -1 }))}
  </div>`);

Film.scene('library', (S) => `
  <div class="fill field--signal" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-083 AC2', 'Every card,', 'counting down.', 110, 160, 700)}
  ${closeup('library-xl', `${at(860, 120, 960)};${PAGE}`, pop(S, onBeat(S, part('library', 0, 0.1)), { tilt: -2 }))}
  ${closeup('chip', `${at(140, 560, 560)};${CHIP}`, pop(S, onBeat(S, part('library', 0, 0.45)), { tilt: 2 }))}
  </div>`, { after: 0.7 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/start-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.75);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One session,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('350 passed')} ${dim('12 new')}`],
    prompt('npx playwright test'),
    [`  ${ok('215 passed')} ${dim('6 new')}`],
    prompt('npm test'),
    [`  ${ok('1409 passed')} ${dim('12 new')}`],
    prompt('ng build ride'),
    [`  Initial total  ${ok('300.22 kB')}`],
  ], 0.1, `${at(80, 250, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'The next session,', 'always current.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.25)), 'Sessions every 15 minutes, ten seats each')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Minutes, riders, full and starting, read every 30 s')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.75)), 'Each open card shows its next group')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 14.2 · Group session schedule' });

wipeInto('full');
bug();

Film.start();
