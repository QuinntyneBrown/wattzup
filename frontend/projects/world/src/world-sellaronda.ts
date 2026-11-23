// Architectural & roadside concept descriptors for Sella Ronda (mirroring world-ibiza.ts).

export interface SellaConcept {
  readonly id: string;
  readonly category: 'pass' | 'architecture' | 'road' | 'alpine';
  readonly ladinTerm: string;
  readonly description: string;
}

export const SELLA_RONDA_CONCEPTS: readonly SellaConcept[] = [
  {
    id: 'tornante',
    category: 'road',
    ladinTerm: 'outa',
    description:
      'Numbered stone-retained mountain switchback with porphyry cobble inner apron and blue altitude plaque.',
  },
  {
    id: 'tabia',
    category: 'architecture',
    ladinTerm: 'tabià',
    description:
      'Sun-darkened horizontal larch hay barn raised on a dry-stone plinth with stone-weighted shingle eaves.',
  },
  {
    id: 'zwiebelturm',
    category: 'architecture',
    ladinTerm: 'ciampanil',
    description:
      'Whitewashed parish campanile crowned with an octagonal copper-patina or red onion dome.',
  },
  {
    id: 'enrosadira',
    category: 'alpine',
    ladinTerm: 'enrosadira',
    description:
      'Evening pale-coral to magenta alpenglow igniting sheer Hauptdolomit carbonate walls.',
  },
] as const;

export function conceptsByCategory(category: SellaConcept['category']): readonly SellaConcept[] {
  return SELLA_RONDA_CONCEPTS.filter((c) => c.category === category);
}
