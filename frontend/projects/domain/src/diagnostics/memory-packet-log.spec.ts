// Unit test
// Traces to: L2-114 AC1, AC2, AC3, AC4; L2-115 AC2; L2-117 AC4
// Description: the packet log keeps commands only until "Log every packet" is on, then every packet both ways, each
// as a JSON line; it never holds more than 10 MB, dropping the oldest first; the download is the log as JSON Lines
// under the day's name, its object URL let go; only while recording does a packet reach the console; and a bug
// report takes the newest lines that fit its share.
import { TestBed } from '@angular/core/testing';
import { APP_LOGGER, type AppLogger } from '@telo/api';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { MemoryPacketLog, PACKET_LOG_LIMIT_BYTES } from './memory-packet-log';

const KEEPALIVE = new Uint8Array([0xf0, 0xa0, 0x01, 0x01, 0x92]);
const WORKOUT = new Uint8Array([0xf0, 0xd1, 0x09, 0x00]);

describe('MemoryPacketLog', () => {
  let packets: string[];
  let log: MemoryPacketLog;

  beforeEach(() => {
    vi.useFakeTimers({ now: Date.UTC(2026, 10, 22, 12) });
    packets = [];
    const logger: AppLogger = {
      error: () => undefined,
      packet: (direction, frame, hex) => packets.push(`${direction} ${frame} ${hex}`),
    };
    TestBed.configureTestingModule({
      providers: [MemoryPacketLog, { provide: APP_LOGGER, useValue: logger }],
    });
    log = TestBed.inject(MemoryPacketLog);
  });

  afterEach(() => vi.useRealTimers());

  it('keeps commands, not the bike’s messages, while "Log every packet" is off', () => {
    log.record('out', EchelonProtocol.write, KEEPALIVE);
    log.record('in', EchelonProtocol.notify, WORKOUT);

    expect(log.everyPacket()).toBe(false);
    expect(log.count()).toBe(1);
    expect(log.holdsIncoming()).toBe(false);
    const line =
      '{"time":"2026-11-22T12:00:00.000Z","direction":"out","frame":"A0","hex":"F0 A0 01 01 92"}';
    expect(log.bytes()).toBe(line.length + 1);
    expect(packets).toEqual([]);
  });

  it('keeps every packet both ways while it is on, and writes each to the console', () => {
    log.setEveryPacket(true);
    log.record('out', EchelonProtocol.write, KEEPALIVE);
    log.record('in', EchelonProtocol.notify, WORKOUT);

    expect(log.count()).toBe(2);
    expect(log.holdsIncoming()).toBe(true);
    expect(packets).toEqual(['out A0 F0 A0 01 01 92', 'in D1 F0 D1 09 00']);
  });

  it('drops the oldest entries past 10 MB', () => {
    log.setEveryPacket(true);
    log.record('in', EchelonProtocol.notify, WORKOUT);
    const big = new Uint8Array(1000);
    while (log.bytes() < PACKET_LOG_LIMIT_BYTES - 4000)
      log.record('out', EchelonProtocol.write, big);
    const kept = log.count();
    for (let i = 0; i < 10; i++) log.record('out', EchelonProtocol.write, big);

    expect(log.bytes()).toBeLessThanOrEqual(PACKET_LOG_LIMIT_BYTES);
    expect(log.count()).toBeLessThan(kept + 10);
    expect(log.holdsIncoming()).toBe(false);
  });

  it('saves the log as JSON Lines under the day’s name, and lets the URL go', async () => {
    log.record('out', EchelonProtocol.write, KEEPALIVE);
    log.record('out', EchelonProtocol.write, new Uint8Array([0xf0, 0xb1, 0x01, 0x08, 0xaa]));
    let blob: Blob | null = null;
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((made) => {
      blob = made as Blob;
      return 'blob:packets';
    });
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('telo-ride-packets-2026-11-22.jsonl');
      expect(this.href).toBe('blob:packets');
    });

    log.download();

    expect(click).toHaveBeenCalledOnce();
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:packets');
    const lines = (await blob!.text()).split('\n');
    expect(lines.slice(0, 2).map((line) => JSON.parse(line))).toEqual([
      { time: '2026-11-22T12:00:00.000Z', direction: 'out', frame: 'A0', hex: 'F0 A0 01 01 92' },
      { time: '2026-11-22T12:00:00.000Z', direction: 'out', frame: 'B1', hex: 'F0 B1 01 08 AA' },
    ]);
    expect(lines[2]).toBe('');
    create.mockRestore();
    revoke.mockRestore();
    click.mockRestore();
  });

  it('gives a bug report the newest whole lines that fit its share, oldest first', () => {
    for (let level = 1; level <= 3; level++)
      log.record('out', EchelonProtocol.write, new Uint8Array([0xf0, 0xb1, 0x01, level]));
    const lines = log.tail(Number.MAX_SAFE_INTEGER).trim().split('\n');
    const [, newest] = lines.slice(1);
    const two = lines.slice(1).join('\n').length + 1;

    expect(lines.map((line) => (JSON.parse(line) as { hex: string }).hex)).toEqual([
      'F0 B1 01 01',
      'F0 B1 01 02',
      'F0 B1 01 03',
    ]);
    expect(log.tail(two)).toBe(`${lines[1]}\n${newest}\n`);
    expect(log.tail(two - 1)).toBe(`${newest}\n`);
    expect(log.tail(0)).toBe('');
  });
});
