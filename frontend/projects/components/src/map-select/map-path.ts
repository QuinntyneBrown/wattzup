import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The unlock path on Map Select (design-system block map-path): an ordered list of every map, one `MapPathItem` each,
 * projected by the page.
 */
@Component({
  selector: 'wz-map-path',
  templateUrl: './map-path.html',
  styleUrl: './map-path.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPath {}
