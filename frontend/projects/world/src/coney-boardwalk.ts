// The original ConeyStreet builds its ribbons in metres around the rider. The physical
// course runs north along the boardwalk, so local -Z and the course direction coincide.
import type { Texture } from 'three';
import type { Course, CoursePlace } from './course';
import { ConeyStreet } from './world-coney';

export class ConeyBoardwalk {
  private readonly street: ConeyStreet;
  private readonly sample: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly points = Array.from({ length: 161 }, (_, i) => ({
    metres: (i - 10) * 2,
    height: 0,
  }));
  private distance = 0;
  private readonly height = (ahead: number): number =>
    this.course.place(this.distance + ahead, 0, this.sample).y;

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
    this.distance = distance;
    this.street.setTime(seconds);
    for (const p of this.points) p.height = this.height(p.metres);
    this.street.lay(this.points, distance);
    this.street.place(distance, this.height);
    this.group.position.z = -distance;
  }
}
