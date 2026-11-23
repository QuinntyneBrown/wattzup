// Slice 6.1 · Class catalogue API. Eleven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are the class ride from shots.ts, opened again with the backend unreachable and its class read from
// the catalogue the app kept, on the shared fixture's fake Bluetooth, with Playwright's clock moving it. The API's
// answers come from the backend's acceptance tests. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: what the catalogue serves ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 6.1 · Class catalogue',
  words: 'Served once,',
  accent: 'kept close.',
  width: 860,
  device: (S) => onBrowser(S, 'offline-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('seven', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-080 AC1', 'Seven classes,', 'in order.', 110, 200, 640)}
  ${terminal(S, 'GET /api/classes', [
    [`20 Minute Power Intervals    ${dim('VO₂ max')}   ${ok('20:00')}  ${dim('level 1')}`],
    [`20 Min Threshold Builder     ${dim('Threshold')} ${ok('20:00')}  ${dim('level 1')}`],
    [`30 Minute HIIT Cardio        ${dim('HIIT')}      ${ok('30:00')}  ${dim('level 1')}`],
    [`30 Min Tempo Paceline        ${dim('Tempo')}     ${ok('36:00')}  ${dim('level 5')}`],
    [`30 Min Vice City Pyramid     ${dim('Pyramid')}   ${ok('28:30')}  ${dim('level 10')}`],
    [`60 Min Dolomites Endurance   ${dim('Zone 2')}    ${ok('1:00:00')} ${dim('level 10')}`],
    [`60 Min Coastal + Surges      ${dim('Endurance')} ${ok('1:00:00')} ${dim('level 20')}`],
  ], S.beat(2), `${at(780, 230, 1060)};font-size:22px`, { every: S.BEAT * 0.4 })}
  </div>`);

Film.scene('every', (S) => `
  <div class="fill field--panel" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'L2-080 AC2 · AC5', 'Every class,', 'complete.', 110, 160, 760)}
  <div style="${at(110, 520, 720)}">
    ${fact(S, 1, onBeat(S, part('every', 0, 0.25)), 'A YouTube video and its sync offset')}
    ${fact(S, 2, onBeat(S, part('every', 0, 0.45)), 'A summary and a world to ride in')}
    ${fact(S, 3, onBeat(S, part('every', 0, 0.65)), 'A plan as long as the class')}
  </div>
  ${closeup('segment', at(900, 380, 920), pop(S, onBeat(S, part('every', 0, 0.2)), { tilt: 1.5 }))}
  </div>`, { before: 0.4 });

// ── Act 2: the rules and the endpoints ──────────────────────────────────────────────────────
Film.scene('rules', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'ClassPlanRules · L2-080 AC4', 'Break a rule,', 'left out.', 110, 200, 720)}
  ${terminal(S, 'BrokenRule(class)', [
    [`level 33        ${ok('outside 1 to 32')}`],
    [`plan 540 s      ${ok('not 600 s')}`],
    [`video id        ${ok('not a YouTube id')}`],
    [`level 1 and 32  ${dim('served')}`],
  ], S.beat(2), `${at(860, 260, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.4, after: 0.6 });

Film.scene('one', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'GET /api/classes/{id}', 'One class,', 'by its id.', 110, 200, 720)}
  ${terminal(S, 'one class', [
    [`/hiit-cardio-30   ${ok('200')}  ${dim('30 Minute HIIT Cardio')}`],
    [`/no-such-class    ${ok('404')}  ${dim('class_not_found')}`],
    [`/level-too-high   ${ok('404')}  ${dim('left out, not found')}`],
  ], S.beat(2), `${at(860, 280, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`, { before: 0.3 });

Film.scene('public', (S) => `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, '[AllowAnonymous] · ADR 0028', 'Open to', 'every rider.', 110, 200, 720)}
  ${terminal(S, 'without a session', [
    [`GET /api/classes        ${ok('200')}`],
    [`GET /api/classes/{id}   ${ok('200')}`],
    [`anything else           ${dim('401, as before')}`],
  ], S.beat(2), `${at(860, 280, 980)};font-size:26px`, { every: S.BEAT * 0.6 })}
  </div>`);

Film.scene('file', (S) => {
  const said = (f) => onBeat(S, part('file', 0, f));
  return `
  <div class="fill field--ink" ${push(S)}><div class="grid-lines"></div>
  ${title(S, 'ADR 0028', 'A file,', 'read once.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'classes.json', 'embedded in the backend', 80, 560, 500, 160, said(0.1), 36)}
  ${node(S, 'node--app', 'IClassCatalogue', 'tests serve their own', 720, 560, 480, 160, said(0.4), 36)}
  ${node(S, '', 'GET /api/classes', 'GetClassesQuery', 1320, 560, 500, 160, said(0.7), 36)}
  </div>`;
}, { before: 0.4 });

// ── Act 3: kept on the device, every width, what the tests prove, and the close ──────────────
Film.scene('kept', (S) => {
  const said = (f) => onBeat(S, part('kept', 0, f));
  return `
  <div class="fill field--panel"><div class="grid-lines"></div>
  ${title(S, 'CachedClassesApi · L2-080 AC3', 'Kept on', 'the device.', 110, 120, 1700)}
  <svg class="fill" viewBox="0 0 1920 1080" style="position:absolute;inset:0">
    ${arrow(S, 600, 640, 720, 640, said(0.3))}
    ${arrow(S, 1200, 640, 1320, 640, said(0.6))}
  </svg>
  ${node(S, '', 'Class ride', 'CLASSES_API.get(id)', 80, 560, 500, 160, said(0.1), 36)}
  ${node(S, 'node--app', 'CachedClassesApi', 'asks, keeps, falls back', 720, 560, 480, 160, said(0.4), 36)}
  ${node(S, '', 'localStorage', 'telo-ride.class-catalogue', 1320, 560, 500, 160, said(0.7), 36)}
  </div>`;
});

Film.scene('offline', (S) => `
  <div class="fill field--gold" ${zoomOut(S, 1300, 560)}>
  ${title(S, 'L2-135 AC3', 'No backend,', 'still riding.', 110, 200, 720)}
  <div style="${at(110, 560, 700)}">
    ${fact(S, 1, onBeat(S, part('offline', 0, 0.3)), 'GET /api/classes answers 503')}
    ${fact(S, 2, onBeat(S, part('offline', 0, 0.55)), 'The kept catalogue has the class')}
    ${fact(S, 3, onBeat(S, part('offline', 0, 0.75)), 'The warm-up level goes to the bike')}
  </div>
  ${onBrowser(S, 'offline-l', 960, 260, 860, onBeat(S, part('offline', 0, 0.15)), { tilt: 2 })}
  </div>`, { after: 0.7 });

Film.scene('shell', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/offline-${s}.png`, width, height }));
  const grown = part('shell', 0, 0.75);
  return `
  <div class="fill field--panel" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Phone to desktop,', { accent: 'no backend.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  ${onPhone(S, 'offline-xs', 70, 330, 300, onBeat(S, part('shell', 0, 0.35)), -4)}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone">
  ${terminal(S, 'every check, on this machine', [
    prompt('dotnet test'),
    [`  ${ok('failed: 0')}`],
    prompt('npx playwright test'),
    [`  ${ok('44 passed')}`],
    prompt('npm test'),
    [`  Tests  ${ok('259 passed')} (259)`],
  ], 0.1, `${at(80, 300, 660)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'Through the API,', 'all green.', 790, 110, 1080)}
  <div style="${at(790, 470, 1040)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'Eight API tests, twelve rule cases')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.62)), 'A spec offline, six unit cases')}
  </div>
  </div>`);

closing('close', { kicker: 'Slice 6.1 · Class catalogue API' });

wipeInto('rules');
bug();

Film.start();
