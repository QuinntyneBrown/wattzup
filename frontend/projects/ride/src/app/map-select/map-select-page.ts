import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, InlineMessage, MapPath, MapPathItem, MapRow, MapsAside } from '@telo/components';
import { MapPathStore } from './map-path-store';

/**
 * Map Select at `/race` (L2-046): "Maps", its lead, and the unlock path of every map in unlock order, beside the star
 * rules.
 */
@Component({
  selector: 'wz-map-select-page',
  imports: [RouterLink, Button, InlineMessage, MapPath, MapPathItem, MapRow, MapsAside],
  templateUrl: './map-select-page.html',
  styleUrl: './map-select-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MapPathStore],
})
export default class MapSelectPage {
  protected readonly store = inject(MapPathStore);
}
