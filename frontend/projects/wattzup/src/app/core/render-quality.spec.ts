import {
  FrameBudget,
  nextLower,
  startTier,
  TECHNIQUES,
  techniquesAt,
  type Tier,
} from './render-quality';

/** The techniques from these tiers; a low-only one only when `from` is just `low`. */
const ids = (from: Tier[]) =>
  TECHNIQUES.filter(
    (t) => t.from !== null && from.includes(t.from) && !(t.lowOnly && from.length > 1),
  )
    .map((t) => t.id)
    .sort((a, b) => a - b);

describe('the technique table (L2-111)', () => {
  it('holds the techniques built so far, numbered from 1', () => {
    expect(TECHNIQUES.map((t) => t.id)).toEqual(Array.from({ length: 54 }, (_, i) => i + 1));
  });

  it('marks the drawn look low-only (AC11, ADR 0024)', () => {
    expect(TECHNIQUES.filter((t) => t.lowOnly).map((t) => t.id)).toEqual([51, 52, 53, 54]);
  });

  it('builds no rear-view mirror and no windshield water', () => {
    expect(TECHNIQUES.filter((t) => t.from === null).map((t) => t.id)).toEqual([21, 29]);
  });
});

describe('startTier (L2-111 AC3)', () => {
  it.each([
    ['webgpu', 'ultra'],
    ['webgl2', 'high'],
  ] as const)('starts %s at %s', (backend, tier) => {
    expect(startTier(backend)).toBe(tier);
  });
});

describe('techniquesAt (L2-111 AC2, AC5)', () => {
  const at = (tier: Tier, backend: 'webgpu' | 'webgl2' = 'webgpu', reduced = false) =>
    [...techniquesAt(tier, backend, reduced)].sort((a, b) => a - b);

  it.each<[Tier, Tier[]]>([
    ['low', ['low']],
    ['medium', ['low', 'medium']],
    ['high', ['low', 'medium', 'high']],
    ['ultra', ['low', 'medium', 'high', 'ultra']],
  ])('draws at %s the techniques from %j', (tier, from) => {
    expect(at(tier)).toEqual(ids(from));
  });

  it('draws low as the drawn look, anisotropic mipmaps and AgX (AC11)', () => {
    expect(at('low')).toEqual([8, 17, 51, 52, 53, 54]);
  });

  it.each<Tier>(['medium', 'high', 'ultra'])(
    'draws %s with PBR shading and no toon shading (AC11)',
    (tier) => {
      expect(at(tier)).toContain(4);
      expect(at(tier)).not.toContain(51);
      for (const drawn of [52, 53, 54]) expect(at(tier)).not.toContain(drawn);
    },
  );

  it('offers no ultra technique on WebGL2', () => {
    expect(at('ultra', 'webgl2')).toEqual(ids(['low', 'medium', 'high']));
  });

  it('drops motion blur, wheel blur, wind, tyre spray and heat haze with reduced motion', () => {
    const drawn = at('ultra', 'webgpu', true);
    for (const off of [28, 31, 33, 34, 50]) expect(drawn).not.toContain(off);
    // Still techniques stay, held still by the renderer.
    for (const still of [25, 27]) expect(drawn).toContain(still);
  });
});

describe('FrameBudget.lower (#882)', () => {
  it.each([
    ['ultra', 'high'],
    ['high', 'medium'],
    ['medium', 'low'],
  ] as const)('lowers %s to %s, even when pinned', (from, to) => {
    const budget = new FrameBudget(from, undefined, { pinned: true });
    expect(budget.lower()).toBe(true);
    expect(budget.tier).toBe(to);
  });

  it('leaves low as it is', () => {
    const budget = new FrameBudget('low');
    expect(budget.lower()).toBe(false);
    expect(budget.tier).toBe('low');
  });
});

describe('nextLower (#882)', () => {
  it.each([
    ['ultra', 'high'],
    ['high', 'medium'],
    ['medium', 'low'],
    ['low', null],
  ] as const)('below %s is %s', (tier, lower) => {
    expect(nextLower(tier)).toBe(lower);
  });
});

describe('FrameBudget (L2-111 AC4)', () => {
  /** Feeds one 2 s window of 60 frames at `ms` each, starting at `start` ms. */
  const window = (budget: FrameBudget, start: number, ms: number) => {
    const verdicts: string[] = [];
    for (let i = 0; i < 60; i++) verdicts.push(budget.sample(start + (i * 2000) / 60, ms));
    return verdicts;
  };

  it('keeps the tier through one window over 20 ms', () => {
    const budget = new FrameBudget('high');
    window(budget, 0, 25);
    expect(window(budget, 2000, 10)).not.toContain('drop');
    expect(budget.tier).toBe('high');
  });

  it('drops one tier after two windows in a row over 20 ms', () => {
    const budget = new FrameBudget('ultra');
    window(budget, 0, 25);
    const second = window(budget, 2000, 25);
    // The second window closes when the first frame of the third arrives.
    expect(budget.sample(4000, 25)).toBe('drop');
    expect(second).not.toContain('drop');
    expect(budget.tier).toBe('high');
  });

  it('judges a window by its median, not by one slow frame', () => {
    const budget = new FrameBudget('ultra');
    for (let w = 0; w < 3; w++) {
      for (let i = 0; i < 60; i++) budget.sample(w * 2000 + (i * 2000) / 60, i === 0 ? 200 : 12);
    }
    expect(budget.tier).toBe('ultra');
  });

  it('never drops below low and never raises the tier', () => {
    const budget = new FrameBudget('medium');
    for (let w = 0; w < 10; w++) window(budget, w * 2000, 40);
    expect(budget.tier).toBe('low');
    for (let w = 10; w < 30; w++) window(budget, w * 2000, 2);
    expect(budget.tier).toBe('low');
  });

  /** Feeds frames `ms` apart until `windows` 2 s windows have closed. */
  const ride = (budget: FrameBudget, ms: number, windows = 2) => {
    const verdicts: string[] = [];
    for (let now = 0; now < windows * 2000 + 2 * ms; now += ms) {
      verdicts.push(budget.sample(now, ms));
    }
    return verdicts;
  };

  it.each([
    ['30 Hz', 34, 'keep', 1000 / 30],
    ['30 Hz', 45, 'drop', 1000 / 30],
    ['60 Hz', 18, 'keep', 1000 / 60],
    ['60 Hz', 25, 'drop', 1000 / 60],
    ['144 Hz', 8, 'keep', 1000 / 144],
    ['144 Hz', 18, 'drop', 1000 / 144],
  ] as const)('on a %s display, two windows at %d ms: %s', (_, ms, expected, period) => {
    const budget = new FrameBudget('ultra', period);
    expect(ride(budget, ms).includes('drop') ? 'drop' : 'keep').toBe(expected);
    expect(budget.tier).toBe(expected === 'drop' ? 'high' : 'ultra');
  });

  it('judges against 60 Hz until it is given a period', () => {
    const budget = new FrameBudget('ultra');
    ride(budget, 25);
    expect(budget.tier).toBe('high');
  });

  it('judges against a period it is given later, starting its windows afresh', () => {
    const budget = new FrameBudget('ultra');
    budget.sample(0, 34);
    budget.setPeriod(1000 / 30);
    ride(budget, 34, 5);
    expect(budget.tier).toBe('ultra');
  });

  it('judges no window while paused, however slow its frames (AC9)', () => {
    const budget = new FrameBudget('ultra', 1000 / 60);
    budget.pause();
    expect(ride(budget, 50, 5)).not.toContain('drop');
    expect(budget.tier).toBe('ultra');
  });

  it('drops nothing when a 60 Hz ride returns at 30 Hz (AC9)', () => {
    const budget = new FrameBudget('ultra', 1000 / 60);
    ride(budget, 16.7);
    budget.pause();
    budget.sample(10_000, 34);
    budget.setPeriod(1000 / 30);
    expect(ride(budget, 34, 5)).not.toContain('drop');
    expect(budget.tier).toBe('ultra');
  });

  it('never lowers a tier pinned by the test-only hook (#672)', () => {
    const budget = new FrameBudget('high', 1000 / 60, { pinned: true });
    expect(ride(budget, 50, 10)).not.toContain('drop');
    expect(budget.tier).toBe('high');
  });
});
