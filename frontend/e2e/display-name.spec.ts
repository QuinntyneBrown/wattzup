// Acceptance test
// Traces to: L2-005 AC1, AC2, AC3, AC4
// Description: a rider with no display name is asked "What should other riders call you?" straight after the code
// is confirmed, and from any screen, before going on; Continue waits for a name, and a name that breaks the rule says
// what is allowed. Profile's headline uses the name, and its Settings row changes it in a dialog.
import type { Request } from '@playwright/test';
import { catalogue } from './fixtures/classes';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { DisplayNamePromptPage } from './pages/display-name-prompt.page';
import { ProfilePage } from './pages/profile.page';
import { SignInCodePage } from './pages/sign-in-code.page';
import { SignInPage } from './pages/sign-in.page';

const RIDER = '3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10';
const RULE = 'Use 2 to 24 characters: letters, digits, spaces, . _ and -.';
const NAME = '/api/riders/me/display-name';

test.describe('Choose a display name: the prompt', () => {
  test('a new account is asked for a name before going on to the screen it asked for (L2-005 AC1)', async ({
    page,
    api,
  }) => {
    const sent: unknown[] = [];
    api.signedOut();
    api.answer('GET', '/api/classes', catalogue);
    api.answer('POST', '/api/auth/code', () => ({ status: 202 }));
    api.answer('POST', '/api/auth/code/confirm', () => {
      api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
      return { status: 200, body: { riderId: RIDER, displayName: null, isNewAccount: true } };
    });
    api.answer('PUT', NAME, (request: Request) => {
      sent.push(request.postDataJSON());
      return { status: 200, body: { id: RIDER, displayName: 'Sam' } };
    });
    const library = new ClassLibraryPage(page);
    await library.open();
    await new SignInPage(page).ask('sam@example.com');
    await new SignInCodePage(page).code.pressSequentially('123456');

    const prompt = new DisplayNamePromptPage(page);
    await expect(prompt.heading).toHaveText('What should other riders call you?');
    await expect(prompt.continue).toBeDisabled();
    await prompt.name.fill('  Sam ');
    await prompt.continue.click();

    await expect(library.heading).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/classes');
    expect(sent).toEqual([{ displayName: 'Sam' }]);
  });

  test('a signed-in rider with no name is sent to the prompt from any screen (L2-005 AC1)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
    await new ClassLibraryPage(page).open();

    await expect.poll(() => page.url()).toContain('/sign-in/name?returnUrl=%2Fclasses');
    await expect(new DisplayNamePromptPage(page).heading).toHaveText(
      'What should other riders call you?',
    );
  });

  test('Continue stays disabled until a name is entered (L2-005 AC1)', async ({ page, api }) => {
    api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
    const prompt = new DisplayNamePromptPage(page);
    await prompt.open();

    await prompt.name.fill('   ');

    await expect(prompt.continue).toBeDisabled();
    await expect(prompt.hint).toHaveText('2 to 24 characters: letters, digits, spaces, . _ and -');
  });

  test('a name that breaks the rule is not sent and the field says what is allowed (L2-005 AC2, AC4)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
    const prompt = new DisplayNamePromptPage(page);
    await prompt.open();

    await prompt.name.fill('<b>Sam</b>');
    await prompt.continue.click();

    await expect(prompt.error).toHaveRole('alert');
    await expect(prompt.error).toHaveText(RULE);
    await expect(prompt.name).toHaveAttribute('aria-invalid', 'true');
    await expect(prompt.name).toHaveValue('<b>Sam</b>');
    expect(api.requests()).not.toContain(`PUT ${NAME}`);
  });

  test('a name the backend refuses says what is allowed (L2-005 AC2)', async ({ page, api }) => {
    api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
    api.answer('PUT', NAME, () => ({
      status: 400,
      body: { status: 400, title: 'Use 2 to 24 characters.', code: 'display_name_invalid' },
    }));
    const prompt = new DisplayNamePromptPage(page);
    await prompt.open();

    await prompt.name.fill('Sam');
    await prompt.continue.click();

    await expect(prompt.error).toHaveText(RULE);
    await expect(prompt.name).toHaveAttribute('aria-invalid', 'true');
  });

  test('a save that fails keeps the name and says so', async ({ page, api }) => {
    api.answer('GET', '/api/riders/me', { id: RIDER, displayName: null });
    api.answer('PUT', NAME, () => ({ status: 503 }));
    const prompt = new DisplayNamePromptPage(page);
    await prompt.open();

    await prompt.name.fill('Sam');
    await prompt.continue.click();

    await expect(prompt.message).toHaveText(
      'We couldn’t save your name. Check your connection and try again.',
    );
    await expect(prompt.name).toHaveValue('Sam');
    await expect(prompt.continue).toBeEnabled();
  });
});

test.describe('Choose a display name: Profile', () => {
  test('the headline uses the name, and Settings changes it in a dialog (L2-005 AC3)', async ({
    page,
    api,
  }) => {
    const sent: unknown[] = [];
    api.answer('PUT', NAME, (request: Request) => {
      sent.push(request.postDataJSON());
      return { status: 200, body: { id: RIDER, displayName: 'Ada L.' } };
    });
    const profile = new ProfilePage(page);
    await profile.open();
    await expect(profile.heading).toHaveText('Ada · Level 1');
    await expect(profile.header.current()).toHaveText('Profile');

    await profile.displayName.click();
    await expect(profile.dialog.root).toBeVisible();
    await expect(profile.dialog.name).toHaveValue('Ada');
    await expect(profile.dialog.name).toBeFocused();
    await profile.dialog.name.fill('Ada L.');
    await profile.dialog.save.click();

    await expect(profile.dialog.root).toBeHidden();
    await expect(profile.heading).toHaveText('Ada L. · Level 1');
    await expect(profile.displayName).toBeFocused();
    expect(sent).toEqual([{ displayName: 'Ada L.' }]);
  });

  test('Cancel and Escape close the dialog and change nothing', async ({ page, api }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.displayName.click();
    await profile.dialog.name.fill('Someone else');
    await profile.dialog.cancel.click();
    await expect(profile.dialog.root).toBeHidden();
    await profile.displayName.click();
    await page.keyboard.press('Escape');

    await expect(profile.dialog.root).toBeHidden();
    await expect(profile.heading).toHaveText('Ada · Level 1');
    expect(api.requests()).not.toContain(`PUT ${NAME}`);
  });

  test('a name the backend refuses keeps the dialog open and says what is allowed (L2-005 AC2)', async ({
    page,
    api,
  }) => {
    api.answer('PUT', NAME, () => ({
      status: 400,
      body: { status: 400, title: 'Use 2 to 24 characters.', code: 'display_name_invalid' },
    }));
    const profile = new ProfilePage(page);
    await profile.open();
    await profile.displayName.click();

    await profile.dialog.name.fill('Ada Lovelace');
    await profile.dialog.save.click();

    await expect(profile.dialog.error).toHaveText(RULE);
    await expect(profile.dialog.root).toBeVisible();
    await profile.dialog.cancel.click();
    await expect(profile.heading).toHaveText('Ada · Level 1');
  });
});
