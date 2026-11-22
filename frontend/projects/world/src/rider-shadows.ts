// The riders' shadows under a course's street lamps, drawn (L2-166 AC16): lamp-shadows.ts says where each shadow
// lies and how dark it is; this lays a soft dark shape on the road for each, every rider's in one draw call.
import { float, smoothstep, uv, varyingProperty } from 'three/tsl';
import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Vector3,
} from 'three/webgpu';
import type { Course, CourseLamps, CoursePlace } from './course';
import { type LampShadow, lampShadows } from './lamp-shadows';

/** A shadow's width, the shortest one drawn, and how far it lies above the road, in metres. */
const WIDTH = 0.95;
const SHORTEST = 1.1;
const LIFT = 0.045;
/** The dark under the bike itself, whatever the lamps do: its length along the bike and how dark it is. */
const UNDER = { length: 2.1, width: 0.8, strength: 0.5 } as const;
/** Each rider's shadows: one a lamp, and the dark under the bike. */
const EACH = 5;

export class RiderShadows {
  readonly mesh: InstancedMesh;
  private readonly shade = new Color();
  private readonly geometry: PlaneGeometry;
  private readonly material: MeshBasicNodeMaterial;
  private count = 0;
  private readonly cast: LampShadow[] = [];
  private readonly from: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly to: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly matrix = new Matrix4();
  private readonly run = new Vector3();
  private readonly side = new Vector3();
  private readonly up = new Vector3();

  constructor(
    private readonly course: Course,
    private readonly lamps: CourseLamps,
    riders: number,
  ) {
    // A square lying on the road: its second axis runs along the shadow.
    this.geometry = new PlaneGeometry(1, 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    this.material.color.setHex(0x05040a);
    // Soft at its edge: dark in the middle, gone at the rim. How dark each shadow is rides in its instance's colour,
    // which Three.js keeps up to date as it does the instances' places.
    const rim = uv().sub(0.5).mul(2).length();
    this.material.opacityNode = float(1)
      .sub(smoothstep(0.5, 1, rim))
      .mul(varyingProperty('vec3', 'vInstanceColor').r);
    this.mesh = new InstancedMesh(this.geometry, this.material, riders * EACH);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.count = 0;
    for (let i = 0; i < riders * EACH; i++) this.mesh.setColorAt(i, this.shade.setScalar(0));
    this.mesh.instanceColor!.setUsage(DynamicDrawUsage);
  }

  /** Starts a frame: no rider has a shadow yet. */
  begin(): void {
    this.count = 0;
  }

  /** Throws the shadows of a rider `metres` from the start line, `lane` metres right of the centre line. */
  add(metres: number, lane: number): void {
    if (this.count + EACH > this.mesh.instanceMatrix.count) return;
    const half = UNDER.length / 2;
    this.lay(metres - half, lane, metres + half, lane, UNDER.width, UNDER.strength);
    for (const shadow of lampShadows(this.lamps, metres, lane, this.cast)) {
      // A shadow too short to see as one still darkens the road under the rider.
      const length = Math.hypot(shadow.along, shadow.across);
      const stretch = length < SHORTEST ? SHORTEST / Math.max(length, 1e-3) : 1;
      const along = length < 1e-3 ? SHORTEST : shadow.along * stretch;
      const across = shadow.across * stretch;
      // It starts a little behind the rider, so the bike stands in it.
      this.lay(
        metres - along * 0.18,
        lane - across * 0.18,
        metres + along,
        lane + across,
        WIDTH,
        shadow.strength,
      );
    }
  }

  /** Ends a frame: the shadows thrown are what is drawn. */
  end(): void {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.dispose();
  }

  /** One shape on the road from one place on it to another, following its slope. */
  private lay(
    m0: number,
    lane0: number,
    m1: number,
    lane1: number,
    width: number,
    strength: number,
  ): void {
    const a = this.course.place(m0, lane0, this.from);
    const b = this.course.place(m1, lane1, this.to);
    this.run.set(b.x - a.x, b.y - a.y, b.z - a.z);
    this.side.set(this.run.z, 0, -this.run.x).normalize();
    this.up.crossVectors(this.run, this.side).normalize();
    if (this.up.y < 0) this.up.negate();
    this.side.multiplyScalar(width);
    this.matrix.makeBasis(this.side, this.up, this.run);
    this.matrix.setPosition(
      (a.x + b.x) / 2 + this.up.x * LIFT,
      (a.y + b.y) / 2 + this.up.y * LIFT,
      (a.z + b.z) / 2 + this.up.z * LIFT,
    );
    this.mesh.setMatrixAt(this.count, this.matrix);
    this.mesh.setColorAt(this.count, this.shade.setScalar(strength));
    this.count++;
  }
}
