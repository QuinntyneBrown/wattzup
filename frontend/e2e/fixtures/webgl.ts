// Switches 3D off for a spec (from `main`'s e2e/fixtures/fake-webgl.ts): a screen with no WebGPU, or with neither WebGPU
// nor WebGL (L2-065).
import type { Page } from '@playwright/test';

/** Makes the browser report no WebGPU, or no WebGPU and no WebGL, as a screen that can't draw 3D. */
export class FakeWebGl {
  constructor(private readonly page: Page) {}

  /** Call before the page loads: no WebGPU adapter, and `getContext('webgl'|'webgl2')` is null. */
  async disable(): Promise<void> {
    await this.withoutWebGpu();
    await this.page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...rest: unknown[]
      ) {
        if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
        return (original as (...args: unknown[]) => unknown).call(this, kind, ...rest);
      } as typeof original;
    });
  }

  /** Call before the page loads: counts the WebGPU and WebGL 2 contexts the page makes, read with `contexts`. */
  async countContexts(): Promise<void> {
    await this.page.addInitScript(() => {
      const counted = window as unknown as { __contexts: number };
      counted.__contexts = 0;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...rest: unknown[]
      ) {
        const context = (original as (...args: unknown[]) => unknown).call(this, kind, ...rest);
        if ((kind === 'webgpu' || kind === 'webgl2') && context) counted.__contexts++;
        return context;
      } as typeof original;
    });
  }

  /** The WebGPU and WebGL 2 contexts made since the page loaded (after `countContexts`). */
  contexts(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { __contexts: number }).__contexts);
  }

  /**
   * Call before the page loads: a WebGPU adapter is granted, so Settings offers WebGPU (L2-161 AC1). The adapter is
   * a stand-in that draws nothing: only for screens that ask whether WebGPU is there, never for a world.
   */
  async withWebGpu(): Promise<void> {
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', {
        value: { requestAdapter: () => Promise.resolve({ features: new Set(), limits: {} }) },
        configurable: true,
      });
    });
  }

  /** Call before the page loads: no WebGPU, so the world draws with WebGL 2 (L2-065). */
  async withoutWebGpu(): Promise<void> {
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
    });
  }
}
