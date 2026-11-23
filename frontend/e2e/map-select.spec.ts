// Acceptance test
// Traces to: L2-046 AC1 to AC5; L2-045 AC1; L2-040 AC1, AC6; L2-041 AC1
// Description: Map Select reads "Maps" and its lead above an ordered list of every map, in unlock order. A new rider's
// open maps, Prairie Paceline and Old Town Criterium, link to Race Setup with their thumbnail, facts and stars, and no
// best line before they are ridden. Cliffside Coast, the next unlock, is a disabled button ringed gold with its facts
// and goal; every other locked map is a disabled button with a greyed photo, a lock and its goal. The aside lists the
// three star rules and when racing people opens.
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';

test.describe('Map Select', () => {
  test.beforeEach(({ api }) => {
    api.answer('GET', '/api/maps', maps);
  });

  test('reads Maps and its lead above every map in unlock order (L2-046 AC1, L2-045 AC1) @critical', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    await expect(select.heading).toBeVisible();
    await expect(select.lead).toHaveText(
      'Each map opens the next. Race well on the ones you have to unlock the rest.',
    );
    await expect(select.path).toHaveJSProperty('tagName', 'OL');
    await expect(select.names).toHaveCount(7);
    await expect(select.names).toContainText([
      'Prairie Paceline',
      'Old Town Criterium',
      'Cliffside Coast',
      'Neon Docklands',
      'Dolomites',
      'Vice City',
      'Col du Granit',
    ]);
  });

  test('a new rider’s open maps link to Race Setup with their thumbnail, facts and no stars, and no best line (L2-046 AC2, L2-040 AC1)', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    for (const [name, id, facts] of [
      ['Prairie Paceline', 'prairie-paceline', '18.4 km · 90 m climbing · Easy'],
      ['Old Town Criterium', 'old-town-criterium', '14.2 km · 140 m climbing · Easy'],
    ]) {
      const row = select.row(name);
      await expect(row.root).toHaveAttribute('href', `/race/${id}`);
      await expect(row.thumbnail).toHaveAttribute('src', `maps/${id}.jpg`);
      await expect(row.thumbnail).toHaveJSProperty('complete', true);
      await expect(row.facts).toHaveText(facts);
      await expect(row.stars).toHaveAccessibleName('0 of 3 stars');
      await expect(row.best).toHaveCount(0);
      await expect(row.goal).toHaveCount(0);
    }
  });

  test('the next unlock is a disabled button ringed gold, with its facts and its goal (L2-046 AC3, L2-041 AC1)', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    const next = select.row('Cliffside Coast');
    await expect(next.root).toBeDisabled();
    await expect(next.root).toHaveClass(/map-row--next/);
    await expect(next.name).toHaveText('Cliffside Coast, locked, your next unlock');
    await expect(next.facts).toHaveText('32 km · 410 m climbing · Moderate');
    await expect(next.goal).toHaveText('Finish top 3 vs Bots on Prairie Paceline');
    await expect(next.lock).toBeVisible();
  });

  test('every other locked map is a disabled button with a greyed photo, a lock and its goal (L2-046 AC4, L2-040 AC6)', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    for (const [name, goal] of [
      ['Neon Docklands', 'Finish top 3 vs Bots on Old Town Criterium'],
      ['Dolomites', 'Earn 2★ on Cliffside Coast'],
      ['Vice City', 'Reach rider level 10'],
      ['Col du Granit', 'Earn 3★ on Dolomites'],
    ]) {
      const row = select.row(name);
      await expect(row.root).toBeDisabled();
      await expect(row.root).not.toHaveClass(/map-row--next/);
      await expect(row.name).toHaveText(`${name}, locked`);
      await expect(row.goal).toHaveText(goal);
      await expect(row.lock).toBeVisible();
      await expect(row.thumbnail).toHaveCSS('filter', 'grayscale(1)');
      await expect(row.stars).toHaveCount(0);
    }
  });

  test('the aside lists the three star rules and when racing people opens (L2-046 AC5)', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    await expect(select.aside).toBeVisible();
    await expect(select.starRules).toHaveText([
      'Finish the race',
      'Top 3 against the medium pack',
      'Beat your best time',
    ]);
    for (const [index, stars] of ['1 of 1 stars', '2 of 2 stars', '3 of 3 stars'].entries()) {
      await expect(select.starRules.nth(index).getByRole('img')).toHaveAccessibleName(stars);
    }
    await expect(select.asideNote).toHaveText(
      'Racing against people opens at level 3. Until then, the bots are good practice.',
    );
  });
});
