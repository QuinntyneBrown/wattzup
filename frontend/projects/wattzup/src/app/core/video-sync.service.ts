// Keeps the ride-along video on the ride's target position (L2-076 criteria 3 to 7 and 10, ADR
// 0012). Provided by RidePage; RideVideo mounts the player into it. The live state is the only
// clock: the video follows the ride, except that the rider's own pause or play in the player
// pauses or resumes the ride.
import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import type { RideVideo, WorkoutStatus } from '@wattzup/api';
import { LiveStateService } from './live-state.service';
import { RideActions } from './ride-actions';
import { ToastService } from './toast.service';
import { isBlocked, riderAction, syncAction, targetPosition } from './video-sync';
import { type PlayerHandle, type PlayerState, YOUTUBE_PLAYER } from './youtube-player';

@Injectable()
export class VideoSync {
  private readonly live = inject(LiveStateService);
  private readonly players = inject(YOUTUBE_PLAYER);
  private readonly actions = inject(RideActions);
  private readonly toasts = inject(ToastService);
  private readonly document = inject(DOCUMENT);
  private readonly handle = signal<PlayerHandle | null>(null);
  private readonly visible = signal(this.document.visibilityState !== 'hidden');
  private readonly _failed = signal(false);

  /** The browser refused to play twice in a row: the rider has to press play (criterion 6). */
  readonly blocked = computed(() => isBlocked(this.handle()?.refused() ?? 0));
  /** The ride-along video is playing: ride sound keeps quiet (L2-129 AC8). */
  readonly playing = computed(() => this.handle()?.state() === 'playing');
  /** The player raised an error; the ride carries on without it (criterion 7). */
  readonly failed = this._failed.asReadonly();

  /** Set when the page is shown again: the next action seeks to the target first. */
  private resync = false;
  /** The state the sync last asked the player for; a report of it is the sync's, not the rider's. */
  private expected: PlayerState | null = null;
  private lastPlayer: PlayerState | null = null;
  /** The rider's pause or resume is on its way: the sync waits for the status to change. */
  private riderPending: { from: WorkoutStatus } | null = null;
  private mounted = 0;

  constructor() {
    const onVisibility = () => {
      const shown = this.document.visibilityState !== 'hidden';
      if (shown && !this.visible()) this.resync = true;
      this.visible.set(shown);
    };
    this.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisibility);
      this.unmount();
    });
    effect(() => this.apply());
    effect(() => {
      if (this.handle()?.error() == null || untracked(this._failed)) return;
      untracked(() => this.fail());
    });
  }

  /** Builds the player for `video` in `host`, replacing any earlier one. */
  async mount(host: HTMLElement, video: RideVideo): Promise<void> {
    this.unmount();
    const ticket = ++this.mounted;
    const workout = untracked(() => this.live.state()?.workout);
    const start = workout ? targetPosition(video, workout) : video.start_seconds;
    try {
      const handle = await this.players.create(host, video.video_id, start);
      if (ticket !== this.mounted) return handle.destroy();
      this.handle.set(handle);
    } catch {
      if (ticket === this.mounted) this.fail();
    }
  }

  unmount(): void {
    this.mounted++;
    this.handle()?.destroy();
    this.handle.set(null);
    this.expected = this.lastPlayer = null;
  }

  /** `Play video in sync`: a press is the gesture the browser waits for (criterion 6). */
  playNow(): void {
    const handle = this.handle();
    const workout = this.live.state()?.workout;
    const video = workout?.plan.video;
    if (!handle || !workout || !video) return;
    handle.seek(targetPosition(video, workout));
    this.expected = 'playing';
    handle.play();
  }

  private fail(): void {
    this._failed.set(true);
    this.toasts.show({
      tone: 'danger',
      title: "Couldn't play the video",
      text: 'The ride carries on without it.',
    });
    this.unmount();
  }

  private apply(): void {
    const handle = this.handle();
    const workout = this.live.state()?.workout;
    const video = workout?.plan.video;
    if (!handle || !workout || !video || this._failed()) return;
    const player = handle.state();
    const visible = this.visible();
    // Each refusal is read, not only the blocked flag, so the sync tries again after the first.
    const blocked = isBlocked(handle.refused());
    untracked(() => {
      if (this.riderPending) {
        // Until the status changes, or the rider changes the player again (say, after a failure).
        if (workout.status === this.riderPending.from && player === this.lastPlayer) return;
        this.riderPending = null;
      }
      if (player !== this.lastPlayer) {
        this.lastPlayer = player;
        const cause = player === this.expected ? 'sync' : 'rider';
        if (player === this.expected) this.expected = null;
        const rider = visible ? riderAction(workout.status, player, cause) : 'none';
        if (rider !== 'none') {
          this.riderPending = { from: workout.status };
          void (rider === 'pause-ride' ? this.actions.pause() : this.actions.resume());
          return;
        }
      }
      const target = targetPosition(video, workout);
      const action = syncAction({
        status: workout.status,
        player,
        position: handle.currentTime(),
        target,
        visible,
        resync: this.resync,
      });
      if (visible) this.resync = false;
      if (action === 'play-at') {
        handle.seek(target);
        if (blocked) return;
        this.expected = 'playing';
        handle.play();
      } else if (action === 'pause-at') {
        this.expected = 'paused';
        handle.pause();
        handle.seek(target);
      } else if (action === 'seek') {
        handle.seek(target);
      }
    });
  }
}
