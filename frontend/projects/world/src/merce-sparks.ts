import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
} from 'three/webgpu';

/** Short spark trails in one draw. Every endpoint follows the race clock. */
export class MerceSparks {
  private readonly count = 224;
  private readonly geometry = new BufferGeometry();
  private readonly positions = new Float32BufferAttribute(new Float32Array(this.count * 6), 3);
  private readonly paint = new LineBasicMaterial({
    vertexColors: true,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  readonly mesh = new LineSegments(this.geometry, this.paint);
  constructor(private readonly aerial: boolean) {
    const colours = [];
    for (let n = 0; n < this.count; n++) {
      const tint = aerial
        ? [
            [1, 0.22, 0.12],
            [0.15, 0.67, 1],
            [1, 0.73, 0.18],
            [0.87, 0.26, 0.81],
          ][n % 4]!
        : [1, 0.56 + (n % 5) * 0.08, 0.16 + (n % 3) * 0.18];
      colours.push(...tint, tint[0]! * 0.52, tint[1]! * 0.44, tint[2]! * 0.3);
    }
    this.geometry.setAttribute('color', new Float32BufferAttribute(colours, 3));
    this.geometry.setAttribute('position', this.positions);
    this.mesh.frustumCulled = false;
  }
  at(time: number) {
    let visibleRadius = 0;
    for (let i = 0; i < this.count; i++) {
      const az = i * 2.3999632,
        el = (i * 0.618034) % 1;
      if (this.aerial) {
        const group = i % 3,
          age = (time * 0.34 + group * 0.329) % 1,
          angle = az + Math.floor(time * 0.34 + group * 0.329) * 0.5;
        const radius = 31 * Math.sin(age * 1.46);
        const y = 2 * el - 1,
          h = Math.sqrt(1 - y * y),
          cx = (group - 1) * 31,
          cy = 12 + group * 13;
        this.positions.setXYZ(
          i * 2,
          cx + radius * h * Math.cos(angle),
          cy + radius * y - age * age * 8,
          radius * h * Math.sin(angle),
        );
        const inner = Math.max(0, radius - (1 + age * 3));
        this.positions.setXYZ(
          i * 2 + 1,
          cx + inner * h * Math.cos(angle),
          cy + inner * y - age * age * 8,
          inner * h * Math.sin(angle),
        );
        if (i === 0) visibleRadius = radius;
      } else {
        const age = (time * (1.03 + 0.17 * el) + el) % 1,
          reach = 3.7 + el * 3.5,
          dx = Math.cos(az) * reach,
          dz = Math.sin(az) * reach;
        const speed = 6.6 + 3.8 * el,
          g = 6.8;
        const tail = Math.max(0, age - 0.055);
        this.positions.setXYZ(i * 2, age * dx, age * (speed - g * age), age * dz);
        this.positions.setXYZ(i * 2 + 1, tail * dx, tail * (speed - g * tail), tail * dz);
        if (i === 0) visibleRadius = age;
      }
    }
    this.positions.needsUpdate = true;
    return visibleRadius;
  }
  dispose() {
    this.geometry.dispose();
    this.paint.dispose();
  }
}
