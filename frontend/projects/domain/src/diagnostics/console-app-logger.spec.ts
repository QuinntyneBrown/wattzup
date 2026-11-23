// Unit test
// Traces to: L2-115 AC1, AC3
// Description: the logger writes to the console only: an error names its area and the error in plain text, with any
// email address or session token taken out; a packet line goes to the verbose level.
import { ConsoleAppLogger, redact } from './console-app-logger';

describe('ConsoleAppLogger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('names the area and the error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    new ConsoleAppLogger().error(
      'bluetooth',
      new DOMException('GATT operation failed', 'NetworkError'),
    );
    expect(error).toHaveBeenCalledWith('[bluetooth] NetworkError: GATT operation failed');
  });

  it('takes an email address out of an error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    new ConsoleAppLogger().error('sign-in', new Error('No account for ada@example.com'));
    expect(error).toHaveBeenCalledWith('[sign-in] Error: No account for [email]');
  });

  it('writes a packet line at the verbose level', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    new ConsoleAppLogger().packet('out', 'B1', 'F0 B1 01 08 AA');
    expect(debug).toHaveBeenCalledWith('[bluetooth] packet out B1 F0 B1 01 08 AA');
  });

  it.each([
    ['an email address', 'sent to ada.l+ride@mail.example.co.uk', 'sent to [email]'],
    ['a bearer token', 'Authorization: Bearer abc.DEF-123', 'Authorization: Bearer [token]'],
    ['a JWT', 'token eyJhbGciOiJI.eyJzdWIiOiIx.SflKxwRJ', 'token [token]'],
    ['a token in a query', '/api/session?code=8f3k2&next=/', '/api/session?code=[token]&next=/'],
    ['plain text', 'NetworkError: GATT operation failed', 'NetworkError: GATT operation failed'],
  ])('redacts %s', (_, text, redacted) => {
    expect(redact(text)).toBe(redacted);
  });
});
