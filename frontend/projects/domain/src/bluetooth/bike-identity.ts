/** The name and identifier Connect Bike shows for a device (docs/detailed-designs/bike/connect-a-bike). */
export interface BikeIdentity {
  readonly name: string;
  readonly identifier: string | null;
}

/** Echelon's model codes, as its bikes advertise them (`ECH-<model>-<serial>`). */
const ECHELON_MODELS: Readonly<Record<string, string>> = {
  EX5S: 'Echelon EX-5s',
  EX3: 'Echelon EX-3',
  EX8S: 'Echelon EX-8s',
  SPORT: 'Echelon Connect Sport',
};

/**
 * `ECH-EX5S-141844` is "Echelon EX-5s", identified as `EX5S-141844`; another Echelon code reads "Echelon <code>";
 * any other device is its advertised name, or its browser id when it has none (L2-013 AC4).
 */
export function bikeIdentity(name: string | undefined, id: string): BikeIdentity {
  const echelon = /^ECH-([A-Z0-9]+)-(.+)$/i.exec(name ?? '');
  if (echelon) {
    const model = echelon[1].toUpperCase();
    return {
      name: ECHELON_MODELS[model] ?? `Echelon ${model}`,
      identifier: `${model}-${echelon[2]}`,
    };
  }
  return { name: name?.trim() || id, identifier: null };
}
