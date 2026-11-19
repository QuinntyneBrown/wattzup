import { commandLabel, commandLogView, commandTime, statusText } from './command-log-view';

describe('command-log-view (L2-048)', () => {
  const at = (o: object) =>
    ({
      at: 0,
      ride_seconds: 421,
      level: 18,
      source: 'plan',
      status: 'ack',
      ack_ms: 40,
      ...o,
    }) as const;
  it('shows ride time as m:ss or h:mm:ss', () => {
    expect(commandTime(at({}), () => 'x')).toBe('7:01');
    expect(commandTime(at({ ride_seconds: 3720 }), () => 'x')).toBe('1:02:00');
  });
  it('shows the local time of at with no ride time', () => {
    expect(commandTime(at({ ride_seconds: null, at: 5 }), (s) => `L${s}`)).toBe('L5');
  });
  it.each([
    [{ status: 'ack', ack_ms: 38 }, 'ack 38ms'],
    [{ status: 'sending', ack_ms: null }, 'sending'],
    [{ status: 'failed', ack_ms: null }, 'failed'],
  ])('status %o', (o, text) => {
    expect(statusText(at(o))).toBe(text);
  });

  it('labels a command with its level', () => {
    expect(commandLabel(at({ level: 22 }))).toBe('RES 22');
  });
});

describe('commandLogView (L2-048)', () => {
  const entry = (i: number) =>
    ({
      at: i,
      ride_seconds: 421,
      level: 18,
      source: 'plan',
      status: 'ack',
      ack_ms: 40,
    }) as const;
  const commands = [0, 1, 2, 3, 4, 5].map(entry);

  it('titles the panel and keeps every command', () => {
    const view = commandLogView(commands, () => 'x');
    expect(view.title).toBe('Sent to bike');
    expect(view.entries).toHaveLength(6);
    expect(view.entries[0]).toEqual({
      key: '0-18-0',
      time: '7:01',
      label: 'RES 18',
      source: 'plan',
      status: 'ack',
      text: 'ack 40ms',
    });
  });
});
