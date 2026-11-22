import type { RideSettings, WorldQuality } from '@telo/api';

/**
 * How a world is drawn from the rider's World settings: Auto opens at Low and always steps down; a fixed level opens
 * there and steps down only while the switch is on (L2-159 AC4, AC5, L2-160 AC1, AC2). 30 fps caps the frames, the
 * resolution scales the drawing buffer, and WebGL 2 is drawn with even where WebGPU is offered (L2-160 AC4, AC5,
 * L2-161 AC1). The device check's level joins Auto in slice 20.3.
 */
export function worldQuality(settings: RideSettings): WorldQuality {
  const auto = settings.quality === 'auto';
  return {
    tier: auto ? null : settings.quality,
    stepDown: auto || settings.stepDown,
    frameCapFps: settings.frameRate === '30' ? 30 : null,
    renderScale: settings.resolution / 100,
    forceWebGL: settings.graphics === 'webgl2',
  };
}
