import { describe, expect, it } from 'vitest';
import { STREETS } from './world-streets';

describe('STREETS lazy street loaders', () => {
  it('exposes on-demand async loaders that resolve to a StreetFactory for registered worlds', async () => {
    const loadGiza = STREETS.giza;
    expect(loadGiza).toBeTypeOf('function');

    const factory = await loadGiza!();
    expect(factory).toBeTypeOf('function');
  });
});
