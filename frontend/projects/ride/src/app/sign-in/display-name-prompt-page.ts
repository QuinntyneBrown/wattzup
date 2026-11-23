import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DisplayNamePrompt } from '@telo/components';
import { DisplayNameStore } from '../session/display-name-store';
import { SignInStore } from './sign-in-store';

/**
 * The display name prompt (L2-005 AC1, docs/mocks/pages/sign-in-name/): a rider with no display name chooses one
 * before going on, then opens the screen they asked for, or Home.
 */
@Component({
  selector: 'wz-display-name-prompt-page',
  templateUrl: './display-name-prompt-page.html',
  styleUrl: './display-name-prompt-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DisplayNamePrompt],
})
export default class DisplayNamePromptPage {
  protected readonly store = inject(DisplayNameStore);
  private readonly signIn = inject(SignInStore);
  private readonly router = inject(Router);

  /** The screen the guard sent the rider from (query parameter). */
  readonly returnUrl = input<string>();

  protected async save(name: string): Promise<void> {
    if (await this.store.save(name)) {
      this.signIn.returnTo(this.returnUrl());
      await this.router.navigateByUrl(this.signIn.returnUrl());
    }
  }
}
