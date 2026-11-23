// The shared scene kit of a Telo Ride film (docs/videos/README.md): the moves every film uses, on
// top of film-runtime.js. slides.html loads it after the runtime and before the film's film.js.
// Every helper returns markup or an S.ref attribute; every position is a pure function of the
// scene's time, as the runtime requires. Nothing here uses a timer, a CSS animation or Math.random.
(() => {
  const { enter, exit, ease, prog, lerp, clamp, phone, browser, tablet, esc } = Film;

  /** Absolute placement in film pixels. */
  const at = (x, y, w) => `position:absolute;left:${x}px;top:${y}px;width:${w}px`;

  const lineOf = (id, n) => {
    const line = Film.timing.lines.filter((l) => l.scene === id)[n];
    // While timing.js holds only the grid (film_audio.py --grid), a line falls back to the scene's start.
    return line ?? { start: Film.at(id) + Film.BAR, end: Film.at(id) + Film.BAR * 2 };
  };
  /** Scene time at which line `n` of scene `id` starts being spoken, so a picture lands on its word. */
  const said = (id, n) => lineOf(id, n).start - Film.at(id);
  /** Scene time at which the fraction `f` of line `n` has been spoken. */
  const part = (id, n, f) => said(id, n) + (lineOf(id, n).end - lineOf(id, n).start) * f;
  /** The same, moved to the beat at or after it: a cut belongs on the grid. */
  const onBeat = (S, t) => Math.ceil(t / S.BEAT - 1e-6) * S.BEAT;

  /** A device that rises into place at `when` and settles at `tilt` degrees; drawn while show(t). */
  const arrive = (S, when, tilt = 0, from = 12, show = () => true) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.55);
      el.style.visibility = show(t) ? 'visible' : 'hidden';
      el.style.opacity = clamp(p * 4);
      el.style.transform = `translateY(${(1 - p) * 700}px) rotate(${lerp(from, tilt, p)}deg)`;
    });

  /** A phone at (x, y); with `show`, one of several states drawn in the same place. */
  const onPhone = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    phone(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 8, show) });

  /** A browser window at (x, y), arriving at `when`. */
  const onBrowser = (S, src, x, y, width, when, { ratio = 1440 / 900, tilt = 0, show } = {}) =>
    browser(`shots/${src}.png`, { width, ratio, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 3, show) });

  /** A tablet at (x, y), arriving at `when`. */
  const onTablet = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    tablet(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 6, show) });

  /** A close-up that pops in at `when` and, if `until` is given, leaves again. */
  const pop = (S, when, { tilt = -2, until = Infinity } = {}) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.35, ease.back);
      el.style.opacity = t >= until ? 0 : clamp(p * 3);
      el.style.transform = `scale(${lerp(0.6, 1, p)}) rotate(${tilt}deg)`;
    });

  const closeup = (src, style, attrs) => `<img class="closeup" src="shots/${src}.png" alt="" style="${style}" ${attrs}>`;

  /** Words of the film's own on screen from `from` until `until` (scene seconds). */
  const during = (S, from, until = Infinity) => S.ref((el, t) => {
    const p = enter(t, from, 0.3);
    el.style.opacity = t >= until ? 0 : p;
    el.style.transform = `translateY(${(1 - p) * 40}px)`;
  });

  /** A numbered card: one short fact. */
  const fact = (S, n, when, text) =>
    `<div class="card" ${S.rise(when, { y: 50 })}><span class="card__n">${esc(n)}</span><span>${text}</span></div>`;

  /** A big number that changes on a beat: `steps` is [[from, text], …] in scene seconds. */
  const counter = (S, steps, style, cls = 'figure') => `<p class="${cls}" style="${style}" ${S.ref((el, t) => {
    const shown = steps.filter(([from]) => t >= from).at(-1);
    el.style.opacity = shown ? 1 : 0;
    el.textContent = shown ? shown[1] : '';
    const kick = shown ? Math.exp(-(t - shown[0]) * 8) : 0;
    el.style.transform = `scale(${1 + kick * 0.12})`;
  })}></p>`;

  /** The Telo Ride logo mark of the app header: a bone ring broken by the signal crank, and the hub. */
  const mark = (size = 150) => `<svg class="logo-mark" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
    <path class="logo-mark__ring" d="M37.79 21.57 A14 14 0 1 1 26.43 10.21"/><path class="logo-mark__crank" d="M24 24 L38 10"/>
    <circle class="logo-mark__hub" cx="24" cy="24" r="4.6"/></svg>`;

  /** The TELO Ride lockup, as the app header draws it: the mark and the wordmark, `size` film pixels tall. */
  const lockup = (size = 150) =>
    `<span class="lockup" style="--s:${size}px">${mark(size)}<span class="wordmark">TELO<span class="wordmark__product">Ride</span></span></span>`;

  /** A photograph the design system ships (docs/design-system/assets/images/): 'machines/echelon-ex5s', 'worlds/coast'. */
  const photo = (name) => `background-image:url('../../design-system/assets/images/${name}.jpg')`;

  /** Telo Ride's purpose, quoted from AGENTS.md word for word, one sentence a line of the close. */
  const PURPOSE = [
    'Telo Ride, from the Telo family, turns a smart bike at home into a game.',
    'It pairs with the bike over Bluetooth, reads your power and sets resistance for every hill and interval.',
    'Two doors: <b>Race</b> (ride a map against your best-time ghost, bots or people) and <b>Classes</b> (ride along to a video, alone or with a group), fed by one progression of XP, rider levels, stars and map unlocks.',
    'A custom workout lives under Profile.',
  ];

  /** A terminal of the film's own: `lines` are [html, cls] pairs that rise in one by one from `from`, a beat apart. */
  const terminal = (S, title, lines, from, style, { every = S.BEAT } = {}) => `<div class="terminal" style="${style}">
    <div class="terminal__bar"><i></i><i></i><i></i><span style="margin-left:12px">${esc(title)}</span></div>
    <div class="terminal__body">${lines.map(([html, cls = ''], i) => `<div class="${cls}" ${S.rise(from + i * every, { y: 12, dur: 0.2 })}>${html || '&nbsp;'}</div>`).join('')}</div></div>`;

  /**
   * The opening scene: the aurora over ink, the lockup, the slice's kicker and its headline, and the
   * slice's first screen arriving on a device.
   */
  const opening = (id, { kicker, words, accent, device, width = 1100 }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => enter(t, 0, 1.2) * 0.6)}
    <div style="${at(120, 150, width)}">
      <div ${S.rise(0.2, { y: 30 })}>${lockup(64)}</div>
      <p class="kicker accent" style="margin-top:110px" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
      <h1 class="headline" style="margin-top:28px">${S.words(S.beat(2), words, { accent })}</h1>
    </div>
    ${device(S)}
    </div>`);

  /**
   * The close: the lockup over the aurora and Telo Ride's purpose from AGENTS.md, word for word. Each
   * sentence rises as the voice says it: narration.json gives the close one line a sentence.
   */
  const closing = (id, { kicker, after = 0 }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => 0.6 * (1 - exit(t, S.length - 2.5, 2.5) * 0.6))}
    <div style="position:absolute;left:0;right:0;top:150px;text-align:center">
      <div ${S.rise(S.beat(1), { y: 40 })}>${lockup(110)}</div>
      <p class="kicker" style="margin-top:40px" ${S.rise(S.beat(2))}>${esc(kicker)}</p>
      <div class="lede" style="margin:44px auto 0;max-width:1440px;font-size:38px">${PURPOSE.map((sentence, n) =>
        `<p style="margin:0 0 18px" ${S.rise(Math.max(S.beat(2), said(id, n + after) - 0.1), { y: 16 })}>${sentence}</p>`).join('')}</div>
    </div>
    </div>`);

  /** A change of act is a wipe in a brand colour; inside an act the cuts are hard. */
  const wipeInto = (id, color = 'var(--palette-signal)') =>
    Film.overlay((S) => S.wipe((T) => prog(T, Film.at(id) - 0.3, 0.6), color));

  /**
   * A push between acts: the scene slides in from the right while the one before slides out to the
   * left. Put `push(S)` on both scenes' root and give them `{ before: dur }` and `{ after: dur }`.
   */
  const push = (S, dur = 0.6) => S.ref((el, t) => {
    const into = t < 0 ? ease.inOut(prog(t, -dur, dur)) : 1;
    const out = t > S.length ? ease.inOut(prog(t, S.length, dur)) : 0;
    el.style.transform = `translateX(${(1 - into) * Film.W - out * Film.W}px)`;
  });

  /**
   * A zoom through a screenshot into the next act: the scene dives into the point (x, y) for `dur`
   * seconds after its end while the next scene, with `zoomIn(S)` on its root and `{ before: dur }`,
   * settles in over it. Give the diving scene `{ after: dur }`.
   */
  const zoomOut = (S, x, y, dur = 0.7) => S.ref((el, t) => {
    const p = t > S.length ? ease.in(prog(t, S.length, dur)) : 0;
    el.style.transformOrigin = `${x}px ${y}px`;
    el.style.transform = `scale(${1 + p * 7})`;
  });
  const zoomIn = (S, dur = 0.7) => S.ref((el, t) => {
    const p = t < 0 ? ease.out(prog(t, -dur * 0.6, dur * 0.6)) : 1;
    el.style.opacity = p;
    el.style.transform = `scale(${lerp(1.25, 1, p)})`;
  });

  /**
   * The brand bug: the mark in the top-right corner of every scene but the first and the last,
   * so every frame of the film is a Telo Ride frame. An ink disc keeps it apart from a signal field.
   */
  const bug = (skip = [Film.timing.scenes[0].id, Film.timing.scenes.at(-1).id]) => Film.overlay((S) => {
    const spans = Film.timing.scenes.filter((s) => !skip.includes(s.id)).map((s) => [s.start, s.start + s.length]);
    return `<div class="lockup" style="--s:46px;position:absolute;right:40px;top:36px;width:68px;height:68px;display:grid;place-items:center;border-radius:50%;background:var(--palette-ink);box-shadow:0 0 0 3px var(--palette-line)" ${S.ref((el, T) => {
      el.style.opacity = spans.some(([a, b]) => T >= a && T < b) ? 1 : 0;
    })}>${mark(52)}</div>`;
  });

  Film.kit = { at, lineOf, said, part, onBeat, arrive, onPhone, onBrowser, onTablet, pop, closeup, during, fact, counter, mark, lockup, photo, PURPOSE, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug };
})();
