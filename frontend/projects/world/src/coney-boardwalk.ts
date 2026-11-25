// The original ConeyStreet builds its ribbons in metres around the rider. The physical
// course runs north along the boardwalk, so local -Z and the course direction coincide.
import type { Texture } from 'three';
import type { Course, CoursePlace } from './course';
import { ConeyStreet } from './world-coney';

export class ConeyBoardwalk {
  readonly street: ConeyStreet;
  private readonly sample: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly points = Array.from({ length: 161 }, (_, i) => ({
    metres: (i - 10) * 2,
    height: 0,
  }));
  private readonly height = (ahead: number): number => {
    const offset = Math.min(this.points.length - 1, Math.max(0, ahead / 2 + 10));
    const i = Math.min(this.points.length - 2, Math.floor(offset));
    const a = this.points[i]!.height;
    return a + (this.points[i + 1]!.height - a) * (offset - i);
  };

  constructor(
    private readonly course: Course,
    disposables: { dispose(): void }[],
  ) {
    this.street = new ConeyStreet(<T extends Texture>(texture: T) => {
      disposables.push(texture);
      return texture;
    }, disposables);
    this.street.build(course.file.roadHalfWidth, this.points.length);
    this.place(0, 0);
  }

  get group() {
    return this.street.group;
  }

  place(distance: number, seconds: number): void {
    this.street.setTime(seconds);
    for (const p of this.points)
      p.height = this.course.place(distance + p.metres, 0, this.sample).y;
    this.street.lay(this.points, distance);
    this.street.place(distance, this.height);
    this.street.alignPark(distance);
    this.group.position.z = -distance;
  }
}
