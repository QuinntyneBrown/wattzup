import { coursePath } from './course-worlds';

describe('coursePath (L2-166 AC1)', () => {
  it.each([
    ['mardigras', 'courses/mardigras'],
    ['amsterdam', 'courses/amsterdam'],
    ['ibiza', 'courses/ibiza'],
    ['cinqueterre', 'courses/cinqueterre'],
    ['haleakala', 'courses/haleakala'],
    ['prairie', 'courses/prairie'],
    ['oldtown', 'courses/oldtown'],
    ['coast', 'courses/coast'],
    ['docklands', 'courses/docklands'],
    ['dolomites', 'courses/dolomites'],
    // Vice City is drawn under South Beach's id (map-world.ts).
    ['southbeach', 'courses/vicecity'],
    ['granite', 'courses/granite'],
    ['sellaronda', 'courses/sellaronda'],
  ] as const)('serves the %s map as a course built in Blender', (world, path) => {
    expect(coursePath(world)).toBe(path);
  });

  it("leaves a world no map rides to main's scenes", () => {
    expect(coursePath('pamplona')).toBeNull();
  });
});
