import type {
  BikeInfo,
  BleState,
  BluetoothSupportState,
  BuildInfo,
  DiagnosticsFact,
  DiagnosticsTone,
  SentCommand,
} from '@telo/api';
import { bleLinkName } from '../engine/sent-log';

/** What the browser says of itself: its user-agent string and, where it has them, its client hints. */
export interface BrowserSource {
  readonly userAgent: string;
  readonly brands?: readonly { readonly brand: string; readonly version: string }[];
  readonly platform?: string;
  readonly platformVersion?: string;
}

/** Everything Diagnostics reads, at one moment (docs/detailed-designs/diagnostics/inspect-diagnostics). */
export interface DiagnosticsInput {
  readonly browser: BrowserSource;
  readonly support: BluetoothSupportState;
  readonly page: string;
  /** The bike the connection knows this session, or `null`. */
  readonly bike: BikeInfo | null;
  readonly ble: BleState;
  readonly connectedSince: number | null;
  readonly reconnects: number;
  readonly last: SentCommand | null;
  readonly remembered: BikeInfo | null;
  readonly lastSeen: Date | null;
  /** Rides waiting to send, or `null` until counted. */
  readonly waiting: number | null;
  readonly build: BuildInfo;
  readonly now: number;
}

const BRANDS: readonly (readonly [string, string])[] = [
  ['Microsoft Edge', 'Edge'],
  ['Google Chrome', 'Chrome'],
  ['Opera', 'Opera'],
  ['Brave', 'Brave'],
  ['Chromium', 'Chromium'],
];

/** "Chrome 126 · macOS 14.5": the browser and its major version, then the system (L2-113 AC2). */
export function browserLabel(source: BrowserSource): string {
  return `${browserName(source)} · ${systemName(source)}`;
}

function browserName({ userAgent, brands }: BrowserSource): string {
  for (const [brand, name] of BRANDS) {
    const hint = brands?.find((b) => b.brand === brand);
    if (hint) return `${name} ${hint.version.split('.')[0]}`;
  }
  const edge = /Edg\/(\d+)/.exec(userAgent);
  if (edge) return `Edge ${edge[1]}`;
  const chrome = /(?:Headless)?Chrome\/(\d+)/.exec(userAgent);
  if (chrome) return `Chrome ${chrome[1]}`;
  const firefox = /Firefox\/(\d+)/.exec(userAgent);
  if (firefox) return `Firefox ${firefox[1]}`;
  const safari = /Version\/(\d+)[\d.]* .*Safari\//.exec(userAgent);
  if (safari) return `Safari ${safari[1]}`;
  return 'Unknown browser';
}

function systemName({ userAgent, platform, platformVersion }: BrowserSource): string {
  if (platform && platformVersion) {
    const [major = '', minor = '0'] = platformVersion.split('.');
    if (platform === 'macOS') return `macOS ${major}.${minor}`;
    if (platform === 'Windows') return Number(major) >= 13 ? 'Windows 11' : 'Windows 10';
    if (platform === 'Android' || platform === 'Chrome OS')
      return `${platform === 'Android' ? 'Android' : 'ChromeOS'} ${major}`;
    return platform;
  }
  const android = /Android (\d+)/.exec(userAgent);
  if (android) return `Android ${android[1]}`;
  const mac = /Mac OS X (\d+)[_.](\d+)/.exec(userAgent);
  if (mac) return `macOS ${mac[1]}.${mac[2]}`;
  if (/Windows NT 10/.test(userAgent)) return 'Windows 10';
  if (/CrOS/.test(userAgent)) return 'ChromeOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return platform || 'Unknown system';
}

/** "6m 52s" under an hour, "1h 05m" from one. */
export function durationLabel(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/** "just now", "5 minutes ago", "3 hours ago" or "2 days ago". */
export function agoLabel(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return 'just now';
  const [count, unit] =
    minutes < 60
      ? [minutes, 'minute']
      : minutes < 1440
        ? [Math.floor(minutes / 60), 'hour']
        : [Math.floor(minutes / 1440), 'day'];
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/** "RES 8 · plan · ack 41 ms"; without "ack" while the bike has not acknowledged it. */
export function commandLabel(command: SentCommand): string {
  const ack = command.ackMs === null ? '' : ` · ack ${Math.round(command.ackMs)} ms`;
  return `RES ${command.level} · ${command.source}${ack}`;
}

/** Web Bluetooth's fact: "Available", or what stands in its way. */
export function supportFact(state: BluetoothSupportState): DiagnosticsFact {
  const [value, tone]: [string, DiagnosticsTone] =
    state === 'ready'
      ? ['Available', 'ok']
      : state === 'adapter-off'
        ? ['Supported · adapter off', 'bad']
        : state === 'insecure-context'
          ? ['Needs a secure (https) page', 'bad']
          : ['Not in this browser', 'bad'];
  return { term: 'Web Bluetooth', value, tone };
}

function connectionLabel(ble: BleState, since: number | null, now: number): string {
  if (ble === 'connected' && since !== null) return `Connected · ${durationLabel(now - since)}`;
  return ble === 'connecting'
    ? 'Connecting'
    : ble === 'disconnected'
      ? 'Disconnected'
      : 'Not connected';
}

/**
 * The facts, in the dialog's order (L2-113 AC2 to AC4). The bike link's facts (Connection, Last command, Reconnects)
 * show only while the connection knows a bike and Bluetooth is on; Signal never shows, since no browser here reports
 * the strength of a connected bike. Without a bike link, Bike reads the remembered bike and when it was last seen, or
 * "None picked yet".
 */
export function diagnosticsFacts(input: DiagnosticsInput): readonly DiagnosticsFact[] {
  const link = input.support === 'ready' && input.bike !== null ? input.bike : null;
  const facts: DiagnosticsFact[] = [
    { term: 'Browser', value: browserLabel(input.browser) },
    supportFact(input.support),
    { term: 'Page', value: input.page },
  ];
  if (link) {
    facts.push(
      { term: 'Bike', value: `${link.name} · ${bleLinkName(link.kind).replace('BLE · ', '')}` },
      { term: 'Connection', value: connectionLabel(input.ble, input.connectedSince, input.now) },
      { term: 'Last command', value: input.last ? commandLabel(input.last) : 'None sent yet' },
      { term: 'Reconnects', value: `${input.reconnects} this ride` },
    );
  } else if (input.remembered) {
    const seen = input.lastSeen
      ? ` · last seen ${agoLabel(input.now - input.lastSeen.getTime())}`
      : '';
    facts.push({ term: 'Bike', value: `${input.remembered.name}${seen}` });
  } else {
    facts.push({ term: 'Bike', value: 'None picked yet', tone: 'warn' });
  }
  if (input.waiting !== null)
    facts.push({ term: 'Rides waiting to send', value: String(input.waiting) });
  facts.push({
    term: 'App version',
    value: `${input.build.version} · client ${input.build.commit}`,
  });
  return facts;
}
