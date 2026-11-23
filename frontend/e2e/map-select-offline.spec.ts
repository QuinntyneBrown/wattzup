// Acceptance test
// Traces to: L2-046 AC7; L2-135 AC3; ADR 0029
// Description: when the backend cannot be reached and no catalogue is kept on the device, Map Select says the maps
// can't be loaded, and Try again reads them once the backend answers again; once the catalogue has been read, Map
// Select reads the kept copy when the backend cannot be reached.
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';

test('with no catalogue to read or kept, Map Select says so, and Try again reads it (L2-046 AC7)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/maps', () => ({ status: 503 }));
  const select = new MapSelectPage(page);
  await select.open();

  await expect(select.heading).toBeVisible();
  await expect(select.error).toHaveText(
    'The maps can’t be loaded. Check your connection and try again.',
  );
  await expect(select.rows).toHaveCount(0);
  await expect(select.aside).toBeVisible();

  api.answer('GET', '/api/maps', maps);
  await select.retry.click();

  await expect(select.rows).toHaveCount(7);
  await expect(select.error).toHaveCount(0);
});

test('once read, the catalogue is kept, and Map Select reads it when the backend cannot be reached (L2-135 AC3)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/maps', maps);
  const select = new MapSelectPage(page);
  await select.open();
  await expect(select.rows).toHaveCount(7);

  api.answer('GET', '/api/maps', () => ({ status: 503 }));
  await page.reload();

  await expect(select.rows).toHaveCount(7);
  await expect(select.row('Cliffside Coast').goal).toHaveText(
    'Finish top 3 vs Bots on Prairie Paceline',
  );
  await expect(select.error).toHaveCount(0);
});
