import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WORLD_RENDERER, type WorldRenderer } from '../../core/world-renderer-port';
import { WORLDS } from '../../core/worlds';
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
  readonly calls: string[] = [];
  draws = 0;
  start(): Promise<boolean> {
    this.calls.push('start');
    return Promise.resolve(true);
  }
  resize(): void {
    /* not needed */
  }
  draw(): void {
    this.draws++;
  }
  setFramePeriod(ms: number): void {
    this.calls.push(`period ${ms.toFixed(1)}`);
  }
  pauseBudget(): void {
    this.calls.push('pause');
  }
  dispose(): void {
    /* not needed */
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
  fixture.componentRef.setInput('world', WORLDS[0]);
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
    fixture.componentRef.setInput('world', WORLDS[0]);
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
    expect(canvas.getAttribute('aria-busy')).toBe('true');

    started(true);
    await settle(fixture);
    fixture.detectChanges();
    expect(canvas.getAttribute('aria-busy')).toBe('false');
  });
});
