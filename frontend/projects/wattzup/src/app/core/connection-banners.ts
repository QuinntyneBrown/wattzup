// Which connection banners show (L2-054). Pure: the service supplies time, history and dismissals.
import type { BikeState } from '@wattzup/api';
import { formatDuration } from './format-duration';
import { isActive } from './workout-status';

export type BannerId = 'adapter-off' | 'unlock-failed' | 'reconnected' | 'simulated';
export type BannerTone = 'info' | 'success' | 'warning' | 'danger';
export type BannerAction = 'diagnostics';

export interface Banner {
  id: BannerId;
  tone: BannerTone;
  icon: 'bluetooth-off' | 'check-circle' | 'info';
  title: string;
  text: string;
  action: { label: string; kind: BannerAction } | null;
  dismissable: boolean;
}

export interface BannerInput {
  state: BikeState | null;
  reconnected: { label: string; elapsed: number; level: number | null } | null;
  dismissed: ReadonlySet<BannerId>;
}

export function banners(input: BannerInput): Banner[] {
  const { state, dismissed } = input;
  const list: Banner[] = [];
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
  // A newer bike did not accept the unlock: a Bluetooth error the rider can do little about but
  // wait for the retry (L2-002 AC7). The detail stays in the console.
  if (state.ble === 'error' && state.error?.startsWith('UnlockError:')) {
    list.push({
      id: 'unlock-failed',
      tone: 'danger',
      icon: 'bluetooth-off',
      title: "Couldn't unlock the bike",
      text: "Newer Echelon bikes ask for an unlock code before they send data, and this one didn't accept it. Wattzup tries again every 3 seconds.",
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
  if (state.simulated && !dismissed.has('simulated')) {
    list.push({
      id: 'simulated',
      tone: 'info',
      icon: 'info',
      title: 'Simulated bike',
      text: 'No hardware connected — Wattzup was opened with ?simulate and is generating cadence and resistance.',
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
