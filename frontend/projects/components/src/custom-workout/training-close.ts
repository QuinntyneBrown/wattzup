import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The training header's Close link (design-system element training-header__close): its icon before the page's words. */
@Component({
  selector: 'a[wz-training-close]',
  templateUrl: './training-close.html',
  styleUrl: './training-close.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'training-header__close' },
})
export class TrainingClose {}
