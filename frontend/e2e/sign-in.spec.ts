// Acceptance test
// Traces to: L2-001 AC2, AC3, AC5; L2-002 AC1; L2-003 AC1, AC2, AC4
// Description: a visitor types an email and chooses "Send my code"; the button reads "Sending your code…" until the
// backend answers, then the code screen names the email and counts down "Send a new code". An address that is not one
// sends nothing; a failed send keeps the email; too many codes say when to try again. Playwright's clock moves time
// on; nothing sleeps.
import type { Request } from '@playwright/test';
import type { ApiReply } from './fixtures/api';
import { expect, test } from './fixtures/test';
import { SignInCodePage } from './pages/sign-in-code.page';
import { SignInPage } from './pages/sign-in.page';

const SEND_CODE = '/api/auth/code';

/** An answer the spec releases by hand, to see the screen while the request runs. */
function held(): { handler: (request: Request) => Promise<ApiReply>; release: () => void } {
  let release = (): void => undefined;
  const answer = new Promise<ApiReply>((resolve) => (release = () => resolve({ status: 202 })));
  return { handler: () => answer, release };
}

test.describe('Sign in: request an email code', () => {
  test('“Send my code” reads “Sending your code…” while it runs, then the code screen names the email (L2-001 AC2, L2-002 AC1)', async ({
    page,
    api,
  }) => {
    const answer = held();
    const bodies: unknown[] = [];
    api.answer('POST', SEND_CODE, (request: Request) => {
      bodies.push(request.postDataJSON());
      return answer.handler(request);
    });
    const signIn = new SignInPage(page);
    await signIn.open();
    await expect(signIn.heading).toHaveText('Sign in to Telo Ride');

    await signIn.ask('ada.rider@example.com');

    await expect(signIn.send).toHaveText('Sending your code…');
    await expect(signIn.send).toBeDisabled();
    answer.release();

    const code = new SignInCodePage(page);
    await expect.poll(() => code.url()).toBe('/sign-in/code');
    await expect(code.heading).toHaveText('Check your email');
    await expect(code.email).toHaveText('ada.rider@example.com');
    expect(bodies).toEqual([{ email: 'ada.rider@example.com' }]);
  });

  test('an address that is not one sends nothing and is marked invalid with an announced error (L2-001 AC3)', async ({
    page,
    api,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.ask('rider@example');

    await expect(signIn.email).toHaveAttribute('aria-invalid', 'true');
    await expect(signIn.emailError).toHaveRole('alert');
    await expect(signIn.emailError).toHaveText('Enter an email address like name@example.com.');
    await expect(signIn.send).toBeEnabled();
    expect(api.requests()).toEqual([]);
  });

  test('a send that fails keeps the email, says so and lets the rider try again (L2-001 AC5)', async ({
    page,
    api,
  }) => {
    api.answer('POST', SEND_CODE, () => ({
      status: 500,
      body: { status: 500, title: 'Something went wrong.', code: 'unexpected' },
    }));
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.ask('ada.rider@example.com');

    await expect(signIn.message).toHaveRole('alert');
    await expect(signIn.message).toHaveText(
      'We couldn’t send your code. Check your connection and try again.',
    );
    await expect(signIn.email).toHaveValue('ada.rider@example.com');
    await expect(signIn.send).toHaveText('Send my code');
    await expect(signIn.send).toBeEnabled();
    expect(signIn.url()).toBe('/sign-in');
  });

  test('too many codes asked for says when to try again, in minutes rounded up (L2-003 AC4)', async ({
    page,
    api,
  }) => {
    api.answer('POST', SEND_CODE, () => ({
      status: 429,
      headers: { 'Retry-After': '2501' },
      body: { status: 429, title: 'This can’t be done right now.', code: 'rate_limited' },
    }));
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.ask('ada.rider@example.com');

    await expect(signIn.message).toHaveText('Too many codes asked for. Try again in 42 minutes.');
    await expect(signIn.email).toHaveValue('ada.rider@example.com');
    await expect(signIn.send).toBeEnabled();
  });

  test('“Send a new code” counts down 30 seconds, then sends a new code and says so (L2-003 AC1, AC2)', async ({
    page,
    api,
  }) => {
    await page.clock.install();
    api.answer('POST', SEND_CODE, () => ({ status: 202 }));
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask('ada.rider@example.com');

    const code = new SignInCodePage(page);
    await expect(code.resend).toHaveText('Send a new code in 0:30');
    await expect(code.resend).toBeDisabled();
    await page.clock.runFor(2000);
    await expect(code.resend).toHaveText('Send a new code in 0:28');

    await page.clock.runFor(28_000);
    await expect(code.resend).toHaveText('Send a new code');
    await code.resend.click();

    await expect(code.message).toHaveRole('status');
    await expect(code.message).toHaveText('We sent a new code. Only the newest one works.');
    await expect(code.resend).toHaveText('Send a new code in 0:30');
    expect(api.requests()).toEqual([`POST ${SEND_CODE}`, `POST ${SEND_CODE}`]);
  });

  test('a code sent moments ago opens the code screen, counting down what is left (L2-003 AC1)', async ({
    page,
    api,
  }) => {
    api.answer('POST', SEND_CODE, () => ({
      status: 429,
      headers: { 'Retry-After': '12' },
      body: { status: 429, title: 'This can’t be done right now.', code: 'resend_too_soon' },
    }));
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.ask('ada.rider@example.com');

    const code = new SignInCodePage(page);
    await expect.poll(() => code.url()).toBe('/sign-in/code');
    await expect(code.resend).toHaveText('Send a new code in 0:12');
  });

  test('“Use a different email” goes back with the email kept; the code screen alone opens sign-in', async ({
    page,
    api,
  }) => {
    api.answer('POST', SEND_CODE, () => ({ status: 202 }));
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask('ada.rider@example.com');
    const code = new SignInCodePage(page);
    await code.changeEmail.click();

    await expect.poll(() => signIn.url()).toBe('/sign-in');
    await expect(signIn.email).toHaveValue('ada.rider@example.com');

    await code.open();
    await expect.poll(() => signIn.url()).toBe('/sign-in');
  });
});
