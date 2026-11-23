import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { DiagnosticsFact } from '@telo/api';
import { Button } from '../button/button';
import { Switch } from '../switch/switch';

/** The packet log's count line, as `packetLogSummary()` gives it: "212" and " commands · 20 KB". */
export interface DiagnosticsPacketCount {
  readonly figure: string;
  readonly unit: string;
  readonly recording: boolean;
}

/**
 * The Diagnostics panel (docs/mocks/dialogs/diagnostics/, block `diagnostics`): its title, "Close diagnostics", each fact
 * as a term and a value rendered as text, and the privacy note (L2-113 AC2 to AC5); below them the packet log, with
 * "Log every packet", its count and "Download packet log" (L2-114). The dialog that hosts it labels itself by the
 * title's id, `diagnostics-title`.
 */
@Component({
  selector: 'wz-diagnostics-panel',
  templateUrl: './diagnostics-panel.html',
  styleUrl: './diagnostics-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Switch],
})
export class DiagnosticsPanel {
  readonly facts = input.required<readonly DiagnosticsFact[]>();
  readonly everyPacket = input.required<boolean>();
  readonly packets = input.required<DiagnosticsPacketCount>();
  /** "telo-ride-packets-2026-11-22.jsonl". */
  readonly fileName = input.required<string>();
  /** "Close diagnostics" was pressed. */
  readonly dismissed = output<void>();
  /** "Log every packet" was flipped; it carries the new state. */
  readonly everyPacketToggled = output<boolean>();
  /** "Download packet log" was pressed. */
  readonly downloadRequested = output<void>();
}
