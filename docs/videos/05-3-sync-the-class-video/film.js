// Slice 5.3 · Sync the class video. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the class ride from shots.ts, ridden solo on the shared fixture's fake Bluetooth, with the class
// answered by its API fixture, the YouTube IFrame API by a fake player over the cover, and Playwright's clock moving it. Every position is a pure function of the scene's
// time (docs/videos/README.md).
const { enter, ease, prog, lerp, clamp, esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;

/** A box of a diagram that pops in at `when`; `size` scales its name. */
const node = (S, cls, name, note, x, y, w, h, when, size = 64) => `<div class="node ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${size}px" ${S.ref((el, t) => {
  const p = enter(t, when, 0.35, ease.back);
  el.style.opacity = clamp(p * 3);
  el.style.transform = `scale(${lerp(0.7, 1, p)})`;
})}><span>${esc(name)}<small>${esc(note)}</small></span></div>`;

/** An arrow that draws itself from (x1, y1) to (x2, y2) from `when`. */
const arrow = (S, x1, y1, x2, y2, when) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = [[0, 0], [-24, -12], [-24, 12]].map(([dx, dy]) =>
    `${x2 + dx * Math.cos(angle) - dy * Math.sin(angle)},${y2 + dx * Math.sin(angle) + dy * Math.cos(angle)}`).join(' ');
  return `<g ${S.ref((el, t) => { el.style.opacity = t >= when ? 1 : 0; })}>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" stroke="var(--palette-bone)" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="1 1" ${S.ref((el, t) => el.setAttribute('stroke-dashoffset', String(1 - enter(t, when, 0.4, ease.inOut))))}/>
    <polygon points="${head}" fill="var(--palette-bone)" ${S.ref((el, t) => { el.style.opacity = enter(t, when + 0.3, 0.15); })}/>
  </g>`;
};

// ── Act 1: the video on the clock ─────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 5.3 · Video sync',
  words: 'Video,',
  accent: 'in sync.',
  width: 860,
  device: (S) => onBrowser(S, 'video-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('offset', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'L2-088 AC1', 'The clock leads,', 'the video follows.', 110, 160, 760)}
  <div style="${at(110, 560, 720)}">
    ${fact(S, 1, onBeat(S, part('offset', 0, 0.3)), 'Ride clock 7:00')}
    ${fact(S, 2, onBeat(S, part('offset', 0, 0.5)), 'Sync offset 0:12')}
    ${fact(S, 3, onBeat(S, part('offset', 0, 0.7)), 'The video at 7:12')}
  </div>
  ${closeup('frame', at(900, 300, 920), pop(S, onBeat(S, part('offset', 0, 0.2)), { tilt: 1.5 }))}
  </div>`);

Film.scene('privacy', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-088 AC5 · ADR 0012', 'No cookies,', 'no controls.', 110, 200, 720)}
  ${terminal(S, 'new YT.Player(…)', [
    [`host        ${ok("'https://www.youtube-nocookie.com'")}`],
    [`videoId     ${ok("'QUoToFsMNig'")}`],
    [`controls    ${ok('0')}  ${dim('the ride’s Pause and Leave')}`],
    [`tabindex    ${ok('-1')}  ${dim('focus never enters it')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('drift', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'VideoClockSync · L2-088 AC2', 'One and a half', 'seconds, then seek.', 110, 200, 720)}
  ${terminal(S, 'check(video, elapsed, offset)', [
    [`434.1  420  12   ${ok('seek 432')}  ${dim('2.1 s ahead')}`],
    [`433.4  420  12   ${dim('none, 1.4 s')}`],
    [`430.5  420  12   ${dim('none, 1.5 s')}`],
    [`430.4  420  12   ${ok('seek 432')}  ${dim('1.6 s behind')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

// ── Act 2: when the video cannot play ────────────────────────────────────────────────────────
Film.scene('unavailable', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-088 AC4', 'The cover stays,', 'and says so.', 110, 160, 760)}
  ${onBrowser(S, 'unavailable-xl', 980, 250, 840, onBeat(S, part('unavailable', 0, 0.15)), { tilt: 2 })}
  ${closeup('notice', at(110, 440, 700), pop(S, onBeat(S, part('unavailable', 0, 0.5)), { tilt: -1.5 }))}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('carry', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-088 AC4 · L2-027 AC1', 'The bike', 'still follows.', 110, 200, 720)}
  ${terminal(S, 'YouTube blocked', [
    [`iframe_api   ${dim('blocked by client')}`],
    [`notice       ${ok('role=status')}`],
    [`clock        ${ok('7:00 / 30:00')}`],
    [`recover      ${ok('F0 B1 01 06 A8')}  ${dim('level 6 sent')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.3 });

Film.scene('library', (S) => {
  const said = (f) => onBeat(S, part('library', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'video library · VIDEO_PLAYER_FACTORY', 'Loaded only', 'when it plays.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'ClassRideStore', 'the class has arrived', 80, 560, 500, 160, said(0.1), 36)}
  ${node(S, 'node--app', "import('@telo/video')", 'a 1.5 kB chunk', 720, 560, 480, 160, said(0.4), 36)}
  ${node(S, '', 'YouTube IFrame API', 'youtube-nocookie.com', 1320, 560, 500, 160, said(0.7), 36)}
  </div>`;
});

Film.scene('bundle', (S) => `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'Lazy loading first · AGENTS.md', 'Not a kilobyte', 'more up front.', 110, 200, 720)}
  ${terminal(S, 'ng build ride · initial', [
    [`effect + viewChild   ${dim('287.0 kB')}`],
    [`viewChild only       ${dim('285.0 kB')}`],
    [`frame from the host  ${ok('284.0 kB')}  ${dim('as before')}`],
    [`video library        ${ok('lazy, 1.5 kB')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4 });

Film.scene('fake', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'The shared fixture', 'A fake player,', 'a real clock.', 110, 200, 720)}
  <div style="${at(900, 300, 900)}">
    ${fact(S, 1, onBeat(S, part('fake', 0, 0.2)), 'iframe_api answered by a fake YT.Player')}
    ${fact(S, 2, onBeat(S, part('fake', 0, 0.45)), 'Its time runs on the page’s clock')}
    ${fact(S, 3, onBeat(S, part('fake', 0, 0.7)), 'No request leaves localhost')}
  </div>
  </div>`, { after: 0.7 });

// ── Act 3: every width, what the tests prove, and the close ──────────────────────────────────
Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/video-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Sixteen by nine,', { accent: 'then the column.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'unavailable-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('38 passed')}`],
    [''],
    prompt('npm test'),
    [`  Tests  ${ok('246 passed')} (246)`],
  ], 0.1, `${at(80, 320, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Four new specs,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'On the clock, drift, blocked, failed')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'Eight drift cases for VideoClockSync')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 5.3 · Sync the class video' });

wipeInto('unavailable');
bug();

Film.start();
