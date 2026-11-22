import type { Page } from '@playwright/test';
import { expect } from '../fixtures/test';

/** The page's used JavaScript heap in bytes, read after a forced garbage collection. */
export async function usedHeap(page: Page): Promise<number> {
  const devtools = await page.context().newCDPSession(page);
  try {
    await devtools.send('HeapProfiler.collectGarbage');
    const { usedSize } = await devtools.send('Runtime.getHeapUsage');
    return usedSize;
  } finally {
    await devtools.detach();
  }
}

const megabytes = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

/** Fails when the heap grew by more than `limitMb` from `before` to `after`, naming both readings. */
export function expectHeldHeap(what: string, before: number, after: number, limitMb: number): void {
  expect(
    after - before,
    `${what}: ${megabytes(before)} then ${megabytes(after)}, ${megabytes(after - before)} more (at most ${limitMb} MB)`,
  ).toBeLessThanOrEqual(limitMb * 1_000_000);
}
