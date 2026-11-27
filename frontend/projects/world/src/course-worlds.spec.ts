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
    ['southbeach', 'courses/southbeach'],
    ['granite', 'courses/granite'],
    ['sellaronda', 'courses/sellaronda'],
  ] as const)('serves the %s map as a course built in Blender', (world, path) => {
    expect(coursePath(world)).toBe(path);
  });

  it('keeps the Vice City course when the two maps share a world palette', () => {
    expect(coursePath('southbeach', 'vicecity')).toBe('courses/vicecity');
  });

  it("leaves a world no map rides to main's scenes", () => {
    expect(coursePath('pamplona')).toBeNull();
  });
});
