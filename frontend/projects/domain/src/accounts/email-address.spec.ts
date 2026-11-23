import { isEmailAddress } from './email-address';

describe('isEmailAddress (L2-001 AC3)', () => {
  it.each(['rider@example.com', '  rider@example.com ', 'first.last+ride@sub.example.org'])(
    'accepts %j',
    (typed) => expect(isEmailAddress(typed)).toBe(true),
  );

  it.each([
    '',
    '   ',
    'rider',
    'rider@example',
    'rider.example.com',
    'rider @example.com',
    'rider@exa mple.com',
    '@example.com',
  ])('refuses %j', (typed) => expect(isEmailAddress(typed)).toBe(false));
});
