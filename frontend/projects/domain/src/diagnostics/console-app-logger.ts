import { Injectable } from '@angular/core';
import type { AppLogger, PacketDirection } from '@telo/api';
import { describeError } from '../bluetooth/describe-error';

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const BEARER = /\bBearer\s+[\w.~+/=-]+/gi;
const JWT = /\beyJ[\w-]*\.[\w-]+\.[\w-]+/g;
const TOKEN_PARAM = /\b(token|session|code|sid)=[^&\s]+/gi;

/** A message with any email address or session token replaced (L2-115 AC3). */
export function redact(text: string): string {
  return text
    .replace(EMAIL, '[email]')
    .replace(BEARER, 'Bearer [token]')
    .replace(JWT, '[token]')
    .replace(TOKEN_PARAM, '$1=[token]');
}

/**
 * The app's logger (L2-115): the browser console and nothing else. An error reads "[area] Name: message" in plain
 * text, redacted; a packet line goes to the console's verbose level.
 */
@Injectable()
export class ConsoleAppLogger implements AppLogger {
  error(area: string, error: unknown): void {
    console.error(redact(`[${area}] ${describeError(error)}`));
  }

  packet(direction: PacketDirection, frame: string, hex: string): void {
    console.debug(`[bluetooth] packet ${direction} ${frame} ${hex}`);
  }
}
