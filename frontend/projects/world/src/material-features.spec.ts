import { compiledFeatures } from './material-features';

const road = { map: 'plain', normalMap: null, envMap: null, clearcoat: 0, roughness: 0.9 };

describe('compiledFeatures (#680)', () => {
  it.each([
    ['a dry road', road, 'map'],
    ['setts with relief', { ...road, normalMap: 'relief' }, 'map+normal-map'],
    ['a wet road reflecting the sky', { ...road, envMap: 'sky' }, 'map+env-map'],
    ['clear-coat frame paint', { clearcoat: 1 }, 'clearcoat'],
    ['frame paint without clear-coat', { clearcoat: 0 }, ''],
  ])('reads %s as "%s"', (_, material, expected) => {
    expect(compiledFeatures(material)).toBe(expected);
  });

  it.each([
    ['the layered road for the plain one', { ...road, map: 'layered' }],
    ['a wetter, darker, glossier road', { ...road, roughness: 0.28 }],
  ])('needs no new program to swap %s', (_, after) => {
    expect(compiledFeatures(after)).toBe(compiledFeatures(road));
  });
});
