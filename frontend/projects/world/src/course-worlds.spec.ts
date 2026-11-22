import { coursePath } from './course-worlds';

describe('coursePath (L2-166 AC1)', () => {
  it('serves Ibiza Sunset Strip as a course', () => {
    expect(coursePath('ibiza')).toBe('courses/ibiza');
  });

  it("leaves every other world to main's scenes", () => {
    expect(coursePath('oldtown')).toBeNull();
  });
});
