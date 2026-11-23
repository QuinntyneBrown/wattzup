/** The link state of the bike: `ble` (L2-017). */
export type BleState = 'idle' | 'connecting' | 'connected' | 'disconnected';

/** Whether a bike status reads as fine or needs the rider (L2-019); never carried by colour alone. */
export type BikeStatusTone = 'ok' | 'alert';

/** What every bike status shows (docs/detailed-designs/bike/keep-the-bike-connected). */
export interface BikeStatusView {
  /** The header's visible words: the bike's name, or "Bike" when none is known. */
  readonly label: string;
  /** Read after the label by a screen reader: " connected" or " not connected". */
  readonly hiddenText: string;
  /** The header's tooltip: "Bike not connected", or `null` when it is. */
  readonly title: string | null;
  readonly tone: BikeStatusTone;
  /** Custom ride's status: "Connected", "Disconnected", "No bike connected", "Bluetooth is off" or "Bluetooth unavailable in this browser". */
  readonly rideLabel: string;
  /** The `aria-label` of the link to Diagnostics: "Diagnostics: Echelon EX-5s Connected". */
  readonly diagnosticsLabel: string;
}
