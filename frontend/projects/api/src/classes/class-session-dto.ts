/** A rider seated in a group session: the name others see and the design-system jersey (`lena` is `--jersey-lena`). */
export interface SessionRiderDto {
  readonly displayName: string;
  readonly jersey: string;
}

/** One group session of a class (`GET /api/classes/{id}/sessions`, L2-083, L2-085): its start as server time (ISO). */
export interface ClassSessionDto {
  readonly id: string;
  readonly startsAt: string;
  readonly seatsTaken: number;
  readonly capacity: number;
  readonly full: boolean;
  readonly riders: readonly SessionRiderDto[];
}

/** A class's next group session (`GET /api/classes/sessions`), for the Class Library's chip (L2-083 AC2). */
export interface NextGroupSessionDto {
  readonly classId: string;
  readonly sessionId: string;
  readonly startsAt: string;
  readonly seatsTaken: number;
  readonly capacity: number;
}
