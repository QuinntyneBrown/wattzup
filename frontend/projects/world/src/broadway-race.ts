import { Group, type Texture, type InstancedMesh, type Vector3 } from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { KnicksStreet } from './world-knicks';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const courtyard = (station: number) =>
  Math.abs(station - 108) < 32 || Math.abs(station - 2684) < 40 || Math.abs(station - 5302) < 46;

export class BroadwayRace {
  readonly root = new Group();
  private readonly owned = new Set<{ dispose(): void }>();
  private readonly resources: { dispose(): void }[] = [];
  private readonly street = new KnicksStreet(<T extends Texture>(texture: T) => {
    this.owned.add(texture);
    return texture;
  }, this.resources);
  private readonly points = Array.from({ length: 75 }, (_, i) => ({
    metres: (i - 6) * 5,
    height: 0,
  }));
  private readonly origin = place();
  private readonly sample = place();
  private metres = 0;
  private readonly heightAt = (ahead: number) =>
    this.course.place(this.metres + ahead, 0, this.sample).y - this.origin.y;
  constructor(private readonly course: Course) {
    this.street.build(course.file.roadHalfWidth, this.points.length);
    this.root.add(this.street.group);
    this.street.group.traverse((object) => {
      const mesh = object as InstancedMesh;
      if (mesh.isInstancedMesh) this.owned.add(mesh);
    });
    for (const item of this.resources) this.owned.add(item);
  }
  update(metres: number, time: number) {
    this.metres = metres;
    const origin = this.course.place(metres, 0, this.origin);
    this.root.position.set(origin.x, origin.y, origin.z);
    this.root.rotation.y = origin.heading;
    for (const p of this.points) p.height = this.heightAt(p.metres);
    this.street.lay(this.points, metres);
    this.street.setTime(time);
    this.street.place(metres, this.heightAt, 7350 - metres, courtyard);
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const focus = metres < 550 ? 80 : metres < 3450 ? 2650 : 5270;
    const share = Math.min(1, Math.max(0, (1 - Math.abs(metres - focus) / 95) * 1.5));
    if (!share) return;
    const at = this.course.place(metres, 0, this.origin);
    const goal = this.course.place(
      focus === 80 ? 103 : focus === 2650 ? 2684 : 5302,
      focus === 80 ? 7.7 : focus === 2650 ? -22 : 22,
      this.sample,
    );
    const dx = goal.x - at.x,
      dz = goal.z - at.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (at.x - (dx / len) * 5.5 - camera.x) * share;
    camera.z += (at.z - (dz / len) * 5.5 - camera.z) * share;
    ahead.x += (at.x + (dx / len) * 14 - ahead.x) * share;
    ahead.z += (at.z + (dz / len) * 14 - ahead.z) * share;
    ahead.y += (focus === 80 ? 0.3 : 2.2) * share;
  }
  dispose() {
    for (const item of this.owned) item.dispose();
    this.owned.clear();
  }
}
