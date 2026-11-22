/** Whether a ride with other people can be joined now, or why not (L2-135 AC4). */
export type MultiplayerAvailability = 'open' | 'offline' | 'unreachable';

/**
 * A riders-online race or a group class is offline while the browser has no network, whatever the screen last read;
 * online, it is open when the screen's last read reached the service, and unreachable when it did not.
 */
export function multiplayerAvailability(
  online: boolean,
  reached: boolean,
): MultiplayerAvailability {
  if (!online) return 'offline';
  return reached ? 'open' : 'unreachable';
}
