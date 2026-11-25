import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import { parkCarriage } from './park-carriage';
import type { RiderBatch } from './rider-batch';
import { Figures } from './world-kit';

const RUNNERS = 48;
const COLOURS = {
  tops: ['#ba4436', '#faad48', '#258282', '#5874a2', '#eae6da'],
  bottoms: ['#39373e', '#4c5265'],
  skins: ['#804931', '#bd8668', '#dcb197'],
};
const HORSES = [110, 330, 1240, 5200, 6130];
const CLUBS = [180, 1040, 2059, 2490, 4080, 5720];

export class ParkTraffic {
  readonly root = new Group();
  private readonly owned: { dispose(): void }[] = [];
  private readonly horses = HORSES.map((_, i) => {
    const coat = new MeshStandardMaterial({
      color: [0x694427, 0xe7e4d9, 0x302925][i % 3],
      roughness: 0.85,
    });
    const paint = new MeshStandardMaterial({ color: i % 2 ? 0xf0e8d9 : 0xa32137, roughness: 0.54 });
    this.owned.push(coat, paint);
    const cab = parkCarriage(coat, paint, this.owned);
    this.root.add(cab.group);
    return cab;
  });
  private readonly joggers = new Figures(this.root, this.owned, RUNNERS, COLOURS, 29, false);
  private readonly riders: RiderModel[] = [];
  private readonly at;
  clubDistance = 0;
  horseStride = 0;
  constructor(
    private readonly course: Course,
    kit: CourseCyclistKit,
    batch: RiderBatch,
  ) {
    this.at = course.place(0);
    // Blue docking-bike rear mudguard and the open front luggage rack.
    const rackBars = [
      new BoxGeometry(0.24, 0.27, 0.42).translate(0, 0.57, 0.44),
      new BoxGeometry(0.43, 0.04, 0.34).translate(0, 0.79, -0.64),
      new BoxGeometry(0.43, 0.035, 0.035).translate(0, 1.01, -0.79),
    ];
    for (const x of [-0.19, 0, 0.19])
      rackBars.push(new BoxGeometry(0.025, 0.22, 0.025).translate(x, 0.9, -0.79));
    const rack = mergeGeometries(rackBars)!;
    for (const part of rackBars) part.dispose();
    const bikeBlue = new MeshStandardMaterial({ color: 0x167cc0, roughness: 0.61 });
    this.owned.push(rack, bikeBlue);
    for (let i = 0; i < 7; i++) {
      const cyclist = kit.make(new Color(i < 4 ? 0x238d82 : 0x2589c5), 17 + i, true, 0.35);
      this.riders.push(cyclist);
      this.root.add(cyclist.group);
      batch.add(cyclist);
      if (i >= 4) cyclist.group.add(new Mesh(rack, bikeBlue));
    }
  }
  update(seconds: number, ridden: number) {
    const length = this.course.length;
    const gap = (d: number) => Math.min(Math.abs(d - ridden), length - Math.abs(d - ridden));
    let nearest = Infinity;
    for (const [i, cab] of this.horses.entries()) {
      const d = (HORSES[i]! + seconds * (2.2 + 0.11 * i)) % length;
      cab.group.visible = gap(d) < 300;
      if (!cab.group.visible) continue;
      const at = this.course.place(d, 4.4, this.at);
      cab.group.position.set(at.x, at.y + 0.02, at.z);
      cab.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      cab.legs.forEach(
        (leg, j) =>
          (leg.rotation.x =
            0.43 * Math.sin(seconds * 8.7 + (j === 0 || j === 3 ? 0 : Math.PI) + i)),
      );
      for (const wheel of cab.wheels) wheel.rotation.x = (-seconds * (2.2 + 0.11 * i)) / 0.6;
      if (gap(d) < nearest) {
        nearest = gap(d);
        this.horseStride = cab.legs[0]!.rotation.x;
      }
    }
    for (let i = 0; i < RUNNERS; i++) {
      const direction = i % 6 === 0 ? -1 : 1;
      const start = i < 20 ? 1920 + i * 18 : 87 + (i - 20) * 212;
      const d =
        (((start + direction * (2.3 + (i % 7) * 0.13) * seconds) % length) + length) % length;
      const at = this.course.place(d, -4.05 - (i % 3) * 0.56, this.at);
      this.joggers.set(
        i,
        at.x,
        at.y + 0.014,
        at.z,
        at.heading + (direction < 0 ? Math.PI : 0),
        0.94 + (i % 4) * 0.04,
        0.045 * Math.abs(Math.sin(seconds * 8 + i)),
      );
    }
    this.joggers.commit();
    let lead = 0;
    nearest = Infinity;
    for (const start of CLUBS) {
      const d = (start + seconds * 5.4) % length;
      if (gap(d) < nearest) {
        lead = d;
        nearest = gap(d);
      }
    }
    this.clubDistance = lead;
    this.riders.forEach((cyclist, i) => {
      cyclist.group.visible = nearest < 350;
      if (!cyclist.group.visible) return;
      const blue = i >= 4;
      const d = (lead - (blue ? 22 : 0) - Math.floor(i / 2) * 3.2 + length) % length;
      const at = this.course.place(d, blue ? 2.25 : 0.6 + (i % 2) * 0.94, this.at);
      cyclist.group.position.set(at.x, at.y + 0.02, at.z);
      cyclist.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      cyclist.pose(seconds * (blue ? 6.4 : 8.3) + i * 0.79, 0);
    });
  }
  dispose() {
    this.root.clear();
    for (const rider of this.riders) for (const item of rider.owned) item.dispose();
    for (const item of this.owned) item.dispose();
  }
}
