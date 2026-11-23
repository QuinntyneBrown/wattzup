import { InjectionToken } from '@angular/core';
import type { PacketDirection } from './packet-log';

/**
 * Where the app logs (L2-115): the browser's console, and no remote logging service. An error names its area and the
 * error in plain text, with no email address or session token in it.
 */
export interface AppLogger {
  /** "[bluetooth] NetworkError: GATT operation failed". */
  error(area: string, error: unknown): void;
  /** One packet, written only while "Log every packet" is on (L2-115 AC2). */
  packet(direction: PacketDirection, frame: string, hex: string): void;
}

export const APP_LOGGER = new InjectionToken<AppLogger>('AppLogger');
