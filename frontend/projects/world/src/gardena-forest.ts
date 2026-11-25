import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';

type Tree = readonly [x: number, y: number, z: number, height: number, tile: number];

/** Two crossed portraits per tree share one material. Each spatial cell is a single draw. */
export async function gardenaForest() {
  const response = await fetch('courses/dolomites-trees.json');
  if (!response.ok) throw new Error('course-assets');
  const trees = (await response.json()) as Tree[];
  const map = await new TextureLoader().loadAsync('courses/dolomites-conifers.webp');
  map.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map,
    color: 0xdedfcf,
    alphaTest: 0.48,
    side: DoubleSide,
  });
  const cells = new Map<string, Tree[]>();
  const size = 120;
  for (const tree of trees) {
    const key = Math.floor(tree[0] / size) + ',' + Math.floor(tree[2] / size);
    const cell = cells.get(key);
    if (cell) cell.push(tree);
    else cells.set(key, [tree]);
  }
  const group = new Group();
  const batches: { mesh: Mesh<BufferGeometry, MeshBasicMaterial>; x: number; z: number }[] = [];
  for (const cell of cells.values()) {
    const pos: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (const [x, y, z, h, tile] of cell) {
      const angle = (x * 0.37 + z * 0.63) % Math.PI;
      for (const turn of [angle, angle + Math.PI / 2]) {
        const dx = Math.cos(turn) * h * 0.39,
          dz = Math.sin(turn) * h * 0.39;
        const i = pos.length / 3;
        pos.push(
          x - dx,
          y,
          z - dz,
          x + dx,
          y,
          z + dz,
          x + dx,
          y + h,
          z + dz,
          x - dx,
          y + h,
          z - dz,
        );
        const u = tile / 4;
        uv.push(u, 0, u + 0.25, 0, u + 0.25, 1, u, 1);
        indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    const mesh = new Mesh(geometry, material);
    const [x, , z] = cell[0]!;
    batches.push({
      mesh,
      x: (Math.floor(x / size) + 0.5) * size,
      z: (Math.floor(z / size) + 0.5) * size,
    });
  }
  let lastX = Infinity,
    lastZ = Infinity;
  return {
    group,
    follow(x: number, z: number) {
      if (Math.hypot(x - lastX, z - lastZ) < 24) return;
      lastX = x;
      lastZ = z;
      for (const b of batches) {
        const dx = b.x - x,
          dz = b.z - z;
        if (dx * dx + dz * dz < 540 * 540) {
          if (!b.mesh.parent) group.add(b.mesh);
        } else if (b.mesh.parent) b.mesh.removeFromParent();
      }
    },
    dispose() {
      group.removeFromParent();
      group.clear();
      for (const b of batches) b.mesh.geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}
