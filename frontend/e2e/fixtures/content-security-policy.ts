import type { Page } from '@playwright/test';

/**
 * The Content Security Policy's refusals in the page (L2-131 AC1): each `securitypolicyviolation` the document reports,
 * as its directive and the address it blocked. The shared fixture fails a spec on any it did not take.
 */
export class ContentSecurityPolicyFixture {
  private readonly seen: string[] = [];

  static async install(page: Page): Promise<ContentSecurityPolicyFixture> {
    const fixture = new ContentSecurityPolicyFixture();
    await page.exposeFunction('__teloPolicyViolation', (violation: string) => {
      fixture.seen.push(violation);
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        const report = (window as unknown as { __teloPolicyViolation(text: string): void })
          .__teloPolicyViolation;
        report(`${event.effectiveDirective} blocked ${event.blockedURI}`);
      });
    });
    return fixture;
  }

  /** The refusals reported so far, which the spec now owns: the fixture no longer counts them. */
  take(): string[] {
    return this.seen.splice(0);
  }

  /** The refusals no spec took. */
  untaken(): string[] {
    return [...this.seen];
  }
}
