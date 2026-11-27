import {
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
  Group,
  type Texture,
  type InstancedMesh,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { BroadwayBus } from './broadway-bus';
import { KnicksStreet } from './world-knicks';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const courtyard = (station: number) =>
  Math.abs(station - 125) < 52 || Math.abs(station - 2720) < 75 || Math.abs(station - 5340) < 85;

const BROADWAY_VIEWS = [
  { station: 80, window: 95, target: 125, lateral: -8.1, rise: 0.2 },
  { station: 2650, window: 95, target: 2720, lateral: -22, rise: 4.8 },
  { station: 3880, window: 70, target: 3923, lateral: -4.4, rise: 1.4 },
  { station: 5270, window: 95, target: 5340, lateral: 22, rise: 4.8 },
  { station: 6690, window: 155, target: 7150, lateral: 0, rise: 3.8 },
];

export class BroadwayRace {
  readonly root = new Group();
  readonly bus = new BroadwayBus();
  private readonly fans = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.47,
    color: 0xe6d9cc,
  });
  private readonly churches = new MeshBasicMaterial({ side: DoubleSide, color: 0xe7dacc });
  private readonly bronze = new MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.38,
    roughness: 0.35,
    emissive: 0x282018,
  });
  readonly materials = {
    BroadwayFans: this.fans,
    BroadwayChurches: this.churches,
    ChargingBull: this.bronze,
  };
  private readonly drawn = {
    paradeFloatStation: null as number | null,
    tickerHeight: null as number | null,
    paradeBusStation: null as number | null,
    paradeTime: 0,
  };
  static async load(course: Course) {
    const race = new BroadwayRace(course);
    try {
      for (const [material, key] of [
        [race.fans, 'fans'],
        [race.churches, 'churches'],
      ] as const) {
        const map = await new TextureLoader().loadAsync('courses/knicks-' + key + '.webp');
        map.flipY = false;
        map.colorSpace = SRGBColorSpace;
        material.map = map;
        race.owned.add(map);
      }
      return race;
    } catch (error) {
      race.dispose();
      throw error;
    }
  }
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
  private constructor(private readonly course: Course) {
    this.street.build(course.file.roadHalfWidth, this.points.length);
    this.root.add(this.street.group, this.bus.root);
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
    this.street.place(metres, this.heightAt, 7150 - metres, courtyard);
    // The bus rolls continuously within its Broadway block, then comes to rest outside the view.
    const station = 3923 + 9 * Math.sin(time * 0.066);
    this.bus.root.visible = Math.abs(station - metres) < 180;
    if (this.bus.root.visible)
      this.bus.root.position.set(-4.4, this.heightAt(station - metres), metres - station);
    this.drawn.paradeBusStation = this.bus.root.visible ? metres - this.bus.root.position.z : null;
    this.drawn.paradeTime = time;
  }
  report() {
    this.street.paradePose(this.metres, this.drawn);
    return this.drawn;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const landmark = BROADWAY_VIEWS.find(
      ({ station, window }) => Math.abs(metres - station) < window,
    );
    if (!landmark) return;
    const share = Math.min(1, (1 - Math.abs(metres - landmark.station) / landmark.window) * 1.5);
    const at = this.course.place(metres, 0, this.origin);
    const goal = this.course.place(landmark.target, landmark.lateral, this.sample);
    const dx = goal.x - at.x,
      dz = goal.z - at.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (at.x - (dx / len) * 5.5 - camera.x) * share;
    camera.z += (at.z - (dz / len) * 5.5 - camera.z) * share;
    ahead.x += (at.x + (dx / len) * 14 - ahead.x) * share;
    ahead.z += (at.z + (dz / len) * 14 - ahead.z) * share;
    ahead.y += landmark.rise * share;
  }
  dispose() {
    for (const item of this.owned) item.dispose();
    this.owned.clear();
    this.bus.dispose();
    this.fans.dispose();
    this.churches.dispose();
    this.bronze.dispose();
  }
}
