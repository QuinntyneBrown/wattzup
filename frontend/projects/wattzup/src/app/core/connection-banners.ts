// Which connection banners show (L2-054). Pure: the service supplies time, history and dismissals.
import type { BikeState, StreamConnection } from '@wattzup/api';
import { formatDuration } from './format-duration';
import { isActive } from './workout-status';

export type BannerId = 'offline' | 'adapter-off' | 'reconnected' | 'exposed' | 'simulated';
export type BannerTone = 'info' | 'success' | 'warning' | 'danger';
export type BannerAction = 'retry' | 'diagnostics';

export interface Banner {
  id: BannerId;
  tone: BannerTone;
  icon: 'wifi-off' | 'bluetooth-off' | 'check-circle' | 'key' | 'info';
  title: string;
  text: string;
  action: { label: string; kind: BannerAction } | null;
  dismissable: boolean;
}

export interface BannerInput {
  state: BikeState | null;
  connection: StreamConnection;
  lastStateTime: string | null;
  reconnected: { label: string; elapsed: number; level: number | null } | null;
  dismissed: ReadonlySet<BannerId>;
}

export function banners(input: BannerInput): Banner[] {
  const { state, connection, dismissed } = input;
  const list: Banner[] = [];
  if (connection === 'offline' && state) {
    list.push({
      id: 'offline',
      tone: 'warning',
      icon: 'wifi-off',
      title: 'Lost connection to the Wattzup server',
      text: `Retrying every 2 seconds. Numbers below are from ${input.lastStateTime ?? 'earlier'} and controls are paused.`,
      action: { label: 'Retry now', kind: 'retry' },
      dismissable: false,
    });
  }
  if (!state) return list;
  if (state.adapter === 'off') {
    list.push({
      id: 'adapter-off',
      tone: 'danger',
      icon: 'bluetooth-off',
      title: 'Bluetooth is off',
      text: 'Turn Bluetooth on to reach the bike. Wattzup retries every 3 seconds.',
      action: { label: 'Open diagnostics', kind: 'diagnostics' },
      dismissable: false,
    });
  }
  const back = input.reconnected;
  if (back && !dismissed.has('reconnected')) {
    list.push({
      id: 'reconnected',
      tone: 'success',
      icon: 'check-circle',
      title: 'Reconnected',
      text: `${back.label} is back. The plan picked up at ${formatDuration(back.elapsed)} and resistance is set to ${back.level ?? '--'}.`,
      action: null,
      dismissable: true,
    });
  }
  if (state.exposed && !dismissed.has('exposed')) {
    list.push({
      id: 'exposed',
      tone: 'info',
      icon: 'key',
      title: 'Shared on your network',
      text: `This server listens on ${state.bind_address}. Anyone with the API key can change the bike's resistance.`,
      action: null,
      dismissable: true,
    });
  }
  if (state.simulated && !dismissed.has('simulated')) {
    list.push({
      id: 'simulated',
      tone: 'info',
      icon: 'info',
      title: 'Simulated bike',
      text: 'No hardware connected — Wattzup started with --simulate and is generating cadence and resistance.',
      action: null,
      dismissable: true,
    });
  }
  return list;
}

/** A bike that comes back during an active workout (L2-054 AC4). */
export function isReconnect(previous: BikeState | null, next: BikeState): boolean {
  return (
    previous !== null &&
    previous.ble !== 'connected' &&
    next.ble === 'connected' &&
    isActive(next.workout)
  );
}
