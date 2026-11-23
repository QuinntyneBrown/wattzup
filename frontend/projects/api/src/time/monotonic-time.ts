import { InjectionToken } from '@angular/core';

/**
 * A time source that never jumps backwards and ignores wall-clock changes, in milliseconds: `performance.now()` in
 * the browser (L2-133 AC1). Tests bind a fake they move by hand, so nothing sleeps (AGENTS.md).
 */
export interface MonotonicTime {
  now(): number;
}

export const MONOTONIC_TIME = new InjectionToken<MonotonicTime>('MONOTONIC_TIME');
