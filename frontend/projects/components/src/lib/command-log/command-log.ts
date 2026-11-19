import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One line of the log: when, what, from where, and how the bike answered. */
export interface CommandLogEntry {
  key: string;
  time: string;
  label: string;
  source: string;
  status: string;
  text: string;
}

/** "Sent to bike": the last commands and their acknowledgement (L2-048). */
@Component({
  selector: 'wz-command-log',
  templateUrl: './command-log.html',
  styleUrl: './command-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandLog {
  readonly title = input.required<string>();
  readonly entries = input<readonly CommandLogEntry[]>([]);
  readonly connectionId = input<string | null>(null);
}
