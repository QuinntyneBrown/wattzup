import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';
import { DeleteAccountDialog } from './delete-account.dialog';
import { DisplayNameDialog } from './display-name.dialog';

/** Profile at `/profile` (docs/mocks/pages/profile/): the headline and Settings, with their dialogs. */
export class ProfilePage {
  readonly header: AppHeader;
  readonly heading: Locator;
  /** The line under the headline: the XP to the next level and the streak (L2-038 AC4, L2-042 AC4). */
  readonly meta: Locator;
  /** The XP bar under the headline, an image named by its XP (L2-109 AC1). */
  readonly xpBar: Locator;
  readonly mainColumn: Locator;
  /** The Settings rows that go to a screen (L2-112 AC1, AC2). */
  readonly bikeRow: Locator;
  readonly rideSettings: Locator;
  readonly customWorkout: Locator;
  /** Every Settings row, in order. */
  readonly rows: Locator;
  readonly rowTitles: Locator;
  readonly rowBodies: Locator;
  readonly settings: Locator;
  /** The Display name row in Settings, which opens the dialog (L2-005 AC3). */
  readonly displayName: Locator;
  readonly dialog: DisplayNameDialog;
  /** Settings' Sign out row (L2-006 AC1). */
  readonly signOut: Locator;
  /** Settings' Delete my account row, which opens its dialog (L2-006 AC2). */
  readonly deleteAccount: Locator;
  /** What Settings says when an action failed. */
  readonly settingsMessage: Locator;
  readonly deleteDialog: DeleteAccountDialog;
  /** The notice above the level, as when a ride was too short to save (L2-108 AC3). */
  readonly notice: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.meta = page.locator('.profile-level__meta');
    this.xpBar = page.locator('.profile-level').getByRole('img');
    this.mainColumn = page.locator('.profile__main');
    this.settings = page.getByRole('complementary', { name: 'Settings' });
    this.bikeRow = this.settings.getByRole('listitem').first().getByRole('link');
    this.rideSettings = this.settings.getByRole('link', { name: /^Ride settings/ });
    this.customWorkout = this.settings.getByRole('link', { name: /^Custom workout/ });
    this.rows = this.settings.locator('.setting-row');
    this.rowTitles = this.rows.locator('.setting-row__title');
    this.rowBodies = this.rows.locator('.setting-row__body');
    this.displayName = this.settings.getByRole('button', { name: /^Display name/ });
    this.dialog = new DisplayNameDialog(page);
    this.signOut = this.settings.getByRole('button', { name: /^Sign out/ });
    this.deleteAccount = this.settings.getByRole('button', { name: /^Delete my account/ });
    this.settingsMessage = this.settings.getByRole('alert');
    this.deleteDialog = new DeleteAccountDialog(page);
    this.notice = this.mainColumn.locator('.profile__notice');
  }

  async open(): Promise<void> {
    await this.page.goto('/profile');
  }
}
