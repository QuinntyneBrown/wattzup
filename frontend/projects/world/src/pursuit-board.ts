import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three/webgpu';

/** One illuminated timing face serves both ends of the indoor pursuit oval. */
export class PursuitBoard {
  readonly group = new Group();
  private readonly face = document.createElement('canvas');
  private readonly ink = this.face.getContext('2d')!;
  private readonly texture = new CanvasTexture(this.face);
  private readonly geometry = new PlaneGeometry(13, 4.5);
  private readonly material = new MeshBasicMaterial({ map: this.texture, toneMapped: false });
  private lap = 0;
  private second = -1;

  constructor(private readonly venue = 'AGUASCALIENTES') {
    this.face.width = 512;
    this.face.height = 176;
    this.texture.colorSpace = SRGBColorSpace;
    for (const side of [-1, 1]) {
      const board = new Mesh(this.geometry, this.material);
      board.position.set(side * 39, 7.4, side * 18);
      board.rotation.y = (-side * Math.PI) / 2;
      this.group.add(board);
    }
    this.update(0, 0);
  }

  update(metres: number, seconds: number): void {
    const lap = 1 + Math.floor(Math.max(0, metres) / 250);
    const second = Math.floor(Math.max(0, seconds));
    if (lap === this.lap && second === this.second) return;
    this.lap = lap;
    this.second = second;
    const ink = this.ink;
    ink.fillStyle = '#142123';
    ink.fillRect(0, 0, this.face.width, this.face.height);
    ink.textAlign = 'center';
    ink.fillStyle = '#bde4dd';
    ink.font = 'bold 32px sans-serif';
    ink.fillText(this.venue, 256, 40);
    ink.fillStyle = '#ffde83';
    ink.font = 'bold 51px monospace';
    ink.fillText('LAP ' + lap, 256, 99);
    const clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
    ink.fillText('TIME ' + clock, 256, 157);
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.clear();
    this.texture.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
