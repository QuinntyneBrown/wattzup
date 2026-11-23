import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The class's world on the class ride's stage (design-system block class-world, docs/mocks/pages/class-ride/world.html):
 * the world's panorama, the world drawn over it in the `scene` slot, faded in when it arrives, and the class video in
 * the stage's corner in the `video` slot (L2-153 AC3). This component only lays them out.
 */
@Component({
  selector: 'wz-class-world',
  templateUrl: './class-world.html',
  styleUrl: './class-world.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassWorld {
  /** The world's panorama, with what it shows; `null` for a world without one. */
  readonly panorama = input<{ readonly url: string; readonly alt: string } | null>(null);
}
