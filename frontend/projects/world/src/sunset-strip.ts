import { cos, modelScale, positionLocal, sin, uniform, uv, vec3, vertexColor } from 'three/tsl';
import { AdditiveBlending, DoubleSide, MeshBasicNodeMaterial } from 'three/webgpu';

export function sunsetStrip() {
  const time = uniform(0),
    beat = uniform(0),
    hull = uniform(0),
    breeze = uniform(0),
    sweep = uniform(0);
  const phase = uv().y,
    weight = uv().x;
  const dancers = new MeshBasicNodeMaterial({ side: DoubleSide });
  const pulse = cos(phase)
    .mul(beat)
    .add(sin(phase).mul(cos(time.mul(3.35))));
  const shoulder = weight.sub(0.87).max(0);
  dancers.positionNode = positionLocal.add(
    vec3(
      pulse.mul(shoulder.mul(0.19).add(weight.mul(0.028))),
      pulse.abs().mul(weight.mul(0.042)),
      sin(time.mul(3.35).add(phase)).mul(shoulder.mul(0.13)),
    ).div(vec3(modelScale)),
  );
  dancers.colorNode = vertexColor().rgb;
  const lights = new MeshBasicNodeMaterial({ side: DoubleSide, toneMapped: false });
  const drift = breeze
    .mul(cos(phase))
    .add(cos(time.mul(0.78)).mul(sin(phase)))
    .mul(weight);
  lights.positionNode = positionLocal.add(
    vec3(drift.mul(0.21), drift.abs().mul(0.035), drift.mul(0.085)).div(vec3(modelScale)),
  );
  lights.colorNode = vertexColor().rgb;
  const beams = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const tilt = sweep.mul(cos(phase)).add(cos(time.mul(0.64)).mul(sin(phase)));
  beams.positionNode = positionLocal.add(
    vec3(tilt.mul(weight).mul(33), 0, sin(phase).mul(tilt).mul(weight).mul(18)).div(
      vec3(modelScale),
    ),
  );
  beams.colorNode = vertexColor().rgb;
  beams.opacityNode = weight.mul(-0.13).add(0.21);
  const fleet = new MeshBasicNodeMaterial({ side: DoubleSide });
  fleet.positionNode = positionLocal.add(
    vec3(
      hull.mul(phase).mul(0.6),
      hull.mul(weight).add(sin(time.mul(0.9)).mul(0.12)),
      hull.mul(phase),
    ).div(vec3(modelScale)),
  );
  fleet.colorNode = vertexColor().rgb;
  const foam = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const surf = sin(time.mul(0.84).add(weight.mul(0.82)));
  foam.positionNode = positionLocal.add(
    vec3(surf.mul(0.49), surf.mul(0.05), surf.mul(0.37)).div(vec3(modelScale)),
  );
  foam.colorNode = vertexColor().rgb;
  foam.opacityNode = surf.mul(0.22).add(0.35).mul(phase.mul(Math.PI).sin().mul(0.4).add(0.6));
  const cloth = new MeshBasicNodeMaterial({ side: DoubleSide });
  cloth.colorNode = vertexColor().rgb.mul(sin(weight.mul(275)).mul(0.035).add(0.96));
  return {
    materials: {
      StripDancers: dancers,
      StripFestoons: lights,
      StripBeams: beams,
      StripFleet: fleet,
      CoveFoam: foam,
      StripCloth: cloth,
    },
    update(seconds: number) {
      time.value = seconds;
      beat.value = Math.sin(seconds * 3.35);
      hull.value = 0.057 * Math.sin(seconds * 0.62);
      breeze.value = Math.sin(seconds * 0.78);
      sweep.value = Math.sin(seconds * 0.64);
    },
    report() {
      return {
        armTilt: beat.value,
        hullRoll: hull.value,
        cableSway: breeze.value,
        beamYaw: sweep.value,
      };
    },
    dispose() {
      for (const m of [dancers, lights, beams, fleet, foam, cloth]) m.dispose();
    },
  };
}
