import { codeRefusal, signInMessage } from './sign-in-message';

describe('signInMessage (L2-001 AC5, L2-003 AC4)', () => {
  it('says a failed send could not be sent', () => {
    expect(signInMessage({ code: 'send_failed', retryAfterSeconds: null })).toBe(
      'We couldn’t send your code. Check your connection and try again.',
    );
  });

  it.each([
    [2501, 'Too many codes asked for. Try again in 42 minutes.'],
    [2520, 'Too many codes asked for. Try again in 42 minutes.'],
    [30, 'Too many codes asked for. Try again in 1 minute.'],
    [null, 'Too many codes asked for. Try again in 60 minutes.'],
  ])('says when to try again after %j seconds, in minutes rounded up', (seconds, words) => {
    expect(signInMessage({ code: 'rate_limited', retryAfterSeconds: seconds })).toBe(words);
  });

  it.each(['invalid_email', 'resend_too_soon', 'code_mismatch', 'check_failed'] as const)(
    'leaves %s to its own place',
    (code) => {
      expect(signInMessage({ code, retryAfterSeconds: 12 })).toBeNull();
    },
  );

  it('says nothing when nothing was refused', () => {
    expect(signInMessage(null)).toBeNull();
  });
});

describe('codeRefusal (L2-002 AC3, AC4, L2-003 AC3)', () => {
  it.each([
    ['code_mismatch', 'That code doesn’t match. Try again.'],
    ['code_expired', 'That code has expired.'],
    ['code_locked', 'Too many wrong codes. Send a new code to try again.'],
    ['check_failed', 'We couldn’t check your code. Check your connection and try again.'],
  ] as const)('words %s', (code, words) => {
    expect(codeRefusal({ code, retryAfterSeconds: null })).toBe(words);
  });

  it.each(['send_failed', 'rate_limited', 'invalid_email'] as const)(
    'leaves %s to the screen',
    (code) => {
      expect(codeRefusal({ code, retryAfterSeconds: null })).toBeNull();
    },
  );
});
