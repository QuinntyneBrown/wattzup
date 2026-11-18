import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import type { ProfileBar } from '../ride-profile/ride-profile';

/** What a class card shows; the page computes it from the class (L2-079 AC5 to AC7). */
export interface ClassCardView {
  id: string;
  href: string;
  title: string;
  /** The plan's total time, `m:ss` or `h:mm:ss`. */
  length: string;
  /** `<channel> · <focus> · Peak L<n>`. */
  meta: string;
  channel: string;
  /** The YouTube thumbnail, or null for the poster. */
  cover: string | null;
  /** True when the class has no video: the card notes `Video link not set`. */
  noVideo: boolean;
  profile: ProfileBar[];
  profileTotal: number;
  /** `Resistance profile: <structure>`. */
  profileLabel: string;
}

/**
 * One class of the library: a link to its class page with the cover, length, plan strip, title
 * and meta. A plain click emits `open` so the page can route; any other click follows the link.
 */
@Component({
  selector: 'wz-class-card',
  imports: [Icon],
  templateUrl: './class-card.html',
  styleUrl: './class-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassCard {
  readonly view = input.required<ClassCardView>();
  readonly open = output<string>();
  /** The thumbnail failed to load; the page shows the poster instead (L2-079 AC6). */
  readonly coverFailed = output<string>();

  protected onClick(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.open.emit(this.view().id);
  }
}
