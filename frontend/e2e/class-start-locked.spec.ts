// Acceptance test
// Traces to: L2-082 AC4
// Description: a locked class's Class Start address opens the Class Library instead, as does an address for a class the
// catalogue does not hold.
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/classes', library);
});

test('a locked class’s Class Start address opens the Class Library instead (L2-082 AC4)', async ({
  page,
}) => {
  await new ClassStartPage(page).open('vice-city-pyramid-30');

  await expect(page).toHaveURL('/classes');
  await expect(new ClassLibraryPage(page).heading).toBeVisible();
});

test('an address for a class the catalogue does not hold opens the Class Library (L2-082 AC4)', async ({
  page,
}) => {
  await new ClassStartPage(page).open('no-such-class');

  await expect(page).toHaveURL('/classes');
  await expect(new ClassLibraryPage(page).heading).toBeVisible();
});
