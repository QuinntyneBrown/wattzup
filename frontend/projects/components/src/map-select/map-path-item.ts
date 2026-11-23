import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One step of the unlock path (design-system element map-path__item): the line to the next step, volt while the map is
 * open, the dot that says where the map stands, and the projected row. The last step has no line.
 */
@Component({
  selector: 'li[wz-map-path-item]',
  templateUrl: './map-path-item.html',
  styleUrl: './map-path-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'map-path__item' },
})
export class MapPathItem {
  readonly state = input.required<'open' | 'next' | 'locked'>();
  readonly last = input(false);
}
