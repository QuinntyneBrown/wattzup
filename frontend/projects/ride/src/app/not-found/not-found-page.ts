import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@telo/components';

/** Page not found (L2-145): any address that matches no screen, with one way back to Home. */
@Component({
  selector: 'wz-not-found-page',
  imports: [RouterLink, Button],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {}
