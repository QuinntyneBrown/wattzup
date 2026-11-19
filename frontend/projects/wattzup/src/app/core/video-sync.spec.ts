import type { WorkoutStatus } from '@wattzup/api';
import { type SyncInput, isBlocked, riderAction, syncAction, targetPosition } from './video-sync';
import type { PlayerState } from './youtube-player';

const at = (change: Partial<SyncInput>): SyncInput => ({
  status: 'running',
  player: 'playing',
  position: 439,
  target: 439,
  visible: true,
  resync: false,
  ...change,
});

describe('targetPosition (L2-076 AC3)', () => {
  it('is the start point plus the elapsed time, to 0.1 s', () => {
    expect(
      targetPosition({ video_id: 'QUoToFsMNig', start_seconds: 12 }, { elapsed_seconds: 427 }),
    ).toBe(439);
    expect(targetPosition({ video_id: 'x', start_seconds: 0.3 }, { elapsed_seconds: 1 })).toBe(1.3);
  });
});

describe('syncAction while running (L2-076 AC3)', () => {
  it.each<[PlayerState, number, string]>([
    ['playing', 439, 'none'],
    ['playing', 440.4, 'none'],
    ['playing', 437.6, 'none'],
    ['playing', 440.6, 'seek'],
    ['playing', 437.4, 'seek'],
    ['buffering', 439, 'none'],
    ['buffering', 445, 'seek'],
    ['paused', 439, 'play-at'],
    ['unstarted', 0, 'play-at'],
    ['ended', 0, 'none'],
  ])('a %s player at %d gives %s', (player, position, action) => {
    expect(syncAction(at({ player, position }))).toBe(action);
  });
});

describe('syncAction for every other status (L2-076 AC4)', () => {
  const others: WorkoutStatus[] = [
    'waiting for bike',
    'paused',
    'paused: bike disconnected',
    'ended',
    'ended: bike shut off',
    'stopped',
  ];

  it.each(others)('%s pauses a playing player at the target', (status) => {
    expect(syncAction(at({ status, player: 'playing' }))).toBe('pause-at');
    expect(syncAction(at({ status, player: 'buffering' }))).toBe('pause-at');
  });

  it.each(others)('%s moves a paused player to the target only after drift', (status) => {
    expect(syncAction(at({ status, player: 'paused', position: 440.4 }))).toBe('none');
    expect(syncAction(at({ status, player: 'paused', position: 440.6 }))).toBe('seek');
    expect(syncAction(at({ status, player: 'unstarted', position: 0 }))).toBe('seek');
    expect(syncAction(at({ status, player: 'ended', position: 0 }))).toBe('none');
  });
});

describe('syncAction and the page being shown (L2-076 AC10)', () => {
  it('leaves the player alone while the page is hidden', () => {
    expect(syncAction(at({ visible: false, player: 'paused' }))).toBe('none');
    expect(syncAction(at({ visible: false, position: 500 }))).toBe('none');
  });

  it('seeks to the target first when the page is shown again', () => {
    expect(syncAction(at({ resync: true }))).toBe('seek');
    expect(syncAction(at({ resync: true, player: 'paused' }))).toBe('play-at');
    expect(syncAction(at({ resync: true, status: 'paused', player: 'paused' }))).toBe('seek');
  });
});

describe('riderAction (L2-076 AC5)', () => {
  it.each<[WorkoutStatus, PlayerState, string]>([
    ['running', 'paused', 'pause-ride'],
    ['running', 'playing', 'none'],
    ['running', 'buffering', 'none'],
    ['running', 'ended', 'none'],
    ['paused', 'playing', 'resume-ride'],
    ['paused', 'paused', 'none'],
    ['paused: bike disconnected', 'playing', 'none'],
    ['waiting for bike', 'playing', 'none'],
    ['ended', 'playing', 'none'],
    ['stopped', 'paused', 'none'],
  ])('the rider under %s leaving the player %s gives %s', (status, player, action) => {
    expect(riderAction(status, player, 'rider')).toBe(action);
  });

  it('never counts a change the sync made', () => {
    expect(riderAction('running', 'paused', 'sync')).toBe('none');
    expect(riderAction('paused', 'playing', 'sync')).toBe('none');
  });
});

describe('isBlocked (L2-076 AC6)', () => {
  it.each([
    [0, false],
    [1, false],
    [2, true],
    [3, true],
  ])('%d refusals in a row: %s', (n, blocked) => {
    expect(isBlocked(n)).toBe(blocked);
  });
});
