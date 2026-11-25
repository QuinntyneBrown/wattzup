import { color, cos, mix, positionWorld, sin, uniform, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';
import { canvasTexture } from './world-kit';

function carriage(): Mesh {
  const parts: BoxGeometry[] = [];
  function panel(x: number, y: number, z: number, w: number, h: number, d: number, tint: number) {
    const part = new BoxGeometry(w, h, d);
    part.translate(x, y, z);
    const shade = new Color(tint);
    const colours = part.attributes['normal']!.clone();
    for (let i = 0; i < colours.count; i++) {
      const light = 0.86 + 0.14 * Math.max(0, colours.getY(i));
      colours.setXYZ(i, shade.r * light, shade.g * light, shade.b * light);
    }
    part.setAttribute('color', colours);
    parts.push(part);
  }
  panel(0, 0.38, 0, 7.9, 0.45, 1.86, 0x393b3b);
  panel(0, 1.14, 0, 8.45, 1.05, 2.1, 0x833f39);
  panel(0, 1.7, 0, 8.49, 0.16, 2.14, 0xcbaa75);
  panel(0, 2.23, 0, 8.4, 1.0, 2.05, 0xe1d2ab);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      panel(-3.57 + i * 1.02, 2.23, side * 1.04, 0.78, 0.69, 0.046, 0x536c72);
      panel(-3.57 + i * 1.02, 2.38, side * 1.069, 0.78, 0.035, 0.022, 0xc6b996);
    }
    for (const z of [-0.47, 0.47]) panel(side * 4.22, 2.17, z, 0.06, 0.71, 0.72, 0x566b73);
    panel(side * 4.255, 1.38, 0, 0.08, 0.19, 0.2, 0xf2d992);
    for (const x of [-2.7, 2.7]) panel(x, 0.39, side * 0.83, 0.66, 0.57, 0.14, 0x363734);
  }
  panel(0, 2.83, 0, 8.72, 0.22, 2.22, 0x5e6059);
  panel(0, 2.98, 0, 5.95, 0.14, 1.18, 0x6c6c62);
  const pole = new BoxGeometry(3.7, 0.065, 0.065);
  pole.applyMatrix4(new Matrix4().makeRotationZ(0.62));
  pole.translate(-1.5, 4.15, 0);
  const colours = pole.attributes['normal']!.clone();
  for (let i = 0; i < colours.count; i++) colours.setXYZ(i, 0.11, 0.12, 0.11);
  pole.setAttribute('color', colours);
  parts.push(pole);
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true }));
}

function board(width: number, height: number, title: string, sponsor: boolean) {
  const map = canvasTexture(1024, 128, (g) => {
    g.fillStyle = sponsor ? '#202320' : '#36433b';
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = sponsor ? '#9ac644' : '#e9ddc0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold ' + (sponsor ? 86 : 77) + 'px sans-serif';
    g.fillText(title, 512, 67, 982);
  });
  return new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({ map, side: DoubleSide }),
  );
}

/** A camera-centred distant sky, fixed track alignment and two nearby moving actors. */
export class ManxMountain {
  readonly root = new Group();
  private readonly tram = carriage();
  private readonly crossing = new Group();
  private readonly flag = new Mesh(
    new PlaneGeometry(1.1, 0.69, 3, 1),
    new MeshBasicMaterial({ color: 0xe4b749, side: DoubleSide }),
  );
  private readonly marshal = new Group();
  private readonly sky: Mesh<CylinderGeometry, MeshBasicMaterial>;
  private readonly light = uniform(1);
  readonly moor = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly signs = [
    board(13.6, 1.17, 'MONSTER ENERGY', true),
    board(9.5, 0.78, 'CREG-NY-BAA', false),
  ];
  static async load(course: Course) {
    const panorama = await new TextureLoader().loadAsync('courses/isleofman-sea.webp');
    return new ManxMountain(course, panorama);
  }
  private constructor(
    private readonly course: Course,
    private readonly panorama: Texture,
  ) {
    panorama.colorSpace = SRGBColorSpace;
    panorama.wrapS = MirroredRepeatWrapping;
    panorama.repeat.x = 4;
    const geometry = new CylinderGeometry(6500, 6500, 10100, 48, 1, true);
    this.sky = new Mesh(
      geometry,
      new MeshBasicMaterial({ map: panorama, side: DoubleSide, fog: false, depthWrite: false }),
    );
    this.sky.renderOrder = -0.5;
    this.root.add(this.sky);
    const grain = sin(positionWorld.x.mul(1.72).add(cos(positionWorld.z.mul(1.1)))).mul(
      cos(positionWorld.z.mul(1.94)),
    );
    const heather = sin(positionWorld.x.mul(0.065).add(cos(positionWorld.z.mul(0.076)))).mul(
      cos(positionWorld.z.mul(0.12)),
    );
    this.moor.colorNode = mix(vertexColor().rgb, color(0x6c574c), heather.max(0).mul(0.24))
      .mul(grain.mul(0.08).add(1))
      .mul(this.light);
    this.align(this.crossing, 3592);
    this.tram.rotation.y = Math.atan2(1, 0.47);
    this.crossing.add(this.tram);
    this.align(this.marshal, 6121);
    this.flag.geometry.translate(0.55, 0, 0);
    this.flag.position.set(0.3, 1.64, -5.49);
    this.marshal.add(this.flag);
    this.root.add(this.crossing, this.marshal);
    const bridge = new Group(),
      hotel = new Group();
    this.align(bridge, 3920);
    this.align(hotel, 6138);
    const fascia = this.signs[0]!,
      pub = this.signs[1]!;
    fascia.position.set(-1.305, 6.31, 0);
    fascia.rotation.y = -Math.PI / 2;
    pub.position.set(0, 2.62, 11.97);
    pub.rotation.y = Math.PI;
    bridge.add(fascia);
    hotel.add(pub);
    this.root.add(bridge, hotel);
  }
  private align(group: Group, distance: number) {
    const p = this.course.place(distance),
      q = this.course.place(distance + 1);
    group.position.set(p.x, p.y, p.z);
    group.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x);
  }
  /** Turn the chase camera round the cyclist as the A18 exposes the landmark on each bend. */
  frameView(
    metres: number,
    camera: { x: number; y: number; z: number },
    ahead: { x: number; y: number; z: number },
  ) {
    let centre: number, range: number, targetDistance: number, lane: number;
    if (metres > 1430 && metres < 2190) {
      centre = 1810;
      range = 380;
      targetDistance = 3180;
      lane = -820;
    } else if (metres > 3370 && metres < 3710) {
      centre = 3540;
      range = 170;
      targetDistance = 3596;
      lane = -9;
    } else if (metres > 5910 && metres < 6290) {
      centre = 6100;
      range = 190;
      targetDistance = 6138;
      lane = 16;
    } else if (metres > 7010 && metres < 7810) {
      centre = 7410;
      range = 400;
      targetDistance = 8030;
      lane = 275;
    } else return;
    const blend = Math.cos(((metres - centre) * Math.PI) / (2 * range)) ** 2;
    const rider = this.course.place(metres, 0, this.riderPlace);
    const target = this.course.place(targetDistance, lane, this.targetPlace);
    const length = Math.hypot(target.x - rider.x, target.z - rider.z);
    const ux = (target.x - rider.x) / length,
      uz = (target.z - rider.z) / length;
    camera.x += (rider.x - 4.1 * ux - camera.x) * blend;
    camera.z += (rider.z - 4.1 * uz - camera.z) * blend;
    camera.y += blend * (centre === 7410 ? 1.35 : 0.38);
    ahead.x += (rider.x + 14 * ux - ahead.x) * blend;
    ahead.z += (rider.z + 14 * uz - ahead.z) * blend;
    const pitch = centre === 1810 ? 4.9 : centre === 7410 ? -1.1 : 0.31;
    ahead.y += (rider.y + pitch - ahead.y) * blend;
  }
  private readonly riderPlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly targetPlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  update(metres: number, seconds: number, x: number, y: number, z: number) {
    this.sky.position.set(x, y - 250, z);
    this.crossing.visible = Math.abs(metres - 3592) < 270;
    this.marshal.visible = Math.abs(metres - 6121) < 200;
    // The tram holds clear of the carriageway while the cyclist crosses the rails.
    const clearance = Math.max(0, 1 - Math.abs(metres - 3592) / 90);
    const v = 6.8 + 4.2 * Math.sin(seconds * 0.084) + 9 * clearance;
    this.tram.position.set(v * 0.47, 0.085, -v);
    this.flag.rotation.y = 0.55 + 0.29 * Math.sin(seconds * 2.5);
    this.flag.rotation.z = 0.14 + 0.13 * Math.cos(seconds * 1.72);
    this.light.value = 0.94 + 0.075 * Math.sin(seconds * 0.11);
    this.sky.material.color.setRGB(this.light.value, this.light.value, this.light.value);
  }
  report() {
    return {
      tramPosition: this.crossing.visible ? this.tram.position.z : null,
      flagAngle: this.marshal.visible ? this.flag.rotation.y : null,
      sunbreak: this.light.value,
    };
  }
  dispose() {
    this.root.removeFromParent();
    this.tram.geometry.dispose();
    (this.tram.material as MeshBasicMaterial).dispose();
    for (const mesh of this.signs) {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    this.flag.geometry.dispose();
    this.flag.material.dispose();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.panorama.dispose();
    this.moor.dispose();
  }
}
