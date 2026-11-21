import { Color, DoubleSide, MeshStandardMaterial, Texture } from 'three';
import { SurfaceMaterials } from './world-materials';

describe('SurfaceMaterials (#681)', () => {
  it('hands out one material for the same surface', () => {
    const surfaces = new SurfaceMaterials();
    const a = surfaces.standard({ color: 0xfbfbf8, roughness: 0.3 });
    const b = surfaces.standard({ roughness: 0.3, color: 0xfbfbf8 });
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(MeshStandardMaterial);
    expect(surfaces.size).toBe(1);
  });

  it.each([
    ['colour', { color: 0x111111 }],
    ['roughness', { roughness: 0.5 }],
    ['metalness', { metalness: 0.25 }],
    ['side', { side: DoubleSide }],
    ['transparency', { transparent: true, opacity: 0.5 }],
    ['map', { map: new Texture() }],
    ['emissive colour', { emissive: new Color(0xffffff) }],
    ['alpha test', { alphaTest: 0.5 }],
  ])('makes another material for a surface of another %s', (_, change) => {
    const surfaces = new SurfaceMaterials();
    const base = surfaces.standard({ color: 0xfbfbf8, roughness: 0.3 });
    expect(surfaces.standard({ color: 0xfbfbf8, roughness: 0.3, ...change })).not.toBe(base);
  });

  it('shares a surface whose emissive colour is the same, made twice', () => {
    const surfaces = new SurfaceMaterials();
    expect(surfaces.standard({ emissive: new Color(0xffffff) })).toBe(
      surfaces.standard({ emissive: new Color(0xffffff) }),
    );
  });

  it('shares a map by the texture, not by its look', () => {
    const surfaces = new SurfaceMaterials();
    const map = new Texture();
    expect(surfaces.standard({ map })).toBe(surfaces.standard({ map }));
    expect(surfaces.standard({ map })).not.toBe(surfaces.standard({ map: new Texture() }));
  });

  it('disposes each shared material once, and forgets it', () => {
    const surfaces = new SurfaceMaterials();
    const a = surfaces.standard({ color: 1 });
    surfaces.standard({ color: 1 });
    const b = surfaces.standard({ color: 2 });
    const disposeA = vi.spyOn(a, 'dispose');
    const disposeB = vi.spyOn(b, 'dispose');
    surfaces.dispose();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeB).toHaveBeenCalledTimes(1);
    expect(surfaces.size).toBe(0);
  });
});
