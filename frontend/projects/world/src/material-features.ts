// Which of a material's features are compiled into its program (#680). three's node builder
// emits code only for the features a material has, so a technique that is off costs no shader
// code: clear-coat compiles in only while `clearcoat > 0`, the wet road's sky reflection only
// while it has an `envMap`. Which texture a map holds, and values such as roughness or colour,
// are uniforms. A material needs a new program only when this key changes.

/** The parts of a material that decide its program. */
export interface MaterialFeatures {
  readonly map?: unknown;
  readonly normalMap?: unknown;
  readonly envMap?: unknown;
  readonly clearcoat?: number;
}

/** `map+normal-map+env-map+clearcoat`, of the features the material has. */
export function compiledFeatures(m: MaterialFeatures): string {
  const features: [string, unknown][] = [
    ['map', m.map],
    ['normal-map', m.normalMap],
    ['env-map', m.envMap],
    ['clearcoat', (m.clearcoat ?? 0) > 0],
  ];
  return features
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join('+');
}
