import { Color, Group } from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';

/** Two lines of club riders turn over the lead while matching the rider's pace along the bay. */
export class BeachRoadBunch {
  readonly group = new Group();
  private readonly riders: RiderModel[] = [];
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  clubLane = 0;

  constructor(
    private readonly course: Course,
    kit: CourseCyclistKit,
    batch: RiderBatch,
  ) {
    const jerseys = [0x42788f, 0xcc9c38, 0x68966f, 0x42788f, 0xb05f58, 0x68966f];
    for (const [i, tint] of jerseys.entries()) {
      const rider = kit.make(new Color(tint), 16 + i, true, 0.55);
      this.riders.push(rider);
      this.group.add(rider.group);
      batch.add(rider);
    }
    this.update(0, 0);
  }

  update(metres: number, seconds: number): void {
    for (const [i, rider] of this.riders.entries()) {
      const phase = seconds * 0.31 + (i * Math.PI) / 3;
      const ahead = 17 + 6.1 * Math.sin(phase);
      const lane = -1.32 + 0.71 * Math.cos(phase);
      if (i === 0) this.clubLane = lane;
      rider.group.visible = metres + ahead < this.course.end;
      if (!rider.group.visible) continue;
      this.course.place(metres + ahead, lane, this.at);
      rider.group.position.set(this.at.x, this.at.y + 0.018, this.at.z);
      rider.group.rotation.set(this.at.pitch, this.at.heading, -0.024 * Math.sin(phase), 'YXZ');
      rider.pose(seconds * (8.65 + 0.06 * i) + i * 0.73, 0);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const rider of this.riders) for (const resource of rider.owned) resource.dispose();
    this.riders.length = 0;
  }
}
