import { Dialog, type DialogConfig } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BIKE_CONNECTION,
  BLUETOOTH_SUPPORT,
  CURRENT_RIDER,
  PROGRESS_STORE,
  REMEMBERED_BIKE,
} from '@telo/api';
import { Banner, InlineMessage, ProfileLevel, SettingRow } from '@telo/components';
import { AccountStore } from './account-store';
import { DeleteAccountDialog } from './delete-account-dialog';
import { toLevelView } from '../progress/level-view';
import { profileMeta, profileXpLabel } from '../progress/profile-meta';
import { DisplayNameDialog } from './display-name-dialog';
import { openDiagnostics } from '../diagnostics/open-diagnostics';
import { bikeRow } from './bike-row';

/**
 * Profile (docs/mocks/pages/profile/): in slice 9.3, the headline with the rider's display name and level ("Sam ·
 * Level 1", L2-005 AC3), the level from the progress the header shows (slice 10.3), the XP to the next level and the
 * streak under it (slice 10.4), and Settings, whose Display name row changes the name in a dialog, and whose Sign out and
 * Delete my account rows end the session or delete the account (slice 9.4, L2-006). Slice 13.3 draws the headline
 * through `ProfileLevel`, with the XP bar and the rides and kilometres, and adds the bike, Ride settings and Custom
 * workout rows.
 */
@Component({
  selector: 'wz-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Banner, InlineMessage, ProfileLevel, SettingRow],
})
export default class ProfilePage {
  private readonly currentRider = inject(CURRENT_RIDER);
  /**
   * Whether the custom ride that opened Profile was under a minute and discarded (L2-108 AC3). The page may be built
   * once the navigation has finished, so its state is read from the last successful one then.
   */
  protected readonly rideTooShort = (() => {
    const router = inject(Router);
    const navigation = router.currentNavigation() ?? router.lastSuccessfulNavigation();
    return navigation?.extras.state?.['rideTooShort'] === true;
  })();
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  protected readonly account = inject(AccountStore);

  private readonly progress = inject(PROGRESS_STORE);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly remembered = inject(REMEMBERED_BIKE).get();

  /**
   * The bike row (L2-112 AC1, AC2). It goes to Connect Bike: with no bike, to pair one; with one, until slice 25.1's
   * Diagnostics dialog takes its place.
   */
  protected readonly bike = computed(() =>
    bikeRow(
      this.connection.ble(),
      this.support.state(),
      (this.connection.bike() ?? this.remembered)?.name ?? null,
    ),
  );

  /** The rider's level, unknown until the progress arrives. */
  protected readonly level = computed(() => this.progress.progress()?.level ?? null);
  /** The XP bar's name and fill, once the progress arrives (L2-109 AC1). */
  protected readonly xp = computed(() => {
    const progress = this.progress.progress();
    return progress === null
      ? null
      : { label: profileXpLabel(progress), fillPercent: toLevelView(progress).fillPercent };
  });
  /** "760 XP to level 8 · 23 rides · 412 km · 4-day streak", once the progress arrives. */
  protected readonly meta = computed(() => {
    const progress = this.progress.progress();
    return progress === null ? null : profileMeta(progress);
  });
  /** "Sam · Level 7"; the name or the level alone until both are known. */
  protected readonly headline = computed(() => {
    const level = this.level();
    return [this.name(), level === null ? null : `Level ${level}`].filter(Boolean).join(' · ');
  });
  protected readonly name = computed(() => this.currentRider.rider()?.displayName ?? null);

  /** Diagnostics, from the bike row once a bike is paired (L2-113 AC1). */
  protected openDiagnostics(): void {
    void openDiagnostics(this.dialog, this.injector);
  }

  protected changeName(): void {
    this.dialog.open(DisplayNameDialog, {
      ...this.settingsDialog('display-name', 'display-name'),
      data: this.name() ?? '',
    });
  }

  protected deleteAccount(): void {
    this.dialog.open(DeleteAccountDialog, {
      ...this.settingsDialog('delete-account', 'delete-account-confirm'),
      ariaDescribedBy: 'delete-account-lead',
    });
  }

  /**
   * How a Settings dialog opens: a sheet at the bottom of a phone, centred from sm (640 px), as the design system draws
   * a dialog, labelled by `${block}-title` and with the focus on `field`. The CDK returns the focus to the row when it
   * closes.
   */
  private settingsDialog(
    block: string,
    field: string,
  ): Pick<
    DialogConfig,
    | 'positionStrategy'
    | 'disableClose'
    | 'injector'
    | 'ariaLabelledBy'
    | 'autoFocus'
    | 'hasBackdrop'
  > {
    const sheet = matchMedia('(max-width: 39.99rem)').matches;
    const position = this.overlay.position().global().centerHorizontally();
    return {
      positionStrategy: sheet ? position.bottom('0') : position.centerVertically(),
      disableClose: true,
      injector: this.injector,
      ariaLabelledBy: `${block}-title`,
      autoFocus: `#${field}`,
      hasBackdrop: false,
    };
  }
}
