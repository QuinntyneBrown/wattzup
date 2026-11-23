import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A quiet link to a full list, with an arrow (block more-link): "All maps", "All classes". The page gives it its route. */
@Component({
  selector: 'a[wz-more-link]',
  templateUrl: './more-link.html',
  styleUrl: './more-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'more-link' },
})
export class MoreLink {}
