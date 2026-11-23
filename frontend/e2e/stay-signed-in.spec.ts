// Acceptance test
// Traces to: L2-001 AC1; L2-002 AC2, AC3, AC4, AC5; L2-003 AC3; L2-004 AC3, AC5
// Description: a visitor with no session who opens a screen is sent to sign-in and, once six digits are entered,
// returns to that screen; a rider with no paired bike goes to Connect Bike. Wrong, expired and locked codes are
// refused on the code screen. A screen opens when the backend cannot be reached, and a session that ends sends the
// rider to sign-in at the next screen.
import type { Request } from '@playwright/test';
import { ApiFixture } from './fixtures/api';
import { catalogue } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { HomePage } from './pages/home.page';
import { NotFoundPage } from './pages/not-found.page';
import { SignInCodePage } from './pages/sign-in-code.page';
import { SignInPage } from './pages/sign-in.page';

const EMAIL = 'ada.rider@example.com';
const CONFIRM = '/api/auth/code/confirm';
// A returning rider with a name: one with none is asked for it first (display-name.spec.ts).
const confirmed = {
  riderId: '3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10',
  displayName: 'Ada',
  isNewAccount: false,
};
const refused = (code: string) => () => ({
  status: 400,
  body: { status: 400, title: 'This can’t be done right now.', code },
});

test.describe('Stay signed in: confirm the code', () => {
  test.beforeEach(({ api }) => {
    api.signedOut();
    api.answer('POST', '/api/auth/code', () => ({ status: 202 }));
  });

  test('a visitor is sent to sign-in and, with the six digits, returns to the screen they asked for (L2-001 AC1, L2-002 AC2)', async ({
    page,
    api,
  }) => {
    const sent: unknown[] = [];
    api.answer('GET', '/api/classes', catalogue);
    api.answer('POST', CONFIRM, (request: Request) => {
      sent.push(request.postDataJSON());
      api.answer('GET', '/api/riders/me', { id: confirmed.riderId, displayName: 'Ada' });
      return { status: 200, body: confirmed };
    });
    const library = new ClassLibraryPage(page);
    await library.open();

    const signIn = new SignInPage(page);
    await expect.poll(() => page.url()).toContain('/sign-in?returnUrl=%2Fclasses');
    await signIn.ask(EMAIL);
    const code = new SignInCodePage(page);
    await code.code.pressSequentially('123456');

    await expect(library.heading).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/classes');
    expect(sent).toEqual([{ email: EMAIL, code: '123456' }]);
  });

  test('with no paired bike, a confirmed rider goes to Connect Bike (L2-002 AC2)', async ({
    page,
    api,
  }) => {
    api.answer('POST', CONFIRM, confirmed);
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask(EMAIL);

    await new SignInCodePage(page).code.pressSequentially('123456');

    await expect.poll(() => new URL(page.url()).pathname).toBe('/connect');
  });

  test('a pasted code is submitted as typed, ignoring what is not a digit (L2-002 AC5)', async ({
    page,
    api,
  }) => {
    const sent: unknown[] = [];
    api.answer('POST', CONFIRM, (request: Request) => {
      sent.push(request.postDataJSON());
      return { status: 200, body: confirmed };
    });
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask(EMAIL);

    await new SignInCodePage(page).code.fill('12 34-56');

    await expect.poll(() => sent).toEqual([{ email: EMAIL, code: '123456' }]);
  });

  test('six digits that do not match clear the field, mark it invalid and say so (L2-002 AC3)', async ({
    page,
    api,
  }) => {
    api.answer('POST', CONFIRM, refused('code_mismatch'));
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask(EMAIL);
    const code = new SignInCodePage(page);

    await code.code.pressSequentially('654321');

    await expect(code.codeError).toHaveRole('alert');
    await expect(code.codeError).toHaveText('That code doesn’t match. Try again.');
    await expect(code.code).toHaveAttribute('aria-invalid', 'true');
    await expect(code.code).toHaveValue('');
    await expect(code.code).toBeFocused();
  });

  test('an expired code says so and offers a new one (L2-002 AC4)', async ({ page, api }) => {
    api.answer('POST', CONFIRM, refused('code_expired'));
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask(EMAIL);
    const code = new SignInCodePage(page);

    await code.code.pressSequentially('123456');

    await expect(code.codeError).toHaveText('That code has expired.');
    await expect(code.resend).toContainText('Send a new code');
  });

  test('after five wrong codes even the right one is refused until a new code is sent (L2-003 AC3)', async ({
    page,
    api,
  }) => {
    api.answer('POST', CONFIRM, refused('code_locked'));
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.ask(EMAIL);
    const code = new SignInCodePage(page);

    await code.code.pressSequentially('123456');

    await expect(code.codeError).toHaveText('Too many wrong codes. Send a new code to try again.');
  });
});

test.describe('Stay signed in: the session', () => {
  test('when the backend cannot be reached, the screen opens all the same (L2-004 AC5)', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    api.answer('GET', '/api/riders/me', () => ({ status: 503 }));
    const home = new HomePage(page);
    await home.open();

    await expect(home.header.current()).toHaveText('Home');
  });

  test('a session that ends sends the rider to sign-in at the next screen (L2-004 AC3)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/classes', () => ApiFixture.sessionEnded);
    const library = new ClassLibraryPage(page);
    await library.open();
    await expect(library.heading).toBeVisible();

    await library.header.link('Race').click();

    await expect.poll(() => page.url()).toContain('/sign-in?returnUrl=%2Frace');
  });

  test('Page not found opens without a session', async ({ page, api }) => {
    api.signedOut();
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');

    await expect(notFound.heading).toHaveText('This page doesn’t exist.');
  });
});
