import { isDisplayName } from './display-name';

describe('isDisplayName (L2-005 AC2)', () => {
  it.each([
    'Sam',
    '  Sam  ',
    'Al',
    'Sam R.',
    'sam_rider-7',
    'Zoë Ångström',
    '早川 さくら',
    'abcdefghijklmnopqrstuvwx',
  ])('takes %j', (name) => {
    expect(isDisplayName(name)).toBe(true);
  });

  it.each([
    '',
    '  ',
    'S',
    ' S ',
    'abcdefghijklmnopqrstuvwxy',
    '<Sam>',
    'Sam!',
    'sam@example.com',
    'Sam\tR',
    'Sam 🚴',
  ])('refuses %j', (name) => {
    expect(isDisplayName(name)).toBe(false);
  });
});
