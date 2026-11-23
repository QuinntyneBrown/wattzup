import type { Request } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { ProfilePage } from './pages/profile.page';
import { SignInPage } from './pages/sign-in.page';

// Sign out and delete an account (L2-006, docs/detailed-designs/accounts/sign-out-and-delete-an-account): Profile's
// Settings sign this device out, or delete the account behind a dialog that asks for "delete".

const SIGN_OUT = '/api/auth/sign-out';
const ME = '/api/riders/me';
const UNREACHABLE = { status: 503, body: { status: 503, title: 'Service unavailable.' } };

test.describe('Sign out', () => {
  test('Sign out ends the session and opens sign-in (L2-006 AC1)', async ({ page, api }) => {
    api.answer('POST', SIGN_OUT, () => ({ status: 204 }));
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.signOut.click();

    const signIn = new SignInPage(page);
    await expect(signIn.heading).toHaveText('Sign in to Telo Ride');
    expect(signIn.url()).toBe('/sign-in');
    expect(api.requests().filter((sent) => sent === `POST ${SIGN_OUT}`)).toHaveLength(1);
    await page.goBack();
    await expect(signIn.heading).toHaveText('Sign in to Telo Ride');
  });

  test('a sign-out that cannot reach the backend keeps the rider signed in and says so (L2-006 AC1)', async ({
    page,
    api,
  }) => {
    api.answer('POST', SIGN_OUT, () => UNREACHABLE);
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.signOut.click();

    await expect(profile.settingsMessage).toHaveText(
      'We couldn’t sign you out. Check your connection and try again.',
    );
    await expect(profile.heading).toHaveText('Ada · Level 1');
    await expect(profile.signOut).toBeEnabled();
  });
});

test.describe('Delete my account', () => {
  test('the dialog says what is removed and waits for "delete" (L2-006 AC2)', async ({
    page,
    api,
  }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.deleteAccount.click();

    const dialog = profile.deleteDialog;
    await expect(dialog.root).toBeVisible();
    await expect(dialog.lead).toHaveText(
      'This removes your email, display name, progress and ride history, and signs you out everywhere. It can’t be undone.',
    );
    await expect(dialog.confirmation).toBeFocused();
    await expect(dialog.delete).toBeDisabled();
    await dialog.confirmation.fill('delet');
    await expect(dialog.delete).toBeDisabled();
    await dialog.confirmation.fill('  DELETE ');
    await expect(dialog.delete).toBeEnabled();
    expect(api.requests()).not.toContain(`DELETE ${ME}`);
  });

  test('a confirmed deletion opens sign-in, which says the account was deleted (L2-006 AC3)', async ({
    page,
    api,
  }) => {
    let deletes = 0;
    api.answer('DELETE', ME, (request: Request) => {
      deletes += request.method() === 'DELETE' ? 1 : 0;
      return { status: 204 };
    });
    const profile = new ProfilePage(page);
    await profile.open();
    await profile.deleteAccount.click();

    await profile.deleteDialog.confirmation.fill('delete');
    await profile.deleteDialog.delete.click();

    const signIn = new SignInPage(page);
    await expect(signIn.heading).toHaveText('Sign in to Telo Ride');
    await expect(signIn.message).toHaveText(
      'Your account was deleted. Its personal data is erased within 30 days.',
    );
    await expect(profile.deleteDialog.root).toBeHidden();
    expect(deletes).toBe(1);
  });

  test('a deletion that fails keeps the dialog open with the word and says so (L2-006 AC3)', async ({
    page,
    api,
  }) => {
    api.answer('DELETE', ME, () => UNREACHABLE);
    const profile = new ProfilePage(page);
    await profile.open();
    await profile.deleteAccount.click();

    await profile.deleteDialog.confirmation.fill('delete');
    await profile.deleteDialog.delete.click();

    await expect(profile.deleteDialog.message).toHaveText(
      'We couldn’t delete your account. Check your connection and try again.',
    );
    await expect(profile.deleteDialog.confirmation).toHaveValue('delete');
    await expect(profile.deleteDialog.delete).toBeEnabled();
    await profile.deleteDialog.cancel.click();
    await expect(profile.heading).toHaveText('Ada · Level 1');
  });

  test('Cancel and Escape close the dialog and delete nothing', async ({ page, api }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.deleteAccount.click();
    await profile.deleteDialog.confirmation.fill('delete');
    await profile.deleteDialog.cancel.click();
    await expect(profile.deleteDialog.root).toBeHidden();
    await expect(profile.deleteAccount).toBeFocused();
    await profile.deleteAccount.click();
    await page.keyboard.press('Escape');

    await expect(profile.deleteDialog.root).toBeHidden();
    expect(api.requests()).not.toContain(`DELETE ${ME}`);
  });
});
