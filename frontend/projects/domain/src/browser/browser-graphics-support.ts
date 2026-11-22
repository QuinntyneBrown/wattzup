import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { GraphicsApi, GraphicsSupport } from '@telo/api';

/**
 * `GraphicsSupport` from the browser: WebGPU when it grants an adapter, else WebGL 2 when a canvas gets a context, else
 * neither (L2-159 AC1, L2-161). The context it makes to ask is let go at once.
 */
@Injectable()
export class BrowserGraphicsSupport implements GraphicsSupport {
  private readonly document = inject(DOCUMENT);
  private readonly answered = signal<GraphicsApi | null>(null);
  readonly api = this.answered.asReadonly();

  constructor() {
    void this.ask().then((api) => this.answered.set(api));
  }

  private async ask(): Promise<GraphicsApi> {
    const gpu = (
      this.document.defaultView?.navigator as
        (Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }) | undefined
    )?.gpu;
    try {
      if (gpu && (await gpu.requestAdapter())) return 'webgpu';
    } catch {
      // No adapter: try WebGL 2.
    }
    const gl = this.document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl ? 'webgl2' : 'none';
  }
}
