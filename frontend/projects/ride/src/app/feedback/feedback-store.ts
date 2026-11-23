import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BUILD_INFO,
  FEEDBACK_API,
  FEEDBACK_MAX_LENGTH,
  type FeedbackContext,
  type FeedbackKind,
  PACKET_LOG,
} from '@telo/api';
import { firstValueFrom } from 'rxjs';
import { FEEDBACK_KIND_COPY } from './feedback-copy';

/** Where a draft is: being written, on its way, accepted, or refused (L2-118). */
export type FeedbackStatus = 'editing' | 'sending' | 'sent' | 'failed';

/** A bug report's share of the packet log (L2-117 AC4). */
export const FEEDBACK_PACKET_LOG_BYTES = 1024 * 1024;

/**
 * Send feedback's draft (docs/detailed-designs/feedback/send-feedback), provided by the dialog so it goes when the
 * dialog closes: the kind, Bug first; the message; Attach diagnostics, on for a bug; and where the draft is. Sending
 * carries the ride's context, and for a bug with diagnostics the last 1 MB of the packet log and the app version; a
 * refusal keeps the message (L2-118 AC4).
 */
@Injectable()
export class FeedbackStore {
  private readonly api = inject(FEEDBACK_API);
  private readonly packetLog = inject(PACKET_LOG);
  private readonly build = inject(BUILD_INFO);

  readonly kind = signal<FeedbackKind>('bug');
  readonly message = signal('');
  readonly attachDiagnostics = signal(true);
  readonly status = signal<FeedbackStatus>('editing');
  readonly copy = computed(() => FEEDBACK_KIND_COPY[this.kind()]);
  readonly length = computed(() => this.message().length);
  readonly tooLong = computed(() => this.length() > FEEDBACK_MAX_LENGTH);
  readonly canSend = computed(
    () => this.message().trim() !== '' && !this.tooLong() && this.status() !== 'sending',
  );

  async send(context: FeedbackContext): Promise<void> {
    if (!this.canSend()) return;
    const kind = this.kind();
    const diagnostics =
      kind === 'bug' && this.attachDiagnostics()
        ? {
            appVersion: `${this.build.version} · client ${this.build.commit}`,
            packetLog: this.packetLog.tail(FEEDBACK_PACKET_LOG_BYTES),
          }
        : null;
    this.status.set('sending');
    try {
      await firstValueFrom(
        this.api.send({ kind, message: this.message(), context: context.facts, diagnostics }),
        { defaultValue: undefined },
      );
      this.status.set('sent');
    } catch {
      this.status.set('failed');
    }
  }

  /** Back to an empty form of the same kind (L2-118 AC2). */
  sendAnother(): void {
    this.message.set('');
    this.status.set('editing');
  }
}
