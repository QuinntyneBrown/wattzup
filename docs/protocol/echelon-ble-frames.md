# Echelon BLE frame structure

This page describes the bytes Wattzup and the Echelon bike exchange over Bluetooth, down to the bit.

It draws on three sources:

- the prototype (`../wattzup-prototype/echelon_server.py`);
- the requirements (`docs/specs/L2.md`, L2-002 to L2-008);
- the prototype's packet capture (`../wattzup-prototype/raw_packets.log`, 5,686 notifications).

Each field has a **Status**:

- **Decoded:** Wattzup reads the field. A requirement fixes it.
- **Observed:** the capture supports this reading, but Wattzup does not use the field and no
  requirement covers it.
- **Unknown:** the capture shows the value but not what it means.

Do not build on an Observed or Unknown field without first adding a requirement for it.

## Conventions

| Item | Rule |
|---|---|
| Bit numbering | Bit 0 is the most significant bit of byte 0. Byte *n* covers bits 8*n* to 8*n*+7. |
| Byte order | Multi-byte integers are big-endian (most significant byte first). |
| Integers | Unsigned. |
| Notation | Bytes are hexadecimal: `F0` means `0xF0`. |

## GATT transport

| Role | UUID | Use |
|---|---|---|
| Service | `0bf669f1-45f2-11e7-9598-0800200c9a66` | Echelon service |
| Write characteristic | `0bf669f2-45f2-11e7-9598-0800200c9a66` | Commands, always written with response |
| Notify characteristic | `0bf669f4-45f2-11e7-9598-0800200c9a66` | Frames from the bike |

Each write or notification carries exactly one frame.

## Common frame layout

Every frame, in either direction, has this layout. *N* is the payload length in bytes, taken from
byte 2.

| Bits | Bytes | Size (bits) | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | always `F0` | Decoded |
| 8–15 | 1 | 8 | Frame type | see [Frame types](#frame-types) | Decoded |
| 16–23 | 2 | 8 | Payload length *N* | 0–255 bytes | Observed |
| 24 to 24+8*N*−1 | 3 to 2+*N* | 8*N* | Payload | depends on the frame type | depends on the field |
| last 8 bits | 3+*N* | 8 | Checksum | see [Checksum](#checksum) | Observed |

The header is bits 0–23: 3 bytes, or 24 bits. A whole frame is 32 + 8*N* bits (4 + *N* bytes).
In every captured frame, byte 2 equals the frame's total length minus 4.

The decoder does not read byte 2. It identifies a frame by its marker, its type and its total
length (L2-005).

### Checksum

```
checksum = (byte[0] + byte[1] + … + byte[3+N−1]) mod 256
```

This is the low 8 bits of the sum of every byte before the checksum. Wattzup computes it for each
command it sends. It does not check the checksum on incoming frames, and neither did the
prototype. All 5,686 captured frames carry a correct checksum.

## Frame types

| Type | Direction | Name | Total length (bytes) | *N* | Handled by Wattzup |
|---|---|---|---|---|---|
| `A0` | to bike | Keepalive | 5 | 1 | Sent once per second (L2-003) |
| `A1` | to bike | Device info request | 4 | 0 | Sent at init (L2-002) |
| `A3` | to bike | Resistance range request | 4 | 0 | Sent at init (L2-002) |
| `B0` | to bike | Start data stream | 5 | 1 | Sent at init (L2-002) |
| `B1` | to bike | Set resistance | 5 | 1 | Sent on request (L2-008) |
| `D0` | from bike | Unknown | 5 | 1 | Ignored (L2-005) |
| `D1` | from bike | Workout data | 13 | 9 | Decoded (L2-007) |
| `D2` | from bike | Resistance | 5 | 1 | Decoded (L2-006) |

The capture contains no reply to the device info or resistance range requests, so their response
frames are undocumented. Decoding rejects these frames (L2-005):

- any frame shorter than 4 bytes;
- any frame whose byte 0 is not `F0`;
- any frame of a type not listed above as decoded;
- any `D1` frame shorter than 13 bytes.

## Commands (Wattzup to bike)

### `A1` Device info request: 32 bits

| Bits | Byte | Size | Field | Value |
|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` |
| 8–15 | 1 | 8 | Type | `A1` |
| 16–23 | 2 | 8 | Length | `00` |
| 24–31 | 3 | 8 | Checksum | `91` |

Bytes: `F0 A1 00 91`

### `A3` Resistance range request: 32 bits

| Bits | Byte | Size | Field | Value |
|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` |
| 8–15 | 1 | 8 | Type | `A3` |
| 16–23 | 2 | 8 | Length | `00` |
| 24–31 | 3 | 8 | Checksum | `93` |

Bytes: `F0 A3 00 93`

### `B0` Start data stream: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `B0` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Payload | `01` | Unknown (always sent as `01`) |
| 32–39 | 4 | 8 | Checksum | `A2` | |

Bytes: `F0 B0 01 01 A2`

The three init commands are written in the order `A1`, `A3`, `B0`, at least 300 ms apart, after
the notify subscription is in place (L2-002).

### `A0` Keepalive: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `A0` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Payload | `01` | Unknown (always sent as `01`) |
| 32–39 | 4 | 8 | Checksum | `92` | |

Bytes: `F0 A0 01 01 92`. Sent once per second while connected (L2-003).

### `B1` Set resistance: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | |
| 8–15 | 1 | 8 | Type | `B1` | |
| 16–23 | 2 | 8 | Length | `01` | |
| 24–31 | 3 | 8 | Target resistance | uint8 level | Decoded (L2-008) |
| 32–39 | 4 | 8 | Checksum | `(F0 + B1 + 01 + level) mod 256` = `(0xA2 + level) mod 256` | |

Examples (L2-008):

| Target resistance | Bytes |
|---|---|
| 12 | `F0 B1 01 0C AE` |
| 32 | `F0 B1 01 20 C2` |

## Notifications (bike to Wattzup)

### `D2` Resistance: 40 bits

| Bits | Byte | Size | Field | Encoding | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | Decoded |
| 8–15 | 1 | 8 | Type | `D2` | Decoded |
| 16–23 | 2 | 8 | Length | `01` | Observed |
| 24–31 | 3 | 8 | Resistance | uint8 level; the capture contains values from 1 to 24 | Decoded (L2-006) |
| 32–39 | 4 | 8 | Checksum | | Observed |

Example: `F0 D2 01 0C CF` means resistance 12.

### `D1` Workout data: 104 bits

The bike sends one `D1` frame about every second (median interval 0.99 s in the capture).

| Bits | Bytes | Size | Field | Encoding | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | Decoded |
| 8–15 | 1 | 8 | Type | `D1` | Decoded |
| 16–23 | 2 | 8 | Length | `09` | Observed |
| 24–39 | 3–4 | 16 | Elapsed time | uint16 BE, seconds | Observed |
| 40–71 | 5–8 | 32 | Revolution count | uint32 BE, cumulative pedal revolutions | Observed |
| 72–87 | 9–10 | 16 | Cadence | uint16 BE, rpm | Decoded (L2-007) |
| 88–95 | 11 | 8 | Unknown | always `00` in the capture | Unknown |
| 96–103 | 12 | 8 | Checksum | | Observed |

Notes on the Observed fields:

- **Elapsed time:** goes up by 1 in each successive frame. It reaches 4,944 in the capture, so it
  needs more than 8 bits. It resets to 0 three times, apparently once per bike session.
- **Revolution count:** over the capture, its increments add up to 2,293. Integrating cadence over
  the same frames gives about 2,301 revolutions, so the field is probably cumulative revolutions.
  Bytes 5–6 are always `00` in the capture, so the field may be 16 bits wide (bytes 7–8) rather
  than 32.

Wattzup derives speed from cadence because the bike has no wheel sensor (L2-007):

- `speed_kmh = round(cadence × 0.37497622, 1)`
- `speed_mph = round(cadence × 0.37497622 ÷ 1.609344, 1)`, using the unrounded km/h value

Both use banker's rounding.

Example (L2-007): `F0 D1 09 00 05 00 00 00 00 00 50 00 1F`

| Field | Bytes | Value |
|---|---|---|
| Elapsed time | `00 05` | 5 s |
| Revolution count | `00 00 00 00` | 0 |
| Cadence | `00 50` | 80 rpm, so 30.0 km/h and 18.6 mph |
| Byte 11 | `00` | |
| Checksum | `1F` | |

### `D0` Unknown: 40 bits

| Bits | Byte | Size | Field | Value | Status |
|---|---|---|---|---|---|
| 0–7 | 0 | 8 | Marker | `F0` | Decoded |
| 8–15 | 1 | 8 | Type | `D0` | Decoded |
| 16–23 | 2 | 8 | Length | `01` | Observed |
| 24–31 | 3 | 8 | Payload | `01` (all 4 captured frames) | Unknown |
| 32–39 | 4 | 8 | Checksum | `C2` | Observed |

Bytes: `F0 D0 01 01 C2`. Wattzup ignores this frame, and it raises no error (L2-005).
