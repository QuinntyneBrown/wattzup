// The development simulator (L2-099 AC1): a bike that needs no chooser, sending a 0xD1 workout
// frame each second and echoing each resistance write as a 0xD2 frame, as the real bike does. Bound only in a development build opened with
// ?simulate; production builds never construct it. With ?simulate=locked it starts locked, as newer
// Echelon firmware does, and streams nothing until its challenge is answered (L2-002 AC10).
import { checksum } from '../protocol/echelon-commands';
import { UNLOCK_ACK, unlockResponse } from '../protocol/echelon-unlock';
import { MARKER, RESISTANCE, WORKOUT_DATA } from '../protocol/packet-decoder';
import type { BikeDevice, BluetoothPort, GattLink } from './bluetooth-port';
import type { Clock } from './clock';

/** As SimulatedBikeTransport.DeviceName. */
export const SIMULATED_BIKE_NAME = 'ECHSIM-0001';
/** As SimulationControl.Cadence's default. */
export const SIMULATED_CADENCE = 85;

/** True in a development build whose address holds the `simulate` parameter. */
export function simulateRequested(devMode: boolean, search: string): boolean {
  return devMode && new URLSearchParams(search).has('simulate');
}

/** True when the address asks for the simulated bike to start locked (`?simulate=locked`). */
export function simulateLocked(search: string): boolean {
  return new URLSearchParams(search).get('simulate') === 'locked';
}

/** The challenge the locked simulated bike sends: the protocol reference's worked example. */
export const SIMULATED_CHALLENGE = Uint8Array.of(0xf0, 0xe0, 0x12, 0x34, 0x56, 0x78, 0x09, 0xed);
/** How long after the subscription the locked simulated bike sends its challenge. */
const CHALLENGE_DELAY_MS = 100;

export class SimulatedBluetoothPort implements BluetoothPort {
  constructor(
    private readonly clock: Clock,
    private readonly locked = false,
  ) {}

  support(): 'ready' {
    return 'ready';
  }

  async availability(): Promise<boolean> {
    return true;
  }

  onAvailabilityChanged(): void {
    // The simulated radio never changes.
  }

  /** The simulated bike is never remembered: Connect bike picks it each visit. */
  async knownBikes(): Promise<BikeDevice[]> {
    return [];
  }

  async requestBike(): Promise<BikeDevice> {
    return new SimulatedBike(this.clock, this.locked);
  }
}

class SimulatedBike implements BikeDevice {
  readonly name = SIMULATED_BIKE_NAME;
  private readonly listeners: (() => void)[] = [];

  constructor(
    private readonly clock: Clock,
    private readonly locked: boolean,
  ) {}

  async connect(): Promise<GattLink> {
    return new SimulatedLink(this.clock, this.locked);
  }

  onDisconnected(listener: () => void): void {
    this.listeners.push(listener);
  }
}

class SimulatedLink implements GattLink {
  private onPacket: ((frame: Uint8Array) => void) | null = null;
  private connected = true;
  private readonly openedAt: number;
  private tick = 0;

  constructor(
    private readonly clock: Clock,
    private locked: boolean,
  ) {
    this.openedAt = clock.now();
  }

  async startNotifications(onPacket: (frame: Uint8Array) => void): Promise<void> {
    this.onPacket = onPacket;
    if (this.locked) void this.challenge();
    void this.stream();
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.connected) throw new Error('The simulated bike is not connected.');
    if (this.locked) {
      const answer = unlockResponse(SIMULATED_CHALLENGE);
      if (answer.ok && answer.response.every((b, i) => bytes[i] === b)) {
        this.locked = false;
        this.deliver(UNLOCK_ACK);
      }
      return;
    }
    if (bytes.length === 5 && bytes[0] === MARKER && bytes[1] === 0xb1 && bytes[2] === 0x01) {
      this.deliver(withChecksum([MARKER, RESISTANCE, 0x01, bytes[3], 0]));
    }
  }

  disconnect(): void {
    this.connected = false;
  }

  private async stream(): Promise<void> {
    for (;;) {
      await this.clock.delay(1000);
      if (!this.connected) return;
      if (this.locked) continue;
      const tick = ++this.tick & 0xffff;
      const elapsed = Math.floor((this.clock.now() - this.openedAt) / 1000) & 0xffff;
      const cadence = SIMULATED_CADENCE;
      this.deliver(
        withChecksum([
          MARKER,
          WORKOUT_DATA,
          0x09,
          elapsed >> 8,
          elapsed & 0xff,
          0,
          0,
          tick >> 8,
          tick & 0xff,
          cadence >> 8,
          cadence & 0xff,
          0,
          0,
        ]),
      );
    }
  }

  private async challenge(): Promise<void> {
    await this.clock.delay(CHALLENGE_DELAY_MS);
    this.deliver(SIMULATED_CHALLENGE);
  }

  private deliver(frame: Uint8Array): void {
    if (this.connected) this.onPacket?.(frame);
  }
}

function withChecksum(bytes: number[]): Uint8Array {
  const frame = Uint8Array.from(bytes);
  frame[frame.length - 1] = checksum(frame.subarray(0, frame.length - 1));
  return frame;
}
