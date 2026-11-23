// Acceptance test
// Traces to: L2-081 AC7; L2-080 AC3
// Description: when the backend cannot be reached and no catalogue is kept on the device, the Class Library says the
// classes can't be loaded, and Try again reads them once the backend answers again.
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';

test('with no catalogue to read or kept, the library says so, and Try again reads it (L2-081 AC7)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/classes', () => ({ status: 503 }));
  const classes = new ClassLibraryPage(page);
  await classes.open();

  await expect(classes.heading).toBeVisible();
  await expect(classes.error).toHaveText(
    'The classes can’t be loaded. Check your connection and try again.',
  );
  await expect(classes.cards).toHaveCount(0);

  api.answer('GET', '/api/classes', library);
  await classes.retry.click();

  await expect(classes.cardTitles).toHaveCount(7);
  await expect(classes.error).toHaveCount(0);
});
