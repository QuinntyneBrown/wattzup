import type {
  DeviceCheckProgress,
  DeviceCheckResult,
  GraphicsApi,
  RideSettings,
  WorldTier,
} from '@telo/api';

const NAMES: Record<WorldTier, string> = {
  ultra: 'Ultra',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The levels the device check tries, from the top the graphics API allows downward (L2-162 AC2): Ultra needs WebGPU, so
 * with WebGL 2, or with WebGL 2 chosen in Settings (L2-161 AC1), it starts at High. None without 3D.
 */
export function deviceCheckLevels(
  api: GraphicsApi,
  graphics: RideSettings['graphics'],
): readonly WorldTier[] {
  if (api === 'none') return [];
  const levels: readonly WorldTier[] = ['ultra', 'high', 'medium', 'low'];
  return api === 'webgpu' && graphics === 'auto' ? levels : levels.slice(1);
}

/** "Ultra held 41 fps. High held 50 fps." for the levels tried, leaving out `except`. */
function held(tried: DeviceCheckResult['tried'], except?: WorldTier): string[] {
  return tried.filter((t) => t.level !== except).map((t) => `${NAMES[t.level]} held ${t.fps} fps.`);
}

/** The running check's words: "Trying High · 6 s left" and "Ultra held 41 fps. Keep this tab open; …" (AC2). */
export function deviceCheckRunning(progress: DeviceCheckProgress): {
  readonly label: string;
  readonly foot: string;
} {
  return {
    label: `Trying ${NAMES[progress.level]} · ${progress.secondsLeft} s left`,
    foot: [...held(progress.tried), 'Keep this tab open; the check rides off screen.'].join(' '),
  };
}

/** "7:31 PM", in this device's time. */
function clock(at: Date): string {
  const hours = at.getHours();
  const minutes = String(at.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

/**
 * The finished check's words (AC3): "High holds 60 fps on this device." and "Auto now starts at High here. Ultra held
 * 41 fps. Checked today at 7:31 PM." When no level held the display's rate, Low holds what it measured.
 */
export function deviceCheckResult(
  result: DeviceCheckResult,
  now: Date,
): { readonly level: string; readonly fps: string; readonly detail: string } {
  const own = result.tried.find((t) => t.level === result.level);
  const at = new Date(result.checkedAt);
  const today = at.toDateString() === now.toDateString();
  const day = today ? 'today' : `on ${MONTHS[at.getMonth()]} ${at.getDate()}`;
  return {
    level: NAMES[result.level],
    fps: `${own?.fps ?? result.displayFps} fps`,
    detail: [
      `Auto now starts at ${NAMES[result.level]} here.`,
      ...held(result.tried, result.level),
      `Checked ${day} at ${clock(at)}.`,
    ].join(' '),
  };
}
