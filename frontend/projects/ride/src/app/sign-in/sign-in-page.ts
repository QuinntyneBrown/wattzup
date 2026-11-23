import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SignInForm } from '@telo/components';
import { SignInStore } from './sign-in-store';

/**
 * Sign in (L2-001, docs/mocks/pages/sign-in/): sends a code, then opens the code screen. The guard's `returnUrl` is
 * where the rider goes once the code is confirmed (AC1). Opened by a deletion (navigation state `accountDeleted`), it
 * says the account was deleted (L2-006 AC3).
 */
@Component({
  selector: 'wz-sign-in-page',
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SignInForm],
})
export default class SignInPage {
  protected readonly store = inject(SignInStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly accountDeleted =
    this.router.currentNavigation()?.extras.state?.['accountDeleted'] === true;

  /** The screen the guard sent the visitor from (query parameter). */
  readonly returnUrl = input<string>();

  protected async send(email: string): Promise<void> {
    this.store.returnTo(this.returnUrl());
    if (await this.store.send(email)) {
      await this.router.navigate(['code'], { relativeTo: this.route });
    }
  }
}
