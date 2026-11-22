// The world library (ADR 0030): Three.js and every World Ride scene, loaded only when a race or World loading opens. The ride app
// defers `WorldScene` and binds `WORLD_RENDERER` to `loadWorldRenderer`, which imports Three.js on demand.
export { WorldScene } from './world-scene';
export { loadWorldRenderer } from './world-renderer-loader';
export { worldForMap } from './map-world';
export { timedSegments } from './timed-segments';
export { startTier } from './render-quality';
export { musicPlays, worldTrack } from './world-music';
export { WorldMusicPlayer } from './world-music-player';
export { ambienceOf } from './world-ambience';
