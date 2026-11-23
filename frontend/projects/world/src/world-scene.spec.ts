import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WORLD_RENDERER, type WorldRenderer } from '@telo/api';
import { WorldScene } from './world-scene';

/** A fake requestAnimationFrame clock: `refresh(ms)` runs one display refresh `ms` later. */
function fakeFrames() {
  let now = 0;
  let next = 0;
  let queue = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(++next, cb);
    return next;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id));
  return {
    refresh(ms: number, times = 1) {
      for (let i = 0; i < times; i++) {
        now += ms;
        const due = queue;
        queue = new Map();
        for (const cb of due.values()) cb(now);
      }
    },
  };
}

/** A fake `matchMedia` whose `(resolution: …)` queries can be told the screen changed. */
function fakeScreens() {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => {
    const watched = query.includes('resolution') ? listeners : new Set<() => void>();
    return {
      media: query,
      matches: false,
      addEventListener: (_: string, listener: () => void) => watched.add(listener),
      removeEventListener: (_: string, listener: () => void) => watched.delete(listener),
    };
  });
  return {
    move: () => [...listeners].forEach((listener) => listener()),
    listening: () => listeners.size,
  };
}

/** Records what the scene asks of its renderer, in order; draws are counted, not listed. */
class FakeRenderer implements WorldRenderer {
  readonly backend = 'webgl2' as const;
  readonly calls: string[] = [];
  draws = 0;
  /** Whether the last frame drawn was still. */
  reducedMotion: boolean | null = null;
  start(): Promise<boolean> {
    this.calls.push('start');
    return Promise.resolve(true);
  }
  resize(): void {
    /* not needed */
  }
  draw(frame: { reducedMotion: boolean }): void {
    this.draws++;
    this.reducedMotion = frame.reducedMotion;
  }
  setFramePeriod(ms: number): void {
    this.calls.push(`period ${ms.toFixed(1)}`);
  }
  pauseBudget(): void {
    this.calls.push('pause');
  }
  stream(): void {
    this.calls.push('stream');
  }
  dispose(): void {
    this.calls.push('dispose');
  }
}

const settle = async (fixture: { whenStable(): Promise<unknown> }) => {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
};

/** A scene on a display of `ms` per frame, its period measured and its ride running. */
async function ridingScene(ms: number) {
  const frames = fakeFrames();
  const screens = fakeScreens();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        /* not needed */
      }
      disconnect() {
        /* not needed */
      }
    },
  );
  const renderer = new FakeRenderer();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: WORLD_RENDERER, useValue: () => Promise.resolve(renderer) },
    ],
  });
  const fixture = TestBed.createComponent(WorldScene);
  fixture.componentRef.setInput('worldId', 'docklands');
  fixture.componentRef.setInput('segments', []);
  fixture.componentRef.setInput('elapsed', 0);
  fixture.componentRef.setInput('speedKmh', null);
  fixture.componentRef.setInput('running', false);
  fixture.detectChanges();
  await settle(fixture);
  const before = [...renderer.calls];
  frames.refresh(ms, 31);
  await settle(fixture);
  fixture.componentRef.setInput('running', true);
  await settle(fixture);
  return { fixture, frames, screens, renderer, before };
}

describe('WorldScene reduced motion (L2-164 AC2)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('follows this device until the rider chooses, then the rider’s choice', async () => {
    const { fixture, frames, renderer } = await ridingScene(1000 / 60);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(false);

    fixture.componentRef.setInput('reducedMotion', true);
    await settle(fixture);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(true);

    fixture.componentRef.setInput('reducedMotion', false);
    await settle(fixture);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(false);
  });
});

describe('WorldScene frame period (L2-111 AC9)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('measures the display before the scene starts, then hands the renderer the period', async () => {
    const { renderer, before } = await ridingScene(1000 / 30);
    expect(before).toEqual([]);
    expect(renderer.calls).toEqual(['start', 'period 33.3']);
  });

  it('measures again when the tab returns, holding the picture while it does', async () => {
    const { fixture, frames, renderer } = await ridingScene(1000 / 60);
    frames.refresh(1000 / 60, 5);
    await settle(fixture);
    expect(renderer.draws).toBeGreaterThan(0);

    document.dispatchEvent(new Event('visibilitychange'));
    await settle(fixture);
    const held = renderer.draws;
    frames.refresh(1000 / 30, 30);
    await settle(fixture);
    expect(renderer.draws).toBe(held);
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause']);

    frames.refresh(1000 / 30);
    await settle(fixture);
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause', 'period 33.3']);
    frames.refresh(1000 / 30, 3);
    await settle(fixture);
    expect(renderer.draws).toBeGreaterThan(held);
  });

  it('streams the real place once the world draws, and again for a new key (L2-066 AC3)', async () => {
    const { fixture, renderer } = await ridingScene(1000 / 60);
    const place = {
      name: 'Bruges',
      route: 'Steenstraat to the Markt',
      latitude: 51.2,
      longitude: 3.2,
    };

    fixture.componentRef.setInput('scenery', { place, key: 'AIza-one' });
    await settle(fixture);
    fixture.componentRef.setInput('scenery', { place, key: 'AIza-two' });
    await settle(fixture);

    expect(renderer.calls.filter((call) => call === 'stream')).toHaveLength(2);
  });

  it('draws no frame for a change of input while the tab is hidden (L2-065 AC3)', async () => {
    const { fixture, renderer } = await ridingScene(1000 / 60);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(fixture);
    const held = renderer.draws;

    fixture.componentRef.setInput('elapsed', 7);
    await settle(fixture);

    expect(renderer.draws).toBe(held);
    hidden.mockRestore();
  });

  it('measures again when the window moves to another screen', async () => {
    const { fixture, frames, screens, renderer } = await ridingScene(1000 / 60);
    expect(screens.listening()).toBe(1);

    screens.move();
    await settle(fixture);
    frames.refresh(1000 / 144, 31);
    await settle(fixture);

    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause', 'period 6.9']);
    expect(screens.listening()).toBe(1);
  });
});

describe('WorldScene while it loads (L2-111 AC12, #896)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the canvas busy and unseen until the scene has started, then shows it', async () => {
    const frames = fakeFrames();
    fakeScreens();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* not needed */
        }
        disconnect() {
          /* not needed */
        }
      },
    );
    let started: (ok: boolean) => void = () => undefined;
    const renderer = new FakeRenderer();
    renderer.start = () => new Promise<boolean>((resolve) => (started = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WORLD_RENDERER, useValue: () => Promise.resolve(renderer) },
      ],
    });
    const fixture = TestBed.createComponent(WorldScene);
    fixture.componentRef.setInput('worldId', 'docklands');
    fixture.componentRef.setInput('segments', []);
    fixture.componentRef.setInput('elapsed', 0);
    fixture.componentRef.setInput('speedKmh', null);
    fixture.componentRef.setInput('running', false);
    fixture.detectChanges();
    await settle(fixture);
    frames.refresh(1000 / 60, 31);
    await settle(fixture);
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    // The warm-up draws hidden parts from an unplaced camera: the rider never sees it.
    expect(canvas.classList).toContain('world-scene--busy');

    started(true);
    await settle(fixture);
    fixture.detectChanges();
    expect(canvas.classList).not.toContain('world-scene--busy');
  });
});

describe('WorldScene start and leave (L2-065, ADR 0030)', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A scene whose renderer starts with `started`, its display measured. */
  async function scene(
    renderer: FakeRenderer,
    load = () => Promise.resolve<WorldRenderer>(renderer),
  ) {
    const frames = fakeFrames();
    fakeScreens();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* not needed */
        }
        disconnect() {
          /* not needed */
        }
      },
    );
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: WORLD_RENDERER, useValue: load }],
    });
    const fixture = TestBed.createComponent(WorldScene);
    fixture.componentRef.setInput('worldId', 'oldtown');
    fixture.componentRef.setInput('segments', []);
    fixture.componentRef.setInput('elapsed', 0);
    fixture.componentRef.setInput('speedKmh', null);
    fixture.componentRef.setInput('running', false);
    const started: string[] = [];
    let unavailable = 0;
    fixture.componentInstance.started.subscribe((backend) => started.push(backend));
    fixture.componentInstance.unavailable.subscribe(() => unavailable++);
    fixture.detectChanges();
    await settle(fixture);
    frames.refresh(1000 / 60, 31);
    await settle(fixture);
    return { fixture, started, unavailable: () => unavailable };
  }

  it('emits the GPU API drawing the world once the renderer has started', async () => {
    const { started, unavailable } = await scene(new FakeRenderer());
    expect(started).toEqual(['webgl2']);
    expect(unavailable()).toBe(0);
  });

  it('emits unavailable and releases the renderer when neither backend starts', async () => {
    const renderer = new FakeRenderer();
    renderer.start = () => Promise.resolve(false);
    const { started, unavailable } = await scene(renderer);
    expect(unavailable()).toBe(1);
    expect(started).toEqual([]);
    expect(renderer.calls).toEqual(['dispose']);
  });

  it('releases the renderer when the scene is destroyed', async () => {
    const renderer = new FakeRenderer();
    const { fixture } = await scene(renderer);
    fixture.destroy();
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'dispose']);
  });

  it('releases a renderer that loads after the scene was destroyed', async () => {
    const renderer = new FakeRenderer();
    let loaded: (r: WorldRenderer) => void = () => undefined;
    const { fixture } = await scene(renderer, () => new Promise((resolve) => (loaded = resolve)));
    fixture.destroy();
    loaded(renderer);
    await new Promise((resolve) => setTimeout(resolve));
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'dispose']);
  });
});
