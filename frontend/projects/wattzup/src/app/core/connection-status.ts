// The app bar's status line (L2-018). First matching row wins.
import type { BikeState, StreamConnection } from '@wattzup/api';
import { computed, inject, type Signal } from '@angular/core';
import type { ConnectionStatus, StatusIcon, StatusTone } from '@wattzup/components';
import { LiveStateService } from './live-state.service';

export type { ConnectionStatus, StatusIcon, StatusTone };

/** The live connection status for a status line; call it in an injection context. */
export function liveConnectionStatus(): Signal<ConnectionStatus> {
  const live = inject(LiveStateService);
  return computed(() => connectionStatus(live.state(), live.connection(), live.loadFailed()));
}

export function connectionStatus(
  state: BikeState | null,
  connection: StreamConnection,
  loadFailed: boolean,
): ConnectionStatus {
  if (connection === 'offline') {
    return { name: 'Server offline', label: 'Retrying…', icon: 'wifi-off', tone: 'bad' };
  }
  if (!state || loadFailed) {
    return { name: 'Bike status', label: 'Unknown', icon: 'bluetooth', tone: 'wait' };
  }
  if (state.adapter === 'off') {
    return { name: 'Bluetooth', label: 'Off', icon: 'bluetooth-off', tone: 'bad' };
  }
  const label = state.device_label ?? 'Echelon bike';
  switch (state.ble) {
    case 'connected':
      return { name: label, label: 'Connected', icon: 'bluetooth', tone: 'ok' };
    case 'scanning':
    case 'starting':
      return { name: 'Echelon bike', label: 'Scanning…', icon: 'bluetooth-scan', tone: 'wait' };
    case 'connecting':
      return { name: label, label: 'Connecting…', icon: 'bluetooth', tone: 'wait' };
    case 'disconnected':
      return { name: label, label: 'Disconnected', icon: 'bluetooth-off', tone: 'bad' };
    default:
      return { name: 'Bike status', label: 'Error', icon: 'bluetooth-off', tone: 'bad' };
  }
}
