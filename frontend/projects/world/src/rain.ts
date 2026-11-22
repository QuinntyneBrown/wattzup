// Rain on a course (L2-166 AC24): some thousand streaks falling through a box of air that rides with the camera, one
// mesh and one draw call. Nothing is moved by the app: each streak has a place of its own in a unit cube, and the
// vertex shader lets it fall with the ride's clock, wraps it round the box as it leaves, and turns it to face the eye.
// A streak shows by the light it falls through: bright under a lamp, tinted by neon, all but unseen in the dark.
import {
  attribute,
  cameraPosition,
  float,
  fract,
  positionWorld,
  smoothstep,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  type Node,
} from 'three/webgpu';

/** The box of air the rain falls through, in metres: across, up and along. */
const BOX = [34, 16, 34] as const;
/** A streak's length and width in metres, how fast it falls (metres a second) and how far the wind carries it. */
const STREAK = { length: 0.55, width: 0.014, fall: 11, drift: 1.6 } as const;
/** The streaks of the heaviest rain. */
const MOST = 2600;
/** A streak's brightness in a street lamp's full light, and by the night's own. */
const LIT = 0.55;
const UNLIT = 0.035;

/** The rain's mesh and the clock that makes it fall. */
export interface Rain {
  readonly mesh: Mesh;
  at(seconds: number): void;
  dispose(): void;
}

/**
 * Rain `strength` hard, 0 to 1. `light`, where the course has street lamps, is their light (and the coloured
 * lights') at a place in the world (lamp-glow.ts): the rain shows by it.
 */
export function rain(strength: number, light: Node<'vec3'> | null): Rain {
  const count = Math.round(MOST * strength);
  // Four corners a streak, all with the streak's own place in the unit cube; the UV says which corner.
  const seeds = new Float32Array(count * 4 * 3);
  const corners = new Float32Array(count * 4 * 2);
  const ups = new Float32Array(count * 4 * 3);
  const index = new Uint16Array(count * 6);
  let seed = 12345;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const place = [random(), random(), random()];
    for (let c = 0; c < 4; c++) {
      seeds.set(place, (i * 4 + c) * 3);
      corners.set([c === 1 || c === 2 ? 1 : 0, c >= 2 ? 1 : 0], (i * 4 + c) * 2);
      ups.set([0, 1, 0], (i * 4 + c) * 3);
    }
    index.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(seeds, 3));
  geometry.setAttribute('normal', new BufferAttribute(ups, 3));
  geometry.setAttribute('uv', new BufferAttribute(corners, 2));
  geometry.setIndex(new BufferAttribute(index, 1));

  const time = uniform(0);
  const box = vec3(BOX[0], BOX[1], BOX[2]);
  const place = attribute('position', 'vec3');
  // The streak's place in the box round the camera: it falls and drifts with the clock, and wraps as it leaves.
  const fallen = vec3(
    place.x.add(time.mul(STREAK.drift / BOX[0])),
    place.y.sub(time.mul(STREAK.fall / BOX[1])),
    place.z,
  );
  const within = fract(fallen.sub(cameraPosition.div(box)))
    .sub(0.5)
    .mul(box);
  const head = cameraPosition.add(within);
  // The way it falls, and across that, square to the line to the eye.
  const down = vec3(STREAK.drift, -STREAK.fall, 0).normalize();
  const across = down.cross(cameraPosition.sub(head)).normalize();
  const corner = uv();
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
  });
  material.positionNode = head
    .add(down.mul(corner.y.mul(STREAK.length)))
    .add(across.mul(corner.x.sub(0.5).mul(STREAK.width)));
  // Brightest along its middle, fading at both ends; nothing right at the eye, where a streak would fill the view.
  const shape = smoothstep(0, 0.3, corner.y).mul(smoothstep(1, 0.6, corner.y));
  const far = cameraPosition.sub(positionWorld).length();
  const seen = smoothstep(1.2, 4, far).mul(
    float(1).sub(smoothstep(BOX[0] * 0.3, BOX[0] * 0.5, far)),
  );
  const lit = light ? light.mul(LIT).add(UNLIT) : vec3(0.5, 0.5, 0.5);
  material.colorNode = vec3(0.8, 0.86, 1).mul(lit).mul(shape).mul(seen);

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return {
    mesh,
    at: (seconds) => {
      time.value = seconds;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
