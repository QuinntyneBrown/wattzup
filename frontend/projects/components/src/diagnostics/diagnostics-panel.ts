import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { DiagnosticsFact } from '@telo/api';

/**
 * The Diagnostics panel (docs/mocks/dialogs/diagnostics/, block `diagnostics`): its title, "Close diagnostics", each fact
 * as a term and a value rendered as text, and the privacy note (L2-113 AC2 to AC5). The dialog that hosts it labels
 * itself by the title's id, `diagnostics-title`.
 */
@Component({
  selector: 'wz-diagnostics-panel',
  templateUrl: './diagnostics-panel.html',
  styleUrl: './diagnostics-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsPanel {
  readonly facts = input.required<readonly DiagnosticsFact[]>();
  /** "Close diagnostics" was pressed. */
  readonly dismissed = output<void>();
}
