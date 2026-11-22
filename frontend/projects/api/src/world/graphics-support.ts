import { InjectionToken, type Signal } from '@angular/core';
import type { Backend } from './world';

/** What this browser can draw a world with: WebGPU, WebGL 2, or neither (L2-159 AC1, L2-161). */
export type GraphicsApi = Backend | 'none';

export interface GraphicsSupport {
  /** Null until the browser has answered. */
  readonly api: Signal<GraphicsApi | null>;
}

export const GRAPHICS_SUPPORT = new InjectionToken<GraphicsSupport>('GRAPHICS_SUPPORT');
