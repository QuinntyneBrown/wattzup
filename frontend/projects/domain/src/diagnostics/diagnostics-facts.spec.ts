// Unit test
// Traces to: L2-113 AC2, AC3, AC4
// Description: the facts Diagnostics shows, in order: the browser and its system, Web Bluetooth, the page, the bike
// with its link facts while connected, the remembered bike and when it was last seen without one, "None picked yet"
// with neither, the rides waiting once counted, and the app version; and the labels each fact is made of.
import type { BikeInfo, SentCommand } from '@telo/api';
import {
  type DiagnosticsInput,
  agoLabel,
  browserLabel,
  commandLabel,
  diagnosticsFacts,
  durationLabel,
  supportFact,
} from './diagnostics-facts';

const BIKE: BikeInfo = {
  id: 'k',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-141844',
  kind: 'echelon',
};
const NOW = Date.UTC(2026, 10, 22, 12);
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CONNECTED: DiagnosticsInput = {
  browser: { userAgent: MAC_CHROME },
  support: 'ready',
  page: 'https://ride.telo.app/profile/custom/ride',
  bike: BIKE,
  ble: 'connected',
  connectedSince: NOW - (6 * 60 + 52) * 1000,
  reconnects: 0,
  last: { rideTime: 400, level: 8, source: 'plan', ackMs: 41 },
  remembered: BIKE,
  lastSeen: new Date(NOW),
  waiting: 0,
  build: { version: '2.0.0', commit: '7f3c2a1' },
  now: NOW,
};

describe('diagnosticsFacts', () => {
  it('reads every fact of a connected bike, in order (AC2)', () => {
    expect(diagnosticsFacts(CONNECTED)).toEqual([
      { term: 'Browser', value: 'Chrome 126 · macOS 10.15' },
      { term: 'Web Bluetooth', value: 'Available', tone: 'ok' },
      { term: 'Page', value: 'https://ride.telo.app/profile/custom/ride' },
      { term: 'Bike', value: 'Echelon EX-5s · 0bf669f1' },
      { term: 'Connection', value: 'Connected · 6m 52s' },
      { term: 'Last command', value: 'RES 8 · plan · ack 41 ms' },
      { term: 'Reconnects', value: '0 this ride' },
      { term: 'Rides waiting to send', value: '0' },
      { term: 'App version', value: '2.0.0 · client 7f3c2a1' },
    ]);
  });

  it.each<[string, Partial<DiagnosticsInput>, string]>([
    ['reconnecting', { ble: 'connecting', connectedSince: null }, 'Connecting'],
    ['dropped', { ble: 'disconnected', connectedSince: null }, 'Disconnected'],
    ['left alone', { ble: 'idle', connectedSince: null }, 'Not connected'],
  ])('reads the link %s as "%s"', (_, change, connection) => {
    expect(
      diagnosticsFacts({ ...CONNECTED, ...change }).find((f) => f.term === 'Connection')?.value,
    ).toBe(connection);
  });

  it('says no command was sent yet, and counts the reconnects', () => {
    const facts = diagnosticsFacts({ ...CONNECTED, last: null, reconnects: 2 });
    expect(facts.find((f) => f.term === 'Last command')?.value).toBe('None sent yet');
    expect(facts.find((f) => f.term === 'Reconnects')?.value).toBe('2 this ride');
  });

  it('with no bike picked, reads "None picked yet" and leaves out the link facts (AC3)', () => {
    expect(
      diagnosticsFacts({ ...CONNECTED, bike: null, remembered: null, lastSeen: null, ble: 'idle' }),
    ).toEqual([
      { term: 'Browser', value: 'Chrome 126 · macOS 10.15' },
      { term: 'Web Bluetooth', value: 'Available', tone: 'ok' },
      { term: 'Page', value: 'https://ride.telo.app/profile/custom/ride' },
      { term: 'Bike', value: 'None picked yet', tone: 'warn' },
      { term: 'Rides waiting to send', value: '0' },
      { term: 'App version', value: '2.0.0 · client 7f3c2a1' },
    ]);
  });

  it('with Bluetooth off, reads the adapter and the remembered bike last seen (AC4)', () => {
    const facts = diagnosticsFacts({
      ...CONNECTED,
      support: 'adapter-off',
      lastSeen: new Date(NOW - 2 * 86_400_000),
    });
    expect(facts.slice(1, 4)).toEqual([
      { term: 'Web Bluetooth', value: 'Supported · adapter off', tone: 'bad' },
      { term: 'Page', value: 'https://ride.telo.app/profile/custom/ride' },
      { term: 'Bike', value: 'Echelon EX-5s · last seen 2 days ago' },
    ]);
    expect(facts.map((f) => f.term)).not.toContain('Connection');
  });

  it('names a remembered bike it has no time for without one', () => {
    const facts = diagnosticsFacts({ ...CONNECTED, bike: null, lastSeen: null });
    expect(facts.find((f) => f.term === 'Bike')?.value).toBe('Echelon EX-5s');
  });

  it('leaves out the rides waiting until they are counted', () => {
    expect(diagnosticsFacts({ ...CONNECTED, waiting: null }).map((f) => f.term)).not.toContain(
      'Rides waiting to send',
    );
  });
});

describe('browserLabel', () => {
  it.each<[string, Parameters<typeof browserLabel>[0], string]>([
    [
      'Chrome on a Mac, from its client hints',
      {
        userAgent: MAC_CHROME,
        brands: [{ brand: 'Google Chrome', version: '126.0.6478.127' }],
        platform: 'macOS',
        platformVersion: '14.5.0',
      },
      'Chrome 126 · macOS 14.5',
    ],
    [
      'Chrome on a Mac, from the user agent alone',
      { userAgent: MAC_CHROME },
      'Chrome 126 · macOS 10.15',
    ],
    [
      'Edge on Windows 11',
      {
        userAgent: 'x Edg/125.0',
        brands: [{ brand: 'Microsoft Edge', version: '125' }],
        platform: 'Windows',
        platformVersion: '15.0.0',
      },
      'Edge 125 · Windows 11',
    ],
    [
      'Edge on Windows 10, from the user agent',
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0 Safari/537.36 Edg/125.0',
      },
      'Edge 125 · Windows 10',
    ],
    [
      'Chrome on Android',
      { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0 Mobile Safari/537.36' },
      'Chrome 126 · Android 14',
    ],
    [
      'headless Chromium on Linux',
      { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/131.0.0.0 Safari/537.36' },
      'Chrome 131 · Linux',
    ],
    [
      'Chromium from its client hints',
      {
        userAgent: '',
        brands: [
          { brand: 'Not/A)Brand', version: '8' },
          { brand: 'Chromium', version: '126' },
        ],
        platform: 'Linux',
        platformVersion: '6.5.0',
      },
      'Chromium 126 · Linux',
    ],
    ['an unknown browser', { userAgent: 'curl/8' }, 'Unknown browser · Unknown system'],
  ])('reads %s', (_, source, label) => {
    expect(browserLabel(source)).toBe(label);
  });
});

describe('the labels', () => {
  it.each([
    [0, '0m 00s'],
    [412_000, '6m 52s'],
    [3_599_000, '59m 59s'],
    [3_900_000, '1h 05m'],
  ])('a link of %i ms reads "%s"', (ms, label) => {
    expect(durationLabel(ms)).toBe(label);
  });

  it.each([
    [30_000, 'just now'],
    [60_000, '1 minute ago'],
    [5 * 60_000, '5 minutes ago'],
    [3 * 3_600_000, '3 hours ago'],
    [86_400_000, '1 day ago'],
    [2 * 86_400_000, '2 days ago'],
  ])('%i ms ago reads "%s"', (ms, label) => {
    expect(agoLabel(ms)).toBe(label);
  });

  it.each<[SentCommand, string]>([
    [{ rideTime: 1, level: 8, source: 'plan', ackMs: 41 }, 'RES 8 · plan · ack 41 ms'],
    [{ rideTime: 1, level: 12, source: 'manual', ackMs: 40.6 }, 'RES 12 · manual · ack 41 ms'],
    [{ rideTime: null, level: 3, source: 'plan', ackMs: null }, 'RES 3 · plan'],
  ])('a command reads "%s"', (command, label) => {
    expect(commandLabel(command)).toBe(label);
  });

  it.each([
    ['ready', 'Available', 'ok'],
    ['adapter-off', 'Supported · adapter off', 'bad'],
    ['insecure-context', 'Needs a secure (https) page', 'bad'],
    ['unsupported-browser', 'Not in this browser', 'bad'],
  ] as const)('Web Bluetooth %s reads "%s"', (state, value, tone) => {
    expect(supportFact(state)).toEqual({ term: 'Web Bluetooth', value, tone });
  });
});
