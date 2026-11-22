import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SessionRiderDto } from '@telo/api';

/**
 * "Riding in this session" on Class Start with the group chosen (block class-session, L2-085 AC2): each rider's name
 * beside a dot in their jersey, and the note on riding together. When the session is full it reads "Next session" with
 * the one after it ("7:54 PM · 2 of 10 riders so far", L2-086 AC2).
 */
@Component({
  selector: 'wz-class-session',
  templateUrl: './class-session.html',
  styleUrl: './class-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSession {
  readonly riders = input<readonly SessionRiderDto[]>([]);
  /** The session offered after a full one; when set, it shows instead of the riders. */
  readonly next = input<string | null>(null);
}
