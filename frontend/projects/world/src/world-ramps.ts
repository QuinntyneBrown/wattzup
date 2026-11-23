// The road's climbs announced (L2-110 AC9): a gradient sign at the foot of the next ramp ahead,
// read from the road as it is laid, so it stands where the road kicks up and says how steeply.
import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three/webgpu';
import { nextRamp, type RoadPoint } from './scene-road';

export class RampSign {
  readonly group = new Group();
  private readonly canvas = document.createElement('canvas');
  private readonly texture: CanvasTexture;
  private readonly face: MeshStandardMaterial;
  private shown = 0;

  constructor(private readonly disposables: { dispose(): void }[]) {
    this.canvas.width = 192;
    this.canvas.height = 256;
    paintRampCanvas(this.canvas, 0);
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    const plate = new PlaneGeometry(1.35, 1.8);
    const pole = new BoxGeometry(0.08, 2.6, 0.08);
    this.face = new MeshStandardMaterial({
      map: this.texture,
      roughness: 0.55,
      alphaTest: 0.5,
    });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.6, roughness: 0.4 });
    this.disposables.push(plate, pole, this.face, steel);
    const sign = new Mesh(plate, this.face);
    sign.position.y = 3.2;
    sign.castShadow = true;
    const post = new Mesh(pole, steel);
    post.position.set(0, 1.3, -0.05);
    post.castShadow = true;
    this.group.add(sign, post);
    this.group.visible = false;
  }

  /** Stands the sign `x` across the road at the foot of the next ramp in `points`. */
  place(points: readonly RoadPoint[], x: number, kerb: number): void {
    const ramp = nextRamp(points);
    this.group.visible = ramp !== null && ramp.metres > 4;
    if (!ramp || !this.group.visible) return;
    let height = 0;
    for (const p of points) {
      if (p.metres >= ramp.metres) {
        height = p.height;
        break;
      }
    }
    this.group.position.set(x, height + kerb, -ramp.metres);
    if (this.shown === ramp.grade) return;
    this.shown = ramp.grade;
    paintRampCanvas(this.canvas, ramp.grade);
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
  }
}

/** Paints the warning triangle and gradient plate onto `canvas` in place. */
function paintRampCanvas(canvas: HTMLCanvasElement, grade: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 192, 256);
  // The triangle: red rim, white field, a black ramp rising to the right.
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#c8242c';
  ctx.beginPath();
  ctx.moveTo(96, 8);
  ctx.lineTo(186, 164);
  ctx.lineTo(6, 164);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f5ef';
  ctx.beginPath();
  ctx.moveTo(96, 40);
  ctx.lineTo(160, 150);
  ctx.lineTo(32, 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#16181c';
  ctx.beginPath();
  ctx.moveTo(48, 140);
  ctx.lineTo(144, 140);
  ctx.lineTo(144, 96);
  ctx.closePath();
  ctx.fill();
  // The plate under it with the gradient.
  ctx.fillStyle = '#f7f5ef';
  ctx.fillRect(22, 176, 148, 72);
  ctx.strokeStyle = '#16181c';
  ctx.lineWidth = 5;
  ctx.strokeRect(22, 176, 148, 72);
  ctx.fillStyle = '#16181c';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${grade}%`, 96, 214);
}
