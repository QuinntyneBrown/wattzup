import { describe, expect, it, vi } from 'vitest';
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import { BEND_FROM, BEND_SAMPLES, BEND_STEP, bendAhead } from './scene-bend';
import { RoadBend } from './world-bend';
import { ThreeWorldRenderer } from './world-renderer';
import { WORLDS } from './worlds';

describe('RoadBend and steady-state draw() scene traversal (L2-110 AC9, L2-111 AC10)', () => {
  it('stores bend samples and height+delta pairs in flat Float32Array buffers without per-render UniformArray repacking', () => {
    const world = WORLDS.find((w) => w.id === 'oldtown')!;
    const samples = new Float32Array(BEND_SAMPLES * 4);
    bendAhead(world, 42, samples);
    const heightAt = (metres: number) => Math.sin(metres * 0.03) * 4.5;

    const bend = new RoadBend();
    bend.update(samples, heightAt);

    expect(bend.sampleData).toBeInstanceOf(Float32Array);
    expect(bend.heightData).toBeInstanceOf(Float32Array);
    expect(bend.sampleData.length).toBe(BEND_SAMPLES * 4);
    expect(bend.heightData.length).toBe(BEND_SAMPLES * 4);

    for (let i = 0; i < BEND_SAMPLES - 1; i++) {
      const ha = Math.fround(heightAt(BEND_FROM + i * BEND_STEP));
      const hb = Math.fround(heightAt(BEND_FROM + (i + 1) * BEND_STEP));
      const h0 = bend.heightData[i * 4]!;
      const dh = bend.heightData[i * 4 + 1]!;
      expect(h0).toBeCloseTo(ha, 5);
      expect(h0 + dh * 0.37).toBeCloseTo(ha + (hb - ha) * 0.37, 5);
    }

    const root = new Group();
    const kept = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    const bentMesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    const bentSprite = new Sprite(new SpriteMaterial());
    root.add(kept, bentMesh, bentSprite);

    bend.apply(root, new Set([kept]));
    expect((kept.material as { positionNode?: unknown }).positionNode).toBeUndefined();
    expect(kept.frustumCulled).toBe(true);
    expect((bentMesh.material as { positionNode?: unknown }).positionNode).toBeDefined();
    expect(bentMesh.frustumCulled).toBe(false);
    expect((bentSprite.material as { positionNode?: unknown }).positionNode).toBeDefined();
    expect(bentSprite.frustumCulled).toBe(false);
  });

  it('does not traverse the scene graph every 120 frames during steady-state draw()', () => {
    const renderer = new ThreeWorldRenderer();
    const internal = renderer as unknown as {
      renderer: {
        render: () => void;
        info: { reset: () => void; render: { drawCalls: number }; memory: { programs: number } };
        toneMapping: number;
        toneMappingExposure: number;
        shadowMap: { enabled: boolean; type: number };
      };
      world: (typeof WORLDS)[number];
      scene: Group;
    };
    internal.world = WORLDS.find((w) => w.id === 'oldtown')!;
    internal.renderer = {
      render: () => undefined,
      info: { reset: () => undefined, render: { drawCalls: 0 }, memory: { programs: 0 } },
      toneMapping: 0,
      toneMappingExposure: 1,
      shadowMap: { enabled: false, type: 0 },
    };

    const traverseSpy = vi.spyOn(internal.scene, 'traverse');
    for (let i = 0; i < 250; i++) {
      renderer.draw({
        s: i * 0.5,
        crank: i * 0.1,
        segments: [{ kind: 'work', start: 0, duration: 300, level: 20, cadenceAim: 90 }],
        elapsed: i / 60,
        time: i / 60,
        speedKmh: 32,
        reducedMotion: false,
      });
    }
    expect(traverseSpy).not.toHaveBeenCalled();
  });
});
