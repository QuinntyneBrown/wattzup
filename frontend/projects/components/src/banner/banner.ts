import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A notice above a page's content (block banner, docs/design-system/assets/components.css): its icon, a bold title and
 * a muted detail, and the page's action in the `action` slot, announced politely as a status, or at once as an alert
 * when `alert` is set. `gold` marks an unlock (Home's unlocked banner, L2-036), with the lock opening as its icon;
 * `danger` a failure, with a warning sign (World loading's stopped download, L2-156 AC1); `info` a fact, with an "i"
 * (World loading without 3D, AC4). The icon and the words carry the tone, never the colour alone.
 */
@Component({
  selector: 'wz-banner',
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "alert() ? 'alert' : 'status'",
    class: 'banner',
    '[class.banner--gold]': "tone() === 'gold'",
    '[class.banner--danger]': "tone() === 'danger'",
    '[class.banner--info]': "tone() === 'info'",
  },
})
export class Banner {
  readonly title = input.required<string>();
  readonly detail = input('');
  readonly tone = input<'gold' | 'danger' | 'info'>('gold');
  readonly alert = input(false);
}
