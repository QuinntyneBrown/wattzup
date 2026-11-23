import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIAGNOSTICS, PACKET_LOG } from '@telo/api';
import { DiagnosticsPanel } from '@telo/components';
import { BrowserDiagnostics, packetLogFileName, packetLogSummary } from '@telo/domain';

/**
 * The Diagnostics dialog (L2-113, docs/mocks/dialogs/diagnostics/), a CDK Dialog over a scrim: the panel with the facts
 * this dialog's own `BrowserDiagnostics` reads, released when it closes. "Close diagnostics" and Escape close it, and
 * the focus goes back to what opened it (AC1).
 */
@Component({
  selector: 'wz-diagnostics-dialog',
  templateUrl: './diagnostics-dialog.html',
  styleUrl: './diagnostics-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DiagnosticsPanel],
  providers: [{ provide: DIAGNOSTICS, useClass: BrowserDiagnostics }],
})
export default class DiagnosticsDialog {
  protected readonly diagnostics = inject(DIAGNOSTICS);
  protected readonly packetLog = inject(PACKET_LOG);
  protected readonly packets = computed(() =>
    packetLogSummary(
      this.packetLog.count(),
      this.packetLog.bytes(),
      this.packetLog.holdsIncoming(),
      this.packetLog.everyPacket(),
    ),
  );
  protected readonly fileName = packetLogFileName(new Date());
  private readonly dialogRef = inject(DialogRef);

  protected close(): void {
    this.dialogRef.close();
  }
}
