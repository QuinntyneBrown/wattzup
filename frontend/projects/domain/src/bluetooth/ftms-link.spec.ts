// Unit test
// Traces to: L2-014 AC1 to AC4
// Description: the FTMS link subscribes and reads the range on open, asks for control with the first target, sends
// Set Target Resistance Level only after a Success response, and is read only when the bike refuses, does not
// answer, or has no control point. Vitest's fake clock drives the timeout; nothing sleeps.
import { BikeConnectionError } from '@telo/api';
import { FtmsProtocol } from '../protocol/ftms-protocol';
import { CONTROL_TIMEOUT_MS, FtmsLink } from './ftms-link';
import { GattWriteQueue } from './gatt-write-queue';

/** A GATT service holding the given characteristics, logging every call in order. */
function fakeService(uuids: string[], range = [0x0a, 0x00, 0xe8, 0x03, 0x0a, 0x00]) {
  const log: string[] = [];
  const characteristics = new Map(
    uuids.map((uuid) => {
      const c = Object.assign(new EventTarget(), {
        uuid,
        value: null as DataView | null,
        startNotifications: async () => (log.push(`subscribe ${uuid}`), c),
        readValue: async () => (
          log.push(`read ${uuid}`),
          new DataView(Uint8Array.from(range).buffer)
        ),
        writeValueWithResponse: async (bytes: Uint8Array) =>
          void log.push(`write ${uuid} ${[...bytes].join(',')}`),
        push(...bytes: number[]) {
          c.value = new DataView(Uint8Array.from(bytes).buffer);
          c.dispatchEvent(new Event('characteristicvaluechanged'));
        },
      });
      return [uuid, c] as const;
    }),
  );
  const service = {
    getCharacteristic: async (uuid: string) => {
      const c = characteristics.get(uuid);
      if (!c) throw new DOMException('No characteristic', 'NotFoundError');
      return c;
    },
  } as unknown as BluetoothRemoteGATTService;
  return { service, log, characteristic: (uuid: string) => characteristics.get(uuid)! };
}

const ALL = [FtmsProtocol.indoorBikeData, FtmsProtocol.controlPoint, FtmsProtocol.resistanceRange];

describe('FtmsLink', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('subscribes to Indoor Bike Data and the control point, then reads the range (AC1)', async () => {
    const bike = fakeService(ALL);
    await new FtmsLink(new GattWriteQueue(), () => undefined).open(bike.service);

    expect(bike.log).toEqual([
      `subscribe ${FtmsProtocol.indoorBikeData}`,
      `subscribe ${FtmsProtocol.controlPoint}`,
      `read ${FtmsProtocol.resistanceRange}`,
    ]);
  });

  it('asks for control first and sets the mapped level only after Success (AC2, AC4)', async () => {
    const bike = fakeService(ALL);
    const link = new FtmsLink(new GattWriteQueue(), () => undefined);
    await link.open(bike.service);
    bike.log.length = 0;

    const set = link.setResistance(16);
    await vi.advanceTimersByTimeAsync(0);
    expect(bike.log).toEqual([`write ${FtmsProtocol.controlPoint} 0`]);

    bike.characteristic(FtmsProtocol.controlPoint).push(0x80, 0x00, 0x01);
    await set;

    expect(bike.log).toEqual([
      `write ${FtmsProtocol.controlPoint} 0`,
      `write ${FtmsProtocol.controlPoint} 4,234,1`,
    ]);
    expect(link.control).toBe('full');

    await link.setResistance(32);
    expect(bike.log.at(-1)).toBe(`write ${FtmsProtocol.controlPoint} 4,232,3`);
    expect(bike.log).toHaveLength(3);
  });

  it('is read only when the bike refuses control, and asks only once (AC3)', async () => {
    const bike = fakeService(ALL);
    const link = new FtmsLink(new GattWriteQueue(), () => undefined);
    await link.open(bike.service);

    const set = link.setResistance(10);
    await vi.advanceTimersByTimeAsync(0);
    bike.characteristic(FtmsProtocol.controlPoint).push(0x80, 0x00, 0x05);

    await expect(set).rejects.toBeInstanceOf(BikeConnectionError);
    await expect(set).rejects.toMatchObject({ code: 'read-only' });
    await expect(link.setResistance(10)).rejects.toMatchObject({ code: 'read-only' });
    expect(link.control).toBe('read-only');
    expect(bike.log.filter((line) => line.startsWith('write'))).toEqual([
      `write ${FtmsProtocol.controlPoint} 0`,
    ]);
  });

  it('is read only when the bike does not answer Request Control in time (AC3)', async () => {
    const bike = fakeService(ALL);
    const link = new FtmsLink(new GattWriteQueue(), () => undefined);
    await link.open(bike.service);

    const set = link.setResistance(10);
    const refused = expect(set).rejects.toMatchObject({ code: 'read-only' });
    await vi.advanceTimersByTimeAsync(CONTROL_TIMEOUT_MS - 1);
    expect(link.control).toBe('unknown');
    await vi.advanceTimersByTimeAsync(1);

    await refused;
    expect(link.control).toBe('read-only');
  });

  it('still gives telemetry with no control point, read only (AC3)', async () => {
    const bike = fakeService([FtmsProtocol.indoorBikeData]);
    const frames: number[][] = [];
    const link = new FtmsLink(new GattWriteQueue(), (event) => {
      const value = (event.target as unknown as { value: DataView }).value;
      frames.push([...new Uint8Array(value.buffer)]);
    });
    await link.open(bike.service);

    bike.characteristic(FtmsProtocol.indoorBikeData).push(0x44, 0x02, 0x00);

    expect(frames).toEqual([[0x44, 0x02, 0x00]]);
    expect(link.control).toBe('read-only');
    await expect(link.setResistance(10)).rejects.toMatchObject({ code: 'read-only' });
  });

  it('stops listening when closed', async () => {
    const bike = fakeService(ALL);
    const frames: Event[] = [];
    const link = new FtmsLink(new GattWriteQueue(), (event) => void frames.push(event));
    await link.open(bike.service);

    link.close();
    bike.characteristic(FtmsProtocol.indoorBikeData).push(0x00, 0x00);

    expect(frames).toEqual([]);
  });
});
