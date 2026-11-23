import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** The root component: the skip link and the router outlet every screen renders into. */
@Component({
  selector: 'wz-root',
  imports: [RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly document = inject(DOCUMENT);

  /** Moves focus to the screen's `main#main` without a navigation (a `#main` href would leave the route). */
  protected skipToMain(event: Event): void {
    const main = this.document.getElementById('main');
    if (!main) return;
    event.preventDefault();
    main.focus();
  }
}
