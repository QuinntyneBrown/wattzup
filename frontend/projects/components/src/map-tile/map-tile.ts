import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Stars } from '../stars/stars';

/**
 * A map's tile in Home's Race door (block map-tile, L2-034): its photo, name and stars. A locked tile greys its photo,
 * shows a lock and is named "{map}, locked: see how to open it" (AC4). The host is the link; the page gives it its route
 * and its content, the map's name, which `name` repeats for the locked tile's label.
 */
@Component({
  selector: 'a[wz-map-tile]',
  imports: [Stars],
  templateUrl: './map-tile.html',
  styleUrl: './map-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'map-tile',
    '[attr.aria-label]': 'label()',
  },
})
export class MapTile {
  /** The map's name, for a locked tile's label. */
  readonly name = input.required<string>();
  readonly photoUrl = input.required<string>();
  readonly stars = input(0);
  readonly locked = input(false);

  protected readonly label = computed(() =>
    this.locked() ? `${this.name()}, locked: see how to open it` : null,
  );
}
