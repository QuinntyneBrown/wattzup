import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  Vector2,
  type BufferAttribute,
  type Material,
} from 'three/webgpu';

/**
 * The CN Tower, 553 m: a hexagonal core braced by three legs in a Y that taper into it below
 * the main pod; the pod turned on a lathe, its two dark window bands under the white ring of
 * the outdoor deck; the SkyPod at 447 m; and the antenna in tapering segments to the top.
 */
export function cnTower(concrete: Material, grey: Material, glass: Material): Group {
  const tower = new Group();
  const core = new CylinderGeometry(4.6, 8.5, 452, 6);
  core.translate(0, 226, 0);
  tower.add(new Mesh(core, concrete));
  for (let k = 0; k < 3; k++) {
    const leg = new BoxGeometry(1, 1, 1, 1, 30, 1);
    leg.translate(0.5, 0.5, 0);
    const position = leg.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = position.getY(i);
      const height = v * 338;
      const reach = 6 + 24 * Math.pow(1 - v, 1.6);
      const width = 6.2 - 2.4 * v;
      position.setXYZ(i, u * reach, height, position.getZ(i) * width);
    }
    leg.computeVertexNormals();
    leg.rotateY((k * Math.PI * 2) / 3 + Math.PI / 2);
    tower.add(new Mesh(leg, concrete));
  }
  const lathe = (profile: [number, number][], segments = 40) =>
    new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      segments,
    );
  // The main pod's shell, lower cone to upper cap.
  tower.add(
    new Mesh(
      lathe([
        [6, 318],
        [14, 328],
        [21, 336],
        [23.5, 340],
        [23.5, 352],
        [20, 357],
        [14, 361],
        [8, 364],
        [5, 366],
      ]),
      concrete,
    ),
  );
  // Two bands of glazing, the restaurant and the indoor lookout.
  for (const [y, h, r] of [
    [341, 4.2, 24.2],
    [348.5, 3.4, 23.9],
  ] as const) {
    const band = new CylinderGeometry(r, r - 0.6, h, 40, 1, true);
    band.translate(0, y + h / 2, 0);
    tower.add(new Mesh(band, glass));
  }
  // The outdoor deck: a white ring standing proud of the pod between the bands.
  const deck = new CylinderGeometry(26.5, 26, 2.2, 40);
  deck.translate(0, 346.2, 0);
  tower.add(new Mesh(deck, grey));
  // The SkyPod and its band of windows.
  tower.add(
    new Mesh(
      lathe([
        [4.5, 440],
        [8, 444],
        [8.4, 449],
        [6.5, 453],
        [3.8, 456],
      ]),
      concrete,
    ),
  );
  const sky = new CylinderGeometry(8.6, 8.6, 2.2, 32, 1, true);
  sky.translate(0, 446.5, 0);
  tower.add(new Mesh(sky, glass));
  // The antenna, in tapering segments with a collar at each joint.
  let y = 452;
  for (let k = 0; k < 6; k++) {
    const h = 17 - k;
    const bottom = 3.2 - k * 0.45;
    const segment = new CylinderGeometry(bottom - 0.42, bottom, h, 10);
    segment.translate(0, y + h / 2, 0);
    tower.add(new Mesh(segment, k % 2 ? grey : concrete));
    const collar = new CylinderGeometry(bottom + 0.3, bottom + 0.3, 0.8, 10);
    collar.translate(0, y + 0.4, 0);
    tower.add(new Mesh(collar, grey));
    y += h;
  }
  return tower;
}
