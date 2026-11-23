// Acceptance test
// Traces to: L2-080 AC1; L2-081 AC1 to AC4, AC6; L2-082 AC2, AC3; L2-043 AC2
// Description: the Class Library reads its head and its three shelves, lists the catalogue's classes in order, and an
// open card leads to its Class Start with its cover, length, resistance profile, title, channel and focus; with no
// group sessions to read, it shows no group chip. The Class length tabs show one shelf or all, by pointer or arrow key. For
// the new rider, the classes above level 1 are disabled buttons that say the level that opens them.
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';

test.describe('Class Library', () => {
  test.beforeEach(({ api }) => {
    api.answer('GET', '/api/classes', library);
  });

  test('reads its head and its shelves, with the classes in catalogue order (L2-081 AC1, AC3, L2-080 AC1) @critical', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();

    await expect(classes.heading).toBeVisible();
    await expect(classes.lead).toHaveText(
      'Ride a video alone whenever you like, or join a group of 8–10 riders. The bike follows the class either way.',
    );
    await expect(classes.shelfTitles).toHaveText(['20 min', '30 min', '60 min endurance']);
    await expect(classes.shelfBlurbs).toHaveText([
      'Short and sharp — fits a lunch break.',
      'Structured intervals with a proper warm-up.',
      'Long aerobic rides. Steady legs, steady heart.',
    ]);
    await expect(classes.cardTitles).toHaveText([
      '20 Minute Power Intervals',
      '20 Min Threshold Builder',
      '30 Minute HIIT Cardio',
      '30 Min Tempo Paceline',
      '30 Min Vice City Pyramid',
      '60 Min Dolomites Endurance',
      '60 Min Coastal Endurance + Surges',
    ]);
  });

  test('an open card leads to its Class Start with its cover, length, profile, channel and focus, and no group chip (L2-081 AC4, AC6)', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();

    const hiit = classes.card('30 Minute HIIT Cardio');
    await expect(hiit.root).toHaveAttribute('href', '/classes/hiit-cardio-30');
    await expect(hiit.cover).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
    );
    await expect(hiit.time).toHaveText('30:00');
    await expect(hiit.profileBars).toHaveCount(17);
    await expect(hiit.meta).toHaveText('GCN Training · HIIT');
    await expect(hiit.group).toHaveCount(0);
    await expect(classes.card('20 Minute Power Intervals').time).toHaveText('20:00');
  });

  test('for the new rider, the classes above level 1 are locked and say the level that opens them (L2-082 AC2, AC3, L2-043 AC2)', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();

    for (const [title, level] of [
      ['30 Min Tempo Paceline', 5],
      ['30 Min Vice City Pyramid', 10],
      ['60 Min Dolomites Endurance', 10],
      ['60 Min Coastal Endurance + Surges', 20],
    ] as const) {
      const locked = classes.card(title);
      await expect(locked.root).toHaveJSProperty('tagName', 'BUTTON');
      await expect(locked.root).toBeDisabled();
      await expect(locked.lock).toHaveText(`Opens at level ${level}`);
      await expect(locked.group).toHaveCount(0);
    }
    for (const title of [
      '20 Minute Power Intervals',
      '20 Min Threshold Builder',
      '30 Minute HIIT Cardio',
    ]) {
      await expect(classes.card(title).root).toHaveJSProperty('tagName', 'A');
      await expect(classes.card(title).lock).toHaveCount(0);
    }

    // A locked card stays in the tab order, so its level is announced, and leads nowhere.
    await classes.card('30 Min Vice City Pyramid').root.focus();
    await expect(classes.card('30 Min Vice City Pyramid').root).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/classes$/);
  });

  test('a Class length tab shows only its shelf, All shows every shelf, and the arrow keys move between tabs (L2-081 AC2)', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();
    await expect(classes.tab('All')).toHaveAttribute('aria-selected', 'true');

    await classes.tab('30 min').click();
    await expect(classes.tab('30 min')).toHaveAttribute('aria-selected', 'true');
    await expect(classes.tab('All')).toHaveAttribute('aria-selected', 'false');
    await expect(classes.shelfTitles).toHaveText(['30 min']);

    await page.keyboard.press('ArrowRight');
    await expect(classes.tab('60 min')).toBeFocused();
    await expect(classes.tab('60 min')).toHaveAttribute('aria-selected', 'true');
    await expect(classes.shelfTitles).toHaveText(['60 min endurance']);

    await page.keyboard.press('ArrowRight');
    await expect(classes.tab('All')).toBeFocused();
    await expect(classes.shelfTitles).toHaveText(['20 min', '30 min', '60 min endurance']);

    await page.keyboard.press('ArrowLeft');
    await expect(classes.tab('60 min')).toHaveAttribute('aria-selected', 'true');
  });
});
