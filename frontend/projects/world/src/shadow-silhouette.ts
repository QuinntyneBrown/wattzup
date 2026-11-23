// The pictures a rider's shadow in the sun is drawn with (L2-166 AC35): the bike and rider as the sun sees them,
// from the side and end on. A shadow is sharp where the thing that throws it meets the road and spreads the
// further it falls: the picture is crisp by the wheels, soft by the head, and thins towards its far end. White with
// its opacity, to be tinted by the shadow's material. Along a picture, its top is where the wheels meet the road and its
// foot is the rider's head; across it lies what rider-shadow-shape.ts says the shadow's width is.
import { CanvasTexture } from 'three/webgpu';

const WIDE = 128;
const LONG = 256;
/** The height the pictures stand for, in metres: a rider's helmet, with a little room. */
const TALL = 1.65;

interface Ink {
  /** A stroke through points (metres across, metres up), `width` metres thick. */
  line(points: readonly (readonly [number, number])[], width: number): void;
  ring(at: number, height: number, radius: number, width: number): void;
  blob(at: number, height: number, rx: number, ry: number): void;
}

/** A picture `across` metres wide, painted in metres from the middle and from the road. */
function figure(across: number, paint: (ink: Ink) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDE;
  canvas.height = LONG;
  const out = canvas.getContext('2d');
  // The figure is painted twice, crisp and spread, and the two are joined along the shadow: crisp at the wheels,
  // spread at the head.
  const layer = (blur: number, from: number, to: number): HTMLCanvasElement | null => {
    const sheet = document.createElement('canvas');
    sheet.width = WIDE;
    sheet.height = LONG;
    const ctx = sheet.getContext('2d');
    if (!ctx) return null;
    const x = (metres: number) => WIDE / 2 + (metres / across) * WIDE;
    const y = (height: number) => (height / TALL) * LONG;
    ctx.filter = `blur(${blur}px)`;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paint({
      line: (points, width) => {
        ctx.lineWidth = (width / across) * WIDE;
        ctx.beginPath();
        points.forEach(([at, height], i) =>
          i ? ctx.lineTo(x(at), y(height)) : ctx.moveTo(x(at), y(height)),
        );
        ctx.stroke();
      },
      ring: (at, height, radius, width) => {
        ctx.lineWidth = (width / across) * WIDE;
        ctx.beginPath();
        ctx.ellipse(x(at), y(height), (radius / across) * WIDE, (radius / TALL) * LONG, 0, 0, 7);
        ctx.stroke();
      },
      blob: (at, height, rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(x(at), y(height), (rx / across) * WIDE, (ry / TALL) * LONG, 0, 0, 7);
        ctx.fill();
      },
    });
    // This layer's share of the shadow, along it: `from` at the wheels to `to` at the head.
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'destination-in';
    const share = ctx.createLinearGradient(0, 0, 0, LONG);
    share.addColorStop(0, `rgba(0, 0, 0, ${from})`);
    share.addColorStop(0.3, `rgba(0, 0, 0, ${from * 0.7 + to * 0.3})`);
    share.addColorStop(1, `rgba(0, 0, 0, ${to})`);
    ctx.fillStyle = share;
    ctx.fillRect(0, 0, WIDE, LONG);
    return sheet;
  };
  if (out) {
    // Crisp and full by the wheels, gone by the head; spread and thinner the further it falls.
    const crisp = layer(1.2, 1, 0);
    const spread = layer(6, 0.15, 0.55);
    out.globalCompositeOperation = 'lighter';
    if (spread) out.drawImage(spread, 0, 0);
    if (crisp) out.drawImage(crisp, 0, 0);
  }
  return new CanvasTexture(canvas);
}

/** The bike from its side, 1.75 m across the picture: two wheels, the frame, and the rider bent over the bars. */
export function sideShadow(): CanvasTexture {
  return figure(1.75, ({ line, ring, blob }) => {
    for (const axle of [0.5, -0.5]) {
      ring(axle, 0.34, 0.32, 0.075);
      blob(axle, 0.34, 0.04, 0.04);
      // Where the tyre meets the road the shadow is at its darkest: the shadow starts under the bike.
      blob(axle, 0.03, 0.13, 0.035);
    }
    line(
      [
        [-0.5, 0.02],
        [0.5, 0.02],
      ],
      0.035,
    );
    // The frame: the rear triangle, the top and down tubes, the fork, the stem and bars, the saddle.
    line(
      [
        [0.5, 0.34],
        [0.09, 0.28],
        [0.225, 0.86],
        [0.5, 0.34],
      ],
      0.035,
    );
    line(
      [
        [0.225, 0.8],
        [-0.33, 0.84],
        [0.09, 0.28],
      ],
      0.04,
    );
    line(
      [
        [-0.33, 0.9],
        [-0.37, 0.7],
        [-0.5, 0.34],
      ],
      0.035,
    );
    line(
      [
        [-0.33, 0.9],
        [-0.54, 0.95],
      ],
      0.04,
    );
    blob(0.24, 0.93, 0.13, 0.025);
    // The rider: the leg down to the pedal, the back, the arm to the bars, the head.
    line(
      [
        [0.21, 0.96],
        [-0.12, 0.66],
        [0.06, 0.2],
      ],
      0.14,
    );
    line(
      [
        [0.21, 0.98],
        [-0.2, 1.3],
      ],
      0.27,
    );
    line(
      [
        [-0.2, 1.28],
        [-0.33, 1.05],
        [-0.53, 0.97],
      ],
      0.08,
    );
    blob(-0.345, 1.46, 0.12, 0.115);
  });
}

/** The rider end on, 0.62 m across the picture: the edge of a wheel, the legs, the hips, the shoulders, the head. */
export function endShadow(): CanvasTexture {
  return figure(0.62, ({ line, blob }) => {
    // Where the tyres meet the road.
    blob(0, 0.03, 0.07, 0.04);
    line(
      [
        [0, 0.02],
        [0, 0.7],
      ],
      0.035,
    );
    for (const side of [-1, 1]) {
      line(
        [
          [side * 0.11, 0.2],
          [side * 0.1, 0.9],
        ],
        0.1,
      );
      line(
        [
          [side * 0.19, 1.26],
          [side * 0.2, 0.97],
        ],
        0.075,
      );
    }
    line(
      [
        [-0.21, 0.95],
        [0.21, 0.95],
      ],
      0.035,
    );
    blob(0, 0.95, 0.17, 0.11);
    line(
      [
        [0, 0.98],
        [0, 1.26],
      ],
      0.3,
    );
    blob(0, 1.3, 0.21, 0.075);
    blob(0, 1.47, 0.085, 0.105);
  });
}
