// Authoring-only entry point. Reuse HavanaStreet's original procedural assets.
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three/webgpu';
import { WebGLRenderer } from 'three';
import { AmbientLight, Box3, DirectionalLight, OrthographicCamera, Scene } from 'three/webgpu';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  archTexture,
  facadeTexture,
  HavanaStreet,
  pierTexture,
  railingTexture,
  ruinTexture,
  seawallTexture,
  shopTexture,
  towerTexture,
} from '../../projects/world/src/world-havana';

// Render the artist-authored portales orthographically. Near-field balcony slabs
// and arcade piers in the course supply parallax at tablet resolution.
function bakeElevations(street: HavanaStreet) {
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = 2048;
  const ctx = atlas.getContext('2d')!;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(512, 512, false);
  renderer.setClearColor(0, 0);
  const scene = new Scene();
  const sun = new DirectionalLight(0xffead0, 1.8);
  sun.position.set(-10, 12, 6);
  scene.add(new AmbientLight(0xe8f1ff, 1.65), sun);
  const buildings = street.group.children
    .filter((item) => item.name.startsWith('Portales'))
    .slice(0, 16);
  const sizes = buildings.map((building, index) => {
    const model = building.clone(true);
    model.position.set(0, 0, 0);
    model.visible = true;
    scene.add(model);
    const bounds = new Box3().setFromObject(model, true);
    const width = bounds.max.z - bounds.min.z;
    const height = bounds.max.y - bounds.min.y;
    const centre = bounds.getCenter(new Vector3());
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 150);
    camera.position.set(-65, centre.y, centre.z);
    camera.lookAt(0, centre.y, centre.z);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, (index % 4) * 512, Math.floor(index / 4) * 512);
    scene.remove(model);
    return { width, height, bottom: bounds.min.y };
  });
  renderer.dispose();
  if (!sizes.length) throw new Error('No original Havana elevations');
  return { sizes, elevations: atlas.toDataURL('image/webp', 0.94) };
}

export async function bake() {
  const surfaces = [
    facadeTexture,
    archTexture,
    () => shopTexture(),
    seawallTexture,
    railingTexture,
    ruinTexture,
    towerTexture,
    pierTexture,
  ];
  const atlas = document.createElement('canvas');
  atlas.width = 2048;
  atlas.height = 1024;
  const ctx = atlas.getContext('2d')!;
  surfaces.forEach((make, index) => {
    const texture = make();
    ctx.drawImage(texture.image, (index % 4) * 512, Math.floor(index / 4) * 512, 512, 512);
    texture.dispose();
  });
  const disposables: { dispose(): void }[] = [];
  const street = new HavanaStreet((item) => {
    disposables.push(item);
    return item;
  }, disposables);
  street.build(4.5, 64);
  const collection = new Group(),
    colour = new Color(),
    vertex = new Vector3(),
    vertexTint = new Color(),
    normal = new Vector3(),
    normalMatrix = new Matrix3();
  const paint = new MeshBasicMaterial({ vertexColors: true });
  for (const name of [
    'Almendron0',
    'Almendron1',
    'QuinceaneraConvertible',
    'CocoTaxi0',
    'BiciTaxi0',
    'ElMorro',
    'HotelNacional',
    'SonTrio',
    'Parada',
    'DominoTable',
    'FruitCart',
    'Manisero',
    'PhotoParty',
    'ZebraCrossing',
  ]) {
    const template = street.group.getObjectByName(name);
    if (!template) throw new Error('Missing source model ' + name);
    const model = template.clone(true);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.updateMatrixWorld(true);
    const positions: number[] = [],
      colours: number[] = [];
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const geo = object.geometry,
        pos = geo.attributes.position,
        normals = geo.attributes.normal;
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      normalMatrix.getNormalMatrix(object.matrixWorld);
      const indices = geo.index;
      // A single Three material draws every face, even on geometries whose groups
      // name separate cap and side indices for an optional material array.
      for (const group of Array.isArray(object.material) && geo.groups.length
        ? geo.groups
        : [{ start: 0, count: indices?.count ?? pos.count, materialIndex: 0 }]) {
        const material = mats[group.materialIndex ?? 0];
        if (!material?.color) continue;
        for (let i = group.start; i < group.start + group.count; i++) {
          const j = indices ? indices.getX(i) : i;
          vertex.fromBufferAttribute(pos, j).applyMatrix4(object.matrixWorld);
          positions.push(vertex.x, vertex.y, vertex.z);
          normal.fromBufferAttribute(normals, j).applyNormalMatrix(normalMatrix);
          const light = 0.7 + 0.3 * Math.max(0, normal.y * 0.74 - normal.x * 0.5 + normal.z * 0.32);
          colour.copy(material.color).multiplyScalar(light);
          if (material.vertexColors && geo.attributes.color) {
            vertexTint.fromBufferAttribute(geo.attributes.color, j);
            colour.multiply(vertexTint);
          }
          colours.push(colour.r, colour.g, colour.b);
        }
      }
    });
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colours, 3));
    const merged = new Mesh(geo, paint);
    merged.name = name;
    collection.add(merged);
  }
  const bytes = (await new GLTFExporter().parseAsync(collection, { binary: true })) as ArrayBuffer;
  const model = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(new Blob([bytes]));
  });
  const elevations = bakeElevations(street);
  const image = atlas.toDataURL('image/webp', 0.89);
  for (const item of disposables) item.dispose();
  return { model, image, ...elevations };
}
